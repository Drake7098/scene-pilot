import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";

function readMaintenanceToken(request: Request) {
  const byHeader = request.headers.get("x-maintenance-token")?.trim();
  if (byHeader) return byHeader;
  const auth = request.headers.get("authorization")?.trim() || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || "";
}

function parseRetentionDays(raw: unknown, fallback: number, min = 1, max = 3650) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

async function ensurePruneTables(db: any) {
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
    `CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      device_id TEXT,
      session_id TEXT,
      message TEXT NOT NULL,
      meta TEXT
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
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_feedback_ts ON feedback(ts DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_error_fingerprints_last_seen ON error_fingerprints(last_seen_ts DESC)").run();
}

async function countOlderThan(db: any, table: string, column: string, thresholdTs: number) {
  const { results } = await db.prepare(
    `SELECT COUNT(*) AS count
     FROM ${table}
     WHERE ${column} < ?`
  ).bind(thresholdTs).all();
  return Number(results?.[0]?.count || 0);
}

async function deleteOlderThan(db: any, table: string, column: string, thresholdTs: number) {
  const result = await db.prepare(
    `DELETE FROM ${table}
     WHERE ${column} < ?`
  ).bind(thresholdTs).run();
  return Number(result?.meta?.changes || 0);
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const expectedToken = String(context.env?.MAINTENANCE_API_TOKEN || "").trim();
    if (!expectedToken) {
      return json({ error: "maintenance_auth_not_configured" }, 503, context.request, context.env);
    }
    const providedToken = readMaintenanceToken(context.request);
    if (!providedToken || providedToken !== expectedToken) {
      return json({ error: "unauthorized" }, 401, context.request, context.env);
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const url = new URL(context.request.url);

    const eventsDays = parseRetentionDays(
      body.events_days ?? url.searchParams.get("events_days"),
      30
    );
    const feedbackDays = parseRetentionDays(
      body.feedback_days ?? url.searchParams.get("feedback_days"),
      180
    );
    const fingerprintsDays = parseRetentionDays(
      body.fingerprints_days ?? url.searchParams.get("fingerprints_days"),
      120
    );
    const dryRun = String(body.dry_run ?? url.searchParams.get("dry_run") ?? "0") === "1";

    await ensurePruneTables(context.env.DB);

    const now = Date.now();
    const eventsTs = now - eventsDays * 24 * 60 * 60 * 1000;
    const feedbackTs = now - feedbackDays * 24 * 60 * 60 * 1000;
    const fingerprintsTs = now - fingerprintsDays * 24 * 60 * 60 * 1000;

    const matchedEvents = await countOlderThan(context.env.DB, "events", "ts", eventsTs);
    const matchedFeedback = await countOlderThan(context.env.DB, "feedback", "ts", feedbackTs);
    const matchedFingerprints = await countOlderThan(
      context.env.DB,
      "error_fingerprints",
      "last_seen_ts",
      fingerprintsTs
    );

    let deletedEvents = 0;
    let deletedFeedback = 0;
    let deletedFingerprints = 0;
    if (!dryRun) {
      deletedEvents = await deleteOlderThan(context.env.DB, "events", "ts", eventsTs);
      deletedFeedback = await deleteOlderThan(context.env.DB, "feedback", "ts", feedbackTs);
      deletedFingerprints = await deleteOlderThan(
        context.env.DB,
        "error_fingerprints",
        "last_seen_ts",
        fingerprintsTs
      );
    }

    return json(
      {
        ok: true,
        dry_run: dryRun,
        retention_days: {
          events: eventsDays,
          feedback: feedbackDays,
          fingerprints: fingerprintsDays
        },
        matched: {
          events: matchedEvents,
          feedback: matchedFeedback,
          fingerprints: matchedFingerprints
        },
        deleted: {
          events: deletedEvents,
          feedback: deletedFeedback,
          fingerprints: deletedFingerprints
        }
      },
      200,
      context.request,
      context.env
    );
  } catch {
    return json({ error: "prune_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
