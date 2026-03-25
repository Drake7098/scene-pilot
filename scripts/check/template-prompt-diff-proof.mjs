#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-prompt-diff-report.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(typeof report?.summary?.total, "number");
assert.equal(typeof report?.summary?.highGain, "number");
assert.equal(typeof report?.summary?.mediumGain, "number");
assert.equal(typeof report?.summary?.lowGain, "number");
assert.equal(typeof report?.summary?.nearNoGain, "number");
assert.ok(Array.isArray(report?.summary?.suspectTemplates), "suspectTemplates must be array");
assert.ok(Array.isArray(report?.templates), "templates must be array");

console.log(
  `[template-prompt-diff-proof] PASS total=${report.summary.total} highGain=${report.summary.highGain} mediumGain=${report.summary.mediumGain} lowGain=${report.summary.lowGain} nearNoGain=${report.summary.nearNoGain}`
);
