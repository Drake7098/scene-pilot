/**
 * Template list view - wrapper that forces view=list.
 */

import React from "react";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";

type Props = {
  lang: Lang;
  items: TemplateIndex[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
};

export function TemplateWorkspaceList(props: Props) {
  return (
    <TemplateWorkspaceGrid
      {...props}
      view="list"
      onViewChange={() => {}}
    />
  );
}
