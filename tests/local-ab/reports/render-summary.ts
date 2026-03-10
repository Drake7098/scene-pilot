import path from "node:path";
import { writeFile } from "node:fs/promises";
import { aggregateLocalScores, readScoreRecords } from "../evaluators/aggregate.js";

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const scoredDir = path.join(rootDir, "tests/local-ab/outputs/scored");
  const scores = await readScoreRecords(scoredDir);
  const summary = aggregateLocalScores(scores);

  const markdown = [
    "# ScenePilotix 本地生成验证总结",
    "",
    "## 测试背景",
    "- 本轮是图片阶段（不含视频），对比 `plain prompt` 与 `ScenePilotix 产品真实导出 prompt`。",
    "- Plain：Drake-DS 基于用户自然语言生成；Structured：ScenePilotix 导出链路（runPromptPipeline）。",
    "- 工具分开统计：Draw Things 与 ComfyUI 不混算。",
    "",
    "## Draw Things 最小验证结果",
    `- 已评分样本：${summary.totals.drawThingsRuns}`,
    `- 可用率：${summary.tools.drawthings.usableRate}`,
    `- 平均可用分：${summary.tools.drawthings.averageUsability}`,
    "",
    "## ComfyUI 批量回归结果",
    `- 已评分样本：${summary.totals.comfyUiRuns}`,
    `- 可用率：${summary.tools.comfyui.usableRate}`,
    `- 平均可用分：${summary.tools.comfyui.averageUsability}`,
    "",
    "## Plain vs Structured 对比",
    `- Plain 可用率：${summary.promptModes.plain.usableRate}`,
    `- Structured 可用率：${summary.promptModes.structured.usableRate}`,
    `- Plain 平均可用分：${summary.promptModes.plain.averageUsability}`,
    `- Structured 平均可用分：${summary.promptModes.structured.averageUsability}`,
    "",
    "## 结论门槛（判定规则）",
    "- structured usableRate 相对 plain 提升 >= 10%。",
    "- Draw Things 与 ComfyUI 两侧都不为负提升。",
    "- 提升不应只集中在 1-2 个 case。",
    "- 多对象/复杂构图 case 应体现更明显优势。",
    "",
    "## 提升最大的场景",
    ...summary.topLiftCases.map((item) => `- ${item}`),
    "",
    "## 仍不稳定的场景",
    ...summary.unstableCases.map((item) => `- ${item}`),
    "",
    "## 是否建议继续接外部 API",
    `- 当前建议：${summary.promptModes.structured.usableRate > summary.promptModes.plain.usableRate ? "建议进入第二阶段外部 API 验证" : "先继续打磨本地 structured prompt，再考虑外部 API"}`
  ].join("\n");

  await writeFile(path.join(rootDir, "tests/local-ab/outputs/reports/summary.md"), markdown, "utf8");
  await writeFile(path.join(rootDir, "tests/local-ab/outputs/reports/summary.json"), JSON.stringify(summary, null, 2), "utf8");
}

void main();
