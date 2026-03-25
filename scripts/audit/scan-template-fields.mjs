#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const ART_USAGE = path.join(repoRoot, "artifacts", "template-field-usage.json");
const ART_FREQ = path.join(repoRoot, "artifacts", "template-field-frequency.json");
const DOC_SOURCE_MAP = path.join(repoRoot, "docs", "template-rebuild", "phase-t0-field-source-map.md");
const DOC_USAGE = path.join(repoRoot, "docs", "template-rebuild", "phase-t0-template-field-usage.md");
const DOC_DIM = path.join(repoRoot, "docs", "template-rebuild", "phase-t0-control-dimension-map.md");

const DEFINITION_FILES = [
  "src/template-engine/types/templatePayload.ts",
  "src/template-engine/types/templateIndex.ts",
  "src/template-engine/types/templateTypes.ts",
  "src/features/template-workspace/model/templatePayload.ts",
  "src/features/template-workspace/model/templateIndex.ts",
  "src/features/template-workspace/model/templateTypes.ts",
  "src/model.ts"
];

const USAGE_FILES = [
  "src/template-engine/index.ts",
  "src/template-engine/factory/buildTemplatePayload.ts",
  "src/template-engine/factory/unifiedAdapter.ts",
  "src/template-engine/data/families/register400.ts",
  "src/template-engine/apply/applyPayload.ts",
  "src/features/template-workspace/factory/unifiedAdapter.ts",
  "src/features/template-workspace/factory/buildTemplatePayload.ts",
  "src/features/template-workspace/services/templateLoader.ts",
  "src/features/template-workspace/services/templateApplyService.ts",
  "src/features/template-workspace/data/templateIndexData.ts",
  "src/components/PropsPanel.tsx",
  "src/features/pro-workspace/components/ObjectEditorPanel.tsx",
  "src/features/pro-workspace/components/SceneEditorPanel.tsx",
  "src/features/pro-workspace/components/ExportControlPanel.tsx",
  "src/components/ExportPanel.tsx",
  "src/services/promptExportPolicy.ts"
];

const PROMPT_FILES = [
  "src/utils/promptEngine.ts",
  "src/utils/promptPipeline.ts",
  "src/utils/promptCompile.ts",
  "src/utils/prompt.ts",
  "src/utils/adaptivePatch.ts",
  "src/utils/promptEngines/builtin.ts",
  "src/utils/promptEngines/shared.ts",
  "src/utils/promptEngines/scaffoldStrip.ts"
];

const ADVANCED_HINTS = new Set([
  "cameraLanguage",
  "directorStylePack",
  "proMotions",
  "imageProEffects",
  "sceneChangeMode",
  "cameraMoveMode",
  "jumpCutMode",
  "entryDirection",
  "exitDirection",
  "objectInheritance",
  "constraintStrength",
  "lightingSetup",
  "referencePolicy",
  "inheritFromPrevious",
  "inheritBgRefFromPrevious",
  "inheritObjectRefsFromPrevious",
  "transitionType",
  "sceneTier",
  "stability",
  "v2Mode",
  "continuityId"
]);

const PRO_HINTS = new Set([
  "proExportMode",
  "proMotions",
  "proConsoleEnabled",
  "pricingBucketAtCreation"
]);

const HIDDEN_HINTS = ["hidden", "_internal", "internal", "hiddenCount"];
const DEPRECATED_HINTS = ["deprecated", "legacy"];

function readText(relPath) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) return "";
  return fs.readFileSync(abs, "utf8");
}

function walk(obj, visit, pathPrefix = "") {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) walk(obj[i], visit, `${pathPrefix}[${i}]`);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj)) {
    const p = pathPrefix ? `${pathPrefix}.${k}` : k;
    visit(k, v, p);
    walk(v, visit, p);
  }
}

function dimForField(field) {
  const f = field.toLowerCase();
  if (f.includes("camera") || f.includes("shot") || f.includes("lens") || f.includes("zoom") || f.includes("rot")) return "镜头";
  if (f.includes("light") || f === "time" || f.includes("mood") || f.includes("key_dir")) return "光线";
  if (f.includes("space") || f.includes("background") || f.includes("depth") || f.includes("entry") || f.includes("exit")) return "空间";
  if (f.includes("layout") || ["x", "y", "w", "h", "z", "kf", "ratio", "aspectratio", "composition"].includes(f)) return "构图";
  if (f.includes("layer") || f.includes("hierarchy") || f.includes("inherit")) return "层级";
  if (f.includes("object") || f.includes("subject") || f.includes("semantic")) return "语义";
  if (f.includes("material") || f.includes("texture")) return "材质";
  if (f.includes("pose")) return "姿态";
  if (f.includes("style") || f.includes("effect") || f.includes("atmosphere")) return "氛围";
  if (f.includes("detail") || f.includes("appearance") || f.includes("look")) return "细节";
  return "语义";
}

