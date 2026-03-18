/**
 * Template detail panel - TemplateIndex or UserPrivateTemplate.
 * Blocks: Access/Ownership, Reuse copy, Capability tags, Related (market only).
 */

import React from "react";
import { Star } from "lucide-react";
import { PRO_TYPO } from "../../../uiTokens";
import { editorTheme } from "../../../theme/editorTheme";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { isUserPrivateTemplate } from "./TemplateCard";
import type { ApplyTemplateMode } from "../model/templateFilter";
import { formatPricingBucketForDisplay } from "../../../pricing";
import { useTemplatePricing } from "../hooks/useTemplatePricing";
import { loadTemplatePayloadById } from "../../../template-engine/payload/templateLoader";
import { getProFieldLabelsFromPayload } from "../../../utils/proFieldsResolver";
import type { ProFieldLabel } from "../../../utils/proFieldsResolver";

const { colors } = editorTheme;

type Props = {
  lang: Lang;
  template: TemplateIndex | UserPrivateTemplate | null;
  applyMode: ApplyTemplateMode;
  onApplyModeChange: (m: ApplyTemplateMode) => void;
  onUse: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (templateId: string) => void;
  project?: import("../../../model").Project | null;
  userCredits?: number;
  isTemplateOwned?: (templateId: string) => boolean;
  /** Same-family templates for Related block (market only). */
  relatedTemplates?: TemplateIndex[];
};

