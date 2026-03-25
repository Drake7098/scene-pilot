#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const outputPath = path.join(repoRoot, "docs", "template-field-scan-report.json");

const SCOPE_FILES = {
  templateSchema: [
    "src/template-engine/types/templatePayload.ts",
    "src/template-engine/types/templateIndex.ts",
    "src/template-engine/types/templateTypes.ts",
    "src/features/template-workspace/model/templatePayload.ts",
    "src/features/template-workspace/model/templateIndex.ts",
    "src/features/template-workspace/model/templateTypes.ts"
  ],
  sceneSchema: ["src/model.ts"],
  objectSchema: ["src/model.ts"],
  payloadAndTemplateData: [
    "templates-old/payloads",
    "templates-old/families",
    "templates-old/variants",
    "templates-benchmark",
    "templates-experiment",
    "templates-final",
    "templates-online",
    "src/data/templateLibrary400.ts",
    "src/data/templateLibrary600.ts"
  ],
  promptBuild: [
    "src/utils/promptEngine.ts",
    "src/utils/promptPipeline.ts",
    "src/utils/promptCompile.ts"
  ],
  normalizeBuildAdapter: [
    "src/model.ts",
    "src/template-engine/factory/buildTemplatePayload.ts",
    "src/template-engine/factory/unifiedAdapter.ts",
    "src/template-engine/data/families/register400.ts",
    "src/template-engine/apply/applyPayload.ts"
  ],
  generateExport: [
    "src/features/pro-workspace/components/ExportControlPanel.tsx",
    "src/features/pro-workspace/components/ExportGenerateSection.tsx",
    "src/components/ExportPanel.tsx",
    "src/services/promptExportPolicy.ts"
  ],
  proAndAdvancedUi: [
    "src/components/PropsPanel.tsx",
    "src/features/pro-workspace/components/ObjectEditorPanel.tsx",
    "src/features/pro-workspace/components/SceneEditorPanel.tsx",
    "src/features/pro-workspace/components/PlatformAdaptPanel.tsx",
    "src/features/pro-workspace/components/ConstraintInspectorPanel.tsx"
  ]
};

const ADVANCED_FIELD_HINTS = new Set([
  "continuityId",
  "constraintStrength",
  "cameraLanguage",
  "directorStylePack",
  "proMotions",
  "imageProEffects",
  "lensRecipe",
  "sceneChangeMode",
  "cameraMoveMode",
  "jumpCutMode",
  "entryDirection",
  "exitDirection",
  "objectInheritance",
  "referencePolicy",
  "inheritFromPrevious",
  "inheritBgRefFromPrevious",
  "inheritObjectRefsFromPrevious",
  "transitionType",
  "sceneTier",
  "stability",
  "v2Mode"
]);

const PRO_FIELD_HINTS = new Set([
  "proExportMode",
  "proMotions",
  "proConsoleEnabled",
  "pricingBucketAtCreation"
]);

const HIDDEN_FIELD_HINTS = new Set([
  "hidden",
  "_internal",
  "internal",
  "hiddenCount"
]);

const DEPRECATED_HINTS = new Set(["legacy", "deprecated"]);

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function resolvePaths(entry) {
  const abs = path.join(repoRoot, entry);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    const list = fs.readdirSync(cur, { withFileTypes: true });
    for (const d of list) {
      const p = path.join(cur, d.name);
      if (d.isDirectory()) stack.push(p);
      else if (d.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".json"))) out.push(p);
    }
  }
  return out;
}

function addField(map, name, sourcePath, tags = []) {
  const key = String(name || "").trim();
  if (!key) return;
  if (!/^[a-zA-Z_][\w.-]*$/.test(key)) return;
  if (!map.has(key)) {
    map.set(key, {
      field: key,
      files: new Set(),
      tags: new Set(),
      optional: false
    });
  }
  const item = map.get(key);
  item.files.add(sourcePath);
  for (const t of tags) item.tags.add(t);
}

function extractTypeFields(text, sourcePath, map) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([a-zA-Z_]\w*)\s*(\?)?\s*:/);
    if (!m) continue;
    const field = m[1];
    addField(map, field, sourcePath, ["schema"]);
    if (m[2] === "?") {
      map.get(field).optional = true;
    }
  }
}

function extractPropertyAccessFields(text, sourcePath, map) {
  const re = /\b(?:scene|project|layer|payload|object|raw|index|exportDefaults|projectDefaults|lighting|camera)\.([a-zA-Z_]\w*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    addField(map, m[1], sourcePath, ["usage"]);
  }
}

function walkJsonKeys(value, cb) {
  if (Array.isArray(value)) {
    for (const v of value) walkJsonKeys(v, cb);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) {
    cb(k);
    walkJsonKeys(v, cb);
  }
}

