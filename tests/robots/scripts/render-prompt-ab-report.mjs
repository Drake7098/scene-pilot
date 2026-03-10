import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, "tests/robots/artifacts/prompt-ab-offline");
const resultsPath = path.join(artifactDir, "results.json");
const reportPath = path.join(artifactDir, "report.md");

function bulletList(items) {
  if (!items.length) return "- 无";
  return items.map((item) => `- ${item}`).join("\n");
}

const raw = await readFile(resultsPath, "utf8");
const suite = JSON.parse(raw);

const caseSection = suite.cases.map((item) => {
  return [
    `## ${item.title}（${item.id}）`,
    "",
    `- 目标模型：${item.platformLabel}`,
    `- 导出范围：${item.scope === "continuous_sequence" ? "连续序列" : "当前分镜"}`,
    `- 综合结论：${item.evaluation.overallConclusion}`,
    `- 信息保留：${item.evaluation.informationRetention}`,
    `- 结构清晰度：${item.evaluation.structureClarity}`,
    `- 冲突风险：${item.evaluation.conflictRisk}`,
    `- 轨迹表达：${item.evaluation.trajectoryExpression}`,
    `- 多对象关系：${item.evaluation.multiObjectRelation}`,
    `- 平台适配压缩风险：${item.evaluation.platformCompressionRisk}`,
    `- 结论摘要：${item.evaluation.summary}`,
    `- 截图：![${item.title}](./${item.screenshot})`,
    ""
  ].join("\n");
}).join("\n");

const trajectoryStrong = suite.cases
  .filter((item) => item.evaluation.trajectoryExpression === "高")
  .map((item) => `${item.id} ${item.title}`);

const structureStrong = suite.cases
  .filter((item) => item.evaluation.structureClarity === "高")
  .map((item) => `${item.id} ${item.title}`);

const compressionRisk = suite.cases
  .filter((item) => item.evaluation.platformCompressionRisk === "高")
  .map((item) => `${item.id} ${item.title}`);

const remainingIssues = suite.cases
  .filter((item) => item.evaluation.conflictRisk !== "低" || item.evaluation.platformCompressionRisk === "高" || item.evaluation.trajectoryExpression === "低")
  .map((item) => `${item.id} ${item.title}`);

const md = [
  "# ScenePilotix 离线 Prompt AB 报告",
  "",
  `生成时间：${suite.generatedAt}`,
  "",
  "## 测试背景",
  "",
  "本轮评测不接入任何外部大模型 API，也不评估最终出图质量。评测对象仅限于“用户输入 -> ScenePilotix 结构化输出 -> 平台适配输出”这条离线提示词链路。",
  "",
  "## Case 列表",
  "",
  suite.cases.map((item) => `- ${item.id}｜${item.title}`).join("\n"),
  "",
  "## 每个 Case 的简要结论",
  "",
  caseSection,
  "## 汇总结论",
  "",
  "### ScenePilotix 优势明显的场景",
  "",
  bulletList(structureStrong),
  "",
  "### 连续轨迹 / 房间切换表现较好的场景",
  "",
  bulletList(trajectoryStrong),
  "",
  "### 平台适配压缩风险较高的场景",
  "",
  bulletList(compressionRisk),
  "",
  "### 仍需继续优化的场景",
  "",
  bulletList(remainingIssues),
  "",
  "### 综合判断",
  "",
  `- ScenePilotix 更好：${suite.summary.scenePilotixBetter.length} 个 case`,
  `- Baseline 更好：${suite.summary.baselineBetter.length} 个 case`,
  `- 各有优劣：${suite.summary.mixed.length} 个 case`,
  "",
  "## 建议下一步优化方向",
  "",
  "1. 继续打磨 continuous 场景下的跨空间桥接短语，避免在短 prompt 平台里被压缩。",
  "2. 针对 refs-heavy case 做单独的附件/引用表达对照，检查平台 patch 是否过度删减。",
  "3. 对冲突收口 case 增加更稳定的规则断言，避免后续 prompt 文案迭代回退。",
  "4. 如需给团队或投资人展示，可直接引用本目录 PNG 和本 Markdown 报告。",
  ""
].join("\n");

await writeFile(reportPath, md, "utf8");
console.log(`Wrote ${reportPath}`);
