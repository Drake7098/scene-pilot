import type { UserSession, UserState } from "../types/account";

export type SendCodeResult = {
  ok: boolean;
  devCode: string;
  expiresAt: string;
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseSessionState = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  provider: string | null;
  createdAt: string;
};

type SupabaseUser = {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  identities?: Array<{ provider?: string; id?: string; identity_id?: string }>;
};

const SUPABASE_SESSION_KEY = "sp_supabase_session_v1";
const SUPABASE_PKCE_VERIFIER_KEY = "sp_supabase_pkce_verifier_v1";
const SUPABASE_OAUTH_ERROR_KEY = "sp_supabase_oauth_error_v1";
const SUPABASE_OAUTH_DEBUG_KEY = "sp_supabase_oauth_debug_v1";

function getSupabaseConfig(): SupabaseConfig | null {
  const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function requireSupabaseConfig() {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error("supabase_not_configured");
  return cfg;
}

function getAppBaseUrl() {
  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").trim().toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return window.location.origin.replace(/\/+$/, "");
    }
  }
  const configured = String(import.meta.env.VITE_APP_BASE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  return "";
}

function readSupabaseSession(): SupabaseSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SUPABASE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseSessionState;
    if (!parsed?.accessToken || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSupabaseSessionSync() {
  if (!getSupabaseConfig()) return null;
  captureSupabaseSessionFromUrlSync();
  return readSupabaseSession();
}

function writeSupabaseSession(session: SupabaseSessionState | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      window.localStorage.removeItem(SUPABASE_SESSION_KEY);
      return;
    }
    window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function sessionExpired(session: SupabaseSessionState, skewMs = 30_000) {
  return Date.now() + skewMs >= session.expiresAt;
}

function providerFromUser(user: SupabaseUser) {
  const fromIdentity = user.identities?.find((item) => item?.provider)?.provider || "";
  const fromAppMeta = String(user.app_metadata?.provider || "");
  const raw = (fromIdentity || fromAppMeta).toLowerCase();
  return raw === "google" ? "google" : "email_code";
}

function providerSubjectFromUser(user: SupabaseUser) {
  const identity = user.identities?.find((item) => item?.provider === "google") || user.identities?.[0];
  return String(identity?.id || identity?.identity_id || "") || null;
}

function mapTier(raw: unknown): UserState["tier"] {
  const value = String(raw || "").toLowerCase();
  if (value === "pro" || value === "member") return value;
  return "free";
}

function mapSupabaseUserToUserState(user: SupabaseUser): UserState {
  const tier = mapTier(user.app_metadata?.tier ?? user.user_metadata?.tier);
  const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() || null;
  const avatarUrl = String(user.user_metadata?.avatar_url || user.user_metadata?.picture || "").trim() || null;
  const createdAt = String(user.created_at || new Date().toISOString());
  const updatedAt = String(user.updated_at || createdAt);
  return {
    id: user.id,
    email: String(user.email || "").trim().toLowerCase(),
    displayName,
    avatarUrl,
    tier,
    creditsBalance: 0,
    proConsoleEnabled: tier === "pro",
    bringYourOwnApiEnabled: tier === "pro",
    createdAt,
    updatedAt
  };
}

function mapSupabaseSessionToUserSession(user: SupabaseUser, session: SupabaseSessionState): UserSession {
  return {
    token: session.accessToken,
    userId: user.id,
    email: String(user.email || "").trim().toLowerCase(),
    provider: providerFromUser(user),
    providerSubject: providerSubjectFromUser(user),
    createdAt: session.createdAt
  };
}

function writePkceVerifier(verifier: string) {
  if (typeof window === "undefined") return;
  try {
    if (verifier) {
      window.sessionStorage.setItem(SUPABASE_PKCE_VERIFIER_KEY, verifier);
      return;
    }
    window.sessionStorage.removeItem(SUPABASE_PKCE_VERIFIER_KEY);
  } catch {
    // ignore storage failures
  }
}

function readPkceVerifier() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.sessionStorage.getItem(SUPABASE_PKCE_VERIFIER_KEY) || "");
  } catch {
    return "";
  }
}

function writeOAuthError(errorCode: string) {
  if (typeof window === "undefined") return;
  try {
    if (errorCode) {
      window.sessionStorage.setItem(SUPABASE_OAUTH_ERROR_KEY, errorCode);
      return;
    }
    window.sessionStorage.removeItem(SUPABASE_OAUTH_ERROR_KEY);
  } catch {
    // ignore storage failures
  }
}

function writeOAuthDebug(debugInfo: string) {
  if (typeof window === "undefined") return;
  try {
    if (debugInfo) {
      window.sessionStorage.setItem(SUPABASE_OAUTH_DEBUG_KEY, debugInfo);
      return;
    }
    window.sessionStorage.removeItem(SUPABASE_OAUTH_DEBUG_KEY);
  } catch {
    // ignore storage failures
  }
}

