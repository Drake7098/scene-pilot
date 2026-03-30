/**
 * billingService.ts
 * Paddle 链路已完全关闭。结账/订阅全部走 Whop checkoutUrl。
 * openCustomerPortal 重定向到 Whop 管理页。
 */
import type {
  CheckoutRequest,
  CreditPackConfig,
  HostedActionConfig,
  HostedMediaType,
  HostedQualityTier,
  ProPlanConfig,
  SubscriptionState,
} from "../types/billing";
import { getApiAuthHeaders } from "./authService";
import { getSubscription } from "./mockAccountStore";

/** Pricing Final: $3→150, $8→420, $15→800. Checkout URL always comes from backend. */
export const PRICING_FINAL_CREDIT_PACKS: CreditPackConfig[] = [
  { id: "pack_3",  name: "150 Credits", usdPrice: 3,  credits: 150, enabled: true },
  { id: "pack_8",  name: "420 Credits", usdPrice: 8,  credits: 420, enabled: true },
  { id: "pack_15", name: "800 Credits", usdPrice: 15, credits: 800, enabled: true },
];

export const PRO_PLAN: ProPlanConfig = {
  id: "pro_monthly",
  name: "Pro",
  monthlyUsdPrice: 12,
  monthlyCredits: 700,
  enabled: true,
};

export const HOSTED_ACTIONS: HostedActionConfig[] = [
  { id: "image_standard", mediaType: "image", qualityTier: "standard",  creditsCost: 3,  enabled: true },
  { id: "image_hd",       mediaType: "image", qualityTier: "hd",         creditsCost: 5,  enabled: true },
  { id: "video_standard", mediaType: "video", qualityTier: "video",      creditsCost: 5,  enabled: true },
  { id: "video_hq",       mediaType: "video", qualityTier: "video_hq",   creditsCost: 12, enabled: true },
];

// ---------------------------------------------------------------------------
// Billing is always "enabled" from the UI perspective — Whop handles it.
// ---------------------------------------------------------------------------
export function isBillingEnabled() {
  return true;
}

export function creditCostFor(mediaType: HostedMediaType, qualityTier: HostedQualityTier, outputs = 1) {
  const action = HOSTED_ACTIONS.find(
    (item) => item.mediaType === mediaType && item.qualityTier === qualityTier && item.enabled
  );
  if (!action) return 0;
  return action.creditsCost * Math.max(1, outputs);
}

/** Generation profile (UI-facing). Four tiers: image standard/hq, video standard/hq. */
export type GenerationProfileId = "image_standard" | "image_hq" | "video_standard" | "video_hq";

export function creditCostForProfile(profile: GenerationProfileId, videoSeconds = 1): number {
  switch (profile) {
    case "image_standard": return creditCostFor("image", "standard", 1);
    case "image_hq":       return creditCostFor("image", "hd", 1);
    case "video_standard": return creditCostFor("video", "video", Math.max(1, Math.ceil(videoSeconds)));
    case "video_hq":       return creditCostFor("video", "video_hq", Math.max(1, Math.ceil(videoSeconds)));
    default:               return 0;
  }
}

/** For cost preview: human-readable label and cost (Hosted only). */
export const GENERATION_PROFILE_LABELS: Record<
  GenerationProfileId,
  { labelEn: string; labelZh: string; creditsEn: string; creditsZh: string }
> = {
  image_standard: { labelEn: "Standard Image",      labelZh: "标准图像",   creditsEn: "3 Credits",           creditsZh: "3 Credits"     },
  image_hq:       { labelEn: "High Quality Image",  labelZh: "高质量图像", creditsEn: "5 Credits",           creditsZh: "5 Credits"     },
  video_standard: { labelEn: "Standard Video",      labelZh: "标准视频",   creditsEn: "5 Credits / second",  creditsZh: "5 Credits / 秒" },
  video_hq:       { labelEn: "High Quality Video",  labelZh: "高质量视频", creditsEn: "12 Credits / second", creditsZh: "12 Credits / 秒"},
};