function classifyCategory(field) {
  const f = field.toLowerCase();
  if (f.includes("camera") || f.includes("shot") || f.includes("lens") || f.includes("zoom") || f.includes("rot")) return "camera";
  if (f.includes("light") || f === "time" || f.includes("mood") || f.includes("key_dir")) return "light";
  if (f.includes("space") || f.includes("background") || f.includes("sceneTier".toLowerCase()) || f.includes("depth") || f.includes("entry") || f.includes("exit")) return "space";
  if (f.includes("layout") || ["x", "y", "w", "h", "z", "kf", "aspectratio", "ratio", "composition"].includes(f)) return "layout";
  if (f.includes("object") || f.includes("layer") || f.includes("type") || f.includes("appearance") || f.includes("look") || f.includes("continuityid")) return "object";
  if (f.includes("style") || f.includes("director") || f.includes("effect")) return "style";
  if (f.includes("prompt") || f.includes("note") || f.includes("constraint") || f.includes("negative") || f.includes("reference")) return "prompt";
  if (f.includes("advanced")) return "advanced";
  if (f.includes("pro")) return "pro";
  if (f.includes("hidden")) return "hidden";
  return "layout";
}

function classifySource(field, info) {
  const labels = new Set();
  const f = field.toLowerCase();
  if (info.optional) labels.add("optional");
  if (ADVANCED_FIELD_HINTS.has(field) || f.includes("advanced")) labels.add("advanced");
  if (PRO_FIELD_HINTS.has(field) || f.includes("pro")) labels.add("pro");
  if (HIDDEN_FIELD_HINTS.has(field) || f.includes("hidden")) labels.add("hidden");
  if ([...DEPRECATED_HINTS].some((x) => f.includes(x))) labels.add("deprecated");
  if (labels.size === 0) labels.add("core");
  return [...labels];
}

function main() {
  const fieldMap = new Map();
  const scannedFiles = [];

  for (const [scope, entries] of Object.entries(SCOPE_FILES)) {
    for (const entry of entries) {
      const files = resolvePaths(entry);
      for (const absPath of files) {
        const rel = path.relative(repoRoot, absPath);
        scannedFiles.push({ scope, file: rel });
        const text = readText(absPath);
        if (absPath.endsWith(".json")) {
          try {
            const parsed = JSON.parse(text);
            walkJsonKeys(parsed, (k) => addField(fieldMap, k, rel, ["payload"]));
          } catch {
            // ignore invalid json in this read-only scanner
          }
        } else {
          extractTypeFields(text, rel, fieldMap);
          extractPropertyAccessFields(text, rel, fieldMap);
        }
      }
    }
  }

  const categories = {
    camera: [],
    light: [],
    space: [],
    layout: [],
    object: [],
    style: [],
    prompt: [],
    advanced: [],
    pro: [],
    hidden: []
  };

  const fields = [];
  let coreFields = 0;
  let advancedFields = 0;
  let proFields = 0;
  let hiddenFields = 0;

  for (const [field, info] of [...fieldMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sourceLabels = classifySource(field, info);
    const category = classifyCategory(field);
    const item = {
      field,
      category,
      source: sourceLabels,
      files: [...info.files].sort()
    };
    fields.push(item);
    categories[category].push(field);
    if (sourceLabels.includes("core")) coreFields += 1;
    if (sourceLabels.includes("advanced")) advancedFields += 1;
    if (sourceLabels.includes("pro")) proFields += 1;
    if (sourceLabels.includes("hidden")) hiddenFields += 1;
    if (sourceLabels.includes("advanced")) categories.advanced.push(field);
    if (sourceLabels.includes("pro")) categories.pro.push(field);
    if (sourceLabels.includes("hidden")) categories.hidden.push(field);
  }

  for (const k of Object.keys(categories)) {
    categories[k] = [...new Set(categories[k])].sort();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scannedSources: scannedFiles,
    totalFields: fields.length,
    coreFields,
    advancedFields,
    proFields,
    hiddenFields,
    cameraFields: categories.camera,
    lightFields: categories.light,
    spaceFields: categories.space,
    layoutFields: categories.layout,
    objectFields: categories.object,
    styleFields: categories.style,
    promptFields: categories.prompt,
    advancedFieldsList: categories.advanced,
    proFieldsList: categories.pro,
    hiddenFieldsList: categories.hidden,
    categories,
    fields
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        totalFields: report.totalFields,
        coreFields: report.coreFields,
        advancedFields: report.advancedFields,
        proFields: report.proFields,
        hiddenFields: report.hiddenFields
      },
      null,
      2
    )
  );
}

main();
