/**
 * Template grid container - chooses render strategy by item count.
 * Normal: TemplateWorkspaceGrid (direct render).
 * Virtual: TemplateWorkspaceGridVirtual (reserved for 1000+).
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import { TemplateWorkspaceGridVirtual } from "./TemplateWorkspaceGridVirtual";
import { GRID_VIRTUALIZATION_THRESHOLD } from "../constants/gridStrategy";

type Props = {
  lang: Lang;
  items: (TemplateIndex | UserPrivateTemplate)[];
  view: "grid" | "list";
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex | UserPrivateTemplate) => void;
  clickToUse?: boolean;
  showSelectedState?: boolean;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  canToggleExpanded?: boolean;
  expanded?: boolean;
  hiddenCount?: number;
  onToggleExpanded?: () => void;
  /** Template id -> resolved pricing (null = loading). */
  pricingMap?: Record<string, TemplatePricingResult | null>;
  /** Whether user owns the template (no repeat charge). */
  isTemplateOwned?: (templateId: string) => boolean;
  sceneHintsZh?: string[];
  sceneHintsEn?: string[];
};

/** Shared props for both grid implementations. */
const gridProps = (
  p: Props
): React.ComponentProps<typeof TemplateWorkspaceGrid> => ({
  lang: p.lang,
  items: p.items,
  view: p.view,
  selectedId: p.selectedId,
  onSelect: p.onSelect,
  onUse: p.onUse,
  clickToUse: p.clickToUse,
  showSelectedState: p.showSelectedState,
  isFavorite: p.isFavorite,
  onToggleFavorite: p.onToggleFavorite,
  canToggleExpanded: p.canToggleExpanded,
  expanded: p.expanded,
  hiddenCount: p.hiddenCount,
  onToggleExpanded: p.onToggleExpanded,
  pricingMap: p.pricingMap,
  isTemplateOwned: p.isTemplateOwned,
  sceneHintsZh: p.sceneHintsZh,
  sceneHintsEn: p.sceneHintsEn
});

export function TemplateGridContainer(props: Props) {
  const useVirtual = props.items.length >= GRID_VIRTUALIZATION_THRESHOLD;

  if (useVirtual) {
    return <TemplateWorkspaceGridVirtual {...gridProps(props)} />;
  }
  return <TemplateWorkspaceGrid {...gridProps(props)} />;
}
