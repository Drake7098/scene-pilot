#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-quality-lint-report.json");

const UNDEFINED_TOKENS = new Set([
  "custom",
  "other",
  "undefined",
  "unknown",
  "misc",
  "未定义",
  "自定义",
  "其他"
]);

const BACKGROUND_TOKENS = ["background", "bg", "backdrop", "environment", "scene", "scenery", "sky", "背景"];
const POLLUTION_TEXT_TOKENS = ["todo", "fixme", "placeholder", "copy me", "待补", "示例占位"];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isUndefinedLike(value) {
  return UNDEFINED_TOKENS.has(normalizeText(value));
}

function isBackgroundLike(value) {
  const t = normalizeText(value);
  if (!t) return false;
  return BACKGROUND_TOKENS.some((k) => t.includes(k));
}

function hasMeaningful(value) {
  const t = String(value || "").trim();
  return t.length > 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function extractRawScenes(payload) {
  const scenes = safeArray(payload?.scenes);
  return scenes
    .map((s) => (s && typeof s === "object" ? s.raw : null))
    .filter((x) => x && typeof x === "object");
}

function classifyLayer(layer) {
  const type = String(layer?.type || "");
  return {
    type,
    undefinedType: !hasMeaningful(type) || isUndefinedLike(type),
    backgroundLike: isBackgroundLike(type)
  };
}

function pickPrimaryLayer(layers) {
  const normalized = safeArray(layers).map((layer) => ({ layer, meta: classifyLayer(layer) }));
  const nonBg = normalized.filter((x) => !x.meta.backgroundLike);
  if (nonBg.length > 0) return nonBg[0];
  return normalized[0] || null;
}

function hasHierarchy(layers) {
  const arr = safeArray(layers);
  if (arr.length < 2) return false;
  const zVals = arr
    .map((l) => Number(l?.z))
    .filter((z) => Number.isFinite(z));
  return zVals.length >= 2 && new Set(zVals).size >= 2;
}

function hasCoreLayoutSignal(layer) {
  const kfs = safeArray(layer?.kf);
  if (kfs.length === 0) return false;
  return kfs.some((kf) => {
    const x = Number(kf?.x);
    const y = Number(kf?.y);
    const w = Number(kf?.w);
    const h = Number(kf?.h);
    return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
  });
}

function collectDeprecatedKeys(obj, prefix = "", out = []) {
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const lk = k.toLowerCase();
    if (lk.includes("legacy") || lk.includes("deprecated")) out.push(p);
    if (v && typeof v === "object" && !Array.isArray(v)) collectDeprecatedKeys(v, p, out);
  }
  return out;
}

function addRule(bucket, code, tier, severity, message, extra = {}) {
  const item = { code, tier, severity, message, ...extra };
  bucket.triggeredRules.push(item);
  if (severity === "error") bucket.errors.push(message);
  else if (severity === "warn") bucket.warnings.push(message);
  else bucket.infos.push(message);
}

