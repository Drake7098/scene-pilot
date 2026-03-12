import type { UserTier } from "../types/account";
import type {
  CheckoutKind,
  CheckoutRequest,
  CheckoutResult,
  CreditPackConfig,
  HostedActionConfig,
  HostedMediaType,
  HostedQualityTier,
  ProPlanConfig
} from "../types/billing";
import { canUsePaddleClient, openPaddleCheckout } from "./paddleClient";
import { grantCredits } from "./creditService";
import { getSubscription, getUser, setSubscription, updateUser } from "./mockAccountStore";

export const CREDIT_PACKS: CreditPackConfig[] = [
  { id: "credit_100", name: "100 credits / $3", usdPrice: 3, credits: 100, priceId: (import.meta.env.VITE_PADDLE_PRICE_CREDIT_100 as string | undefined)?.trim(), enabled: true },
  { id: "credit_500", name: "500 credits / $12", usdPrice: 12, credits: 500, priceId: (import.meta.env.VITE_PADDLE_PRICE_CREDIT_500 as string | undefined)?.trim(), enabled: true },
  { id: "credit_2000", name: "2000 credits / $40", usdPrice: 40, credits: 2000, priceId: (import.meta.env.VITE_PADDLE_PRICE_CREDIT_2000 as string | undefined)?.trim(), enabled: true }
];

export const PRO_PLAN: ProPlanConfig = {
  id: "pro_monthly",
  name: "Pro",
  monthlyUsdPrice: 12,
  monthlyCredits: 500,
  priceId: (import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY as string | undefined)?.trim(),
  enabled: true
};

export const HOSTED_ACTIONS: HostedActionConfig[] = [
  { id: "image_standard", mediaType: "image", qualityTier: "standard", creditsCost: 1, enabled: true },
  { id: "image_hd", mediaType: "image", qualityTier: "hd", creditsCost: 3, enabled: true },
  { id: "video_standard", mediaType: "video", qualityTier: "video", creditsCost: 20, enabled: true }
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
  const items = input.kind === "pro"
    ? [{ priceId: PRO_PLAN.priceId, quantity: 1 }]
    : [{ priceId: CREDIT_PACKS.find((item) => item.id === input.productId)?.priceId, quantity: 1 }];
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

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const userId = typeof body.userId === "string" ? body.userId : "";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(userId ? { "x-sp-user-id": userId } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export function creditCostFor(mediaType: HostedMediaType, qualityTier: HostedQualityTier, outputs = 1) {
  const action = HOSTED_ACTIONS.find((item) => item.mediaType === mediaType && item.qualityTier === qualityTier && item.enabled);
  if (!action) return 0;
  return action.creditsCost * Math.max(1, outputs);
}

export async function createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
  const apiResult = await postJson<CheckoutResult>("/api/paddle/checkout", {
    kind: input.kind,
    productId: input.productId,
    userId: input.userId,
    userEmail: input.userEmail
  });
  if (apiResult) return apiResult;
  return buildMockCheckoutResult(input);
}

export async function completeMockCheckout(sessionId: string) {
  const session = mockSessions.get(sessionId);
  if (!session) throw new Error("checkout_not_found");
  if (session.kind === "credits") {
    const pack = CREDIT_PACKS.find((item) => item.id === session.productId && item.enabled);
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
  const session = await createCheckoutSession(input);
  if (!session.mock && canUsePaddleClient()) {
    const opened = await openPaddleCheckout(session);
    if (opened) return { session, completedUser: null };
  }
  if (session.sessionId) {
    const completedUser = await completeMockCheckout(session.sessionId);
    return { session, completedUser };
  }
  return { session, completedUser: null };
}

export async function openCustomerPortal(userId: string) {
  const apiResult = await postJson<{ url: string }>("/api/paddle/customer-portal", { userId });
  if (apiResult?.url) return apiResult;
  const subscription = getSubscription(userId);
  return {
    url: subscription.customerPortalUrl || `/mock/paddle/customer-portal?subscription=${subscription.planId || "none"}`
  };
}

export async function getBillingSnapshot(userId: string) {
  return {
    packs: CREDIT_PACKS.filter((item) => item.enabled),
    proPlan: PRO_PLAN.enabled ? PRO_PLAN : null,
    subscription: getSubscription(userId),
    hostedActions: HOSTED_ACTIONS.filter((item) => item.enabled)
  };
}
