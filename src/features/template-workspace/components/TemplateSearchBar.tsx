/**
 * Template search bar - standalone search input.
 */

import React from "react";
import { Search } from "lucide-react";
import type { Lang } from "../../../i18n";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";

const colors = TEMPLATE_WORKSPACE_UI.colors;

type Props = {
  lang: Lang;
  value: string;
  onChange: (q: string) => void;
};

export function TemplateSearchBar({ lang, value, onChange }: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <div style={styles.wrap}>
      <Search size={14} style={styles.icon} />
      <input
        type="text"
        placeholder={t("搜索模板…", "Search templates…")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    maxWidth: 260,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8
  },
  icon: { color: colors.textMuted, flexShrink: 0 },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: colors.text,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.body
  }
};
