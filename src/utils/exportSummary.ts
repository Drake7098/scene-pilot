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
  mediaMode: "image" | "video";
  compiler: "v1" | "v2";
  imageCleanupApplied: boolean;
  promptStagesApplied: string[];
  stagePromptsReady: boolean;
  tailApplied: boolean;
  budgetTrimmed: boolean;
  trimReason: string;
  appliedPatches: string[];
  refStrategy: string;
};

export function makeExportSummary(input: ExportSummaryInput): ExportSummary {
  const { preset, promptStages } = input;
  const imageCleanupApplied = promptStages.metadata.strippedDurationForImage || promptStages.metadata.strippedT1ForImage;
  const stagePromptsReady = Boolean(promptStages.corePrompt && promptStages.adaptedPrompt && promptStages.finalCopyPrompt);
  return {
    target: preset.id,
    baseProfile: preset.baseProfile,
    strategyType: preset.nativeStrategy ? "native" : "mapped",
    mediaMode: promptStages.metadata.mediaMode,
    compiler: promptStages.metadata.compiler,
    imageCleanupApplied,
    promptStagesApplied: promptStages.metadata.stages,
    stagePromptsReady,
    tailApplied: promptStages.metadata.tailApplied,
    budgetTrimmed: promptStages.metadata.trimmedByBudget,
    trimReason: promptStages.metadata.trimReason,
    appliedPatches: promptStages.metadata.appliedPatches,
    refStrategy: `maxRefsPerObject=${preset.maxRefsPerObject}`
  };
}
