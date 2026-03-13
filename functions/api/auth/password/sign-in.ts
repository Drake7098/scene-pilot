import { createAuthSession, ensureAuthTables, isValidEmail, makeId, normalizeEmail, sha256Hex } from "../../_shared/auth-email";
import { ensureBillingTables, ensureUserWallet } from "../../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { buildRequestRateLimitKey, enforceRateLimit } from "../../_shared/rate-limit";

type PasswordSignInBody = {
  email?: string;
  password?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function randomSaltHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToHex(input: ArrayBuffer) {
  return Array.from(new Uint8Array(input))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(input: string) {
  const normalized = input.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) return null;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normalizePassword(raw: string) {
  return String(raw || "").normalize("NFKC");
}

async function hashPasswordLegacy(password: string, salt: string) {
  return sha256Hex(`${salt}:${normalizePassword(password)}`);
}

async function hashPasswordPbkdf2(password: string, saltHex: string, iterations: number) {
  const saltBytes = hexToBytes(saltHex);
  if (!saltBytes) throw new Error("invalid_password_salt");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalizePassword(password)),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations
    },
    key,
    256
  );
  const hashHex = bytesToHex(derived);
  return {
    hashHex,
    encoded: `pbkdf2$sha256$${iterations}$${saltHex}$${hashHex}`
  };
}

function parsePbkdf2Hash(value: string) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("pbkdf2$")) return null;
  const parts = raw.split("$");
  if (parts.length !== 5) return null;
  const [, algo, iterationsRaw, saltHex, hashHex] = parts;
  const iterations = Number(iterationsRaw);
  if (algo !== "sha256" || !Number.isFinite(iterations) || iterations < 10_000) return null;
  if (!hexToBytes(saltHex) || !hexToBytes(hashHex)) return null;
  return { iterations: Math.floor(iterations), saltHex, hashHex };
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

