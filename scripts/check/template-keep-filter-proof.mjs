#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-keep-filter-report-v2.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(typeof report?.total, "number");
assert.equal(typeof report?.keep, "number");
assert.equal(typeof report?.revise, "number");
assert.equal(typeof report?.drop, "number");
assert.ok(Array.isArray(report?.keepList), "keepList must be array");
assert.ok(Array.isArray(report?.reviseList), "reviseList must be array");
assert.ok(Array.isArray(report?.dropList), "dropList must be array");
assert.equal(String(report?.policy?.mode || ""), "control_priority");
assert.ok(
  String(report?.policy?.statement || "").includes("不以对象数量作为主要标准"),
  "policy statement missing control-priority note"
);
assert.equal(report.keep + report.revise + report.drop, report.total);

console.log(
  `[template-keep-filter-proof] PASS total=${report.total} keep=${report.keep} revise=${report.revise} drop=${report.drop}`
);
