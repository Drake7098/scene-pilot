#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { evaluateFinalGoLiveChecks } from "./final-go-live-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {
    target: "prod",
    json: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = String(argv[i + 1] || "");
    if (token === "--target" && next) {
      out.target = next;
      i += 1;
      continue;
    }
    if (token.startsWith("--target=")) {
      out.target = token.slice("--target=".length) || out.target;
      continue;
    }
    if (token === "--json") out.json = true;
  }
  if (!["test", "prod"].includes(out.target)) out.target = "prod";
  return out;
}

function abs(...parts) {
  return path.resolve(repoRoot, ...parts);
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    env: process.env
  });
  return {
    ok: Number(r.status ?? 1) === 0,
    code: Number(r.status ?? 1),
    stdout: String(r.stdout || "").trim(),
    stderr: String(r.stderr || "").trim()
  };
}

function runPassCommand(cmd, args) {
  const r = runCapture(cmd, args);
  const merged = [r.stdout, r.stderr].filter(Boolean).join("\n");
  return {
    ok: r.ok && /\bPASS\b/.test(merged),
    code: r.code,
    output: merged
  };
}

function checkReleaseBlockingBaseline() {
  const p = abs("docs/release-blocking-baseline.md");
  if (!fs.existsSync(p)) {
    return { key: "releaseBlockingBaseline", label: "release blocking baseline", ok: false, evidence: "missing_docs/release-blocking-baseline.md" };
  }
  const text = fs.readFileSync(p, "utf8");
  const requiredHeaders = [
    "## 1. 发版阻断项",
    "## 2. 非阻断项",
    "## 3. 阻断优先级（P0/P1）",
    "## 4. 责任归属",
    "## 5. 放行条件"
  ];
  const missing = requiredHeaders.filter((h) => !text.includes(h));
  return {
    key: "releaseBlockingBaseline",
    label: "release blocking baseline",
    ok: missing.length === 0,
    evidence: missing.length ? `missing_headers:${missing.join(",")}` : "baseline_sections_ok"
  };
}

function checkRobotsDailyStable() {
  const summaryPath = abs("tests/robots/artifacts/summary.json");
  const runStatePath = abs("tests/robots/artifacts/run-state.json");
  const summary = readJsonIfExists(summaryPath);
  const runState = readJsonIfExists(runStatePath);
  const summaryOk = Boolean(
    summary &&
      summary.status === "passed" &&
      Number(summary.exitCode) === 0 &&
      Number(summary?.totals?.failed || 0) === 0
  );
  const runStateOk = Boolean(runState && runState.status === "passed" && Number(runState.exitCode) === 0);
  return {
    key: "robotsDailyStable",
    label: "Robots Daily 稳定",
    ok: summaryOk && runStateOk,
    evidence: summaryOk && runStateOk
      ? `summary=${summary.finishedAt || "-"} run_state=${runState.finishedAt || "-"}`
      : "robots_artifacts_not_passed"
  };
}

function checkReleaseReadinessHardGate(target) {
  const r = runCapture("npm", [
    "run",
    "release:readiness",
    "--",
    "--target",
    target,
    "--allow-dirty",
    "--allow-branch-mismatch"
  ]);
  const merged = [r.stdout, r.stderr].filter(Boolean).join("\n");
  const hasHardGateSignal = /\[release:readiness\]\s+(PASS|FAIL)/.test(merged);
  return {
    key: "releaseReadinessHardGate",
    label: "release:readiness 硬门槛",
    ok: r.ok && hasHardGateSignal,
    evidence: hasHardGateSignal ? merged.split("\n").slice(-3).join(" | ") : "readiness_output_missing"
  };
}

function checkUnsavedGuardCoverage() {
  const checks = [
    runPassCommand("npx", ["tsx", "scripts/check/template-switch-guard-proof.ts"]),
    runPassCommand("npx", ["tsx", "scripts/check/new-open-unsaved-guard-proof.ts"]),
    runPassCommand("npx", ["tsx", "scripts/check/leave-page-guard-proof.ts"])
  ];
  const ok = checks.every((x) => x.ok);
  return {
    key: "unsavedGuardCoverage",
    label: "未保存保护全覆盖",
    ok,
    evidence: checks.map((x) => x.output.split("\n").filter(Boolean).slice(-1)[0] || `code=${x.code}`).join(" | ")
  };
}

function checkCreditConsistency() {
  const r = runPassCommand("npx", ["tsx", "scripts/check/credit-consistency-proof.ts"]);
  return {
    key: "creditConsistency",
    label: "扣点一致性",
    ok: r.ok,
    evidence: r.output.split("\n").filter(Boolean).slice(-1)[0] || `code=${r.code}`
  };
}

function checkWebhookIdempotency() {
  const r = runPassCommand("npx", ["tsx", "scripts/check/webhook-idempotency-proof.ts"]);
  return {
    key: "webhookIdempotency",
    label: "webhook 幂等",
    ok: r.ok,
    evidence: r.output.split("\n").filter(Boolean).slice(-1)[0] || `code=${r.code}`
  };
}

function checkAutoCompensation() {
  const r = runPassCommand("npx", ["tsx", "scripts/check/credit-compensation-proof.ts"]);
  return {
    key: "autoCompensation",
    label: "自动补偿",
    ok: r.ok,
    evidence: r.output.split("\n").filter(Boolean).slice(-1)[0] || `code=${r.code}`
  };
}

function checkOpsMinimalMonitoring() {
  const proof = runPassCommand("npx", ["tsx", "scripts/check/ops-monitor-proof.ts"]);
  const summaryApiExists = fs.existsSync(abs("functions/api/ops/summary.ts"));
  const opsDocExists = fs.existsSync(abs("docs/ops-min-alert-rules.md"));
  const ok = proof.ok && summaryApiExists && opsDocExists;
  return {
    key: "opsMinimalMonitoring",
    label: "ops 最小监控",
    ok,
    evidence: `${proof.output.split("\n").filter(Boolean).slice(-1)[0] || `code=${proof.code}`} | summary_api=${summaryApiExists} | ops_doc=${opsDocExists}`
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = [
    checkReleaseBlockingBaseline(),
    checkRobotsDailyStable(),
    checkReleaseReadinessHardGate(args.target),
    checkUnsavedGuardCoverage(),
    checkCreditConsistency(),
    checkWebhookIdempotency(),
    checkAutoCompensation(),
    checkOpsMinimalMonitoring()
  ];

  const result = evaluateFinalGoLiveChecks(checks);
  const payload = {
    generatedAt: new Date().toISOString(),
    target: args.target,
    ...result
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`[final-go-live] target=${payload.target}`);
    for (const item of payload.checks) {
      console.log(`- ${item.ok ? "PASS" : "FAIL"} ${item.label}: ${item.evidence}`);
    }
    console.log(`[final-go-live] ${payload.conclusion}`);
  }

  if (!payload.ok) process.exit(2);
}

main();