function stripOAuthParams(url: URL) {
  const keys = [
    "auth_provider",
    "access_token",
    "refresh_token",
    "token_type",
    "expires_in",
    "expires_at",
    "provider_token",
    "provider_refresh_token",
    "code",
    "error",
    "error_code",
    "error_description"
  ];
  for (const key of keys) url.searchParams.delete(key);
}

function redirectToAuthEntryIfNeeded() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  if (path === "/app" || path === "/signin" || path === "/login" || path === "/register" || path === "/signup") return;
  window.location.replace("/signin?redirect=%2Fapp");
}

function captureSupabaseSessionFromUrlSync() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(url.search);
  const tokenParams = hash ? hashParams : searchParams;
  const fromGoogleOAuth = String(searchParams.get("auth_provider") || "").toLowerCase() === "google";
  const oauthError = normalizeErrorCode(
    searchParams.get("error") || searchParams.get("error_code") || ""
  );
  const oauthErrorDescription = String(searchParams.get("error_description") || "").trim();
  if (oauthError) {
    writeOAuthError(oauthError);
    writeOAuthDebug(
      oauthErrorDescription
        ? `oauth_error=${oauthError}; description=${oauthErrorDescription}`
        : `oauth_error=${oauthError}`
    );
    stripOAuthParams(url);
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
    redirectToAuthEntryIfNeeded();
    return;
  }

  const accessToken = String(tokenParams.get("access_token") || "");
  if (!accessToken) return;
  const refreshToken = String(tokenParams.get("refresh_token") || "");
  const tokenType = String(tokenParams.get("token_type") || "bearer");
  const expiresIn = Number(tokenParams.get("expires_in") || "3600");
  const providerToken = String(tokenParams.get("provider_token") || "").toLowerCase();

  const session: SupabaseSessionState = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Math.max(1, Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
    tokenType,
    provider: providerToken || null,
    createdAt: new Date().toISOString()
  };
  writeSupabaseSession(session);
  writePkceVerifier("");
  writeOAuthError("");
  writeOAuthDebug("");

  stripOAuthParams(url);
  url.hash = "";
  window.history.replaceState({}, "", url.toString());
  if (fromGoogleOAuth) {
    window.location.replace("/app");
  }
}

function randomVerifier(length = 96) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join("");
}

function toBase64Url(input: Uint8Array) {
  const binary = String.fromCharCode(...input);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createPkcePair() {
  const verifier = randomVerifier();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return {
    verifier,
    challenge: toBase64Url(new Uint8Array(digest))
  };
}

async function supabaseRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    accessToken?: string;
  } = {}
): Promise<{ ok: boolean; status: number; data: T | null; errorCode: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { ok: false, status: 0, data: null, errorCode: "supabase_not_configured" };
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: options.method || "GET",
      headers: {
        apikey: cfg.anonKey,
        "content-type": "application/json",
        ...(options.accessToken ? { authorization: `Bearer ${options.accessToken}` } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = await res.json().catch(() => null) as Record<string, unknown> | null;
    if (!res.ok) {
      const code = normalizeErrorCode(payload?.error || payload?.error_code || payload?.code || res.statusText || "supabase_request_failed");
      return { ok: false, status: res.status, data: null, errorCode: code };
    }
    return { ok: true, status: res.status, data: payload as T, errorCode: "" };
  } catch {
    return { ok: false, status: 0, data: null, errorCode: "supabase_network_error" };
  }
}

async function exchangeAuthCodeIfPresent() {
  if (typeof window === "undefined" || !getSupabaseConfig()) return;
  const url = new URL(window.location.href);
  const code = String(url.searchParams.get("code") || "");
  if (!code) return;

  const verifier = readPkceVerifier();
  stripOAuthParams(url);
  if (!verifier) {
    writeOAuthError("google_pkce_verifier_missing");
    writeOAuthDebug("google_callback_missing_pkce_verifier");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    redirectToAuthEntryIfNeeded();
    return;
  }

  const exchanged = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  }>("/auth/v1/token?grant_type=pkce", {
    method: "POST",
    body: {
      auth_code: code,
      code_verifier: verifier
    }
  });

  if (!exchanged.ok || !exchanged.data?.access_token) {
    writePkceVerifier("");
    writeOAuthError(exchanged.errorCode || "google_oauth_exchange_failed");
    writeOAuthDebug(`google_oauth_exchange_failed; code=${exchanged.errorCode || "unknown"}; path=${url.pathname}`);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    redirectToAuthEntryIfNeeded();
    return;
  }

  const session: SupabaseSessionState = {
    accessToken: String(exchanged.data.access_token),
    refreshToken: String(exchanged.data.refresh_token || ""),
    expiresAt: Date.now() + Math.max(1, Number(exchanged.data.expires_in || 3600)) * 1000,
    tokenType: String(exchanged.data.token_type || "bearer"),
    provider: "google",
    createdAt: new Date().toISOString()
  };
  writeSupabaseSession(session);
  writePkceVerifier("");
  writeOAuthError("");
  writeOAuthDebug("");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function refreshSupabaseSessionIfNeeded() {
  const current = readSupabaseSession();
  if (!current) return null;
  if (!sessionExpired(current)) return current;

  const refreshed = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  }>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: current.refreshToken }
  });
  if (!refreshed.ok || !refreshed.data?.access_token || !refreshed.data?.refresh_token) {
    // refresh_token 已失效，清除 session 并触发重新登录提示
    writeSupabaseSession(null);
    // 派发一个事件让 UI 层感知，而不是静默失败
    window.dispatchEvent(new CustomEvent("sp:session_expired"));
    return null;
  }
  const next: SupabaseSessionState = {
    accessToken: String(refreshed.data.access_token),
    refreshToken: String(refreshed.data.refresh_token),
    expiresAt: Date.now() + Math.max(1, Number(refreshed.data.expires_in || 3600)) * 1000,
    tokenType: String(refreshed.data.token_type || "bearer"),
    provider: current.provider,
    createdAt: current.createdAt || new Date().toISOString()
  };
  writeSupabaseSession(next);
  return next;
}

