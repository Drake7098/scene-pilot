/**
 * Platform Profiles
 * 
 * Predefined profiles for major AI generation platforms
 * Used for prompt adaptation and parameter mapping
 */

import type { PlatformProfile } from "../types/platformProfile";

// ── Midjourney Profile ─────────────────────────────────────────────────────
/**
 * Midjourney v6+ profile
 * - Image-only platform
 * - Compressed, keyword-style prompts
 * - Uses --flag parameters
 * - Supports aspect ratio, stylize, character reference
 */
export const midjourneyProfile: PlatformProfile = {
  id: "midjourney",
  displayName: "Midjourney v6",
  
  media: ["image"],
  
  promptStyle: "compressed",
  
  supportsTimeline: false,
  supportsAspectRatioParam: true,
  supportsReferenceImage: true,
  supportsCharacterReference: true,
  supportsNegativePrompt: false,
  
  maxPromptLength: 600,
  
  paramMapping: {
    aspectRatio: "--ar",
    stylize: "--stylize",
    weird: "--weird",
    version: "--v",
    quality: "--q",
    chaos: "--c",
    repeat: "--repeat",
    tile: "--tile",
    no: "--no",
    cref: "--cref",
    sref: "--sref",
  },
  
  paramFormat: "flag",
  
  defaults: {
    version: "6.0",
    quality: "1",
  },
  
  features: {
    upscaling: true,
    variations: true,
    inpainting: true,
    outpainting: false,
    imageToVideo: false,
    multiShotConsistency: true,
    cameraControl: false,
    motionBrush: false,
  },
  
  models: [
    { id: "mj-v6", name: "Midjourney v6", default: true },
    { id: "mj-v5.2", name: "Midjourney v5.2" },
    { id: "mj-niji6", name: "Niji v6 (Anime)" },
  ],
};

// ── Sora Profile ───────────────────────────────────────────────────────────
/**
 * OpenAI Sora profile
 * - Video-focused platform
 * - Cinematic, natural language prompts
 * - Supports timeline/duration
 * - JSON-style parameter format (API)
 */
export const soraProfile: PlatformProfile = {
  id: "sora",
  displayName: "OpenAI Sora",
  
  media: ["video"],
  
  promptStyle: "cinematic",
  
  supportsTimeline: true,
  supportsAspectRatioParam: true,
  supportsReferenceImage: false,
  supportsCharacterReference: false,
  supportsNegativePrompt: false,
  
  maxPromptLength: 4000,
  
  paramMapping: {
    duration: "duration_sec",
    aspectRatio: "aspect_ratio",
    resolution: "resolution",
    fps: "fps",
  },
  
  paramFormat: "json",
  
  defaults: {
    duration_sec: 10,
    fps: 24,
  },
  
  features: {
    upscaling: false,
    variations: false,
    inpainting: false,
    outpainting: false,
    imageToVideo: true,
    multiShotConsistency: true,
    cameraControl: true,
    motionBrush: false,
  },
  
  models: [
    { id: "sora-v1", name: "Sora v1", default: true },
  ],
};

// ── Fal.ai Profile ─────────────────────────────────────────────────────────
/**
 * Fal.ai profile
 * - Multi-model platform (SDXL, LCM, etc.)
 * - Flexible prompt style
 * - JSON API format
 * - Supports negative prompts
 */
export const falProfile: PlatformProfile = {
  id: "fal",
  displayName: "Fal.ai",
  
  media: ["image", "video"],
  
  promptStyle: "directive",
  
  supportsTimeline: false,
  supportsAspectRatioParam: true,
  supportsReferenceImage: true,
  supportsCharacterReference: false,
  supportsNegativePrompt: true,
  
  maxPromptLength: 2000,
  
  paramMapping: {
    aspectRatio: "aspect_ratio",
    negativePrompt: "negative_prompt",
    imageSize: "image_size",
    numInferenceSteps: "num_inference_steps",
    guidanceScale: "guidance_scale",
    seed: "seed",
  },
  
  paramFormat: "json",
  
  defaults: {
    num_inference_steps: 28,
    guidance_scale: 7.5,
  },
  
  features: {
    upscaling: true,
    variations: true,
    inpainting: true,
    outpainting: true,
    imageToVideo: true,
    multiShotConsistency: false,
    cameraControl: false,
    motionBrush: false,
  },
  
  models: [
    { id: "fal-sdxl", name: "SDXL Turbo", default: true },
    { id: "fal-lcm", name: "LCM LoRA" },
    { id: "fal-playground", name: "Playground v2" },
    { id: "fal-realvis", name: "RealVisXL" },
  ],
};

// ── Grok Profile ───────────────────────────────────────────────────────────
/**
 * Grok (xAI) profile
 * - Text-to-image via Grok interface
 * - Directive, instruction-based prompts
 * - Simpler parameter set
 */
