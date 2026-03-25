#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const templatesRoot = path.join(repoRoot, "templates");
const reportPath = path.join(repoRoot, "docs", "template-scan-report.json");

function pushIssue(list, level, source, message, extra = {}) {
  list.push({
    level,
    source,
    message,
    ...extra
  });
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const names = fs.readdirSync(dirPath);
  return names
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(dirPath, name));
}

function validateFamilyJson(filePath, data, issues) {
  const need = ["id", "name", "mediaType", "storyPlan", "variants"];
  const miss = need.filter((k) => data?.[k] === undefined || data?.[k] === null || data?.[k] === "");
  if (miss.length) {
    pushIssue(issues, "error", "family_json_schema", "missing required fields", {
      file: filePath,
      fields: miss
    });
  }
  if (!Array.isArray(data?.variants)) {
    pushIssue(issues, "error", "family_json_schema", "variants must be array", { file: filePath });
  } else if (data.variants.length === 0) {
    pushIssue(issues, "warn", "family_json_schema", "variants array is empty", { file: filePath });
  }
}

function validateVariantJson(filePath, data, issues) {
  const need = ["id", "familyId", "payloadRef"];
  const miss = need.filter((k) => data?.[k] === undefined || data?.[k] === null || data?.[k] === "");
  if (miss.length) {
    pushIssue(issues, "error", "variant_json_schema", "missing required fields", {
      file: filePath,
      fields: miss
    });
    return;
  }
  const payloadRefPath = path.join(templatesRoot, String(data.payloadRef));
  if (!fs.existsSync(payloadRefPath)) {
    pushIssue(issues, "error", "variant_payload_ref", "payloadRef does not exist", {
      file: filePath,
      payloadRef: data.payloadRef
    });
  }
}

function validatePayloadJson(filePath, data, issues) {
  if (!Array.isArray(data?.scenes)) {
    pushIssue(issues, "error", "payload_json_schema", "scenes must be array", { file: filePath });
    return;
  }
  if (data.scenes.length === 0) {
    pushIssue(issues, "error", "payload_json_schema", "scenes array is empty", { file: filePath });
    return;
  }
  for (let i = 0; i < data.scenes.length; i += 1) {
    const scene = data.scenes[i];
    if (!scene || typeof scene !== "object") {
      pushIssue(issues, "error", "payload_json_schema", "scene item is not object", { file: filePath, sceneIndex: i });
      continue;
    }
    if (!("raw" in scene)) {
      pushIssue(issues, "warn", "payload_json_schema", "scene missing raw", { file: filePath, sceneIndex: i });
    }
  }
}

function scanTemplateJsonSources() {
  const issues = [];
  const familyFiles = listJsonFiles(path.join(templatesRoot, "families"));
  const variantFiles = listJsonFiles(path.join(templatesRoot, "variants"));
  const payloadFiles = listJsonFiles(path.join(templatesRoot, "payloads"));

  for (const f of familyFiles) {
    try {
      const parsed = readJsonFile(f);
      validateFamilyJson(path.relative(repoRoot, f), parsed, issues);
    } catch (error) {
      pushIssue(issues, "error", "family_json_parse", String(error instanceof Error ? error.message : error), {
        file: path.relative(repoRoot, f)
      });
    }
  }

  for (const f of variantFiles) {
    try {
      const parsed = readJsonFile(f);
      validateVariantJson(path.relative(repoRoot, f), parsed, issues);
    } catch (error) {
      pushIssue(issues, "error", "variant_json_parse", String(error instanceof Error ? error.message : error), {
        file: path.relative(repoRoot, f)
      });
    }
  }

  for (const f of payloadFiles) {
    try {
      const parsed = readJsonFile(f);
      validatePayloadJson(path.relative(repoRoot, f), parsed, issues);
    } catch (error) {
      pushIssue(issues, "error", "payload_json_parse", String(error instanceof Error ? error.message : error), {
        file: path.relative(repoRoot, f)
      });
    }
  }

  return {
    source: "templates_json",
    totals: {
      families: familyFiles.length,
      variants: variantFiles.length,
      payloads: payloadFiles.length
    },
    issues
  };
}

function validateEngineIndexItem(item, issues) {
  const required = ["id", "familyId", "variantId"];
  const miss = required.filter((k) => item?.[k] === undefined || item?.[k] === null || item?.[k] === "");
  if (miss.length) {
    pushIssue(issues, "error", "engine_index_schema", "index item missing required fields", {
      templateId: item?.id || "unknown",
      fields: miss
    });
  }
}

function validatePayloadObject(payload, templateId, issues) {
  if (!payload || typeof payload !== "object") {
    pushIssue(issues, "error", "engine_payload_schema", "payload is not object", { templateId });
    return;
  }
  if (!Array.isArray(payload.scenes) || payload.scenes.length === 0) {
    pushIssue(issues, "error", "engine_payload_schema", "payload.scenes missing or empty", { templateId });
  }
}

function createReadOnlyProject() {
  return {
    project: {
      mediaType: "image",
      shotPlan: "single"
    },
    scenes: []
  };
}

async function scanTemplateEngineSources() {
  const issues = [];
  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const indexList = engine.getTemplateIndex();
  const scannedIds = [];

  for (const item of indexList) {
    validateEngineIndexItem(item, issues);
    scannedIds.push(item.id);
    try {
      const payload = await engine.loadTemplatePayloadById(item.id);
      if (!payload) {
        pushIssue(issues, "error", "engine_payload_load", "loadTemplatePayloadById returned null", {
          templateId: item.id
        });
        continue;
      }
      validatePayloadObject(payload, item.id, issues);
      const applyResult = engine.applyPayloadToProject(payload, createReadOnlyProject(), false, "layout_only");
      if (!applyResult?.success) {
        pushIssue(issues, "error", "engine_apply_payload", "applyPayloadToProject returned success=false", {
          templateId: item.id,
          blockReason: applyResult?.blockReason || "unknown"
        });
      }
    } catch (error) {
      pushIssue(issues, "error", "engine_load_or_apply_crash", String(error instanceof Error ? error.message : error), {
        templateId: item.id
      });
    }
  }

  return {
    source: "template_engine",
    totalIndex: indexList.length,
    scannedIds,
    issues
  };
}

function summarizeIssues(jsonScan, engineScan) {
  const allIssues = [...jsonScan.issues, ...engineScan.issues];
  const errorList = allIssues.filter((x) => x.level === "error");
  const warnList = allIssues.filter((x) => x.level === "warn");
  const total = engineScan.totalIndex;
  const errorTemplateIds = new Set(errorList.map((x) => x.templateId).filter(Boolean));
  const warnTemplateIds = new Set(warnList.map((x) => x.templateId).filter(Boolean));
  const error = errorTemplateIds.size;
  const warn = warnTemplateIds.size + warnList.filter((x) => !x.templateId).length;
  const ok = Math.max(0, total - error - Math.min(warnTemplateIds.size, total - error));

  return {
    total,
    ok,
    warn,
    error,
    errors: errorList,
    warnings: warnList
  };
}

async function main() {
  const jsonScan = scanTemplateJsonSources();
  const engineScan = await scanTemplateEngineSources();
  const summary = summarizeIssues(jsonScan, engineScan);
  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    scans: {
      templatesJson: {
        totals: jsonScan.totals
      },
      templateEngine: {
        totalIndex: engineScan.totalIndex
      }
    },
    errors: summary.errors,
    warnings: summary.warnings
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.error > 0) process.exit(2);
}

main().catch((error) => {
  console.error("[template-scan] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
