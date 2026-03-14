/**
 * Template loader - fetch full payload by familyId+variant or index id.
 * Supports lazy loading: index first, full payload on demand.
 */

import type { TemplatePayload } from "../model/templatePayload";
import type { TemplateIndex } from "../model/templateIndex";
import { getTemplateIndexById, getTemplateIndex } from "../data/templateIndexData";
import { buildTemplatePayload } from "../factory/buildTemplatePayload";

const payloadCache = new Map<string, TemplatePayload>();

function cacheKey(familyId: string, variant: string): string {
  return `${familyId}:${variant}`;
}

/**
 * Load full template payload. Uses cache when available.
 * Ensures family/variant registration is done before loading.
 */
export async function loadTemplatePayload(
  familyId: string,
  variant: string
): Promise<TemplatePayload> {
  getTemplateIndex(); // ensure registration
  const key = cacheKey(familyId, variant);
  const cached = payloadCache.get(key);
  if (cached) return cached;

  const payload = await buildTemplatePayload(
    familyId,
    variant as import("../model/templateTypes").TemplateVariant
  );
  payloadCache.set(key, payload);
  return payload;
}

/**
 * Load by template index id.
 * Supports: tpl400_* (base), tpl600_webdrama_*, tpl600_anime_*
 */
export async function loadTemplatePayloadById(id: string): Promise<TemplatePayload | null> {
  const index = getTemplateIndexById(id);
  if (!index) return null;

  if (id.startsWith("tpl600_webdrama_")) {
    const { loadContinuityPayload } = await import("./templateContinuityLoader");
    return loadContinuityPayload("webdrama_continuity", index.familyId, index.variantId);
  }
  if (id.startsWith("tpl600_anime_")) {
    const { loadContinuityPayload } = await import("./templateContinuityLoader");
    return loadContinuityPayload("anime_continuity", index.familyId, index.variantId);
  }

  return loadTemplatePayload(index.familyId, index.variant ?? index.variantId);
}

export function clearPayloadCache(): void {
  payloadCache.clear();
}
