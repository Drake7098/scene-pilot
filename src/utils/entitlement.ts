import type { UserState } from "../types/account";

/** Local dev only: when set, always show Pro workspace layout (e.g. when auth not loaded or free tier). */
function isProConsoleDevOverride(): boolean {
  if (typeof import.meta === "undefined" || !import.meta.env?.DEV) return false;
  const v = String(import.meta.env.VITE_PRO_CONSOLE_DEV || "").trim().toLowerCase();
  return ["1", "true", "yes"].includes(v);
}

export function canUseHostedGeneration(user: UserState | null) {
  return Boolean(user && user.tier === "pro");
}

export function canUseProConsole(user: UserState | null) {
  if (isProConsoleDevOverride()) return true;
  return Boolean(user?.proConsoleEnabled);
}

export function canUseBringYourOwnApi(user: UserState | null) {
  return Boolean(user?.bringYourOwnApiEnabled);
}

export function canPurchaseCredits(user: UserState | null) {
  return Boolean(user);
}

export function canOpenCustomerPortal(user: UserState | null) {
  return Boolean(user && user.tier !== "free");
}

/**
 * Future Studio / Pro+ unlimited templates.
 * When true: template use does not deduct credits.
 * Reserved for e.g. $68/month tier.
 */
export function canUseUnlimitedTemplates(user: UserState | null): boolean {
  return Boolean(user?.unlimitedTemplatesEnabled);
}
