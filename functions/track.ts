export const onRequestPost: PagesFunction = async (context) => {
  try {
    const data = await context.request.json();

    if (!data?.event) {
      return new Response("missing event", { status: 400 });
    }

    await context.env.DB.prepare(
      `INSERT INTO events (event, ts, mode, lang, session)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        data.event,
        Date.now(),
        data.mode || "",
        data.lang || "",
        data.session || ""
      )
      .run();

    return new Response("ok");
  } catch {
    return new Response("error", { status: 500 });
  }
};
