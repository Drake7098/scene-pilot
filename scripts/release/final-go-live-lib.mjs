#!/usr/bin/env node

export function evaluateFinalGoLiveChecks(checks) {
  const requiredKeys = [
    "releaseBlockingBaseline",
    "robotsDailyStable",
    "releaseReadinessHardGate",
    "unsavedGuardCoverage",
    "creditConsistency",
    "webhookIdempotency",
    "autoCompensation",
    "opsMinimalMonitoring"
  ];

  const normalized = requiredKeys.map((key) => {
    const hit = checks.find((item) => item.key === key);
    if (hit) return hit;
    return {
      key,
      label: key,
      ok: false,
      evidence: "missing_check_item"
    };
  });

  const failed = normalized.filter((item) => !item.ok);
  const ok = failed.length === 0;
  const conclusion = ok ? "PASS = 可收费上线" : "FAIL = 暂不可收费上线";

  return {
    ok,
    conclusion,
    checks: normalized,
    failedCount: failed.length
  };
}
