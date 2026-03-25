import { json } from "./http";

export type OpsSignalInput = {
  signalType: "api_failure" | "payment_webhook_failure" | "frontend_error" | "release_health";
  severity: "warn" | "critical";
  source: string;
  message: string;
  status?: "failed" | "ok" | "dedup";
  meta?: Record<string, unknown>;
};

export type OpsSummary = {
  generatedAt: string;
  windowMinutes: number;
  signals: {
    frontendErrors: number;
    apiFailures: number;
    webhookFailures: number;
    releaseHealthSignals: number;
  };
  alerts: Array<{
    code: string;
    severity: "warn" | "critical";
    manualIntervention: boolean;
    message: string;
  }>;
};

function nowIso() {
  return new Date().toISOString();
}

function nowMs() {
  return Date.now();
}

function safeJson(value: unknown, maxBytes = 4000) {
  try {
    const raw = JSON.stringify(value ?? {});
    if (raw.length <= maxBytes) return raw;
    return JSON.stringify({ truncated: true, originalBytes: raw.length });
  } catch {
    return "{}";
  }
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export async function ensureOpsSignalsTable(db: D1Database | undefined) {
  if (!db) return;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS ops_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      signal_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      meta_json TEXT
    )`
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_ops_signals_ts ON ops_signals(ts DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_ops_signals_type_ts ON ops_signals(signal_type, ts DESC)").run();
}

export async function logOpsSignal(db: D1Database | undefined, input: OpsSignalInput) {
  if (!db) return;
  await ensureOpsSignalsTable(db);
  await db.prepare(
    `INSERT INTO ops_signals (ts, signal_type, severity, source, status, message, meta_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      nowMs(),
      input.signalType,
      input.severity,
      input.source,
      input.status || "failed",
      String(input.message || "").slice(0, 500),
      safeJson(input.meta)
    )
    .run();
}

async function countSignal(db: D1Database | undefined, signalType: string, sinceTs: number) {
  if (!db) return 0;
  await ensureOpsSignalsTable(db);
  const row = await db.prepare(
    `SELECT COUNT(1) AS c FROM ops_signals WHERE signal_type = ? AND ts >= ?`
  ).bind(signalType, sinceTs).first<{ c: number }>();
  return Number(row?.c || 0);
}

async function countFrontendErrors(db: D1Database | undefined, sinceTs: number) {
  if (!db) return 0;
  try {
    const row = await db.prepare(
      `SELECT COUNT(1) AS c FROM events WHERE event = 'error' AND ts >= ?`
    ).bind(sinceTs).first<{ c: number }>();
    return Number(row?.c || 0);
  } catch {
    return 0;
  }
}

export function buildOpsAlerts(signals: OpsSummary["signals"]) {
  const alerts: OpsSummary["alerts"] = [];

  if (signals.frontendErrors >= 5) {
    alerts.push({
      code: "frontend_error_spike",
      severity: "warn",
      manualIntervention: true,
      message: "Frontend error spike (>=5 in window)."
    });
  }
  if (signals.apiFailures >= 3) {
    alerts.push({
      code: "api_failure_spike",
      severity: "critical",
      manualIntervention: true,
      message: "API/key service failures spike (>=3 in window)."
    });
  }
  if (signals.webhookFailures >= 1) {
    alerts.push({
      code: "webhook_failure_detected",
      severity: "critical",
      manualIntervention: true,
      message: "Payment/webhook failure detected."
    });
  }

  return alerts;
}

export async function buildOpsSummary(db: D1Database | undefined, windowMinutes = 60): Promise<OpsSummary> {
  const safeWindowMinutes = Math.max(5, Math.min(24 * 60, Math.floor(windowMinutes)));
  const sinceTs = Date.now() - safeWindowMinutes * 60 * 1000;

  const frontendErrors = await countFrontendErrors(db, sinceTs);
  const apiFailures = await countSignal(db, "api_failure", sinceTs);
  const webhookFailures = await countSignal(db, "payment_webhook_failure", sinceTs);
  const releaseHealthSignals = await countSignal(db, "release_health", sinceTs);

  const signals = {
    frontendErrors,
    apiFailures,
    webhookFailures,
    releaseHealthSignals
  };

  return {
    generatedAt: nowIso(),
    windowMinutes: safeWindowMinutes,
    signals,
    alerts: buildOpsAlerts(signals)
  };
}

export async function respondOpsSummary(context: EventContext<any, any, any>) {
  const windowMinutes = envInt(context.env, "OPS_SUMMARY_WINDOW_MINUTES", 60, 5, 24 * 60);
  const summary = await buildOpsSummary(context.env?.DB, windowMinutes);
  return json({ ok: true, summary }, 200, context.request, context.env);
}
