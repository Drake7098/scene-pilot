/**
 * Export Target Types
 * 
 * Defines the target platform/channel for prompt delivery
 * Separates user-facing export targets from underlying API channels
 */

/**
 * Execution mode - how the generation will be performed
 */
export type ExecutionMode = 
  | "instant"        // Direct API call, immediate generation (Fal, Runway)
  | "copy_prompt"    // User copies prompt to external tool (Midjourney, Grok)
  | "queued"         // Server-side queue, async completion (Sora, high-traffic)
  | "local"          // Local execution with connected tools
  | "hybrid";        // Multiple options available (user chooses at runtime)

/**
 * Delivery channel - the actual API endpoint or integration method
 * 
 * Note: This is NOT the same as the platform brand.
 * Example: "Runway" brand could use:
 * - runway_api (official)
 * - fal_runway (via Fal's unified API)
 * - replicate_runway (via Replicate)
 */
export type DeliveryChannel =
  | "fal_ai"              // Fal.ai unified API
  | "runway_api"          // RunwayML official API
  | "replicate"           // Replicate.com
  | "openai_api"          // OpenAI API (Sora, DALL-E)
  | "stability_api"       // Stability AI API
  | "volcengine_jimeng"   // 即梦 (Volcengine)
  | "volcengine_doubao"   // 豆包 (Volcengine)
  | "midjourney_web"      // Midjourney web alpha (no official API)
  | "pika_api"            // Pika Labs API
  | "local_comfyui"       // Local ComfyUI instance
  | "local_automatic1111" // Local SD WebUI
  | "custom_http"         // Custom HTTP endpoint
  | "none";               // No delivery (preview/export only)

/**
 * Integration type - how this target integrates with ScenePilot
 */
export type IntegrationType =
  | "native"         // Full integration, one-click generation
  | "browser_bridge" // Browser automation (for platforms without API)
  | "manual_copy"    // User manually copies prompt
  | "file_export"    // Exports file/package for external use
  | "webhook"        // Async webhook-based integration
  | "sdk";           // Uses platform SDK

/**
 * Export Target configuration
 * 
 * Represents a user-facing option like "Generate with Fal" or "Export for Midjourney"
 */
export type ExportTarget = {
  /** Unique identifier (e.g., "fal-image", "midjourney-v6", "runway-gen3") */
  id: string;
  
  /** User-friendly display name */
  displayName: string;
  
  /** Short description shown in UI */
  description?: string;
  
  /** Execution mode */
  executionMode: ExecutionMode;
  
  /** Supported media types */
  media: Array<"image" | "video">;
  
  /** Which PlatformProfile to use for parameter mapping */
  profileId: string;
  
  /** Which adapter function to use */
  adapterId: string;
  
  /** Actual delivery channel (may differ from brand) */
  deliveryChannel: DeliveryChannel;
  
  /** Integration method */
  integrationType: IntegrationType;
  
  /** Whether this target requires authentication */
  requiresAuth: boolean;
  
  /** Whether this target supports real-time generation */
  supportsInstantGeneration: boolean;
  
  /** Pricing tier required (free/pro/enterprise) */
  requiredTier?: "free" | "pro" | "enterprise";
  
  /** Estimated cost per generation (credits) */
  estimatedCost?: number;
  
  /** Default generation duration for video (seconds) */
  defaultDuration?: number;
  
  /** Available model versions */
  models?: Array<{
    id: string;
    name: string;
    description?: string;
    default?: boolean;
    beta?: boolean;
  }>;
  
  /** Platform-specific capabilities override */
  capabilities?: {
    maxResolution?: string;
    maxDuration?: number;
    supportsUpscaling?: boolean;
    supportsInpainting?: boolean;
    supportsCharacterConsistency?: boolean;
    supportsMotionControl?: boolean;
    supportsCameraControl?: boolean;
  };
  
  /** UI preferences */
  ui?: {
    icon?: string;
    color?: string;
    badge?: "beta" | "pro" | "popular" | "fast";
    group?: string; // For grouping in dropdown
  };
};
