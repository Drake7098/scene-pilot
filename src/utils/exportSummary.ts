import type { PromptPipelineOutput } from "./promptPipeline";
import type { PlatformPreset } from "../config/platformPresets";

export type ExportSummaryInput = {
  preset: PlatformPreset;
  promptStages: PromptPipelineOutput;
};

export type ExportSummary = {
  target: string;
  baseProfile: string;
  strategyType: "native" | "mapped";
  sceneStrategyLayer: string;
  sceneStrategyClassicIds: string[];
  sceneStrategyDirectorIds: string[];
  exportScope: "current_scene" | "continuous_sequence";
  mediaMode: "image" | "video";
  compiler: "v1" | "v2" | "v3";
  workspace: "quick" | "pro";
  engineId: string;
  imageCleanupApplied: boolean;
  imageVideoScaffoldRemoved: boolean;
  engineCompactionApplied: boolean;
  promptStagesApplied: string[];
  enginePasses: string[];
  stagePromptsReady: boolean;
  tailApplied: boolean;
  budgetTrimmed: boolean;
  trimReason: string;
  appliedPatches: string[];
  refStrategy: string;
};

export function makeExportSummary(input: ExportSummaryInput): ExportSummary {
  const { preset, promptStages } = input;
  const imageCleanupApplied =
    promptStages.metadata.strippedDurationForImage ||
    promptStages.metadata.strippedT1ForImage ||
    promptStages.metadata.strippedVideoScaffoldForImage;
  const stagePromptsReady = Boolean(promptStages.corePrompt && promptStages.adaptedPrompt && promptStages.finalCopyPrompt);
  return {
    target: preset.id,
    baseProfile: preset.baseProfile,
    strategyType: preset.nativeStrategy ? "native" : "mapped",
    sceneStrategyLayer: promptStages.metadata.sceneStrategyLayer ?? "none",
    sceneStrategyClassicIds: promptStages.metadata.sceneStrategyClassicIds ?? [],
    sceneStrategyDirectorIds: promptStages.metadata.sceneStrategyDirectorIds ?? [],
    exportScope: promptStages.metadata.exportScope,
    mediaMode: promptStages.metadata.mediaMode,
    compiler: promptStages.metadata.compiler,
    workspace: promptStages.metadata.workspace,
    engineId: promptStages.metadata.engineId,
    imageCleanupApplied,
    imageVideoScaffoldRemoved: promptStages.metadata.strippedVideoScaffoldForImage,
    engineCompactionApplied: promptStages.metadata.compactedForEngine,
    promptStagesApplied: promptStages.metadata.stages,
    enginePasses: promptStages.metadata.enginePasses,
    stagePromptsReady,
    tailApplied: promptStages.metadata.tailApplied,
    budgetTrimmed: promptStages.metadata.trimmedByBudget,
    trimReason: promptStages.metadata.trimReason,
    appliedPatches: promptStages.metadata.appliedPatches,
    refStrategy: `maxRefsPerObject=${preset.maxRefsPerObject}`
  };
}
