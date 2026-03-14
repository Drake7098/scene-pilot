/**
 * Template detail panel - uses TemplateIndex.
 */

import React from "react";
import { Star } from "lucide-react";
import { PRO_TYPO } from "../../../uiTokens";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { ApplyTemplateMode } from "../model/templateFilter";

const colors = {
  panel: "#24262b",
  border: "#3a3f46",
  bg: "#1f2125",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

type Props = {
  lang: Lang;
  template: TemplateIndex | null;
  applyMode: ApplyTemplateMode;
  onApplyModeChange: (m: ApplyTemplateMode) => void;
  onUse: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (templateId: string) => void;
};

export function TemplateWorkspaceDetail({
  lang,
  template,
  applyMode,
  onApplyModeChange,
  onUse,
  isFavorite = false,
  onToggleFavorite
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  if (!template) {
    return (
      <div style={styles.wrap}>
        <div style={styles.empty}>{t("选择模板查看详情", "Select a template to view details")}</div>
      </div>
    );
  }
  const name = lang === "zh" ? template.nameZh : template.nameEn;
  const desc = lang === "zh" ? (template.descriptionZh ?? template.descriptionEn) : template.descriptionEn;
  return (
    <div style={styles.wrap}>
      <div style={styles.section}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>{name}</h3>
          {onToggleFavorite ? (
            <button
              type="button"
              style={{ ...styles.favBtn, ...(isFavorite ? styles.favBtnOn : {}) }}
              onClick={() => onToggleFavorite(template.id)}
              title={isFavorite ? t("取消收藏", "Unfavorite") : t("收藏", "Favorite")}
            >
              <Star
                size={16}
                fill={isFavorite ? colors.accent : "transparent"}
                stroke={isFavorite ? colors.accent : colors.textMuted}
              />
            </button>
          ) : null}
        </div>
        <div style={styles.row}>
          <span style={styles.label}>{t("家族", "Family")}</span>
          <span style={styles.value}>{lang === "zh" ? template.familyNameZh : template.familyNameEn}</span>
        </div>
        {desc && <div style={styles.desc}>{desc}</div>}
        {template.tags?.length ? (
          <div style={styles.tags}>
            {template.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>{t("定价", "Pricing")}</span>
          <span style={styles.value}>
            {template.isFree ? t("免费", "Free") : `${template.cost} ${t("积分", "credits")}`}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>{t("媒体类型", "Media")}</span>
          <span style={styles.value}>
            {template.mediaType === "image" ? t("图片", "Image") : t("视频", "Video")}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>{t("场景类型", "Scene")}</span>
          <span style={styles.value}>{template.storyPlan}</span>
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.modeLabel}>{t("应用模式", "Apply mode")}</div>
        <div style={styles.modeGroup}>
          <label style={styles.modeOption}>
            <input
              type="radio"
              name="applyMode"
              value="layout_only"
              checked={applyMode === "layout_only"}
              onChange={() => onApplyModeChange("layout_only")}
            />
            <span>{t("仅布局", "Layout only")}</span>
          </label>
          <label style={styles.modeOption}>
            <input
              type="radio"
              name="applyMode"
              value="layout_plus_style"
              checked={applyMode === "layout_plus_style"}
              onChange={() => onApplyModeChange("layout_plus_style")}
            />
            <span>{t("布局+风格", "Layout + style")}</span>
          </label>
          <label style={styles.modeOption}>
            <input
              type="radio"
              name="applyMode"
              value="full_workflow"
              checked={applyMode === "full_workflow"}
              onChange={() => onApplyModeChange("full_workflow")}
            />
            <span>{t("完整应用", "Full workflow")}</span>
          </label>
        </div>
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.useBtn} onClick={onUse}>
          {t("使用", "Use")}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 280,
    flexShrink: 0,
    padding: 16,
    background: colors.panel,
    borderLeft: `1px solid ${colors.border}`,
    overflowY: "auto"
  },
  empty: {
    color: colors.textMuted,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    textAlign: "center",
    padding: 24
  },
  section: { marginBottom: 16 },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12
  },
  title: {
    flex: 1,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.text,
    margin: 0
  },
  favBtn: {
    padding: 4,
    background: "transparent",
    border: "none",
    borderRadius: 6,
    color: colors.textMuted,
    cursor: "pointer"
  },
  favBtnOn: { color: colors.accent },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily
  },
  label: { color: colors.textMuted },
  value: { color: colors.text },
  desc: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    lineHeight: 1.4,
    marginBottom: 8
  },
  tags: { display: "flex", flexWrap: "wrap", gap: 4 },
  tag: {
    padding: "2px 8px",
    background: colors.bg,
    borderRadius: 6,
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted
  },
  modeLabel: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginBottom: 8
  },
  modeGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  modeOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.text,
    cursor: "pointer"
  },
  actions: { marginTop: 20 },
  useBtn: {
    width: "100%",
    padding: "10px 16px",
    background: colors.accent,
    border: "none",
    borderRadius: 8,
    color: "#1f2125",
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  }
};
