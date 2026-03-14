import React from "react";
import { LayoutGrid } from "lucide-react";
import type { Lang } from "../../i18n";
import type { TemplateWorkspaceItem } from "../../data/templateWorkspaceData";
import { getRecentTemplates, getFavoriteTemplates, getTemplateWorkspaceItems } from "../../data/templateWorkspaceData";

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
  onOpenWorkspace: () => void;
  onUseTemplate: (item: TemplateWorkspaceItem) => void;
};

export function TemplateWorkspaceEntry({
  lang,
  onOpenWorkspace,
  onUseTemplate
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const recent = getRecentTemplates().slice(0, 3);
  const favorites = getFavoriteTemplates().slice(0, 3);
  const displayRecent = recent.length > 0
    ? recent
    : getTemplateWorkspaceItems().filter((t) => t.isFree).slice(0, 3);
  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.openBtn}
        onClick={onOpenWorkspace}
      >
        <LayoutGrid size={14} style={{ marginRight: 6 }} />
        {t("打开模板工作台", "Open Template Workspace")}
      </button>
      {displayRecent.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t("最近使用", "Recent")}</div>
          <div style={styles.list}>
            {displayRecent.map((item) => (
              <button
                key={item.id}
                type="button"
                style={styles.item}
                onClick={() => onUseTemplate(item)}
                title={lang === "zh" ? (item.nameZh ?? item.name) : item.name}
              >
                {lang === "zh" ? (item.nameZh ?? item.name) : item.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {favorites.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t("收藏", "Favorites")}</div>
          <div style={styles.list}>
            {favorites.map((item) => (
              <button
                key={item.id}
                type="button"
                style={styles.item}
                onClick={() => onUseTemplate(item)}
                title={lang === "zh" ? (item.nameZh ?? item.name) : item.name}
              >
                {lang === "zh" ? (item.nameZh ?? item.name) : item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  openBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.accent,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  section: {},
  sectionTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  item: {
    padding: "4px 8px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    color: colors.text,
    fontSize: 12,
    cursor: "pointer",
    borderRadius: 4
  }
};
