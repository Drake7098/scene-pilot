/**
 * TemplatePayload - full project-level snapshot.
 */

import type { TemplateMediaType, TemplateStoryPlan, TemplateRatio } from "./templateTypes";

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
  /** Layer 1 (user) or Layer 2 (template) camera language id. See cameraLanguageLayers. */
  cameraLanguage?: string;
  constraintStrength?: string;
  lightingSetup?: string;
  backgroundPreset?: string;
  backgroundPromptZh?: string;
  backgroundPromptEn?: string;
  raw?: unknown;
};

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
  raw?: unknown;
};

export type TemplateContinuity = {
  enabled?: boolean;
  characterCarryOver?: boolean;
  directionCarryOver?: boolean;
  cameraCarryOver?: boolean;
  bgCarryOver?: boolean;
  referenceSlots?: unknown[];
};

export type TemplateExportDefaults = {
  range?: string;
  method?: string;
  target?: string;
};

export type TemplatePayload = {
  projectDefaults?: TemplateProjectDefaults;
  scenes: TemplateSceneSnapshot[];
  objects?: TemplateObjectSnapshot[];
  continuity?: TemplateContinuity;
  exportDefaults?: TemplateExportDefaults;
};
