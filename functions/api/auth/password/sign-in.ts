import { createAuthSession, ensureAuthTables, isValidEmail, makeId, normalizeEmail, sha256Hex } from "../../_shared/auth-email";
import { ensureBillingTables, ensureUserWallet } from "../../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";

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

async function hashPassword(password: string, salt: string) {
  return sha256Hex(`${salt}:${password}`);
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

    if (!isValidEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, context.request, context.env);
    if (password.length < 6) return json({ ok: false, error: "password_too_short" }, 400, context.request, context.env);

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
      const passwordHash = await hashPassword(password, salt);
      await context.env.DB.prepare(`
        INSERT INTO auth_password_credentials (
          id, user_id, email, password_hash, password_salt, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO NOTHING
      `).bind(makeId("pwd"), userId, email, passwordHash, salt, ts, ts).run();

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

    const computedHash = await hashPassword(password, credential.password_salt);
    if (computedHash !== credential.password_hash) {
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
    await context.env.DB.prepare(`
      UPDATE auth_password_credentials
      SET updated_at = ?
      WHERE id = ?
    `).bind(ts, credential.id).run();

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
