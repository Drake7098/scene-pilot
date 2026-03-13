import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";

function readStatsToken(request: Request) {
  const byHeader = request.headers.get("x-stats-token")?.trim();
  if (byHeader) return byHeader;
  const auth = request.headers.get("authorization")?.trim() || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || "";
}

function parseDays(url: URL) {
  const raw = Number(url.searchParams.get("days") || 7);
  if (!Number.isFinite(raw)) return 7;
  return Math.min(30, Math.max(1, Math.floor(raw)));
}

async function ensureStatsTables(db: any) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      ts INTEGER NOT NULL,
      mode TEXT,
      lang TEXT,
      session TEXT,
      device_id TEXT,
      props_json TEXT
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS error_fingerprints (
      fingerprint TEXT PRIMARY KEY,
      first_seen_ts INTEGER NOT NULL,
      last_seen_ts INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      last_event TEXT,
      last_mode TEXT,
      last_lang TEXT,
      sample TEXT
    )`
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event, ts DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_error_fingerprints_last_seen ON error_fingerprints(last_seen_ts DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_error_fingerprints_count ON error_fingerprints(count DESC)").run();
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const expectedToken = String(context.env?.STATS_API_TOKEN || "").trim();
    if (!expectedToken) {
      return json({ error: "stats_auth_not_configured" }, 503, context.request, context.env);
    }
    const providedToken = readStatsToken(context.request);
    if (!providedToken || providedToken !== expectedToken) {
      return json({ error: "unauthorized" }, 401, context.request, context.env);
    }

    const url = new URL(context.request.url);
    const days = parseDays(url);
    const minTs = Date.now() - days * 24 * 60 * 60 * 1000;
    const topLimit = Math.min(50, Math.max(1, Math.floor(Number(url.searchParams.get("top") || 10))));

    await ensureStatsTables(context.env.DB);

    const daily = await context.env.DB.prepare(
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

    const topEvents = await context.env.DB.prepare(
      `
      SELECT event, COUNT(*) AS count
      FROM events
      WHERE ts >= ?
      GROUP BY event
      ORDER BY count DESC, event ASC
      LIMIT ?;
      `
    ).bind(minTs, topLimit).all();

    const topErrors = await context.env.DB.prepare(
      `
      SELECT
        fingerprint,
        count,
        first_seen_ts,
        last_seen_ts,
        last_event,
        last_mode,
        last_lang,
        sample
      FROM error_fingerprints
      WHERE last_seen_ts >= ?
      ORDER BY count DESC, last_seen_ts DESC
      LIMIT ?;
      `
    ).bind(minTs, topLimit).all();

    return json(
      {
        days,
        results: daily.results,
        top_events: topEvents.results,
        top_errors: topErrors.results
      },
      200,
      context.request,
      context.env
    );
  } catch {
    return json({ error: "stats_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("GET, OPTIONS", context.request, context.env);
