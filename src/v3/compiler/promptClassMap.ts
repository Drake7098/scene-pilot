import type { PromptClass } from "../types/promptClass"

/**
 * Platform to Prompt Class mapping
 * 
 * Maps platform IDs to their prompt consumption patterns.
 * This prevents adapter explosion by grouping platforms with similar behavior.
 */

export const PLATFORM_TO_PROMPT_CLASS: Record<string, PromptClass> = {
  // Image Compressed - short, dense prompts for static image generation
  midjourney: "image_compressed",
  sdxl: "image_compressed",
  flux: "image_compressed",
  grok: "image_compressed",
  stable_diffusion: "image_compressed",
  dall_e: "image_compressed",

  // Video Cinematic - director-style language for video models
  sora: "video_cinematic",
  runway: "video_cinematic",
  pika: "video_cinematic",
  jimeng: "video_cinematic",
  kling: "video_cinematic",
  luma: "video_cinematic",
  haiper: "video_cinematic",

  // API Directive - structured prompts + params for developer APIs
  fal: "api_directive",
  volcengine: "api_directive",
  runway_api: "api_directive",
  openai_video: "api_directive",
  replicate: "api_directive",
  stability_api: "api_directive",

  // Universal fallback - platforms not explicitly mapped
}

/**
 * Get the prompt class for a given platform ID
 * Falls back to "universal" if platform is not mapped
 */
export function getPromptClassForPlatform(platformId: string): PromptClass {
  return PLATFORM_TO_PROMPT_CLASS[platformId] ?? "universal"
}

/**
 * Check if a platform uses a specific prompt class
 */
export function isPromptClassForPlatform(platformId: string, promptClass: PromptClass): boolean {
  return getPromptClassForPlatform(platformId) === promptClass
}
