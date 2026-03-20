/**
 * Single template card - grid or list view.
 * Uses pricing resolver: pricingBucket, capabilityTags. No template.cost / template.isFree.
 *
 * Info hierarchy (closed state):
 *   缩略图 → 名字 → sceneHints（来自当前子任务，帮用户对号入座）→ 媒体类型 + 价格
 */

import React from "react";
import { Star } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { PRO_TYPO } from "../../../uiTokens";
import { formatPricingBucketForDisplay } from "../../../pricing";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";

const colors = TEMPLATE_WORKSPACE_UI.colors;

export function isUserPrivateTemplate(item: unknown): item is UserPrivateTemplate {
  return item != null && typeof item === "object" && "originType" in item && (item as UserPrivateTemplate).originType === "user_private";
}

type Props = {
  lang: Lang;
  item: TemplateIndex | UserPrivateTemplate;
  view: "grid" | "list";
  selected: boolean;
  showSelectedState?: boolean;
  onSelect: () => void;
  onUse?: () => void;
  clickToUse?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** From resolveTemplatePricing (market only). null = loading or user_private. */
  pricing?: TemplatePricingResult | null;
  /** Market: isTemplateOwned; user_private: always true. */
  owned?: boolean;
  /**
   * 当前子任务的场景提示，从 intentConfig subTask.sceneHints 传入。
   * 显示在模板卡里帮用户判断"这张模板适合我的场景吗"。
   */
  sceneHintsZh?: string[];
  sceneHintsEn?: string[];
};

