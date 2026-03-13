import { createAuthSession, ensureAuthTables, isValidEmail, makeId, normalizeEmail, sha256Hex } from "../../_shared/auth-email";
import { ensureBillingTables, ensureUserWallet } from "../../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { buildRequestRateLimitKey, enforceRateLimit } from "../../_shared/rate-limit";

type VerifyCodeBody = {
  email?: string;
  code?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ ok: false, error: "db_not_configured" }, 500, context.request, context.env);
    await ensureAuthTables(context.env.DB);
    await ensureBillingTables(context.env.DB);

    const body = await context.request.json() as VerifyCodeBody;
    const email = normalizeEmail(body?.email || "");
    const code = String(body?.code || "").trim();
    if (!isValidEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, context.request, context.env);
    if (!/^\d{6}$/.test(code)) return json({ ok: false, error: "code_invalid" }, 400, context.request, context.env);

    const ipRate = await enforceRateLimit(context.env.DB, {
      key: await buildRequestRateLimitKey(context.request, "auth_verify_code_ip"),
      limit: envInt(context.env, "AUTH_VERIFY_CODE_IP_LIMIT_PER_10M", 40, 1, 1000),
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
      key: await buildRequestRateLimitKey(context.request, "auth_verify_code_email", [email]),
      limit: envInt(context.env, "AUTH_VERIFY_CODE_EMAIL_LIMIT_PER_10M", 12, 1, 200),
      windowSeconds: 600
    });
    if (!emailRate.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: emailRate.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const otp = await context.env.DB.prepare(`
      SELECT id, code_hash, expires_at, consumed_at, attempts, max_attempts
      FROM auth_email_otps
      WHERE email = ? AND purpose = 'login'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email).first<{
      id: string;
      code_hash: string;
      expires_at: string;
      consumed_at: string | null;
      attempts: number;
      max_attempts: number;
    }>();
    if (!otp?.id) return json({ ok: false, error: "missing_challenge" }, 400, context.request, context.env);
    if (otp.consumed_at) return json({ ok: false, error: "missing_challenge" }, 400, context.request, context.env);
    if (otp.expires_at <= nowIso()) return json({ ok: false, error: "code_expired" }, 400, context.request, context.env);
    if (otp.attempts >= otp.max_attempts) return json({ ok: false, error: "code_locked" }, 429, context.request, context.env);

    const codeHash = await sha256Hex(code);
    if (codeHash !== otp.code_hash) {
      await context.env.DB.prepare(`
        UPDATE auth_email_otps
        SET attempts = attempts + 1
        WHERE id = ?
      `).bind(otp.id).run();
      return json({ ok: false, error: "code_invalid" }, 400, context.request, context.env);
    }

    await context.env.DB.prepare(`
      UPDATE auth_email_otps
      SET consumed_at = ?
      WHERE id = ?
    `).bind(nowIso(), otp.id).run();

    const userId = `user_${await sha256Hex(email)}`.slice(0, 40);
    await ensureUserWallet(context.env.DB, userId, email);

    const ts = nowIso();
    await context.env.DB.prepare(`
      INSERT INTO auth_identities (
        id, user_id, provider, provider_subject, email, email_verified, created_at, updated_at
      )
      VALUES (?, ?, 'email', ?, ?, 1, ?, ?)
      ON CONFLICT(provider, provider_subject) DO UPDATE SET
        email = excluded.email,
        email_verified = 1,
        updated_at = excluded.updated_at
    `).bind(makeId("ident"), userId, email, email, ts, ts).run();

    const profile = await context.env.DB.prepare(`
      SELECT id, email, tier, created_at, updated_at
      FROM users_profile
      WHERE id = ?
      LIMIT 1
    `).bind(userId).first<{
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
    `).bind(userId).first<{ credit_balance: number }>();
    if (!profile?.id) return json({ ok: false, error: "user_create_failed" }, 500, context.request, context.env);

    const createdSession = await createAuthSession(context.env.DB, userId, context.request);
    const response = json({
      ok: true,
      session: {
        token: createdSession.token,
        userId: profile.id,
        email: profile.email,
        provider: "email_code",
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
      error: "verify_code_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
