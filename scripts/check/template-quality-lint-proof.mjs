#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-quality-lint-report.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(typeof report?.summary?.total, "number");
assert.equal(typeof report?.summary?.pass, "number");
assert.equal(typeof report?.summary?.warn, "number");
assert.equal(typeof report?.summary?.error, "number");
assert.equal(typeof report?.summary?.highRisk, "number");
assert.equal(typeof report?.summary?.highRiskTemplates, "number");
assert.ok(typeof report?.summary?.rulesTriggered === "object" && report.summary.rulesTriggered !== null);
assert.ok(Array.isArray(report?.summary?.errorList), "summary.errorList must be array");
assert.ok(Array.isArray(report?.templates), "templates must be array");

console.log(
  `[template-quality-lint-proof] PASS total=${report.summary.total} pass=${report.summary.pass} warn=${report.summary.warn} error=${report.summary.error} highRisk=${report.summary.highRisk}`
);
