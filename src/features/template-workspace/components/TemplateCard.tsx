/**
 * Single template card - grid or list view.
 * Uses pricing resolver: pricingBucket, capabilityTags. No template.cost / template.isFree.
 */

import React from "react";
import { Star } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { PRO_TYPO } from "../../../uiTokens";
import { formatPricingBucketForDisplay } from "../../../pricing";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";

const colors = {
  panel: "#24262b",
  border: "#3a3f46",
  bg: "#1f2125",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

/** Type guard: user-private template (My Templates > 我创建的). Accepts unknown so callers can pass TemplateWorkspaceItem. */
export function isUserPrivateTemplate(item: unknown): item is UserPrivateTemplate {
  return item != null && typeof item === "object" && "originType" in item && (item as UserPrivateTemplate).originType === "user_private";
}

type Props = {
  lang: Lang;
  item: TemplateIndex | UserPrivateTemplate;
  view: "grid" | "list";
  selected: boolean;
  onSelect: () => void;
  onUse?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** From resolveTemplatePricing (market only). null = loading or user_private. */
  pricing?: TemplatePricingResult | null;
  /** Market: isTemplateOwned; user_private: always true. */
  owned?: boolean;
};

export function TemplateCard({
  lang,
  item,
  view,
  selected,
  onSelect,
  onUse,
  isFavorite,
  onToggleFavorite,
  pricing = null,
  owned = false
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const isPrivate = isUserPrivateTemplate(item);
  const name = isPrivate ? item.name : (lang === "zh" ? item.nameZh : item.nameEn);
  const desc = isPrivate ? "" : (lang === "zh" ? (item.descriptionZh ?? item.descriptionEn) : item.descriptionEn);
  const priceLabel =
    pricing !== undefined && pricing !== null
      ? formatPricingBucketForDisplay(pricing.pricingBucket, lang)
      : "…";
  const tags = pricing?.capabilityTags?.slice(0, 4) ?? [];
  const familyLabel = isPrivate ? t("我创建的", "Created by me") : (lang === "zh" ? item.familyNameZh : item.familyNameEn);
  const showOwned = isPrivate || owned;
  const mediaType = isPrivate ? "video" : item.mediaType;
  const preview = isPrivate ? undefined : item.preview;
  return (
    <button
      type="button"
      style={{
        ...(view === "grid" ? styles.card : styles.cardList),
        ...(selected ? styles.cardSelected : {})
      }}
      onClick={onSelect}
    >
      <div style={view === "list" ? { ...styles.cardThumb, width: 80, minWidth: 80 } : styles.cardThumb}>
        {preview ? (
          <img src={preview} alt="" style={styles.thumbImg} />
        ) : (
          <span style={styles.thumbPlaceholder}>
            {mediaType === "video" ? "▶" : "📷"}
          </span>
        )}
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardHeader}>
          <div style={styles.cardName}>{name}</div>
          {onToggleFavorite && !isPrivate && (
            <button
              type="button"
              style={{ ...styles.favBtn, ...(isFavorite ? styles.favBtnOn : {}) }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              title={isFavorite ? t("取消收藏", "Unfavorite") : t("收藏", "Favorite")}
            >
              <Star
                size={14}
                fill={isFavorite ? colors.accent : "transparent"}
                stroke={isFavorite ? colors.accent : colors.textMuted}
              />
            </button>
          )}
        </div>
        <div style={styles.cardFamily}>{familyLabel}</div>
        {desc ? (
          <div style={styles.cardDesc} title={desc}>
            {desc.length > 48 ? desc.slice(0, 48) + "…" : desc}
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div style={styles.cardTags}>
            {tags.map((tag) => (
              <span key={tag} style={styles.cardTag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div style={styles.cardCost}>
          {showOwned ? (
            <span style={styles.ownedBadge}>{t("已拥有", "Owned")}</span>
          ) : (
            priceLabel
          )}
        </div>
        {onUse ? (
          <button
            type="button"
            style={styles.cardUseBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUse();
            }}
          >
            {t("使用", "Use")}
          </button>
        ) : null}
      </div>
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
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    cursor: "pointer",
    overflow: "hidden"
  },
  cardList: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: "pointer"
  },
  cardSelected: { borderColor: colors.accent },
  cardThumb: {
    aspectRatio: "16/9",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  thumbPlaceholder: { fontSize: 24, color: colors.textMuted },
  cardInfo: { padding: 8, flex: 1, minWidth: 0 },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4
  },
  cardName: { fontWeight: PRO_TYPO.weightMedium, fontSize: PRO_TYPO.xs, fontFamily: PRO_TYPO.fontFamily, color: colors.text, flex: 1, minWidth: 0 },
  favBtn: {
    padding: 2,
    background: "transparent",
    border: "none",
    borderRadius: 4,
    color: colors.textMuted,
    cursor: "pointer",
    flexShrink: 0
  },
  favBtnOn: { color: colors.accent },
  cardFamily: { fontSize: PRO_TYPO["3xs"], fontWeight: PRO_TYPO.weightRegular, fontFamily: PRO_TYPO.fontFamily, color: colors.textMuted, marginTop: 2 },
  cardDesc: {
    fontSize: PRO_TYPO["3xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  cardTags: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  cardTag: {
    fontSize: PRO_TYPO["3xs"],
    padding: "1px 4px",
    background: colors.bg,
    borderRadius: 4,
    color: colors.textMuted
  },
  cardCost: { fontSize: PRO_TYPO["2xs"], fontWeight: PRO_TYPO.weightMedium, fontFamily: PRO_TYPO.fontFamily, color: colors.accent, marginTop: 6 },
  ownedBadge: { color: colors.textMuted, fontWeight: PRO_TYPO.weightRegular },
  cardUseBtn: {
    marginTop: 8,
    padding: "4px 10px",
    background: colors.accent,
    border: "none",
    borderRadius: 6,
    color: "#1f2125",
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  }
};
