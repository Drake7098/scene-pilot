export type UserTier = "free" | "member" | "pro";
export type AuthProvider = "email_code" | "password" | "google";

export type UserSession = {
  token: string;
  userId: string;
  email: string;
  provider: AuthProvider;
  providerSubject: string | null;
  createdAt: string;
};

export type UserState = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tier: UserTier;
  creditsBalance: number;
  proConsoleEnabled: boolean;
  bringYourOwnApiEnabled: boolean;
  /** Future: Studio/Pro+ unlimited template use */
  unlimitedTemplatesEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiProviderId = "fal" | "runway";
export type ApiProviderMode = "platform" | "personal";

/** Result of health check after save; do not log plain key. */
export type ProviderConnectionStatus =
  | "connected"
  | "invalid_key"
  | "quota_issue"
  | "model_access_issue"
  | "network_error";

export type ProviderApiConfig = {
  enabled: boolean;
  mode: ApiProviderMode;
  apiKey: string;
  baseUrl: string;
  preferredModel: string;
  /** Optional: organization / workspace for provider */
  organization?: string;
  workspace?: string;
  preferredRegion?: string;
  /** Set after save + health check; do not log or store plain key. */
  status?: ProviderConnectionStatus | null;
  lastCheckedAt?: string | null;
  updatedAt: string | null;
};

export type AuthChallenge = {
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
};

export type ApiCredentialState = {
  defaultProvider: ApiProviderId;
  fal: ProviderApiConfig;
  runway: ProviderApiConfig;
  updatedAt: string | null;
};

export type AccountCenterSection = "auth" | "overview" | "credits" | "pro" | "api";
