import type { PromptClass } from "../types/promptClass"
import type { AdaptedPromptResult } from "../types/adaptedPrompt"

/**
 * Adapt canonical prompt by class rather than by individual platform
 * 
 * This prevents adapter explosion by grouping platforms with similar
 * prompt consumption patterns.
 */

export interface AdaptByClassInput {
  canonical: any
  promptClass: PromptClass
  platformId?: string
  options?: {
    preferConcise?: boolean
    enableAdvanced?: boolean
    maxPromptLength?: number
  }
}

export function adaptPromptByClass(input: AdaptByClassInput): AdaptedPromptResult {
  const { canonical, promptClass, options } = input
  const startTime = Date.now()

  switch (promptClass) {
    case "universal":
      return adaptUniversal(canonical, options)
    case "image_compressed":
      return adaptImageCompressed(canonical, options)
    case "video_cinematic":
      return adaptVideoCinematic(canonical, options)
    case "api_directive":
      return adaptApiDirective(canonical, options)
    default:
      return adaptUniversal(canonical, options)
  }
}

// ============================================================================
// Universal Adapter
// Returns canonical output unchanged as the母本 for all other adaptations
// ============================================================================

function adaptUniversal(
  canonical: any,
  options?: AdaptByClassInput["options"]
): AdaptedPromptResult {
  return {
    promptText: canonical.basePrompt,
    params: {},
    warnings: [],
    droppedFields: [],
    parameterValidations: [{
      name: "basePrompt",
      originalValue: canonical.basePrompt,
      adaptedValue: canonical.basePrompt,
      wasModified: false,
    }],
    adapterNotes: ["Universal mode: returning canonical prompt unchanged"],
    metadata: {
      targetId: "universal",
      profileId: "none",
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - Date.now(),
    },
  }
}

// ============================================================================
// Image Compressed Adapter
// For: Midjourney, SDXL, Flux, Grok Image, DALL-E
// Characteristics:
// - Shorter, denser prompts
// - Keep: subject, style, composition, lighting, mood
// - Remove: timeline, T0/T1 specs, verbose motion, technical descriptions
// ============================================================================

