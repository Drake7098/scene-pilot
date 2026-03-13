import type { UserSession, UserState } from "../types/account";
import {
  clearChallenge,
  createOrGetUserByEmail,
  createSessionForUser,
  getChallenge,
  getSession,
  getUser,
  saveChallenge,
  saveSession
} from "./mockAccountStore";
import { isGoogleIdentityConfigured, requestGoogleCredential } from "./googleIdentityService";

export type SendCodeResult = {
  ok: boolean;
  devCode: string;
  expiresAt: string;
};

type ApiEnvelope<T> = {
  ok?: boolean;
  error?: string;
  detail?: string;
} & T;

type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
};

type GoogleVerifyResponse = {
  ok: boolean;
  profile?: GoogleProfile;
  error?: string;
  detail?: string;
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
const AUTH_MOCK_FALLBACK_ENABLED =
  !import.meta.env.PROD && String(import.meta.env.VITE_AUTH_MOCK_FALLBACK || "1").trim() !== "0";

function getSupabaseConfig(): SupabaseConfig | null {
  const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function isSupabaseAuthConfigured() {
  return Boolean(getSupabaseConfig());
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
  if (!isSupabaseAuthConfigured()) return null;
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
    writeSupabaseSession(null);
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

async function postApi<T>(url: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    let payload: ApiEnvelope<T> | null = null;
    try {
      payload = await response.json() as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
    return { response, payload };
  } catch {
    return null;
  }
}

async function getApi<T>(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include"
    });
    let payload: ApiEnvelope<T> | null = null;
    try {
      payload = await response.json() as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
    return { response, payload };
  } catch {
    return null;
  }
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
  if (isSupabaseAuthConfigured()) {
    const result = await supabaseRequest("/auth/v1/otp", {
      method: "POST",
      body: {
        email: normalized,
        create_user: true
      }
    });
    if (!result.ok) throw new Error(result.errorCode || "send_code_failed");
    return {
      ok: true,
      devCode: "",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
  }
  const api = await postApi<{ expiresAt?: string; devCode?: string }>("/api/auth/email/send-code", { email: normalized });
  if (api) {
    if (api.response.ok && api.payload?.ok) {
      return {
        ok: true,
        devCode: String(api.payload.devCode || ""),
        expiresAt: String(api.payload.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString())
      };
    }
    const code = normalizeErrorCode(api.payload?.error || api.response.statusText);
    if (code && code !== "not_found") throw new Error(code);
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) {
    throw new Error("auth_backend_unavailable");
  }

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  saveChallenge(normalized, code, expiresAt);
  await wait(220);
  return {
    ok: true,
    devCode: code,
    expiresAt
  };
}

export async function verifyCode(email: string, code: string): Promise<{ session: UserSession; user: UserState }> {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseAuthConfigured()) {
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
  const api = await postApi<{ session?: UserSession; user?: UserState }>("/api/auth/email/verify-code", {
    email: normalized,
    code: code.trim()
  });
  if (api) {
    if (api.response.ok && api.payload?.ok && api.payload?.session && api.payload?.user) {
      return { session: api.payload.session, user: api.payload.user };
    }
    const err = normalizeErrorCode(api.payload?.error || api.response.statusText);
    if (err && err !== "not_found") throw new Error(err);
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) {
    throw new Error("auth_backend_unavailable");
  }

  const challenge = getChallenge(normalized);
  if (!challenge) throw new Error("missing_challenge");
  if (challenge.expiresAt < new Date().toISOString()) throw new Error("code_expired");
  if (challenge.code !== code.trim()) throw new Error("code_invalid");
  const user = createOrGetUserByEmail(normalized);
  const session = createSessionForUser(user);
  saveSession(session);
  clearChallenge(normalized);
  await wait(180);
  return { session, user };
}

async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ credential })
  });
  const payload = await response.json() as GoogleVerifyResponse;
  if (!response.ok || !payload?.ok || !payload.profile) {
    const code = normalizeErrorCode(payload?.error || response.statusText || "google_verify_failed");
    throw new Error(code || "google_verify_failed");
  }
  return payload.profile;
}

export function isGoogleSignInEnabled() {
  return isSupabaseAuthConfigured() || isGoogleIdentityConfigured();
}

