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

function readSupabaseSession(): SupabaseSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SUPABASE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseSessionState;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSupabaseSessionSync() {
  if (!getSupabaseConfig()) return null;
  captureSupabaseSessionFromHash();
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

function captureSupabaseSessionFromHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const accessToken = String(params.get("access_token") || "");
  const refreshToken = String(params.get("refresh_token") || "");
  const tokenType = String(params.get("token_type") || "bearer");
  const expiresIn = Number(params.get("expires_in") || "3600");
  const providerToken = String(params.get("provider_token") || "").toLowerCase();
  if (!accessToken || !refreshToken) return;

  const session: SupabaseSessionState = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Math.max(1, Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
    tokenType,
    provider: providerToken || null,
    createdAt: new Date().toISOString()
  };
  writeSupabaseSession(session);

  const url = new URL(window.location.href);
  url.hash = "";
  if (url.searchParams.get("auth_provider") === "google") {
    url.searchParams.delete("auth_provider");
  }
  window.history.replaceState({}, "", url.toString());
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
  captureSupabaseSessionFromHash();
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
  const redirectTo = `${window.location.origin}${window.location.pathname}?auth_provider=google`;
  const authUrl = `${cfg.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.assign(authUrl);
  throw new Error("auth_redirect_started");
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
