import React from "react";
import { Star } from "lucide-react";
import type { Lang } from "../../i18n";
import type { TemplateWorkspaceItem } from "../../data/templateWorkspaceData";
import type { ApplyTemplateMode } from "../../data/templateWorkspaceData";
import { getAdvancedTagLabel, type AdvancedTemplateTagId } from "../../content/cameraLanguageLayers";

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
  template: TemplateWorkspaceItem | null;
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
  return (
    <div style={styles.wrap}>
      <div style={styles.section}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>{lang === "zh" ? (template.nameZh ?? template.name) : template.name}</h3>
          {onToggleFavorite ? (
            <button
              type="button"
              style={{ ...styles.favBtn, ...(isFavorite ? styles.favBtnOn : {}) }}
              onClick={() => onToggleFavorite(template.id)}
              title={isFavorite ? (lang === "zh" ? "取消收藏" : "Unfavorite") : (lang === "zh" ? "收藏" : "Favorite")}
            >
              <Star size={16} fill={isFavorite ? colors.accent : "transparent"} stroke={isFavorite ? colors.accent : colors.textMuted} />
            </button>
          ) : null}
        </div>
        {template.family && (
          <div style={styles.row}>
            <span style={styles.label}>{t("家族", "Family")}</span>
            <span style={styles.value}>{lang === "zh" ? (template.familyZh ?? template.family) : template.family}</span>
          </div>
        )}
        {(template.description || template.descriptionZh) && (
          <div style={styles.desc}>{lang === "zh" ? (template.descriptionZh ?? template.description) : template.description}</div>
        )}
        {(template.advancedTags?.length ?? 0) > 0 && (
          <div style={styles.advancedTags}>
            {template.advancedTags!.map((tagId) => (
              <span key={tagId} style={styles.advancedTag} title={getAdvancedTagLabel(tagId as AdvancedTemplateTagId, lang)}>
                {getAdvancedTagLabel(tagId as AdvancedTemplateTagId, lang)}
              </span>
            ))}
          </div>
        )}
        {template.tags && template.tags.length > 0 && (
          <div style={styles.tags}>
            {template.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>{t("定价", "Pricing")}</span>
          <span style={styles.value}>
            {template.isFree
              ? t("免费", "Free")
              : `${template.cost} ${t("积分", "credits")}`}
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
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: 600,
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
  favBtnOn: {
    color: colors.accent
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 12
  },
  label: { color: colors.textMuted },
  value: { color: colors.text },
  desc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 1.4,
    marginBottom: 8
  },
  advancedTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8
  },
  advancedTag: {
    padding: "3px 8px",
    background: "rgba(245, 158, 11, 0.15)",
    borderRadius: 6,
    fontSize: 11,
    color: colors.accent,
    fontWeight: 500
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  tag: {
    padding: "2px 8px",
    background: colors.bg,
    borderRadius: 6,
    fontSize: 11,
    color: colors.textMuted
  },
  modeLabel: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  }
};
