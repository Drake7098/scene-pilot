/**
 * Template category navigation sidebar.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { PRO_TYPO } from "../../../uiTokens";
import type { TemplateWorkspaceScope } from "../model/templateFilter";
import { TEMPLATE_NAV_CATEGORIES } from "../model/templateCategory";

const colors = {
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

type Props = {
  lang: Lang;
  scope: TemplateWorkspaceScope;
  category: string | null;
  onScopeChange: (s: TemplateWorkspaceScope) => void;
  onCategoryChange: (c: string | null) => void;
};

const SCOPE_IDS: TemplateWorkspaceScope[] = [
  "recommended",
  "all",
  "free",
  "recent",
  "favorites",
  "mine"
];

export function TemplateCategoryNav({
  lang,
  scope,
  category,
  onScopeChange,
  onCategoryChange
}: Props) {
  const handleClick = (id: (typeof TEMPLATE_NAV_CATEGORIES)[0]["id"]) => {
    if (SCOPE_IDS.includes(id as TemplateWorkspaceScope)) {
      onScopeChange(id as TemplateWorkspaceScope);
      onCategoryChange(null);
    } else {
      onScopeChange("all");
      onCategoryChange(id);
    }
  };
  const isActive = (id: (typeof TEMPLATE_NAV_CATEGORIES)[0]["id"]) => {
    if (SCOPE_IDS.includes(id as TemplateWorkspaceScope)) {
      return scope === id && !category;
    }
    return category === id;
  };
  return (
    <nav style={styles.wrap}>
      {TEMPLATE_NAV_CATEGORIES.map((item) => (
        <button
          key={item.id}
          type="button"
          style={{
            ...styles.item,
            ...(isActive(item.id) ? styles.itemActive : {})
          }}
          onClick={() => handleClick(item.id)}
        >
          {lang === "zh" ? item.labelZh : item.labelEn}
        </button>
      ))}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 140,
    flexShrink: 0,
    padding: "12px 0",
    borderRight: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    background: colors.panel
  },
  item: {
    padding: "8px 12px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    color: colors.textMuted,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  },
  itemActive: {
    background: colors.hover,
    color: colors.accent
  }
};
