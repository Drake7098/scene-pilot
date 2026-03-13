type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
  nowMs?: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS security_rate_limits (
    key TEXT PRIMARY KEY,
    bucket_start INTEGER NOT NULL,
    hits INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`;

const INDEX_SQL = "CREATE INDEX IF NOT EXISTS idx_security_rate_limits_updated ON security_rate_limits(updated_at DESC)";

let schemaReady = false;

function nowMs() {
  return Date.now();
}

function normalizeWindow(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 60;
  return Math.max(1, Math.floor(value));
}

function normalizeLimit(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.max(1, Math.floor(value));
}

function bucketStart(currentMs: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  return Math.floor(currentMs / windowMs) * windowMs;
}

function retryAfter(currentMs: number, currentBucketStart: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const nextBucket = currentBucketStart + windowMs;
  const diff = Math.max(0, nextBucket - currentMs);
  return Math.max(1, Math.ceil(diff / 1000));
}

async function ensureSchema(db: D1Database | undefined) {
  if (!db || schemaReady) return;
  await db.batch([db.prepare(TABLE_SQL), db.prepare(INDEX_SQL)]);
  schemaReady = true;
}

function normalizedIp(request: Request) {
  const forwarded = String(request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "";
  return String(request.headers.get("cf-connecting-ip") || forwarded || "").trim();
}

function normalizedUa(request: Request) {
  return String(request.headers.get("user-agent") || "").trim();
}

async function sha256Hex(text: string) {
  const payload = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

async function cleanupOldRows(db: D1Database, currentMs: number) {
  if (Math.random() >= 0.02) return;
  const keepAfter = currentMs - 48 * 60 * 60 * 1000;
  await db.prepare("DELETE FROM security_rate_limits WHERE updated_at < ?").bind(keepAfter).run();
}

export async function buildRequestRateLimitKey(request: Request, scope: string, extraParts: Array<string | number> = []) {
  const ip = normalizedIp(request) || "unknown_ip";
  const ua = normalizedUa(request) || "unknown_ua";
  const payload = [scope.trim() || "scope", ip, ua, ...extraParts.map((item) => String(item || "").trim())].join("|");
  const hash = await sha256Hex(payload);
  return `rl_${scope}:${hash}`;
}

export async function enforceRateLimit(db: D1Database | undefined, options: RateLimitOptions): Promise<RateLimitResult> {
  const limit = normalizeLimit(options.limit);
  const windowSeconds = normalizeWindow(options.windowSeconds);
  const key = String(options.key || "").trim();
  if (!db || !key) {
    return { ok: true, limit, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  await ensureSchema(db);
  const currentMs = Number.isFinite(options.nowMs) ? Number(options.nowMs) : nowMs();
  const currentBucketStart = bucketStart(currentMs, windowSeconds);
  await cleanupOldRows(db, currentMs);

  const row = await db.prepare(`
    SELECT bucket_start, hits
    FROM security_rate_limits
    WHERE key = ?
    LIMIT 1
  `).bind(key).first<{ bucket_start: number; hits: number }>();

  if (row && Number(row.bucket_start) === currentBucketStart) {
    const currentHits = Math.max(0, Math.floor(Number(row.hits || 0)));
    if (currentHits >= limit) {
      return {
        ok: false,
        limit,
        remaining: 0,
        retryAfterSeconds: retryAfter(currentMs, currentBucketStart, windowSeconds)
      };
    }
    const nextHits = currentHits + 1;
    await db.prepare(`
      UPDATE security_rate_limits
      SET hits = ?, updated_at = ?
      WHERE key = ?
    `).bind(nextHits, currentMs, key).run();
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - nextHits),
      retryAfterSeconds: 0
    };
  }

  await db.prepare(`
    INSERT INTO security_rate_limits (key, bucket_start, hits, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      bucket_start = excluded.bucket_start,
      hits = 1,
      updated_at = excluded.updated_at
  `).bind(key, currentBucketStart, currentMs).run();

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - 1),
    retryAfterSeconds: 0
  };
}

