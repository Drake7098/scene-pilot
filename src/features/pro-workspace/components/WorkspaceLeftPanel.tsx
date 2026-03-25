/**
 * WorkspaceLeftPanel — 严格对齐 figma/app.tsx 规范
 *
 * Figma 字体标准（来自 figma/app.tsx Section 组件）：
 *   Section 标题:  12px  font-semibold(600)  uppercase  tracking-wider  color #e5e7eb
 *   列表项文字:    12px  400                                             color #9ca3af → hover #e5e7eb
 *   项目名称:      14px  font-semibold(600)                             color #e5e7eb
 *
 * 交互：无边框、无阴影、无 transform，hover 只改 background → #343942
 * 圆角：4px（Figma `rounded`）
 * 分割线：`border-b border-[#3a3f46]` 只在大模块间
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video, Clapperboard, MonitorPlay, Aperture, Mountain,
  Users, Sun, Palette, Settings2, LayoutGrid, Shield,
  FileText, Download, Globe, Layout,
  UserRound, CreditCard, Wallet, LogOut, Crown, KeyRound,
  FilePlus2, FolderOpen, Save, Copy, PencilLine,
  ChevronLeft, ChevronRight, Layers, Camera,
} from "lucide-react";
import type { Lang } from "../../../i18n";
import type { ProWorkspaceSection } from "../types";

const BG_A   = "#1f2125";
const BG_B   = "#24262b";
const BORDER = "#3a3f46";
const ACCENT = "#f59e0b";
const TEXT   = "#e5e7eb";
const MUTED  = "#9ca3af";
const HOVER  = "#343942";
const COL_A_OPEN   = 200;
const COL_A_CLOSED = 44;
const COL_B_W      = 164;

type GlobalNav = "workspace" | "templates" | "history";
type UserInfo  = { displayName: string; email?: string; avatarColor?: string; isPro?: boolean };

export type Props = {
  lang: Lang;
  isMac?: boolean;
  section: ProWorkspaceSection;
  onSectionChange: (s: ProWorkspaceSection) => void;
  activeGlobalNav?: GlobalNav;
  onGlobalNavChange?: (nav: GlobalNav) => void;
  projectLabel?: string;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveAs?: () => void;
  onRenameProject?: () => void;
  onOpenLibrary?: () => void;
  onExportPromptPlusRefs?: () => void;
  onExportProject?: () => void;
  onSaveAsTemplate?: () => void;
  user?: UserInfo | null;
  credits?: number;
  onOpenAccount?: (section?: string) => void;
  onOpenBilling?: () => void;  // kept for backward compat
  onOpenUpgrade?: () => void;  // kept for backward compat
  onLogout?: () => void;
  onOpenApiSettings?: () => void;
  onOpenLocalSettings?: () => void;
  onToggleLang?: () => void;
  onOpenHelp?: () => void;
};

const tl = (lang: Lang, zh: string, en: string) => lang === "zh" ? zh : en;

// base button style — no shadow, no transform, no border
const baseBtn: React.CSSProperties = {
  border: "none", boxShadow: "none", transform: "none",
  cursor: "pointer", outline: "none",
  transition: "background 120ms, color 120ms",
};

function ProjItem({ icon: Icon, label, shortcut, onClick, collapsed }: {
  icon: any; label: string; shortcut?: string; onClick?: () => void; collapsed: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button"
      title={collapsed ? label : undefined}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseBtn,
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 7,
        justifyContent: collapsed ? "center" : "flex-start",
        width: "100%", padding: collapsed ? "5px 0" : "5px 10px",
        borderRadius: 4,
        background: hov ? HOVER : "transparent",
        color: hov ? TEXT : MUTED,
        fontSize: 12, fontWeight: 400,
        textAlign: "left",
      }}
    >
      <Icon size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
      {!collapsed && <>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {shortcut && (
          <span style={{ fontSize: 10, color: `${MUTED}50`, flexShrink: 0 }}>{shortcut}</span>
        )}
      </>}
    </button>
  );
}

function StepItem({ icon: Icon, label, isActive, onClick }: {
  icon: any; label: string; isActive: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseBtn,
        display: "flex", alignItems: "center", gap: 8,
        width: "100%",
        padding: "7px 12px",
        borderRadius: 4,
        background: isActive ? `${ACCENT}14` : hov ? HOVER : "transparent",
        color: isActive ? ACCENT : hov ? TEXT : TEXT,
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        textAlign: "left",
      }}
    >
      <Icon size={14} style={{ flexShrink: 0, color: isActive ? ACCENT : MUTED }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

// ── TemplateEntryBtn — Col B 顶部模板库大入口 ──────────────────────────────
function TemplateEntryBtn({ label, isActive, onClick }: {
  label: string; isActive: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseBtn,
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "13px 12px",
        borderBottom: `1px solid ${BORDER}`,
        background: isActive ? `${ACCENT}14` : hov ? HOVER : "transparent",
        color: isActive ? ACCENT : TEXT,
        fontSize: 13, fontWeight: 600,
        textAlign: "left",
        borderLeft: isActive ? `3px solid ${ACCENT}` : "3px solid transparent",
        flexShrink: 0,
      }}
    >
      <Layout size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

function GlobalNavItem({ icon: Icon, label, isActive, onClick }: {
  icon: any; label: string; isActive: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseBtn,
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "7px 12px",
        borderRadius: 4,
        background: isActive ? `${ACCENT}14` : hov ? HOVER : "transparent",
        color: isActive ? ACCENT : hov ? TEXT : TEXT,
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        textAlign: "left",
      }}
    >
      <Icon size={14} style={{ flexShrink: 0, color: isActive ? ACCENT : MUTED }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

function UserMenuItem({ icon: Icon, label, onClick, danger, accent }: {
  icon: any; label: string; onClick?: () => void; danger?: boolean; accent?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseBtn,
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "6px 10px",
        borderRadius: 4,
        background: hov ? HOVER : "transparent",
        color: danger ? "#f87171" : accent ? ACCENT : TEXT,
        fontSize: 12, textAlign: "left",
      }}
    >
      <Icon size={13} style={{ flexShrink: 0, opacity: 0.75 }} />
      <span>{label}</span>
    </button>
  );
}

// Section header — uppercase 11px 700 muted — 区分于列表项12px普通色
// 参照 figma/app.tsx: "text-xs font-semibold uppercase tracking-wider text-[#9ca3af]"
// 注：figma的 Section 标题颜色是 textMuted(#9ca3af)，大写+加粗做视觉区分
const SecLabel = ({ text, collapsed }: { text: string; collapsed: boolean }) =>
  collapsed ? null : (
    <div style={{
      padding: "10px 10px 3px",
      fontSize: 11,
      fontWeight: 700,
      color: MUTED,
      textTransform: "uppercase",
      letterSpacing: "0.09em",
    }}>
      {text}
    </div>
  );

const ColBLabel = ({ text }: { text: string }) => (
  <div style={{
    padding: "6px 12px 2px",
    fontSize: 11,
    fontWeight: 700,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
  }}>
    {text}
  </div>
);

export function WorkspaceLeftPanel({
  lang, isMac = false,
  section, onSectionChange,
  activeGlobalNav, onGlobalNavChange,
  projectLabel,
  onNewProject, onOpenProject, onSaveProject, onSaveAs,
  onRenameProject, onOpenLibrary,
  onExportPromptPlusRefs, onExportProject, onSaveAsTemplate,
  user, credits, onOpenAccount, onOpenBilling, onOpenUpgrade, onLogout, onOpenApiSettings, onOpenLocalSettings,
  onToggleLang, onOpenHelp,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number }>({ bottom: 56, left: 4 });
  const userBtnRef = useRef<HTMLButtonElement>(null);

  const openUserMenu = useCallback(() => {
    if (userBtnRef.current) {
      const rect = userBtnRef.current.getBoundingClientRect();
      setMenuPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left });
    }
    setUserMenuOpen(true);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [userMenuOpen]);

  const colAW = collapsed ? COL_A_CLOSED : COL_A_OPEN;
  const mod = isMac ? "⌘" : "Ctrl";
  const sh  = "⇧";

  const WORKFLOW: Array<{ id: ProWorkspaceSection; icon: any; zh: string; en: string }> = [
    { id: "shot",        icon: Video,       zh: "镜头",     en: "Shot" },
    { id: "director",    icon: Clapperboard, zh: "导演",     en: "Director" },
    { id: "output",      icon: MonitorPlay,  zh: "输出类型", en: "Output" },
    { id: "camera_lang", icon: Aperture,     zh: "镜头语言", en: "Lens" },
    { id: "scene_bg",    icon: Mountain,     zh: "场景",     en: "Scene" },
    { id: "objects",     icon: Users,        zh: "对象",     en: "Objects" },
    { id: "lighting",    icon: Sun,          zh: "灯光",     en: "Lighting" },
    { id: "style",       icon: Palette,      zh: "风格",     en: "Style" },
    { id: "tech",        icon: Settings2,    zh: "技术",     en: "Tech" },
  ];

  const TOOLS: Array<{ id: ProWorkspaceSection; icon: any; zh: string; en: string }> = [
    { id: "composition",    icon: LayoutGrid, zh: "构图",   en: "Compose" },
    { id: "constraints",    icon: Shield,     zh: "约束",   en: "Constrain" },
    { id: "prompt_preview", icon: FileText,   zh: "提示词", en: "Prompt" },
    { id: "export",         icon: Download,   zh: "输出",   en: "Export" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", flexShrink: 0, borderRight: `1px solid ${BORDER}` }}>

      {/* ── Col A ── */}
      <div style={{
        width: colAW, minWidth: colAW,
        background: BG_A, display: "flex", flexDirection: "column",
        overflow: "hidden", borderRight: `1px solid ${BORDER}`,
        transition: "width 0.15s ease, min-width 0.15s ease",
      }}>

        {/* Header: project name 14px 600 */}
        <div style={{
          height: 48, flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: collapsed ? "0 10px" : "0 12px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {!collapsed && (
            <span style={{
              fontSize: 14, fontWeight: 600, color: TEXT,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1, minWidth: 0, letterSpacing: "0.01em",
            }}>
              {projectLabel || "ScenePilot"}
            </span>
          )}
          <button type="button"
            title={collapsed ? tl(lang, "展开", "Expand") : tl(lang, "折叠", "Collapse")}
            onClick={() => setCollapsed(v => !v)}
            style={{
              ...baseBtn,
              width: 22, height: 22, borderRadius: 4,
              background: "transparent", color: MUTED,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = HOVER; e.currentTarget.style.color = TEXT; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED; }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Items */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", padding: "2px",
          scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent`,
        }}>
          <SecLabel text={tl(lang, "Project", "Project")} collapsed={collapsed} />
          <ProjItem icon={FilePlus2}  label={tl(lang,"新建项目","New Project")}          shortcut={`${mod}N`}      onClick={() => { onNewProject?.();           onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={FolderOpen} label={tl(lang,"打开项目","Open Project")}          shortcut={`${mod}O`}      onClick={() => { onOpenProject?.();          onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={Save}       label={tl(lang,"保存","Save")}                      shortcut={`${mod}S`}      onClick={() => { onSaveProject?.();          onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={Copy}       label={tl(lang,"另存为","Save As")}                 shortcut={`${sh}${mod}S`} onClick={() => { onSaveAs?.();               onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={PencilLine} label={tl(lang,"重命名","Rename")}                                            onClick={() => { onRenameProject?.();        onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={FolderOpen} label={tl(lang,"项目库","Library")}                                           onClick={() => { onOpenLibrary?.();          onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />

          <div style={{ margin: "5px 8px", borderTop: `1px solid ${BORDER}` }} />

          <SecLabel text={tl(lang, "Export", "Export")} collapsed={collapsed} />
          <ProjItem icon={Layers}   label={tl(lang,"提示词 + 参考图","Prompt + Refs")}    shortcut={`${sh}${mod}E`} onClick={() => { onExportPromptPlusRefs?.();  onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
          <ProjItem icon={Download} label={tl(lang,"导出项目包","Export Package")}                                  onClick={() => { onExportProject?.();        onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />

          <div style={{ margin: "5px 8px", borderTop: `1px solid ${BORDER}` }} />

          <ProjItem icon={Globe}    label={tl(lang,"保存为模板","Save as Template")}                                onClick={() => { onSaveAsTemplate?.();       onGlobalNavChange?.("workspace"); }} collapsed={collapsed} />
        </div>

        {/* User */}
        <div style={{ borderTop: `1px solid ${BORDER}`, flexShrink: 0, padding: "2px" }}>
          {!collapsed && user && credits != null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px 5px", fontSize: 11, color: MUTED,
            }}>
              <Wallet size={10} />
              <span style={{ flex: 1 }}>{credits.toLocaleString()} Credits</span>
              <button type="button" onClick={() => onOpenAccount?.("credits")} style={{
                ...baseBtn,
                padding: "1px 6px", borderRadius: 4,
                background: "transparent", color: ACCENT,
                fontSize: 11, fontWeight: 600,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = HOVER; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >{tl(lang, "充值", "Top up")}</button>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <button type="button"
              title={collapsed ? (user?.displayName ?? "Account") : undefined}
              ref={userBtnRef}
              onClick={e => { e.stopPropagation(); userMenuOpen ? setUserMenuOpen(false) : openUserMenu(); }}
              style={{
                ...baseBtn,
                width: "100%", display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 8,
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "5px 0" : "5px 10px",
                background: "transparent", color: TEXT,
                borderRadius: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = HOVER; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: user?.avatarColor ?? BORDER,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <UserRound size={12} style={{ color: "#fff" }} />
              </span>
              {!collapsed && (
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 12,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  textAlign: "left",
                }}>
                  {user?.displayName ?? tl(lang, "未登录", "Not signed in")}
                </span>
              )}
              {!collapsed && user?.isPro && (
                <span style={{
                  fontSize: 9, padding: "1px 4px", borderRadius: 3, flexShrink: 0,
                  background: `${ACCENT}20`, color: ACCENT, fontWeight: 700,
                }}>PRO</span>
              )}
            </button>


          </div>
        </div>
      </div>


      {/* User menu popup — rendered outside Col A to escape overflow/transform stacking context */}
      {userMenuOpen && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: "fixed",
          bottom: menuPos.bottom,
          left: menuPos.left,
          width: 210,
          background: BG_B, border: `1px solid ${BORDER}`,
          borderRadius: 4, boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          padding: "4px", zIndex: 9999,
        }}>
              {/* Account group */}
                {!user?.isPro && (
                  <UserMenuItem icon={Crown} label={tl(lang,"升级 Pro","Upgrade to Pro")} accent
                    onClick={() => { setUserMenuOpen(false); onOpenAccount?.("pro"); }} />
                )}
                <UserMenuItem icon={UserRound} label={tl(lang,"账户中心","Account")}
                  onClick={() => { setUserMenuOpen(false); onOpenAccount?.("overview"); }} />
                <UserMenuItem icon={CreditCard} label={tl(lang,"充值积分","Credits")}
                  onClick={() => { setUserMenuOpen(false); onOpenAccount?.("credits"); }} />

                {/* API group */}
                <div style={{ margin: "3px 6px", borderTop: `1px solid ${BORDER}` }} />
                <UserMenuItem icon={KeyRound} label={tl(lang,"API 接入","API Access")}
                  onClick={() => { setUserMenuOpen(false); onOpenAccount?.("api"); }} />

                {/* Meta */}
                {(onToggleLang || onOpenHelp) && (
                  <div style={{ margin: "3px 6px", borderTop: `1px solid ${BORDER}` }} />
                )}
                {onToggleLang && (
                  <UserMenuItem icon={Globe} label={lang === "zh" ? "Switch to English" : "切换中文"}
                    onClick={() => { setUserMenuOpen(false); onToggleLang?.(); }} />
                )}
                {onOpenHelp && (
                  <UserMenuItem icon={Globe} label={tl(lang,"帮助中心","Help")}
                    onClick={() => { setUserMenuOpen(false); onOpenHelp?.(); }} />
                )}
                {user && <>
                  <div style={{ margin: "3px 6px", borderTop: `1px solid ${BORDER}` }} />
                  <UserMenuItem icon={LogOut} label={tl(lang,"退出登录","Log Out")} danger
                    onClick={() => { setUserMenuOpen(false); onLogout?.(); }} />
                </>}
        </div>
      )}
      {/* ── Col B ── */}
      <div style={{
        width: COL_B_W, minWidth: COL_B_W,
        background: BG_B, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Templates — 顶部大入口，独立区块 */}
        <TemplateEntryBtn
          label={tl(lang, "模板库", "Templates")}
          isActive={activeGlobalNav === "templates"}
          onClick={() => onGlobalNavChange?.("templates")}
        />

        {/* Workflow header */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: "0 12px", borderBottom: `1px solid ${BORDER}`,
          height: 36,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: MUTED,
            textTransform: "uppercase", letterSpacing: "0.09em",
          }}>
            {tl(lang, "拍摄流程", "Workflow")}
          </span>
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 0",
          scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent`,
        }}>
          {WORKFLOW.map(item => (
            <StepItem key={item.id} icon={item.icon}
              label={tl(lang, item.zh, item.en)}
              isActive={section === item.id}
              onClick={() => {
                onSectionChange(item.id);
                onGlobalNavChange?.("workspace"); // 关闭模版库
              }} />
          ))}
          <div style={{ margin: "4px 12px", borderTop: `1px solid ${BORDER}` }} />
          <ColBLabel text={tl(lang, "工具", "Tools")} />
          {TOOLS.map(item => (
            <StepItem key={item.id} icon={item.icon}
              label={tl(lang, item.zh, item.en)}
              isActive={section === item.id}
              onClick={() => {
                onSectionChange(item.id);
                onGlobalNavChange?.("workspace"); // 关闭模版库
              }} />
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, flexShrink: 0, padding: "4px 0" }}>
          <GlobalNavItem
            icon={Camera}
            label={tl(lang, "历史", "History")}
            isActive={activeGlobalNav === "history"}
            onClick={() => onGlobalNavChange?.("history")}
          />
        </div>
      </div>
    </div>
  );
}
