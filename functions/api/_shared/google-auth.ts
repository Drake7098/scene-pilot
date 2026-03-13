type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

type GoogleVerifyProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
};

export type GoogleVerifyResult =
  | { ok: true; profile: GoogleVerifyProfile }
  | { ok: false; error: string; detail?: string };

const GOOGLE_TOKEN_INFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_VALID_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

function parseClientIds(env: any) {
  const merged = [
    String(env?.GOOGLE_CLIENT_ID || "").trim(),
    ...String(env?.GOOGLE_CLIENT_IDS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ]
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set(merged);
}

export function isGoogleAuthConfigured(env: any) {
  return parseClientIds(env).size > 0;
}

function toBool(value: unknown) {
  if (typeof value === "boolean") return value;
  return String(value || "").toLowerCase() === "true";
}

function parseExp(value: unknown) {
  const sec = Number(value || 0);
  if (!Number.isFinite(sec) || sec <= 0) return 0;
  return sec;
}

export async function verifyGoogleIdToken(env: any, idToken: string): Promise<GoogleVerifyResult> {
  const audiences = parseClientIds(env);
  if (!audiences.size) return { ok: false, error: "google_not_configured" };
  if (!idToken.trim()) return { ok: false, error: "google_missing_token" };

  const endpoint = `${GOOGLE_TOKEN_INFO_ENDPOINT}?id_token=${encodeURIComponent(idToken.trim())}`;
  let payload: GoogleTokenInfo | null = null;
  try {
    const response = await fetch(endpoint, { method: "GET" });
    if (!response.ok) {
      return { ok: false, error: "google_token_invalid", detail: `http_${response.status}` };
    }
    payload = await response.json() as GoogleTokenInfo;
  } catch (error) {
    return {
      ok: false,
      error: "google_verify_network_error",
      detail: error instanceof Error ? error.message : String(error)
    };
  }

  const audience = String(payload?.aud || "").trim();
  if (!audience || !audiences.has(audience)) {
    return { ok: false, error: "google_audience_mismatch" };
  }
  const issuer = String(payload?.iss || "").trim();
  if (!GOOGLE_VALID_ISSUERS.has(issuer)) {
    return { ok: false, error: "google_issuer_invalid" };
  }
  const exp = parseExp(payload?.exp);
  const now = Math.floor(Date.now() / 1000);
  if (!exp || exp <= now) {
    return { ok: false, error: "google_token_expired" };
  }
  const email = String(payload?.email || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "google_email_missing" };
  }
  if (!toBool(payload?.email_verified)) {
    return { ok: false, error: "google_email_not_verified" };
  }
  const sub = String(payload?.sub || "").trim();
  if (!sub) {
    return { ok: false, error: "google_sub_missing" };
  }

  return {
    ok: true,
    profile: {
      sub,
      email,
      emailVerified: toBool(payload?.email_verified),
      name: String(payload?.name || "").trim(),
      picture: String(payload?.picture || "").trim()
    }
  };
}
