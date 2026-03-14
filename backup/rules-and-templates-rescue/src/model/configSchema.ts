/**
 * Unified config model for rules engine.
 * Maps from Project/Scene/Layer to canonical field keys.
 */

export type MediaType = "image" | "video";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type SpaceLevel = "indoor" | "small_plaza" | "open_space";
export type StoryPlan = "single" | "multicam" | "continuous" | "edit";
export type WorkspaceMode = "quick" | "pro";

export type ProjectConfig = {
  name: string;
  mediaType: MediaType;
  aspectRatio: AspectRatio;
  spaceLevel: SpaceLevel;
  storyPlan: StoryPlan;
  sceneCount: number;
  totalDuration?: number | null;
  sceneDurations?: number[];
  workspaceMode: WorkspaceMode;
};

export type SceneChangeMode = "same_place" | "multi_place";
export type CameraMoveMode = "switch_only" | "continuous_move";
export type JumpCutMode = "allow" | "disallow";

export type Direction8 =
  | "auto"
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

export type ObjectInheritance = "on" | "off";

export type ClassicShot =
  | "auto"
  | "wide"
  | "full"
  | "medium"
  | "close"
  | "close_up"
  | "extreme_close";

export type ClassicMotion =
  | "static"
  | "push_in"
  | "pull_out"
  | "pan"
  | "tilt"
  | "truck"
  | "orbit"
  | "handheld";

export type ConstraintStrength = "off" | "standard" | "strict";

export type SceneConfig = {
  id: string;
  name: string;
  duration?: number | null;

  sceneChangeMode: SceneChangeMode;
  cameraMoveMode: CameraMoveMode;
  jumpCutMode: JumpCutMode;

  entryDirection?: Direction8;
  exitDirection?: Direction8;
  objectInheritance?: ObjectInheritance;

  classicShot?: ClassicShot;
  classicMotion?: ClassicMotion;
  directorStylePack?: string;
  proMotions?: string[];
  imageProEffects?: string[];
  constraintStrength?: ConstraintStrength;
  lightingSetup?: string;

  backgroundPreset?: string;
  backgroundPrompt?: string;
  backgroundRefImage?: string | null;
};

export type KeyframeRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
};

export type ObjectConfig = {
  id: string;
  type?: string;
  appearance?: string;
  form?: string;
  objectPrompt?: string;
  refImage?: string | null;
  notes?: string;
  quickTags?: string[];
  zOrder?: number;
  color?: string;
  opacity?: number;
  t0: KeyframeRect;
  t1?: KeyframeRect | null;
};

export type ExportRange = "current_scene" | "continuous_sequence";
export type ExportMethod = "quick_copy" | "project_bundle";
export type ExportTarget = string;

export type ExportConfig = {
  range: ExportRange;
  method: ExportMethod;
  target: ExportTarget;
};
