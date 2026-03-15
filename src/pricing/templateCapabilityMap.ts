/**
 * Field capability mapping for template complexity scoring.
 * Free = +0, mid = +1, advanced/director = +2.
 * Used only by templateComplexityScorer; no schema/engine changes.
 */

// ---- Shot ----
const SHOT_FREE = new Set([
  "wide",
  "medium",
  "close",
  "establishing"
]);

const SHOT_MID = new Set([
  "extreme_close",
  "over_shoulder",
  "pov",
  "insert_closeup",
  "dutch_angle"
]);

// ---- Movement ----
const MOVEMENT_FREE = new Set([
  "static",
  "slow_push_in",
  "handheld"
]);

const MOVEMENT_MID = new Set([
  "slow_pull_out",
  "pan_left",
  "pan_right",
  "tilt_up",
  "tilt_down",
  "orbit"
]);

// ---- Lighting time ----
const LIGHT_TIME_FREE = new Set(["day", "sunset", "night"]);

const LIGHT_TIME_MID = new Set([
  "golden_hour",
  "blue_hour",
  "mysterious",
  "dark",
  "cold",
  "rim_light",
  "noir"
]);

// ---- Key dir ----
const KEY_DIR_FREE = new Set(["top_left", "top_right", "backlight"]);

// ---- Mood ----
const MOOD_FREE = new Set(["cinematic", "bright", "warm"]);

// ---- Camera language: Layer1 = mid (+1). Layer2 (hidden) = +2, resolved in scorer via isHiddenCameraLanguage. ----
const CAMERA_LANGUAGE_LAYER1 = new Set([
  "realistic_restrained",
  "commercial_ad",
  "cinematic_narrative",
  "dialogue_cover",
  "product_quality",
  "emotional_pressure",
  "suspense_atmosphere",
  "anime_dramatic",
  "premium_blockbuster",
  "social_direct"
]);

// ---- Image classic mode ----
const IMAGE_CLASSIC_FREE = new Set(["poster_center", "cinematic_still"]);
const IMAGE_CLASSIC_MID = new Set([
  "premium_product",
  "duo_tension",
  "lonely_env",
  "dream_portrait"
]);

// ---- Video classic mode: basic = mid, advanced = +2 ----
const VIDEO_CLASSIC_MID = new Set([
  "steady_dialogue",
  "emotion_push",
  "suspense_watch",
  "character_trail",
  "relationship_standoff"
]);

const VIDEO_CLASSIC_ADVANCED = new Set([
  "hero_entry",
  "dream_memory",
  "truth_reveal",
  "premium_commercial",
  "rhythm_transition",
  "first_person_impact",
  "mystery_reveal"
]);

// ---- Transition ----
const TRANSITION_MID = new Set(["reverse_angle", "dissolve"]);
const TRANSITION_ADVANCED = new Set(["camera_continues", "time_jump"]);

// ---- Director pack: any non-empty = +2 ----
// Ids from directorStylePacks.ts
const DIRECTOR_PACK_IDS = new Set([
  "architectural_tension",
  "intimate_observation",
  "industrial_epic",
  "kinetic_pursuit",
  "poetic_restraint",
  "commercial_spectacle"
]);

export const CAPABILITY_MAP = {
  shotFree: SHOT_FREE,
  shotMid: SHOT_MID,
  movementFree: MOVEMENT_FREE,
  movementMid: MOVEMENT_MID,
  lightTimeFree: LIGHT_TIME_FREE,
  lightTimeMid: LIGHT_TIME_MID,
  keyDirFree: KEY_DIR_FREE,
  moodFree: MOOD_FREE,
  cameraLanguageLayer1: CAMERA_LANGUAGE_LAYER1,
  imageClassicFree: IMAGE_CLASSIC_FREE,
  imageClassicMid: IMAGE_CLASSIC_MID,
  videoClassicMid: VIDEO_CLASSIC_MID,
  videoClassicAdvanced: VIDEO_CLASSIC_ADVANCED,
  transitionMid: TRANSITION_MID,
  transitionAdvanced: TRANSITION_ADVANCED,
  directorPackIds: DIRECTOR_PACK_IDS
} as const;

export function isShotFree(shot: string): boolean {
  return SHOT_FREE.has(shot?.toLowerCase() ?? "");
}

export function isShotMid(shot: string): boolean {
  return SHOT_MID.has(shot?.toLowerCase() ?? "");
}

export function isMovementFree(movement: string): boolean {
  return MOVEMENT_FREE.has(movement?.toLowerCase() ?? "");
}

export function isMovementMid(movement: string): boolean {
  return MOVEMENT_MID.has(movement?.toLowerCase() ?? "");
}

export function isLightTimeFree(time: string): boolean {
  return LIGHT_TIME_FREE.has(time?.toLowerCase() ?? "");
}

export function isLightTimeMid(time: string): boolean {
  return LIGHT_TIME_MID.has(time?.toLowerCase() ?? "");
}

export function isKeyDirFree(keyDir: string): boolean {
  return KEY_DIR_FREE.has(keyDir?.toLowerCase() ?? "");
}

export function isMoodFree(mood: string): boolean {
  return MOOD_FREE.has(mood?.toLowerCase() ?? "");
}

export function isCameraLanguageLayer1(id: string): boolean {
  return CAMERA_LANGUAGE_LAYER1.has(id?.toLowerCase() ?? "");
}

export function isImageClassicFree(id: string): boolean {
  return IMAGE_CLASSIC_FREE.has(id?.toLowerCase() ?? "");
}

export function isImageClassicMid(id: string): boolean {
  return IMAGE_CLASSIC_MID.has(id?.toLowerCase() ?? "");
}

export function isVideoClassicMid(id: string): boolean {
  return VIDEO_CLASSIC_MID.has(id?.toLowerCase() ?? "");
}

export function isVideoClassicAdvanced(id: string): boolean {
  return VIDEO_CLASSIC_ADVANCED.has(id?.toLowerCase() ?? "");
}

export function isTransitionMid(tt: string): boolean {
  return TRANSITION_MID.has(tt?.toLowerCase() ?? "");
}

export function isTransitionAdvanced(tt: string): boolean {
  return TRANSITION_ADVANCED.has(tt?.toLowerCase() ?? "");
}

export function isDirectorPack(id: string): boolean {
  return DIRECTOR_PACK_IDS.has(id?.toLowerCase() ?? "");
}
