import type { LegalDocId } from "../content/legal";

export type LegalConsentContext =
  | "auth_signup_signin"
  | "billing_upgrade"
  | "billing_credits"
  | "account_checkout";

export type LegalConsentSource =
  | "account_center_auth"
  | "billing_overlay_upgrade"
  | "billing_overlay_credits"
  | "user_management_upgrade"
  | "user_management_credits";

export type LegalConsentPayload = {
  userId: string;
  context: LegalConsentContext;
  docs: LegalDocId[];
  documentVersions: Partial<Record<LegalDocId, string>>;
  locale: string;
  source: LegalConsentSource;
  acceptedAt: string;
};

export type LegalConsentResult = {
  ok: boolean;
  queued: boolean;
};
