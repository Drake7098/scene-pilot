#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-prompt-diff-report.json");

const SUBJECT_TOKENS = ["subject", "character", "person", "product", "主体", "角色", "人物", "产品"];
const BACKGROUND_TOKENS = ["background", "environment", "space", "scene", "背景", "环境", "空间", "场景"];
const LAYOUT_TOKENS = ["left", "right", "center", "foreground", "background layer", "layout", "构图", "左", "右", "中", "前景", "后景", "布局"];
const CAMERA_STYLE_CONSTRAINT_TOKENS = [
  "camera", "shot", "lens", "style", "constraint", "negative", "镜头", "景别", "风格", "约束", "负向"
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function jaccardSimilarity(a, b) {
  const sa = tokenize(a);
  const sb = tokenize(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  const inter = new Set([...sa].filter((x) => sb.has(x))).size;
  const uni = new Set([...sa, ...sb]).size;
  return uni === 0 ? 1 : inter / uni;
}

function countTokenHits(text, tokens) {
  const t = normalize(text);
  let n = 0;
  for (const tok of tokens) {
    if (t.includes(normalize(tok))) n += 1;
  }
  return n;
}

function scorePromptStructure(prompt) {
  return {
    subject: countTokenHits(prompt, SUBJECT_TOKENS),
    background: countTokenHits(prompt, BACKGROUND_TOKENS),
    layout: countTokenHits(prompt, LAYOUT_TOKENS),
    cameraStyleConstraint: countTokenHits(prompt, CAMERA_STYLE_CONSTRAINT_TOKENS)
  };
}

function structureGainScore(baseScore, templatedScore) {
  const subjectGain = templatedScore.subject - baseScore.subject;
  const backgroundGain = templatedScore.background - baseScore.background;
  const layoutGain = templatedScore.layout - baseScore.layout;
  const cameraStyleGain = templatedScore.cameraStyleConstraint - baseScore.cameraStyleConstraint;
  return (
    subjectGain * 0.35 +
    backgroundGain * 0.2 +
    layoutGain * 0.3 +
    cameraStyleGain * 0.15
  );
}

function classifyGain(diffScore, similarity) {
  const nearNoGain = diffScore <= 0.5 && similarity >= 0.86;
  if (nearNoGain) return { gainLevel: "lowGain", nearNoGain: true };
  if (diffScore >= 3.0) return { gainLevel: "highGain", nearNoGain: false };
  if (diffScore >= 1.2) return { gainLevel: "mediumGain", nearNoGain: false };
  return { gainLevel: "lowGain", nearNoGain: false };
}

function buildStandardProject(defaultProject) {
  const p = defaultProject();
  if (!p.scenes || p.scenes.length === 0) return p;
  const s = p.scenes[0];
  s.name = "Standard Prompt Diff Scene";
  s.notes = [
    "media: image",
    "A clear primary subject in a controlled interior environment.",
    "主体清晰，背景明确，构图稳定。"
  ].join("\n");
  if (Array.isArray(s.layers) && s.layers[0]) {
    s.layers[0].type = "subject";
    s.layers[0].look = "main subject, red jacket, facing camera";
    s.layers[0].notes = "primary subject";
    s.layers[0].kf = [
      { t: 0, x: 52, y: 54, w: 24, h: 34, rot: 0 },
      { t: 1, x: 52, y: 54, w: 24, h: 34, rot: 0 }
    ];
  }
  return p;
}

function pickScene(project) {
  return Array.isArray(project?.scenes) && project.scenes.length > 0 ? project.scenes[0] : null;
}

async function main() {
  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const model = await import(pathToFileURL(path.join(repoRoot, "src/model.ts")).href);
  const promptEngine = await import(pathToFileURL(path.join(repoRoot, "src/utils/promptEngine.ts")).href);

  const templateIndex = engine.getTemplateIndex();
  const baselineProject = buildStandardProject(model.defaultProject);
  const baselineScene = pickScene(baselineProject);
  if (!baselineScene) throw new Error("baseline scene missing");
  const baselinePrompt = promptEngine.buildPromptForScene({
    project: baselineProject,
    scene: baselineScene,
    lang: "zh",
    platformId: "fal",
    workspace: "pro"
  }).finalCopyPrompt.trim();
  const baselineScore = scorePromptStructure(baselinePrompt);

  const templates = [];
  const suspectTemplates = [];
  let highGain = 0;
  let mediumGain = 0;
  let lowGain = 0;
  let nearNoGain = 0;

  for (const indexItem of templateIndex) {
    try {
      const applyResult = await engine.applyTemplateFromIndex(
        indexItem,
        buildStandardProject(model.defaultProject),
        false,
        "full_workflow"
      );
      if (!applyResult?.success || !applyResult?.appliedProject) {
        templates.push({
          templateId: indexItem.id,
          gainLevel: "lowGain",
          nearNoGain: true,
          diffScore: -1,
          similarity: 1,
          baselinePromptLength: baselinePrompt.length,
          templatedPromptLength: 0,
          error: applyResult?.blockReason || "apply_failed"
        });
        lowGain += 1;
        nearNoGain += 1;
        suspectTemplates.push({
          templateId: indexItem.id,
          reason: "apply_failed"
        });
        continue;
      }

      const scene = pickScene(applyResult.appliedProject);
      if (!scene) {
        templates.push({
          templateId: indexItem.id,
          gainLevel: "lowGain",
          nearNoGain: true,
          diffScore: -1,
          similarity: 1,
          baselinePromptLength: baselinePrompt.length,
          templatedPromptLength: 0,
          error: "no_scene_after_apply"
        });
        lowGain += 1;
        nearNoGain += 1;
        suspectTemplates.push({
          templateId: indexItem.id,
          reason: "no_scene_after_apply"
        });
        continue;
      }

      const templatedPrompt = promptEngine.buildPromptForScene({
        project: applyResult.appliedProject,
        scene,
        lang: "zh",
        platformId: "fal",
        workspace: "pro"
      }).finalCopyPrompt.trim();

      const templatedScore = scorePromptStructure(templatedPrompt);
      const diffScore = Number(structureGainScore(baselineScore, templatedScore).toFixed(3));
      const similarity = Number(jaccardSimilarity(baselinePrompt, templatedPrompt).toFixed(4));
      const gain = classifyGain(diffScore, similarity);

      if (gain.gainLevel === "highGain") highGain += 1;
      else if (gain.gainLevel === "mediumGain") mediumGain += 1;
      else lowGain += 1;
      if (gain.nearNoGain) nearNoGain += 1;

      const detail = {
        templateId: indexItem.id,
        familyId: indexItem.familyId,
        variantId: indexItem.variantId,
        gainLevel: gain.gainLevel,
        nearNoGain: gain.nearNoGain,
        diffScore,
        similarity,
        baselinePromptLength: baselinePrompt.length,
        templatedPromptLength: templatedPrompt.length,
        dimensionDelta: {
          subject: templatedScore.subject - baselineScore.subject,
          background: templatedScore.background - baselineScore.background,
          layout: templatedScore.layout - baselineScore.layout,
          cameraStyleConstraint: templatedScore.cameraStyleConstraint - baselineScore.cameraStyleConstraint
        }
      };
      templates.push(detail);

      if (gain.nearNoGain || gain.gainLevel === "lowGain") {
        suspectTemplates.push({
          templateId: indexItem.id,
          reason: gain.nearNoGain ? "near_no_gain" : "low_gain",
          diffScore,
          similarity
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      templates.push({
        templateId: indexItem.id,
        gainLevel: "lowGain",
        nearNoGain: true,
        diffScore: -1,
        similarity: 1,
        baselinePromptLength: baselinePrompt.length,
        templatedPromptLength: 0,
        error: msg
      });
      lowGain += 1;
      nearNoGain += 1;
      suspectTemplates.push({
        templateId: indexItem.id,
        reason: "runtime_error",
        error: msg
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    standardInput: {
      lang: "zh",
      platformId: "fal",
      workspace: "pro",
      baselinePromptLength: baselinePrompt.length
    },
    summary: {
      total: templateIndex.length,
      highGain,
      mediumGain,
      lowGain,
      nearNoGain,
      suspectTemplates
    },
    templates
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        total: report.summary.total,
        highGain: report.summary.highGain,
        mediumGain: report.summary.mediumGain,
        lowGain: report.summary.lowGain,
        nearNoGain: report.summary.nearNoGain
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[template-prompt-diff] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
