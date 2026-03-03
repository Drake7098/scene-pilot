import fs from "node:fs";
import path from "node:path";

const root = path.resolve("tests/robots");
const artifactsDir = path.join(root, "artifacts");
const resultsPath = path.join(artifactsDir, "results.json");
const runStatePath = path.join(artifactsDir, "run-state.json");
const summaryPath = path.join(artifactsDir, "summary.json");

const now = new Date().toISOString();
let results = null;
let runState = {};

if (fs.existsSync(resultsPath)) {
  results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
}
if (fs.existsSync(runStatePath)) {
  runState = JSON.parse(fs.readFileSync(runStatePath, "utf8"));
}

const summary = {
  generatedAt: now,
  status: runState.status || "idle",
  startedAt: runState.startedAt || null,
  finishedAt: runState.finishedAt || null,
  exitCode: runState.exitCode ?? null,
  appUrl: process.env.APP_URL || "http://127.0.0.1:5173",
  totals: {
    tests: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0,
    timedOut: 0,
    durationMs: 0,
  },
  failures: [],
};

if (results?.suites) {
  const failures = [];

  const walkSpec = (spec, titlePath = []) => {
    const fullTitlePath = [...titlePath, spec.title].filter(Boolean);
    for (const test of spec.tests || []) {
      summary.totals.tests += 1;
      const outcome = test.outcome || "unknown";
      const statuses = (test.results || []).map((r) => r.status);
      const isSkipped = statuses.length > 0 && statuses.every((s) => s === "skipped");

      if (isSkipped) {
        summary.totals.skipped += 1;
      } else if (outcome === "unexpected") {
        summary.totals.failed += 1;
      } else if (outcome === "flaky") {
        summary.totals.flaky += 1;
      } else {
        summary.totals.passed += 1;
      }

      for (const r of test.results || []) {
        summary.totals.durationMs += r.duration || 0;
        if (r.status === "timedOut") summary.totals.timedOut += 1;
      }

      if (outcome === "unexpected") {
        const firstResult = (test.results || [])[0] || {};
        failures.push({
          title: fullTitlePath.join(" > "),
          file: spec.file || null,
          error: firstResult.error?.message || "Assertion failed",
          status: firstResult.status || "failed",
        });
      }
    }

    for (const child of spec.suites || []) {
      walkSuite(child, fullTitlePath);
    }
  };

  const walkSuite = (suite, titlePath = []) => {
    const nextPath = suite.title ? [...titlePath, suite.title] : titlePath;
    for (const spec of suite.specs || []) {
      walkSpec(spec, nextPath);
    }
    for (const child of suite.suites || []) {
      walkSuite(child, nextPath);
    }
  };

  for (const suite of results.suites) {
    walkSuite(suite, []);
  }

  summary.failures = failures.slice(0, 20);
}

fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote ${summaryPath}`);
