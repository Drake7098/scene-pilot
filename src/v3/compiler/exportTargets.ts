/**
 * Export Targets Configuration
 * 
 * Defines all available export targets for V3 prompts
 * Each target represents a user-facing option like "Generate with Fal" or "Export for Midjourney"
 */

import type { ExportTarget } from "../types/exportTarget";

/**
 * All available export targets
 * 
 * Organization:
 * - direct-* : Instant generation via API
 * - export-* : Copy prompt / external tool
 * - local-*  : Local execution
 */
export const EXPORT_TARGETS: ExportTarget[] = [
  // ── Direct Generation (Image) ─────────────────────────────────────────────
  {
    id: "fal-image",
    displayName: "Fal.ai",
    description: "Fast image generation with SDXL, LCM, and more",
    executionMode: "instant",
    media: ["image"],
    profileId: "fal",
    adapterId: "falAdapter",
    deliveryChannel: "fal_ai",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: true,
    requiredTier: "free",
    estimatedCost: 1,
    models: [
      { id: "fal-sdxl", name: "SDXL Turbo", default: true },
      { id: "fal-lcm", name: "LCM LoRA" },
      { id: "fal-playground", name: "Playground v2.5" },
      { id: "fal-realvis", name: "RealVisXL V4" },
    ],
    ui: {
      icon: "zap",
      color: "#6366f1",
      badge: "fast",
      group: "direct",
    },
  },
  
  {
    id: "runway-image",
    displayName: "Runway",
    description: "Image generation with Gen-3 quality",
    executionMode: "instant",
    media: ["image"],
    profileId: "runway",
    adapterId: "runwayAdapter",
    deliveryChannel: "runway_api",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: true,
    requiredTier: "pro",
    estimatedCost: 3,
    models: [
      { id: "runway-gen3", name: "Gen-3 Alpha", default: true },
    ],
    ui: {
      icon: "film",
      color: "#0ea5e9",
      group: "direct",
    },
  },
  
  // ── Direct Generation (Video) ────────────────────────────────────────────
  {
    id: "fal-video",
    displayName: "Fal.ai Video",
    description: "Fast video generation with LTX, Kling, and more",
    executionMode: "instant",
    media: ["video"],
    profileId: "fal",
    adapterId: "falVideoAdapter",
    deliveryChannel: "fal_ai",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: false, // Video takes time
    requiredTier: "pro",
    estimatedCost: 10,
    defaultDuration: 5,
    models: [
      { id: "fal-ltxv", name: "LTX Video", default: true },
      { id: "fal-kling", name: "Kling 1.5" },
      { id: "fal-hunyuan", name: "Hunyuan Video" },
    ],
    ui: {
      icon: "video",
      color: "#6366f1",
      badge: "pro",
      group: "direct",
    },
  },
  
  {
    id: "runway-video",
    displayName: "Runway Gen-3",
    description: "Cinematic video generation with camera control",
    executionMode: "queued",
    media: ["video"],
    profileId: "runway",
    adapterId: "runwayVideoAdapter",
    deliveryChannel: "runway_api",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: false,
    requiredTier: "pro",
    estimatedCost: 15,
    defaultDuration: 5,
    models: [
      { id: "runway-gen3-alpha", name: "Gen-3 Alpha", default: true },
      { id: "runway-gen2", name: "Gen-2" },
    ],
    capabilities: {
      maxDuration: 18,
      supportsCameraControl: true,
      supportsMotionControl: true,
    },
    ui: {
      icon: "clapperboard",
      color: "#0ea5e9",
      badge: "pro",
      group: "direct",
    },
  },
  
  {
    id: "pika-video",
    displayName: "Pika 1.5",
    description: "Animation-focused video generation",
    executionMode: "queued",
    media: ["video"],
    profileId: "pika",
    adapterId: "pikaAdapter",
    deliveryChannel: "pika_api",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: false,
    requiredTier: "pro",
    estimatedCost: 8,
    defaultDuration: 3,
    models: [
      { id: "pika-1.5", name: "Pika 1.5", default: true },
      { id: "pika-1.0", name: "Pika 1.0" },
    ],
    capabilities: {
      maxDuration: 6,
      supportsMotionBrush: true,
    },
    ui: {
      icon: "sparkles",
      color: "#ec4899",
      group: "direct",
    },
  },
  
  // ── Export / Copy Prompt ─────────────────────────────────────────────────
  {
    id: "midjourney-v6",
    displayName: "Midjourney v6",
    description: "Copy prompt for Midjourney web or Discord",
    executionMode: "copy_prompt",
    media: ["image"],
    profileId: "midjourney",
    adapterId: "midjourneyAdapter",
    deliveryChannel: "none",
    integrationType: "manual_copy",
    requiresAuth: false,
    supportsInstantGeneration: false,
    requiredTier: "free",
    models: [
      { id: "mj-v6", name: "Midjourney v6", default: true },
      { id: "mj-niji6", name: "Niji v6 (Anime)" },
    ],
    ui: {
      icon: "palette",
      color: "#8b5cf6",
      badge: "popular",
      group: "export",
    },
  },
  
  {
    id: "sora-export",
    displayName: "OpenAI Sora",
    description: "Export prompt format for Sora (when available)",
    executionMode: "copy_prompt",
    media: ["video"],
    profileId: "sora",
    adapterId: "soraAdapter",
    deliveryChannel: "none",
    integrationType: "manual_copy",
    requiresAuth: false,
    supportsInstantGeneration: false,
    requiredTier: "free",
    defaultDuration: 10,
    ui: {
      icon: "cloud",
      color: "#10b981",
      badge: "beta",
      group: "export",
    },
  },
  
  {
    id: "grok-export",
    displayName: "Grok (xAI)",
    description: "Export prompt for Grok text-to-image",
    executionMode: "copy_prompt",
    media: ["image"],
    profileId: "grok",
    adapterId: "grokAdapter",
    deliveryChannel: "none",
    integrationType: "manual_copy",
    requiresAuth: false,
    supportsInstantGeneration: false,
    requiredTier: "free",
    ui: {
      icon: "message-square",
      color: "#f59e0b",
      group: "export",
    },
  },
  
  {
    id: "sdxl-export",
    displayName: "Stable Diffusion XL",
    description: "Export for SDXL (Automatic1111, ComfyUI, etc.)",
    executionMode: "copy_prompt",
    media: ["image"],
    profileId: "sdxl",
    adapterId: "sdxlAdapter",
    deliveryChannel: "none",
    integrationType: "file_export",
    requiresAuth: false,
    supportsInstantGeneration: false,
    requiredTier: "free",
    ui: {
      icon: "layers",
      color: "#84cc16",
      group: "export",
    },
  },
  
  // ── China Platforms ──────────────────────────────────────────────────────
  {
    id: "jimeng-direct",
    displayName: "即梦 (Jimeng)",
    description: "Volcengine Jimeng AI generation",
    executionMode: "instant",
    media: ["image", "video"],
    profileId: "volcengine_jimeng",
    adapterId: "jimengAdapter",
    deliveryChannel: "volcengine_jimeng",
    integrationType: "native",
    requiresAuth: true,
    supportsInstantGeneration: true,
    requiredTier: "pro",
    estimatedCost: 5,
    defaultDuration: 5,
    ui: {
      icon: "rocket",
      color: "#3b82f6",
      group: "direct",
    },
  },
  
  // ── Local Execution ──────────────────────────────────────────────────────
  {
    id: "local-comfyui",
    displayName: "Local (ComfyUI)",
    description: "Generate with your local ComfyUI instance",
    executionMode: "local",
    media: ["image", "video"],
    profileId: "sdxl",
    adapterId: "comfyuiAdapter",
    deliveryChannel: "local_comfyui",
    integrationType: "sdk",
    requiresAuth: false,
    supportsInstantGeneration: true,
    requiredTier: "free",
    ui: {
      icon: "cpu",
      color: "#64748b",
      group: "local",
    },
  },
  
  {
    id: "local-a1111",
    displayName: "Local (Automatic1111)",
    description: "Generate with SD WebUI",
    executionMode: "local",
    media: ["image"],
    profileId: "sdxl",
    adapterId: "a1111Adapter",
    deliveryChannel: "local_automatic1111",
    integrationType: "sdk",
    requiresAuth: false,
    supportsInstantGeneration: true,
    requiredTier: "free",
    ui: {
      icon: "terminal",
      color: "#64748b",
      group: "local",
    },
  },
];

/**
 * Get export target by ID
 */
export function getExportTarget(targetId: string): ExportTarget | undefined {
  return EXPORT_TARGETS.find(t => t.id === targetId);
}

/**
 * List available targets for a given media type
 */
export function getTargetsForMedia(mediaType: "image" | "video"): ExportTarget[] {
  return EXPORT_TARGETS.filter(t => t.media.includes(mediaType));
}

/**
 * List targets by execution mode
 */
export function getTargetsByMode(mode: ExportTarget["executionMode"]): ExportTarget[] {
  return EXPORT_TARGETS.filter(t => t.executionMode === mode);
}

/**
 * List targets by group
 */
export function getTargetsByGroup(group: string): ExportTarget[] {
  return EXPORT_TARGETS.filter(t => t.ui?.group === group);
}