function levelForField(field, optional, files) {
  const lower = field.toLowerCase();
  if ([...DEPRECATED_HINTS].some((x) => lower.includes(x))) return "deprecated";
  if (ADVANCED_HINTS.has(field) || lower.includes("advanced")) return "advanced";
  if (PRO_HINTS.has(field) || lower.includes("pro")) return "pro";
  if (HIDDEN_HINTS.some((x) => lower.includes(x))) return "hidden";
  if (optional) return "optional";
  if (files.some((f) => f.includes("PropsPanel") || f.includes("pro-workspace"))) return "core";
  return "core";
}

function visibilityForLevel(level) {
  if (level === "hidden") return "hidden";
  if (level === "pro") return "pro";
  if (level === "advanced") return "advanced";
  return "public";
}

function usageLevelFromFreq(freq, totalTemplates) {
  if (freq >= Math.ceil(totalTemplates * 0.5)) return "high";
  if (freq >= Math.ceil(totalTemplates * 0.15)) return "medium";
  return "low";
}

function parseFieldDefs() {
  const defs = new Map();
  for (const file of DEFINITION_FILES) {
    const text = readText(file);
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([a-zA-Z_]\w*)\s*(\?)?\s*:\s*([^;]+);/);
      if (!m) continue;
      const [, field, optionalMark, typeRaw] = m;
      if (!defs.has(field)) {
        defs.set(field, {
          fieldKey: field,
          type: typeRaw.trim(),
          optional: optionalMark === "?",
          definedIn: new Set(),
          usedIn: new Set()
        });
      }
      defs.get(field).definedIn.add(file);
    }
  }
  return defs;
}

function fillUsedIn(defs) {
  for (const file of USAGE_FILES) {
    const text = readText(file);
    for (const [field, info] of defs.entries()) {
      const direct = new RegExp(`\\.${field}\\b`);
      const keyLike = new RegExp(`\\b${field}\\s*:`);
      if (direct.test(text) || keyLike.test(text)) info.usedIn.add(file);
    }
  }
}

function buildPromptFieldSet(defs) {
  const set = new Set();
  const texts = PROMPT_FILES.map((f) => [f, readText(f)]);
  for (const [field] of defs.entries()) {
    for (const [, text] of texts) {
      const direct = new RegExp(`\\.${field}\\b`);
      const keyLike = new RegExp(`\\b${field}\\b`);
      if (direct.test(text) || keyLike.test(text)) {
        set.add(field);
        break;
      }
    }
  }
  return set;
}

async function scanTemplatePayloadUsage() {
  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const templateIndex = engine.getTemplateIndex();

  const templateFieldUsage = [];
  const freq = new Map();
  const fieldToTemplates = new Map();

  for (const t of templateIndex) {
    const payload = await engine.loadTemplatePayloadById(t.id);
    const fields = new Set();
    walk(payload, (k) => fields.add(k));
    const list = [...fields].sort();
    templateFieldUsage.push({
      templateId: t.id,
      familyId: t.familyId,
      category: t.category,
      fields: list
    });
    for (const f of list) {
      freq.set(f, (freq.get(f) || 0) + 1);
      if (!fieldToTemplates.has(f)) fieldToTemplates.set(f, []);
      fieldToTemplates.get(f).push(t.id);
    }
  }

  const fieldFrequency = [...freq.entries()]
    .map(([fieldKey, count]) => ({
      fieldKey,
      count,
      templateIds: (fieldToTemplates.get(fieldKey) || []).sort()
    }))
    .sort((a, b) => b.count - a.count || a.fieldKey.localeCompare(b.fieldKey));

  return {
    totalTemplates: templateIndex.length,
    templateFieldUsage,
    fieldFrequency
  };
}

function writeMarkdownSourceMap(rows) {
  const header = [
    "# Phase T0 Field Source Map",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "| fieldKey | level | type | default | visibility | definedIn | usedIn | usedInTemplate | usedInPrompt | usageLevel | notes |",
    "|---|---|---|---|---|---|---|---|---|---|---|"
  ];
  const body = rows.map((r) =>
    `| ${r.fieldKey} | ${r.level} | ${r.type} | ${r.defaultValue} | ${r.visibility} | ${r.definedIn.join("<br/>")} | ${r.usedIn.join("<br/>")} | ${r.usedInTemplate} | ${r.usedInPrompt} | ${r.usageLevel} | ${r.notes} |`
  );
  fs.writeFileSync(DOC_SOURCE_MAP, `${header.concat(body).join("\n")}\n`, "utf8");
}

