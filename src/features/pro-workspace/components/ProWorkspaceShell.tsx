/**
 * ProWorkspaceShell — Figma UI 规范对齐版本
 *
 * 对照 figma/app.tsx 优化：
 * - Canvas 区域：dotGrid 背景 + Tab 栏
 * - Bottom bar：figma "Prompt Editor" 底部面板风格
 * - 色彩 token 全部对齐 #1f2125/#24262b/#3a3f46
 * - 按钮高度 32px，圆角 6px
 * - Tab active 样式：bottom border amber
 */

import React, { useState, useMemo, useEffect } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, Layer } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import type { ProWorkspaceSection } from "../types";
import type { ExportMode } from "./ExportModeSection";


import { ShotPanel }                from "./ShotPanel";
import { DirectorPanel }            from "./DirectorPanel";
import { OutputTypePanel }          from "./OutputTypePanel";
import { CameraLangPanel }          from "./CameraLangPanel";
import { SceneBgPanel }             from "./SceneBgPanel";
import { ObjectEditorPanel }        from "./ObjectEditorPanel";
import { LightingPanel }            from "./LightingPanel";
import { StylePanel }               from "./StylePanel";
import { TechPanel }                from "./TechPanel";
import { CompositionEditorPanel }   from "./CompositionEditorPanel";
import { ConstraintInspectorPanel } from "./ConstraintInspectorPanel";
import { PromptPreviewPanel }       from "./PromptPreviewPanel";
import { ExportControlPanel, type GenerateSettings } from "./ExportControlPanel";

import { Stage }                    from "../../../components/Stage";
import { resolveSceneConfig }       from "../../../model";
// GenerationSourceBar removed
type GenerationSource = "api" | "local_comfy" | "local_draw";
import type { ApiCredentialState } from "../../../types/account";
import type { LocalProviderStatus } from "../../../utils/localGeneration";
import { detectSceneConflicts }     from "../../../utils/conflictRules";
import { buildPromptForScene }      from "../../../utils/promptEngine";
import { getPlatformPreset }        from "../../../config/platformPresets";

import {
  Sparkles, Copy, Download, AlertCircle, Image as ImageIcon, Play, LayoutGrid,
} from "lucide-react";

// ── Design tokens — figma/app.tsx aligned ─────────────────────────────────
const BG     = "#1f2125";  // figma bg
const PANEL  = "#24262b";  // figma panel
const BORDER = "#3a3f46";  // figma border
const ACCENT = "#f59e0b";  // figma accent
const TEXT   = "#e5e7eb";  // figma text
const MUTED  = "#9ca3af";  // figma textMuted
const RIGHT_W = 280;
const BAR_H   = 52;
const FOCUS_OBJECT_EDITOR_EVENT = "spx:focus-object-editor";

// ── Types ──────────────────────────────────────────────────────────────────
type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  sceneIdx: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onRenameLayer?: (oldId: string, newId: string) => void;
  onAddLayer?: () => void;
  onDeleteLayer?: (layerId: string) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
  platformId: string;
  onJumpToConflict?: (layerId: string | null) => void;
  onPlatformChange?: (id: PlatformPresetId) => void;
  exportMode?: ExportMode;
  onExportModeChange?: (v: ExportMode) => void;
  generationSource?: GenerationSource;
  onGenerationSourceChange?: (v: GenerationSource) => void;
  canUseByo?: boolean;
  onCopyPrompt?: () => void;
  onExport?: () => void;
  onGenerate?: () => void;
  generateBusy?: boolean;

  byoCredentials?: ApiCredentialState | null;
  comfyStatus?: LocalProviderStatus;
  drawStatus?: LocalProviderStatus;
  onGenerateSettingsChange?: (settings: GenerateSettings) => void;
  section?: ProWorkspaceSection;
  onSectionChange?: (s: ProWorkspaceSection) => void;
  assetList?: Array<{
    id: string; kind: "image" | "video"; title: string;
    source?: string;
    imageUrl?: string; videoUrl?: string; posterUrl?: string;
  }>;
  activeAssetId?: string;
  onSetActiveAsset?: (id: string) => void;
  currentAsset?: {
    id: string; kind: "image" | "video"; title: string;
    source?: string;
    imageUrl?: string; videoUrl?: string; posterUrl?: string;
  } | null;
  onDownloadAsset?: () => void;
  onDeleteAsset?: () => void;
  onRegenerateAsset?: () => void;
  exportPanelSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
};

