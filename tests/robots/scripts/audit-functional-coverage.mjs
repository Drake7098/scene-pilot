import fs from "node:fs";
import path from "node:path";

const artifactsDir = path.resolve("tests/robots/artifacts");
const resultsPath = path.join(artifactsDir, "results.json");
const manifestPath = path.resolve(
  process.env.ROBOT_FUNCTIONAL_MANIFEST || "tests/robots/config/functional-capabilities.json"
);
const outJsonPath = path.join(artifactsDir, "functional-audit.json");
const outMdPath = path.join(artifactsDir, "functional-audit.md");

if (!fs.existsSync(manifestPath)) {
  console.error(`[robots:functional] Missing manifest: ${manifestPath}`);
  process.exit(2);
}

if (!fs.existsSync(resultsPath)) {
  console.error(`[robots:functional] Missing results file: ${resultsPath}`);
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

function collectSpecStatuses(root) {
  const map = new Map();

  const ensure = (file) => {
    if (!map.has(file)) {
      map.set(file, {
        file,
        executed: false,
        passed: false,
        failedTests: 0,
        tests: 0
      });
    }
    return map.get(file);
  };

  const walkSuite = (suite) => {
    for (const spec of suite.specs || []) {
      const file = String(spec.file || "");
      const state = ensure(file);
      state.executed = true;
      for (const test of spec.tests || []) {
        state.tests += 1;
        const statuses = (test.results || []).map((item) => item.status);
        const failed = statuses.some((status) => status === "failed" || status === "timedOut" || status === "interrupted");
        if (failed) state.failedTests += 1;
      }
      state.passed = state.executed && state.failedTests === 0 && state.tests > 0;
    }
    for (const child of suite.suites || []) walkSuite(child);
  };

  for (const suite of root.suites || []) walkSuite(suite);
  return map;
}

const specStatuses = collectSpecStatuses(results);

function matchSpecStatus(specPath) {
  if (specStatuses.has(specPath)) return specStatuses.get(specPath);
  const normalized = String(specPath || "").replace(/\\/g, "/");
  for (const [file, state] of specStatuses.entries()) {
    const candidate = String(file || "").replace(/\\/g, "/");
    if (candidate === normalized || candidate.endsWith(`/${normalized}`) || normalized.endsWith(`/${candidate}`) || path.basename(candidate) === path.basename(normalized)) {
      return state;
    }
  }
  return null;
}

const capabilityRows = (manifest.requiredCapabilities || []).map((cap) => {
  const matched = (cap.specs || []).map((spec) => matchSpecStatus(spec) || {
    file: spec,
    executed: false,
    passed: false,
    failedTests: 0,
    tests: 0
  });

  const executed = matched.every((item) => item.executed);
  const passed = executed && matched.every((item) => item.passed);

  return {
    id: cap.id,
    label: cap.label,
    severity: cap.severity || "high",
    executed,
    passed,
    specs: matched.map((item) => ({
      file: item.file,
      executed: item.executed,
      passed: item.passed,
      tests: item.tests,
      failedTests: item.failedTests
    }))
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  totals: {
    capabilities: capabilityRows.length,
    executed: capabilityRows.filter((row) => row.executed).length,
    passed: capabilityRows.filter((row) => row.passed).length,
    failed: capabilityRows.filter((row) => row.executed && !row.passed).length,
    missing: capabilityRows.filter((row) => !row.executed).length,
    blockerFailures: capabilityRows.filter((row) => row.severity === "blocker" && (!row.executed || !row.passed)).length
  },
  capabilities: capabilityRows
};

fs.mkdirSync(artifactsDir, { recursive: true });
fs.writeFileSync(outJsonPath, `${JSON.stringify(summary, null, 2)}\n`);

const md = [
  "# Functional Coverage Audit",
  "",
  `- Generated: ${summary.generatedAt}`,
  `- Capabilities: ${summary.totals.capabilities}`,
  `- Executed: ${summary.totals.executed}`,
  `- Passed: ${summary.totals.passed}`,
  `- Failed: ${summary.totals.failed}`,
  `- Missing: ${summary.totals.missing}`,
  `- Blocker failures: ${summary.totals.blockerFailures}`,
  "",
  "| capability | severity | executed | passed | specs |",
  "|---|---|---|---|---|",
  ...capabilityRows.map((row) => `| ${row.id} | ${row.severity} | ${row.executed ? "yes" : "no"} | ${row.passed ? "yes" : "no"} | ${row.specs.map((spec) => `${path.basename(spec.file)}:${spec.executed ? spec.passed ? "pass" : "fail" : "miss"}`).join(", ")} |`)
].join("\n");

fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`Wrote ${outJsonPath}`);
console.log(`Wrote ${outMdPath}`);
