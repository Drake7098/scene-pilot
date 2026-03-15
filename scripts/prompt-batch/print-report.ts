/**
 * Prompt Batch Test v2 - Print report
 * npm run prompt-batch:report
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { loadConfig } from "./config";

type ReportShape = {
  runId: string;
  batchSize: number;
  repeatCount: number;
  templatesTested: number;
  promptsGenerated: number;
  total: number;
  ok: number;
  warn: number;
  fail: number;
  byFamily?: Record<string, { ok: number; warn: number; fail: number }>;
  byTemplate?: Record<string, { ok: number; warn: number; fail: number }>;
  warnReasons?: Record<string, number>;
  lengthStats?: {
    byBucket?: Record<string, number>;
    min: number;
    max: number;
    avg: number;
  };
};

function topByWarn(map: Record<string, { ok: number; warn: number; fail: number }>): string {
  if (!map || typeof map !== "object") return "—";
  const entries = Object.entries(map)
    .filter(([, v]) => v.warn > 0)
    .sort((a, b) => (b[1].warn ?? 0) - (a[1].warn ?? 0));
  return entries[0]?.[0] ?? "—";
}

function topWarnReason(warnReasons: Record<string, number> | undefined): string {
  if (!warnReasons || typeof warnReasons !== "object") return "—";
  const entries = Object.entries(warnReasons)
    .filter(([, v]) => v > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return entries[0]?.[0] ?? "—";
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const reportPath = path.join(cfg.artifactsDir, "reports", "report.json");

  try {
    const raw = await readFile(reportPath, "utf8");
    const report = JSON.parse(raw) as ReportShape;

    console.log("--- Prompt Batch Report ---");
    console.log("Run ID:", report.runId);
    console.log("Batch size:", report.batchSize);
    console.log("Repeat count:", report.repeatCount);
    console.log("Templates tested:", report.templatesTested);
    console.log("Prompts generated:", report.promptsGenerated);
    console.log("");
    console.log("Total:", report.total ?? report.promptsGenerated);
    console.log("ok:", report.ok);
    console.log("warn:", report.warn);
    console.log("fail:", report.fail);
    console.log("");
    console.log("Top warn family:", topByWarn(report.byFamily));
    console.log("Top warn template:", topByWarn(report.byTemplate));
    console.log("Top warn reason:", topWarnReason(report.warnReasons));
    console.log("");
    const ls = report.lengthStats;
    if (ls) {
      console.log("Max length:", ls.max);
      console.log("Min length:", ls.min);
      console.log("Avg length:", ls.avg);
    }
  } catch (e) {
    console.error("No report found. Run: npm run prompt-batch 50");
    process.exit(1);
  }
}

main();
