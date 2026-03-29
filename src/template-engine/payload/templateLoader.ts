/**
 * Load template payload by id - base and continuity.
 */

import type { TemplatePayload } from "../types/templatePayload";
import type { TemplateIndex } from "../types/templateIndex";
import { normalizeAndValidateTemplatePayload } from "../types/templatePayload";
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
  const validated = normalizeAndValidateTemplatePayload(payload, {
    templateId: `${familyId}:${variant}`
  });
  const next = validated.normalized;
  payloadCache.set(key, next);
  return next;
}

export async function loadTemplatePayloadById(id: string): Promise<TemplatePayload | null> {
  // 精选模板：直接从本地表返回 payload
  if (id.startsWith("curated_")) {
    const curated = getCuratedPhase1Payload(id);
    if (curated) {
      const validated = normalizeAndValidateTemplatePayload(curated, {
        templateId: id
      });
      return validated.ok ? validated.normalized : null;
    }
  }

  // V3 模板：走 V3 payload loader（避免回落到旧 tpl400 兼容链导致 template not found）
  if (id.startsWith("v3_")) {
    const { loadV3TemplatePayload } = await import("../data/v3/loader");
    const payload = await loadV3TemplatePayload(id);
    if (!payload) return null;
    const idx = getTemplateIndexById(id);
    const validated = normalizeAndValidateTemplatePayload(payload, {
      templateId: id,
      nameZh: idx?.nameZh,
      nameEn: idx?.nameEn,
      descriptionZh: idx?.descriptionZh,
      descriptionEn: idx?.descriptionEn,
      mediaType: idx?.mediaType,
      storyPlan: idx?.storyPlan,
      ratio: idx?.ratio,
      isFree: idx?.isFree,
      cost: idx?.cost,
      category: idx?.category,
      domain: idx?.domain,
      tags: idx?.tags
    });
    return validated.ok ? validated.normalized : null;
  }

  const index = getTemplateIndexById(id);
  if (!index) return null;

  if (id.startsWith("tpl600_webdrama_")) {
    const { loadContinuityPayload } = await import("./templateContinuityLoader");
    const p = await loadContinuityPayload("webdrama_continuity", index.familyId, index.variantId);
    const validated = normalizeAndValidateTemplatePayload(p, {
      templateId: id,
      nameZh: index.nameZh,
      nameEn: index.nameEn,
      descriptionZh: index.descriptionZh,
      descriptionEn: index.descriptionEn,
      mediaType: index.mediaType,
      storyPlan: index.storyPlan,
      ratio: index.ratio,
      isFree: index.isFree,
      cost: index.cost,
      category: index.category,
      domain: index.domain,
      tags: index.tags
    });
    return validated.ok ? validated.normalized : null;
  }
  if (id.startsWith("tpl600_anime_")) {
    const { loadContinuityPayload } = await import("./templateContinuityLoader");
    const p = await loadContinuityPayload("anime_continuity", index.familyId, index.variantId);
    const validated = normalizeAndValidateTemplatePayload(p, {
      templateId: id,
      nameZh: index.nameZh,
      nameEn: index.nameEn,
      descriptionZh: index.descriptionZh,
      descriptionEn: index.descriptionEn,
      mediaType: index.mediaType,
      storyPlan: index.storyPlan,
      ratio: index.ratio,
      isFree: index.isFree,
      cost: index.cost,
      category: index.category,
      domain: index.domain,
      tags: index.tags
    });
    return validated.ok ? validated.normalized : null;
  }

  const payload = await loadTemplatePayload(index.familyId, index.variant ?? index.variantId);
  const validated = normalizeAndValidateTemplatePayload(payload, {
    templateId: id,
    nameZh: index.nameZh,
    nameEn: index.nameEn,
    descriptionZh: index.descriptionZh,
    descriptionEn: index.descriptionEn,
    mediaType: index.mediaType,
    storyPlan: index.storyPlan,
    ratio: index.ratio,
    isFree: index.isFree,
    cost: index.cost,
    category: index.category,
    domain: index.domain,
    tags: index.tags
  });
  return validated.ok ? validated.normalized : null;
}

export function clearPayloadCache(): void {
  payloadCache.clear();
}
