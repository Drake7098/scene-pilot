/**
 * Canonical Prompt Types
 * 
 * Structured representation of V3 prompt for platform adaptation
 * Used as intermediate format before adapting to fal / midjourney / sora / grok
 */

export type CanonicalObjectRole = "primary" | "secondary" | "foreground" | "background";

export type CanonicalObject = {
  /** Object identifier or descriptive name */
  name: string;
  /** Role in the scene */
  role: CanonicalObjectRole;
  /** Spatial position (e.g., "centered, mid-frame") */
  position?: string;
  /** Relative size (e.g., "prominently sized", "small in frame") */
  size?: string;
  /** Visual appearance description */
  look?: string;
  /** Costume / clothing / surface finish */
  costume?: string;
  /** Props and accessories */
  props?: string[];
  /** Action or pose */
  action?: string;
  /** Expression or emotional state */
  state?: string;
  /** Micro-details */
  detail?: string;
  /** External prompt override */
  externalPrompt?: string;
};

export type CanonicalCamera = {
  /** Shot size: ECU, CU, MCU, MS, FS, LS, XLS */
  shot?: string;
  /** Focal length: 14mm, 24mm, 35mm, 50mm, 85mm, etc. */
  lens?: string;
  /** Camera angle: eye_level, low_angle, high_angle, dutch */
  angle?: string;
  /** Depth of field: very_shallow, shallow, medium, deep, full_focus */
  dof?: string;
  /** Camera movement: static, slow_push, pull_back, tracking, etc. */
  movement?: string;
  /** Duration in seconds (video only) */
  durationSec?: number;
};

export type CanonicalLighting = {
  /** Time of day: golden_hour, blue_hour, night, dawn, etc. */
  time?: string;
  /** Light direction: front, side, back, top, rim */
  direction?: string;
  /** Lighting mood: dramatic, serene, mysterious, etc. */
  mood?: string;
  /** Color temperature: 2700K, 3200K, 5600K, etc. */
  colorTemp?: string;
  /** Special lighting effects: volumetric, lens_flare, neon, etc. */
  specialEffects?: string[];
};

export type CanonicalComposition = {
  /** Aspect ratio: 16:9, 9:16, 4:5, 21:9, 1:1 */
  aspectRatio?: string;
  /** Framing style description */
  framing?: string;
  /** Layout notes */
  layout?: string;
};

export type CanonicalMotion = {
  /** Natural language motion description */
  description?: string;
  /** Motion path for primary object */
  primaryPath?: string;
  /** Motion paths for secondary objects */
  secondaryPaths?: Array<{ id: string; path: string }>;
};

export type CanonicalStyle = {
  /** Render style: commercial, editorial, photorealistic, etc. */
  renderStyle?: string;
  /** Director pack reference */
  directorPack?: string;
  /** Color grade: teal_orange, warm_golden, cool_steel, etc. */
  colorGrade?: string;
  /** Film look characteristics */
  filmLook?: string;
};

export type CanonicalEnvironment = {
  /** Background preset */
  background?: string;
  /** Environment mood */
  mood?: string;
};

export type CanonicalTechnical = {
  /** Quality suffix */
  quality?: string;
  /** Post-process notes */
  postProcess?: string;
};

/**
 * Canonical Prompt structure
 * 
 * This is the intermediate format between compileV3 output
 * and platform-specific adapters (fal, midjourney, sora, grok)
 */
export type CanonicalPrompt = {
  /** Raw prompt string from compileV3 */
  basePrompt: string;
  
  /** Media type */
  media: "image" | "video";
  
  /** Objects in the scene with their roles and attributes */
  objects: CanonicalObject[];
  
  /** Camera settings */
  camera?: CanonicalCamera;
  
  /** Lighting configuration */
  lighting?: CanonicalLighting;
  
  /** Composition settings */
  composition?: CanonicalComposition;
  
  /** Motion description (video only) */
  motion?: CanonicalMotion;
  
  /** Style references */
  style?: CanonicalStyle;
  
  /** Environment settings */
  environment?: CanonicalEnvironment;
  
  /** Technical specifications */
  technical?: CanonicalTechnical;
  
  /** Machine-readable structure guide (optional) */
  structureGuide?: string;
};
