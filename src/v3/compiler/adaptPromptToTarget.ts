/**
 * Adapt Prompt to Target
 * 
 * Main entry point for adapting V3 canonical prompts to specific platforms
 * 
 * Flow:
 * compileV3 → buildCanonicalPrompt → ExportTarget lookup → PlatformProfile → Adapter → Result
 */

import type { BuildCanonicalInput } from "./buildCanonicalPrompt";
import { buildCanonicalPrompt } from "./buildCanonicalPrompt";
import { getExportTarget, EXPORT_TARGETS } from "./exportTargets";
import { getPlatformProfile } from "./platformProfiles";
import { runAdapter } from "./runAdapter";
import type { AdaptedPromptResult, AdapterOptions } from "../types/adaptedPrompt";
import type { ExportTarget } from "../types/exportTarget";

/**
 * Input for prompt adaptation
 */
export interface AdaptPromptInput extends BuildCanonicalInput {
  /** Additional adapter options (optional) */
  adapterOptions?: AdapterOptions;
}

/**
 * Adaptation result with target metadata
 */
export interface AdaptationResult extends AdaptedPromptResult {
  /** Target configuration used */
  target: ExportTarget;
  
  /** Whether adaptation was successful */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Main adaptation function
 * 
 * Takes V3 input and target ID, returns adapted prompt ready for delivery
 * 
 * @param input - V3 compiler input (scene, lang, mediaMode, aspectRatio)
 * @param targetId - Export target ID (e.g., "fal-image", "midjourney-v6")
 * @param options - Optional adapter configuration
 * @returns Adaptation result with prompt, parameters, and metadata
 * 
 * @example
 * ```ts
 * const result = adaptPromptToTarget(
 *   { scene, lang: "en", mediaMode: "image" },
 *   "fal-image",
 *   { userPreferences: { preferConcise: true } }
 * );
 * 
 * console.log(result.promptText); // Ready for Fal API
 * console.log(result.params);     // Fal-specific parameters
 * ```
 */
export function adaptPromptToTarget(
  input: AdaptPromptInput,
  targetId: string,
  options?: AdapterOptions
): AdaptationResult {
  // Step 1: Lookup export target
  const target = getExportTarget(targetId);
  
  if (!target) {
    const availableTargets = EXPORT_TARGETS.map(t => t.id).join(", ");
    return {
      promptText: "",
      params: {},
      warnings: [{
        level: "error",
        code: "TARGET_NOT_FOUND",
        message: `Export target "${targetId}" not found. Available: ${availableTargets}`,
      }],
      droppedFields: [],
      parameterValidations: [],
      adapterNotes: ["Target lookup failed"],
      metadata: {
        targetId,
        profileId: "",
        adapterVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        processingTimeMs: 0,
      },
      success: false,
      error: `Target "${targetId}" not found`,
    } as AdaptationResult;
  }
  
  // Step 2: Validate media compatibility
  if (!target.media.includes(input.mediaMode)) {
    return {
      promptText: "",
      params: {},
      warnings: [{
        level: "error",
        code: "MEDIA_MISMATCH",
        message: `Target "${target.displayName}" does not support ${input.mediaMode}. Supported: ${target.media.join(", ")}`,
      }],
      droppedFields: [],
      parameterValidations: [],
      adapterNotes: ["Media type validation failed"],
      metadata: {
        targetId,
        profileId: target.profileId,
        adapterVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        processingTimeMs: 0,
      },
      success: false,
      error: `Media type mismatch`,
    } as AdaptationResult;
  }
  
  // Step 3: Get platform profile
  const profile = getPlatformProfile(target.profileId);
  
  if (!profile) {
    return {
      promptText: "",
      params: {},
      warnings: [{
        level: "error",
        code: "PROFILE_NOT_FOUND",
        message: `Platform profile "${target.profileId}" not found`,
      }],
      droppedFields: [],
      parameterValidations: [],
      adapterNotes: ["Profile lookup failed"],
      metadata: {
        targetId,
        profileId: target.profileId,
        adapterVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        processingTimeMs: 0,
      },
      target,
      success: false,
      error: `Profile "${target.profileId}" not found`,
    } as AdaptationResult;
  }
  
  // Step 4: Check authentication requirement
  if (target.requiresAuth && !options?.context?.projectId) {
    // Add warning but continue (authentication handled at delivery layer)
    console.warn(`Target "${targetId}" requires authentication`);
  }
  
  // Step 5: Build canonical prompt
  const startTime = Date.now();
  
  const canonical = buildCanonicalPrompt({
    scene: input.scene,
    lang: input.lang,
    mediaMode: input.mediaMode,
    aspectRatio: input.aspectRatio,
  });
  
  // Step 6: Run adapter
  const adapterResult = runAdapter(canonical, profile, target, options);
  
  // Step 7: Build final result
  const processingTimeMs = Date.now() - startTime;
  
  return {
    ...adapterResult,
    target,
    success: adapterResult.warnings.every(w => w.level !== "error"),
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs,
    },
  };
}

/**
 * Quick adaptation helper for common use cases
 * 
 * @param input - V3 input
 * @param platform - Platform shorthand ("fal", "mj", "runway", etc.)
 * @returns Adapted prompt text only
 */
export function quickAdapt(
  input: AdaptPromptInput,
  platform: "fal" | "mj" | "runway" | "pika" | "sdxl"
): string {
  const targetMap: Record<string, string> = {
    fal: "fal-image",
    mj: "midjourney-v6",
    runway: "runway-video",
    pika: "pika-video",
    sdxl: "sdxl-export",
  };
  
  const result = adaptPromptToTarget(input, targetMap[platform]);
  
  if (!result.success) {
    throw new Error(result.error || "Adaptation failed");
  }
  
  return result.promptText;
}
