import type { UserTier } from "../types/account";
import type {
  CheckoutKind,
  CheckoutRequest,
  CheckoutResult,
  CreditPackConfig,
  HostedActionConfig,
  HostedMediaType,
  HostedQualityTier,
  ProPlanConfig,
  SubscriptionState
} from "../types/billing";
import { grantCredits } from "./creditService";
import { getApiAuthHeaders } from "./authService";
import { getSubscription, getUser, setSubscription, updateUser } from "./mockAccountStore";
import { BILLING_ALLOW_MOCK_FALLBACK, BILLING_ENABLED, BILLING_LIVE_BLOCKED } from "../config/billingFlags";

/** Pricing Final: $3→150, $8→420, $15→800. checkoutUrl = Whop 结账链接 */
export const PRICING_FINAL_CREDIT_PACKS: (CreditPackConfig & { checkoutUrl?: string })[] = [
  { id: "pack_3", name: "150 Credits", usdPrice: 3, credits: 150, priceId: (import.meta.env.VITE_PADDLE_PRICE_PACK_3 as string | undefined)?.trim(), enabled: true, checkoutUrl: "https://whop.com/checkout/plan_S9Y9sX4nIH7M2" },
  { id: "pack_8", name: "420 Credits", usdPrice: 8, credits: 420, priceId: (import.meta.env.VITE_PADDLE_PRICE_PACK_8 as string | undefined)?.trim(), enabled: true, checkoutUrl: "https://whop.com/checkout/plan_LsyYESGY0fqI9" },
  { id: "pack_15", name: "800 Credits", usdPrice: 15, credits: 800, priceId: (import.meta.env.VITE_PADDLE_PRICE_PACK_15 as string | undefined)?.trim(), enabled: true, checkoutUrl: "https://whop.com/checkout/plan_00vbsXkjSR9jA" },
];

/** All credit packs (final only) for checkout lookup */
const ALL_CREDIT_PACKS = PRICING_FINAL_CREDIT_PACKS;

export const PRO_PLAN: ProPlanConfig & { checkoutUrl?: string } = {
  id: "pro_monthly",
  name: "Pro",
  monthlyUsdPrice: 12,
  monthlyCredits: 700,
  priceId: (import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY as string | undefined)?.trim(),
  enabled: true,
  checkoutUrl: "https://whop.com/checkout/plan_BD8J6nLOGIk1t"
};

export const HOSTED_ACTIONS: HostedActionConfig[] = [
  { id: "image_standard", mediaType: "image", qualityTier: "standard", creditsCost: 3, enabled: true },
  { id: "image_hd", mediaType: "image", qualityTier: "hd", creditsCost: 5, enabled: true },
  { id: "video_standard", mediaType: "video", qualityTier: "video", creditsCost: 5, enabled: true },
  { id: "video_hq", mediaType: "video", qualityTier: "video_hq", creditsCost: 12, enabled: true }
];

type MockCheckoutSession = {
  id: string;
  userId: string;
  kind: CheckoutKind;
  productId: string;
  createdAt: string;
};

const mockSessions = new Map<string, MockCheckoutSession>();

