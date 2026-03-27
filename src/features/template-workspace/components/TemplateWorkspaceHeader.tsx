import React from "react";
import {
  Search,
  X,
  LayoutGrid,
  List,
  User,
  Layers,
  MessagesSquare,
  Crosshair,
  Orbit,
  Sparkles
} from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateWorkspaceFilters } from "../model/templateFilter";
import type { TemplateWorkspaceView, MyTemplateSection } from "../state/templateWorkspaceState";
import { TEMPLATE_INDUSTRY_OPTIONS } from "../model/templateCategory";
import { TEMPLATE_INTENTS, getIntentMeta, type TemplateIntentId } from "../model/templateIntent";
import { TaskIntentCard } from "./TaskIntentCard";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";
import { editorTheme } from "../../../theme/editorTheme";

const colors = TEMPLATE_WORKSPACE_UI.colors;
const DETAIL_RAIL_WIDTH = editorTheme.sizing.railWidth;

type Props = {
  lang: Lang;
  templateWorkspaceView: TemplateWorkspaceView;
  onPrimaryTabChange: (tab: "all" | "mine" | "daily" | "more") => void;
  myTemplateSection?: MyTemplateSection;
  onMyTemplateSectionChange?: (s: MyTemplateSection) => void;
  selectedIntentId: TemplateIntentId | null;
  selectedSubTaskId: string | null;
  onIntentChange: (intentId: TemplateIntentId) => void;
  onSubTaskChange: (subTaskId: string) => void;
  onFamilyChange: (familyId: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  filters: TemplateWorkspaceFilters;
  onFiltersChange: (f: TemplateWorkspaceFilters) => void;
  onClose: () => void;
  visibleCount?: number;
  totalCount?: number;
  freeCount?: number;
  ownedCount?: number;
  createdCount?: number;
};

export function TemplateWorkspaceHeader({
  lang,
  templateWorkspaceView,
  onPrimaryTabChange,
  myTemplateSection = "owned",
  onMyTemplateSectionChange,
  selectedIntentId,
  selectedSubTaskId,
  onIntentChange,
  onSubTaskChange,
  onFamilyChange,
  searchQuery,
  onSearchChange,
  view,
  onViewChange,
  filters,
  onFiltersChange,
  onClose,
  visibleCount,
  totalCount,
  ownedCount,
  createdCount
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const isAllTemplatesActive = templateWorkspaceView === "market" && !selectedIntentId;
  const isMyTemplatesActive = templateWorkspaceView === "my_templates";
  const isDailyTasksActive =
    templateWorkspaceView === "market" &&
    !!selectedIntentId &&
    selectedIntentId !== "pro_workflows";
  const isMoreTasksActive =
    templateWorkspaceView === "market" &&
    selectedIntentId === "pro_workflows";
  const blurButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.requestAnimationFrame(() => {
      event.currentTarget.blur();
    });
  };
  const preventMouseFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const [showFilters, setShowFilters] = React.useState(false);
  const [showProTasks, setShowProTasks] = React.useState(selectedIntentId === "pro_workflows");
  const primaryIntents = TEMPLATE_INTENTS.filter((intent) => intent.id !== "pro_workflows");
  const proIntent = getIntentMeta("pro_workflows");
  const proSubTasks = proIntent?.subTasks ?? [];

  const getProSubTaskIcon = (subTaskId: string) => {
    if (subTaskId === "continuity") return Layers;
    if (subTaskId === "dialogue") return MessagesSquare;
    if (subTaskId === "action") return Crosshair;
    if (subTaskId === "chase") return Orbit;
    return Sparkles;
  };

  React.useEffect(() => {
    setShowProTasks(selectedIntentId === "pro_workflows");
  }, [selectedIntentId]);

  return (
    <div style={styles.wrap}>
      <style>{`
        .template-header-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 6px 10px;
          border-radius: 6px;
          background: ${colors.bg};
          border: 1px solid ${colors.border};
          color: ${colors.textMuted};
          font-size: ${TEMPLATE_WORKSPACE_UI.fontSize.body}px;
          font-weight: 500;
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          outline: none;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
          box-shadow: none;
          transform: none;
          filter: none;
        }
        .template-header-btn:hover {
          background: ${colors.buttonHover};
          border-color: ${colors.buttonBorder};
          color: ${colors.text};
        }
        .template-header-btn:focus,
        .template-header-btn:focus-visible,
        .template-header-btn:active {
          outline: none;
          box-shadow: none;
          transform: none;
        }
        .template-header-btn--active {
          background: ${colors.panel};
          border-color: ${colors.accent};
          color: ${colors.accent};
        }
        .template-header-btn--active:hover {
          background: ${colors.panel};
          border-color: ${colors.accent};
          color: ${colors.accent};
        }
        .template-pro-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 47px;
          height: 47px;
          width: 100%;
          padding: 0 14px;
          border-radius: 6px;
          border: 1px solid ${colors.border};
          background: ${colors.panel};
          color: ${colors.text};
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          outline: none;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
          box-shadow: none;
          text-align: left;
        }
        button.template-pro-toggle-btn:hover:not(:disabled) {
          background: ${colors.buttonHover};
          border-color: ${colors.buttonBorder};
          transform: none !important;
        }
        .template-pro-toggle-btn--active,
        button.template-pro-toggle-btn--active:hover:not(:disabled) {
          background: ${colors.panel};
          border-color: ${colors.accent};
          color: ${colors.accent};
          transform: none !important;
        }
      `}</style>

      <div style={styles.topRow}>
        <div style={styles.viewSwitch}>
          <button
            type="button"
            className={`template-header-btn ${isAllTemplatesActive ? "template-header-btn--active" : ""}`}
            onClick={() => onPrimaryTabChange("all")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            <LayoutGrid size={14} />
            <span>{t("全部模板", "All Templates")}</span>
          </button>
          <button
            type="button"
            className={`template-header-btn ${isMyTemplatesActive ? "template-header-btn--active" : ""}`}
            onClick={() => onPrimaryTabChange("mine")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            <User size={14} />
            <span>{t("我的模板", "My Templates")}</span>
          </button>
          <button
            type="button"
            className={`template-header-btn ${isDailyTasksActive ? "template-header-btn--active" : ""}`}
            onClick={() => onPrimaryTabChange("daily")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            <span>{t("日常任务", "Daily Tasks")}</span>
          </button>
          <button
            type="button"
            className={`template-header-btn ${isMoreTasksActive ? "template-header-btn--active" : ""}`}
            onClick={() => onPrimaryTabChange("more")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            <span>{t("专业任务", "Pro Tasks")}</span>
          </button>
        </div>
          <button
            type="button"
            className="template-header-btn"
            onClick={onClose}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
            style={styles.closeBtn}
            aria-label={t("关闭", "Close")}
          >
            <X size={18} />
          </button>
        </div>

      {templateWorkspaceView === "my_templates" && onMyTemplateSectionChange ? (
        <div style={styles.sectionSwitch}>
          <button
            type="button"
            className={`template-header-btn ${myTemplateSection === "owned" ? "template-header-btn--active" : ""}`}
            onClick={() => onMyTemplateSectionChange("owned")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            {t("已拥有", "Owned")}{ownedCount != null ? ` (${ownedCount})` : ""}
          </button>
          <button
            type="button"
            className={`template-header-btn ${myTemplateSection === "created" ? "template-header-btn--active" : ""}`}
            onClick={() => onMyTemplateSectionChange("created")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
          >
            {t("我创建的", "Created by me")}{createdCount != null ? ` (${createdCount})` : ""}
          </button>
        </div>
      ) : null}

      {templateWorkspaceView === "market" ? (
        <>
          <div style={{ ...styles.intentRow, gridTemplateColumns: "repeat(5, minmax(140px, 1fr))" }}>
            {showProTasks
              ? proSubTasks.map((subTask) => {
                  const Icon = getProSubTaskIcon(subTask.id);
                  const active = selectedIntentId === "pro_workflows" && selectedSubTaskId === subTask.id;
                  return (
                    <button
                      key={subTask.id}
                      type="button"
                      className={`template-pro-toggle-btn ${active ? "template-pro-toggle-btn--active" : ""}`}
                      style={subTask.id === "continuity" ? styles.proContinuityBtn : undefined}
                      onClick={() => {
                        if (selectedIntentId !== "pro_workflows") {
                          onIntentChange("pro_workflows");
                        }
                        onSubTaskChange(subTask.id);
                        onFamilyChange(null);
                      }}
                      onMouseDown={preventMouseFocus}
                      onMouseUp={blurButton}
                    >
                      <Icon size={16} style={{ flexShrink: 0, color: active ? colors.accent : colors.textMuted }} />
                      <span style={styles.proToggleText}>{lang === "zh" ? subTask.labelZh : subTask.labelEn}</span>
                    </button>
                  );
                })
              : primaryIntents.map((intent) => (
                  <TaskIntentCard
                    key={intent.id}
                    intent={intent}
                    lang={lang}
                    compact
                    proLikeHover={intent.id === "sell_product"}
                    active={selectedIntentId === intent.id}
                    onClick={() => {
                      onIntentChange(intent.id);
                      onFamilyChange(null);
                    }}
                  />
                ))}
          </div>
        </>
      ) : null}

      <div
        style={{
          ...styles.bottomRow,
          maxWidth: `calc(100% - ${DETAIL_RAIL_WIDTH}px - 12px)`,
          alignSelf: "flex-start"
        }}
      >
        {templateWorkspaceView !== "my_templates" ? (
          <div style={styles.countPill}>
            {t("显示", "Showing")} {visibleCount ?? 0} / {t("共", "Total")} {totalCount ?? 0}
          </div>
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
        <button
          type="button"
          className="template-header-btn"
          onClick={() => setShowFilters((v) => !v)}
          onMouseDown={preventMouseFocus}
          onMouseUp={blurButton}
        >
          {showFilters ? t("收起筛选", "Hide Filters") : t("更多筛选", "More Filters")}
        </button>
        <div style={styles.viewToggle}>
          <button
            type="button"
            className={`template-header-btn ${view === "grid" ? "template-header-btn--active" : ""}`}
            onClick={() => onViewChange("grid")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
            title={t("方块显示", "Grid View")}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            className={`template-header-btn ${view === "list" ? "template-header-btn--active" : ""}`}
            onClick={() => onViewChange("list")}
            onMouseDown={preventMouseFocus}
            onMouseUp={blurButton}
            title={t("按行显示", "List View")}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {showFilters ? (
        <div
          style={{
            ...styles.filters,
            maxWidth: `calc(100% - ${DETAIL_RAIL_WIDTH}px - 12px)`,
            alignSelf: "flex-start"
          }}
        >
          <select
            value={filters.mediaType}
            onChange={(e) => onFiltersChange({ ...filters, mediaType: e.target.value as TemplateWorkspaceFilters["mediaType"] })}
            style={{ ...styles.select, ...(filters.mediaType !== "all" ? styles.selectActive : {}) }}
          >
            <option value="all">{t("图/视频", "Image/Video")}</option>
            <option value="image">{t("图", "Image")}</option>
            <option value="video">{t("视频", "Video")}</option>
          </select>
          <select
            value={filters.storyPlan}
            onChange={(e) => onFiltersChange({ ...filters, storyPlan: e.target.value as TemplateWorkspaceFilters["storyPlan"] })}
            style={{ ...styles.select, ...(filters.storyPlan !== "all" ? styles.selectActive : {}) }}
          >
            <option value="all">{t("单镜/连续/多机位/剪辑", "Shot plan")}</option>
            <option value="single">{t("单镜", "Single")}</option>
            <option value="continuous">{t("连续", "Continuous")}</option>
            <option value="multi_cam">{t("多机位", "Multi-cam")}</option>
            <option value="edited">{t("剪辑", "Edit")}</option>
          </select>
          <select
            value={filters.ratio}
            onChange={(e) => onFiltersChange({ ...filters, ratio: e.target.value as TemplateWorkspaceFilters["ratio"] })}
            style={{ ...styles.select, ...(filters.ratio !== "all" ? styles.selectActive : {}) }}
          >
            <option value="all">{t("比例", "Ratio")}</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
          <select
            value={filters.industry ?? "all"}
            onChange={(e) => onFiltersChange({ ...filters, industry: e.target.value as TemplateWorkspaceFilters["industry"] })}
            style={{ ...styles.select, ...((filters.industry && filters.industry !== "all") ? styles.selectActive : {}) }}
          >
            {TEMPLATE_INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{lang === "zh" ? opt.labelZh : opt.labelEn}</option>
            ))}
          </select>
          <select
            value={filters.pricing}
            onChange={(e) => onFiltersChange({ ...filters, pricing: e.target.value as TemplateWorkspaceFilters["pricing"] })}
            style={{ ...styles.select, ...(filters.pricing !== "all" ? styles.selectActive : {}) }}
          >
            <option value="all">{t("免费/付费", "Free/Paid")}</option>
            <option value="free">{t("免费", "Free")}</option>
            <option value="paid">{t("付费", "Paid")}</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "10px 12px 12px",
    background: colors.panel,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bottomRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },
  countPill: {
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textMuted,
    display: "inline-flex",
    alignItems: "center",
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.body,
    lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.normal,
    whiteSpace: "nowrap"
  },
  viewSwitch: { display: "flex", gap: 6 },
  viewToggle: { display: "flex", gap: 6 },
  sectionSwitch: { display: "flex", gap: 6 },
  intentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: 8
  },
  subTaskBlock: { display: "flex", flexDirection: "column", gap: 8 },
  subTaskRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 },
  taskToggleRow: { display: "flex", gap: 6, alignItems: "center" },
  intentRow: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
    gap: 8,
    minHeight: 51,
    width: "100%",
    overflowX: "auto"
  },
  proToggleText: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.compact
  },
  proContinuityBtn: {
    minHeight: 47,
    height: 47
  },
  searchWrap: {
    width: 380,
    maxWidth: "100%",
    minWidth: 220,
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: TEMPLATE_WORKSPACE_UI.radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    padding: "0 10px"
  },
  searchIcon: { color: colors.textMuted, flexShrink: 0 },
  searchInput: {
    height: TEMPLATE_WORKSPACE_UI.controlHeight.sm,
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: colors.text,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.body
  },
  filters: { display: "flex", flexWrap: "wrap", gap: 8 },
  select: {
    minWidth: 108,
    height: TEMPLATE_WORKSPACE_UI.controlHeight.sm,
    borderRadius: TEMPLATE_WORKSPACE_UI.radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textMuted,
    padding: "0 10px",
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.body
  },
  selectActive: { borderColor: colors.accent, color: colors.text },
  closeBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textMuted,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    boxShadow: "none"
  }
};
