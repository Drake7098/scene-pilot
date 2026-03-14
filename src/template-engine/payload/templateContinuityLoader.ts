/**
 * Load continuity payloads (webdrama, anime).
 */

import type { TemplatePayload } from "../types/templatePayload";
import { buildWebdramaPayload } from "../data/families/continuity-webdrama/buildPayload";
import { buildAnimePayload } from "../data/families/continuity-anime/buildPayload";
import { WEBDRAMA_FAMILIES } from "../data/families/continuity-webdrama/families";
import { ANIME_FAMILIES } from "../data/families/continuity-anime/families";

export async function loadContinuityPayload(
  domain: "webdrama_continuity" | "anime_continuity",
  familyId: string,
  variantId: string
): Promise<TemplatePayload> {
  if (domain === "webdrama_continuity") {
    const family = WEBDRAMA_FAMILIES.find((f) => f.id === familyId);
    if (!family) throw new Error(`Webdrama family not found: ${familyId}`);
    return buildWebdramaPayload(family, variantId as import("../types/templateTypes").ContinuityVariantWebdrama);
  }
  if (domain === "anime_continuity") {
    const family = ANIME_FAMILIES.find((f) => f.id === familyId);
    if (!family) throw new Error(`Anime family not found: ${familyId}`);
    return buildAnimePayload(family, variantId as import("../types/templateTypes").ContinuityVariantAnime);
  }
  throw new Error(`Unknown continuity domain: ${domain}`);
}
