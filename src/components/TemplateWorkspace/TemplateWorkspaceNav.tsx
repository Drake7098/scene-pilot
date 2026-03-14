import React from "react";
import type { Lang } from "../../i18n";
import type { TemplateNavCategory, TemplateWorkspaceScope } from "../../data/templateWorkspaceData";
import { NAV_CATEGORIES } from "../../data/templateWorkspaceData";

const colors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
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

export function TemplateWorkspaceNav({
  lang,
  scope,
  category,
  onScopeChange,
  onCategoryChange
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const handleClick = (id: TemplateNavCategory) => {
    const scopeIds: TemplateWorkspaceScope[] = [
      "recommended",
      "all",
      "free",
      "recent",
      "favorites",
      "mine"
    ];
    if (scopeIds.includes(id as TemplateWorkspaceScope)) {
      onScopeChange(id as TemplateWorkspaceScope);
      onCategoryChange(null);
    } else {
      onScopeChange("all");
      onCategoryChange(id);
    }
  };
  const isActive = (id: TemplateNavCategory) => {
    const scopeIds: TemplateWorkspaceScope[] = [
      "recommended",
      "all",
      "free",
      "recent",
      "favorites",
      "mine"
    ];
    if (scopeIds.includes(id as TemplateWorkspaceScope)) {
      return scope === id && !category;
    }
    return category === id;
  };
  return (
    <nav style={styles.wrap}>
      {NAV_CATEGORIES.map((item) => (
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
    fontSize: 12,
    cursor: "pointer"
  },
  itemActive: {
    background: colors.hover,
    color: colors.accent
  }
};
