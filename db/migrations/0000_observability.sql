PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  ts INTEGER NOT NULL,
  mode TEXT,
  lang TEXT,
  session TEXT,
  device_id TEXT,
  props_json TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  device_id TEXT,
  session_id TEXT,
  message TEXT NOT NULL,
  meta TEXT
);

CREATE TABLE IF NOT EXISTS error_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  first_seen_ts INTEGER NOT NULL,
  last_seen_ts INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  last_event TEXT,
  last_mode TEXT,
  last_lang TEXT,
  sample TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event, ts DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_ts ON feedback(ts DESC);
CREATE INDEX IF NOT EXISTS idx_error_fingerprints_last_seen ON error_fingerprints(last_seen_ts DESC);
CREATE INDEX IF NOT EXISTS idx_error_fingerprints_count ON error_fingerprints(count DESC);
