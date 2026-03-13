import { corsOptions, json, rejectDisallowedOrigin } from "./_shared/http";

const SENSITIVE_KEY_RE = /(pass(word)?|token|secret|authorization|cookie|api[-_]?key|email|phone|mobile|id[_-]?number|身份证)/i;
const MAX_OBJECT_KEYS = 40;
const MAX_ARRAY_ITEMS = 32;
const MAX_STRING_LEN = 512;

function trimStr(value: unknown, max = 256) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeTs(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return Date.now();
  const now = Date.now();
  // Guard against malformed values (e.g. seconds, negative, or far-future timestamps).
  if (n < 946684800000 || n > now + 24 * 60 * 60 * 1000) return now;
  return Math.floor(n);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[DEPTH_LIMIT]";
  if (value == null) return value;
  if (typeof value === "string") return value.slice(0, MAX_STRING_LEN);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
    for (const [k, v] of entries) {
      if (SENSITIVE_KEY_RE.test(k)) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = sanitizeValue(v, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, MAX_STRING_LEN);
}

function safeJson(value: unknown, maxBytes = 16_000, sanitize = true) {
  try {
    const raw = JSON.stringify(sanitize ? sanitizeValue(value) : (value ?? {}));
    if (raw.length <= maxBytes) return raw;
    return JSON.stringify({ truncated: true, original_bytes: raw.length });
  } catch {
    return JSON.stringify({ serialize_error: true });
  }
}

function normalizeForFingerprint(input: unknown) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "<url>")
    .replace(/\b[0-9a-f]{8,}\b/g, "<hex>")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function hashFnv1a(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fp_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function buildErrorFingerprint(event: string, props: Record<string, unknown>) {
  if (event !== "error") return "";
  const kind = normalizeForFingerprint(props.kind ?? "");
  const message = normalizeForFingerprint(props.message ?? props.reason ?? "");
  const filename = normalizeForFingerprint(props.filename ?? "");
  const line = Number.isFinite(Number(props.lineno)) ? Number(props.lineno) : 0;
  const col = Number.isFinite(Number(props.colno)) ? Number(props.colno) : 0;
  const basis = `${kind}|${message}|${filename}|${line}|${col}`;
  return hashFnv1a(basis);
}

let ensuredSchema = false;

async function ensureEventsTable(db: any) {
  if (ensuredSchema) return;
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

  // Backward compatibility for existing installations created before new columns.
  for (const stmt of [
    "ALTER TABLE events ADD COLUMN device_id TEXT",
    "ALTER TABLE events ADD COLUMN props_json TEXT"
  ]) {
    try {
      await db.prepare(stmt).run();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!/duplicate column name/i.test(msg)) throw error;
    }
  }

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
  ensuredSchema = true;
}

async function updateErrorFingerprint(db: any, input: {
  fingerprint: string;
  ts: number;
  event: string;
  mode: string;
  lang: string;
  propsJson: string;
}) {
  const { fingerprint, ts, event, mode, lang, propsJson } = input;
  if (!fingerprint) return;
  await db.prepare(
    `INSERT INTO error_fingerprints (fingerprint, first_seen_ts, last_seen_ts, count, last_event, last_mode, last_lang, sample)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(fingerprint) DO UPDATE SET
       last_seen_ts = excluded.last_seen_ts,
       count = error_fingerprints.count + 1,
       last_event = excluded.last_event,
       last_mode = excluded.last_mode,
       last_lang = excluded.last_lang,
       sample = excluded.sample`
  )
    .bind(fingerprint, ts, ts, event, mode, lang, propsJson.slice(0, 2000))
    .run();
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const data = await context.request.json();
    if (!data?.event) return json({ error: "missing_event" }, 400, context.request, context.env);

    await ensureEventsTable(context.env.DB);

    const event = trimStr(data?.event, 120);
    if (!event) return json({ error: "missing_event" }, 400, context.request, context.env);
    const mode = trimStr(data?.mode, 64) || trimStr(data?.props?.mode, 64);
    const lang = trimStr(data?.lang, 12);
    const session = trimStr(data?.session, 128) || trimStr(data?.session_id, 128);
    const deviceId = trimStr(data?.device_id, 128);
    const propsJson = safeJson(data?.props);
    const ts = normalizeTs(data?.ts);
    const fingerprint = buildErrorFingerprint(event, sanitizeValue(data?.props ?? {}) as Record<string, unknown>);

    await context.env.DB.prepare(
      `INSERT INTO events (event, ts, mode, lang, session, device_id, props_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        event,
        ts,
        mode,
        lang,
        session,
        deviceId,
        propsJson
      )
      .run();

    await updateErrorFingerprint(context.env.DB, {
      fingerprint,
      ts,
      event,
      mode,
      lang,
      propsJson
    });

    return json({ ok: true }, 200, context.request, context.env);
  } catch {
    return json({ error: "collect_error" }, 500, context.request, context.env);
  }
};
export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
