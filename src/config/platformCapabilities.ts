export type PlatformProfile =
  | "universal"
  | "qwen"
  | "jimeng"
  | "openai"
  | "fal"
  | "runway"
  | "midjourney"
  | "vertex"
  | "grok"
  | "nano_banana";

export type PlatformCapability = {
  supportsImage: boolean;
  supportsVideo: boolean;
  prefersStructuredBlocks: boolean;
  prefersKeywordChain: boolean;
  prefersNaturalLanguage: boolean;
  nativeStrategy: boolean;
  baseProfile: PlatformProfile;
  recommendedPromptStyle: "short" | "long";
  recommendedLanguage: "zh" | "en" | "auto";
  supportsMachineTail: boolean;
  recommendedRefCount: number;
  prefersShortSystemText: boolean;
  maxCharsImage: number;
  maxCharsVideo: number;
};

const BASE: PlatformCapability = {
  supportsImage: true,
  supportsVideo: true,
  prefersStructuredBlocks: false,
  prefersKeywordChain: false,
  prefersNaturalLanguage: true,
  nativeStrategy: true,
  baseProfile: "universal",
  recommendedPromptStyle: "long",
  recommendedLanguage: "auto",
  supportsMachineTail: true,
  recommendedRefCount: 3,
  prefersShortSystemText: false,
  maxCharsImage: 5000,
  maxCharsVideo: 8000,
};

export const PLATFORM_CAPABILITIES: Record<PlatformProfile, PlatformCapability> = {
  universal: { ...BASE, maxCharsImage: 5500, maxCharsVideo: 8500, baseProfile: "universal", recommendedLanguage: "auto" },
  openai: {
    ...BASE,
    prefersNaturalLanguage: true,
    baseProfile: "openai",
    recommendedLanguage: "en",
    recommendedPromptStyle: "long",
    maxCharsImage: 5200,
    maxCharsVideo: 7600
  },
  fal: {
    ...BASE,
    prefersStructuredBlocks: true,
    prefersNaturalLanguage: true,
    baseProfile: "fal",
    recommendedLanguage: "en",
    recommendedPromptStyle: "long",
    maxCharsImage: 4400,
    maxCharsVideo: 6200
  },
  runway: {
    ...BASE,
    prefersNaturalLanguage: true,
    baseProfile: "runway",
    recommendedPromptStyle: "long",
    recommendedLanguage: "en",
    maxCharsImage: 4200,
    maxCharsVideo: 6800
  },
  midjourney: {
    ...BASE,
    supportsVideo: false,
    prefersKeywordChain: true,
    prefersNaturalLanguage: false,
    baseProfile: "midjourney",
    recommendedPromptStyle: "short",
    recommendedLanguage: "en",
    recommendedRefCount: 2,
    prefersShortSystemText: true,
    maxCharsImage: 2600,
    maxCharsVideo: 2600
  },
  qwen: {
    ...BASE,
    prefersStructuredBlocks: true,
    baseProfile: "qwen",
    recommendedPromptStyle: "long",
    recommendedLanguage: "zh",
    maxCharsImage: 4200,
    maxCharsVideo: 7200
  },
  jimeng: {
    ...BASE,
    prefersKeywordChain: true,
    prefersNaturalLanguage: false,
    baseProfile: "jimeng",
    recommendedPromptStyle: "short",
    recommendedLanguage: "zh",
    recommendedRefCount: 2,
    prefersShortSystemText: true,
    maxCharsImage: 3200,
    maxCharsVideo: 5200
  },
  vertex: { ...BASE, prefersStructuredBlocks: true, baseProfile: "vertex", maxCharsImage: 5000, maxCharsVideo: 7600 },
  grok: { ...BASE, prefersStructuredBlocks: true, baseProfile: "grok", maxCharsImage: 4600, maxCharsVideo: 7000 },
  nano_banana: {
    ...BASE,
    prefersStructuredBlocks: true,
    baseProfile: "nano_banana",
    recommendedPromptStyle: "short",
    prefersShortSystemText: true,
    maxCharsImage: 3400,
    maxCharsVideo: 5600
  },
};

export function getPlatformCapability(profile: PlatformProfile): PlatformCapability {
  return PLATFORM_CAPABILITIES[profile] ?? PLATFORM_CAPABILITIES.universal;
}
