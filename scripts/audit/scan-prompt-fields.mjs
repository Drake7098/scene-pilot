#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const ART_USAGE = path.join(repoRoot, "artifacts", "template-field-usage.json");
const ART_PROMPT_AUDIT = path.join(repoRoot, "artifacts", "prompt-field-audit.json");
const DOC_PIPELINE = path.join(repoRoot, "docs", "template-rebuild", "phase-t05-prompt-pipeline-map.md");
const DOC_AUDIT = path.join(repoRoot, "docs", "template-rebuild", "phase-t05-prompt-field-audit.md");
const DOC_UNUSED = path.join(repoRoot, "docs", "template-rebuild", "phase-t05-high-value-unused-fields.md");

const PIPELINE_FILES = [
  "src/utils/promptEngine.ts",
  "src/utils/promptPipeline.ts",
  "src/utils/promptCompile.ts",
  "src/utils/prompt.ts",
  "src/utils/adaptivePatch.ts",
  "src/utils/promptEngines/builtin.ts",
  "src/utils/promptEngines/shared.ts",
  "src/utils/promptEngines/scaffoldStrip.ts",
  "src/features/pro-workspace/components/ExportControlPanel.tsx",
  "src/features/pro-workspace/components/PlatformAdaptPanel.tsx",
  "src/features/pro-workspace/components/PromptPreviewPanel.tsx",
  "src/features/pro-workspace/components/ExportGenerateSection.tsx",
  "src/services/providerGatewayService.ts"
];

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function readText(relPath) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) return "";
  return fs.readFileSync(abs, "utf8");
}

function dimForField(field) {
  const f = field.toLowerCase();
  if (f.includes("camera") || f.includes("shot") || f.includes("lens") || f.includes("zoom") || f.includes("rot")) return "camera";
  if (f.includes("light") || f === "time" || f.includes("mood") || f.includes("key_dir")) return "light";
  if (f.includes("space") || f.includes("background") || f.includes("depth") || f.includes("entry") || f.includes("exit")) return "space";
  if (f.includes("layout") || ["x", "y", "w", "h", "z", "kf", "ratio", "aspectratio", "composition"].includes(f)) return "layout";
  if (f.includes("object") || f.includes("subject") || f.includes("semantic")) return "semantic";
  if (f.includes("material") || f.includes("texture")) return "material";
  if (f.includes("pose")) return "pose";
  if (f.includes("style") || f.includes("effect") || f.includes("atmosphere")) return "atmosphere";
  if (f.includes("detail") || f.includes("appearance") || f.includes("look")) return "detail";
  return "semantic";
}

function findFieldUsageInPipeline(field) {
  const hits = [];
  for (const file of PIPELINE_FILES) {
    const text = readText(file);
    const direct = new RegExp(`\\.${field}\\b`);
    const keyLike = new RegExp(`\\b${field}\\b`);
    if (direct.test(text) || keyLike.test(text)) hits.push(file);
  }
  return hits;
}

function estimateSegment(field) {
  const f = field.toLowerCase();
  if (f.includes("camera") || f.includes("shot")) return "camera";
  if (f.includes("light") || f.includes("mood") || f.includes("time")) return "lighting";
  if (f.includes("layout") || ["x", "y", "w", "h", "z", "ratio"].includes(f)) return "layout";
  if (f.includes("object") || f.includes("subject") || f.includes("appearance") || f.includes("look")) return "subjects";
  if (f.includes("style") || f.includes("effect")) return "style";
  if (f.includes("note") || f.includes("prompt") || f.includes("constraint")) return "constraints";
  return "extras";
}

function writePipelineMap() {
  const lines = [
    "# Phase T0.5 Prompt Pipeline Map",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Prompt Pipeline Entry",
    "- `src/utils/promptEngine.ts`: `buildPromptForScene` / `runPromptEngine`",
    "- `src/features/pro-workspace/components/ExportControlPanel.tsx`: export prompt preview entry",
    "- `src/features/pro-workspace/components/PromptPreviewPanel.tsx`: prompt preview entry",
    "",
    "## Middle Processing",
    "- `src/utils/promptPipeline.ts`: pipeline normalize / split sections / compile",
    "- `src/utils/promptCompile.ts`: compile structured scene text",
    "- `src/utils/adaptivePatch.ts`: adaptive patch and section append",
    "- `src/utils/promptEngines/*`: engine route transform and scaffold trim",
    "",
    "## Field Mapping & Weakening",
    "- Camera/layout/subject fields are mapped through prompt compile sections.",
    "- Optional or advanced fields may be flattened into generic lines depending on route/engine transform.",
    "- Some field detail can be weakened when compacting for specific engines.",
    "",
    "## Provider / Adapter Differences",
    "- `src/utils/promptEngine.ts` + `src/config/platformPresets.ts`: route and engine id selection by workspace/media/profile.",
    "- `src/services/providerGatewayService.ts`: provider payload transport after prompt build."
  ];
  fs.writeFileSync(DOC_PIPELINE, `${lines.join("\n")}\n`, "utf8");
}

