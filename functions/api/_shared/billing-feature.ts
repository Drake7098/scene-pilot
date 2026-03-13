function parseBooleanFlag(value: unknown, fallback: boolean) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseBillingMode(value: unknown, fallback: "sandbox" | "live") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["live", "production"].includes(normalized)) return "live";
  if (["sandbox", "test", "staging", "develop"].includes(normalized)) return "sandbox";
  return fallback;
}

function branchSuggestsLive(env: any) {
  const branch = String(env?.CF_PAGES_BRANCH || env?.GIT_BRANCH || env?.APP_BRANCH || "").trim().toLowerCase();
  return ["main", "master", "production", "prod"].includes(branch);
}

export function isBillingEnabled(env: any) {
  return parseBooleanFlag(env?.BILLING_ENABLED, true);
}

export function getBillingMode(env: any): "sandbox" | "live" {
  const fallback = branchSuggestsLive(env) ? "live" : "sandbox";
  return parseBillingMode(env?.BILLING_MODE ?? env?.PADDLE_ENV, fallback);
}

export function isLiveBillingAllowed(env: any) {
  return parseBooleanFlag(env?.BILLING_LIVE_ALLOWED, false);
}

export function isLiveBillingBlocked(env: any) {
  return getBillingMode(env) === "live" && !isLiveBillingAllowed(env);
}
