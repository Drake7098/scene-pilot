import { corsOptions, json, rejectDisallowedOrigin } from "./api/_shared/http";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const data = await context.request.json();

    if (!data?.event) {
      return json({ error: "missing_event" }, 400, context.request, context.env);
    }

    const mode =
      (typeof data?.mode === "string" && data.mode.trim()) ||
      (typeof data?.props?.mode === "string" && data.props.mode.trim()) ||
      "";
    const session =
      (typeof data?.session === "string" && data.session.trim()) ||
      (typeof data?.session_id === "string" && data.session_id.trim()) ||
      "";

    await context.env.DB.prepare(
      `INSERT INTO events (event, ts, mode, lang, session)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        data.event,
        Date.now(),
        mode,
        data.lang || "",
        session
      )
      .run();

    return json({ ok: true }, 200, context.request, context.env);
  } catch {
    return json({ error: "track_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
