import fs from "node:fs";
import path from "node:path";

const summaryPath = path.resolve("tests/robots/artifacts/summary.json");
const resultsPath = path.resolve("tests/robots/artifacts/results.json");
const functionalAuditPath = path.resolve("tests/robots/artifacts/functional-audit.json");

if (!fs.existsSync(summaryPath)) {
  console.error(`[robots:gate] Missing summary file: ${summaryPath}`);
  process.exit(2);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const totals = summary?.totals ?? {};
const allowSkips = process.env.ROBOT_ALLOW_SKIPS === "1";
const status = String(summary?.status || "unknown");
const exitCode = Number(summary?.exitCode ?? 1);

const failed = Number(totals.failed || 0);
const timedOut = Number(totals.timedOut || 0);
const skipped = Number(totals.skipped || 0);
const tests = Number(totals.tests || 0);

const violations = [];

if (!tests) violations.push("no tests were executed");
if (status !== "passed" || exitCode !== 0) {
  violations.push(`summary status is ${status} (exitCode=${exitCode})`);
}
if (failed > 0) violations.push(`${failed} failed tests`);
if (timedOut > 0) violations.push(`${timedOut} timed out results`);
if (!allowSkips && skipped > 0) {
  violations.push(`${skipped} skipped tests (set ROBOT_ALLOW_SKIPS=1 to bypass)`);
}

if (!fs.existsSync(resultsPath)) {
  violations.push(`missing results file: ${resultsPath}`);
} else {
  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  const suites = Array.isArray(results.suites) ? results.suites.length : 0;
  if (!suites) violations.push("results file has no suites");
}

if (!fs.existsSync(functionalAuditPath)) {
  violations.push(`missing functional audit file: ${functionalAuditPath}`);
} else {
  const audit = JSON.parse(fs.readFileSync(functionalAuditPath, "utf8"));
  const caps = Array.isArray(audit.capabilities) ? audit.capabilities : [];
  const missingCaps = caps.filter((cap) => !cap.executed);
  const failedCaps = caps.filter((cap) => cap.executed && !cap.passed);
  const blockerFailures = caps.filter((cap) => cap.severity === "blocker" && (!cap.executed || !cap.passed));

  if (!caps.length) violations.push("functional audit has no capabilities");
  if (missingCaps.length) {
    violations.push(`missing functional capabilities: ${missingCaps.map((cap) => cap.id).join(", ")}`);
  }
  if (failedCaps.length) {
    violations.push(`failed functional capabilities: ${failedCaps.map((cap) => cap.id).join(", ")}`);
  }
  if (blockerFailures.length) {
    violations.push(`blocker capability failures: ${blockerFailures.map((cap) => cap.id).join(", ")}`);
  }
}

if (violations.length) {
  console.error(`[robots:gate] FAILED: ${violations.join("; ")}`);
  process.exit(2);
}

console.log("[robots:gate] PASSED");