async function getSupabaseAuthedUser() {
  captureSupabaseSessionFromUrlSync();
  await exchangeAuthCodeIfPresent();
  captureSupabaseSessionFromUrlSync();
  const session = await refreshSupabaseSessionIfNeeded();
  if (!session) return null;
  const userResp = await supabaseRequest<{ id?: string }>("/auth/v1/user", {
    method: "GET",
    accessToken: session.accessToken
  });
  if (!userResp.ok || !userResp.data?.id) {
    writeSupabaseSession(null);
    return null;
  }
  const user = userResp.data as unknown as SupabaseUser;
  return { session, user };
}

function normalizeErrorCode(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "");
}

export async function sendCode(email: string): Promise<SendCodeResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("invalid_email");
  }
  requireSupabaseConfig();
  const result = await supabaseRequest("/auth/v1/otp", {
    method: "POST",
    body: {
      email: normalized,
      create_user: true
    }
  });
  if (!result.ok) throw new Error(result.errorCode || "send_code_failed");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return {
    ok: true,
    devCode: "",
    expiresAt
  };
}

export async function verifyCode(email: string, code: string): Promise<{ session: UserSession; user: UserState }> {
  const normalized = email.trim().toLowerCase();
  requireSupabaseConfig();
  const verify = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/verify", {
    method: "POST",
    body: {
      email: normalized,
      token: code.trim(),
      type: "email"
    }
  });
  if (!verify.ok || !verify.data?.access_token || !verify.data?.refresh_token || !verify.data?.user?.id) {
    throw new Error(verify.errorCode || "verify_code_failed");
  }
  const sessionState: SupabaseSessionState = {
    accessToken: String(verify.data.access_token),
    refreshToken: String(verify.data.refresh_token),
    expiresAt: Date.now() + Math.max(1, Number(verify.data.expires_in || 3600)) * 1000,
    tokenType: String(verify.data.token_type || "bearer"),
    provider: providerFromUser(verify.data.user),
    createdAt: new Date().toISOString()
  };
  writeSupabaseSession(sessionState);
  const userState = mapSupabaseUserToUserState(verify.data.user);
  const userSession = mapSupabaseSessionToUserSession(verify.data.user, sessionState);
  return { session: userSession, user: userState };
}

export function isGoogleSignInEnabled() {
  return Boolean(getSupabaseConfig());
}

