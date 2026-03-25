/**
 * Adapted Prompt Result Types
 * 
 * Output structure from adapter functions
 * Contains all information needed for delivery/execution
 */

/**
 * Parameter validation result
 */
export type ParameterValidation = {
  /** Parameter name */
  name: string;
  
  /** Original value from canonical */
  originalValue: any;
  
  /** Adapted value for target platform */
  adaptedValue: any;
  
  /** Whether parameter was modified */
  wasModified: boolean;
  
  /** Reason for modification (if any) */
  modificationReason?: "truncated" | "mapped" | "defaulted" | "removed" | "platform_constraint";
};

/**
 * Warning or info message from adapter
 */
export type AdapterWarning = {
  /** Warning severity */
  level: "info" | "warning" | "error";
  
  /** Warning code for programmatic handling */
  code: string;
  
  /** User-friendly message */
  message: string;
  
  /** Affected field/path (if any) */
  field?: string;
  
  /** Suggested fix (if any) */
  suggestion?: string;
};

/**
 * Adapted prompt result
 * 
 * Complete output from adapter including prompt, parameters, and metadata
 */
export type AdaptedPromptResult = {
  /** Final prompt text ready for delivery */
  promptText: string;
  
  /** Platform-specific parameters */
  params: Record<string, any>;
  
  /** Negative prompt (if platform supports it) */
  negativePrompt?: string;
  
  /** Validation results for all parameters */
  parameterValidations: ParameterValidation[];
  
  /** Warnings and info messages */
  warnings: AdapterWarning[];
  
  /** Fields that were dropped during adaptation */
  droppedFields: Array<{
    fieldName: string;
    reason: "not_supported" | "too_long" | "invalid_value" | "platform_constraint";
    originalValue?: any;
  }>;
  
  /** Adapter execution notes (for debugging) */
  adapterNotes: string[];
  
  /** Execution metadata */
  metadata: {
    /** Target ID used */
    targetId: string;
    
    /** Profile ID used */
    profileId: string;
    
    /** Adapter version */
    adapterVersion: string;
    
    /** Execution timestamp */
    timestamp: string;
    
    /** Processing time in ms */
    processingTimeMs: number;
  };
  
  /** Delivery instructions (if different from standard flow) */
  deliveryInstructions?: {
    /** Override delivery channel */
    channelOverride?: string;
    
    /** Additional payload for delivery */
    extraPayload?: Record<string, any>;
    
    /** Pre-delivery hooks to execute */
    preHooks?: Array<{
      hookId: string;
      params?: Record<string, any>;
    }>;
  };
  
  /** Resource references (images, videos, etc.) */
  resources?: Array<{
    type: "reference_image" | "character_reference" | "style_reference" | "mask" | "input_video";
    url?: string;
    localPath?: string;
    paramKey: string; // Which parameter this maps to
  }>;
};

/**
 * Adapter function signature
 * 
 * All adapter implementations must conform to this
 */
export type AdapterFn = (
  canonicalPrompt: any,
  profile: any,
  target: any,
  options?: AdapterOptions
) => AdaptedPromptResult;

/**
 * Adapter options
 */
export type AdapterOptions = {
  /** User preferences */
  userPreferences?: {
    /** Prefer shorter prompts */
    preferConcise?: boolean;
    
    /** Enable advanced parameters */
    enableAdvanced?: boolean;
    
    /** Custom style overrides */
    styleOverrides?: Record<string, any>;
  };
  
  /** Context information */
  context?: {
    /** Previous generation IDs (for consistency) */
    previousGenerationIds?: string[];
    
    /** Active project ID */
    projectId?: string;
    
    /** Current workspace mode */
    workspaceMode?: "quick" | "pro";
  };
  
  /** Constraints */
  constraints?: {
    /** Maximum prompt length */
    maxPromptLength?: number;
    
    /** Required parameters */
    requiredParams?: string[];
    
    /** Forbidden parameters */
    forbiddenParams?: string[];
  };
  
  /** Resources */
  resources?: {
    /** Reference images */
    referenceImages?: Array<{ url: string; type: string }>;
    
    /** Character references */
    characterRefs?: Array<{ url: string; name: string }>;
    
    /** Input video for img2vid */
    inputVideo?: { url: string; duration?: number };
  };
};
