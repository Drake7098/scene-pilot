/**
 * Template complexity scorer: extract capabilities from scene(s) and compute score.
 * Uses templateCapabilityMap and content markers; no schema/engine changes.
 */

import type { SceneLikeForPricing, TemplatePricingInput } from "./templatePricingTypes";
import {
  isShotFree,
  isShotMid,
  isMovementFree,
  isMovementMid,
  isLightTimeFree,
  isLightTimeMid,
  isImageClassicFree,
  isImageClassicMid,
  isVideoClassicMid,
  isVideoClassicAdvanced,
  isTransitionMid,
  isTransitionAdvanced,
  isDirectorPack
} from "./templateCapabilityMap";
import { isHiddenCameraLanguage } from "../content/cameraLanguageLayers";
import { parseCameraLanguageId } from "../content/cameraLanguageLayers";
import { parseDirectorStylePackId } from "../content/directorStylePacks";
import {
  parseVideoClassicModeId,
  parseImageClassicModeId,
  parseImageProEffects,
  IMAGE_PRO_EFFECTS
} from "../content/proCreativeModes";
import { parseProMotionSelection } from "../content/proCameraPresets";
import { resolveSceneConfig } from "../model";

const IMAGE_EFFECT_ID_TO_CATEGORY = new Map(
  IMAGE_PRO_EFFECTS.map((e) => [e.id, e.category])
);

function parseMarker(notes: string, mark: string): string {
  const lines = (notes ?? "").split("\n");
  const m = mark.toLowerCase();
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(m));
  return hit ? hit.trim().slice(mark.length).trim() : "";
}

export type SceneScoreResult = {
  score: number;
  capabilities: string[];
  hasDirectorPack: boolean;
  hasHiddenCameraLanguage: boolean;
  hasContinuousControls: boolean;
  hasAdvancedTransition: boolean;
  hasAdvancedVideoClassic: boolean;
  hasAdvancedSceneConfig: boolean;
  hasProMotion: boolean;
  imageProEffectsCount: number;
  imageProEffectsCategories: number;
  videoClassicModeId: string | null;
};

function scoreOneScene(scene: SceneLikeForPricing): SceneScoreResult {
  const notes = scene?.notes ?? "";
  const shot = (scene?.camera?.shot ?? "").toLowerCase();
  const movement = (scene?.camera?.movement ?? "").toLowerCase();
  const time = (scene?.lighting?.time ?? "").toLowerCase();
  const keyDir = (scene?.lighting?.key_dir ?? "").toLowerCase();
  const mood = (scene?.lighting?.mood ?? "").toLowerCase();
  const transitionType = (scene?.transitionType ?? "").toLowerCase();
  const entryDir = scene?.entryDir ?? "";
  const exitDir = scene?.exitDir ?? "";
  const inheritFromPrevious = scene?.inheritFromPrevious === true;

  const capabilities: string[] = [];
  let score = 0;

  // ---- Shot ----
  if (shot) {
    if (isShotMid(shot)) {
      score += 1;
      capabilities.push("shot_mid");
    } else if (!isShotFree(shot)) {
      capabilities.push("shot_other");
    }
  }

  // ---- Movement ----
  if (movement) {
    if (isMovementMid(movement)) {
      score += 1;
      capabilities.push("movement_mid");
    } else if (!isMovementFree(movement)) {
      capabilities.push("movement_other");
    }
  }

  // ---- Lighting time ----
  if (time) {
    if (isLightTimeMid(time)) {
      score += 1;
      capabilities.push("light_time_mid");
    }
  }

  // ---- Camera language (notes) ----
  const cameraLangId = parseCameraLanguageId(notes);
  const hasHiddenCameraLanguage = cameraLangId ? isHiddenCameraLanguage(cameraLangId) : false;
  if (cameraLangId) {
    if (hasHiddenCameraLanguage) {
      score += 2;
      capabilities.push("camera_language_layer2");
    } else {
      score += 1;
      capabilities.push("camera_language_layer1");
    }
  }

  // ---- Image classic mode ----
  const imageClassicId = parseImageClassicModeId(notes);
  if (imageClassicId) {
    if (isImageClassicMid(imageClassicId)) {
      score += 1;
      capabilities.push("image_classic_mid");
    } else if (!isImageClassicFree(imageClassicId)) {
      capabilities.push("image_classic_other");
    }
  }

  // ---- Video classic mode ----
  const videoClassicId = parseVideoClassicModeId(notes);
  const hasAdvancedVideoClassic = videoClassicId ? isVideoClassicAdvanced(videoClassicId) : false;
  if (videoClassicId) {
    if (hasAdvancedVideoClassic) {
      score += 2;
      capabilities.push("video_classic_advanced");
    } else if (isVideoClassicMid(videoClassicId)) {
      score += 1;
      capabilities.push("video_classic_mid");
    }
  }

  // ---- Transition ----
  const hasAdvancedTransition = transitionType ? isTransitionAdvanced(transitionType) : false;
  if (transitionType) {
    if (hasAdvancedTransition) {
      score += 2;
      capabilities.push("transition_advanced");
    } else if (isTransitionMid(transitionType)) {
      score += 1;
      capabilities.push("transition_mid");
    }
  }

  // ---- Director pack ----
  const directorPackId = parseDirectorStylePackId(notes);
  const hasDirectorPack = directorPackId != null && isDirectorPack(directorPackId);
  if (hasDirectorPack) {
    score += 2;
    capabilities.push("director_pack");
  }

  // ---- Image pro effects ----
  const imageEffectIds = parseImageProEffects(notes);
  const imageProEffectsCount = imageEffectIds.length;
  const categories = new Set(imageEffectIds.map((id) => IMAGE_EFFECT_ID_TO_CATEGORY.get(id)).filter(Boolean));
  const imageProEffectsCategories = categories.size;
  if (imageProEffectsCount > 0) {
    const effectScore = imageProEffectsCount >= 3 || imageProEffectsCategories >= 2 ? 2 : 1;
    score += effectScore;
    capabilities.push("image_pro_effects");
  }

  // ---- Continuous controls ----
  const hasContinuousControls =
    entryDir !== "" || exitDir !== "" || inheritFromPrevious;
  if (hasContinuousControls) {
    score += 2;
    capabilities.push("continuous_controls");
  }

  // ---- Advanced scene config (compiler=v2, v2Mode=strict, stability=strict, sceneTier=open_space) ----
  const config = scene?.config;
  const resolved = resolveSceneConfig({
    notes,
    config
  } as Parameters<typeof resolveSceneConfig>[0]);
  const hasAdvancedSceneConfig =
    resolved.compiler === "v2" &&
    resolved.v2Mode === "strict" &&
    resolved.stability === "strict" &&
    resolved.sceneTier === "open_space";
  if (hasAdvancedSceneConfig) {
    score += 2;
    capabilities.push("advanced_scene_config");
  }

  // ---- Professional motion (pro_plus selection) ----
  const motionSelection = parseProMotionSelection(notes);
  const hasProMotion = (motionSelection.proPlusIds?.length ?? 0) > 0;
  if (hasProMotion) {
    score += 2;
    capabilities.push("professional_motion");
  }

  return {
    score,
    capabilities,
    hasDirectorPack,
    hasHiddenCameraLanguage,
    hasContinuousControls,
    hasAdvancedTransition,
    hasAdvancedVideoClassic,
    hasAdvancedSceneConfig,
    hasProMotion,
    imageProEffectsCount,
    imageProEffectsCategories,
    videoClassicModeId: videoClassicId ?? null
  };
}