function makeId(prefix: string) {
  const g = globalThis as typeof globalThis & { crypto?: Crypto };
  const randomPart = typeof g.crypto?.randomUUID === "function"
    ? g.crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${randomPart}`;
}

function nowIso() {
  return new Date().toISOString();
}

function buildMockCheckoutResult(input: CheckoutRequest): CheckoutResult {
  const sessionId = makeId("checkout");
  const pack = input.kind === "credits" ? ALL_CREDIT_PACKS.find((item) => item.id === input.productId) : null;
  const items = input.kind === "pro"
    ? [{ priceId: PRO_PLAN.priceId, quantity: 1 }]
    : [{ priceId: pack?.priceId, quantity: 1 }];
  mockSessions.set(sessionId, {
    id: sessionId,
    userId: input.userId,
    kind: input.kind,
    productId: input.productId,
    createdAt: nowIso()
  });
  return {
    checkoutUrl: `/mock/paddle/checkout/${sessionId}`,
    sessionId,
    provider: "mock",
    mock: true,
    kind: input.kind,
    productId: input.productId,
    items,
    customer: input.userEmail ? { email: input.userEmail } : undefined,
    customData: {
      userId: input.userId,
      productId: input.productId,
      kind: input.kind
    }
  };
}

type ApiPostResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  errorCode: string;
};

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<ApiPostResult<T>> {
  try {
    const userId = typeof body.userId === "string" ? body.userId : "";
    const authHeaders = await getApiAuthHeaders(userId || undefined);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(body)
    });
    const payload = await res.json().catch(() => null) as (T & { error?: string }) | null;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        errorCode: String(payload?.error || "").trim().toLowerCase() || "request_failed"
      };
    }
    return { ok: true, status: res.status, data: payload as T, errorCode: "" };
  } catch {
    return { ok: false, status: 0, data: null, errorCode: "network_error" };
  }
}

export function isBillingEnabled() {
  return BILLING_ENABLED && !BILLING_LIVE_BLOCKED;
}

export function creditCostFor(mediaType: HostedMediaType, qualityTier: HostedQualityTier, outputs = 1) {
  const action = HOSTED_ACTIONS.find((item) => item.mediaType === mediaType && item.qualityTier === qualityTier && item.enabled);
  if (!action) return 0;
  return action.creditsCost * Math.max(1, outputs);
}

/** Generation profile (UI-facing). Four tiers: image standard/hq, video standard/hq. */
export type GenerationProfileId = "image_standard" | "image_hq" | "video_standard" | "video_hq";

export function creditCostForProfile(profile: GenerationProfileId, videoSeconds = 1): number {
  switch (profile) {
    case "image_standard":
      return creditCostFor("image", "standard", 1);
    case "image_hq":
      return creditCostFor("image", "hd", 1);
    case "video_standard":
      return creditCostFor("video", "video", Math.max(1, Math.ceil(videoSeconds)));
    case "video_hq":
      return creditCostFor("video", "video_hq", Math.max(1, Math.ceil(videoSeconds)));
    default:
      return 0;
  }
}

/** For cost preview: human-readable label and cost (Hosted only). */
export const GENERATION_PROFILE_LABELS: Record<GenerationProfileId, { labelEn: string; labelZh: string; creditsEn: string; creditsZh: string }> = {
  image_standard: { labelEn: "Standard Image", labelZh: "标准图像", creditsEn: "3 Credits", creditsZh: "3 Credits" },
  image_hq: { labelEn: "High Quality Image", labelZh: "高质量图像", creditsEn: "5 Credits", creditsZh: "5 Credits" },
  video_standard: { labelEn: "Standard Video", labelZh: "标准视频", creditsEn: "5 Credits / second", creditsZh: "5 Credits / 秒" },
  video_hq: { labelEn: "High Quality Video", labelZh: "高质量视频", creditsEn: "12 Credits / second", creditsZh: "12 Credits / 秒" },
};

export async function createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
  if (!BILLING_ENABLED) {
    throw new Error("billing_disabled");
  }
  if (BILLING_LIVE_BLOCKED) {
    throw new Error("billing_live_blocked");
  }
  const apiResult = await postJson<CheckoutResult>("/api/paddle/checkout", {
    kind: input.kind,
    productId: input.productId,
    userId: input.userId,
    userEmail: input.userEmail
  });
  if (apiResult.ok && apiResult.data) return apiResult.data;
  if (["billing_disabled", "billing_live_blocked"].includes(apiResult.errorCode)) {
    throw new Error(apiResult.errorCode);
  }
  if (!BILLING_ALLOW_MOCK_FALLBACK) {
    throw new Error(apiResult.errorCode || "checkout_unavailable");
  }
  return buildMockCheckoutResult(input);
}

export async function completeMockCheckout(sessionId: string) {
  const session = mockSessions.get(sessionId);
  if (!session) throw new Error("checkout_not_found");
  if (session.kind === "credits") {
    const pack = ALL_CREDIT_PACKS.find((item) => item.id === session.productId && item.enabled);
    if (!pack) throw new Error("credit_pack_not_found");
    await grantCredits(session.userId, pack.credits, "purchase");
  } else {
    if (session.productId !== PRO_PLAN.id) throw new Error("pro_plan_not_found");
    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nextTier: UserTier = "pro";
    updateUser(session.userId, {
      tier: nextTier,
      proConsoleEnabled: true,
      bringYourOwnApiEnabled: true
    });
    setSubscription(session.userId, {
      userId: session.userId,
      planId: PRO_PLAN.id,
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      lastCreditGrantAt: periodStart,
      provider: "mock",
      customerPortalUrl: "/mock/paddle/customer-portal"
    });
    await grantCredits(session.userId, PRO_PLAN.monthlyCredits, "pro_monthly_grant");
  }
  mockSessions.delete(sessionId);
  return getUser(session.userId);
}

export async function launchCheckout(input: CheckoutRequest) {
  if (!BILLING_ENABLED) {
    throw new Error("billing_disabled");
  }
  if (BILLING_LIVE_BLOCKED) {
    throw new Error("billing_live_blocked");
  }
  if (input.kind === "credits") {
    const packId = input.productId;
    const pack = PRICING_FINAL_CREDIT_PACKS.find((p) => p.id === packId);
    if (pack?.checkoutUrl) {
      window.open(pack.checkoutUrl, "_blank");
      return { session: null, completedUser: null };
    }
  }
  if (input.kind === "pro") {
    if (PRO_PLAN.checkoutUrl) {
      window.open(PRO_PLAN.checkoutUrl, "_blank");
      return { session: null, completedUser: null };
    }
  }
  // 没有 checkoutUrl 时走 mock fallback（本地开发用）
  const session = buildMockCheckoutResult(input);
  if (session.sessionId) {
    const completedUser = await completeMockCheckout(session.sessionId);
    return { session, completedUser };
  }
  return { session, completedUser: null };
}

export async function openCustomerPortal(userId: string) {
  if (!BILLING_ENABLED) {
    throw new Error("billing_disabled");
  }
  if (BILLING_LIVE_BLOCKED) {
    throw new Error("billing_live_blocked");
  }
  const apiResult = await postJson<{ url: string }>("/api/paddle/customer-portal", { userId });
  if (apiResult.ok && apiResult.data?.url) return apiResult.data;
  if (["billing_disabled", "billing_live_blocked"].includes(apiResult.errorCode)) {
    throw new Error(apiResult.errorCode);
  }
  if (!BILLING_ALLOW_MOCK_FALLBACK) {
    throw new Error(apiResult.errorCode || "customer_portal_unavailable");
  }
  const subscription = getSubscription(userId);
  return {
    url: subscription.customerPortalUrl || `/mock/paddle/customer-portal?subscription=${subscription.planId || "none"}`
  };
}

export async function getBillingSnapshot(userId: string) {
  const authHeaders = await getApiAuthHeaders(userId);
  try {
    const res = await fetch(`/api/billing/me?userId=${encodeURIComponent(userId)}`, {
      headers: authHeaders
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
              enabled: true
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
          provider: "paddle"
        }
        : getSubscription(userId);
      return {
        packs: packs.length ? packs : PRICING_FINAL_CREDIT_PACKS.filter((item) => item.enabled),
        proPlan: PRO_PLAN.enabled ? PRO_PLAN : null,
        subscription,
        hostedActions: HOSTED_ACTIONS.filter((item) => item.enabled)
      };
    }
  } catch {
    // fallback below
  }

  return {
    packs: PRICING_FINAL_CREDIT_PACKS.filter((item) => item.enabled),
    proPlan: PRO_PLAN.enabled ? PRO_PLAN : null,
    subscription: getSubscription(userId),
    hostedActions: HOSTED_ACTIONS.filter((item) => item.enabled)
  };
}