function lintTemplateByPayloadAndApply(indexItem, payload, appliedProject) {
  const bucket = {
    templateId: indexItem.id,
    familyId: indexItem.familyId,
    variantId: indexItem.variantId,
    riskLevel: "low",
    highRisk: false,
    warnings: [],
    errors: [],
    infos: [],
    triggeredRules: []
  };

  const rawScenes = extractRawScenes(payload);
  const appliedScenes = safeArray(appliedProject?.scenes);

  if (appliedScenes.length === 0) {
    addRule(
      bucket,
      "CORE_NO_SCENES_AFTER_APPLY",
      "core_strict",
      "error",
      "模板应用后无 scenes，主体存在性无法成立"
    );
  }

  let coreSignals = 0;
  for (let i = 0; i < rawScenes.length; i += 1) {
    const raw = rawScenes[i];
    const layers = safeArray(raw?.layers);
    const nonBgLayers = layers.filter((l) => !isBackgroundLike(l?.type));
    const primary = pickPrimaryLayer(layers);

    if (nonBgLayers.length === 0) {
      addRule(
        bucket,
        "CORE_NO_PRIMARY_SUBJECT",
        "core_strict",
        "error",
        `scene[${i}] 无主对象（仅背景或空层）`
      );
    } else {
      coreSignals += 1;
    }

    if (!primary) {
      addRule(
        bucket,
        "CORE_EMPTY_LAYER_STRUCTURE",
        "core_strict",
        "warn",
        `scene[${i}] layers 为空，主次结构弱`
      );
    } else {
      if (primary.meta.backgroundLike) {
        addRule(
          bucket,
          "CORE_MAIN_OBJECT_MARKED_BACKGROUND",
          "core_strict",
          "error",
          `scene[${i}] 主对象被识别为背景类型`
        );
      }
      if (primary.meta.undefinedType) {
        addRule(
          bucket,
          "CORE_MAIN_OBJECT_TYPE_UNDEFINED",
          "core_strict",
          "warn",
          `scene[${i}] 主对象类型未定义/custom/other`
        );
      } else {
        coreSignals += 1;
      }
      if (!hasCoreLayoutSignal(primary.layer)) {
        addRule(
          bucket,
          "CORE_LAYOUT_RELATION_WEAK",
          "core_strict",
          "warn",
          `scene[${i}] 主对象缺少明确布局关系(kf/尺寸)`
        );
      } else {
        coreSignals += 1;
      }
    }

    if (!hasHierarchy(layers)) {
      addRule(
        bucket,
        "CORE_SCENE_HIERARCHY_WEAK",
        "core_strict",
        "warn",
        `scene[${i}] 主次层级弱（层数或 z 关系不足）`
      );
    } else {
      coreSignals += 1;
    }

    const shot = raw?.camera?.shot;
    const movement = raw?.camera?.movement;
    if (!hasMeaningful(shot) || !hasMeaningful(movement)) {
      addRule(
        bucket,
        "OPT_CAMERA_UNDEFINED",
        "optional_enhancement",
        "info",
        `scene[${i}] 镜头字段未定义（可选项，仅记录）`
      );
    }
    const lighting = raw?.lighting || {};
    if (!hasMeaningful(lighting.time) || !hasMeaningful(lighting.key_dir) || !hasMeaningful(lighting.mood)) {
      addRule(
        bucket,
        "OPT_LIGHTING_UNDEFINED",
        "optional_enhancement",
        "info",
        `scene[${i}] 灯光字段未定义（可选项，仅记录）`
      );
    }
    if (!hasMeaningful(raw?.notes)) {
      addRule(
        bucket,
        "OPT_STYLE_OR_ATMOSPHERE_UNDEFINED",
        "optional_enhancement",
        "info",
        `scene[${i}] 氛围/风格增强未定义（可选项，仅记录）`
      );
    }

    const rawText = JSON.stringify(raw || {}).toLowerCase();
    if (POLLUTION_TEXT_TOKENS.some((t) => rawText.includes(t))) {
      addRule(
        bucket,
        "POLLUTION_COPY_RESIDUE",
        "pollution",
        "warn",
        `scene[${i}] 命中疑似复制残留/占位文本`
      );
    }
  }

  const deprecatedKeys = collectDeprecatedKeys(payload);
  if (deprecatedKeys.length > 0) {
    addRule(
      bucket,
      "POLLUTION_DEPRECATED_FIELDS",
      "pollution",
      "warn",
      "命中 deprecated/legacy 字段",
      { fields: deprecatedKeys.slice(0, 10) }
    );
  }

  if (rawScenes.length === 0) {
    addRule(bucket, "POLLUTION_EMPTY_STRUCTURE_TEMPLATE", "pollution", "warn", "payload 未提供可用 raw scene");
  }

  if (coreSignals <= Math.max(1, rawScenes.length)) {
    addRule(
      bucket,
      "DENSITY_CORE_STRUCTURE_WEAK",
      "structure_density",
      "warn",
      "模板核心结构密度偏弱（主体/关系/布局信号不足）"
    );
  }

  const strictTriggered = bucket.triggeredRules.some((x) => x.tier === "core_strict");
  if (bucket.errors.length > 0) bucket.riskLevel = "high";
  else if (strictTriggered || bucket.warnings.length > 0) bucket.riskLevel = "medium";
  else bucket.riskLevel = "low";
  bucket.highRisk = bucket.riskLevel === "high" || strictTriggered;
  return bucket;
}

