import type { AdaptedPromptResult } from "../types/adaptedPrompt"
import type { PromptClass } from "../types/promptClass"
import { adaptPromptByClass, type AdaptByClassInput } from "./adaptPromptByClass"
import { getPromptClassForPlatform } from "./promptClassMap"

/**
 * Unified entry point: adapt canonical prompt to a specific platform
 * 
 * Flow:
 * platformId → promptClass → adaptPromptByClass → result
 * 
 * This provides a simple interface while maintaining the class-based
 * architecture underneath.
 */

export interface AdaptToPlatformInput extends Omit<AdaptByClassInput, "promptClass"> {
  platformId: string
}

export function adaptPromptToPlatform(input: AdaptToPlatformInput): AdaptedPromptResult {
  const { platformId, ...rest } = input
  
  // Step 1: Resolve platform to prompt class
  const promptClass: PromptClass = getPromptClassForPlatform(platformId)
  
  // Step 2: Adapt by class
  const result = adaptPromptByClass({
    ...rest,
    promptClass,
  })
  
  // Step 3: Annotate with platform info
  result.adapterNotes.unshift(`Adapted for platform: ${platformId} (class: ${promptClass})`)
  
  return result
}

/**
 * Quick adaptation helper for common platforms
 * 
 * Usage:
 *   const prompt = quickAdaptToPlatform(canonical, "midjourney")
 */
export function quickAdaptToPlatform(
  canonical: any,
  platformId: string,
  options?: AdaptByClassInput["options"]
): string {
  const result = adaptPromptToPlatform({
    canonical,
    platformId,
    options,
  })
  
  if (result.warnings.some(w => w.level === "error")) {
    throw new Error(`Adapter error: ${result.warnings.map(w => w.message).join("; ")}`)
  }
  
  return result.promptText
}
