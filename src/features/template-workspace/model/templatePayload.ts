/**
 * TemplatePayload - full project-level snapshot for one-click apply to Pro.
 * Supports projectDefaults, scenes[], objects[], continuity, exportDefaults.
 */

import type { TemplateMediaType, TemplateStoryPlan, TemplateRatio } from "./templateTypes";

// ---- Project defaults ----
export type TemplateProjectDefaults = {
  mediaType?: TemplateMediaType;
  aspectRatio?: TemplateRatio;
  spaceLevel?: string;
  storyPlan?: TemplateStoryPlan;
  workspaceMode?: string;
  sceneCount?: number;
  totalDuration?: number;
  sceneDurations?: number[];
};

// ---- Scene snapshot (per-scene) ----
export type TemplateSceneSnapshot = {
  nameZh?: string;
  nameEn?: string;
  duration?: number;
  sceneChangeMode?: string;
  cameraMoveMode?: string;
  jumpCutMode?: string;
  entryDirection?: string;
  exitDirection?: string;
  objectInheritance?: string;
  lensRecipe?: string;
  classicShot?: string;
  classicMotion?: string;
  directorStylePack?: string;
  proMotions?: string;
  imageProEffects?: string;
  constraintStrength?: string;
  lightingSetup?: string;
  backgroundPreset?: string;
  backgroundPromptZh?: string;
  backgroundPromptEn?: string;
  /** Raw scene structure for applyTemplate (Scene model) */
  raw?: unknown;
};

// ---- Object snapshot (Pro object layer) ----
export type TemplateObjectSnapshot = {
  id: string;
  continuityId?: string;
  type?: string;
  appearance?: string;
  form?: string;
  objectPromptZh?: string;
  objectPromptEn?: string;
  notesZh?: string;
  notesEn?: string;
  tags?: string[];
  zOrder?: number;
  color?: string;
  opacity?: number;
  t0?: unknown;
  t1?: unknown;
  /** Raw layer for compatibility with Layer model */
  raw?: unknown;
};

// ---- Continuity ----
export type TemplateContinuity = {
  enabled?: boolean;
  characterCarryOver?: boolean;
  directionCarryOver?: boolean;
  cameraCarryOver?: boolean;
  bgCarryOver?: boolean;
  referenceSlots?: unknown[];
};

// ---- Export defaults ----
export type TemplateExportDefaults = {
  range?: string;
  method?: string;
  target?: string;
};

// ---- Full payload ----
export type TemplatePayload = {
  projectDefaults?: TemplateProjectDefaults;
  scenes: TemplateSceneSnapshot[];
  objects?: TemplateObjectSnapshot[];
  continuity?: TemplateContinuity;
  exportDefaults?: TemplateExportDefaults;
};