async function getCheckoutLink(path: string, userId?: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = userId ? `${path}${sep}userId=${encodeURIComponent(userId)}` : path;
  const headers = userId ? await getApiAuthHeaders(userId) : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("checkout_link_unavailable");
  const payload = await res.json() as { url?: string; packs?: Array<{ id?: string; url?: string }> };
  return payload;
}

// ---------------------------------------------------------------------------
// launchCheckout — resolve URL from backend and open Whop checkout.
// ---------------------------------------------------------------------------
export async function launchCheckout(input: CheckoutRequest) {
  if (input.kind === "credits") {
    const links = await getCheckoutLink("/api/billing/credit-links", input.userId);
    const pack = Array.isArray(links.packs)
      ? links.packs.find((item) => String(item.id || "") === input.productId)
      : null;
    if (!pack?.url) throw new Error("checkout_url_not_configured");
    window.open(pack.url, "_blank", "noopener,noreferrer");
    return { session: null, completedUser: null };
  }
  if (input.kind === "pro") {
    const data = await getCheckoutLink("/api/billing/pro-link", input.userId);
    if (!data.url) throw new Error("checkout_url_not_configured");
    window.open(data.url, "_blank", "noopener,noreferrer");
    return { session: null, completedUser: null };
  }
  throw new Error("checkout_url_not_configured");
}

// ---------------------------------------------------------------------------
// openCustomerPortal — directs to Whop dashboard. No Paddle portal API call.
// ---------------------------------------------------------------------------
export async function openCustomerPortal(_userId: string) {
  return { url: "https://whop.com/hub" };
}

// ---------------------------------------------------------------------------
// getBillingSnapshot — reads from /api/billing/me (Supabase/D1). No Paddle.
// ---------------------------------------------------------------------------
export async function getBillingSnapshot(userId: string) {
  const authHeaders = await getApiAuthHeaders(userId);
  try {
    const res = await fetch(`/api/billing/me?userId=${encodeURIComponent(userId)}`, {
      headers: authHeaders,
    });
    if (res.ok) {
      const payload = await res.json() as {
        tier?: string;
        credits?: number;
        subscription?: {
          status?: "inactive" | "active" | "past_due";
          planId?: string;
          periodStart?: string | null;
          periodEnd?: string | null;
        };
        packs?: Array<{
          code?: string;
          name?: string;
          price_amount?: number;
          credits_amount?: number;
        }>;
      };
      const packs = Array.isArray(payload.packs)
        ? payload.packs
            .map((item) => {
              const id = String(item.code || "").trim();
              if (!id) return null;
              return {
                id,
                name: String(item.name || id),
                usdPrice: Number(item.price_amount || 0),
                credits: Math.max(0, Math.round(Number(item.credits_amount || 0))),
                enabled: true,
              } as CreditPackConfig;
            })
            .filter((item): item is CreditPackConfig => Boolean(item))
        : [];
      const subscription: SubscriptionState | null = payload.subscription
        ? {
            userId,
            planId: payload.subscription.planId || PRO_PLAN.id,
            status: payload.subscription.status || "inactive",
            currentPeriodStart: payload.subscription.periodStart || null,
            currentPeriodEnd: payload.subscription.periodEnd || null,
            lastCreditGrantAt: null,
            provider: "whop",
          }
        : getSubscription(userId);
      return {
        packs: packs.length ? packs : PRICING_FINAL_CREDIT_PACKS.filter((item) => item.enabled),
        proPlan: PRO_PLAN.enabled ? PRO_PLAN : null,
        subscription,
        hostedActions: HOSTED_ACTIONS.filter((item) => item.enabled),
      };
    }
  } catch {
    // fallback below
  }

  return {
    packs: PRICING_FINAL_CREDIT_PACKS.filter((item) => item.enabled),
    proPlan: PRO_PLAN.enabled ? PRO_PLAN : null,
    subscription: getSubscription(userId),
    hostedActions: HOSTED_ACTIONS.filter((item) => item.enabled),
  };
}
