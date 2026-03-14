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

export type ProviderApiConfig = {
  enabled: boolean;
  mode: ApiProviderMode;
  apiKey: string;
  baseUrl: string;
  preferredModel: string;
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