function adaptImageCompressed(
  canonical: any,
  options?: AdaptByClassInput["options"]
): AdaptedPromptResult {
  const startTime = Date.now()
  const droppedFields: Array<{ fieldName: string; reason: string; originalValue?: any }> = []
  const warnings: Array<{ level: string; code: string; message: string }> = []
  const adapterNotes: string[] = []

  // Build compressed prompt by extracting key elements
  const segments: string[] = []

  // 1. Subject (most important)
  if (canonical.objects?.length > 0) {
    const primaryObj = canonical.objects.find((o: any) => o.role === "primary") || canonical.objects[0]
    if (primaryObj) {
      let subjectDesc = primaryObj.look || primaryObj.name || ""
      
      if (primaryObj.costume && !subjectDesc.toLowerCase().includes(primaryObj.costume.toLowerCase())) {
        subjectDesc += `, dressed in ${primaryObj.costume}`
      }
      
      if (primaryObj.detail) {
        subjectDesc += `, ${primaryObj.detail}`
      }
      
      if (subjectDesc) {
        segments.push(subjectDesc)
      }
    }
  }

  // 2. Environment / Background
  if (canonical.environment?.description) {
    segments.push(`in ${canonical.environment.description}`)
  } else if (canonical.environment?.location) {
    segments.push(`at ${canonical.environment.location}`)
  }

  // 3. Lighting
  if (canonical.lighting?.type) {
    segments.push(`${canonical.lighting.type} lighting`)
  } else if (canonical.lighting?.description) {
    segments.push(canonical.lighting.description)
  }

  // 4. Composition
  if (canonical.composition?.framing) {
    segments.push(canonical.composition.framing)
  }
  if (canonical.composition?.angle) {
    segments.push(canonical.composition.angle)
  }

  // 5. Style / Mood
  if (canonical.style?.aesthetic) {
    segments.push(canonical.style.aesthetic)
  }
  if (canonical.style?.mood) {
    segments.push(canonical.style.mood)
  }
  if (canonical.style?.colorPalette) {
    segments.push(`${canonical.style.colorPalette} color palette`)
  }

  // Drop video-specific fields
  if (canonical.motion) {
    droppedFields.push({
      fieldName: "motion",
      reason: "Motion parameters not applicable to static image generation",
      originalValue: canonical.motion,
    })
  }

  if (canonical.camera?.movement) {
    droppedFields.push({
      fieldName: "camera.movement",
      reason: "Camera movement not applicable to static image generation",
      originalValue: canonical.camera.movement,
    })
  }

  if (canonical.camera?.durationSec) {
    droppedFields.push({
      fieldName: "camera.durationSec",
      reason: "Duration not applicable to static image generation",
      originalValue: canonical.camera.durationSec,
    })
  }

  // Build final compressed prompt
  let promptText = segments.filter(s => s && s.trim()).join(", ")

  // Apply length constraint if specified
  if (options?.maxPromptLength && promptText.length > options.maxPromptLength) {
    promptText = promptText.slice(0, options.maxPromptLength - 3) + "..."
    warnings.push({
      level: "warning",
      code: "PROMPT_TRUNCATED",
      message: `Prompt truncated to ${options.maxPromptLength} characters`,
    })
    adapterNotes.push(`Truncated from ${segments.join(", ").length} to ${promptText.length} chars`)
  }

  // Build params for aspect ratio
  const params: Record<string, any> = {}
  if (canonical.technical?.aspectRatio) {
    params.aspectRatio = canonical.technical.aspectRatio
  }

  adapterNotes.push("Compressed for image generation: kept subject/style/composition/lighting, removed motion/timeline")

  return {
    promptText,
    params,
    warnings,
    droppedFields,
    parameterValidations: [{
      name: "basePrompt",
      originalValue: canonical.basePrompt,
      adaptedValue: promptText,
      wasModified: true,
      modificationReason: "compressed_for_image",
    }],
    adapterNotes,
    metadata: {
      targetId: "image_compressed",
      profileId: "generic_image",
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

// ============================================================================
// Video Cinematic Adapter
// For: Sora, Runway, Pika, Jimeng Video, Kling, Luma
// Characteristics:
// - Keep camera language, movement, duration
// - Keep framing evolution, subject motion
// - Allow longer sentences
// - Director-style language
// ============================================================================

function adaptVideoCinematic(
  canonical: any,
  options?: AdaptByClassInput["options"]
): AdaptedPromptResult {
  const startTime = Date.now()
  const warnings: Array<{ level: string; code: string; message: string }> = []
  const adapterNotes: string[] = []

  // Start with base prompt (already optimized for cinematic language)
  let promptText = canonical.basePrompt

  // Enhance with explicit video direction if motion exists
  const enhancements: string[] = []

  if (canonical.camera?.durationSec) {
    enhancements.push(`${canonical.camera.durationSec} second shot`)
  }

  if (canonical.camera?.movement) {
    enhancements.push(`camera: ${canonical.camera.movement}`)
  }

  if (canonical.motion?.description) {
    enhancements.push(`motion: ${canonical.motion.description}`)
  }

  // Add cinematic markers if not already present
  if (enhancements.length > 0 && !promptText.toLowerCase().includes("shot")) {
    const introPhrase = enhancements.join(", ")
    promptText = `${introPhrase} — ${promptText}`
    adapterNotes.push("Added cinematic direction markers")
  }

  // Preserve all video-relevant fields in params
  const params: Record<string, any> = {}

  if (canonical.camera?.durationSec) {
    params.duration = canonical.camera.durationSec
  }

  if (canonical.technical?.aspectRatio) {
    params.aspectRatio = canonical.technical.aspectRatio
  }

  if (canonical.motion?.intensity) {
    params.motionStrength = canonical.motion.intensity
  }

  // Warn if missing critical video info
  if (!canonical.camera?.durationSec) {
    warnings.push({
      level: "info",
      code: "MISSING_DURATION",
      message: "No duration specified; platform default will be used",
      suggestion: "Add duration in scene notes (e.g., '6s video')",
    })
  }

  adapterNotes.push("Preserved cinematic language: camera movement, motion, duration, framing")

  return {
    promptText,
    params,
    warnings,
    droppedFields: [],
    parameterValidations: [{
      name: "basePrompt",
      originalValue: canonical.basePrompt,
      adaptedValue: promptText,
      wasModified: enhancements.length > 0,
      modificationReason: enhancements.length > 0 ? "enhanced_for_video" : "none",
    }],
    adapterNotes,
    metadata: {
      targetId: "video_cinematic",
      profileId: "generic_video",
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}

// ============================================================================
// API Directive Adapter
// For: Fal, Volcengine, Runway API, OpenAI Video API, Replicate
// Characteristics:
// - Clear structure over literary language
// - Emphasis on prompt + params separation
// - Suitable for payload construction
// - Parameter mapping ready
// ============================================================================

function adaptApiDirective(
  canonical: any,
  options?: AdaptByClassInput["options"]
): AdaptedPromptResult {
  const startTime = Date.now()
  const adapterNotes: string[] = []

  // Use base prompt as-is (structure already clear from compileV3)
  const promptText = canonical.basePrompt

  // Extract all technical parameters for API consumption
  const params: Record<string, any> = {}

  // Media type
  params.media = canonical.media || "image"

  // Aspect ratio
  if (canonical.technical?.aspectRatio) {
    params.aspect_ratio = canonical.technical.aspectRatio
  }

  // Dimensions
  if (canonical.technical?.width) {
    params.width = canonical.technical.width
  }
  if (canonical.technical?.height) {
    params.height = canonical.technical.height
  }

  // Duration (for video)
  if (canonical.camera?.durationSec) {
    params.duration_seconds = canonical.camera.durationSec
  }

  // Generation parameters
  if (canonical.technical?.steps) {
    params.steps = canonical.technical.steps
  }
  if (canonical.technical?.guidanceScale) {
    params.guidance_scale = canonical.technical.guidanceScale
  }
  if (canonical.technical?.sampler) {
    params.sampler = canonical.technical.sampler
  }

  // Negative prompt
  let negativePrompt: string | undefined
  if (canonical.style?.negativePrompt) {
    negativePrompt = canonical.style.negativePrompt
    params.negative_prompt = negativePrompt
  }

  // Motion parameters (for video APIs)
  if (canonical.motion?.intensity) {
    params.motion_strength = canonical.motion.intensity
  }
  if (canonical.camera?.movement) {
    params.camera_movement = canonical.camera.movement
  }

  // Reference images
  if (options?.enableAdvanced) {
    adapterNotes.push("Advanced mode enabled: reference images can be attached via resources")
  }

  adapterNotes.push("Structured for API: prompt text separated from technical parameters")

  return {
    promptText,
    params,
    negativePrompt,
    warnings: [],
    droppedFields: [],
    parameterValidations: [
      {
        name: "prompt",
        originalValue: canonical.basePrompt,
        adaptedValue: canonical.basePrompt,
        wasModified: false,
      },
      {
        name: "params",
        originalValue: Object.keys(canonical.technical || {}).length,
        adaptedValue: Object.keys(params).length,
        wasModified: true,
        modificationReason: "extracted_to_params",
      },
    ],
    adapterNotes,
    metadata: {
      targetId: "api_directive",
      profileId: "generic_api",
      adapterVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    },
  }
}
