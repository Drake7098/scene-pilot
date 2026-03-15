/**
 * Capability tag resolver: map score result to 2–4 display tags for template cards.
 * No schema/engine changes.
 */

import type { TemplateScoreResult } from "./templateComplexityScorer";
import type { TemplatePricingBucket } from "./templatePricingTypes";

/** Display label for template card. Keys used for priority ordering. */
export const CAPABILITY_TAG_DICTIONARY: Record<string, string> = {
  director_pack: "Director Pack",
  director_preset: "Director Preset",
  commercial_style: "Commercial Style",
  suspense_style: "Suspense Style",
  emotional_pressure: "Emotional Pressure",
  blockbuster_look: "Blockbuster Look",
  continuity: "Continuity",
  multi_shot: "Multi-Shot",
  scene_inheritance: "Scene Inheritance",
  advanced_transition: "Advanced Transition",
  premium_camera_language: "Premium Camera Language",
  dynamic_camera: "Dynamic Camera",
  premium_motion: "Premium Motion",
  image_pro_effects: "Image Pro Effects",
  composition_pressure: "Composition Pressure",
  spatial_layering: "Spatial Layering",
  material_focus: "Material Focus",
  cinematic_mood: "Cinematic Mood",
  product_quality: "Product Quality",
  dialogue_coverage: "Dialogue Coverage",
  pov_shot: "POV Shot",
  over_shoulder: "Over-Shoulder",
  noir_mood: "Noir Mood",
  golden_hour: "Golden Hour",
  night_atmosphere: "Night Atmosphere",
  rim_light: "Rim Light",
  camera_language: "Camera Language",
  motion: "Motion",
  lighting_mood: "Lighting Mood"
};

/** Priority order: higher index = lower priority. First matching wins up to 4 tags. */
const TAG_PRIORITY_ORDER: string[] = [
  "director_pack",
  "continuity",
  "image_pro_effects",
  "premium_camera_language",
  "advanced_transition",
  "director_preset",
  "camera_language",
  "premium_motion",
  "lighting_mood",
  "multi_shot",
  "scene_inheritance",
  "dynamic_camera",
  "emotional_pressure",
  "suspense_style",
  "commercial_style",
  "blockbuster_look",
  "cinematic_mood",
  "product_quality",
  "dialogue_coverage",
  "pov_shot",
  "over_shoulder",
  "noir_mood",
  "golden_hour",
  "night_atmosphere",
  "rim_light",
  "composition_pressure",
  "spatial_layering",
  "material_focus",
  "motion"
];

function tagLabel(key: string): string {
  return CAPABILITY_TAG_DICTIONARY[key] ?? key;
}

/**
 * From score result (and bucket), compute which tag keys apply.
 * Does not sort by priority; caller picks 2–4 by priority.
 */
function getApplicableTagKeys(scoreResult: TemplateScoreResult): Set<string> {
  const out = new Set<string>();

  const anyDirectorPack = scoreResult.sceneResults.some((r) => r.hasDirectorPack);
  const anyHiddenCam = scoreResult.sceneResults.some((r) => r.hasHiddenCameraLanguage);
  const anyContinuous = scoreResult.sceneResults.some((r) => r.hasContinuousControls);
  const anyAdvTransition = scoreResult.sceneResults.some((r) => r.hasAdvancedTransition);
  const anyAdvVideo = scoreResult.sceneResults.some((r) => r.hasAdvancedVideoClassic);
  const anyProMotion = scoreResult.sceneResults.some((r) => r.hasProMotion);
  const anyImagePro = scoreResult.sceneResults.some((r) => r.imageProEffectsCount > 0);
  const sceneCount = scoreResult.sceneResults.length;

  if (anyDirectorPack) {
    out.add("director_pack");
    out.add("director_preset");
  }
  if (anyContinuous || sceneCount > 1) out.add("continuity");
  if (sceneCount > 1) {
    out.add("multi_shot");
    if (anyContinuous) out.add("scene_inheritance");
  }
  if (anyImagePro) out.add("image_pro_effects");
  if (anyHiddenCam) out.add("premium_camera_language");
  if (anyAdvTransition) out.add("advanced_transition");

  for (const r of scoreResult.sceneResults) {
    if (r.capabilities.includes("camera_language_layer1")) out.add("camera_language");
    if (r.capabilities.includes("camera_language_layer2")) out.add("premium_camera_language");
    if (r.capabilities.includes("movement_mid") || r.capabilities.includes("movement_other"))
      out.add("dynamic_camera");
    if (r.hasProMotion) out.add("premium_motion");
    if (r.capabilities.includes("video_classic_advanced")) out.add("blockbuster_look");
    if (r.capabilities.includes("video_classic_mid")) {
      out.add("emotional_pressure");
      out.add("dialogue_coverage");
    }
    if (r.capabilities.includes("light_time_mid")) {
      out.add("lighting_mood");
      if (r.capabilities.some((c) => c === "light_time_mid")) out.add("golden_hour");
    }
    if (r.capabilities.includes("image_classic_mid")) out.add("product_quality");
    if (r.capabilities.includes("shot_mid") || r.capabilities.includes("shot_other")) {
      if (r.capabilities.some((c) => c === "shot_mid" || c === "shot_other")) {
        out.add("pov_shot");
        out.add("over_shoulder");
      }
    }
  }

  if (scoreResult.capabilitySummary.includes("light_time_mid")) {
    out.add("golden_hour");
    out.add("night_atmosphere");
    out.add("noir_mood");
    out.add("rim_light");
  }
  if (scoreResult.capabilitySummary.includes("image_pro_effects")) {
    out.add("composition_pressure");
    out.add("spatial_layering");
    out.add("material_focus");
    out.add("cinematic_mood");
  }
  if (anyProMotion) out.add("motion");
  if (anyAdvVideo) out.add("emotional_pressure");
  if (scoreResult.capabilitySummary.includes("suspense_atmosphere") || scoreResult.capabilitySummary.some((c) => c.includes("suspense")))
    out.add("suspense_style");
  if (scoreResult.capabilitySummary.includes("commercial_ad") || scoreResult.capabilitySummary.includes("commercial"))
    out.add("commercial_style");

  return out;
}

/**
 * Resolve 2–4 capability tags for template card display.
 * Uses priority order; returns display labels.
 */
export function resolveCapabilityTags(
  scoreResult: TemplateScoreResult,
  _bucket: TemplatePricingBucket
): string[] {
  const applicable = getApplicableTagKeys(scoreResult);
  const picked: string[] = [];
  for (const key of TAG_PRIORITY_ORDER) {
    if (!applicable.has(key)) continue;
    const label = tagLabel(key);
    if (label && !picked.includes(label)) {
      picked.push(label);
      if (picked.length >= 4) break;
    }
  }
  if (picked.length < 2 && applicable.size > 0) {
    for (const key of applicable) {
      if (picked.length >= 4) break;
      const label = tagLabel(key);
      if (label && !picked.includes(label)) picked.push(label);
    }
  }
  return picked.slice(0, 4);
}