// ── Right panel content switcher ───────────────────────────────────────────
function RightPanelContent(props: Props & { section: ProWorkspaceSection }) {
  const {
    section, lang, project, scene,
    selectedLayerId, onSelectLayer, onUpdateScene, onRenameLayer,
    onAddLayer, onDeleteLayer,
    editT, setEditT, platformId, onPlatformChange,
    exportMode, onExportModeChange, generationSource, onGenerationSourceChange,
    canUseByo, byoCredentials, comfyStatus, drawStatus,
    onGenerateSettingsChange, onCopyPrompt, onExport, onGenerate, generateBusy, onJumpToConflict,
  } = props;

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    const layers = [...(scene.layers ?? [])];
    const idx = layers.findIndex(l => l.id === layerId);
    if (idx < 0) return;
    layers[idx] = { ...layers[idx], ...patch };
    onUpdateScene({ ...scene, layers });
  };

  switch (section) {
    case "shot":         return <ShotPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "director":     return <DirectorPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "output":       return <OutputTypePanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "camera_lang":  return <CameraLangPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "scene_bg":     return <SceneBgPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "objects":      return <ObjectEditorPanel lang={lang} scene={scene} project={project} selectedLayerId={selectedLayerId ?? null} onSelectLayer={onSelectLayer!} onUpdateScene={onUpdateScene} onUpdateLayer={updateLayer} onRenameLayer={onRenameLayer} onAddLayer={onAddLayer} onDeleteLayer={onDeleteLayer} />;
    case "lighting":     return <LightingPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "style":        return <StylePanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "tech":         return <TechPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;
    case "composition":  return <CompositionEditorPanel lang={lang} scene={scene} project={project} selectedLayerId={selectedLayerId ?? null} onSelectLayer={onSelectLayer!} onUpdateScene={onUpdateScene} onUpdateLayer={updateLayer} editT={editT} setEditT={setEditT} />;
    case "constraints":  return <ConstraintInspectorPanel lang={lang} scene={scene} project={project} selectedLayerId={selectedLayerId ?? null} onJumpToConflict={onJumpToConflict} />;
    case "prompt_preview":
      return <PromptPreviewPanel lang={lang} project={project} scene={scene} platformId={platformId} onCopyPrompt={onCopyPrompt} />;
    case "platform":
    case "export":
    case "generate_settings":
      return (
        <ExportControlPanel
          lang={lang}
          project={project}
          scene={scene}
          platformId={platformId as PlatformPresetId}
          onPlatformChange={onPlatformChange ?? (() => {})}
          exportMode={exportMode ?? "prompt_only"}
          onExportModeChange={onExportModeChange ?? (() => {})}
          generationSource={(generationSource ?? "api") as any}
          onGenerationSourceChange={onGenerationSourceChange ?? (() => {})}
          canUseByo={canUseByo ?? false}
          byoCredentials={byoCredentials}
          comfyStatus={comfyStatus}
          drawStatus={drawStatus}
          onGenerateSettingsChange={onGenerateSettingsChange}
        />
      );
    default: return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export function ProWorkspaceShell(props: Props) {
  const {
    lang, project, scene,
    selectedLayerId, onSelectLayer, onUpdateScene,
    editT, setEditT, platformId,
    onCopyPrompt, onExport, onGenerate, generateBusy = false,
    generationSource = "api",
    onGenerationSourceChange,
    byoCredentials = null,
    comfyStatus = { provider: "comfyui" as const, state: "idle" as const },
    drawStatus  = { provider: "drawthings" as const, state: "idle" as const },
    onGenerateSettingsChange,
    section: externalSection, onSectionChange,
    currentAsset, assetList = [], activeAssetId,
    onSetActiveAsset, onDownloadAsset, onDeleteAsset, onRegenerateAsset,
    exportPanelSlot,
  } = props;

  const [internalSection, setInternalSection] = useState<ProWorkspaceSection>("shot");
  const [queueStatusText, setQueueStatusText] = useState("");
  const [generateSettings, setGenerateSettings] = useState<GenerateSettings>({
    executionMode: "api",
    exportProfile: "universal",
    count: 1,
    resultMode: "new",
    referenceMode: "auto",
    canGenerate: true,
    generateLabel: lang === "zh" ? "使用我的API生成" : "BYO API Generate",
    statusHint: lang === "zh" ? "使用当前 API 生成设置" : "Use the current API generation settings",
  });
  const section = externalSection ?? internalSection;
  const normalizedSection: ProWorkspaceSection = section === "export" || section === "platform" ? "generate_settings" : section;

  const tl = (zh: string, en: string) => lang === "zh" ? zh : en;

  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const conflicts = detectSceneConflicts(scene, lang);

  const promptChars = useMemo(() => {
    if (!project) return 0;
    try {
      const preset = getPlatformPreset(platformId as any);
      const r = buildPromptForScene({ project, scene, lang, platformId: platformId as any, profile: preset?.baseProfile, workspace: "pro" });
      return r.finalCopyPrompt?.trim().length ?? 0;
    } catch { return 0; }
  }, [project, scene, lang, platformId]);

  useEffect(() => {
    const onFocusObjectEditor = (event: Event) => {
      const custom = event as CustomEvent<{ layerId?: string }>;
      const layerId = String(custom.detail?.layerId || "").trim();
      if (!layerId) return;
      if (normalizedSection === "composition") return;
      if (!scene.layers?.some((layer) => layer.id === layerId)) return;
      onSelectLayer?.(layerId);
      onSectionChange?.("objects");
      if (!onSectionChange) setInternalSection("objects");
    };
    window.addEventListener(FOCUS_OBJECT_EDITOR_EVENT, onFocusObjectEditor as EventListener);
    return () => window.removeEventListener(FOCUS_OBJECT_EDITOR_EVENT, onFocusObjectEditor as EventListener);
  }, [normalizedSection, scene.layers, onSelectLayer, onSectionChange]);

  useEffect(() => {
    const onQueueStatus = (event: Event) => {
      const custom = event as CustomEvent<{ phase?: string; queuePosition?: number; queuedAhead?: number }>;
      const phase = String(custom.detail?.phase || "").toLowerCase();
      const ahead = Number(custom.detail?.queuedAhead ?? -1);
      if (phase === "queued") {
        const line = ahead >= 0
          ? tl(`排队中（前方 ${ahead} 人）`, `Queued (${ahead} ahead)`)
          : tl("排队中", "Queued");
        setQueueStatusText(line);
        return;
      }
      if (phase === "running") {
        setQueueStatusText(tl("生成中", "Running"));
        return;
      }
      if (phase === "done") {
        setQueueStatusText(tl("已完成", "Done"));
        window.setTimeout(() => setQueueStatusText(""), 2000);
        return;
      }
      if (phase === "failed") {
        setQueueStatusText(tl("生成失败", "Failed"));
        return;
      }
    };
    window.addEventListener("spx:gen-queue-status", onQueueStatus as EventListener);
    return () => window.removeEventListener("spx:gen-queue-status", onQueueStatus as EventListener);
  }, [lang]);

  useEffect(() => {
    if (generateSettings.executionMode === "copy" || generateSettings.executionMode === "package") {
      setQueueStatusText("");
    }
  }, [generateSettings.executionMode]);

  const primaryAction = () => {
    if (generateSettings.executionMode === "copy") {
      onCopyPrompt?.();
      return;
    }
    if (generateSettings.executionMode === "package") {
      onExport?.();
      return;
    }
    onGenerate?.();
  };

  return (
    <div style={{
      flex: 1, minWidth: 0, minHeight: 0, height: "100%",
      display: "flex", flexDirection: "row",
      background: BG, overflow: "hidden",
    }}>

      {/* ── Centre column ─────────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 0, minHeight: 0,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Canvas zone — tab bar ALWAYS on top, like Figma */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
          background: BG,
        }}>

          {/* ── Browser-style tab bar — always visible ─────────── */}
          {/* Figma spec: bg=#24262b, active tab bg=#1f2125 + amber text,
              inactive bg=#1a1c1f + border-t+border-x, seamless bottom connector */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            padding: "0 8px",
            background: PANEL,
            borderBottom: `1px solid ${BORDER}`,
            flexShrink: 0,
            height: 38,
            gap: 2,
            overflowX: "auto", overflowY: "hidden",
            scrollbarWidth: "none",
          }}>
            {/* Canvas tab — always present */}
            <CanvasTab
              isActive={!activeAssetId || activeAssetId === "canvas"}
              onClick={() => onSetActiveAsset?.("canvas")}
              label={tl("画布", "Canvas")}
              icon={<LayoutGrid size={12} />}
            />

            {/* Result tabs — one per generated asset */}
            {assetList.map((asset, i) => (
              <CanvasTab
                key={asset.id}
                isActive={activeAssetId === asset.id}
                onClick={() => onSetActiveAsset?.(asset.id)}
                label={asset.title || (asset.kind === "video"
                  ? tl(`视频 ${i + 1}`, `Video ${i + 1}`)
                  : tl(`图片 ${i + 1}`, `Image ${i + 1}`))}
                icon={asset.kind === "video"
                  ? <Play size={11} style={{ fill: "currentColor" }} />
                  : <ImageIcon size={11} />}
                badge={i + 1}
              />
            ))}
          </div>

          {/* ── Canvas content area ─────────────────────────────── */}
          <div style={{
            flex: 1, minHeight: 0,
            display: "flex", flexDirection: "column",
            position: "relative", overflow: "hidden",
            background: BG,
            backgroundImage: [
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "40px 40px",
          }}>
            {currentAsset ? (
              // ── Result view
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {/* Result toolbar */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 12px", background: PANEL, borderBottom: `1px solid ${BORDER}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: TEXT }}>{currentAsset.title}</span>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 3,
                      border: `1px solid ${BORDER}`, color: MUTED,
                    }}>
                      {currentAsset.kind === "video" ? tl("视频", "Video") : tl("图片", "Image")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {onDownloadAsset && <IconBtn onClick={onDownloadAsset}><Download size={13} /></IconBtn>}
                    {onRegenerateAsset && <IconBtn onClick={onRegenerateAsset}><Sparkles size={13} /></IconBtn>}
                    {onDeleteAsset && <IconBtn onClick={onDeleteAsset} danger>×</IconBtn>}
                  </div>
                </div>
                <div style={{
                  flex: 1, minHeight: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
                }}>
                  {currentAsset.kind === "video" && currentAsset.videoUrl
                    ? <video key={currentAsset.id} src={currentAsset.videoUrl} poster={currentAsset.posterUrl}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        controls playsInline />
                    : currentAsset.imageUrl
                      ? <img src={currentAsset.imageUrl} alt={currentAsset.title}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      : <div style={{ color: MUTED, fontSize: 12 }}>{tl("结果暂不可预览", "Preview unavailable")}</div>
                  }
                </div>
              </div>
            ) : (
              // ── Stage canvas
              <Stage
                project={project}
                lang={lang}
                scene={scene}
                selectedLayerId={selectedLayerId}
                onSelectLayer={(id) => { onSelectLayer?.(id); if (!id) setEditT(0); }}
                onUpdateScene={onUpdateScene}
                editT={editT}
                suppressObjectEditorFocus={normalizedSection === "composition"}
                className="spx-pro-stage"
              />
            )}

            {/* Viewport info overlay — removed decorative label */}
          </div>
        </div>

        {/* Conflict strip */}
        {conflicts.length > 0 && (
          <div style={{
            flexShrink: 0, padding: "5px 14px",
            background: "rgba(220,60,60,0.09)",
            borderTop: "1px solid rgba(220,60,60,0.22)",
            fontSize: 11, color: "#e07070",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle size={12} />
            {conflicts[0].title}
            {conflicts.length > 1 && <span style={{ opacity: 0.7 }}>+{conflicts.length - 1}</span>}
          </div>
        )}

        {/* Bottom action bar — figma "Prompt Editor" panel style */}
        <div style={{
          height: BAR_H, minHeight: BAR_H, flexShrink: 0,
          borderTop: `1px solid ${BORDER}`,
          background: PANEL,
          display: "flex", alignItems: "center",
          padding: "0 14px", gap: 8,
        }}>
          {/* Status chips — figma chip pattern */}
          <StatusChip>
            {mediaMode === "image" ? tl("图片", "Image") : tl("视频", "Video")}
          </StatusChip>
          <StatusChip accent={promptChars > 800}>
            {promptChars} {tl("字符", "chars")}
          </StatusChip>
          {conflicts.length > 0 && (
            <StatusChip danger>
              ⚠ {conflicts.length} {tl("冲突", "conflict")}
            </StatusChip>
          )}

          <div style={{ flex: 1 }} />

          <button type="button" onClick={onCopyPrompt} style={ghostBtnStyle}>
            <Copy size={12} />
            {tl("复制提示词", "Copy Prompt")}
          </button>

          {onExport ? (
            <button type="button" onClick={onExport} style={ghostBtnStyle}>
              <Download size={12} />
              {tl("导出项目包", "Export Package")}
            </button>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <button
              type="button"
              disabled={generateBusy || !generateSettings.canGenerate}
              onClick={primaryAction}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 4,
                border: "none",
                background: generateBusy || !generateSettings.canGenerate ? "#8a6000" : ACCENT,
                color: "#111",
                fontSize: 12,
                fontWeight: 700,
                cursor: generateBusy || !generateSettings.canGenerate ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: generateBusy || !generateSettings.canGenerate ? 0.75 : 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!generateBusy && generateSettings.canGenerate) e.currentTarget.style.background = "#d97706"; }}
              onMouseLeave={(e) => { if (!generateBusy && generateSettings.canGenerate) e.currentTarget.style.background = ACCENT; }}
            >
              <Sparkles size={13} />
              {generateBusy ? tl("生成中…", "Generating…") : generateSettings.generateLabel}
            </button>
            {queueStatusText ? (
              <div style={{ fontSize: 11, color: MUTED }}>{queueStatusText}</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Right column: props panel ─────────────────────────── */}
      <div style={{
        width: RIGHT_W, minWidth: RIGHT_W, maxWidth: RIGHT_W,
        borderLeft: `1px solid ${BORDER}`,
        background: PANEL,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Right panel section header */}
        <div style={{
          height: 38, flexShrink: 0,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center",
          padding: "0 14px",
        }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: TEXT,
          }}>
            {tl("属性", "Properties")}
          </span>
        </div>
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
          scrollbarWidth: "thin", scrollbarColor: `${BORDER} transparent`,
        }}>
          <RightPanelContent
            {...props}
            section={normalizedSection}
            onGenerateSettingsChange={(settings) => {
              setGenerateSettings(settings);
              onGenerateSettingsChange?.(settings);
            }}
          />
        </div>
      </div>

      {exportPanelSlot}
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────

// ── CanvasTab — Figma browser-tab style ──────────────────────────────────
// Spec from figma/app.tsx:
//   active:   bg=#1f2125  border-t+border-x=#3a3f46  text=amber  + bottom 1px cover
//   inactive: bg=#1a1c1f  border=transparent          text=muted  hover bg=#2d3036
function CanvasTab({ isActive, onClick, label, icon, badge }: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 14px",
        // active: bg matches canvas (#1f2125), inactive: slightly darker
        background: isActive ? BG : hov ? "#2d3036" : "#1a1c1f",
        // active: show top+side borders, inactive: transparent
        border: isActive
          ? `1px solid ${BORDER}`
          : "1px solid transparent",
        borderBottom: isActive ? `1px solid ${BG}` : `1px solid ${BORDER}`,
        borderRadius: "4px 4px 0 0",
        color: isActive ? ACCENT : hov ? TEXT : MUTED,
        fontSize: 12, fontWeight: isActive ? 500 : 400,
        cursor: "pointer", whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background 120ms, color 120ms",
        // z-index so active tab covers the border-bottom line
        zIndex: isActive ? 2 : 1,
        // Seamless connector: 1px cover strip at the very bottom
        ...(isActive && {
          marginBottom: -1,
          paddingBottom: 7,
        }),
      }}
    >
      <span style={{ color: isActive ? ACCENT : MUTED, flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{label}</span>
      {badge && !isActive && (
        <span style={{
          fontSize: 9, fontWeight: 700,
          background: MUTED + "30", color: MUTED,
          padding: "1px 4px", borderRadius: 3,
          flexShrink: 0,
        }}>{badge}</span>
      )}
    </button>
  );
}

function TabButton({ isActive, onClick, icon, label, bg, panel, border, accent, muted, text }: {
  isActive: boolean; onClick: () => void; icon: string; label: string;
  bg: string; panel: string; border: string; accent: string; muted: string; text: string;
}) {
  return (
    <CanvasTab isActive={isActive} onClick={onClick} label={label} icon={<span>{icon}</span>} />
  );
}

function IconBtn({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 4, border: `1px solid ${BORDER}`, background: "transparent",
      color: danger ? "#ff8c8c" : MUTED, cursor: "pointer",
      transition: "background 0.12s, color 0.12s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = BORDER; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function StatusChip({ children, accent, danger }: { children: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, padding: "2px 8px", borderRadius: 4,
      border: `1px solid ${danger ? "rgba(220,60,60,0.35)" : BORDER}`,
      color: danger ? "#e07070" : accent ? ACCENT : MUTED,
      background: danger ? "rgba(220,60,60,0.07)" : "rgba(255,255,255,0.03)",
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────
const ghostBtnStyle: React.CSSProperties = {
  height: 34, padding: "0 12px", borderRadius: 4,
  border: `1px solid ${BORDER}`, background: "transparent",
  color: TEXT, fontSize: 11, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 5,
  whiteSpace: "nowrap", flexShrink: 0,
  transition: "background 0.12s, color 0.12s, border-color 0.12s",
};
