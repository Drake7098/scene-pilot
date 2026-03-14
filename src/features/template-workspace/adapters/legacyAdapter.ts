/**
 * @deprecated 主流程已直接使用 TemplateIndex，不再经 UnifiedTemplate。
 * 仅保留供可能的外部调用，禁止新逻辑使用。
 * Adapter: TemplateIndex -> TemplateWorkspaceItem (UnifiedTemplate). Base 400 only.
 */

import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceItem } from "../../../data/templateWorkspaceData";
import { getTemplateMetadataFromIndex } from "../../../template-engine";
import { getTemplateLibrary400 } from "../../../data/templateLibrary400";

export function getTemplateWorkspaceItemFromIndex(
  index: TemplateIndex
): TemplateWorkspaceItem | null {
  if (index.domain && index.domain !== "base") return null;
  const items = getTemplateLibrary400();
  return items.find((t: { id: string }) => t.id === index.id) ?? null;
}

/** Re-export from template-engine. */
export { getTemplateMetadataFromIndex };