export function TemplateCard({
  lang,
  item,
  view,
  selected,
  showSelectedState = true,
  onSelect,
  onUse,
  clickToUse = false,
  isFavorite,
  onToggleFavorite,
  pricing = null,
  owned = false,
  sceneHintsZh,
  sceneHintsEn,
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const mediaLabel = t("媒体", "Media");
  const ratioLabel = t("比例", "Ratio");
  const planLabel = t("计划", "Plan");
  const blurButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.requestAnimationFrame(() => {
      event.currentTarget.blur();
    });
  };
  const preventMouseFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const isPrivate = isUserPrivateTemplate(item);
  const name = isPrivate ? item.name : (lang === "zh" ? item.nameZh : item.nameEn);

  const priceLabel = (() => {
    if (isPrivate) return "";
    if ((item as TemplateIndex).isFree) return t("免费", "Free");
    if (pricing !== undefined && pricing !== null)
      return formatPricingBucketForDisplay(pricing.pricingBucket, lang);
    return "…";
  })();

  const isFreeTemplate = isPrivate ? false : (item as TemplateIndex).isFree;
  const showOwned = isPrivate || owned;
  const mediaType = isPrivate ? "video" : item.mediaType;
  const preview = isPrivate ? undefined : item.preview;
  const ratioValue = isPrivate ? "16:9" : item.ratio;
  const storyPlanValue = isPrivate
    ? t("单镜", "Single")
    : formatStoryPlan(item.storyPlan, t);
  const industryValue = isPrivate
    ? t("自定义", "Custom")
    : formatIndustry(item.industry, t);
  const mediaValue = mediaType === "video" ? t("视频", "Video") : t("图片", "Image");

  // 场景提示：优先用传入的子任务 hints，降级到 descriptionZh
  const sceneHints = lang === "zh"
    ? (sceneHintsZh ?? [])
    : (sceneHintsEn ?? []);
  const fallbackDesc = isPrivate ? "" : (lang === "zh" ? (item.descriptionZh ?? item.descriptionEn) : item.descriptionEn);

  const isList = view === "list";
  const actionLabel = (() => {
    if (showOwned || isFreeTemplate) return t("使用模板", "Use Template");
    return t("购买并使用", "Buy & Use");
  })();

  return (
    <button
      type="button"
      className={clickToUse ? "template-card template-card--direct" : "template-card"}
      style={{
        ...(isList ? styles.cardList : styles.card),
        border: showSelectedState && selected
          ? `2px solid ${colors.accent}`
          : `1px solid ${colors.border}`,
      }}
      onClick={() => {
        if (clickToUse && onUse) { onUse(); return; }
        onSelect();
      }}
      onMouseDown={preventMouseFocus}
      onMouseUp={blurButton}
      onFocus={onSelect}
    >
      <style>{`
        .template-card {
          transition: border-color 120ms ease, background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .template-card:hover {
          border-color: ${colors.buttonBorder} !important;
        }
        .template-card:focus,
        .template-card:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        .template-card--direct:hover {
          border-color: ${colors.accent} !important;
          background: #2a2d32 !important;
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(0,0,0,0.18);
        }
      `}</style>

      {/* ── 缩略图 ── */}
      <div style={isList ? styles.cardThumbList : styles.cardThumb}>
        {preview ? (
          <img src={preview} alt="" style={styles.thumbImg} />
        ) : (
          <div style={styles.thumbPlaceholder}>
            <span style={styles.thumbIcon}>{mediaType === "video" ? "▶" : "⬜"}</span>
            <span style={styles.thumbHint}>{t("预览图", "Preview")}</span>
          </div>
        )}
        {/* 媒体类型角标 */}
        <div style={{ ...styles.mediaBadge, ...(mediaType === "video" ? styles.mediaBadgeVideo : styles.mediaBadgeImage) }}>
          {mediaType === "video" ? t("视频", "Video") : t("图片", "Image")}
        </div>
      </div>

      {/* ── 卡片信息区 ── */}
      <div style={isList ? styles.cardInfoList : styles.cardInfo}>

        {/* 名字行：左边名字，右边收藏 */}
        <div style={styles.cardHeader}>
          <div style={styles.cardName}>{name}</div>
          {onToggleFavorite && !isPrivate && (
            <button
              type="button"
              style={{ ...styles.favBtn, ...(isFavorite ? styles.favBtnOn : {}) }}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              onMouseDown={preventMouseFocus}
              onMouseUp={blurButton}
              title={isFavorite ? t("取消收藏", "Unfavorite") : t("收藏", "Favorite")}
            >
              <Star size={13} fill={isFavorite ? colors.accent : "transparent"} stroke={isFavorite ? colors.accent : colors.textDim} />
            </button>
          )}
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaItem}><span style={styles.metaKey}>{mediaLabel}</span>{mediaValue}</span>
          <span style={styles.metaItem}><span style={styles.metaKey}>{ratioLabel}</span>{ratioValue}</span>
          <span style={styles.metaItem}><span style={styles.metaKey}>{planLabel}</span>{storyPlanValue}</span>
        </div>

        <div style={styles.industryRow}>
          <span style={styles.industryChip}>{industryValue}</span>
        </div>

        {/* 场景提示：这是帮用户判断"适合我吗"的核心区域 */}
        {!isList && sceneHints.length > 0 ? (
          <ul style={styles.hintList}>
            {sceneHints.map((hint, i) => (
              <li key={i} style={styles.hintItem}>
                <span style={styles.hintDot} />
                {hint}
              </li>
            ))}
          </ul>
        ) : !isList && fallbackDesc ? (
          <div style={styles.fallbackDesc}>{fallbackDesc}</div>
        ) : null}
        {isList ? (
          <div style={styles.listSceneHint}>
            {sceneHints[0] ?? fallbackDesc ?? t("点击查看详情并使用模板", "Click for details and use template")}
          </div>
        ) : null}

        {/* 底部：价格 */}
        <div style={isList ? styles.cardBottomList : styles.cardBottom}>
          {showOwned ? (
            <span style={styles.ownedBadge}>{t("已拥有", "Owned")}</span>
          ) : isFreeTemplate ? (
            <span style={styles.freeBadge}>{t("免费", "Free")}</span>
          ) : (
            <span style={styles.priceBadge}>{priceLabel}</span>
          )}

          {/* 使用按钮（非 clickToUse 模式才显示） */}
          {!isList && onUse && !clickToUse && (
            <button
              type="button"
              style={styles.cardUseBtn}
              onClick={(e) => { e.stopPropagation(); onUse(); }}
              onMouseDown={preventMouseFocus}
              onMouseUp={blurButton}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      {isList && onUse && !clickToUse ? (
        <div style={styles.listActionWrap}>
          <button
            type="button"
            style={styles.listUseBtn}
            onClick={(e) => { e.stopPropagation(); onUse(); }}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: 0,
    background: colors.panel,
    borderRadius: 10,
    cursor: "pointer",
    overflow: "hidden",
    textAlign: "left",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  cardList: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    padding: 8,
    background: colors.panel,
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },

  // 缩略图
  cardThumb: {
    position: "relative",
    aspectRatio: "16/9",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  cardThumbList: {
    position: "relative",
    width: 188,
    minWidth: 188,
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 6,
    flexShrink: 0,
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  thumbPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  thumbIcon: { fontSize: 20, color: colors.textDim },
  thumbHint: { fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption, color: colors.textDim },

  // 媒体类型角标
  mediaBadge: {
    position: "absolute",
    bottom: 5,
    left: 6,
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 5px",
    borderRadius: 4,
    letterSpacing: "0.04em",
  },
  mediaBadgeImage: {
    background: "rgba(30,33,38,0.82)",
    color: colors.textMuted,
  },
  mediaBadgeVideo: {
    background: "rgba(245,158,11,0.18)",
    color: colors.accent,
  },

  // 信息区
  cardInfo: { padding: "8px 9px 9px", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 },
  cardInfoList: {
    padding: "8px 6px 8px 0",
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 6
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 5,
  },
  cardName: {
    fontWeight: PRO_TYPO.weightMedium,
    fontSize: PRO_TYPO.xs,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.text,
    flex: 1,
    minWidth: 0,
    lineHeight: 1.35,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    color: colors.textMuted,
    lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.normal,
  },
  metaKey: {
    color: colors.textDim,
    fontWeight: 600,
  },
  industryRow: {
    display: "flex",
    marginBottom: 6,
  },
  industryChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    color: colors.textMuted,
    background: colors.bg,
  },
  favBtn: {
    padding: 2,
    background: "transparent",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    flexShrink: 0,
    marginTop: 1,
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  favBtnOn: { color: colors.accent },

  // 场景提示列表
  hintList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 6px 0",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  hintItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 5,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    color: colors.textMuted,
    lineHeight: 1.4,
  },
  hintDot: {
    width: 3,
    height: 3,
    borderRadius: "50%",
    background: colors.textDim,
    flexShrink: 0,
    marginTop: 5,
  },
  fallbackDesc: {
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    color: colors.textMuted,
    lineHeight: 1.4,
    marginBottom: 6,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },
  listSceneHint: {
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    color: colors.textMuted,
    lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.normal,
    marginBottom: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  // 底部
  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 6,
    gap: 6,
  },
  cardBottomList: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  freeBadge: {
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    fontWeight: 700,
    color: colors.green,
    background: colors.greenSoft,
    padding: "2px 6px",
    borderRadius: 4,
  },
  priceBadge: {
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    fontWeight: 600,
    color: colors.accent,
  },
  ownedBadge: {
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    fontWeight: 600,
    color: colors.textMuted,
  },
  cardUseBtn: {
    padding: "3px 9px",
    background: colors.accent,
    border: "none",
    borderRadius: 6,
    color: "#1a1000",
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    fontWeight: 700,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  listActionWrap: {
    width: 118,
    minWidth: 118,
    display: "flex",
    alignItems: "center",
  },
  listUseBtn: {
    width: "100%",
    border: `1px solid ${colors.accent}`,
    background: colors.accent,
    color: "#1a1000",
    borderRadius: 7,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.caption,
    fontWeight: 600,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    minHeight: 34,
    padding: "0 8px",
    whiteSpace: "nowrap" as const,
  },
};

function formatStoryPlan(
  plan: TemplateIndex["storyPlan"],
  t: (zh: string, en: string) => string
) {
  if (plan === "single") return t("单镜", "Single");
  if (plan === "continuous") return t("连续", "Continuous");
  if (plan === "multi_cam") return t("多机位", "Multi-cam");
  return t("剪辑", "Edited");
}

function formatIndustry(
  industry: TemplateIndex["industry"] | undefined,
  t: (zh: string, en: string) => string
) {
  if (!industry) return t("通用", "General");
  if (industry === "drama") return t("剧集", "Drama");
  if (industry === "anime") return t("动漫", "Anime");
  if (industry === "ad") return t("广告", "Ad");
  if (industry === "ecommerce") return t("电商", "Ecommerce");
  if (industry === "shortfilm") return t("短片", "Short Film");
  if (industry === "documentary") return t("纪录", "Documentary");
  if (industry === "social") return t("社媒", "Social");
  if (industry === "game") return t("游戏", "Game");
  return t("通用", "General");
}
