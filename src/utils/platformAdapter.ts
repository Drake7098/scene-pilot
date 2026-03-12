import { adaptPromptWithPlatformEngine } from "./promptEngines";
import type { PlatformAdaptInput, PlatformAdaptMeta, PlatformAdaptResult } from "./promptEngines";

export function adaptPromptToPlatformDetailed(input: PlatformAdaptInput): PlatformAdaptResult {
  return adaptPromptWithPlatformEngine(input);
}

export function adaptPromptToPlatform(input: PlatformAdaptInput): string {
  return adaptPromptToPlatformDetailed(input).prompt;
}
