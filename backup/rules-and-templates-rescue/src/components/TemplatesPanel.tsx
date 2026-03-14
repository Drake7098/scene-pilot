import React, { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { SceneTemplate } from "../model/template";
import type { TemplateCategory } from "../model/template";
import {
  getAllTemplates,
  listUserTemplates,
  deleteUserTemplate,
  duplicateTemplate,
  saveUserTemplate
} from "../lib/templateStore";
import { UI_PALETTE, UI_TYPO, UI_RADIUS, UI_SPACE } from "../uiTokens";
import { Lock, Trash2, Copy } from "lucide-react";


type Props = {
  lang: Lang;
  isPro: boolean;
  sceneLimitReached: boolean;
  onUseTemplate: (template: SceneTemplate) => void;
  onLockedClick: (template: SceneTemplate) => void;
  onRequestSaveTemplate: () => void;
  onTrack?: (event: string, props?: Record<string, unknown>) => void;
};

export function TemplatesPanel({
  lang,
  isPro,
  sceneLimitReached,
  onUseTemplate,
  onLockedClick,
  onRequestSaveTemplate,
  onTrack
}: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | "">("");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const builtin = useMemo(() => getAllTemplates().filter((x) => x.isBuiltin), []);
  const userTemplates = listUserTemplates();

  const canUse = (t: SceneTemplate) => !t.isProOnly || isPro;
  const isLocked = (t: SceneTemplate) => t.isProOnly && !isPro;

  const filteredBuiltin = useMemo(() => {
    let list = builtin;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          (x.description ?? "").toLowerCase().includes(q) ||
          (x.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (filterCategory) {
      list = list.filter((x) => x.category === filterCategory);
    }
    return list;
  }, [builtin, search, filterCategory]);

  const tt = (key: string) => t(lang, key);
  const catLabel = (c: TemplateCategory) => tt(`cat.${c}`);
  const tplName = (tpl: SceneTemplate) => {
    if (tpl.isBuiltin) {
      const k = `tpl.${tpl.id.replace("builtin_", "")}.name`;
      const v = t(lang, k);
      return v !== k ? v : tpl.name;
    }
    return tpl.name;
  };
  const tplDesc = (tpl: SceneTemplate) => {
    if (tpl.isBuiltin && tpl.description) {
      const k = `tpl.${tpl.id.replace("builtin_", "")}.desc`;
      const v = t(lang, k);
      return v !== k ? v : tpl.description;
    }
    return tpl.description;
  };

  const handleUse = (tpl: SceneTemplate) => {
    onTrack?.("template_use", { templateId: tpl.id, templateName: tpl.name });
    if (canUse(tpl)) {
      onUseTemplate(tpl);
    } else {
      onTrack?.("template_locked_click", { templateId: tpl.id });
      onLockedClick(tpl);
    }
  };

  const handleDelete = (tpl: SceneTemplate) => {
    if (tpl.isBuiltin) return;
    onTrack?.("template_delete", { templateId: tpl.id });
    deleteUserTemplate(tpl.id);
    setActiveTab("all");
  };

  const handleDuplicate = (tpl: SceneTemplate) => {
    if (tpl.isBuiltin) return;
    const dup = duplicateTemplate(tpl);
    saveUserTemplate(dup);
    onTrack?.("template_duplicate", { templateId: tpl.id });
    setActiveTab("mine");
  };

  const emptyFreeHint = tt("template.emptyFreeHint");
  const emptyProHint = tt("template.emptyProHint");

  const styles = useMemo(
    () => ({
      wrap: { display: "flex", flexDirection: "column" as const, gap: 10, minHeight: 0 },
      search: {
        width: "100%",
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(12,18,28,0.6)",
        color: UI_PALETTE.text.primary,
        fontSize: 12,
        outline: "none"
      },
      tabs: { display: "flex", gap: 4, marginBottom: 4 },
      tab: {
        padding: "4px 10px",
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: 760,
        cursor: "pointer"
      },
      tabOn: { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.96)" },
      categoryRow: { display: "flex", flexWrap: "wrap" as const, gap: 4, marginBottom: 8 },
      catBtn: {
        padding: "3px 8px",
        borderRadius: 6,
        border: "none",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.8)",
        fontSize: 11,
        cursor: "pointer"
      },
      catBtnOn: { background: "rgba(255,255,255,0.18)", color: "#fff" },
      card: {
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(18,26,38,0.6)",
        marginBottom: 8
      },
      cardHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
      cardName: { fontWeight: 820, fontSize: 13, color: "rgba(255,255,255,0.95)" },
      cardMeta: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6 },
      cardDesc: { fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 1.4, marginBottom: 8 },
      cardActions: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const },
      btn: {
        padding: "4px 10px",
        borderRadius: 6,
        border: "none",
        background: "rgba(68,103,150,0.5)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 760,
        cursor: "pointer"
      },
      btnLocked: { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", opacity: 0.9 },
      btnGhost: {
        padding: "4px 8px",
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        cursor: "pointer"
      },
      empty: {
        padding: 20,
        textAlign: "center" as const,
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.5
      }
    }),
    []
  );

  const list = activeTab === "mine" ? userTemplates : filteredBuiltin;
  const isEmpty = list.length === 0;

  return (
    <div style={styles.wrap}>
      <input
        type="text"
        placeholder={tt("template.searchPlaceholder")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onTrack?.("template_search", { query: e.target.value });
        }}
        style={styles.search}
      />

      {isPro && (
        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(activeTab === "all" ? styles.tabOn : {}) }}
            onClick={() => setActiveTab("all")}
          >
            {tt("template.all")}
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(activeTab === "mine" ? styles.tabOn : {}) }}
            onClick={() => setActiveTab("mine")}
          >
            {tt("template.myTemplates")}
          </button>
        </div>
      )}

      {activeTab === "all" && (
        <div style={styles.categoryRow}>
          <button
            type="button"
            style={{ ...styles.catBtn, ...(!filterCategory ? styles.catBtnOn : {}) }}
            onClick={() => {
              setFilterCategory("");
              onTrack?.("template_filter_change", { category: "" });
            }}
          >
            {tt("template.all")}
          </button>
          {(Array.from(new Set(builtin.map((x) => x.category))) as TemplateCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              style={{ ...styles.catBtn, ...(filterCategory === c ? styles.catBtnOn : {}) }}
              onClick={() => {
                setFilterCategory(c);
                onTrack?.("template_filter_change", { category: c });
              }}
            >
              {catLabel(c)}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {activeTab === "mine" && userTemplates.length === 0 ? (
          <div style={styles.empty}>
            {emptyProHint}
            <br />
            <button type="button" style={{ ...styles.btn, marginTop: 12 }} onClick={onRequestSaveTemplate}>
              {tt("template.saveCurrent")}
            </button>
          </div>
        ) : isEmpty ? (
          <div style={styles.empty}>
            {activeTab === "all" ? emptyFreeHint : emptyProHint}
          </div>
        ) : (
          list.map((tpl) => (
            <div key={tpl.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardName}>{tplName(tpl)}</span>
                {tpl.isProOnly && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(148,183,232,0.9)" }}>
                    <Lock size={10} /> Pro
                  </span>
                )}
              </div>
              <div style={styles.cardMeta}>{catLabel(tpl.category)}</div>
              {tplDesc(tpl) && <div style={styles.cardDesc}>{tplDesc(tpl)}</div>}
              <div style={styles.cardActions}>
                <button
                  type="button"
                  style={{
                    ...styles.btn,
                    ...(isLocked(tpl) ? styles.btnLocked : {}),
                    opacity: sceneLimitReached && canUse(tpl) ? 0.5 : 1
                  }}
                  disabled={sceneLimitReached && canUse(tpl)}
                  onClick={() => handleUse(tpl)}
                  title={isLocked(tpl) ? tt("template.upgradeToUse") : tt("template.use")}
                >
                  {isLocked(tpl) ? tt("template.locked") : tt("template.use")}
                </button>
                {!tpl.isBuiltin && isPro && (
                  <>
                    <button
                      type="button"
                      style={styles.btnGhost}
                      onClick={() => handleDuplicate(tpl)}
                      title={tt("template.duplicate")}
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      style={styles.btnGhost}
                      onClick={() => handleDelete(tpl)}
                      title={tt("template.delete")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isPro && activeTab === "all" && (
        <button type="button" style={styles.btnGhost} onClick={onRequestSaveTemplate}>
          {tt("template.saveCurrent")}
        </button>
      )}
    </div>
  );
}
