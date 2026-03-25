#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const keepReportPath = path.join(repoRoot, "docs", "template-keep-filter-report.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildStandardProject(defaultProject) {
  const p = defaultProject();
  if (!Array.isArray(p?.scenes) || p.scenes.length === 0) return p;
  const s = p.scenes[0];
  s.name = "Keep Template Analysis Baseline";
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

function summarizePayload(payload) {
  const scenes = Array.isArray(payload?.scenes) ? payload.scenes : [];
  const objects = Array.isArray(payload?.objects) ? payload.objects : [];
  const first = scenes[0] || {};
  const raw = first?.raw && typeof first.raw === "object" ? first.raw : {};
  return {
    projectDefaults: payload?.projectDefaults || {},
    scenesCount: scenes.length,
    firstScene: {
      nameZh: first?.nameZh || "",
      nameEn: first?.nameEn || "",
      duration: first?.duration || null,
      cameraLanguage: first?.cameraLanguage || "",
      constraintStrength: first?.constraintStrength || "",
      backgroundPreset: first?.backgroundPreset || "",
      lightingSetup: first?.lightingSetup || "",
      rawSummary: {
        id: raw?.id || "",
        name: raw?.name || "",
        duration_s: raw?.duration_s || null,
        camera: raw?.camera || {},
        lighting: raw?.lighting || {},
        layersCount: Array.isArray(raw?.layers) ? raw.layers.length : 0,
        notes: raw?.notes || ""
      }
    },
    objectsCount: objects.length,
    objects: objects.map((o) => ({
      id: o?.id || "",
      type: o?.type || "",
      continuityId: o?.continuityId || "",
      appearance: o?.appearance || "",
      tags: o?.tags || []
    })),
    continuity: payload?.continuity || {},
    exportDefaults: payload?.exportDefaults || {}
  };
}

function extractControlSlots(payloadSummary) {
  const first = payloadSummary.firstScene || {};
  const raw = first.rawSummary || {};
  return {
    camera: raw.camera || {},
    light: raw.lighting || {},
    layout: {
      layersCount: raw.layersCount || 0,
      backgroundPreset: first.backgroundPreset || "",
      constraintStrength: first.constraintStrength || ""
    },
    style: {
      cameraLanguage: first.cameraLanguage || "",
      lightingSetup: first.lightingSetup || ""
    },
    promptSlots: {
      sceneNotes: raw.notes || "",
      backgroundPromptZh: first.backgroundPromptZh || "",
      backgroundPromptEn: first.backgroundPromptEn || ""
    }
  };
}

function buildLineDiff(before, after) {
  const a = String(before || "").split(/\r?\n/);
  const b = String(after || "").split(/\r?\n/);
  const max = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < max; i += 1) {
    const left = a[i] ?? "";
    const right = b[i] ?? "";
    if (left === right) {
      if (left.trim()) out.push(`  ${left}`);
      continue;
    }
    if (left.trim()) out.push(`- ${left}`);
    if (right.trim()) out.push(`+ ${right}`);
  }
  return out.join("\n");
}

async function main() {
  const keepReport = readJson(keepReportPath);
  const keepList = Array.isArray(keepReport?.keepList) ? keepReport.keepList : [];
  if (keepList.length !== 1) {
    throw new Error(`keepList expected size=1, got ${keepList.length}`);
  }

  const keepItem = keepList[0];
  const templateId = String(keepItem.templateId || "");
  if (!templateId) throw new Error("keep templateId missing");

  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const model = await import(pathToFileURL(path.join(repoRoot, "src/model.ts")).href);
  const promptEngine = await import(pathToFileURL(path.join(repoRoot, "src/utils/promptEngine.ts")).href);

  const index = engine.getTemplateIndexById(templateId);
  if (!index) throw new Error(`template not found in index: ${templateId}`);
  const payload = await engine.loadTemplatePayloadById(templateId);
  if (!payload) throw new Error(`payload not found: ${templateId}`);

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

  const applyResult = await engine.applyTemplateFromIndex(index, buildStandardProject(model.defaultProject), false, "full_workflow");
  if (!applyResult?.success || !applyResult?.appliedProject) {
    throw new Error(`apply failed: ${applyResult?.blockReason || "unknown"}`);
  }
  const templatedScene = pickScene(applyResult.appliedProject);
  if (!templatedScene) throw new Error("templated scene missing");
  const templatedPrompt = promptEngine.buildPromptForScene({
    project: applyResult.appliedProject,
    scene: templatedScene,
    lang: "zh",
    platformId: "fal",
    workspace: "pro"
  }).finalCopyPrompt.trim();

  const payloadSummary = summarizePayload(payload);
  const slots = extractControlSlots(payloadSummary);
  const detail = {
    templateId,
    templateName: {
      zh: index.nameZh,
      en: index.nameEn
    },
    family: {
      id: index.familyId,
      nameZh: index.familyNameZh,
      nameEn: index.familyNameEn
    },
    category: index.category,
    payloadSummary,
    sceneStructure: {
      appliedScenes: (applyResult.appliedProject.scenes || []).map((s) => ({
        id: s.id,
        name: s.name,
        duration_s: s.duration_s,
        layersCount: Array.isArray(s.layers) ? s.layers.length : 0
      }))
    },
    objectsList: payloadSummary.objects,
    controlSlots: slots,
    promptBefore: baselinePrompt,
    promptAfter: templatedPrompt,
    diff: buildLineDiff(baselinePrompt, templatedPrompt)
  };

  console.log("KEEP TEMPLATE DETAIL");
  console.log(JSON.stringify(detail, null, 2));
}

main().catch((error) => {
  console.error("[template-show-keep] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
