import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
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

    return json({ days, results }, 200, context.request, context.env);
  } catch {
    return json({ error: "stats_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("GET, OPTIONS", context.request, context.env);
