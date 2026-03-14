/**
 * Build TemplatePayload from templateLibrary400 (fallback when family not registered).
 */

import type { TemplateVariant } from "../types/templateTypes";
import type { TemplatePayload, TemplateSceneSnapshot, TemplateProjectDefaults } from "../types/templatePayload";
import { getTemplateLibrary400 } from "../../data/templateLibrary400";

export async function buildPayloadFromUnifiedTemplate(
  familyId: string,
  variant: TemplateVariant
): Promise<TemplatePayload> {
  const items = getTemplateLibrary400();
  const targetId = `tpl400_${familyId}_${variant}`;
  const t = items.find((x: { id: string }) => x.id === targetId);
  if (!t) {
    throw new Error(`Template not found: ${familyId}:${variant}`);
  }

  const sceneSnapshot: TemplateSceneSnapshot = {
    nameZh: t.nameZh,
    nameEn: t.name,
    duration: t.scene?.duration_s ?? 6,
    raw: t.scene
  };

  const projectDefaults: TemplateProjectDefaults = {
    mediaType: t.mediaType,
    storyPlan: t.storyPlan,
    aspectRatio: t.ratio
  };

  return {
    projectDefaults,
    scenes: [sceneSnapshot],
    objects: t.objects ? (t.objects as TemplatePayload["objects"]) : undefined,
    continuity: undefined,
    exportDefaults: t.exportDefaults ? (t.exportDefaults as TemplatePayload["exportDefaults"]) : undefined
  };
}
