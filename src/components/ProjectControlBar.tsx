import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import {
  ChevronDown,
  Download,
  FilePlus2,
  FolderOpen,
  PencilLine,
  Save,
  SaveAll
} from "lucide-react";
import { UI_COMMAND, UI_MENU, UI_PALETTE, UI_TYPO } from "../uiTokens";

type Props = {
  lang: Lang;
  isMac: boolean;
  projectLabel: string;
  onOpenQuickWorkspace: () => void;
  onOpenProject: () => void;
  onRenameProject: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onSaveAs: () => void;
  onExportProject: () => void;
  onSaveAll: () => void;
  onOpenLibrary: () => void;
};

export function ProjectControlBar(props: Props) {
  const {
    lang,
    isMac,
    projectLabel,
    onOpenQuickWorkspace,
    onOpenProject,
    onRenameProject,
    onNewProject,
    onSaveProject,
    onSaveAs,
    onExportProject,
    onSaveAll,
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
    newProject: isMac ? "⌘N" : "Ctrl+N"
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

  return (
    <div style={styles.anchor} ref={rootRef}>
      <div style={styles.wrap}>
        <button
          type="button"
          style={styles.projectButton}
          data-testid="project-menu-trigger"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setProjectMenuOpen((v) => !v)}
        >
          <div style={styles.projectButtonText}>
            <div style={styles.projectName}>{projectName}</div>
          </div>
          <ChevronDown size={13} />
        </button>

        {projectMenuOpen ? (
          <div style={styles.menu} data-testid="project-menu">
            <button style={styles.menuItem} data-testid="project-menu-quick-workspace" type="button" onClick={() => { closeMenus(); onOpenQuickWorkspace(); }}>
              <span style={styles.menuItemLabel}>
                <FolderOpen size={menuIconSize} />
                <span>{lang === "zh" ? "快捷工作台" : "Quick Workspace"}</span>
              </span>
            </button>
            <div style={styles.menuSep} />
            <button style={styles.menuItem} data-testid="project-menu-open" type="button" onClick={() => { closeMenus(); onOpenProject(); }}>
              <span style={styles.menuItemLabel}>
                <FolderOpen size={menuIconSize} />
                <span>{lang === "zh" ? "打开项目" : "Open Project"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.open}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-rename" type="button" onClick={() => { closeMenus(); onRenameProject(); }}>
              <span style={styles.menuItemLabel}>
                <PencilLine size={menuIconSize} />
                <span>{lang === "zh" ? "重命名项目" : "Rename Project"}</span>
              </span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-save" type="button" onClick={() => { closeMenus(); onSaveProject(); }}>
              <span style={styles.menuItemLabel}>
                <Save size={menuIconSize} />
                <span>{lang === "zh" ? "保存…" : "Save..."}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.save}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-save-as" type="button" onClick={() => { closeMenus(); onSaveAs(); }}>
              <span style={styles.menuItemLabel}>
                <Save size={menuIconSize} />
                <span>{lang === "zh" ? "另存为…" : "Save As..."}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.saveAs}</span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-export" type="button" onClick={() => { closeMenus(); onExportProject(); }}>
              <span style={styles.menuItemLabel}>
                <Download size={menuIconSize} />
                <span>{lang === "zh" ? "导出…" : "Export..."}</span>
              </span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-new" type="button" onClick={() => { closeMenus(); onNewProject(); }}>
              <span style={styles.menuItemLabel}>
                <FilePlus2 size={menuIconSize} />
                <span>{lang === "zh" ? "新建项目" : "New Project"}</span>
              </span>
              <span style={styles.menuShortcut}>{shortcuts.newProject}</span>
            </button>
            <div style={styles.menuSep} />
            <button style={styles.menuItem} data-testid="project-menu-save-all" type="button" onClick={() => { closeMenus(); onSaveAll(); }}>
              <span style={styles.menuItemLabel}>
                <SaveAll size={menuIconSize} />
                <span>{lang === "zh" ? "保存全部分镜…" : "Save All Shots..."}</span>
              </span>
            </button>
            <button style={styles.menuItem} data-testid="project-menu-library" type="button" onClick={() => { closeMenus(); onOpenLibrary(); }}>
              <span style={styles.menuItemLabel}>
                <FolderOpen size={menuIconSize} />
                <span>{lang === "zh" ? "我的分镜库" : "My Library"}</span>
              </span>
            </button>
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
  }
};
