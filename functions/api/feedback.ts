import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";
import { buildRequestRateLimitKey, enforceRateLimit } from "./_shared/rate-limit";

const SENSITIVE_KEY_RE = /(pass(word)?|token|secret|authorization|cookie|api[-_]?key|email|phone|mobile|id[_-]?number|身份证)/i;

function trimStr(value: unknown, max = 256) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeJson(value: unknown, maxBytes = 16_000) {
  try {
    const raw = JSON.stringify(sanitizeValue(value));
    if (raw.length <= maxBytes) return raw;
    return JSON.stringify({ truncated: true, original_bytes: raw.length });
  } catch {
    return JSON.stringify({ serialize_error: true });
  }
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[DEPTH_LIMIT]";
  if (value == null) return value;
  if (typeof value === "string") return value.slice(0, 512);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 32).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
      out[key] = SENSITIVE_KEY_RE.test(key) ? "[REDACTED]" : sanitizeValue(item, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, 512);
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

    const limitState = await enforceRateLimit(context.env?.DB, {
      key: await buildRequestRateLimitKey(context.request, "feedback"),
      limit: envInt(context.env, "FEEDBACK_RATE_LIMIT_PER_10M", 20, 1, 300),
      windowSeconds: 600
    });
    if (!limitState.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: limitState.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const data = await context.request.json();

    const message = trimStr(data?.message, 4000);
    if (!message) return json({ error: "missing_message" }, 400, context.request, context.env);

    // 建一张 feedback 表（如果没有就自动创建）
    await context.env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        device_id TEXT,
        session_id TEXT,
        message TEXT NOT NULL,
        meta TEXT
      );`
    ).run();
    await context.env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_feedback_ts ON feedback(ts DESC)").run();

    await context.env.DB.prepare(
      `INSERT INTO feedback (ts, device_id, session_id, message, meta)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        Number.isFinite(Number(data?.ts)) ? Number(data.ts) : Date.now(),
        trimStr(data?.device_id, 128),
        trimStr(data?.session_id, 128),
        message,
        safeJson(data?.meta)
      )
      .run();

    return json({ ok: true }, 200, context.request, context.env);
  } catch {
    return json({ error: "feedback_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