export async function signInWithGoogle(): Promise<{ session: UserSession; user: UserState }> {
  const cfg = requireSupabaseConfig();
  if (typeof window === "undefined") {
    throw new Error("google_not_configured");
  }
  const { verifier, challenge } = await createPkcePair();
  writePkceVerifier(verifier);
  const appBaseUrl = getAppBaseUrl();
  const redirectTo = `${appBaseUrl || window.location.origin.replace(/\/+$/, "")}/app`;
  writeOAuthDebug(`google_oauth_start; redirect_to=${redirectTo}`);
  const authUrl = `${cfg.url}/auth/v1/authorize?provider=google&flow_type=pkce&code_challenge_method=s256&code_challenge=${encodeURIComponent(challenge)}&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.assign(authUrl);
  throw new Error("auth_redirect_started");
}

export function consumeOAuthErrorCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const code = String(window.sessionStorage.getItem(SUPABASE_OAUTH_ERROR_KEY) || "");
    if (code) window.sessionStorage.removeItem(SUPABASE_OAUTH_ERROR_KEY);
    return code;
  } catch {
    return "";
  }
}

export function consumeOAuthDebugInfo(): string {
  if (typeof window === "undefined") return "";
  try {
    const info = String(window.sessionStorage.getItem(SUPABASE_OAUTH_DEBUG_KEY) || "");
    if (info) window.sessionStorage.removeItem(SUPABASE_OAUTH_DEBUG_KEY);
    return info;
  } catch {
    return "";
  }
}

export async function signInWithPassword(email: string, password: string): Promise<{ session: UserSession; user: UserState }> {
  const normalized = email.trim().toLowerCase();
  const rawPassword = password.trim();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("invalid_email");
  }
  if (rawPassword.length < 6) {
    throw new Error("password_too_short");
  }
  requireSupabaseConfig();

  const login = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: normalized, password: rawPassword }
  });

  if (login.ok && login.data?.access_token && login.data?.refresh_token && login.data?.user?.id) {
    const sessionState: SupabaseSessionState = {
      accessToken: String(login.data.access_token),
      refreshToken: String(login.data.refresh_token),
      expiresAt: Date.now() + Math.max(1, Number(login.data.expires_in || 3600)) * 1000,
      tokenType: String(login.data.token_type || "bearer"),
      provider: providerFromUser(login.data.user),
      createdAt: new Date().toISOString()
    };
    writeSupabaseSession(sessionState);
    return {
      user: mapSupabaseUserToUserState(login.data.user),
      session: mapSupabaseSessionToUserSession(login.data.user, sessionState)
    };
  }

  const signup = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/signup", {
    method: "POST",
    body: { email: normalized, password: rawPassword }
  });

  if (signup.ok && signup.data?.access_token && signup.data?.refresh_token && signup.data?.user?.id) {
    const sessionState: SupabaseSessionState = {
      accessToken: String(signup.data.access_token),
      refreshToken: String(signup.data.refresh_token),
      expiresAt: Date.now() + Math.max(1, Number(signup.data.expires_in || 3600)) * 1000,
      tokenType: String(signup.data.token_type || "bearer"),
      provider: providerFromUser(signup.data.user),
      createdAt: new Date().toISOString()
    };
    writeSupabaseSession(sessionState);
    return {
      user: mapSupabaseUserToUserState(signup.data.user),
      session: mapSupabaseSessionToUserSession(signup.data.user, sessionState)
    };
  }

  const retry = await supabaseRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: normalized, password: rawPassword }
  });
  if (retry.ok && retry.data?.access_token && retry.data?.refresh_token && retry.data?.user?.id) {
    const sessionState: SupabaseSessionState = {
      accessToken: String(retry.data.access_token),
      refreshToken: String(retry.data.refresh_token),
      expiresAt: Date.now() + Math.max(1, Number(retry.data.expires_in || 3600)) * 1000,
      tokenType: String(retry.data.token_type || "bearer"),
      provider: providerFromUser(retry.data.user),
      createdAt: new Date().toISOString()
    };
    writeSupabaseSession(sessionState);
    return {
      user: mapSupabaseUserToUserState(retry.data.user),
      session: mapSupabaseSessionToUserSession(retry.data.user, sessionState)
    };
  }

  const code = retry.errorCode || signup.errorCode || login.errorCode || "password_auth_failed";
  throw new Error(code);
}

export async function getCurrentSession(): Promise<UserSession | null> {
  if (!getSupabaseConfig()) return null;
  const authed = await getSupabaseAuthedUser();
  if (!authed) return null;
  return mapSupabaseSessionToUserSession(authed.user, authed.session);
}

export async function getCurrentUser(): Promise<UserState | null> {
  if (!getSupabaseConfig()) return null;
  const authed = await getSupabaseAuthedUser();
  if (!authed) return null;
  return mapSupabaseUserToUserState(authed.user);
}

export async function logout(): Promise<void> {
  if (!getSupabaseConfig()) {
    writeSupabaseSession(null);
    return;
  }
  const session = readSupabaseSession();
  if (session?.accessToken) {
    await supabaseRequest("/auth/v1/logout", {
      method: "POST",
      accessToken: session.accessToken
    });
  }
  writeSupabaseSession(null);
}

export async function getApiAuthHeaders(claimedUserId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (claimedUserId) headers["x-sp-user-id"] = claimedUserId;
  if (!getSupabaseConfig()) return headers;
  const refreshed = await refreshSupabaseSessionIfNeeded();
  const token = refreshed?.accessToken || readSupabaseSessionSync()?.accessToken || "";
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}
