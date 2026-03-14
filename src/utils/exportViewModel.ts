import type { Lang } from "../i18n";
import type { Project, Scene } from "../model";
import { resolveSceneConfig } from "../model";
import type { PlatformPreset } from "../config/platformPresets";
import type { PromptPipelineOutput } from "./promptPipeline";
import type { ExportSummary } from "./exportSummary";
import type { PromptExportScope } from "../types/export";

type Input = {
  lang: Lang;
  scene: Scene | null;
  preset: PlatformPreset;
  pipeline: PromptPipelineOutput;
  summary: ExportSummary;
};

function line(labelZh: string, labelEn: string, value: string, lang: Lang): string {
  return `${lang === "zh" ? labelZh : labelEn}: ${value || "-"}`;
}

function n1(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function formatLayerPosition(scene: Scene, layerIdx: number, lang: Lang): string {
  const layer = scene.layers?.[layerIdx];
  if (!layer) return "";
  const k0 = layer.kf?.find((kf) => kf.t === 0) ?? layer.kf?.[0];
  const k1 = layer.kf?.find((kf) => kf.t === 1) ?? layer.kf?.[layer.kf.length - 1];
  if (!k0) return "";

  const asLine = (prefix: string, kf: typeof k0) =>
    `${prefix} x=${n1(kf.x)} y=${n1(kf.y)} w=${n1(kf.w)} h=${n1(kf.h)} rot=${n1(kf.rot)}`;

  if (!k1 || (k0.x === k1.x && k0.y === k1.y && k0.w === k1.w && k0.h === k1.h && k0.rot === k1.rot)) {
    return lang === "zh"
      ? asLine("位置", k0)
      : asLine("Position", k0);
  }

  return lang === "zh"
    ? `${asLine("起点t0", k0)} | ${asLine("终点t1", k1)}`
    : `${asLine("Start t0", k0)} | ${asLine("End t1", k1)}`;
}

export type ExportInfoRow = {
  label: string;
  value: string;
};

export type ExportMode = "prompt_only" | "package";

export function recommendExportMode(project: Project, sceneIdx: number): ExportMode {
  const scenes = project.scenes ?? [];
  const current = scenes[sceneIdx];
  const shotPlan = project.project?.shotPlan;
  const totalRefs = scenes.reduce((sum, scene) => sum + (scene.layers ?? []).reduce((acc, layer) => acc + (layer.localRefs?.length ?? 0), 0), 0);
  const currentObjects = current?.layers?.length ?? 0;
  const isContinuous = shotPlan === "continuous" && scenes.length > 1;
  const hasManyObjects = currentObjects >= 3;
  const hasManyRefs = totalRefs >= 3;
  return isContinuous || hasManyObjects || hasManyRefs ? "package" : "prompt_only";
}

export function availableExportScopes(project: Project, sceneIdx: number): PromptExportScope[] {
  const scenes = project.scenes ?? [];
  const current = scenes[sceneIdx];
  const shotPlan = project.project?.shotPlan;
  if (!current) return ["current_scene"];
  const isContinuousVideo = shotPlan === "continuous" && resolveSceneConfig(current).mediaMode === "video" && scenes.length - sceneIdx > 1;
  return isContinuousVideo ? ["current_scene", "continuous_sequence"] : ["current_scene"];
}

export function buildExportConfigRows(input: { lang: Lang; preset: PlatformPreset; scope: "current_scene" | "project" }): ExportInfoRow[] {
  const { lang, preset, scope } = input;
  const z = lang === "zh";
  return [
    { label: z ? "当前适用大模型" : "Target Model", value: z ? preset.labelZh : preset.labelEn },
    { label: z ? "基础策略" : "Base Profile", value: preset.baseProfile },
    { label: z ? "策略类型" : "Strategy Type", value: preset.nativeStrategy ? (z ? "原生策略" : "Native") : (z ? "映射策略" : "Mapped") },
    { label: z ? "上传方式" : "Upload Mode", value: preset.uploadMode },
    { label: z ? "提示词风格" : "Prompt Style", value: preset.promptStyle },
    { label: z ? "Refs 上限" : "Refs Limit", value: String(preset.maxRefsPerObject) },
    { label: z ? "导出范围" : "Export Scope", value: scope === "current_scene" ? (z ? "当前分镜" : "Current Scene") : (z ? "项目级" : "Project") }
  ];
}

export function buildSystemProcessRows(input: { lang: Lang; summary: ExportSummary; pipeline: PromptPipelineOutput }): ExportInfoRow[] {
  const { lang, summary, pipeline } = input;
  const z = lang === "zh";
  return [
    { label: z ? "提示词引擎" : "Prompt Engine", value: summary.engineId },
    { label: z ? "工作台" : "Workspace", value: summary.workspace === "pro" ? (z ? "Pro" : "Pro") : (z ? "紧凑" : "Compact") },
    { label: z ? "当前 compiler" : "Compiler", value: summary.compiler },
    { label: z ? "当前 media" : "Media", value: summary.mediaMode },
    { label: z ? "图片清理" : "Image Cleanup", value: summary.imageCleanupApplied ? (z ? "已执行" : "Applied") : (z ? "未执行" : "No") },
    { label: z ? "图片去视频骨架" : "Image Scaffold Strip", value: summary.imageVideoScaffoldRemoved ? (z ? "已执行" : "Applied") : (z ? "未执行" : "No") },
    { label: z ? "引擎压缩" : "Engine Compaction", value: summary.engineCompactionApplied ? (z ? "已执行" : "Applied") : (z ? "未执行" : "No") },
    { label: z ? "结构控制层" : "Machine Tail", value: pipeline.metadata.tailApplied ? (z ? "已追加" : "Applied") : (z ? "未追加" : "No") },
    { label: z ? "预算裁剪" : "Budget Trim", value: summary.budgetTrimmed ? (z ? "已触发" : "Triggered") : (z ? "未触发" : "No") },
    { label: z ? "引擎处理" : "Engine Passes", value: summary.enginePasses.join(", ") || "-" },
    { label: z ? "Patch" : "Patches", value: summary.appliedPatches.join(", ") || "-" }
  ];
}

export function buildUserInputSummary(input: Input): string {
  const { lang, scene } = input;
  if (!scene) return lang === "zh" ? "当前没有可导出的分镜输入。" : "No scene input is available for export.";
  const lines: string[] = [];
  lines.push(lang === "zh" ? "你的输入（当前分镜）" : "Your Input (Current Scene)");
  lines.push("");
  lines.push(line("背景描述", "Background", (scene.notes ?? "").split("\n").find((x) => x.toLowerCase().startsWith("bg:"))?.slice(3)?.trim() || "", lang));
  lines.push(line("分镜备注", "Scene Notes", scene.shotNote ?? "", lang));
  lines.push(line("对象数量", "Objects", String((scene.layers ?? []).length), lang));
  lines.push("");

  (scene.layers ?? []).forEach((layer, idx) => {
    lines.push(lang === "zh" ? `对象 ${idx + 1}｜${layer.id}` : `Object ${idx + 1} | ${layer.id}`);
    lines.push(line("类型", "Type", layer.type ?? "", lang));
    lines.push(line("外观", "Look", layer.look ?? "", lang));
    lines.push(line("形状描述", "Shape Desc", layer.shapeDesc ?? "", lang));
    lines.push(line("对象局部提示词", "Object Local Prompt", layer.externalPrompt ?? "", lang));
    lines.push(line("对象备注与约束", "Object Notes", layer.notes ?? "", lang));
    lines.push(line("布局", "Layout", formatLayerPosition(scene, idx, lang), lang));
    lines.push(line("参考图摘要", "Refs", (layer.localRefs ?? []).map((r) => `${r.type}:${r.name}`).join(", "), lang));
    lines.push("");
  });

  return lines.join("\n").trim();
}

export function buildSystemSummary(input: Input): string {
  const { lang, preset, pipeline, summary } = input;
  const lines: string[] = [];
  lines.push(lang === "zh" ? "系统生成说明" : "System Summary");
  lines.push("");
  lines.push(line("适配策略", "Adaptation Strategy", preset.nativeStrategy ? (lang === "zh" ? "原生策略" : "Native") : (lang === "zh" ? "映射策略" : "Mapped"), lang));
  lines.push(line("基础策略", "Base Profile", summary.baseProfile, lang));
  lines.push(line("提示词引擎", "Prompt Engine", summary.engineId, lang));
  lines.push(line("工作台", "Workspace", summary.workspace === "pro" ? "Pro" : lang === "zh" ? "紧凑" : "Compact", lang));
  lines.push(line("Compiler", "Compiler", summary.compiler, lang));
  lines.push(line("媒体模式", "Media Mode", summary.mediaMode, lang));
  lines.push(line("结构控制层", "Machine Tail", pipeline.metadata.tailApplied ? (lang === "zh" ? "已追加" : "Applied") : (lang === "zh" ? "未追加" : "Not Applied"), lang));
  lines.push(line("图片模式清理", "Image Cleanup", summary.imageCleanupApplied ? (lang === "zh" ? "已执行" : "Applied") : (lang === "zh" ? "未执行" : "Not Applied"), lang));
  lines.push(line("图片去视频骨架", "Image Scaffold Strip", summary.imageVideoScaffoldRemoved ? (lang === "zh" ? "已执行" : "Applied") : (lang === "zh" ? "未执行" : "Not Applied"), lang));
  lines.push(line("引擎压缩", "Engine Compaction", summary.engineCompactionApplied ? (lang === "zh" ? "已执行" : "Applied") : (lang === "zh" ? "未执行" : "Not Applied"), lang));
  lines.push(line("预算裁剪", "Budget Trim", summary.budgetTrimmed ? (lang === "zh" ? "已触发" : "Triggered") : (lang === "zh" ? "未触发" : "Not Triggered"), lang));
  lines.push(line("裁剪原因", "Trim Reason", summary.trimReason, lang));
  lines.push(line("引擎处理", "Engine Passes", summary.enginePasses.join(", "), lang));
  lines.push(line("Patch", "Patches", summary.appliedPatches.join(", "), lang));
  return lines.join("\n").trim();
}
