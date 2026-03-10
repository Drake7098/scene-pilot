import fs from "node:fs";
import path from "node:path";

const summaryPath = path.resolve("tests/robots/artifacts/summary.json");
const resultsPath = path.resolve("tests/robots/artifacts/results.json");

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

const requiredUiGuardSpecs = [
  "tests/robots/scenarios/quick-workspace-layout-guard.spec.ts",
];

if (!fs.existsSync(resultsPath)) {
  violations.push(`missing results file: ${resultsPath}`);
} else {
  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  const seenRequired = new Set();
  let requiredFailures = 0;

  const walkSuite = (suite) => {
    for (const spec of suite.specs || []) {
      const file = String(spec.file || "");
      const isRequired = requiredUiGuardSpecs.some((item) => file.endsWith(item));
      if (!isRequired) continue;
      const matched = requiredUiGuardSpecs.find((item) => file.endsWith(item));
      if (matched) seenRequired.add(matched);
      for (const t of spec.tests || []) {
        const statuses = (t.results || []).map((r) => r.status);
        const hasFailed = statuses.some((s) => s === "failed" || s === "timedOut" || s === "interrupted");
        if (hasFailed) requiredFailures += 1;
      }
    }
    for (const child of suite.suites || []) walkSuite(child);
  };

  for (const suite of results.suites || []) walkSuite(suite);

  const missing = requiredUiGuardSpecs.filter((item) => !seenRequired.has(item));
  if (missing.length) {
    violations.push(`required ui guard specs not executed: ${missing.join(", ")}`);
  }
  if (requiredFailures > 0) {
    violations.push(`${requiredFailures} failures in required ui guard specs`);
  }
}

if (violations.length) {
  console.error(`[robots:gate] FAILED: ${violations.join("; ")}`);
  process.exit(2);
}

console.log("[robots:gate] PASSED");
