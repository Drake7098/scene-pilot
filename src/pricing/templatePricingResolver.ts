/**
 * Resolve template score + capabilities to pricing bucket (F0/C1/C2/P2/P3).
 * No schema/engine changes; used by audit and (future) template index.
 */

import type {
  TemplatePricingResult,
  TemplatePricingBucket,
  TemplateAccessTier,
  TemplateCreditPrice
} from "./templatePricingTypes";
import type { TemplateScoreResult } from "./templateComplexityScorer";
import { resolveCapabilityTags } from "./templateCapabilityTags";

/**
 * F0: free
 * - No Pro features, no director_pack, no image_pro_effects, no Layer2 camera language,
 *   no continuous/inherit/entryDir/exitDir, score <= 1.
 */
function isF0(result: TemplateScoreResult): boolean {
  if (result.score > 1) return false;
  const anyPro =
    result.sceneResults.some((r) => r.hasDirectorPack) ||
    result.sceneResults.some((r) => r.hasHiddenCameraLanguage) ||
    result.sceneResults.some((r) => r.imageProEffectsCount > 0) ||
    result.sceneResults.some((r) => r.hasContinuousControls) ||
    result.sceneResults.some((r) => r.hasAdvancedTransition) ||
    result.sceneResults.some((r) => r.hasAdvancedVideoClassic) ||
    result.sceneResults.some((r) => r.hasAdvancedSceneConfig) ||
    result.sceneResults.some((r) => r.hasProMotion);
  return !anyPro;
}

/**
 * C1: credits-only, score 2–3, no Pro features.
 */
function isC1(result: TemplateScoreResult): boolean {
  if (result.proFeatureCount > 0) return false;
  return result.score >= 2 && result.score <= 3;
}

/**
 * C2: credits-only, score >= 4, no Pro features.
 */
function isC2(result: TemplateScoreResult): boolean {
  if (result.proFeatureCount > 0) return false;
  return result.score >= 4;
}

/**
 * P2: one Pro feature, or score 5–6 with advanced director ability.
 */
function isP2(result: TemplateScoreResult): boolean {
  if (result.proFeatureCount === 1) return true;
  if (result.score >= 7) return false; // P3
  if (result.score >= 5 && result.score <= 6) {
    const hasAdvancedDirector =
      result.sceneResults.some((r) => r.hasDirectorPack) ||
      result.sceneResults.some((r) => r.hasHiddenCameraLanguage) ||
      result.sceneResults.some((r) => r.hasAdvancedVideoClassic);
    if (hasAdvancedDirector) return true;
  }
  return false;
}

/**
 * P3: multiple Pro features, or score >= 7, or specific combos:
 * - director_pack + hidden camera language
 * - image_pro_effects >= 3 (count or categories)
 * - continuous + advanced transition
 * - advanced video classic + movement + continuity
 */
function isP3(result: TemplateScoreResult): boolean {
  if (result.proFeatureCount >= 2) return true;
  if (result.score >= 7) return true;

  const anyDirectorPack = result.sceneResults.some((r) => r.hasDirectorPack);
  const anyHiddenCam = result.sceneResults.some((r) => r.hasHiddenCameraLanguage);
  if (anyDirectorPack && anyHiddenCam) return true;

  const totalImageEffects = result.sceneResults.reduce((s, r) => s + r.imageProEffectsCount, 0);
  const maxCategories = Math.max(
    ...result.sceneResults.map((r) => r.imageProEffectsCategories),
    0
  );
  if (totalImageEffects >= 3 || maxCategories >= 3) return true;

  const anyContinuous = result.sceneResults.some((r) => r.hasContinuousControls);
  const anyAdvTransition = result.sceneResults.some((r) => r.hasAdvancedTransition);
  if (anyContinuous && anyAdvTransition) return true;

  const anyAdvVideo = result.sceneResults.some((r) => r.hasAdvancedVideoClassic);
  const anyMovement = result.sceneResults.some((r) =>
    r.capabilities.some((c) => c.includes("movement"))
  );
  const anyContinuity = result.sceneResults.some((r) => r.hasContinuousControls);
  if (anyAdvVideo && anyMovement && anyContinuity) return true;

  return false;
}

function bucketToAccessTier(bucket: TemplatePricingBucket): TemplateAccessTier {
  if (bucket === "F0") return "free";
  if (bucket === "C1" || bucket === "C2") return "credits";
  return "pro_credits";
}

function bucketToCreditPrice(bucket: TemplatePricingBucket): TemplateCreditPrice {
  if (bucket === "F0") return 0;
  if (bucket === "C1") return 1;
  if (bucket === "C2") return 2;
  if (bucket === "P2") return 2;
  return 3; // P3
}

