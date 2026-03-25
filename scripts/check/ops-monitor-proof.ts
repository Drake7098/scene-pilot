import assert from "node:assert/strict";
import {
  buildOpsSummary,
  logOpsSignal,
  type OpsSignalInput
} from "../../functions/api/_shared/ops-monitor";

type OpsSignalRow = {
  ts: number;
  signalType: OpsSignalInput["signalType"];
  severity: OpsSignalInput["severity"];
  source: string;
  status: NonNullable<OpsSignalInput["status"]>;
  message: string;
  metaJson: string;
};

class FakePrepared {
  private readonly sql: string;
  private readonly db: FakeD1;
  private args: unknown[] = [];

  constructor(sql: string, db: FakeD1) {
    this.sql = sql.replace(/\s+/g, " ").trim().toLowerCase();
    this.db = db;
  }

  bind(...args: unknown[]) {
    this.args = args;
    return this;
  }

  async run() {
    if (this.sql.includes("insert into ops_signals")) {
      this.db.opsSignals.push({
        ts: Number(this.args[0]),
        signalType: this.args[1] as OpsSignalInput["signalType"],
        severity: this.args[2] as OpsSignalInput["severity"],
        source: String(this.args[3] ?? ""),
        status: (this.args[4] as NonNullable<OpsSignalInput["status"]>) || "failed",
        message: String(this.args[5] ?? ""),
        metaJson: String(this.args[6] ?? "{}")
      });
    }
    return { success: true };
  }

  async first<T>() {
    if (this.sql.includes("from ops_signals")) {
      const signalType = String(this.args[0] ?? "");
      const sinceTs = Number(this.args[1] ?? 0);
      const c = this.db.opsSignals.filter((row) => row.signalType === signalType && row.ts >= sinceTs).length;
      return { c } as T;
    }
    if (this.sql.includes("from events")) {
      const sinceTs = Number(this.args[0] ?? 0);
      const c = this.db.frontendErrors.filter((ts) => ts >= sinceTs).length;
      return { c } as T;
    }
    return null as T;
  }
}

class FakeD1 {
  readonly opsSignals: OpsSignalRow[] = [];
  readonly frontendErrors: number[] = [];

  prepare(sql: string) {
    return new FakePrepared(sql, this);
  }
}

async function main() {
  const db = new FakeD1();
  const now = Date.now();
  for (let i = 0; i < 6; i += 1) db.frontendErrors.push(now - i * 1000);

  await logOpsSignal(db as unknown as D1Database, {
    signalType: "api_failure",
    severity: "warn",
    source: "proof:api",
    message: "api_failed_1",
    status: "failed"
  });
  await logOpsSignal(db as unknown as D1Database, {
    signalType: "api_failure",
    severity: "warn",
    source: "proof:api",
    message: "api_failed_2",
    status: "failed"
  });
  await logOpsSignal(db as unknown as D1Database, {
    signalType: "api_failure",
    severity: "critical",
    source: "proof:api",
    message: "api_failed_3",
    status: "failed"
  });
  await logOpsSignal(db as unknown as D1Database, {
    signalType: "payment_webhook_failure",
    severity: "critical",
    source: "proof:webhook",
    message: "webhook_failed",
    status: "failed"
  });
  await logOpsSignal(db as unknown as D1Database, {
    signalType: "release_health",
    severity: "warn",
    source: "proof:release",
    message: "release_readiness_checked",
    status: "ok"
  });

  const summary = await buildOpsSummary(db as unknown as D1Database, 60);
  assert.equal(summary.signals.frontendErrors, 6);
  assert.equal(summary.signals.apiFailures, 3);
  assert.equal(summary.signals.webhookFailures, 1);
  assert.equal(summary.signals.releaseHealthSignals, 1);

  const alertCodes = new Set(summary.alerts.map((a) => a.code));
  assert.equal(alertCodes.has("frontend_error_spike"), true);
  assert.equal(alertCodes.has("api_failure_spike"), true);
  assert.equal(alertCodes.has("webhook_failure_detected"), true);

  console.log(
    "[ops-monitor-proof] PASS frontend=6 apiFailures=3 webhookFailures=1 releaseHealth=1 alerts=frontend_error_spike,api_failure_spike,webhook_failure_detected"
  );
}

main();
