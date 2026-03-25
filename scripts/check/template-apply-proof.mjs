#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-apply-report.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(typeof report?.summary?.total, "number");
assert.equal(typeof report?.summary?.ok, "number");
assert.equal(typeof report?.summary?.warn, "number");
assert.equal(typeof report?.summary?.error, "number");
assert.ok(Array.isArray(report?.summary?.errors), "summary.errors must be array");

console.log(
  `[template-apply-proof] PASS total=${report.summary.total} ok=${report.summary.ok} warn=${report.summary.warn} error=${report.summary.error}`
);
