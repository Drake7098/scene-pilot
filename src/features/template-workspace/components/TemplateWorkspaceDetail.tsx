/**
 * Template detail panel - compact decision summary plus reusable fields.
 */

import React from "react";
import { KeyRound, Star } from "lucide-react";
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
  project: _project = null,
  userCredits = 0,
  isTemplateOwned,
  relatedTemplates = []
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const blurButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.requestAnimationFrame(() => {
      event.currentTarget.blur();
    });
  };
  const preventMouseFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const [proLabels, setProLabels] = React.useState<ProFieldLabel[]>([]);

  React.useEffect(() => {
    if (!template || isUserPrivateTemplate(template)) {
      setProLabels([]);
      return;
    }
    let cancelled = false;
    loadTemplatePayloadById(template.id).then((payload) => {
      if (cancelled || !payload) {
        setProLabels([]);
        return;
      }
      setProLabels(getProFieldLabelsFromPayload(payload, lang));
    });
    return () => {
      cancelled = true;
    };
  }, [(template as { id?: string } | null)?.id, lang]);

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

  const name = isPrivate
    ? (template as UserPrivateTemplate).name
    : (lang === "zh" ? (template as TemplateIndex).nameZh : (template as TemplateIndex).nameEn);
  const desc = isPrivate
    ? ""
    : (lang === "zh"
        ? ((template as TemplateIndex).descriptionZh ?? (template as TemplateIndex).descriptionEn)
        : (template as TemplateIndex).descriptionEn);
  const owned = isPrivate || (isTemplateOwned?.(template.id) ?? false);
  const priceLabel = (() => {
    if (isPrivate) return t("已拥有", "Owned");
    if (loading) return "…";
    if ((template as TemplateIndex).isFree) return t("免费", "Free");
    if (pricing) return formatPricingBucketForDisplay(pricing.pricingBucket, lang);
    return "—";
  })();
  const capabilityTags = pricing?.capabilityTags?.slice(0, 4) ?? [];

  if (isPrivate) {
    return (
      <div className="pro-rail-scroll" style={styles.wrap}>
        <div style={styles.section}>
          <div style={styles.titleRow}>
            <h3 style={styles.title}>{name}</h3>
          </div>
          <div style={styles.metaChips}>
            <span style={styles.metaChip}>{t("我创建的", "Created by me")}</span>
            <span style={styles.metaChip}>{t("直接复用", "Reusable")}</span>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLine}>
              <span style={styles.summaryLabel}>{t("套用结果", "Result")}</span>
              <span style={styles.summaryValue}>{t("创建新项目", "Creates new project")}</span>
            </div>
            <div style={styles.summaryHint}>
              {t("保留原模板不变，套用后直接进入可编辑工作台。", "Keeps the original template intact and opens the editable workspace directly.")}
            </div>
          </div>
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.useBtn} onClick={onUse} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {t("使用模板", "Use Template")}
          </button>
        </div>
      </div>
    );
  }

  const marketTemplate = template as TemplateIndex;
  const mediaLabel = marketTemplate.mediaType === "image" ? t("图片", "Image") : t("视频", "Video");
  const insufficient =
    !owned &&
    !marketTemplate.isFree &&
    (pricing?.creditPrice ?? 0) > 0 &&
    userCredits < (pricing?.creditPrice ?? 0);

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
              onMouseDown={preventMouseFocus}
              onMouseUp={blurButton}
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
      </div>

      {proLabels.length > 0 ? (
        <div style={styles.proCard}>
          <div style={styles.proCardHeader}>
            <span style={styles.proCardTitle}>
              <KeyRound size={13} style={styles.proCardKeyIcon} />
              {t("Pro 专享隐藏控制", "Pro Hidden Controls")}
            </span>
          </div>
          <div style={styles.proCardHint}>
            {t(
              "这组是 Pro 专享隐藏控制词，默认折叠显示，可在工作台继续微调。",
              "These are Pro hidden control phrases. They stay collapsed by default and can be fine-tuned in the workspace."
            )}
          </div>
          <div style={styles.proTagWrap}>
            {proLabels.map((label) => (
              <span key={label.key} style={styles.proTag}>
                {lang === "zh" ? label.labelZh : label.labelEn}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.section}>
        {desc ? <div style={styles.desc}>{desc}</div> : null}
        <div style={styles.metaChips}>
          <span style={styles.metaChip}>{lang === "zh" ? marketTemplate.familyNameZh : marketTemplate.familyNameEn}</span>
          <span style={styles.metaChip}>{mediaLabel}</span>
        </div>
      </div>

      <div style={styles.actions}>
        <div style={styles.priceRow}>
          {insufficient ? (
            <span style={styles.insufficientHint}>
              {t("需要", "Need")} {pricing?.creditPrice ?? 0} {t("积分", "credits")}
            </span>
          ) : (
            <span style={styles.priceLabel}>
              {owned || marketTemplate.isFree ? t("免费使用", "Free") : priceLabel}
            </span>
          )}
        </div>
        <button type="button" style={styles.useBtn} onClick={onUse} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
          {owned || marketTemplate.isFree
            ? t("使用模板", "Use Template")
            : pricing?.creditPrice
              ? t("购买并使用", "Buy & Use")
              : t("使用模板", "Use Template")}
        </button>
      </div>

      {capabilityTags.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("适用场景", "Best for")}</div>
          <div style={styles.tags}>
            {capabilityTags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {relatedTemplates.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("同系列模板", "Related templates")}</div>
          <div style={styles.relatedList}>
            {relatedTemplates.slice(0, 4).map((item) => (
              <div key={item.id} style={styles.relatedItem}>
                {lang === "zh" ? item.nameZh : item.nameEn}
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
  section: {
    marginBottom: 16
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10
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
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent"
  },
  favBtnOn: {
    color: colors.accent
  },
  metaChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "0 10px",
    borderRadius: 999,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.textMuted,
    fontSize: PRO_TYPO["3xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily
  },
  desc: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    lineHeight: 1.45,
    marginBottom: 8
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 14px",
    borderRadius: 10,
    background: colors.bg,
    border: `1px solid ${colors.border}`
  },
  summaryLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily
  },
  summaryValue: {
    color: colors.text,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    textAlign: "right"
  },
  summaryHint: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    lineHeight: 1.45
  },
  blockTitle: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginBottom: 6
  },
  insufficientHint: {
    fontSize: PRO_TYPO["2xs"],
    color: colors.accent
  },
  proCard: {
    margin: "0 0 12px",
    borderRadius: 10,
    border: "1px solid rgba(245,158,11,0.35)",
    background: "rgba(245,158,11,0.07)",
    padding: "12px 14px"
  },
  proCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8
  },
  proCardTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: colors.accent
  },
  proCardKeyIcon: {
    color: colors.accent,
    flexShrink: 0
  },
  proCardHint: {
    fontSize: PRO_TYPO["2xs"],
    lineHeight: 1.45,
    color: colors.textMuted,
    marginBottom: 8
  },
  proTagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5
  },
  proTag: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 99,
    padding: "2px 9px"
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
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted
  },
  relatedList: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  relatedItem: {
    fontSize: PRO_TYPO["2xs"],
    color: colors.text,
    fontFamily: PRO_TYPO.fontFamily
  },
  actions: {
    marginTop: 8,
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8
  },
  priceLabel: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.accent
  },
  useBtn: {
    width: "100%",
    minHeight: 42,
    padding: "0 14px",
    background: colors.accent,
    border: "none",
    borderRadius: 7,
    color: colors.bg,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent"
  }
};
