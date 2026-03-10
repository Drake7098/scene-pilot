export type UserTier = "free" | "member" | "pro";

export type UserSession = {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
};

export type UserState = {
  id: string;
  email: string;
  tier: UserTier;
  creditsBalance: number;
  proConsoleEnabled: boolean;
  bringYourOwnApiEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthChallenge = {
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
};

export type ApiCredentialState = {
  openaiApiKey: string;
  enabled: boolean;
  updatedAt: string | null;
};

export type AccountCenterSection = "auth" | "overview" | "credits" | "pro" | "api";
