/**
 * Generation preferences: last-used profile and provider mode.
 * Persisted per user (or anonymous) so "one click" uses same choice next time.
 */

export type ImageGenerationProfile = "image_standard" | "image_hq";
export type VideoGenerationProfile = "video_standard" | "video_hq";
export type GenerationProfile = ImageGenerationProfile | VideoGenerationProfile;
export type GenerationProviderMode = "api" | "local_comfy" | "local_draw";

const KEY_PREFIX = "scenepilot_gen_prefs_v1";

function storageKey(userId: string | null): string {
  return userId ? `${KEY_PREFIX}_${userId}` : `${KEY_PREFIX}_anon`;
}

export type StoredGenerationPrefs = {
  lastImageProfile: ImageGenerationProfile;
  lastVideoProfile: VideoGenerationProfile;
  lastProviderMode: GenerationProviderMode;
};

const DEFAULTS: StoredGenerationPrefs = {
  lastImageProfile: "image_standard",
  lastVideoProfile: "video_standard",
  lastProviderMode: "api",
};

export function loadGenerationPreferences(userId: string | null): StoredGenerationPrefs {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<StoredGenerationPrefs>;
    return {
      lastImageProfile: parsed.lastImageProfile === "image_hq" ? "image_hq" : "image_standard",
      lastVideoProfile: parsed.lastVideoProfile === "video_hq" ? "video_hq" : "video_standard",
      lastProviderMode:
        parsed.lastProviderMode === "local_comfy"
          ? "local_comfy"
          : parsed.lastProviderMode === "local_draw"
            ? "local_draw"
            : "api",
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGenerationPreferences(
  userId: string | null,
  prefs: Partial<StoredGenerationPrefs>
): void {
  try {
    const current = loadGenerationPreferences(userId);
    const next = { ...current, ...prefs };
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Current profile for a given media mode (from stored prefs or default). */
export function currentProfileForMedia(
  prefs: StoredGenerationPrefs,
  mediaMode: "image" | "video"
): GenerationProfile {
  return mediaMode === "image" ? prefs.lastImageProfile : prefs.lastVideoProfile;
}