export const grokProfile: PlatformProfile = {
  id: "grok",
  displayName: "Grok (xAI)",
  
  media: ["image"],
  
  promptStyle: "directive",
  
  supportsTimeline: false,
  supportsAspectRatioParam: true,
  supportsReferenceImage: false,
  supportsCharacterReference: false,
  supportsNegativePrompt: false,
  
  maxPromptLength: 1000,
  
  paramMapping: {
    aspectRatio: "aspect_ratio",
    style: "style_preset",
  },
  
  paramFormat: "json",
  
  defaults: {},
  
  features: {
    upscaling: false,
    variations: false,
    inpainting: false,
    outpainting: false,
    imageToVideo: false,
    multiShotConsistency: false,
    cameraControl: false,
    motionBrush: false,
  },
  
  models: [
    { id: "grok-v1", name: "Grok-1.5 Vision", default: true },
  ],
};

// ── Runway Profile ─────────────────────────────────────────────────────────
/**
 * Runway Gen-2/Gen-3 profile
 * - Video generation platform
 * - Cinematic prompts with motion control
 * - Supports image-to-video
 */
export const runwayProfile: PlatformProfile = {
  id: "runway",
  displayName: "Runway Gen-3",
  
  media: ["video"],
  
  promptStyle: "cinematic",
  
  supportsTimeline: true,
  supportsAspectRatioParam: true,
  supportsReferenceImage: true,
  supportsCharacterReference: false,
  supportsNegativePrompt: false,
  
  maxPromptLength: 2000,
  
  paramMapping: {
    duration: "duration_sec",
    aspectRatio: "aspect_ratio",
    motionScore: "motion_score",
    seed: "seed",
  },
  
  paramFormat: "json",
  
  defaults: {
    duration_sec: 5,
    motion_score: 5,
  },
  
  features: {
    upscaling: false,
    variations: true,
    inpainting: true,
    outpainting: false,
    imageToVideo: true,
    multiShotConsistency: false,
    cameraControl: true,
    motionBrush: true,
  },
  
  models: [
    { id: "runway-gen3", name: "Gen-3 Alpha", default: true },
    { id: "runway-gen2", name: "Gen-2" },
  ],
};

// ── Pika Labs Profile ──────────────────────────────────────────────────────
/**
 * Pika Labs profile
 * - Video generation with animation focus
 * - Supports motion regions
 */
export const pikaProfile: PlatformProfile = {
  id: "pika",
  displayName: "Pika Labs 1.5",
  
  media: ["video"],
  
  promptStyle: "cinematic",
  
  supportsTimeline: true,
  supportsAspectRatioParam: true,
  supportsReferenceImage: true,
  supportsCharacterReference: false,
  supportsNegativePrompt: false,
  
  maxPromptLength: 1500,
  
  paramMapping: {
    duration: "duration_sec",
    aspectRatio: "aspect_ratio",
    motionStrength: "motion_strength",
    negativePrompt: "negative_prompt",
  },
  
  paramFormat: "json",
  
  defaults: {
    duration_sec: 3,
    motion_strength: 5,
  },
  
  features: {
    upscaling: false,
    variations: true,
    inpainting: true,
    outpainting: false,
    imageToVideo: true,
    multiShotConsistency: false,
    cameraControl: false,
    motionBrush: true,
  },
  
  models: [
    { id: "pika-1.5", name: "Pika 1.5", default: true },
    { id: "pika-1.0", name: "Pika 1.0" },
  ],
};

// ── Stable Diffusion XL Profile ────────────────────────────────────────────
/**
 * SDXL generic profile
 * - Baseline profile for SDXL-compatible services
 */
export const sdxlProfile: PlatformProfile = {
  id: "sdxl",
  displayName: "Stable Diffusion XL",
  
  media: ["image"],
  
  promptStyle: "directive",
  
  supportsTimeline: false,
  supportsAspectRatioParam: true,
  supportsReferenceImage: false,
  supportsCharacterReference: false,
  supportsNegativePrompt: true,
  
  maxPromptLength: 2000,
  
  paramMapping: {
    negativePrompt: "negative_prompt",
    width: "width",
    height: "height",
    steps: "steps",
    cfg: "cfg_scale",
    seed: "seed",
  },
  
  paramFormat: "json",
  
  defaults: {
    steps: 30,
    cfg_scale: 7,
  },
  
  features: {
    upscaling: true,
    variations: true,
    inpainting: true,
    outpainting: true,
    imageToVideo: false,
    multiShotConsistency: false,
    cameraControl: false,
    motionBrush: false,
  },
  
  models: [
    { id: "sdxl-base", name: "SDXL Base 1.0", default: true },
    { id: "sdxl-refiner", name: "SDXL Refiner" },
  ],
};

// ── Profile Registry ───────────────────────────────────────────────────────
/**
 * All available platform profiles
 */
export const PLATFORM_PROFILES: Record<string, PlatformProfile> = {
  midjourney: midjourneyProfile,
  sora: soraProfile,
  fal: falProfile,
  grok: grokProfile,
  runway: runwayProfile,
  pika: pikaProfile,
  sdxl: sdxlProfile,
};

/**
 * Get profile by ID
 */
export function getPlatformProfile(platformId: string): PlatformProfile | undefined {
  return PLATFORM_PROFILES[platformId];
}

/**
 * List all available platform IDs
 */
export function listAvailablePlatforms(): string[] {
  return Object.keys(PLATFORM_PROFILES);
}
