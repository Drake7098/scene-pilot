#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const qualityPath = path.join(repoRoot, "docs", "template-quality-lint-report.json");
const diffPath = path.join(repoRoot, "docs", "template-prompt-diff-report.json");
const applyPath = path.join(repoRoot, "docs", "template-apply-report.json");
const outputPath = path.join(repoRoot, "docs", "template-keep-filter-report-v2.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toMapByTemplateId(list) {
  const m = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    if (item?.templateId) m.set(String(item.templateId), item);
  }
  return m;
}

function hasRule(templateLint, code) {
  return Array.isArray(templateLint?.triggeredRules)
    && templateLint.triggeredRules.some((r) => String(r?.code || "") === code);
}

function classifyTemplate(templateId, diffItem, lintItem) {
  const gainLevel = String(diffItem?.gainLevel || "lowGain");
  const isLowGain = gainLevel === "lowGain";
  const isMediumGain = gainLevel === "mediumGain";
  const diffScore = Number(diffItem?.diffScore || 0);
  const delta = diffItem?.dimensionDelta || {};
  const idLower = String(templateId || "").toLowerCase();

  const cameraControlStrong = Number(delta.cameraStyleConstraint || 0) > 0;
  const spaceControlStrong = Number(delta.layout || 0) > 0 || Number(delta.background || 0) > 1;
  const lightingControlStrong = !hasRule(lintItem, "OPT_LIGHTING_UNDEFINED");
  const detailControlStrong = Number(delta.subject || 0) > 0;
  const structureControlStrong = idLower.includes("multi_object") || !hasRule(lintItem, "CORE_SCENE_HIERARCHY_WEAK");
  const controlStrengthCount = [
    cameraControlStrong,
    spaceControlStrong,
    lightingControlStrong,
    detailControlStrong,
    structureControlStrong
  ].filter(Boolean).length;

  const hasRealControlIncrement = controlStrengthCount >= 1 && diffScore >= 1.2;
  const controlLanguageWeak = controlStrengthCount === 0;
  const noCameraControl = !cameraControlStrong;
  const noSpaceControl = !spaceControlStrong;
  const noLightingControl = !lightingControlStrong;
  const noDetailControl = !detailControlStrong;
  const subjectWeak =
    hasRule(lintItem, "CORE_NO_PRIMARY_SUBJECT")
    || hasRule(lintItem, "CORE_MAIN_OBJECT_TYPE_UNDEFINED");
  const lintHighRiskNoGain = Boolean(lintItem?.highRisk) && isLowGain;

  // Drop only when "most" negative conditions are present.
  const dropConditions = [
    isLowGain,
    controlLanguageWeak,
    noCameraControl,
    noSpaceControl,
    noLightingControl,
    noDetailControl,
    subjectWeak,
    lintHighRiskNoGain
  ];
  const dropScore = dropConditions.filter(Boolean).length;
  if (dropScore >= 6) {
    const reasons = [];
    if (isLowGain) reasons.push("lowGain");
    if (controlLanguageWeak) reasons.push("控制语言弱");
    if (noCameraControl) reasons.push("无镜头控制");
    if (noSpaceControl) reasons.push("无空间控制");
    if (noLightingControl) reasons.push("无光线控制");
    if (noDetailControl) reasons.push("无细节控制");
    if (subjectWeak) reasons.push("主体弱");
    if (lintHighRiskNoGain) reasons.push("lint highRisk 且无有效增益");
    return {
      decision: "drop",
      reason: reasons.join(" + "),
      gainLevel
    };
  }

  // Keep if any control dimension is clearly strong, or mediumGain has real control increment.
  const keepReasons = [];
  if (cameraControlStrong) keepReasons.push("镜头控制强");
  if (spaceControlStrong) keepReasons.push("空间控制强");
  if (lightingControlStrong) keepReasons.push("光线/氛围控制强");
  if (detailControlStrong) keepReasons.push("细节控制强");
  if (structureControlStrong) keepReasons.push("结构控制强");
  if (isMediumGain && hasRealControlIncrement) keepReasons.push("mediumGain 且有真实控制增量");
  if (keepReasons.length > 0) {
    return {
      decision: "keep",
      reason: keepReasons.join(" + "),
      gainLevel
    };
  }

  // Otherwise revise.
  return {
    decision: "revise",
    reason: isMediumGain
      ? "mediumGain 但控制力不够强"
      : "有一定控制语言但不完整",
    gainLevel
  };
}

function main() {
  const quality = readJson(qualityPath);
  const diff = readJson(diffPath);
  const apply = readJson(applyPath);

  const lintMap = toMapByTemplateId(quality?.templates || []);
  const diffList = Array.isArray(diff?.templates) ? diff.templates : [];

  const keepList = [];
  const reviseList = [];
  const dropList = [];

  for (const diffItem of diffList) {
    const templateId = String(diffItem?.templateId || "");
    if (!templateId) continue;
    const lintItem = lintMap.get(templateId) || {
      templateId,
      riskLevel: "medium",
      highRisk: false,
      warnings: ["missing_lint_record"],
      errors: [],
      triggeredRules: []
    };
    const decision = classifyTemplate(templateId, diffItem, lintItem);
    const row = {
      templateId,
      gainLevel: decision.gainLevel,
      reason: decision.reason
    };
    if (decision.decision === "keep") keepList.push(row);
    else if (decision.decision === "revise") reviseList.push(row);
    else dropList.push(row);
  }

  const total = diffList.length;
  const report = {
    generatedAt: new Date().toISOString(),
    policy: {
      mode: "control_priority",
      statement: "本版按控制力优先筛选，不以对象数量作为主要标准。"
    },
    inputs: {
      qualityReport: "docs/template-quality-lint-report.json",
      diffReport: "docs/template-prompt-diff-report.json",
      applyReport: "docs/template-apply-report.json",
      previousFilterReport: "docs/template-keep-filter-report.json",
      applySummary: apply?.summary || null
    },
    summary: {
      total,
      keep: keepList.length,
      revise: reviseList.length,
      drop: dropList.length
    },
    total,
    keep: keepList.length,
    revise: reviseList.length,
    drop: dropList.length,
    keepList,
    reviseList,
    dropList
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        total: report.total,
        keep: report.keep,
        revise: report.revise,
        drop: report.drop
      },
      null,
      2
    )
  );
}

main();
