import { json } from "./http";
import { verifySupabaseBearerToken } from "./supabase-admin";
import { readSessionToken, sha256Hex } from "./auth-email";

type AuthOptions = {
  claimedUserId?: string;
};

function parseBooleanFlag(value: unknown, fallback: boolean) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function isLocalRequest(request: Request) {
  try {
    const host = new URL(request.url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

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
  const hasSupabase = Boolean(String(env?.SUPABASE_URL || "").trim() && String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim());
  const hasLocalSessionAuth = Boolean(env?.DB);
  return hasBearerPool || hasAccessPair || hasSupabase || hasLocalSessionAuth;
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

async function validateLocalSessionCookie(request: Request, env: any) {
  if (!env?.DB) return "";
  const token = readSessionToken(request);
  if (!token) return "";
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(`
    SELECT user_id, expires_at
    FROM auth_sessions
    WHERE session_token_hash = ? AND revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first<{ user_id: string; expires_at: string }>();
  if (!row?.user_id) return "";
  if (String(row.expires_at || "") <= new Date().toISOString()) return "";
  return String(row.user_id);
}

export async function requireApiAuth(context: EventContext<any, any, any>, options: AuthOptions = {}) {
  const strict = parseBooleanFlag(context.env?.API_AUTH_STRICT, !isLocalRequest(context.request));
  const configured = authConfigured(context.env);
  if (!configured && !strict) return null;
  if (!configured && strict) {
    return json({ error: "auth_not_configured" }, 500, context.request, context.env);
  }

  const bearerToken = parseBearer(context.request);
  const okStatic = validateBearerToken(context.request, context.env) || validateAccessServiceToken(context.request, context.env);
  let supabaseUserId = "";
  if (!okStatic && bearerToken) {
    const verified = await verifySupabaseBearerToken(context.env, bearerToken);
    if (verified.ok && verified.userId) {
      supabaseUserId = verified.userId;
    }
  }
  const localSessionUserId = (!okStatic && !supabaseUserId)
    ? await validateLocalSessionCookie(context.request, context.env)
    : "";

  if (!okStatic && !supabaseUserId && !localSessionUserId) {
    return json({ error: "unauthorized" }, 401, context.request, context.env);
  }

  if (options.claimedUserId) {
    const headerUserId = (context.request.headers.get("x-sp-user-id") || "").trim();
    if (headerUserId && headerUserId !== options.claimedUserId) {
      return json({ error: "user_id_mismatch" }, 403, context.request, context.env);
    }
    if (supabaseUserId && supabaseUserId !== options.claimedUserId) {
      return json({ error: "user_id_mismatch" }, 403, context.request, context.env);
    }
    if (localSessionUserId && localSessionUserId !== options.claimedUserId) {
      return json({ error: "user_id_mismatch" }, 403, context.request, context.env);
    }
  }

  return null;
}
