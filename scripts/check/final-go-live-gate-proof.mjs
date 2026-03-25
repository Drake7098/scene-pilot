#!/usr/bin/env node
import assert from "node:assert/strict";
import { evaluateFinalGoLiveChecks } from "../release/final-go-live-lib.mjs";

const checks = [
  { key: "releaseBlockingBaseline", label: "release blocking baseline", ok: true, evidence: "baseline_sections_ok" },
  { key: "robotsDailyStable", label: "Robots Daily 稳定", ok: true, evidence: "robots_ci_stable" },
  { key: "releaseReadinessHardGate", label: "release:readiness 硬门槛", ok: true, evidence: "[release:readiness] PASS" },
  { key: "unsavedGuardCoverage", label: "未保存保护全覆盖", ok: true, evidence: "all_unsaved_guard_proofs_pass" },
  { key: "creditConsistency", label: "扣点一致性", ok: true, evidence: "credit_consistency_proof_pass" },
  { key: "webhookIdempotency", label: "webhook 幂等", ok: true, evidence: "webhook_idempotency_proof_pass" },
  { key: "autoCompensation", label: "自动补偿", ok: true, evidence: "credit_compensation_proof_pass" },
  { key: "opsMinimalMonitoring", label: "ops 最小监控", ok: true, evidence: "ops_monitor_proof_pass" }
];

const result = evaluateFinalGoLiveChecks(checks);
assert.equal(result.ok, true);
assert.equal(result.conclusion, "PASS = 可收费上线");
console.log("[final-go-live-gate-proof] PASS conclusion=PASS = 可收费上线");
