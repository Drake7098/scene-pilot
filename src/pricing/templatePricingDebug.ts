/**
 * Optional debug output for template pricing (development only).
 * Explains why a template got its bucket, score, and capability tags.
 */

import type { TemplateScoreResult } from "./templateComplexityScorer";
import type { TemplatePricingResult } from "./templatePricingTypes";
import { resolveTemplatePricing } from "./templatePricingResolver";
import { CAPABILITY_LABELS } from "./templatePricingResolver";

export function explainPricing(
  scoreResult: TemplateScoreResult,
  result: TemplatePricingResult,
  lang: "zh" | "en" = "en"
): string {
  const L = lang === "zh";
  const lines: string[] = [];

  lines.push(L ? `模板定价说明` : "Template pricing explanation");
  lines.push(`${L ? "分数" : "Score"}: ${result.score}`);
  lines.push(`${L ? "桶" : "Bucket"}: ${result.pricingBucket} → ${result.accessTier}, ${result.creditPrice} ${L ? "积分" : "credits"}`);
  lines.push("");

  if (result.debugReasons.length) {
    lines.push(L ? "调试原因" : "Debug reasons");
    result.debugReasons.forEach((r) => lines.push(`  ${r}`));
    lines.push("");
  }

  if (result.capabilityTags.length) {
    lines.push(L ? "能力标签" : "Capability tags");
    lines.push(`  ${result.capabilityTags.join(" · ")}`);
    lines.push("");
  }

  lines.push(L ? "场景得分" : "Scene scores");
  scoreResult.sceneResults.forEach((r, i) => {
    lines.push(`  Scene ${i + 1}: ${r.score} - ${r.capabilities.join(", ")}`);
    if (r.hasDirectorPack) lines.push(`    - director_pack`);
    if (r.hasHiddenCameraLanguage) lines.push(`    - hidden camera language`);
    if (r.hasContinuousControls) lines.push(`    - continuous (entry/exit/inherit)`);
    if (r.hasAdvancedTransition) lines.push(`    - advanced transition`);
    if (r.hasAdvancedVideoClassic) lines.push(`    - advanced video classic`);
    if (r.hasProMotion) lines.push(`    - professional motion`);
    if (r.imageProEffectsCount > 0)
      lines.push(`    - image_pro_effects: ${r.imageProEffectsCount} effects, ${r.imageProEffectsCategories} categories`);
  });
  lines.push("");

  lines.push(L ? "能力键" : "Capability keys");
  result.capabilitySummary.forEach((cap) => {
    const label = CAPABILITY_LABELS[cap];
    if (label) lines.push(`  ${cap}: ${lang === "zh" ? label.zh : label.en}`);
    else lines.push(`  ${cap}`);
  });

  return lines.join("\n");
}

export function explainPricingShort(
  scoreResult: TemplateScoreResult,
  result: TemplatePricingResult
): string {
  const tags = result.capabilityTags.length ? ` [${result.capabilityTags.join(", ")}]` : "";
  return `score=${result.score} bucket=${result.pricingBucket} (${result.creditPrice} credits) proFeatures=${scoreResult.proFeatureCount}${tags}`;
}
