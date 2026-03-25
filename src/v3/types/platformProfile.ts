/**
 * Platform Profile Types
 * 
 * Describes capabilities and constraints of different AI generation platforms
 * Used for prompt adaptation and parameter mapping
 */

/**
 * Prompt style preference for different platforms
 * - compressed: Concise, keyword-focused (Midjourney)
 * - cinematic: Natural language, director-style (Sora, Runway)
 * - directive: Instruction-based, imperative mood (Grok, some SD models)
 */
export type PromptStyle = "compressed" | "cinematic" | "directive";

/**
 * Parameter type supported by platform
 * - flag: --flag value format (Midjourney)
 * - json: JSON object format (APIs)
 * - query: ?param=value format (web APIs)
 * - nested: nested object structure
 */
export type ParamFormat = "flag" | "json" | "query" | "nested";

/**
 * Platform capability profile
 * 
 * Defines what features a platform supports and how to format parameters
 */
export type PlatformProfile = {
  /** Unique identifier for this platform */
  id: string;
  
  /** Display name */
  displayName?: string;
  
  /** Supported media types */
  media: Array<"image" | "video">;
  
  /** Prompt writing style preference */
  promptStyle: PromptStyle;
  
  /** Whether platform supports timeline/duration for video */
  supportsTimeline: boolean;
  
  /** Whether platform has dedicated aspect ratio parameter */
  supportsAspectRatioParam: boolean;
  
  /** Whether platform accepts reference images */
  supportsReferenceImage: boolean;
  
  /** Whether platform supports character reference (consistent characters) */
  supportsCharacterReference: boolean;
  
  /** Whether platform supports negative prompts */
  supportsNegativePrompt: boolean;
  
  /** Maximum prompt length in characters (optional constraint) */
  maxPromptLength?: number;
  
  /** Parameter name mappings for this platform */
  paramMapping?: Record<string, string>;
  
  /** Parameter format style */
  paramFormat?: ParamFormat;
  
  /** Default values for platform-specific parameters */
  defaults?: Record<string, any>;
  
  /** Platform-specific features */
  features?: {
    /** Upscaling support */
    upscaling?: boolean;
    /** Variation support */
    variations?: boolean;
    /** Inpainting support */
    inpainting?: boolean;
    /** Outpainting support */
    outpainting?: boolean;
    /** Image-to-video support */
    imageToVideo?: boolean;
    /** Multi-shot consistency */
    multiShotConsistency?: boolean;
    /** Camera control */
    cameraControl?: boolean;
    /** Motion brush */
    motionBrush?: boolean;
  };
  
  /** Model versions available */
  models?: Array<{
    id: string;
    name: string;
    description?: string;
    default?: boolean;
  }>;
};

/**
 * Platform adapter function signature
 * Takes canonical prompt and platform profile, returns adapted prompt
 */
export type PlatformAdapterFn = (
  canonicalPrompt: any,
  profile: PlatformProfile,
  options?: Record<string, any>
) => {
  prompt: string;
  parameters?: Record<string, any>;
  negativePrompt?: string;
};
