/**
 * Template list view - wrapper that forces view=list.
 */

import React from "react";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";

type Props = {
  lang: Lang;
  items: (TemplateIndex | UserPrivateTemplate)[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex | UserPrivateTemplate) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  pricingMap?: Record<string, import("../../../pricing/templatePricingTypes").TemplatePricingResult | null>;
  isTemplateOwned?: (templateId: string) => boolean;
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
