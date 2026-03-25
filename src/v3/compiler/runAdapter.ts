import type { AdaptedPromptResult, AdapterOptions } from "../types/adaptedPrompt"
import type { ExportTarget } from "../types/exportTarget"

/**
 * Main adapter router - dispatches to specific adapter implementations based on target.adapterId
 * 
 * This is the core routing layer that connects the ExportTarget configuration
 * to actual platform-specific adapter logic.
 */
export function runAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  try {
    switch (target.adapterId) {
      // Midjourney adapters
      case "midjourneyAdapter":
        return runMidjourneyAdapter(canonical, profile, target, options)
      
      // Fal.ai adapters
      case "falAdapter":
        return runFalAdapter(canonical, profile, target, options)
      case "falVideoAdapter":
        return runFalVideoAdapter(canonical, profile, target, options)
      
      // Runway adapters
      case "runwayAdapter":
        return runRunwayAdapter(canonical, profile, target, options)
      case "runwayVideoAdapter":
        return runRunwayVideoAdapter(canonical, profile, target, options)
      
      // Pika adapter
      case "pikaAdapter":
        return runPikaAdapter(canonical, profile, target, options)
      
      // SDXL adapter
      case "sdxlAdapter":
        return runSdxlAdapter(canonical, profile, target, options)
      
      // Sora adapter
      case "soraAdapter":
        return runSoraAdapter(canonical, profile, target, options)
      
      // Grok adapter
      case "grokAdapter":
        return runGrokAdapter(canonical, profile, target, options)
      
      // China platform adapters
      case "jimengAdapter":
        return runJimengAdapter(canonical, profile, target, options)
      case "doubaoAdapter":
        return runDoubaoAdapter(canonical, profile, target, options)
      
      // Local execution adapters
      case "comfyuiAdapter":
        return runComfyuiAdapter(canonical, profile, target, options)
      case "automatic1111Adapter":
        return runAutomatic1111Adapter(canonical, profile, target, options)
      
      // Default fallback - return base prompt without adaptation
      default:
        return {
          promptText: canonical.basePrompt,
          params: {},
          warnings: [{
            level: "warning",
            code: "NO_ADAPTER",
            message: `No adapter implemented for "${target.adapterId}", returning base prompt`,
            suggestion: "Implement a custom adapter or use a supported export target",
          }],
          droppedFields: [],
          parameterValidations: [],
          adapterNotes: [`Using fallback - no adapter found for: ${target.adapterId}`],
          metadata: {
            targetId: target.id,
            profileId: target.profileId,
            adapterVersion: "1.0.0",
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
          },
        }
    }
  } catch (error) {
    // Catch-all error handling for adapter failures
    return {
      promptText: canonical.basePrompt,
      params: {},
      warnings: [{
        level: "error",
        code: "ADAPTER_ERROR",
        message: `Adapter execution failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: "Check adapter implementation or try a different export target",
      }],
      droppedFields: [],
      parameterValidations: [],
      adapterNotes: [`Adapter crashed: ${target.adapterId}`],
      metadata: {
        targetId: target.id,
        profileId: target.profileId,
        adapterVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }
  }
}

// ============================================================================
// Individual Adapter Implementations
// Each adapter follows the standard AdapterFn signature:
// (canonical, profile, target, options) => AdaptedPromptResult
// ============================================================================

function runMidjourneyAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  const promptText = canonical.basePrompt
  const params: Record<string, any> = {}
  const warnings: Array<{ level: string; code: string; message: string }> = []
  const droppedFields: Array<{ fieldName: string; reason: string }> = []
  const parameterValidations: Array<{ name: string; originalValue: any; adaptedValue: any; wasModified: boolean }> = []
  
  // Apply aspect ratio if provided
  if (canonical.technical?.aspectRatio) {
    const arFlag = profile.paramMapping?.aspectRatio || "--ar"
    params[arFlag] = canonical.technical.aspectRatio
    parameterValidations.push({
      name: "aspectRatio",
      originalValue: canonical.technical.aspectRatio,
      adaptedValue: canonical.technical.aspectRatio,
      wasModified: false,
    })
  }
  
  // Apply stylize if provided
  if (canonical.style?.stylize) {
    const stylizeFlag = profile.paramMapping?.stylize || "--stylize"
    params[stylizeFlag] = Math.min(Math.max(canonical.style.stylize, 0), 1000)
    if (canonical.style.stylize < 0 || canonical.style.stylize > 1000) {
      warnings.push({
        level: "warning",
        code: "PARAM_CLAMPED",
        message: "Stylize value clamped to valid range [0-1000]",
      })
    }
    parameterValidations.push({
      name: "stylize",
      originalValue: canonical.style.stylize,
      adaptedValue: params[stylizeFlag],
      wasModified: true,
      modificationReason: "platform_constraint",
    })
  }
  
  // Apply version
  if (profile.defaults?.version) {
    const versionFlag = profile.paramMapping?.version || "--v"
    params[versionFlag] = profile.defaults.version
  }
  
  // Drop unsupported fields
  if (canonical.motion) {
    droppedFields.push({
      fieldName: "motion",
      reason: "Midjourney does not support motion parameters in image generation",
    })
  }
  
  if (canonical.camera?.movement) {
    droppedFields.push({
      fieldName: "camera.movement",
      reason: "Camera movement not supported for static image generation",
    })
  }
  
  // Build character reference if available
  if (options?.resources?.referenceImages?.[0]?.url && profile.supportsCharacterReference) {
    const crefFlag = profile.paramMapping?.cref || "--cref"
    params[crefFlag] = options.resources.referenceImages[0].url
  }
  
  // Style reference
  if (options?.resources?.referenceImages?.[1]?.url && profile.supportsReferenceImage) {
    const srefFlag = profile.paramMapping?.sref || "--sref"
    params[srefFlag] = options.resources.referenceImages[1].url
  }
  
  return {
    promptText,
    params,
    warnings,
    droppedFields,
    parameterValidations,
    adapterNotes: ["Adapted for Midjourney v6 with flag-style parameters"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runFalAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // Fal.ai uses JSON-style parameters via API
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    image_size: canonical.technical?.aspectRatio || "square",
    num_inference_steps: canonical.technical?.steps || 28,
    guidance_scale: canonical.technical?.guidanceScale || 7.5,
  }
  
  // Map aspect ratio to Fal's format
  if (canonical.technical?.aspectRatio) {
    const arMap: Record<string, string> = {
      "1:1": "square",
      "16:9": "landscape",
      "9:16": "portrait",
      "4:3": "landscape_4_3",
      "3:4": "portrait_4_3",
    }
    params.image_size = arMap[canonical.technical.aspectRatio] || "square"
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [{
      name: "prompt",
      originalValue: canonical.basePrompt,
      adaptedValue: canonical.basePrompt,
      wasModified: false,
    }],
    adapterNotes: ["Adapted for Fal.ai SDXL endpoint"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runFalVideoAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // Fal video endpoints (e.g., Luma, Kling via Fal)
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    duration: canonical.camera?.durationSec || 5,
    aspect_ratio: canonical.technical?.aspectRatio || "16:9",
  }
  
  if (options?.resources?.inputVideo?.url) {
    params.image_url = options.resources.inputVideo.url
    params.mode = "image_to_video"
  } else {
    params.mode = "text_to_video"
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Fal.ai video endpoint"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runRunwayAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  // Runway Gen-2/Gen-3 image adapter
  return runRunwayVideoAdapter(canonical, profile, target, options)
}

function runRunwayVideoAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    duration_seconds: canonical.camera?.durationSec || 5,
    aspect_ratio: canonical.technical?.aspectRatio || "16:9",
  }
  
  // Runway supports camera control parameters
  if (canonical.camera?.movement) {
    params.motion_strength = "medium"
    params.camera_movement = mapCameraMovement(canonical.camera.movement)
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Runway Gen-3 Alpha"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runPikaAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    aspect_ratio: canonical.technical?.aspectRatio || "16:9",
    motion_strength: canonical.motion?.intensity || "medium",
  }
  
  if (options?.resources?.referenceImages?.[0]?.url) {
    params.image_url = options.resources.referenceImages[0].url
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Pika 1.5"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runSdxlAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    negative_prompt: canonical.style?.negativePrompt || "",
    width: canonical.technical?.width || 1024,
    height: canonical.technical?.height || 1024,
    steps: canonical.technical?.steps || 30,
    cfg_scale: canonical.technical?.guidanceScale || 7,
    sampler: canonical.technical?.sampler || "DPM++ 2M Karras",
  }
  
  // Apply aspect ratio to dimensions
  if (canonical.technical?.aspectRatio) {
    const [w, h] = parseAspectRatio(canonical.technical.aspectRatio)
    params.width = w
    params.height = h
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    negativePrompt: params.negative_prompt,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Stable Diffusion XL"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runSoraAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // Sora uses natural language prompts with minimal parameters
  const params: Record<string, any> = {
    prompt: enhanceForSora(canonical.basePrompt),
    duration_seconds: canonical.camera?.durationSec || 10,
    aspect_ratio: canonical.technical?.aspectRatio || "16:9",
  }
  
  return {
    promptText: enhanceForSora(canonical.basePrompt),
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Enhanced prompt for Sora's natural language understanding"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runGrokAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // Grok image generation (via xAI)
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    aspect_ratio: canonical.technical?.aspectRatio || "1:1",
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Grok image generation"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runJimengAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // 即梦 (Jimeng) - Volcengine platform
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    aspect_ratio: canonical.technical?.aspectRatio || "16:9",
    model_version: profile.defaults?.version || "v2",
  }
  
  if (canonical.media === "video") {
    params.duration = canonical.camera?.durationSec || 5
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for 即梦 (Jimeng) v2"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runDoubaoAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // 豆包 (Doubao) - Volcengine platform
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    size: canonical.technical?.aspectRatio || "1024x1024",
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for 豆包 (Doubao)"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runComfyuiAdapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // ComfyUI workflow JSON structure
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    negative_prompt: canonical.style?.negativePrompt || "",
    width: canonical.technical?.width || 1024,
    height: canonical.technical?.height || 1024,
    steps: canonical.technical?.steps || 20,
    cfg: canonical.technical?.guidanceScale || 8,
    seed: -1, // Random seed
  }
  
  if (canonical.technical?.aspectRatio) {
    const [w, h] = parseAspectRatio(canonical.technical.aspectRatio)
    params.width = w
    params.height = h
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    negativePrompt: params.negative_prompt,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for ComfyUI local execution"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

function runAutomatic1111Adapter(
  canonical: any,
  profile: any,
  target: ExportTarget,
  options?: AdapterOptions
): AdaptedPromptResult {
  const startTime = Date.now()
  
  // Automatic1111 WebUI API format
  const params: Record<string, any> = {
    prompt: canonical.basePrompt,
    negative_prompt: canonical.style?.negativePrompt || "",
    width: canonical.technical?.width || 512,
    height: canonical.technical?.height || 512,
    steps: canonical.technical?.steps || 20,
    cfg_scale: canonical.technical?.guidanceScale || 7,
    sampler_name: canonical.technical?.sampler || "Euler a",
  }
  
  if (canonical.technical?.aspectRatio) {
    const [w, h] = parseAspectRatio(canonical.technical.aspectRatio)
    params.width = w
    params.height = h
  }
  
  return {
    promptText: canonical.basePrompt,
    params,
    negativePrompt: params.negative_prompt,
    warnings: [],
    droppedFields: [],
    parameterValidations: [],
    adapterNotes: ["Adapted for Automatic1111 Stable Diffusion WebUI"],
    metadata: {
      targetId: target.id,
      profileId: target.profileId,
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapCameraMovement(movement: string): string {
  const mapping: Record<string, string> = {
    "push in": "zoom_in",
    "pull out": "zoom_out",
    "pan left": "pan_left",
    "pan right": "pan_right",
    "tilt up": "tilt_up",
    "tilt down": "tilt_down",
    "dolly forward": "dolly_in",
    "dolly backward": "dolly_out",
  }
  return mapping[movement.toLowerCase()] || "static"
}

function parseAspectRatio(ar: string): [number, number] {
  const parts = ar.split(":").map(Number)
  if (parts.length !== 2) return [1024, 1024]
  
  const [w, h] = parts
  const base = 1024
  
  // Scale to reasonable dimensions
  if (w > h) {
    return [base, Math.round(base * (h / w))]
  } else if (h > w) {
    return [Math.round(base * (w / h)), base]
  }
  return [base, base]
}

function enhanceForSora(prompt: string): string {
  // Add cinematic flow language for Sora's natural language understanding
  const enhancements = [
    "with smooth natural motion",
    "cinematic lighting and composition",
    "high quality professional production",
  ]
  
  // Simple enhancement strategy - can be made more sophisticated
  return `${prompt}, ${enhancements.join(", ")}`
}
