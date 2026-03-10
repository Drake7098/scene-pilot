import type { UserState } from "../types/account";

export function canUseHostedGeneration(user: UserState | null) {
  return Boolean(user && user.tier === "pro");
}

export function canUseProConsole(user: UserState | null) {
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
