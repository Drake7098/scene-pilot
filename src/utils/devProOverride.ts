import type { UserState } from "../types/account";

export type ProAccessSource = "real_pro" | "dev_override" | "free";

export type EffectiveProAccess = {
  hasPro: boolean;
  source: ProAccessSource;
  isDevOverride: boolean;
};

export type DevProConfig = {
  isDev: boolean;
  overrideEnabled: boolean;
  overrideEmail: string;
};

function normalizeEnvText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(email: unknown): string {
  return normalizeEnvText(email).toLowerCase();
}

function isOverrideEnabled(raw: unknown): boolean {
  return normalizeEnvText(raw).toLowerCase() === "true";
}

function hasRealProAccess(user: UserState | null): boolean {
  if (!user) return false;
  if (user.tier === "pro") return true;
  return Boolean(user.proConsoleEnabled);
}

export function getDevProConfig(): DevProConfig {
  const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);
  if (!isDev) {
    return {
      isDev: false,
      overrideEnabled: false,
      overrideEmail: ""
    };
  }

  return {
    isDev,
    overrideEnabled: isOverrideEnabled(import.meta.env.VITE_DEV_PRO_OVERRIDE),
    overrideEmail: normalizeEmail(import.meta.env.VITE_DEV_PRO_EMAIL)
  };
}

export function isMatchedDevProUser(user: Pick<UserState, "email"> | null | undefined): boolean {
  try {
    const config = getDevProConfig();
    if (!config.isDev || !config.overrideEnabled || !config.overrideEmail) return false;
    if (!user) return false;
    const userEmail = normalizeEmail(user.email);
    if (!userEmail) return false;
    return userEmail === config.overrideEmail;
  } catch {
    return false;
  }
}

export function getEffectiveProAccess(user: UserState | null): EffectiveProAccess {
  try {
    if (hasRealProAccess(user)) {
      return {
        hasPro: true,
        source: "real_pro",
        isDevOverride: false
      };
    }

    if (isMatchedDevProUser(user)) {
      return {
        hasPro: true,
        source: "dev_override",
        isDevOverride: true
      };
    }

    return {
      hasPro: false,
      source: "free",
      isDevOverride: false
    };
  } catch {
    return {
      hasPro: false,
      source: "free",
      isDevOverride: false
    };
  }
}

let loggedDevOverrideMatch = false;

export function debugLogDevProOverride(user: UserState | null, access: EffectiveProAccess): void {
  if (typeof import.meta === "undefined" || !import.meta.env?.DEV) return;
  if (!access.isDevOverride) {
    loggedDevOverrideMatch = false;
    return;
  }
  if (loggedDevOverrideMatch) return;
  loggedDevOverrideMatch = true;
  console.debug("[dev-pro-override] active", {
    email: normalizeEmail(user?.email ?? ""),
    source: access.source
  });
}
