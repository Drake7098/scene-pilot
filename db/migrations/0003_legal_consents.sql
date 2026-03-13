PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS legal_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_context TEXT NOT NULL,
  docs_json TEXT NOT NULL,
  versions_json TEXT NOT NULL,
  locale TEXT NOT NULL,
  source TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  ip_hash TEXT,
  ua_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_consents_user_created
  ON legal_consents(user_id, created_at DESC);
