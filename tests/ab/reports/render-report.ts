import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { aggregateResults } from "../evaluators/aggregate.js";
import type { ScoreRecord } from "../evaluators/schema.js";
import type { RunOutput } from "../providers/base.js";

async function readJsonFiles<T>(dir: string): Promise<T[]> {
  try {
    const files = (await readdir(dir)).filter((item) => item.endsWith(".json"));
    const output: T[] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const raw = await readFile(fullPath, "utf8");
      output.push(JSON.parse(raw) as T);
    }
    return output;
  } catch {
    return [];
  }
}

function bullets(items: string[]): string {
  if (!items.length) return "- 无";
  return items.map((item) => `- ${item}`).join("\n");
}

async function main(): Promise<void> {
  const root = process.cwd();
  const outputsRoot = path.join(root, "tests/ab/outputs");
  const rawRuns = [
    ...(await readJsonFiles<RunOutput>(path.join(outputsRoot, "raw/images"))),
    ...(await readJsonFiles<RunOutput>(path.join(outputsRoot, "raw/videos")))
  ];
  const scores = await readJsonFiles<ScoreRecord>(path.join(outputsRoot, "scored"));
  const template = await readFile(path.join(root, "tests/ab/reports/template.md"), "utf8");
  const aggregated = aggregateResults(rawRuns, scores);

  const providerLines = Object.entries(aggregated.providers).map(([provider, item]) =>
    `- ${provider}: runs=${item.runs}, usableRate=${item.usableRate}, avgUsability=${item.averageUsabilityScore}`
  ).join("\n") || "- 暂无 provider 数据";

  const report = template
    .replace("{{overview}}", [
      `- 原始运行数：${aggregated.totals.rawRuns}`,
      `- 已打分运行数：${aggregated.totals.scoredRuns}`,
      `- 图片运行数：${aggregated.totals.imageRuns}`,
      `- 视频运行数：${aggregated.totals.videoRuns}`,
      `- 总预算消耗估算：$${aggregated.totals.totalCostUsdEstimate}`
    ].join("\n"))
    .replace("{{totals}}", [
      `- Plain 可用率：${aggregated.promptModes.plain.usableRate}`,
      `- Structured 可用率：${aggregated.promptModes.structured.usableRate}`,
      `- 图片提升：${aggregated.taskTypes.image.lift}`,
      `- 视频提升：${aggregated.taskTypes.video.lift}`
    ].join("\n"))
    .replace("{{providers}}", providerLines)
    .replace("{{cases}}", [
      `### 最明显提升的 3 个 case\n${bullets(aggregated.topImprovementCases)}`,
      `### 无明显提升的 3 个 case\n${bullets(aggregated.noLiftCases)}`,
      `### 失败运行\n${bullets(aggregated.failedRuns)}`
    ].join("\n\n"))
    .replace("{{conclusion}}", [
      `- Structured 是否优于 Plain：${aggregated.promptModes.structured.usableRate >= aggregated.promptModes.plain.usableRate ? "当前打分下是" : "当前打分下否"}`,
      `- 下一步建议：先补人工评分，再判断默认 provider / endpoint。`
    ].join("\n"));

  await writeFile(path.join(outputsRoot, "reports/summary.md"), report, "utf8");
  await writeFile(path.join(outputsRoot, "reports/summary.json"), JSON.stringify(aggregated, null, 2), "utf8");
}

void main();
