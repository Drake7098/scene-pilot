/**
 * ProjectControlBar: project-name dropdown (topbar/sidebar variant).
 * Step1: 未启用备用实现。当前唯一项目动作为 Sidebar 项目区块；本组件保留但不挂载，不接入渲染树。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import {
  ChevronDown,
  Copy,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Layout,
  Package,
  PencilLine,
  Save
} from "lucide-react";
import { UI_COMMAND, UI_MENU, UI_PALETTE, UI_TYPO } from "../uiTokens";

type Props = {
  isPro?: boolean;
  lang: Lang;
  isMac: boolean;
  projectLabel: string;
  variant?: "topbar" | "sidebar";
  onOpenProject: () => void;
  onRenameProject: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onSaveAs: () => void;
  onDuplicateProject?: () => void;
  onSaveAsTemplate?: () => void;
  onCopyPrompt: () => void;
  /** Export prompt as .txt */
  onExportPromptTxt?: () => void;
  /** Export prompt + refs (zip) */
  onExportPromptPlusRefs?: () => void;
  /** Export project package */
  onExportProject: () => void;
  onOpenLibrary: () => void;
};

export function ProjectControlBar(props: Props) {
  const {
    lang,
    isMac,
    isPro = false,
    projectLabel,
    variant = "topbar",
    onOpenProject,
    onRenameProject,
    onNewProject,
    onSaveProject,
    onSaveAs,
    onDuplicateProject,
    onSaveAsTemplate,
    onCopyPrompt,
    onExportPromptTxt,
    onExportPromptPlusRefs,
    onExportProject,
    onOpenLibrary
  } = props;
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const projectName = useMemo(() => projectLabel.trim() || (lang === "zh" ? "未命名项目" : "Untitled Project"), [projectLabel, lang]);
  const menuIconSize = UI_MENU.item.iconSize;
  const shortcuts = useMemo(() => ({
    open: isMac ? "⌘O" : "Ctrl+O",
    save: isMac ? "⌘S" : "Ctrl+S",
    saveAs: isMac ? "⇧⌘S" : "Ctrl+Shift+S",
    newProject: isMac ? "⌘N" : "Ctrl+N",
    copyPrompt: isMac ? "⇧⌘C" : "Ctrl+Shift+C",
    export: isMac ? "⌘E" : "Ctrl+E"
  }), [isMac]);

  function closeMenus() {
    setProjectMenuOpen(false);
  }

  useEffect(() => {
    if (!projectMenuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      const target = e.target as Node | null;
      if (!root || !target) return;
      if (!root.contains(target)) setProjectMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProjectMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [projectMenuOpen]);

  const btnClass = isPro ? "pro-topbar-trigger" : "";
  const menuClass = isPro ? "pro-topbar-menu" : "";

  const isSidebar = variant === "sidebar";
  const triggerStyle = isSidebar
    ? { ...styles.sidebarTrigger, ...(isPro ? styles.sidebarTriggerPro : {}) }
    : isPro ? { ...styles.projectButton, ...styles.projectButtonPro } : styles.projectButton;

  return (
    <div style={styles.anchor} ref={rootRef}>
      <div style={{ ...styles.wrap, ...(isSidebar ? styles.wrapSidebar : {}) }}>
        <button
          type="button"
          className={btnClass}
          style={triggerStyle}
          data-testid="project-menu-trigger"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setProjectMenuOpen((v) => !v)}
        >
          {isSidebar ? (
            <>
              <div style={styles.sidebarIcon}>
                <Layout size={14} style={{ color: "var(--pro-text-primary, #e5e7eb)" }} />
              </div>
              <span style={styles.sidebarAppName}>ScenePilotix</span>
              <span style={styles.sidebarProjectName}>/ {projectName}</span>
              <ChevronDown size={12} style={{ marginLeft: "auto", opacity: 0.8 }} />
            </>
          ) : (
            <>
              <div style={styles.projectButtonText}>
                <div style={styles.projectName}>{projectName}</div>
              </div>
              <ChevronDown size={13} />
            </>
          )}
        </button>

        {projectMenuOpen ? (
          <div className={menuClass} style={isPro ? { ...styles.menu, ...styles.menuPro } : styles.menu} data-testid="project-menu">
            {/* Group 1: File */}
            <button style={styles.menuItem} data-testid="project-menu-new" type="button" onClick={() => { closeMenus(); onNewProject(); }}>
              <span style={styles.menuItemLabel}>
                <FilePlus2 size={menuIconSize} />
                <span>{lang === "zh" ? "新建项目" : "New Project"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.newProject}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-open" type="button" onClick={() => { closeMenus(); onOpenProject(); }}>
              <span style={styles.menuItemLabel}>
                <FolderOpen size={menuIconSize} />
                <span>{lang === "zh" ? "打开项目" : "Open Project"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.open}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-save" type="button" onClick={() => { closeMenus(); onSaveProject(); }}>
              <span style={styles.menuItemLabel}>
                <Save size={menuIconSize} />
                <span>{lang === "zh" ? "保存项目" : "Save Project"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.save}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-save-as" type="button" onClick={() => { closeMenus(); onSaveAs(); }}>
              <span style={styles.menuItemLabel}>
                <Save size={menuIconSize} />
                <span>{lang === "zh" ? "另存项目" : "Save Project As"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.saveAs}</span>
            </button>
            <div style={styles.menuSep} />
            {/* Group 2: Project */}
            <button style={styles.menuItem} data-testid="project-menu-rename" type="button" onClick={() => { closeMenus(); onRenameProject(); }}>
              <span style={styles.menuItemLabel}>
                <PencilLine size={menuIconSize} />
                <span>{lang === "zh" ? "重命名项目" : "Rename Project"}</span>
              </span>
            </button>
            {onDuplicateProject ? (
              <button style={styles.menuItem} data-testid="project-menu-duplicate" type="button" onClick={() => { closeMenus(); onDuplicateProject(); }}>
                <span style={styles.menuItemLabel}>
                  <Copy size={menuIconSize} />
                  <span>{lang === "zh" ? "复制为新项目" : "Duplicate Project"}</span>
                </span>
              </button>
            ) : null}
            <button style={styles.menuItem} data-testid="project-menu-library" type="button" onClick={() => { closeMenus(); onOpenLibrary(); }}>
              <span style={styles.menuItemLabel}>
                <FolderOpen size={menuIconSize} />
                <span>{lang === "zh" ? "项目库" : "Project Library"}</span>
              </span>
            </button>
            <div style={styles.menuSep} />
            {/* Group 3: Export */}
            <button style={styles.menuItem} data-testid="project-menu-copy-prompt" type="button" onClick={() => { closeMenus(); onCopyPrompt(); }}>
              <span style={styles.menuItemLabel}>
                <Copy size={menuIconSize} />
                <span>{lang === "zh" ? "复制提示词" : "Copy Prompt"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.copyPrompt}</span>
            </button>
            {onExportPromptTxt ? (
              <button style={styles.menuItem} data-testid="project-menu-export-prompt-txt" type="button" onClick={() => { closeMenus(); onExportPromptTxt(); }}>
                <span style={styles.menuItemLabel}>
                  <FileText size={menuIconSize} />
                  <span>{lang === "zh" ? "导出提示词" : "Export Prompt"}</span>
                </span>
              </button>
            ) : null}
            {onExportPromptPlusRefs ? (
              <button style={styles.menuItem} data-testid="project-menu-export-prompt-refs" type="button" onClick={() => { closeMenus(); onExportPromptPlusRefs(); }}>
                <span style={styles.menuItemLabel}>
                  <Download size={menuIconSize} />
                  <span>{lang === "zh" ? "导出提示词 + 参考图" : "Export Prompt + Refs"}</span>
                </span>
              </button>
            ) : null}
            <button style={styles.menuItem} data-testid="project-menu-export" type="button" onClick={() => { closeMenus(); onExportProject(); }}>
              <span style={styles.menuItemLabel}>
                <Package size={menuIconSize} />
                <span>{lang === "zh" ? "导出项目包" : "Export Project Package"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.export}</span>
            </button>
            <div style={styles.menuSep} />
            {/* Group 4: Template */}
            {onSaveAsTemplate ? (
              <button style={styles.menuItem} data-testid="project-menu-save-as-template" type="button" onClick={() => { closeMenus(); onSaveAsTemplate(); }}>
                <span style={styles.menuItemLabel}>
                  <Layout size={menuIconSize} />
                  <span>{lang === "zh" ? "保存为模板" : "Save as Template"}</span>
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  anchor: {
    position: "relative"
  },
  menuMask: {
    position: "fixed",
    inset: 0,
    zIndex: 9999
  },
  wrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: 0,
    borderRadius: 16,
    border: "none",
    background: "transparent",
    boxShadow: "none",
    backdropFilter: "blur(16px)"
  },
  projectButton: {
    minWidth: 148,
    maxWidth: 192,
    minHeight: 34,
    padding: "0 6px 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderRadius: 11,
    border: "1px solid transparent",
    background: UI_COMMAND.surface.quiet,
    color: UI_PALETTE.text.primary,
    cursor: "pointer",
    boxShadow: UI_COMMAND.shadow.soft,
    ["--spx-btn-bg-hover" as any]: UI_COMMAND.surface.default,
    ["--spx-btn-bg-active" as any]: UI_COMMAND.surface.active,
    ["--spx-btn-border-hover" as any]: UI_COMMAND.border.hover,
    ["--spx-btn-border-active" as any]: UI_COMMAND.border.active,
    ["--spx-btn-shadow" as any]: UI_COMMAND.shadow.soft,
    ["--spx-btn-shadow-hover" as any]: UI_COMMAND.shadow.hover,
    ["--spx-btn-shadow-active" as any]: UI_COMMAND.shadow.active
  },
  projectButtonText: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    textAlign: "left"
  },
  projectName: {
    fontSize: UI_TYPO.size15,
    fontWeight: 850,
    letterSpacing: 0.06,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    zIndex: 10000,
    width: UI_MENU.width,
    padding: UI_MENU.panel.padding,
    borderRadius: UI_MENU.panel.radius,
    border: `1px solid ${UI_MENU.panel.border}`,
    background: UI_MENU.panel.surface,
    boxShadow: UI_MENU.panel.shadow,
    overflow: "hidden",
    backdropFilter: "blur(20px)"
  },
  menuItem: {
    width: "100%",
    minHeight: UI_MENU.item.minHeight,
    padding: `0 ${UI_MENU.item.padX}px`,
    display: "flex",
    alignItems: "center",
    gap: UI_MENU.item.gap,
    borderRadius: UI_MENU.item.radius,
    border: "1px solid transparent",
    background: "transparent",
    color: UI_PALETTE.text.primary,
    fontSize: UI_MENU.item.fontSize,
    fontWeight: 760,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "none",
    ["--spx-btn-bg-hover" as any]: UI_MENU.item.hover,
    ["--spx-btn-bg-active" as any]: UI_MENU.item.active,
    ["--spx-btn-border-hover" as any]: UI_COMMAND.border.hover,
    ["--spx-btn-border-active" as any]: UI_COMMAND.border.active,
    ["--spx-btn-shadow" as any]: "none",
    ["--spx-btn-shadow-hover" as any]: "none",
    ["--spx-btn-shadow-active" as any]: "none"
  },
  menuItemLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: UI_MENU.item.gap,
    minWidth: 0
  },
  menuShortcut: {
    marginLeft: "auto",
    fontSize: UI_TYPO.size11,
    fontWeight: 700,
    color: UI_MENU.item.textSecondary,
    letterSpacing: 0.18
  },
  menuSep: {
    height: 1,
    margin: "8px 4px",
    background: "rgba(255,255,255,0.1)"
  },
  projectButtonPro: {
    background: "var(--pro-bg-panel)",
    border: "1px solid var(--pro-border)",
    color: "var(--pro-text-primary)",
    boxShadow: "none"
  },
  menuPro: {
    background: "var(--pro-bg-panel)",
    border: "1px solid var(--pro-border)",
    color: "var(--pro-text-primary)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    backdropFilter: "none"
  },
  wrapSidebar: {
    width: "100%"
  },
  sidebarTrigger: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    minHeight: 36,
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    border: "1px solid var(--pro-border, #3a3f46)",
    background: "var(--pro-bg, #1f2125)",
    color: "var(--pro-text-primary, #e5e7eb)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "none"
  },
  sidebarTriggerPro: {
    background: "var(--pro-bg-input, #1f2125)",
    borderColor: "var(--pro-border-soft, #3a3f46)"
  },
  sidebarIcon: {
    width: 24,
    height: 24,
    minWidth: 24,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--pro-bg, #1f2125)",
    border: "1px solid var(--pro-border, #3a3f46)"
  },
  sidebarAppName: {
    fontWeight: 600,
    color: "var(--pro-text-primary, #e5e7eb)",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  sidebarProjectName: {
    color: "var(--pro-text-muted, #9ca3af)",
    fontSize: 11,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
    flex: 1
  }
};
