/**
 * Single template card - grid or list view.
 */

import React from "react";
import { Star } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";

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
  item: TemplateIndex;
  view: "grid" | "list";
  selected: boolean;
  onSelect: () => void;
  onUse?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function TemplateCard({
  lang,
  item,
  view,
  selected,
  onSelect,
  onUse,
  isFavorite,
  onToggleFavorite
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const name = lang === "zh" ? item.nameZh : item.nameEn;
  const desc = lang === "zh" ? (item.descriptionZh ?? item.descriptionEn) : item.descriptionEn;
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
        {item.preview ? (
          <img src={item.preview} alt="" style={styles.thumbImg} />
        ) : (
          <span style={styles.thumbPlaceholder}>
            {item.mediaType === "video" ? "▶" : "📷"}
          </span>
        )}
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardHeader}>
          <div style={styles.cardName}>{name}</div>
          {onToggleFavorite && (
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
        <div style={styles.cardFamily}>{lang === "zh" ? item.familyNameZh : item.familyNameEn}</div>
        {desc ? (
          <div style={styles.cardDesc} title={desc}>
            {desc.length > 48 ? desc.slice(0, 48) + "…" : desc}
          </div>
        ) : null}
        {item.tags?.length ? (
          <div style={styles.cardTags}>
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={styles.cardTag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div style={styles.cardCost}>
          {item.isFree ? t("免费", "Free") : `${item.cost} ${t("积分", "credits")}`}
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
  cardName: { fontWeight: 600, fontSize: 12, color: colors.text, flex: 1, minWidth: 0 },
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
  cardFamily: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  cardDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  cardTags: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  cardTag: {
    fontSize: 9,
    padding: "1px 4px",
    background: colors.bg,
    borderRadius: 4,
    color: colors.textMuted
  },
  cardCost: { fontSize: 11, color: colors.accent, marginTop: 6, fontWeight: 600 },
  cardUseBtn: {
    marginTop: 8,
    padding: "4px 10px",
    background: colors.accent,
    border: "none",
    borderRadius: 6,
    color: "#1f2125",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer"
  }
};
