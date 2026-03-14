/**
 * Template workspace header - search + filters + close.
 */

import React from "react";
import { Search, X } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateWorkspaceFilters } from "../model/templateFilter";

const colors = {
  panel: "#24262b",
  border: "#3a3f46",
  bg: "#1f2125",
  text: "#e5e7eb",
  textMuted: "#9ca3af"
};

type Props = {
  lang: Lang;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: TemplateWorkspaceFilters;
  onFiltersChange: (f: TemplateWorkspaceFilters) => void;
  onClose: () => void;
  totalCount?: number;
  freeCount?: number;
};

export function TemplateWorkspaceHeader({
  lang,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClose,
  totalCount,
  freeCount
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <div style={styles.wrap}>
      {totalCount != null ? (
        <span style={styles.countBadge}>
          {totalCount} {t("模板", "templates")}
          {freeCount != null ? ` · ${freeCount} ${t("免费", "free")}` : ""}
        </span>
      ) : null}
      <div style={styles.searchWrap}>
        <Search size={14} style={styles.searchIcon} />
        <input
          type="text"
          placeholder={t("搜索模板…", "Search templates…")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      <div style={styles.filters}>
        <select
          value={filters.mediaType}
          onChange={(e) =>
            onFiltersChange({ ...filters, mediaType: e.target.value as TemplateWorkspaceFilters["mediaType"] })
          }
          style={styles.select}
        >
          <option value="all">{t("图/视频", "Image/Video")}</option>
          <option value="image">{t("图", "Image")}</option>
          <option value="video">{t("视频", "Video")}</option>
        </select>
        <select
          value={filters.storyPlan}
          onChange={(e) =>
            onFiltersChange({ ...filters, storyPlan: e.target.value as TemplateWorkspaceFilters["storyPlan"] })
          }
          style={styles.select}
        >
          <option value="all">{t("单镜/连续/多机位/剪辑", "Shot plan")}</option>
          <option value="single">{t("单镜", "Single")}</option>
          <option value="continuous">{t("连续", "Continuous")}</option>
          <option value="multi_cam">{t("多机位", "Multi-cam")}</option>
          <option value="edited">{t("剪辑", "Edit")}</option>
        </select>
        <select
          value={filters.ratio}
          onChange={(e) =>
            onFiltersChange({ ...filters, ratio: e.target.value as TemplateWorkspaceFilters["ratio"] })
          }
          style={styles.select}
        >
          <option value="all">{t("比例", "Ratio")}</option>
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
        </select>
        <select
          value={filters.domain ?? "all"}
          onChange={(e) =>
            onFiltersChange({ ...filters, domain: e.target.value as TemplateWorkspaceFilters["domain"] })
          }
          style={styles.select}
        >
          <option value="all">{t("全部域", "All domains")}</option>
          <option value="base">{t("基础", "Base")}</option>
          <option value="webdrama_continuity">{t("网剧连续", "Web Drama")}</option>
          <option value="anime_continuity">{t("动漫连续", "Anime")}</option>
        </select>
        <select
          value={filters.pricing}
          onChange={(e) =>
            onFiltersChange({ ...filters, pricing: e.target.value as TemplateWorkspaceFilters["pricing"] })
          }
          style={styles.select}
        >
          <option value="all">{t("免费/付费", "Free/Paid")}</option>
          <option value="free">{t("免费", "Free")}</option>
          <option value="paid">{t("付费", "Paid")}</option>
        </select>
      </div>
      <button type="button" onClick={onClose} style={styles.closeBtn} aria-label={t("关闭", "Close")}>
        <X size={18} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  countBadge: { fontSize: 11, color: colors.textMuted },
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    background: colors.panel,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0
  },
  searchWrap: {
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
  searchIcon: { color: colors.textMuted, flexShrink: 0 },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: colors.text,
    fontSize: 12
  },
  filters: { display: "flex", gap: 8 },
  select: {
    padding: "6px 10px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 11,
    cursor: "pointer"
  },
  closeBtn: {
    padding: 6,
    background: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.textMuted,
    cursor: "pointer"
  }
};
