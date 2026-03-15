/**
 * Prompt Batch Test v2 - Save results with enhanced stats
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type { BuildPromptResult } from "./build-prompts";
import type { CheckResult, WarnReason, LengthBucket } from "./check-prompts";

export type PromptBatchRecord = BuildPromptResult & {
  checkResult?: CheckResult;
  checkDetails?: { rule: string; result: CheckResult; message?: string }[];
  warnReasons?: WarnReason[];
  lengthBucket?: LengthBucket;
  runId: string;
  repeatIndex: number;
};

export type ByKeyStats = Record<string, { ok: number; warn: number; fail: number }>;

export type ReportSummary = {
  runId: string;
  batchSize: number;
  repeatCount: number;
  templatesTested: number;
  promptsGenerated: number;
  total: number;
  ok: number;
  warn: number;
  fail: number;
  byFamily: ByKeyStats;
  byTemplate: ByKeyStats;
  byPlatform: ByKeyStats;
  byApplyMode: ByKeyStats;
  byMediaMode: ByKeyStats;
  warnReasons: Record<WarnReason, number>;
  lengthStats: {
    byBucket: Record<LengthBucket, number>;
    min: number;
    max: number;
    avg: number;
  };
  records: Array<{
    templateId: string;
    familyId: string;
    variantId: string;
    applyMode: string;
    platformId: string;
    mediaMode: string;
    promptLength: number;
    status: string;
    checkResult?: string;
    warnReasons?: WarnReason[];
    lengthBucket?: LengthBucket;
  }>;
};

export async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

export async function savePromptTxt(
  artifactsDir: string,
  record: PromptBatchRecord,
  prompt: string
): Promise<string> {
  const dir = path.join(artifactsDir, "prompts");
  await ensureDir(dir);
  const safeId = record.templateId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const name = `${safeId}_${record.runId}_r${record.repeatIndex}.txt`;
  const filePath = path.join(dir, name);
  await writeFile(filePath, prompt, "utf8");
  return filePath;
}

export async function saveLogJson(
  artifactsDir: string,
  record: PromptBatchRecord
): Promise<string> {
  const dir = path.join(artifactsDir, "logs");
  await ensureDir(dir);
  const safeId = record.templateId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const name = `${safeId}_${record.runId}_r${record.repeatIndex}.json`;
  const filePath = path.join(dir, name);
  await writeFile(
    filePath,
    JSON.stringify(
      {
        templateId: record.templateId,
        familyId: record.familyId,
        variantId: record.variantId,
        applyMode: record.applyMode,
        platformId: record.platformId,
        mediaMode: record.mediaMode,
        promptLength: record.length,
        status: record.status,
        checkResult: record.checkResult,
        checkDetails: record.checkDetails,
        warnReasons: record.warnReasons,
        lengthBucket: record.lengthBucket,
        runId: record.runId,
        repeatIndex: record.repeatIndex,
        engineId: record.engineId,
        error: record.error,
      },
      null,
      2
    ),
    "utf8"
  );
  return filePath;
}

export function buildReportSummary(
  runIdStr: string,
  batchSize: number,
  repeatCount: number,
  templatesTested: number,
  promptsGenerated: number,
  records: PromptBatchRecord[]
): ReportSummary {
  const buckets: LengthBucket[] = [
    "empty",
    "under_50",
    "50_500",
    "500_1000",
    "1000_2000",
    "over_2000",
  ];
  const warnReasonKeys: WarnReason[] = [
    "warn_length_short",
    "warn_length_long",
    "warn_missing_camera",
    "warn_missing_style",
    "warn_missing_subject",
    "warn_missing_layout",
    "warn_missing_machine_tail",
    "warn_layout_heavy",
    "warn_machine_heavy",
    "warn_continuity_heavy",
    "warn_unknown",
  ];

  let ok = 0;
  let warn = 0;
  let fail = 0;
  const byFamily: ByKeyStats = {};
  const byTemplate: ByKeyStats = {};
  const byPlatform: ByKeyStats = {};
  const byApplyMode: ByKeyStats = {};
  const byMediaMode: ByKeyStats = {};
  const warnReasons: Record<WarnReason, number> = Object.fromEntries(
    warnReasonKeys.map((k) => [k, 0])
  ) as Record<WarnReason, number>;
  const byBucket: Record<LengthBucket, number> = Object.fromEntries(
    buckets.map((b) => [b, 0])
  ) as Record<LengthBucket, number>;

  const lengths: number[] = [];

  for (const r of records) {
    const cr = r.checkResult ?? "fail";
    if (cr === "ok") ok++;
    else if (cr === "warn") warn++;
    else fail++;

    const inc = (m: ByKeyStats, k: string) => {
      if (!m[k]) m[k] = { ok: 0, warn: 0, fail: 0 };
      m[k][cr]++;
    };
    inc(byFamily, r.familyId || "_empty");
    inc(byTemplate, r.templateId);
    inc(byPlatform, r.platformId);
    inc(byApplyMode, r.applyMode);
    inc(byMediaMode, r.mediaMode);

    for (const wr of r.warnReasons ?? []) {
      if (wr in warnReasons) warnReasons[wr as WarnReason]++;
    }

    const lb = r.lengthBucket ?? "empty";
    if (lb in byBucket) byBucket[lb]++;

    if (r.status === "ok" && r.length > 0) {
      lengths.push(r.length);
    }
  }

  return {
    runId: runIdStr,
    batchSize,
    repeatCount,
    templatesTested,
    promptsGenerated,
    total: records.length,
    ok,
    warn,
    fail,
    byFamily,
    byTemplate,
    byPlatform,
    byApplyMode,
    byMediaMode,
    warnReasons,
    lengthStats: {
      byBucket,
      min: lengths.length ? Math.min(...lengths) : 0,
      max: lengths.length ? Math.max(...lengths) : 0,
      avg: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
    },
    records: records.map((r) => ({
      templateId: r.templateId,
      familyId: r.familyId,
      variantId: r.variantId,
      applyMode: r.applyMode,
      platformId: r.platformId,
      mediaMode: r.mediaMode,
      promptLength: r.length,
      status: r.status,
      checkResult: r.checkResult,
      warnReasons: r.warnReasons,
      lengthBucket: r.lengthBucket,
    })),
  };
}

export async function saveReport(
  artifactsDir: string,
  summary: ReportSummary
): Promise<string> {
  const dir = path.join(artifactsDir, "reports");
  await ensureDir(dir);
  const filePath = path.join(dir, "report.json");
  await writeFile(filePath, JSON.stringify(summary, null, 2), "utf8");
  return filePath;
}
