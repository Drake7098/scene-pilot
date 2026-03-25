/**
 * Example: Using buildCanonicalPrompt for platform adaptation
 */

import { buildCanonicalPrompt } from "./buildCanonicalPrompt";
import type { CanonicalPrompt } from "../types/canonicalPrompt";
import type { Scene } from "../../model";

// ── Example Scene Input ────────────────────────────────────────────────────
const exampleScene: Scene = {
  id: "example_001",
  name: "Luxury Watch Commercial",
  notes: `shot_size: MS
focal_length: 85mm
depth_of_field: shallow
render_style: commercial
cam_movement: slow_push
key_light_time: golden_hour
spec_light: volumetric
bg_preset: studio_dark
include_structure_guide: true
look: luxury mechanical wristwatch, polished stainless steel case
detail: intricate dial details, visible gear mechanism`,
  duration_s: 6,
  aspectRatio: "16:9",
  layers: [
    {
      id: "watch",
      name: "luxury watch",
      look: "luxury mechanical wristwatch, polished stainless steel case",
      notes: `detail: intricate dial details, visible gear mechanism`,
      kf: [
        { t: 0, x: 50, y: 50, w: 30, h: 30, rot: 0 },
        { t: 1, x: 50, y: 50, w: 45, h: 45, rot: 0 },
      ],
    },
  ],
};

// ── Build Canonical Prompt ─────────────────────────────────────────────────
const canonical = buildCanonicalPrompt({
  scene: exampleScene,
  lang: "en",
  mediaMode: "video",
  aspectRatio: "16:9",
});

console.log("=== Canonical Prompt ===");
console.log(JSON.stringify(canonical, null, 2));

// ── Example: Platform Adapter Interface ────────────────────────────────────
/**
 * Platform adapter function signature
 * This is what you would implement for fal / midjourney / sora / grok
 */
interface PlatformProfile {
  name: string;
  maxPromptLength?: number;
  supportedMedia: Array<"image" | "video">;
  requiresAspectRatio: boolean;
  requiresDuration: boolean;
  customFields?: Record<string, any>;
}

function adaptPromptToPlatform(
  canonical: CanonicalPrompt,
  platform: PlatformProfile
): string {
  // Example: Midjourney adapter
  if (platform.name === "midjourney") {
    let prompt = canonical.basePrompt;
    
    // Add aspect ratio parameter
    if (platform.requiresAspectRatio && canonical.composition?.aspectRatio) {
      const arMap: Record<string, string> = {
        "16:9": "--ar 16:9",
        "9:16": "--ar 9:16",
        "4:5": "--ar 4:5",
        "1:1": "--ar 1:1",
        "21:9": "--ar 21:9",
      };
      const arParam = arMap[canonical.composition.aspectRatio];
      if (arParam) prompt += ` ${arParam}`;
    }
    
    // Add style parameters
    if (canonical.style?.renderStyle === "commercial") {
      prompt += " --style raw --q 2";
    }
    
    return prompt;
  }
  
  // Example: Runway/Sora adapter
  if (platform.name === "sora" || platform.name === "runway") {
    let prompt = canonical.basePrompt;
    
    // Add motion description
    if (canonical.motion?.description) {
      prompt += `. Motion: ${canonical.motion.description}`;
    }
    
    // Add duration
    if (platform.requiresDuration && canonical.camera?.durationSec) {
      prompt += ` (${canonical.camera.durationSec}s)`;
    }
    
    return prompt;
  }
  
  // Default: return base prompt
  return canonical.basePrompt;
}

// ── Usage Example ──────────────────────────────────────────────────────────
const midjourneyProfile: PlatformProfile = {
  name: "midjourney",
  maxPromptLength: 2000,
  supportedMedia: ["image"],
  requiresAspectRatio: true,
  requiresDuration: false,
};

const soraProfile: PlatformProfile = {
  name: "sora",
  maxPromptLength: 4000,
  supportedMedia: ["video"],
  requiresAspectRatio: true,
  requiresDuration: true,
};

// Adapt for Midjourney
const midjourneyPrompt = adaptPromptToPlatform(canonical, midjourneyProfile);
console.log("\n=== Midjourney Prompt ===");
console.log(midjourneyPrompt);

// Adapt for Sora
const soraPrompt = adaptPromptToPlatform(canonical, soraProfile);
console.log("\n=== Sora Prompt ===");
console.log(soraPrompt);

// ── Export for use in other modules ───────────────────────────────────────
export { buildCanonicalPrompt, adaptPromptToPlatform };
export type { CanonicalPrompt, PlatformProfile };
