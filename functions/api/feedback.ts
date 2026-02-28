export const onRequestPost: PagesFunction = async (context) => {
  try {
    const data = await context.request.json();

    const message = String(data?.message || "").trim();
    if (!message) return new Response("missing message", { status: 400 });

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

    return new Response("ok");
  } catch {
    return new Response("error", { status: 500 });
  }
};