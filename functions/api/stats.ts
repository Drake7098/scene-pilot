export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const days = Math.min(30, Math.max(1, Number(url.searchParams.get("days") || 7)));

    const { results } = await context.env.DB.prepare(
      `
      SELECT
        date(datetime(ts/1000, 'unixepoch')) AS day,
        COUNT(*) AS events,
        COUNT(DISTINCT session) AS sessions
      FROM events
      WHERE ts >= (strftime('%s','now','-${days} day') * 1000)
      GROUP BY day
      ORDER BY day DESC;
      `
    ).all();

    return new Response(JSON.stringify({ days, results }), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "stats_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};