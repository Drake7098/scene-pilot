import type { PlatformProfile } from "../config/platformCapabilities";
import type { PlatformPresetId } from "../config/platformPresets";
import type { SceneCompiler } from "../model";

export type PromptPipelineStage =
  | "compile"
  | "assemble"
  | "append_tail"
  | "adapt_platform"
  | "final_cleanup";

export type PromptPipelineMetadata = {
  platformId: PlatformPresetId;
  baseProfile: PlatformProfile;
  nativeStrategy: boolean;
  mappedFromProfile: PlatformProfile | null;
  mediaMode: "image" | "video";
  compiler: SceneCompiler;
  strippedDurationForImage: boolean;
  strippedT1ForImage: boolean;
  tailApplied: boolean;
  trimmedByBudget: boolean;
  trimReason: string;
  appliedPatches: string[];
  stages: PromptPipelineStage[];
};
