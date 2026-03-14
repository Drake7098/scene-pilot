/**
 * Template grid container - chooses render strategy by item count.
 * Normal: TemplateWorkspaceGrid (direct render).
 * Virtual: TemplateWorkspaceGridVirtual (reserved for 1000+).
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import { TemplateWorkspaceGridVirtual } from "./TemplateWorkspaceGridVirtual";
import { GRID_VIRTUALIZATION_THRESHOLD } from "../constants/gridStrategy";

type Props = {
  lang: Lang;
  items: TemplateIndex[];
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
};

/** Shared props for both grid implementations. */
const gridProps = (
  p: Props
): React.ComponentProps<typeof TemplateWorkspaceGrid> => ({
  lang: p.lang,
  items: p.items,
  view: p.view,
  onViewChange: p.onViewChange,
  selectedId: p.selectedId,
  onSelect: p.onSelect,
  onUse: p.onUse,
  isFavorite: p.isFavorite,
  onToggleFavorite: p.onToggleFavorite
});

export function TemplateGridContainer(props: Props) {
  const useVirtual = props.items.length >= GRID_VIRTUALIZATION_THRESHOLD;

  if (useVirtual) {
    return <TemplateWorkspaceGridVirtual {...gridProps(props)} />;
  }
  return <TemplateWorkspaceGrid {...gridProps(props)} />;
}
