/**
 * Canonical field keys for rules engine.
 */

export const FIELD_KEYS = {
  PROJECT_MEDIA_TYPE: "project.mediaType",
  PROJECT_STORY_PLAN: "project.storyPlan",
  PROJECT_WORKSPACE_MODE: "project.workspaceMode",
  PROJECT_SCENE_COUNT: "project.sceneCount",
  PROJECT_TOTAL_DURATION: "project.totalDuration",

  SCENE_DURATION: "scene.duration",
  SCENE_CHANGE_MODE: "scene.sceneChangeMode",
  SCENE_CAMERA_MOVE_MODE: "scene.cameraMoveMode",
  SCENE_JUMP_CUT_MODE: "scene.jumpCutMode",
  SCENE_ENTRY_DIRECTION: "scene.entryDirection",
  SCENE_EXIT_DIRECTION: "scene.exitDirection",
  SCENE_OBJECT_INHERITANCE: "scene.objectInheritance",
  SCENE_LENS_RECIPE: "scene.lensRecipe",
  SCENE_CLASSIC_SHOT: "scene.classicShot",
  SCENE_CLASSIC_MOTION: "scene.classicMotion",
  SCENE_DIRECTOR_STYLE_PACK: "scene.directorStylePack",
  SCENE_PRO_MOTIONS: "scene.proMotions",
  SCENE_IMAGE_PRO_EFFECTS: "scene.imageProEffects",
  SCENE_CONSTRAINT_STRENGTH: "scene.constraintStrength",
  SCENE_LIGHTING_SETUP: "scene.lightingSetup",
  SCENE_BACKGROUND_PROMPT: "scene.backgroundPrompt",
  SCENE_BACKGROUND_REF_IMAGE: "scene.backgroundRefImage",

  OBJECT_T0: "object.t0",
  OBJECT_T1: "object.t1",
  OBJECT_REF_IMAGE: "object.refImage",
  OBJECT_NOTES: "object.notes",

  EXPORT_RANGE: "export.range",
  EXPORT_METHOD: "export.method",
  EXPORT_TARGET: "export.target",
} as const;

export type FieldKey = (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];

export const PROJECT_KEYS = {
  mediaType: FIELD_KEYS.PROJECT_MEDIA_TYPE,
  storyPlan: FIELD_KEYS.PROJECT_STORY_PLAN,
  workspaceMode: FIELD_KEYS.PROJECT_WORKSPACE_MODE,
  sceneCount: FIELD_KEYS.PROJECT_SCENE_COUNT,
  totalDuration: FIELD_KEYS.PROJECT_TOTAL_DURATION,
} as const;

export const SCENE_KEYS = {
  duration: FIELD_KEYS.SCENE_DURATION,
  classicShot: FIELD_KEYS.SCENE_CLASSIC_SHOT,
  classicMotion: FIELD_KEYS.SCENE_CLASSIC_MOTION,
  directorStylePack: FIELD_KEYS.SCENE_DIRECTOR_STYLE_PACK,
  proMotions: FIELD_KEYS.SCENE_PRO_MOTIONS,
  imageProEffects: FIELD_KEYS.SCENE_IMAGE_PRO_EFFECTS,
  constraintStrength: FIELD_KEYS.SCENE_CONSTRAINT_STRENGTH,
  lightingSetup: FIELD_KEYS.SCENE_LIGHTING_SETUP,
  backgroundPrompt: FIELD_KEYS.SCENE_BACKGROUND_PROMPT,
  backgroundRefImage: FIELD_KEYS.SCENE_BACKGROUND_REF_IMAGE,
  lensRecipe: FIELD_KEYS.SCENE_LENS_RECIPE,
  sceneChangeMode: FIELD_KEYS.SCENE_CHANGE_MODE,
  entryDirection: FIELD_KEYS.SCENE_ENTRY_DIRECTION,
  exitDirection: FIELD_KEYS.SCENE_EXIT_DIRECTION,
  objectInheritance: FIELD_KEYS.SCENE_OBJECT_INHERITANCE,
  jumpCutMode: FIELD_KEYS.SCENE_JUMP_CUT_MODE,
  cameraMoveMode: FIELD_KEYS.SCENE_CAMERA_MOVE_MODE,
} as const;

export const OBJECT_KEYS = {
  t0: FIELD_KEYS.OBJECT_T0,
  t1: FIELD_KEYS.OBJECT_T1,
} as const;

export const EXPORT_KEYS = {
  range: FIELD_KEYS.EXPORT_RANGE,
  method: FIELD_KEYS.EXPORT_METHOD,
  target: FIELD_KEYS.EXPORT_TARGET,
} as const;