export type TemplateScoreResult = {
  score: number;
  capabilitySummary: string[];
  sceneResults: SceneScoreResult[];
  multiSceneBonus: number;
  comboBonus: number;
  /** 2 scenes => +1, >=3 scenes => +2. */
  sceneCountBonus: number;
  proFeatureCount: number;
};

/** Count of "Pro" features for bucket rules: director_pack, image_pro_effects, hidden camera language, continuous, advanced transition, advanced video classic, advanced scene config, pro motion. */
function countProFeatures(r: SceneScoreResult): number {
  let n = 0;
  if (r.hasDirectorPack) n += 1;
  if (r.hasHiddenCameraLanguage) n += 1;
  if (r.imageProEffectsCount > 0) n += 1;
  if (r.hasContinuousControls) n += 1;
  if (r.hasAdvancedTransition) n += 1;
  if (r.hasAdvancedVideoClassic) n += 1;
  if (r.hasAdvancedSceneConfig) n += 1;
  if (r.hasProMotion) n += 1;
  return n;
}

export function scoreTemplate(input: TemplatePricingInput): TemplateScoreResult {
  const { scenes, storyPlan, projectShotPlan } = input;
  const sceneResults = scenes.map((s) => scoreOneScene(s));
  const maxSceneScore = sceneResults.length
    ? Math.max(...sceneResults.map((r) => r.score))
    : 0;

  let multiSceneBonus = 0;
  if (scenes.length > 1) {
    const isContinuous =
      projectShotPlan === "continuous" ||
      storyPlan === "continuous";
    const hasInherit = sceneResults.some((r) => r.hasContinuousControls);
    const hasAdvancedTransition = sceneResults.some((r) => r.hasAdvancedTransition);
    if (isContinuous || hasInherit || hasAdvancedTransition) {
      multiSceneBonus = 1;
    }
  }

  /** 2 scenes => +1, >=3 scenes => +2 (final spec). */
  const sceneCountBonus =
    scenes.length === 2 ? 1 : scenes.length >= 3 ? 2 : 0;

  let comboBonus = 0;
  const anyDirectorPack = sceneResults.some((r) => r.hasDirectorPack);
  const anyHiddenCam = sceneResults.some((r) => r.hasHiddenCameraLanguage);
  if (anyDirectorPack && anyHiddenCam) comboBonus += 1;

  const anyContinuous = sceneResults.some((r) => r.hasContinuousControls);
  const anyAdvTransition = sceneResults.some((r) => r.hasAdvancedTransition);
  if (anyContinuous && anyAdvTransition) comboBonus += 1;

  const totalImageEffects = sceneResults.reduce((s, r) => s + r.imageProEffectsCount, 0);
  const maxCategories = Math.max(
    ...sceneResults.map((r) => r.imageProEffectsCategories),
    0
  );
  if (totalImageEffects >= 3 && maxCategories >= 2) comboBonus += 1;

  const anyAdvVideoClassic = sceneResults.some((r) => r.hasAdvancedVideoClassic);
  const anyMovement = sceneResults.some((r) =>
    r.capabilities.some((c) => c === "movement_mid" || c === "movement_other")
  );
  const anyContinuity = sceneResults.some((r) => r.hasContinuousControls);
  if (anyAdvVideoClassic && anyMovement && anyContinuity) comboBonus += 1;

  const score = maxSceneScore + multiSceneBonus + comboBonus + sceneCountBonus;
  const allCaps = [...new Set(sceneResults.flatMap((r) => r.capabilities))];
  const proFeatureCount = sceneResults.reduce((s, r) => s + countProFeatures(r), 0);

  return {
    score,
    capabilitySummary: allCaps,
    sceneResults,
    multiSceneBonus,
    comboBonus,
    sceneCountBonus,
    proFeatureCount
  };
}
