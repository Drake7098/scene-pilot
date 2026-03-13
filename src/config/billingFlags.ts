function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseBillingMode(value: string | undefined, fallback: "sandbox" | "live") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "live" || normalized === "production") return "live";
  if (normalized === "sandbox" || normalized === "test" || normalized === "staging") return "sandbox";
  return fallback;
}

function isLocalDevHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export const BILLING_ENABLED = parseBooleanFlag(
  (import.meta.env.VITE_BILLING_ENABLED as string | undefined)?.trim(),
  true
);

export const BILLING_MODE = parseBillingMode(
  (import.meta.env.VITE_BILLING_MODE as string | undefined)?.trim(),
  parseBillingMode((import.meta.env.VITE_PADDLE_ENV as string | undefined)?.trim(), "sandbox")
);

export const BILLING_LIVE_ALLOWED = parseBooleanFlag(
  (import.meta.env.VITE_BILLING_LIVE_ALLOWED as string | undefined)?.trim(),
  false
);

export const BILLING_ALLOW_MOCK_FALLBACK = parseBooleanFlag(
  (import.meta.env.VITE_BILLING_ALLOW_MOCK_FALLBACK as string | undefined)?.trim(),
  isLocalDevHost()
);

export const BILLING_LIVE_BLOCKED = BILLING_MODE === "live" && !BILLING_LIVE_ALLOWED;
