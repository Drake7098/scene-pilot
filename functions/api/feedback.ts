import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";

function trimStr(value: unknown, max = 256) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeJson(value: unknown, maxBytes = 16_000) {
  try {
    const raw = JSON.stringify(value ?? {});
    if (raw.length <= maxBytes) return raw;
    return JSON.stringify({ truncated: true, original_bytes: raw.length });
  } catch {
    return JSON.stringify({ serialize_error: true });
  }
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
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
