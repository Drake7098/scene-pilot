/**
 * Template quick entry - sidebar block for recent/favorites, opens workspace.
 */

import React from "react";
import { LayoutGrid } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import { getRecentFromIndex, getFavoritesFromIndex } from "../services/templateSearchService";
import { getTemplateIndex } from "../data/templateIndexData";

type Props = {
  lang: Lang;
  onOpenWorkspace: () => void;
  onUseTemplate: (item: TemplateIndex) => void;
};

export function TemplateQuickEntry({
  lang,
  onOpenWorkspace,
  onUseTemplate
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const recent = getRecentFromIndex().slice(0, 3);
  const favorites = getFavoritesFromIndex().slice(0, 3);
  const all = getTemplateIndex();
  const displayRecent =
    recent.length > 0 ? recent : all.filter((x) => x.isFree).slice(0, 3);

  return (
    <div style={styles.wrap}>
      <button type="button" style={styles.openBtn} onClick={onOpenWorkspace}>
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
                title={lang === "zh" ? item.nameZh : item.nameEn}
              >
                {lang === "zh" ? item.nameZh : item.nameEn}
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
                title={lang === "zh" ? item.nameZh : item.nameEn}
              >
                {lang === "zh" ? item.nameZh : item.nameEn}
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
    background: "#24262b",
    border: "1px solid #3a3f46",
    borderRadius: 8,
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  section: {},
  sectionTitle: {
    fontSize: 11,
    color: "#9ca3af",
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
    color: "#e5e7eb",
    fontSize: 12,
    cursor: "pointer",
    borderRadius: 4
  }
};
