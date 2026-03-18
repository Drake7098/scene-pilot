import type { Lang } from "../../i18n";
import type { PlatformProfile } from "../../config/platformCapabilities";
import type { PlatformPresetId } from "../../config/platformPresets";
import type { SceneStrategyLayer } from "../sceneStrategyResolver";

export type MediaKind = "image" | "video";

export type PromptSceneStrategyMeta = {
  layer: SceneStrategyLayer;
  classicModeIds: string[];
  directorPackIds: string[];
  usesAdvancedLanguage: boolean;
  usesLightingDefaults: boolean;
  lightingProfileIds: string[];
};

export type PromptCreativeContextMeta = {
  source: "quick_workspace" | "manual" | "imported" | "none";
  fileName?: string;
  hasPrimaryInput: boolean;
  hasSecondaryInput: boolean;
  subjectLabels: string[];
};

export type PlatformAdaptInput = {
  prompt: string;
  profile: PlatformProfile;
  lang: Lang;
  media: MediaKind;
  aspectRatio?: string;
  platformId?: PlatformPresetId;
  sceneStrategy?: PromptSceneStrategyMeta;
  creativeContext?: PromptCreativeContextMeta;
};

export type PlatformAdaptMeta = {
  platformId?: PlatformPresetId;
  baseProfile: PlatformProfile;
  patchApplied: boolean;
  trimmedByBudget: boolean;
  trimReason: string;
  appliedPatches: string[];
  tailCompressed: boolean;
  refsGuidancePatched: boolean;
  density: "default" | "compact";
  engineKey: string;
  engineFamily: string;
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
};

export type PlatformAdaptResult = {
  prompt: string;
  meta: PlatformAdaptMeta;
};

export type PromptPlatformEngine = {
  key: string;
  family: string;
  supports: (input: PlatformAdaptInput) => boolean;
  adapt: (input: PlatformAdaptInput) => PlatformAdaptResult;
};
