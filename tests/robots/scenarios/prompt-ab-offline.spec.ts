import { expect, test } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Lang } from "../../../src/i18n";
import type { PlatformPresetId } from "../../../src/config/platformPresets";
import { getPlatformPreset } from "../../../src/config/platformPresets";
import { sanitizeProject, type Project } from "../../../src/model";
import { runPromptPipeline } from "../../../src/utils/promptPipeline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const fixturesPath = path.join(repoRoot, "tests/robots/fixtures/prompt-ab-cases.json");
const artifactDir = path.join(repoRoot, "tests/robots/artifacts/prompt-ab-offline");
const resultsPath = path.join(artifactDir, "results.json");

type EvalLabel = "高" | "中" | "低";
type OverallConclusion = "Baseline 更好" | "ScenePilotix 更好" | "各有优劣";
type PromptScope = "current_scene" | "continuous_sequence";

type FixtureCase = {
  id: string;
  title: string;
  description: string;
  lang: Lang;
  platformId: PlatformPresetId;
  scope: PromptScope;
  userInput: string[];
  expectations: {
    infoTerms: string[];
    trajectoryTerms: string[];
    relationTerms: string[];
    conflictExpected: boolean;
    refsExpected: boolean;
    multiObjectExpected: boolean;
  };
  project: Project;
};

type CaseEvaluation = {
  informationRetention: EvalLabel;
  structureClarity: EvalLabel;
  conflictRisk: EvalLabel;
  trajectoryExpression: EvalLabel;
  multiObjectRelation: EvalLabel;
  modelExecutionReadiness: EvalLabel;
  platformCompressionRisk: EvalLabel;
  overallConclusion: OverallConclusion;
  summary: string;
  baselineNotes: string[];
  scenePilotixNotes: string[];
};

type CaseResult = {
  id: string;
  title: string;
  description: string;
  lang: Lang;
  platformId: PlatformPresetId;
  platformLabel: string;
  scope: PromptScope;
  userInput: string;
  baselinePrompt: string;
  structuredPrompt: string;
  adaptedPrompt: string;
  finalCopyPrompt: string;
  metadata: ReturnType<typeof runPromptPipeline>["metadata"];
  evaluation: CaseEvaluation;
  screenshot: string;
};

