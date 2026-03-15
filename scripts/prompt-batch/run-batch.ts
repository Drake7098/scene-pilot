/**
 * Prompt Batch Test v1 - Run batch
 * npm run prompt-batch 50
 * npm run prompt-batch 20 3  (batch 20, repeat 3)
 */

import path from "node:path";
import { loadConfig } from "./config";
import { buildPromptFromTemplate, getTemplateIds, shuffle } from "./build-prompts";
import { checkPrompt } from "./check-prompts";
import {
  savePromptTxt,
  saveLogJson,
  saveReport,
  buildReportSummary,
  type PromptBatchRecord,
} from "./save-results";

function runId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const batchSize = parseInt(process.argv[2] ?? String(cfg.batchSize), 10) || cfg.batchSize;
  const repeatCount = parseInt(process.argv[3] ?? String(cfg.repeatCount), 10) || cfg.repeatCount;

  const allIds = getTemplateIds(cfg.mediaMode);
  const shuffled = shuffle(allIds);
  const selected = shuffled.slice(0, Math.min(batchSize, shuffled.length));

  const runIdStr = runId();
  const records: PromptBatchRecord[] = [];
  let checkOk = 0;
  let checkWarn = 0;
  let checkFail = 0;

  const uniqueTemplates = new Set<string>();
  let promptsGenerated = 0;

  for (let r = 0; r < repeatCount; r++) {
    for (let i = 0; i < selected.length; i++) {
      const templateId = selected[i];
      uniqueTemplates.add(templateId);

      const result = await buildPromptFromTemplate(
        templateId,
        cfg.platformId,
        cfg.applyMode,
        cfg.lang
      );

      const check =
        result.status === "ok"
          ? checkPrompt(result.prompt)
          : { result: "fail" as const, details: [], warnReasons: [] as string[], lengthBucket: "empty" as const };
      if (check.result === "ok") checkOk++;
      else if (check.result === "warn") checkWarn++;
      else checkFail++;

      if (result.status === "ok") promptsGenerated++;

      const record: PromptBatchRecord = {
        ...result,
        checkResult: check.result,
        checkDetails: check.details,
        warnReasons: check.warnReasons ?? [],
        lengthBucket: check.lengthBucket,
        runId: runIdStr,
        repeatIndex: r,
      };
      records.push(record);

      if (result.status === "ok") {
        await savePromptTxt(cfg.artifactsDir, record, result.prompt);
      }
      await saveLogJson(cfg.artifactsDir, record);

      const idx = r * selected.length + i + 1;
      const total = selected.length * repeatCount;
      console.log(
        `[${idx}/${total}] ${templateId} len=${result.length} status=${result.status} check=${check.result}`
      );
    }
  }

  const summary = buildReportSummary(
    runIdStr,
    selected.length,
    repeatCount,
    uniqueTemplates.size,
    promptsGenerated,
    records
  );

  const reportPath = await saveReport(cfg.artifactsDir, summary);
  console.log("\n--- Report ---");
  console.log("Templates tested:", uniqueTemplates.size);
  console.log("Prompts generated:", promptsGenerated);
  console.log("Check ok:", checkOk, "warn:", checkWarn, "fail:", checkFail);
  console.log("Report:", reportPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
