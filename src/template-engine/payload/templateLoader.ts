/**
 * Load template payload by id - base and continuity.
 */

import type { TemplatePayload } from "../types/templatePayload";
import type { TemplateIndex } from "../types/templateIndex";
import { getTemplateIndexById, getTemplateIndex } from "../index/templateIndexData";
import { buildTemplatePayload } from "../factory/buildTemplatePayload";
import { getCuratedPhase1Payload } from "../../data/curatedTemplates_phase1_CL";

const payloadCache = new Map<string, TemplatePayload>();

function cacheKey(familyId: string, variant: string): string {
  return `${familyId}:${variant}`;
}

export async function loadTemplatePayload(
  familyId: string,
  variant: string
): Promise<TemplatePayload> {
  getTemplateIndex();
  const key = cacheKey(familyId, variant);
  const cached = payloadCache.get(key);
  if (cached) return cached;

  const payload = await buildTemplatePayload(
    familyId,
    variant as import("../types/templateTypes").TemplateVariant
  );
  payloadCache.set(key, payload);
  return payload;
}

export async function loadTemplatePayloadById(id: string): Promise<TemplatePayload | null> {
  // 精选模板：直接从本地表返回 payload
  if (id.startsWith("curated_")) {
    const curated = getCuratedPhase1Payload(id);
    if (curated) return curated;
  }

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
