export const onRequestPost: PagesFunction = async (context) => {
  try {
    const data = await context.request.json();
    if (!data?.event) return new Response("missing event", { status: 400 });

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

    return new Response("ok", {
  headers: {
    "access-control-allow-origin": "*",
  },
});
  } catch {
return new Response("error", {
  status: 500,
  headers: {
    "access-control-allow-origin": "*",
  },
});
  }
};
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
};
