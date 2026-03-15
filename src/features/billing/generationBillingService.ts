/**
 * Generation billing service - reserved for future image/video generation charges.
 * Template charges and generation charges are strictly separated.
 */

import type { Project } from "../../model";
import type { GenerationCharge } from "./types";
import { GENERATION_COST_RANGES } from "./constants";
import { getWalletState } from "../../services/creditService";
import { appendTransaction } from "./billingStorage";

export type GenerationEstimateInput = {
  mediaType: "image" | "video";
  platformId?: string;
  qualityTier?: string;
  duration?: number;
  sceneCount?: number;
  modelKey?: string;
};

/** Estimate credits for generation (reserved; no real pricing yet). */
export function estimateGenerationCost(input: GenerationEstimateInput): number {
  if (input.mediaType === "image") {
    const tier = input.qualityTier === "hd" ? "advanced" : "basic";
    const range = tier === "advanced" ? GENERATION_COST_RANGES.image_advanced : GENERATION_COST_RANGES.image_basic;
    return Math.round((range.min + range.max) / 2);
  }
  const range = input.qualityTier === "hd" ? GENERATION_COST_RANGES.video_advanced : GENERATION_COST_RANGES.video_basic;
  return Math.round((range.min + range.max) / 2);
}

/** Check if user can afford generation. */
export async function canAffordGeneration(
  userId: string,
  estimate: number
): Promise<{ canAfford: boolean; have: number }> {
  if (estimate <= 0) return { canAfford: true, have: 0 };
  const wallet = await getWalletState(userId);
  return {
    canAfford: wallet.creditsBalance >= estimate,
    have: wallet.creditsBalance,
  };
}

/** Record generation charge in project meta (reserved). Caller must persist project. */
export function recordGenerationCharge(
  project: Project,
  sceneId: string | undefined,
  platformId: string | undefined,
  cost: number,
  chargeType: "generate_image" | "generate_video"
): Project {
  const charged: GenerationCharge = {
    sceneId,
    platformId,
    cost,
    chargedAt: new Date().toISOString(),
    chargeType,
  };
  const existingGen = project.meta?.billing?.generationCharges ?? [];
  const nextBilling = {
    ...project.meta?.billing,
    appliedTemplateCharges: project.meta?.billing?.appliedTemplateCharges ?? [],
    generationCharges: [...existingGen, charged],
  };
  const nextMeta = { ...project.meta, billing: nextBilling };
  return { ...project, meta: nextMeta };
}

/** Apply generation charge (reserved). Not implemented for real deduction. */
export async function applyGenerationCharge(
  _userId: string,
  _project: Project,
  _sceneId: string | undefined,
  _platformId: string | undefined,
  _cost: number,
  _chargeType: "generate_image" | "generate_video"
): Promise<{ project: Project; success: boolean }> {
  // Reserved for backend integration
  return { project: _project, success: false };
}
