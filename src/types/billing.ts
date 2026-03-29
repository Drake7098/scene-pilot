export type WalletCurrency = "credits" | "usd";
export type HostedMediaType = "image" | "video";
export type HostedQualityTier = "standard" | "hd" | "video" | "video_hq";

export type WalletState = {
  creditsBalance: number;
  currency: WalletCurrency;
};

export type CreditLedgerEntryKind = "purchase" | "grant" | "reserve" | "finalize" | "rollback";
export type CreditLedgerEntryStatus = "pending" | "done" | "rolled_back";

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  kind: CreditLedgerEntryKind;
  credits: number;
  status: CreditLedgerEntryStatus;
  relatedAction?: string;
  createdAt: string;
};

export type CreditPackConfig = {
  id: string;
  name: string;
  usdPrice: number;
  credits: number;
  priceId?: string;
  enabled: boolean;
};

export type ProPlanConfig = {
  id: string;
  name: string;
  monthlyUsdPrice: number;
  monthlyCredits: number;
  priceId?: string;
  enabled: boolean;
};

export type HostedActionConfig = {
  id: string;
  mediaType: HostedMediaType;
  qualityTier: HostedQualityTier;
  creditsCost: number;
  enabled: boolean;
};

export type CheckoutKind = "credits" | "pro";

export type CheckoutRequest = {
  userId: string;
  kind: CheckoutKind;
  productId: string;
  userEmail?: string;
};

export type CheckoutLineItem = {
  priceId?: string;
  quantity: number;
};

export type CheckoutResult = {
  checkoutUrl?: string;
  sessionId?: string;
  provider: "paddle" | "mock";
  mock: boolean;
  kind: CheckoutKind;
  productId: string;
  items: CheckoutLineItem[];
  customer?: {
    email?: string;
  };
  customData?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
};

export type PaddleWebhookEventName =
  | "transaction.completed"
  | "subscription.created"
  | "subscription.activated"
  | "subscription.updated";

export type SubscriptionState = {
  userId: string;
  planId: string;
  status: "inactive" | "active" | "past_due";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  lastCreditGrantAt: string | null;
  provider: "mock" | "paddle" | "whop";
  customerPortalUrl?: string | null;
};
