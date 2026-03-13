const AUTH_SESSION_COOKIE = "sp_session";

function nowIso() {
  return new Date().toISOString();
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toBase64Url(arr);
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function parseCookie(request: Request, key: string) {
  const raw = request.headers.get("cookie") || "";
  if (!raw) return "";
  const pairs = raw.split(";").map((item) => item.trim());
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const k = pair.slice(0, idx).trim();
    if (k !== key) continue;
    return decodeURIComponent(pair.slice(idx + 1));
  }
  return "";
}

export function makeVerifyCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function addDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function cookieBase(request: Request, maxAgeSec: number) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, maxAgeSec)}${secure ? "; Secure" : ""}`;
}

export function buildSessionCookie(request: Request, token: string, maxAgeSec = 30 * 24 * 60 * 60) {
  return `${AUTH_SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieBase(request, maxAgeSec)}`;
}

export function clearSessionCookie(request: Request) {
  return `${AUTH_SESSION_COOKIE}=; ${cookieBase(request, 0)}`;
}

export function readSessionToken(request: Request) {
  return parseCookie(request, AUTH_SESSION_COOKIE);
}

export async function ensureAuthTables(db: D1Database | undefined) {
  if (!db) return;
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_identities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(provider, provider_subject)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_password_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_auth_password_credentials_user
      ON auth_password_credentials(user_id)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_email_otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        purpose TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        ip_hash TEXT,
        ua_hash TEXT,
        created_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_auth_email_otps_lookup
      ON auth_email_otps(email, purpose, created_at DESC)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_token_hash TEXT NOT NULL UNIQUE,
        refresh_token_hash TEXT,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        last_seen_at TEXT,
        ip_hash TEXT,
        ua_hash TEXT,
        created_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_created
      ON auth_sessions(user_id, created_at DESC)
    `)
  ]);
}

export async function createAuthSession(
  db: D1Database,
  userId: string,
  request: Request
) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const ts = nowIso();
  await db.prepare(`
    INSERT INTO auth_sessions (
      id, user_id, session_token_hash, refresh_token_hash, expires_at, revoked_at, last_seen_at, ip_hash, ua_hash, created_at
    )
    VALUES (?, ?, ?, NULL, ?, NULL, ?, NULL, NULL, ?)
  `).bind(makeId("sess"), userId, tokenHash, addDaysIso(30), ts, ts).run();
  return {
    token,
    cookie: buildSessionCookie(request, token)
  };
}

export async function revokeAuthSession(db: D1Database, request: Request) {
  const token = readSessionToken(request);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await db.prepare(`
    UPDATE auth_sessions
    SET revoked_at = ?, last_seen_at = ?
    WHERE session_token_hash = ? AND revoked_at IS NULL
  `).bind(nowIso(), nowIso(), tokenHash).run();
}

type AuthMeResult =
  | { ok: true; user: { id: string; email: string; tier: "free" | "member" | "pro"; credits: number; createdAt: string; updatedAt: string } }
  | { ok: false };

export async function getAuthMe(db: D1Database, request: Request): Promise<AuthMeResult> {
  const token = readSessionToken(request);
  if (!token) return { ok: false };
  const tokenHash = await sha256Hex(token);
  const row = await db.prepare(`
    SELECT
      s.user_id AS user_id,
      p.email AS email,
      p.tier AS tier,
      p.created_at AS created_at,
      p.updated_at AS updated_at,
      w.credit_balance AS credits,
      s.expires_at AS expires_at
    FROM auth_sessions s
    JOIN users_profile p ON p.id = s.user_id
    LEFT JOIN wallets w ON w.user_id = s.user_id
    WHERE s.session_token_hash = ? AND s.revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first<{
    user_id: string;
    email: string;
    tier: "free" | "member" | "pro";
    created_at: string;
    updated_at: string;
    credits: number | null;
    expires_at: string;
  }>();
  if (!row?.user_id) return { ok: false };
  if (row.expires_at <= nowIso()) return { ok: false };
  await db.prepare(`
    UPDATE auth_sessions SET last_seen_at = ? WHERE session_token_hash = ?
  `).bind(nowIso(), tokenHash).run();
  return {
    ok: true,
    user: {
      id: row.user_id,
      email: row.email || "",
      tier: row.tier || "free",
      credits: Number(row.credits || 0),
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || ""
    }
  };
}