type SuiteResult = {
  generatedAt: string;
  caseCount: number;
  cases: CaseResult[];
  summary: {
    scenePilotixBetter: string[];
    baselineBetter: string[];
    mixed: string[];
    highCompressionRisk: string[];
    trajectoryWeakCases: string[];
    conflictRiskCases: string[];
  };
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBaselinePrompt(caseItem: FixtureCase): string {
  const intro = caseItem.lang === "zh"
    ? "请根据以下自然语言直接生成画面，不额外补充结构层："
    : "Generate directly from the following natural-language input without extra structural control:";
  return `${intro}\n${caseItem.userInput.map((line, index) => `${index + 1}. ${line}`).join("\n")}`.trim();
}

function coverageRatio(text: string, terms: string[]): number {
  if (!terms.length) return 1;
  const bag = text.toLowerCase();
  let hit = 0;
  for (const term of terms) {
    if (bag.includes(term.toLowerCase())) hit += 1;
  }
  return hit / terms.length;
}

function labelFromPositive(score: number): EvalLabel {
  if (score >= 0.72) return "高";
  if (score >= 0.42) return "中";
  return "低";
}

function labelFromRisk(score: number): EvalLabel {
  if (score <= 0.28) return "低";
  if (score <= 0.58) return "中";
  return "高";
}

function hasStructuredSignals(text: string, caseItem: FixtureCase): number {
  const checks = [
    /#\s/.test(text),
    /主体\(type\)|Subject \(type\)|Look:|外观\(look\)/.test(text),
    /起点t0|Start t0/.test(text),
    caseItem.project.project.mediaType === "video" ? /终点t1|End\s+t1/.test(text) : true,
    /背景：|Background:|分镜说明：|Shot note:|Camera:|摄像机：/.test(text),
    /系统结构控制层|System Structural Control Layer|结构化生成|Structured generation/.test(text)
  ];
  return checks.filter(Boolean).length / checks.length;
}

function evaluateTrajectory(caseItem: FixtureCase, text: string): EvalLabel {
  if (!caseItem.expectations.trajectoryTerms.length) return "低";
  const coverage = coverageRatio(text, caseItem.expectations.trajectoryTerms);
  const continuityBoost = /no-cut|不跳切|不瞬移|穿过|corridor|过道|door|门|连续推进|camera continues/i.test(text) ? 0.18 : 0;
  return labelFromPositive(Math.min(1, coverage + continuityBoost));
}

function evaluateRelation(caseItem: FixtureCase, text: string): EvalLabel {
  if (!caseItem.expectations.multiObjectExpected && !caseItem.expectations.relationTerms.length) return "低";
  const relationCoverage = coverageRatio(text, caseItem.expectations.relationTerms);
  const spatialSignals = /前景|后景|中景|foreground|background|midground|面对面|facing|layer order/i.test(text) ? 0.24 : 0;
  return labelFromPositive(Math.min(1, relationCoverage + spatialSignals));
}

function evaluateConflictRisk(caseItem: FixtureCase, structuredText: string, adaptedText: string): EvalLabel {
  const combined = `${structuredText}\n${adaptedText}`;
  if (!caseItem.expectations.conflictExpected) {
    const riskSignals = /冲突收口|结构优先|conflict policy|priority:/i.test(combined) ? 0.18 : 0.36;
    return labelFromRisk(riskSignals);
  }
  if (/冲突收口：结构优先|结构优先。若备注里有行走|do not convert this note into full displacement|keep static \(no jitter/i.test(combined)) {
    return "低";
  }
  if (/冲突处理|conflict policy|priority:/i.test(combined)) {
    return "中";
  }
  return "高";
}

function evaluateExecutionReadiness(structuredText: string, adaptedText: string): EvalLabel {
  const score = [
    /#\s/.test(structuredText),
    /主体\(type\)|Subject \(type\)/.test(structuredText),
    /起点t0|Start t0/.test(structuredText),
    /系统结构控制层|System Structural Control Layer/.test(structuredText),
    /Reference strategy|参考图策略|compact_density|Structured generation|结构化生成/i.test(adaptedText)
  ].filter(Boolean).length / 5;
  return labelFromPositive(score);
}

function evaluateCompressionRisk(corePrompt: string, adaptedPrompt: string, caseItem: FixtureCase, trimmed: boolean): EvalLabel {
  const terms = caseItem.expectations.infoTerms.concat(caseItem.expectations.trajectoryTerms);
  const coreCoverage = coverageRatio(corePrompt, terms);
  const adaptedCoverage = coverageRatio(adaptedPrompt, terms);
  const drop = Math.max(0, coreCoverage - adaptedCoverage);
  const extraRisk = trimmed ? 0.4 : 0;
  return labelFromRisk(Math.min(1, drop + extraRisk));
}

function toRank(label: EvalLabel): number {
  if (label === "高") return 3;
  if (label === "中") return 2;
  return 1;
}

function riskToRank(label: EvalLabel): number {
  if (label === "低") return 3;
  if (label === "中") return 2;
  return 1;
}

function evaluateCase(caseItem: FixtureCase, baselinePrompt: string, structuredPrompt: string, adaptedPrompt: string, trimmed: boolean): CaseEvaluation {
  const baselineInfo = labelFromPositive(coverageRatio(baselinePrompt, caseItem.expectations.infoTerms));
  const structuredInfo = labelFromPositive(Math.max(
    coverageRatio(structuredPrompt, caseItem.expectations.infoTerms),
    coverageRatio(adaptedPrompt, caseItem.expectations.infoTerms)
  ));
  const structureClarity = labelFromPositive(Math.max(hasStructuredSignals(structuredPrompt, caseItem), hasStructuredSignals(adaptedPrompt, caseItem) - 0.08));
  const trajectoryExpression = evaluateTrajectory(caseItem, `${structuredPrompt}\n${adaptedPrompt}`);
  const multiObjectRelation = evaluateRelation(caseItem, `${structuredPrompt}\n${adaptedPrompt}`);
  const conflictRisk = evaluateConflictRisk(caseItem, structuredPrompt, adaptedPrompt);
  const modelExecutionReadiness = evaluateExecutionReadiness(structuredPrompt, adaptedPrompt);
  const platformCompressionRisk = evaluateCompressionRisk(structuredPrompt, adaptedPrompt, caseItem, trimmed);

  const baselineStructureRank = 1;
  const baselineTrajectoryRank = caseItem.expectations.trajectoryTerms.length ? 2 : 1;
  const baselineRelationRank = caseItem.expectations.multiObjectExpected ? 2 : 1;
  const baselineConflictRank = caseItem.expectations.conflictExpected ? 1 : 2;

  const baselineScore =
    toRank(baselineInfo) * 1.4 +
    baselineStructureRank * 1.6 +
    baselineTrajectoryRank * 1.2 +
    baselineRelationRank * 1.1 +
    baselineConflictRank * 1.3;

  const scenepilotScore =
    toRank(structuredInfo) * 1.4 +
    toRank(structureClarity) * 1.6 +
    toRank(trajectoryExpression) * 1.2 +
    toRank(multiObjectRelation) * 1.1 +
    riskToRank(conflictRisk) * 1.3 +
    toRank(modelExecutionReadiness) * 1.2 +
    riskToRank(platformCompressionRisk) * 0.8;

  let overallConclusion: OverallConclusion = "各有优劣";
  if (scenepilotScore >= baselineScore + 1.6) overallConclusion = "ScenePilotix 更好";
  else if (baselineScore >= scenepilotScore + 1.2) overallConclusion = "Baseline 更好";

  const baselineNotes = [
    caseItem.lang === "zh" ? "Baseline 保留了原始表述，但缺少结构字段和优先级。" : "Baseline keeps the original wording but lacks structure and priority handling."
  ];
  if (caseItem.expectations.trajectoryTerms.length) {
    baselineNotes.push(caseItem.lang === "zh" ? "运动和路径更多停留在自然语言层，没有明确的镜头/路径约束。" : "Motion/path stay at natural-language level without explicit camera/path constraints.");
  }
  if (caseItem.expectations.multiObjectExpected) {
    baselineNotes.push(caseItem.lang === "zh" ? "多对象关系主要依赖读者自行理解。" : "Multi-object relations rely on reader inference.");
  }
  if (caseItem.expectations.conflictExpected) {
    baselineNotes.push(caseItem.lang === "zh" ? "高风险冲突：结构静止与强运动文本直接并列。" : "High-risk conflict: static structure is mixed with strong movement text.");
  }

  const scenePilotixNotes = [
    caseItem.lang === "zh" ? "Structured Prompt 明确拆出了场景、对象、布局和约束。" : "Structured Prompt separates scene, object, layout, and constraints."
  ];
  if (trajectoryExpression !== "低") {
    scenePilotixNotes.push(caseItem.lang === "zh" ? "轨迹/镜头连续语义比 baseline 更清楚。" : "Trajectory/camera continuity is clearer than the baseline.");
  }
  if (multiObjectRelation !== "低") {
    scenePilotixNotes.push(caseItem.lang === "zh" ? "对象层级和空间关系表达更稳定。" : "Object hierarchy and spatial relations are more stable.");
  }
  if (platformCompressionRisk === "高") {
    scenePilotixNotes.push(caseItem.lang === "zh" ? "平台适配压缩较重，需检查是否丢失局部结构。" : "Platform adaptation compresses aggressively; verify local structure loss.");
  }
  if (conflictRisk === "低" && caseItem.expectations.conflictExpected) {
    scenePilotixNotes.push(caseItem.lang === "zh" ? "冲突场景里已经出现结构优先收口。" : "Conflict case now shows structure-first resolution.");
  }

  const summary = caseItem.lang === "zh"
    ? overallConclusion === "ScenePilotix 更好"
      ? "ScenePilotix 在结构、约束或轨迹表达上更稳，更适合作为模型执行输入。"
      : overallConclusion === "Baseline 更好"
        ? "Baseline 更直接，但结构化输出在当前 case 中出现了压缩或信息不必要重写。"
        : "Baseline 更直接，ScenePilotix 更结构化；建议结合目标平台选择。"
    : overallConclusion === "ScenePilotix 更好"
      ? "ScenePilotix is more stable on structure, constraints, or trajectory, and is more execution-ready."
      : overallConclusion === "Baseline 更好"
        ? "Baseline is more direct here, while the structured output shows compression or unnecessary rewriting."
        : "Baseline is more direct; ScenePilotix is more structured. Choose based on target platform.";

  return {
    informationRetention: structuredInfo,
    structureClarity,
    conflictRisk,
    trajectoryExpression,
    multiObjectRelation,
    modelExecutionReadiness,
    platformCompressionRisk,
    overallConclusion,
    summary,
    baselineNotes,
    scenePilotixNotes
  };
}

function buildScreenshotHtml(result: CaseResult): string {
  const chips = [
    ["信息保留", result.evaluation.informationRetention],
    ["结构清晰度", result.evaluation.structureClarity],
    ["冲突风险", result.evaluation.conflictRisk],
    ["轨迹表达", result.evaluation.trajectoryExpression],
    ["多对象关系", result.evaluation.multiObjectRelation],
    ["平台适配压缩风险", result.evaluation.platformCompressionRisk],
    ["模型执行适配度", result.evaluation.modelExecutionReadiness]
  ];
  const chipHtml = chips.map(([label, value]) => `<span class="chip"><b>${escapeHtml(label)}</b> ${escapeHtml(value)}</span>`).join("");
  const notesHtml = result.evaluation.scenePilotixNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(result.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Helvetica Neue", "PingFang SC", "Noto Sans SC", sans-serif;
        color: #1d1f24;
        background: linear-gradient(180deg, #f7f7f2 0%, #ece8de 100%);
      }
      .page { width: 1600px; min-height: 980px; margin: 0 auto; padding: 40px; }
      .head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
      .title { font-size: 34px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
      .sub { margin-top: 10px; font-size: 15px; line-height: 1.6; max-width: 980px; color: #464a54; }
      .badge { padding: 10px 14px; border-radius: 999px; background: #1d1f24; color: #fff; font-size: 14px; font-weight: 700; white-space: nowrap; }
      .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
      .chip { padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.72); border: 1px solid rgba(29,31,36,0.08); font-size: 13px; }
      .grid { display: grid; grid-template-columns: 0.9fr 1fr 1fr 1fr; gap: 16px; margin-top: 22px; }
      .card { background: rgba(255,255,255,0.84); border: 1px solid rgba(29,31,36,0.08); border-radius: 20px; padding: 18px; min-height: 520px; box-shadow: 0 12px 30px rgba(29,31,36,0.06); }
      .card h2 { margin: 0 0 12px 0; font-size: 17px; font-weight: 800; }
      .meta { font-size: 12px; color: #6a707d; margin-bottom: 10px; }
      pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.55; color: #23262d; }
      .footer { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; margin-top: 16px; }
      .panel { background: rgba(255,255,255,0.82); border: 1px solid rgba(29,31,36,0.08); border-radius: 20px; padding: 18px; }
      .panel h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 800; }
      .conclusion { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
      ul { margin: 0; padding-left: 18px; }
      li { font-size: 13px; line-height: 1.6; color: #363943; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="head">
        <div>
          <h1 class="title">${escapeHtml(result.title)}</h1>
          <div class="sub">${escapeHtml(result.description)}<br/>适用大模型：${escapeHtml(result.platformLabel)} ｜ 导出范围：${escapeHtml(result.scope === "continuous_sequence" ? "连续序列" : "当前分镜")}</div>
          <div class="chips">${chipHtml}</div>
        </div>
        <div class="badge">${escapeHtml(result.evaluation.overallConclusion)}</div>
      </div>
      <div class="grid">
        <section class="card">
          <h2>用户原始输入</h2>
          <pre>${escapeHtml(result.userInput)}</pre>
        </section>
        <section class="card">
          <h2>Baseline Prompt</h2>
          <div class="meta">直接把用户输入压成普通自然语言 prompt</div>
          <pre>${escapeHtml(result.baselinePrompt)}</pre>
        </section>
        <section class="card">
          <h2>ScenePilotix Structured Prompt</h2>
          <div class="meta">结构化输出</div>
          <pre>${escapeHtml(result.structuredPrompt)}</pre>
        </section>
        <section class="card">
          <h2>ScenePilotix Adapted Prompt</h2>
          <div class="meta">平台适配输出</div>
          <pre>${escapeHtml(result.adaptedPrompt)}</pre>
        </section>
      </div>
      <div class="footer">
        <section class="panel">
          <h3>简短结论</h3>
          <div class="conclusion">${escapeHtml(result.evaluation.summary)}</div>
          <div style="font-size:13px;color:#555b66;line-height:1.7;">Final copy prompt 已生成，截图聚焦 baseline / structured / adapted 三组对照，便于团队讨论输入到提示词链路的质量差异。</div>
        </section>
        <section class="panel">
          <h3>ScenePilotix 优势 / 风险</h3>
          <ul>${notesHtml}</ul>
        </section>
      </div>
    </div>
  </body>
</html>`;
}

test("offline prompt ab produces screenshots and report inputs", async ({ page }) => {
  const raw = await readFile(fixturesPath, "utf8");
  const cases = JSON.parse(raw) as FixtureCase[];
  await mkdir(artifactDir, { recursive: true });
  await page.setViewportSize({ width: 1660, height: 1280 });

  const results: CaseResult[] = [];

  for (const caseItem of cases) {
    const project = sanitizeProject(JSON.parse(JSON.stringify(caseItem.project)) as Project);
    const pipeline = runPromptPipeline({
      project,
      lang: caseItem.lang,
      platformId: caseItem.platformId,
      scope: caseItem.scope
    });
    const preset = getPlatformPreset(caseItem.platformId);
    const baselinePrompt = buildBaselinePrompt(caseItem);
    const evaluation = evaluateCase(
      caseItem,
      baselinePrompt,
      pipeline.corePrompt,
      pipeline.adaptedPrompt,
      pipeline.metadata.trimmedByBudget
    );
    const screenshot = `${caseItem.id}.png`;

    const result: CaseResult = {
      id: caseItem.id,
      title: caseItem.title,
      description: caseItem.description,
      lang: caseItem.lang,
      platformId: caseItem.platformId,
      platformLabel: caseItem.lang === "zh" ? preset.labelZh : preset.labelEn,
      scope: caseItem.scope,
      userInput: caseItem.userInput.join("\n"),
      baselinePrompt,
      structuredPrompt: pipeline.corePrompt,
      adaptedPrompt: pipeline.adaptedPrompt,
      finalCopyPrompt: pipeline.finalCopyPrompt,
      metadata: pipeline.metadata,
      evaluation,
      screenshot
    };

    await page.setContent(buildScreenshotHtml(result), { waitUntil: "load" });
    await page.screenshot({ path: path.join(artifactDir, screenshot), fullPage: true });
    results.push(result);
  }

  const suite: SuiteResult = {
    generatedAt: new Date().toISOString(),
    caseCount: results.length,
    cases: results,
    summary: {
      scenePilotixBetter: results.filter((item) => item.evaluation.overallConclusion === "ScenePilotix 更好").map((item) => item.id),
      baselineBetter: results.filter((item) => item.evaluation.overallConclusion === "Baseline 更好").map((item) => item.id),
      mixed: results.filter((item) => item.evaluation.overallConclusion === "各有优劣").map((item) => item.id),
      highCompressionRisk: results.filter((item) => item.evaluation.platformCompressionRisk === "高").map((item) => item.id),
      trajectoryWeakCases: results.filter((item) => item.evaluation.trajectoryExpression === "低").map((item) => item.id),
      conflictRiskCases: results.filter((item) => item.evaluation.conflictRisk !== "低").map((item) => item.id)
    }
  };

  await writeFile(resultsPath, JSON.stringify(suite, null, 2), "utf8");
  expect(results).toHaveLength(8);
});