async function verifyPassword(
  password: string,
  passwordHash: string,
  passwordSalt: string,
  iterations: number
) {
  const modern = parsePbkdf2Hash(passwordHash);
  if (modern) {
    const hashed = await hashPasswordPbkdf2(password, modern.saltHex, modern.iterations);
    return {
      ok: timingSafeEqual(hashed.hashHex, modern.hashHex),
      upgradeHash: "",
      upgradeSalt: ""
    };
  }

  const legacyHash = await hashPasswordLegacy(password, passwordSalt);
  if (!timingSafeEqual(legacyHash, passwordHash)) {
    return { ok: false, upgradeHash: "", upgradeSalt: "" };
  }
  const nextSalt = randomSaltHex(16);
  const upgraded = await hashPasswordPbkdf2(password, nextSalt, iterations);
  return {
    ok: true,
    upgradeHash: upgraded.encoded,
    upgradeSalt: nextSalt
  };
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ ok: false, error: "db_not_configured" }, 500, context.request, context.env);
    await ensureAuthTables(context.env.DB);
    await ensureBillingTables(context.env.DB);

    const body = await context.request.json() as PasswordSignInBody;
    const email = normalizeEmail(body?.email || "");
    const password = String(body?.password || "").trim();
    const passwordIterations = envInt(context.env, "AUTH_PASSWORD_PBKDF2_ITERATIONS", 210000, 120000, 600000);

    if (!isValidEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, context.request, context.env);
    if (password.length < 6) return json({ ok: false, error: "password_too_short" }, 400, context.request, context.env);

    const ipRate = await enforceRateLimit(context.env.DB, {
      key: await buildRequestRateLimitKey(context.request, "auth_password_ip"),
      limit: envInt(context.env, "AUTH_PASSWORD_IP_LIMIT_PER_10M", 60, 1, 1000),
      windowSeconds: 600
    });
    if (!ipRate.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: ipRate.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const emailRate = await enforceRateLimit(context.env.DB, {
      key: await buildRequestRateLimitKey(context.request, "auth_password_email", [email]),
      limit: envInt(context.env, "AUTH_PASSWORD_EMAIL_LIMIT_PER_10M", 12, 1, 1000),
      windowSeconds: 600
    });
    if (!emailRate.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: emailRate.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    type PasswordCredentialRow = {
      id: string;
      user_id: string;
      email: string;
      password_hash: string;
      password_salt: string;
    };

    let credential = await context.env.DB.prepare(`
      SELECT id, user_id, email, password_hash, password_salt
      FROM auth_password_credentials
      WHERE email = ?
      LIMIT 1
    `).bind(email).first<PasswordCredentialRow>();

    if (!credential?.id) {
      const userId = `user_${await sha256Hex(email)}`.slice(0, 40);
      const ts = nowIso();
      await ensureUserWallet(context.env.DB, userId, email);
      await context.env.DB.prepare(`
        INSERT INTO auth_identities (
          id, user_id, provider, provider_subject, email, email_verified, created_at, updated_at
        )
        VALUES (?, ?, 'password', ?, ?, 1, ?, ?)
        ON CONFLICT(provider, provider_subject) DO UPDATE SET
          email = excluded.email,
          email_verified = 1,
          updated_at = excluded.updated_at
      `).bind(makeId("ident"), userId, email, email, ts, ts).run();

      const salt = randomSaltHex(16);
      const passwordHash = await hashPasswordPbkdf2(password, salt, passwordIterations);
      await context.env.DB.prepare(`
        INSERT INTO auth_password_credentials (
          id, user_id, email, password_hash, password_salt, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO NOTHING
      `).bind(makeId("pwd"), userId, email, passwordHash.encoded, salt, ts, ts).run();

      credential = await context.env.DB.prepare(`
        SELECT id, user_id, email, password_hash, password_salt
        FROM auth_password_credentials
        WHERE email = ?
        LIMIT 1
      `).bind(email).first<PasswordCredentialRow>();
    }

    if (!credential?.id) {
      return json({ ok: false, error: "auth_credential_missing" }, 500, context.request, context.env);
    }

    const verification = await verifyPassword(
      password,
      credential.password_hash,
      credential.password_salt,
      passwordIterations
    );
    if (!verification.ok) {
      return json({ ok: false, error: "invalid_login_credentials" }, 401, context.request, context.env);
    }

    const profile = await context.env.DB.prepare(`
      SELECT id, email, tier, created_at, updated_at
      FROM users_profile
      WHERE id = ?
      LIMIT 1
    `).bind(credential.user_id).first<{
      id: string;
      email: string;
      tier: "free" | "member" | "pro";
      created_at: string;
      updated_at: string;
    }>();
    const wallet = await context.env.DB.prepare(`
      SELECT credit_balance
      FROM wallets
      WHERE user_id = ?
      LIMIT 1
    `).bind(credential.user_id).first<{ credit_balance: number }>();
    if (!profile?.id) return json({ ok: false, error: "user_not_found" }, 404, context.request, context.env);

    const ts = nowIso();
    if (verification.upgradeHash && verification.upgradeSalt) {
      await context.env.DB.prepare(`
        UPDATE auth_password_credentials
        SET password_hash = ?, password_salt = ?, updated_at = ?
        WHERE id = ?
      `).bind(verification.upgradeHash, verification.upgradeSalt, ts, credential.id).run();
    } else {
      await context.env.DB.prepare(`
        UPDATE auth_password_credentials
        SET updated_at = ?
        WHERE id = ?
      `).bind(ts, credential.id).run();
    }

    const createdSession = await createAuthSession(context.env.DB, credential.user_id, context.request);
    const response = json({
      ok: true,
      session: {
        token: createdSession.token,
        userId: profile.id,
        email: profile.email,
        provider: "password",
        providerSubject: null,
        createdAt: ts
      },
      user: {
        id: profile.id,
        email: profile.email,
        displayName: null,
        avatarUrl: null,
        tier: profile.tier || "free",
        creditsBalance: Number(wallet?.credit_balance || 0),
        proConsoleEnabled: (profile.tier || "free") === "pro",
        bringYourOwnApiEnabled: (profile.tier || "free") === "pro",
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    }, 200, context.request, context.env);
    response.headers.append("set-cookie", createdSession.cookie);
    return response;
  } catch (error) {
    return json({
      ok: false,
      error: "password_sign_in_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