function writeMarkdownUsage(data) {
  const topUnused = data.fieldFrequency.filter((x) => x.count <= 2).slice(0, 40);
  const lines = [
    "# Phase T0 Template Field Usage",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    `Total templates scanned: ${data.totalTemplates}`,
    `Distinct fields: ${data.fieldFrequency.length}`,
    "",
    "## Top Field Frequency",
    "",
    "| fieldKey | count |",
    "|---|---|"
  ];
  for (const item of data.fieldFrequency.slice(0, 80)) {
    lines.push(`| ${item.fieldKey} | ${item.count} |`);
  }
  lines.push("", "## Low Frequency Fields (<=2 templates)", "", "| fieldKey | count |", "|---|---|");
  for (const item of topUnused) lines.push(`| ${item.fieldKey} | ${item.count} |`);
  fs.writeFileSync(DOC_USAGE, `${lines.join("\n")}\n`, "utf8");
}

function writeMarkdownDimensionMap(rows) {
  const lines = [
    "# Phase T0 Control Dimension Map",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "| dimension | field | engineSupport | templateUse | promptUse | strength | potential | notes |",
    "|---|---|---|---|---|---|---|---|"
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.dimension} | ${r.field} | ${r.engineSupport} | ${r.templateUse} | ${r.promptUse} | ${r.strength} | ${r.potential} | ${r.notes} |`
    );
  }
  fs.writeFileSync(DOC_DIM, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const defs = parseFieldDefs();
  fillUsedIn(defs);
  const promptFieldSet = buildPromptFieldSet(defs);
  const usage = await scanTemplatePayloadUsage();
  const freqMap = new Map(usage.fieldFrequency.map((x) => [x.fieldKey, x.count]));

  const rows = [];
  for (const [fieldKey, info] of [...defs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const freq = freqMap.get(fieldKey) || 0;
    const level = levelForField(fieldKey, info.optional, [...info.definedIn]);
    rows.push({
      fieldKey,
      level,
      type: info.type,
      defaultValue: "-",
      visibility: visibilityForLevel(level),
      definedIn: [...info.definedIn].sort(),
      usedIn: [...info.usedIn].sort(),
      usedInTemplate: freq > 0 ? "yes" : "no",
      usedInPrompt: promptFieldSet.has(fieldKey) ? "yes" : "no",
      usageLevel: usageLevelFromFreq(freq, usage.totalTemplates),
      notes: level === "deprecated" ? "deprecated-hint" : "-"
    });
  }

  const dimensionRows = rows.map((r) => {
    const templateUse = r.usedInTemplate === "yes";
    const promptUse = r.usedInPrompt === "yes";
    const engineSupport = r.usedIn.length > 0 ? "yes" : "no";
    const strength = templateUse && promptUse ? "strong" : templateUse ? "medium" : "weak";
    const potential = templateUse && !promptUse ? "high" : templateUse ? "medium" : "low";
    return {
      dimension: dimForField(r.fieldKey),
      field: r.fieldKey,
      engineSupport,
      templateUse: templateUse ? "yes" : "no",
      promptUse: promptUse ? "yes" : "no",
      strength,
      potential,
      notes: r.level
    };
  }).sort((a, b) => a.dimension.localeCompare(b.dimension) || a.field.localeCompare(b.field));

  const usageJson = {
    generatedAt: new Date().toISOString(),
    totalTemplates: usage.totalTemplates,
    templates: usage.templateFieldUsage
  };
  const freqJson = {
    generatedAt: new Date().toISOString(),
    totalTemplates: usage.totalTemplates,
    frequencies: usage.fieldFrequency
  };

  fs.writeFileSync(ART_USAGE, `${JSON.stringify(usageJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(ART_FREQ, `${JSON.stringify(freqJson, null, 2)}\n`, "utf8");
  writeMarkdownSourceMap(rows);
  writeMarkdownUsage(usage);
  writeMarkdownDimensionMap(dimensionRows);

  console.log(JSON.stringify({
    totalFields: rows.length,
    totalTemplates: usage.totalTemplates,
    frequencyFields: usage.fieldFrequency.length
  }, null, 2));
}

main().catch((error) => {
  console.error("[scan-template-fields] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
