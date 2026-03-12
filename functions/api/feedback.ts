import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const data = await context.request.json();

    const message = String(data?.message || "").trim();
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

    await context.env.DB.prepare(
      `INSERT INTO feedback (ts, device_id, session_id, message, meta)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        Date.now(),
        data?.device_id || "",
        data?.session_id || "",
        message,
        JSON.stringify(data?.meta || {})
      )
      .run();

    return json({ ok: true }, 200, context.request, context.env);
  } catch {
    return json({ error: "feedback_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
