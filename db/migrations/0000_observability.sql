PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  ts INTEGER NOT NULL,
  mode TEXT,
  lang TEXT,
  session TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  device_id TEXT,
  session_id TEXT,
  message TEXT NOT NULL,
  meta TEXT
);