export async function signInWithGoogle(): Promise<{ session: UserSession; user: UserState }> {
  if (isSupabaseAuthConfigured()) {
    const cfg = getSupabaseConfig();
    if (!cfg || typeof window === "undefined") {
      throw new Error("google_not_configured");
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}?auth_provider=google`;
    const authUrl = `${cfg.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.assign(authUrl);
    throw new Error("auth_redirect_started");
  }
  if (!isGoogleIdentityConfigured()) {
    throw new Error("google_client_id_missing");
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) {
    throw new Error("auth_backend_unavailable");
  }
  const credential = await requestGoogleCredential();
  const profile = await verifyGoogleCredential(credential);
  const user = createOrGetUserByEmail(profile.email, {
    displayName: profile.name || null,
    avatarUrl: profile.picture || null
  });
  const session = createSessionForUser(user, {
    provider: "google",
    providerSubject: profile.sub || null
  });
  saveSession(session);
  await wait(180);
  return { session, user };
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

  if (isSupabaseAuthConfigured()) {
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

  const api = await postApi<{ session?: UserSession; user?: UserState }>("/api/auth/password/sign-in", {
    email: normalized,
    password: rawPassword
  });
  if (api) {
    if (api.response.ok && api.payload?.ok && api.payload?.session && api.payload?.user) {
      return { session: api.payload.session, user: api.payload.user };
    }
    const err = normalizeErrorCode(api.payload?.error || api.response.statusText);
    if (err && err !== "not_found") throw new Error(err);
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) {
    throw new Error("auth_backend_unavailable");
  }

  const user = createOrGetUserByEmail(normalized);
  const session = createSessionForUser(user, { provider: "password", providerSubject: null });
  saveSession(session);
  await wait(180);
  return { session, user };
}

export async function getCurrentSession(): Promise<UserSession | null> {
  if (isSupabaseAuthConfigured()) {
    const authed = await getSupabaseAuthedUser();
    if (!authed) return null;
    return mapSupabaseSessionToUserSession(authed.user, authed.session);
  }
  const api = await getApi<{ user?: UserState }>("/api/auth/me");
  if (api?.response.ok && api.payload?.ok) {
    const user = api.payload.user || null;
    if (!user) {
      if (!AUTH_MOCK_FALLBACK_ENABLED) return null;
      await wait(60);
      return getSession();
    }
    return {
      token: "cookie_session",
      userId: user.id,
      email: user.email,
      provider: "email_code",
      providerSubject: null,
      createdAt: user.createdAt || new Date().toISOString()
    };
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) return null;
  await wait(60);
  return getSession();
}

export async function getCurrentUser(): Promise<UserState | null> {
  if (isSupabaseAuthConfigured()) {
    const authed = await getSupabaseAuthedUser();
    if (!authed) return null;
    return mapSupabaseUserToUserState(authed.user);
  }
  const api = await getApi<{ user?: UserState }>("/api/auth/me");
  if (api?.response.ok && api.payload?.ok) {
    if (api.payload.user) return api.payload.user;
    if (!AUTH_MOCK_FALLBACK_ENABLED) return null;
    const session = getSession();
    if (!session) return null;
    await wait(60);
    return getUser(session.userId);
  }
  if (!AUTH_MOCK_FALLBACK_ENABLED) return null;
  const session = getSession();
  if (!session) return null;
  await wait(60);
  return getUser(session.userId);
}

export async function logout(): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const session = readSupabaseSession();
    if (session?.accessToken) {
      await supabaseRequest("/auth/v1/logout", {
        method: "POST",
        accessToken: session.accessToken
      });
    }
    writeSupabaseSession(null);
    saveSession(null);
    await wait(60);
    return;
  }
  await postApi("/api/auth/logout", {});
  saveSession(null);
  await wait(60);
}

export async function getApiAuthHeaders(claimedUserId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (claimedUserId) headers["x-sp-user-id"] = claimedUserId;

  if (isSupabaseAuthConfigured()) {
    const refreshed = await refreshSupabaseSessionIfNeeded();
    const token = refreshed?.accessToken || readSupabaseSessionSync()?.accessToken || "";
    if (token) headers.authorization = `Bearer ${token}`;
    return headers;
  }

  if (AUTH_MOCK_FALLBACK_ENABLED) {
    const legacySession = getSession();
    if (legacySession?.token && legacySession.token !== "cookie_session") {
      headers.authorization = `Bearer ${legacySession.token}`;
    }
  }
  return headers;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
