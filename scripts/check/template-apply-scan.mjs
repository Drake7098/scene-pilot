#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, "docs", "template-apply-report.json");

function validateSceneShape(scene) {
  if (!scene || typeof scene !== "object") return false;
  if (!scene.id || typeof scene.id !== "string") return false;
  if (!scene.name || typeof scene.name !== "string") return false;
  if (!Number.isFinite(scene.duration_s) || scene.duration_s <= 0) return false;
  if (!scene.camera || typeof scene.camera !== "object") return false;
  if (!scene.lighting || typeof scene.lighting !== "object") return false;
  if (!Array.isArray(scene.layers)) return false;
  return true;
}

function validateProjectShape(project) {
  if (!project || typeof project !== "object") return false;
  if (!project.project || typeof project.project !== "object") return false;
  if (!Array.isArray(project.scenes) || project.scenes.length === 0) return false;
  for (const scene of project.scenes) {
    if (!validateSceneShape(scene)) return false;
  }
  return true;
}

function pushError(errors, templateId, stage, message, extra = {}) {
  errors.push({
    templateId,
    stage,
    message,
    ...extra
  });
}

async function main() {
  const engine = await import(pathToFileURL(path.join(repoRoot, "src/template-engine/index.ts")).href);
  const creation = await import(pathToFileURL(path.join(repoRoot, "src/lib/projectCreation.ts")).href);
  const model = await import(pathToFileURL(path.join(repoRoot, "src/model.ts")).href);

  const indexList = engine.getTemplateIndex();
  const errors = [];
  const warns = [];
  let ok = 0;

  for (const item of indexList) {
    const templateId = item.id;
    try {
      const created = await creation.createProjectFromTemplate(item, { applyMode: "full_workflow" });
      if (!validateProjectShape(created)) {
        pushError(errors, templateId, "createProjectFromTemplate", "invalid project structure after create");
        continue;
      }
      if (!created?.meta?.sourceTemplateId) {
        warns.push({
          templateId,
          stage: "createProjectFromTemplate",
          message: "sourceTemplateId missing in project meta"
        });
      }

      const base = model.defaultProject();
      const applied = await engine.applyTemplateFromIndex(item, base, false, "layout_only");
      if (!applied?.success) {
        pushError(errors, templateId, "applyTemplateFromIndex", "apply returned success=false", {
          blockReason: applied?.blockReason || "unknown"
        });
        continue;
      }
      if (!applied.appliedProject || !validateProjectShape(applied.appliedProject)) {
        pushError(errors, templateId, "applyTemplateFromIndex", "appliedProject missing or invalid");
        continue;
      }

      ok += 1;
    } catch (error) {
      pushError(
        errors,
        templateId,
        "runtime",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: indexList.length,
      ok,
      warn: warns.length,
      error: errors.length,
      errors
    },
    errors,
    warnings: warns
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
  if (errors.length > 0) process.exit(2);
}

main().catch((error) => {
  console.error("[template-apply-scan] FAIL", error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