/** Display label for template card / detail. F0 => Free, C1 => 1 Credit, P2 => Pro · 2 Credits, etc. */
export function formatPricingBucketForDisplay(
  bucket: TemplatePricingBucket,
  lang: "zh" | "en"
): string {
  if (bucket === "F0") return lang === "zh" ? "免费" : "Free";
  if (bucket === "C1") return lang === "zh" ? "1 积分" : "1 Credit";
  if (bucket === "C2") return lang === "zh" ? "2 积分" : "2 Credits";
  if (bucket === "P2") return lang === "zh" ? "Pro · 2 积分" : "Pro · 2 Credits";
  if (bucket === "P3") return lang === "zh" ? "Pro · 3 积分" : "Pro · 3 Credits";
  return lang === "zh" ? "免费" : "Free";
}

/** Human-readable capability labels for display (optional). */
export const CAPABILITY_LABELS: Record<string, { zh: string; en: string }> = {
  director_pack: { zh: "导演包", en: "Director Pack" },
  continuous_controls: { zh: "连续镜头", en: "Continuity" },
  camera_language_layer2: { zh: "高级镜头语言", en: "Advanced Camera Language" },
  image_pro_effects: { zh: "专业图片效果", en: "Image Pro Effects" },
  professional_motion: { zh: "高级运动", en: "Premium Motion" },
  video_classic_advanced: { zh: "高级视频模式", en: "Advanced Video Mode" },
  advanced_scene_config: { zh: "高级场景配置", en: "Advanced Scene Config" },
  transition_advanced: { zh: "高级转场", en: "Advanced Transition" }
};

function buildDebugReasons(scoreResult: TemplateScoreResult, bucket: TemplatePricingBucket): string[] {
  const reasons: string[] = [];
  const maxScene = scoreResult.sceneResults.length
    ? Math.max(...scoreResult.sceneResults.map((r) => r.score))
    : 0;

  reasons.push(`score=${scoreResult.score} (maxScene=${maxScene} + multiSceneBonus=${scoreResult.multiSceneBonus} + comboBonus=${scoreResult.comboBonus} + sceneCountBonus=${scoreResult.sceneCountBonus})`);
  reasons.push(`proFeatureCount=${scoreResult.proFeatureCount}`);

  if (scoreResult.sceneResults.some((r) => r.hasDirectorPack)) reasons.push("matched: director_pack");
  if (scoreResult.sceneResults.some((r) => r.hasHiddenCameraLanguage)) reasons.push("matched: hidden_camera_language");
  if (scoreResult.sceneResults.some((r) => r.imageProEffectsCount > 0)) reasons.push("matched: image_pro_effects");
  if (scoreResult.sceneResults.some((r) => r.hasContinuousControls)) reasons.push("matched: continuous_controls");
  if (scoreResult.sceneResults.some((r) => r.hasAdvancedTransition)) reasons.push("matched: advanced_transition");
  if (scoreResult.sceneResults.some((r) => r.hasAdvancedVideoClassic)) reasons.push("matched: advanced_video_classic");
  if (scoreResult.sceneResults.some((r) => r.hasProMotion)) reasons.push("matched: professional_motion");

  reasons.push(`bucket=${bucket} (${bucket === "F0" ? "no pro, score<=1" : bucket === "C1" ? "no pro, score 2-3" : bucket === "C2" ? "no pro, score>=4" : bucket === "P2" ? "1 pro or score 5-6 + advanced" : "multiple pro or score>=7 or combos"})`);

  return reasons;
}

export function resolveTemplatePricing(scoreResult: TemplateScoreResult): TemplatePricingResult {
  let bucket: TemplatePricingBucket;

  if (isF0(scoreResult)) {
    bucket = "F0";
  } else if (isP3(scoreResult)) {
    bucket = "P3";
  } else if (isP2(scoreResult)) {
    bucket = "P2";
  } else if (isC2(scoreResult)) {
    bucket = "C2";
  } else if (isC1(scoreResult)) {
    bucket = "C1";
  } else {
    bucket = "C2";
  }

  const debugReasons = buildDebugReasons(scoreResult, bucket);
  const capabilityTags = resolveCapabilityTags(scoreResult, bucket);

  return {
    accessTier: bucketToAccessTier(bucket),
    creditPrice: bucketToCreditPrice(bucket),
    pricingBucket: bucket,
    score: scoreResult.score,
    capabilityTags,
    debugReasons,
    capabilitySummary: scoreResult.capabilitySummary
  };
}
