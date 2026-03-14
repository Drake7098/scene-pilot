import React from "react";
import { LayoutGrid, List, Star } from "lucide-react";
import type { Lang } from "../../i18n";
import type { TemplateWorkspaceItem } from "../../data/templateWorkspaceData";

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
  items: TemplateWorkspaceItem[];
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateWorkspaceItem) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
};

export function TemplateWorkspaceGrid({
  lang,
  items,
  view,
  onViewChange,
  selectedId,
  onSelect,
  onUse,
  isFavorite,
  onToggleFavorite
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <div style={styles.viewToggle}>
          <button
            type="button"
            style={{ ...styles.viewBtn, ...(view === "grid" ? styles.viewBtnOn : {}) }}
            onClick={() => onViewChange("grid")}
            title={t("网格", "Grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            style={{ ...styles.viewBtn, ...(view === "list" ? styles.viewBtnOn : {}) }}
            onClick={() => onViewChange("list")}
            title={t("列表", "List")}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <div style={view === "grid" ? styles.grid : styles.list}>
        {items.length === 0 ? (
          <div style={styles.empty}>{t("暂无模板", "No templates")}</div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              style={{
                ...(view === "grid" ? styles.card : styles.cardList),
                ...(selectedId === item.id ? styles.cardSelected : {})
              }}
              onClick={() => onSelect(selectedId === item.id ? null : item.id)}
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
                  <div style={styles.cardName}>{lang === "zh" ? (item.nameZh ?? item.name) : item.name}</div>
                  {onToggleFavorite && isFavorite ? (
                    <button
                      type="button"
                      style={{ ...styles.favBtn, ...(isFavorite(item.id) ? styles.favBtnOn : {}) }}
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                      title={isFavorite(item.id) ? (lang === "zh" ? "取消收藏" : "Unfavorite") : (lang === "zh" ? "收藏" : "Favorite")}
                    >
                      <Star size={14} fill={isFavorite(item.id) ? colors.accent : "transparent"} stroke={isFavorite(item.id) ? colors.accent : colors.textMuted} />
                    </button>
                  ) : null}
                </div>
                <div style={styles.cardFamily}>{lang === "zh" ? (item.familyZh ?? item.family) : item.family}</div>
                {(item.description || item.descriptionZh) ? (
                  <div style={styles.cardDesc} title={lang === "zh" ? (item.descriptionZh ?? item.description) : item.description}>
                    {(() => {
                      const d = lang === "zh" ? (item.descriptionZh ?? item.description) : item.description;
                      return d && d.length > 48 ? d.slice(0, 48) + "…" : d;
                    })()}
                  </div>
                ) : null}
                {item.tags?.length ? (
                  <div style={styles.cardTags}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={styles.cardTag}>{tag}</span>
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
                    onClick={(e) => { e.stopPropagation(); onUse(item); }}
                  >
                    {t("使用", "Use")}
                  </button>
                ) : null}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  toolbar: {
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "flex-end"
  },
  viewToggle: { display: "flex", gap: 4 },
  viewBtn: {
    padding: 6,
    background: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textMuted,
    cursor: "pointer"
  },
  viewBtnOn: {
    background: colors.hover,
    color: colors.accent
  },
  grid: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
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
  cardSelected: {
    borderColor: colors.accent
  },
  cardThumb: {
    aspectRatio: "16/9",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: { fontSize: 24, color: colors.textMuted },
  cardInfo: { padding: 8, flex: 1, minWidth: 0 },
  cardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 },
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
  cardDesc: { fontSize: 10, color: colors.textMuted, marginTop: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardTags: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  cardTag: { fontSize: 9, padding: "1px 4px", background: colors.bg, borderRadius: 4, color: colors.textMuted },
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
  },
  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    fontSize: 13
  }
};
