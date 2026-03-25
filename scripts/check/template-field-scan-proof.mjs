#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-field-scan-report.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(typeof report?.totalFields, "number");
assert.equal(typeof report?.coreFields, "number");
assert.equal(typeof report?.advancedFields, "number");
assert.equal(typeof report?.proFields, "number");
assert.equal(typeof report?.hiddenFields, "number");
assert.ok(report?.categories && typeof report.categories === "object");
assert.ok(Array.isArray(report.categories.camera));
assert.ok(Array.isArray(report.categories.light));
assert.ok(Array.isArray(report.categories.space));
assert.ok(Array.isArray(report.categories.layout));
assert.ok(Array.isArray(report.categories.object));
assert.ok(Array.isArray(report.categories.style));
assert.ok(Array.isArray(report.categories.prompt));
assert.ok(Array.isArray(report.categories.advanced));
assert.ok(Array.isArray(report.categories.pro));
assert.ok(Array.isArray(report.categories.hidden));

console.log(
  `[template-field-scan-proof] PASS totalFields=${report.totalFields} coreFields=${report.coreFields} advancedFields=${report.advancedFields} proFields=${report.proFields} hiddenFields=${report.hiddenFields}`
);
