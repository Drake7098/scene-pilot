import type { PlatformProfile } from "../config/platformCapabilities";
import type { PlatformPresetId } from "../config/platformPresets";
import type { SceneCompiler } from "../model";
import type { SceneStrategyLayer } from "../utils/sceneStrategyResolver";

export type PromptWorkspace = "quick" | "pro";
export type PromptEngineId = "IM v5" | "VI V5" | "IM V5P" | "VI V5P";

export type PromptPipelineStage =
  | "compile"
  | "assemble"
  | "append_tail"
  | "adapt_platform"
  | "final_cleanup";

export type PromptExportScope = "current_scene" | "continuous_sequence";

export type PromptPipelineMetadata = {
  platformId: PlatformPresetId;
  baseProfile: PlatformProfile;
  platformEngineKey?: string;
  platformEngineFamily?: string;
  sceneStrategyLayer?: SceneStrategyLayer;
  sceneStrategyClassicIds?: string[];
  sceneStrategyDirectorIds?: string[];
  sceneStrategyUsesAdvancedLanguage?: boolean;
  sceneStrategyUsesLightingDefaults?: boolean;
  sceneStrategyLightingProfileIds?: string[];
  creativeContextSource?: "quick_workspace" | "manual" | "imported" | "none";
  creativeContextHasPrimaryInput?: boolean;
  creativeContextHasSecondaryInput?: boolean;
  creativeContextSubjectLabels?: string[];
  nativeStrategy: boolean;
  mappedFromProfile: PlatformProfile | null;
  mediaMode: "image" | "video";
  compiler: SceneCompiler;
  workspace: PromptWorkspace;
  engineId: PromptEngineId;
  strippedDurationForImage: boolean;
  strippedT1ForImage: boolean;
  strippedVideoScaffoldForImage: boolean;
  compactedForEngine: boolean;
  tailApplied: boolean;
  trimmedByBudget: boolean;
  trimReason: string;
  appliedPatches: string[];
  stages: PromptPipelineStage[];
  enginePasses: string[];
  exportScope: PromptExportScope;
};
