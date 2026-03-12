import { json } from "./http";

type AuthOptions = {
  claimedUserId?: string;
};

function parseBearer(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function parseTokens(env: any) {
  const raw = String(env?.API_AUTH_TOKENS || env?.API_AUTH_TOKEN || "").trim();
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function authConfigured(env: any) {
  const hasBearerPool = parseTokens(env).size > 0;
  const hasAccessPair = Boolean(String(env?.CF_ACCESS_CLIENT_ID || "").trim() && String(env?.CF_ACCESS_CLIENT_SECRET || "").trim());
  return hasBearerPool || hasAccessPair;
}

function validateAccessServiceToken(request: Request, env: any) {
  const expectedId = String(env?.CF_ACCESS_CLIENT_ID || "").trim();
  const expectedSecret = String(env?.CF_ACCESS_CLIENT_SECRET || "").trim();
  if (!expectedId || !expectedSecret) return false;
  const actualId = request.headers.get("cf-access-client-id") || "";
  const actualSecret = request.headers.get("cf-access-client-secret") || "";
  return actualId === expectedId && actualSecret === expectedSecret;
}

function validateBearerToken(request: Request, env: any) {
  const token = parseBearer(request);
  if (!token) return false;
  const allowed = parseTokens(env);
  return allowed.has(token);
}

export async function requireApiAuth(context: EventContext<any, any, any>, options: AuthOptions = {}) {
  const strict = String(context.env?.API_AUTH_STRICT || "0") === "1";
  const configured = authConfigured(context.env);
  if (!configured && !strict) return null;
  if (!configured && strict) {
    return json({ error: "auth_not_configured" }, 500, context.request, context.env);
  }

  const ok = validateBearerToken(context.request, context.env) || validateAccessServiceToken(context.request, context.env);
  if (!ok) {
    return json({ error: "unauthorized" }, 401, context.request, context.env);
  }

  if (options.claimedUserId) {
    const headerUserId = (context.request.headers.get("x-sp-user-id") || "").trim();
    if (headerUserId && headerUserId !== options.claimedUserId) {
      return json({ error: "user_id_mismatch" }, 403, context.request, context.env);
    }
  }

  return null;
}