function summarize(results) {
  let pass = 0;
  let warn = 0;
  let error = 0;
  let highRisk = 0;
  const rulesTriggered = {};

  for (const item of results) {
    if (item.highRisk) highRisk += 1;
    if (item.errors.length > 0) error += 1;
    else if (item.warnings.length > 0) warn += 1;
    else pass += 1;

    for (const rule of item.triggeredRules) {
      rulesTriggered[rule.code] = (rulesTriggered[rule.code] || 0) + 1;
    }
  }

  return {
    total: results.length,
    pass,
    warn,
    error,
    highRisk,
    rulesTriggered,
    highRiskTemplates: highRisk
  };
}

async function main() {
  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const model = await import(pathToFileURL(path.join(repoRoot, "src/model.ts")).href);

  const indexList = engine.getTemplateIndex();
  const templateResults = [];
  const hardErrors = [];

  for (const indexItem of indexList) {
    try {
      const payload = await engine.loadTemplatePayloadById(indexItem.id);
      if (!payload) {
        templateResults.push({
          templateId: indexItem.id,
          familyId: indexItem.familyId,
          variantId: indexItem.variantId,
          riskLevel: "high",
          highRisk: true,
          warnings: [],
          errors: ["loadTemplatePayloadById returned null"],
          infos: [],
          triggeredRules: [
            {
              code: "CORE_PAYLOAD_LOAD_NULL",
              tier: "core_strict",
              severity: "error",
              message: "模板 payload 加载为空"
            }
          ]
        });
        continue;
      }

      const base = model.defaultProject();
      const applyResult = engine.applyPayloadToProject(payload, base, false, "layout_only");
      if (!applyResult?.success || !applyResult?.appliedProject) {
        templateResults.push({
          templateId: indexItem.id,
          familyId: indexItem.familyId,
          variantId: indexItem.variantId,
          riskLevel: "high",
          highRisk: true,
          warnings: [],
          errors: [applyResult?.blockReason || "applyPayloadToProject failed"],
          infos: [],
          triggeredRules: [
            {
              code: "CORE_APPLY_FAILED",
              tier: "core_strict",
              severity: "error",
              message: "应用链路失败"
            }
          ]
        });
        continue;
      }

      templateResults.push(
        lintTemplateByPayloadAndApply(indexItem, payload, applyResult.appliedProject)
      );
    } catch (error) {
      hardErrors.push({
        templateId: indexItem.id,
        message: error instanceof Error ? error.message : String(error)
      });
      templateResults.push({
        templateId: indexItem.id,
        familyId: indexItem.familyId,
        variantId: indexItem.variantId,
        riskLevel: "high",
        highRisk: true,
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
        infos: [],
        triggeredRules: [
          {
            code: "CORE_RUNTIME_THROW",
            tier: "core_strict",
            severity: "error",
            message: "模板 Lint 运行阶段抛错"
          }
        ]
      });
    }
  }

  const summary = summarize(templateResults);
  const errorList = templateResults
    .filter((x) => x.errors.length > 0)
    .map((x) => ({
      templateId: x.templateId,
      errors: x.errors,
      triggeredRules: x.triggeredRules.filter((r) => r.severity === "error" || r.severity === "warn")
    }));

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      ...summary,
      errorList
    },
    templates: templateResults,
    hardErrors
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        total: summary.total,
        pass: summary.pass,
        warn: summary.warn,
        error: summary.error,
        highRisk: summary.highRisk,
        rulesTriggered: summary.rulesTriggered,
        highRiskTemplates: summary.highRiskTemplates
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[template-quality-lint] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