function writePromptFieldAuditMd(audit) {
  const lines = [
    "# Phase T0.5 Prompt Field Audit",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "| fieldKey | enterPrompt | builder | segment | format | lostInfo | lossType | strength |",
    "|---|---|---|---|---|---|---|---|"
  ];
  for (const item of audit.fields) {
    lines.push(
      `| ${item.fieldKey} | ${item.enterPrompt} | ${item.builder.join("<br/>")} | ${item.segment} | ${item.format} | ${item.lostInfo} | ${item.lossType} | ${item.strength} |`
    );
  }
  fs.writeFileSync(DOC_AUDIT, `${lines.join("\n")}\n`, "utf8");
}

function writeHighValueUnusedMd(topList) {
  const lines = [
    "# Phase T0.5 High Value Unused Fields",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "| field | location | status | reason | potential | suggestedPhase |",
    "|---|---|---|---|---|---|"
  ];
  for (const item of topList) {
    lines.push(
      `| ${item.field} | ${item.location.join("<br/>")} | ${item.status} | ${item.reason} | ${item.potential} | ${item.suggestedPhase} |`
    );
  }
  fs.writeFileSync(DOC_UNUSED, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const usage = readJson(ART_USAGE);
  const templates = Array.isArray(usage?.templates) ? usage.templates : [];
  const totalTemplates = Number(usage?.totalTemplates || templates.length || 1);

  const freq = new Map();
  for (const t of templates) {
    for (const f of Array.isArray(t.fields) ? t.fields : []) {
      freq.set(f, (freq.get(f) || 0) + 1);
    }
  }

  const fields = [];
  for (const [fieldKey, usedByTemplates] of [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    const builders = findFieldUsageInPipeline(fieldKey);
    const enterPrompt = builders.length > 0 ? "yes" : "no";
    const usageRatio = usedByTemplates / totalTemplates;
    const dim = dimForField(fieldKey);
    let lossType = "none";
    let lostInfo = "no";
    let strength = "strong";

    if (enterPrompt === "no") {
      lostInfo = "yes";
      lossType = "dropped";
      strength = "weak";
    } else if (builders.length <= 1 && usageRatio > 0.2) {
      lostInfo = "partial";
      lossType = "generalized";
      strength = "medium";
    } else if (usageRatio > 0.35 && builders.length <= 2) {
      lostInfo = "partial";
      lossType = "weakened";
      strength = "medium";
    }

    fields.push({
      fieldKey,
      enterPrompt,
      builder: builders,
      segment: estimateSegment(fieldKey),
      format: "text_line",
      lostInfo,
      lossType,
      strength,
      templateUseCount: usedByTemplates,
      usageRatio: Number(usageRatio.toFixed(4)),
      dimension: dim
    });
  }

  const highValueUnused = fields
    .filter((x) => x.enterPrompt === "no" && x.templateUseCount >= Math.max(3, Math.ceil(totalTemplates * 0.08)))
    .map((x) => ({
      field: x.fieldKey,
      location: templates.filter((t) => (t.fields || []).includes(x.fieldKey)).slice(0, 6).map((t) => t.templateId),
      status: "unused_in_prompt",
      reason: `${x.dimension} 维度字段未进入 prompt`,
      potential: x.templateUseCount >= Math.ceil(totalTemplates * 0.2) ? "high" : "medium",
      suggestedPhase: x.dimension === "camera" || x.dimension === "space" || x.dimension === "layout" ? "Phase T1" : "Phase T1.5"
    }))
    .slice(0, 50);

  const audit = {
    generatedAt: new Date().toISOString(),
    totalTemplates,
    fields
  };

  fs.writeFileSync(ART_PROMPT_AUDIT, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  writePipelineMap();
  writePromptFieldAuditMd(audit);
  writeHighValueUnusedMd(highValueUnused.slice(0, 80));

  console.log(
    JSON.stringify(
      {
        auditedFields: fields.length,
        dropped: fields.filter((x) => x.lossType === "dropped").length,
        generalized: fields.filter((x) => x.lossType === "generalized").length,
        weakened: fields.filter((x) => x.lossType === "weakened").length,
        highValueUnused: highValueUnused.length
      },
      null,
      2
    )
  );
}

main();
