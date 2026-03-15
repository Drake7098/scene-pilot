/**
 * Prompt Batch Test v2 - Analyze prompts from report
 * Reads report.json and outputs detailed analysis
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { loadConfig } from "./config";

type ReportShape = {
  runId: string;
  total: number;
  ok: number;
  warn: number;
  fail: number;
  byFamily?: Record<string, { ok: number; warn: number; fail: number }>;
  byTemplate?: Record<string, { ok: number; warn: number; fail: number }>;
  byPlatform?: Record<string, { ok: number; warn: number; fail: number }>;
  byApplyMode?: Record<string, { ok: number; warn: number; fail: number }>;
  byMediaMode?: Record<string, { ok: number; warn: number; fail: number }>;
  warnReasons?: Record<string, number>;
  lengthStats?: {
    byBucket?: Record<string, number>;
    min: number;
    max: number;
    avg: number;
  };
  records?: Array<{
    templateId: string;
    familyId: string;
    warnReasons?: string[];
    lengthBucket?: string;
    checkResult?: string;
  }>;
};

async function main(): Promise<void> {
  const cfg = loadConfig();
  const reportPath = path.join(cfg.artifactsDir, "reports", "report.json");

  try {
    const raw = await readFile(reportPath, "utf8");
    const r = JSON.parse(raw) as ReportShape;

    console.log("--- Prompt Batch Analysis ---");
    console.log("Run:", r.runId);
    console.log("");

    if (r.warnReasons && Object.keys(r.warnReasons).length > 0) {
      console.log("Warn reasons (count):");
      const sorted = Object.entries(r.warnReasons)
        .filter(([, v]) => v > 0)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      for (const [k, v] of sorted) {
        console.log(`  ${k}: ${v}`);
      }
      console.log("");
    }

    if (r.byFamily && Object.keys(r.byFamily).length > 0) {
      console.log("Families with warns (top 10):");
      const sorted = Object.entries(r.byFamily)
        .filter(([, v]) => (v.warn ?? 0) > 0)
        .sort((a, b) => (b[1].warn ?? 0) - (a[1].warn ?? 0))
        .slice(0, 10);
      for (const [k, v] of sorted) {
        console.log(`  ${k}: ok=${v.ok} warn=${v.warn} fail=${v.fail}`);
      }
      console.log("");
    }

    if (r.lengthStats?.byBucket) {
      console.log("Length buckets:");
      for (const [k, v] of Object.entries(r.lengthStats.byBucket)) {
        if (v > 0) console.log(`  ${k}: ${v}`);
      }
    }
  } catch (e) {
    console.error("No report found. Run: npm run prompt-batch 50");
    process.exit(1);
  }
}

main();
