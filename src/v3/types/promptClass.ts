/**
 * Prompt Class - Categorizes prompts by how they are consumed
 * 
 * Instead of creating one adapter per platform (Midjourney, Sora, Runway, etc.),
 * we categorize by prompt consumption pattern:
 * 
 * - universal: Raw canonical output, no adaptation
 * - image_compressed: Short, dense prompts for image generators
 * - video_cinematic: Director-style language for video models
 * - api_directive: Structured prompts + params for developer APIs
 */

export type PromptClass =
  | "universal"
  | "image_compressed"
  | "video_cinematic"
  | "api_directive"