export function TemplateWorkspaceDetail({
  lang,
  template,
  applyMode: _applyMode,
  onApplyModeChange: _onApplyModeChange,
  onUse,
  isFavorite = false,
  onToggleFavorite,
  project = null,
  userCredits = 0,
  isTemplateOwned,
  relatedTemplates = []
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [proLabels, setProLabels] = React.useState<ProFieldLabel[]>([]);

  React.useEffect(() => {
    if (!template || isUserPrivateTemplate(template)) { setProLabels([]); return; }
    let cancelled = false;
    loadTemplatePayloadById(template.id).then(payload => {
      if (cancelled || !payload) { setProLabels([]); return; }
      setProLabels(getProFieldLabelsFromPayload(payload, lang));
    });
    return () => { cancelled = true; };
  }, [(template as any)?.id, lang]);

  const isPrivate = template ? isUserPrivateTemplate(template) : false;
  const { pricing, loading } = useTemplatePricing(
    template && !isPrivate ? (template as TemplateIndex).id : null
  );
  if (!template) {
    return (
      <div className="pro-rail-scroll" style={styles.wrap}>
        <div style={styles.empty}>{t("选择模板查看详情", "Select a template to view details")}</div>
      </div>
    );
  }
  const name = isPrivate ? (template as UserPrivateTemplate).name : (lang === "zh" ? (template as TemplateIndex).nameZh : (template as TemplateIndex).nameEn);
  const desc = isPrivate ? "" : (lang === "zh" ? ((template as TemplateIndex).descriptionZh ?? (template as TemplateIndex).descriptionEn) : (template as TemplateIndex).descriptionEn);
  const owned = isPrivate || (isTemplateOwned?.(template.id) ?? false);
  const priceLabel = (() => {
    if (loading) return "…";
    if (!isPrivate && (template as TemplateIndex).isFree) return lang === "zh" ? "免费" : "Free";
    if (pricing) return formatPricingBucketForDisplay(pricing.pricingBucket, lang);
    return "—";
  })();
  const capabilityTags = pricing?.capabilityTags?.slice(0, 4) ?? [];
  const insufficient = !isPrivate && !owned && !(template as TemplateIndex).isFree && (pricing?.creditPrice ?? 0) > 0 && userCredits < (pricing?.creditPrice ?? 0);

  if (isPrivate) {
    return (
      <div className="pro-rail-scroll" style={styles.wrap}>
        <div style={styles.section}>
          <h3 style={styles.title}>{name}</h3>
          <div style={styles.row}>
            <span style={styles.label}>{t("来源", "Source")}</span>
            <span style={styles.value}>{t("我创建的", "Created by me")}</span>
          </div>
          <div style={styles.reuseBlock}>
            <div style={styles.reuseTitle}>{t("已拥有", "Owned")}</div>
            <div style={styles.reuseText}>{t("可免费重复使用，每次使用将创建新项目。", "Reuse freely. Using creates a new editable project.")}</div>
          </div>
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.useBtn} onClick={onUse}>
            {t("使用模板", "Use Template")}
          </button>
        </div>
      </div>
    );
  }

  const marketTemplate = template as TemplateIndex;
  return (
    <div className="pro-rail-scroll" style={styles.wrap}>
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
          <span style={styles.value}>{lang === "zh" ? marketTemplate.familyNameZh : marketTemplate.familyNameEn}</span>
        </div>
        {desc && <div style={styles.desc}>{desc}</div>}
      </div>

      <div style={styles.section}>
        <div style={styles.blockTitle}>{t("价格 / 权限", "Access")}</div>
        <div style={styles.row}>
          <span style={styles.label}>{t("定价", "Pricing")}</span>
          <span style={styles.value}>{owned ? t("已拥有", "Owned") : priceLabel}</span>
        </div>
        {owned && (
          <div style={styles.ownedHint}>
            {t("已在「我的模板」中，可免费重复使用。", "Already in My Templates. Reuse freely.")}
          </div>
        )}
        {insufficient ? (
          <div style={styles.insufficientHint}>
            {t("需要", "Need")} {pricing?.creditPrice ?? 0} {t("积分，当前余额不足", "credits, balance insufficient")}
          </div>
        ) : null}
      </div>

      <div style={styles.section}>
        <div style={styles.reuseBlock}>
          <div style={styles.reuseTitle}>{t("使用说明", "Reuse")}</div>
          <div style={styles.reuseText}>
            {t("解锁一次，可重复使用。使用模板将创建新的可编辑项目。", "Unlock once. Reuse freely. Using a template creates a new editable project.")}
          </div>
        </div>
      </div>

      {capabilityTags.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("能力标签", "Capability tags")}</div>
          <div style={styles.tags}>
            {capabilityTags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {proLabels.length > 0 ? (
        <div style={{
          margin: "0 0 12px",
          borderRadius: 10,
          border: "1px solid rgba(245,158,11,0.35)",
          background: "rgba(245,158,11,0.07)",
          padding: "12px 14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: colors.accent,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const
            }}>
              ✦ {t("Pro 专属字段", "Pro Exclusive")}
            </span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>
              {t("使用后可在菜单中替换", "Replaceable after applying")}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
            {proLabels.map(label => (
              <span key={label.key} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 11, fontWeight: 600,
                color: colors.accent,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 99,
                padding: "2px 9px"
              }}>
                ✦ {lang === "zh" ? label.labelZh : label.labelEn}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>{t("媒体类型", "Media")}</span>
          <span style={styles.value}>
            {marketTemplate.mediaType === "image" ? t("图片", "Image") : t("视频", "Video")}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>{t("场景类型", "Scene")}</span>
          <span style={styles.value}>{marketTemplate.storyPlan}</span>
        </div>
      </div>

      {relatedTemplates.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("同系列 / 相似", "Related")}</div>
          <div style={styles.relatedList}>
            {relatedTemplates.slice(0, 4).map((t) => (
              <div key={t.id} style={styles.relatedItem}>
                {lang === "zh" ? t.nameZh : t.nameEn}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.useBtn}
          onClick={onUse}
        >
          {owned || (template as TemplateIndex).isFree ? t("使用模板", "Use Template") : pricing?.creditPrice ? t("购买并使用", "Buy & Use Template") : t("使用模板", "Use Template")}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: editorTheme.sizing.railWidth,
    flexShrink: 0,
    padding: editorTheme.spacing.panelPadding,
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
  blockTitle: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginBottom: 6
  },
  ownedHint: {
    marginTop: 4,
    fontSize: PRO_TYPO["2xs"],
    color: colors.textMuted
  },
  reuseBlock: { marginTop: 4 },
  reuseTitle: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginBottom: 2
  },
  reuseText: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    lineHeight: 1.4
  },
  relatedList: { display: "flex", flexDirection: "column", gap: 4 },
  relatedItem: {
    fontSize: PRO_TYPO["2xs"],
    color: colors.text,
    fontFamily: PRO_TYPO.fontFamily
  },
  insufficientHint: {
    marginTop: 6,
    fontSize: PRO_TYPO["2xs"],
    color: "#f59e0b"
  },
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
    color: colors.bg,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  },
};
