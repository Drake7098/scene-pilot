/**
 * Adapter: TemplateIndex -> TemplateWorkspaceItem (UnifiedTemplate).
 * For base 400 only. Continuity templates return null.
 */

import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceItem } from "../../../data/templateWorkspaceData";
import { getTemplateLibrary400 } from "../../../data/templateLibrary400";

export function getTemplateWorkspaceItemFromIndex(
  index: TemplateIndex
): TemplateWorkspaceItem | null {
  if (index.domain && index.domain !== "base") return null;
  const items = getTemplateLibrary400();
  return items.find((t: { id: string }) => t.id === index.id) ?? null;
}

/** Get cost/name for any template (base or continuity). */
export function getTemplateMetadataFromIndex(index: TemplateIndex) {
  return {
    id: index.id,
    cost: index.cost,
    isFree: index.isFree,
    name: index.nameEn,
    nameZh: index.nameZh
  };
}
