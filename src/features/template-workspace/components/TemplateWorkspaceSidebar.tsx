/**
 * Template workspace sidebar - wraps category nav.
 */

import React from "react";
import { TemplateCategoryNav } from "./TemplateCategoryNav";
import type { Lang } from "../../../i18n";
import type { TemplateWorkspaceScope } from "../model/templateFilter";

type Props = {
  lang: Lang;
  scope: TemplateWorkspaceScope;
  category: string | null;
  onScopeChange: (s: TemplateWorkspaceScope) => void;
  onCategoryChange: (c: string | null) => void;
};

export function TemplateWorkspaceSidebar(props: Props) {
  return <TemplateCategoryNav {...props} />;
}
