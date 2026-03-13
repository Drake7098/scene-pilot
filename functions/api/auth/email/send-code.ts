import { ensureAuthTables, isValidEmail, makeId, makeVerifyCode, normalizeEmail, sha256Hex } from "../../_shared/auth-email";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { buildRequestRateLimitKey, enforceRateLimit } from "../../_shared/rate-limit";

type SendCodeBody = {
  email?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

function shouldExposeDevCode(env: any) {
  const raw = String(env?.AUTH_DEV_CODE_EXPOSE ?? "0").trim();
  return raw === "1" || raw.toLowerCase() === "true";
}

function requestIp(request: Request) {
  const forwarded = String(request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "";
  return String(request.headers.get("cf-connecting-ip") || forwarded || "").trim();
}

function requestUa(request: Request) {
  return String(request.headers.get("user-agent") || "").trim();
}

async function sendByResend(env: any, email: string, code: string) {
  const apiKey = String(env?.RESEND_API_KEY || "").trim();
  const from = String(env?.EMAIL_FROM || "").trim();
  if (!apiKey || !from) return { sent: false as const, reason: "email_provider_not_configured" };
  const payload = {
    from,
    to: [email],
    subject: "ScenePilot 登录验证码",
    text: `你的验证码是 ${code}，10 分钟内有效。`
  };
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    return { sent: false as const, reason: `resend_${resp.status}` };
  }
  return { sent: true as const };
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) {
      return json({ ok: false, error: "db_not_configured" }, 500, context.request, context.env);
    }
    await ensureAuthTables(context.env.DB);

    const body = await context.request.json() as SendCodeBody;
    const email = normalizeEmail(body?.email || "");
    if (!isValidEmail(email)) {
      return json({ ok: false, error: "invalid_email" }, 400, context.request, context.env);
    }

    const ipRate = await enforceRateLimit(context.env.DB, {
      key: await buildRequestRateLimitKey(context.request, "auth_send_code_ip"),
      limit: envInt(context.env, "AUTH_SEND_CODE_IP_LIMIT_PER_10M", 30, 1, 1000),
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
      key: await buildRequestRateLimitKey(context.request, "auth_send_code_email", [email]),
      limit: envInt(context.env, "AUTH_SEND_CODE_EMAIL_LIMIT_PER_10M", 6, 1, 200),
      windowSeconds: 600
    });
    if (!emailRate.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: emailRate.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const latest = await context.env.DB.prepare(`
      SELECT created_at
      FROM auth_email_otps
      WHERE email = ? AND purpose = 'login'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email).first<{ created_at: string }>();
    if (latest?.created_at) {
      const dt = Date.now() - Date.parse(latest.created_at);
      if (Number.isFinite(dt) && dt < 60 * 1000) {
        return json({ ok: false, error: "too_many_requests" }, 429, context.request, context.env);
      }
    }

    const code = makeVerifyCode();
    const codeHash = await sha256Hex(code);
    const createdAt = nowIso();
    const expiresAt = addMinutesIso(10);
    const ipHash = await sha256Hex(requestIp(context.request));
    const uaHash = await sha256Hex(requestUa(context.request));
    await context.env.DB.prepare(`
      INSERT INTO auth_email_otps (
        id, email, purpose, code_hash, expires_at, consumed_at, attempts, max_attempts, ip_hash, ua_hash, created_at
      )
      VALUES (?, ?, 'login', ?, ?, NULL, 0, 5, ?, ?, ?)
    `).bind(makeId("otp"), email, codeHash, expiresAt, ipHash, uaHash, createdAt).run();

    const sendResult = await sendByResend(context.env, email, code);
    return json({
      ok: true,
      expiresAt,
      devCode: shouldExposeDevCode(context.env) ? code : "",
      delivery: sendResult.sent ? "sent" : "not_sent",
      deliveryReason: sendResult.sent ? null : sendResult.reason
    }, 200, context.request, context.env);
  } catch (error) {
    return json({
      ok: false,
      error: "send_code_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
