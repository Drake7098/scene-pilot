/**
 * Register 40 family bases + 400 variant patches from templateLibrary400.
 * Ensures buildTemplatePayload(familyId, variant) produces full payload.
 */

import type { TemplatePayload, TemplateSceneSnapshot, TemplateProjectDefaults } from "../../model/templatePayload";
import type { TemplateVariant } from "../../model/templateTypes";
import { registerFamilyBase } from "../../factory/familyBases";
import { registerVariantPatch } from "../../factory/variantPatches";
import { getTemplateLibrary400 } from "../../../../data/templateLibrary400";

function parseId(id: string): { familyId: string; variant: string } | null {
  const m = id.match(/^tpl400_(.+)_([a-z0-9_]+)$/);
  return m ? { familyId: m[1], variant: m[2] } : null;
}

function toProjectDefaults(item: { mediaType: string; storyPlan: string; ratio: string }): TemplateProjectDefaults {
  return {
    mediaType: item.mediaType as "image" | "video",
    storyPlan: item.storyPlan as TemplateProjectDefaults["storyPlan"],
    aspectRatio: item.ratio as TemplateProjectDefaults["aspectRatio"]
  };
}

let _registered = false;

export function registerTemplate400BasesAndPatches(): void {
  if (_registered) return;
  _registered = true;

  const items = getTemplateLibrary400();
  const byFamily = new Map<string, typeof items>();
  for (const item of items) {
    const p = parseId(item.id);
    if (!p) continue;
    const list = byFamily.get(p.familyId) ?? [];
    list.push(item);
    byFamily.set(p.familyId, list);
  }

  for (const [familyId, familyItems] of byFamily) {
    const freeStarter = familyItems.find((x) => x.variant === "free_starter");
    if (!freeStarter) continue;

    const basePayload: TemplatePayload = {
      projectDefaults: toProjectDefaults(freeStarter),
      scenes: [
        {
          nameEn: freeStarter.name,
          nameZh: freeStarter.nameZh,
          duration: freeStarter.scene?.duration_s ?? 6,
          raw: freeStarter.scene
        } as TemplateSceneSnapshot
      ]
    };
    registerFamilyBase(familyId, basePayload);

    for (const item of familyItems) {
      const variant = item.variant as TemplateVariant;
      const patch: Partial<TemplatePayload> =
        variant === "free_starter"
          ? {}
          : {
              projectDefaults: toProjectDefaults(item),
              scenes: [
                {
                  nameEn: item.name,
                  nameZh: item.nameZh,
                  duration: item.scene?.duration_s ?? 6,
                  raw: item.scene
                } as TemplateSceneSnapshot
              ]
            };
      registerVariantPatch(familyId, variant, patch);
    }
  }
}
