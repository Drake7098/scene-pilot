/**
 * ExportControlPanel — Step 10 · 输出
 *
 * 职责（精简版）：
 *   1. 目标平台  — 12个平台分4组的下拉，提示词适配目标
 *   2. 生成方式  — 平台Credits / 我的API / 本地，取代旧 EngineSelectSection
 *   3. 导出模式  — 仅提示词 / 完整项目包
 *   4. 提示词预览 — 只读，当前平台编译结果
 *
 * 已删除的重复项：
 *   ✗ ExportGenerateSection  — 生成按钮底部工具栏已有
 *   ✗ ExportCopySection      — 复制提示词底部工具栏已有
 *   ✗ ExportActionSection    — 导出/复制底部工具栏已有
 *   ✗ ExportOverviewSection  — 纯只读摘要，信息密度低，去掉
 */

import React, { useMemo, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { PLATFORM_PRESETS, getPlatformPreset } from "../../../config/platformPresets";
import { resolveSceneConfig } from "../../../model";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { FIGMA_COLORS } from "../constants";
import { Cloud, Zap, Cpu, ChevronDown, Check } from "lucide-react";
import type { ApiCredentialState } from "../../../types/account";
import type { LocalProviderStatus } from "../../../utils/localGeneration";

export type ExportMode = "prompt_only" | "package";
export type GenerationSource = "hosted" | "byo" | "local_comfy" | "local_draw";

const C = FIGMA_COLORS;
const tl = (lang: Lang, zh: string, en: string) => lang === "zh" ? zh : en;

// ── Platform groups ────────────────────────────────────────────────────────

const PLATFORM_GROUPS: Array<{
  labelZh: string; labelEn: string; ids: PlatformPresetId[];
}> = [
  { labelZh: "通用",           labelEn: "General",       ids: ["universal"] },
  { labelZh: "图像生成",       labelEn: "Image Gen",     ids: ["fal", "midjourney", "krea"] },
  { labelZh: "视频生成（国际）", labelEn: "Video · Global", ids: ["runway", "pika", "luma"] },
  { labelZh: "视频生成（国内）", labelEn: "Video · China",  ids: ["jimeng", "keling", "vidu", "hailuo", "wanx"] },
];

// ── Platform selector (grouped dropdown) ──────────────────────────────────

function PlatformSelector({ lang, value, onChange }: {
  lang: Lang; value: PlatformPresetId; onChange: (id: PlatformPresetId) => void;
}) {
  const current = getPlatformPreset(value);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8,
          padding: "8px 10px", borderRadius: 6,
          border: `1px solid ${open ? C.accent : C.border}`,
          background: C.bg, color: C.text,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "border-color 0.1s",
        }}
      >
        <span>{lang === "zh" ? current.labelZh : current.labelEn}</span>
        <ChevronDown size={13} style={{
          color: C.textMuted,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.15s",
        }} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            zIndex: 50, background: C.panel,
            border: `1px solid ${C.border}`, borderRadius: 8,
            overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
            maxHeight: 340, overflowY: "auto",
          }}>
            {PLATFORM_GROUPS.map((group, gi) => {
              const presets = group.ids
                .map(id => PLATFORM_PRESETS.find(p => p.id === id))
                .filter(Boolean) as typeof PLATFORM_PRESETS;
              if (!presets.length) return null;
              return (
                <div key={group.labelEn}>
                  {/* Group header */}
                  <div style={{
                    padding: "6px 10px 3px",
                    fontSize: 10, fontWeight: 700, color: C.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    borderTop: gi > 0 ? `1px solid ${C.border}` : "none",
                  }}>
                    {lang === "zh" ? group.labelZh : group.labelEn}
                  </div>
                  {/* Platform items */}
                  {presets.map(p => (
                    <button
                      key={p.id} type="button"
                      onClick={() => { onChange(p.id); setOpen(false); }}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 10px",
                        background: p.id === value ? `${C.accent}12` : "transparent",
                        color: p.id === value ? C.accent : C.text,
                        fontSize: 12, cursor: "pointer", border: "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => {
                        if (p.id !== value)
                          (e.currentTarget as HTMLButtonElement).style.background = C.hover;
                      }}
                      onMouseLeave={e => {
                        if (p.id !== value)
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <span style={{ fontWeight: p.id === value ? 600 : 400 }}>
                        {lang === "zh" ? p.labelZh : p.labelEn}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!p.nativeStrategy && (
                          <span style={{ fontSize: 9, color: C.textMuted }}>
                            {tl(lang, "适配", "adapted")}
                          </span>
                        )}
                        {p.id === value && <Check size={12} style={{ color: C.accent }} />}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Generation source selector ─────────────────────────────────────────────

function GenSourceSelector({ lang, source, onChange, canUseByo, byoCredentials,
  comfyReady, drawReady, mediaMode, creditCost, userCredits }: {
  lang: Lang;
  source: GenerationSource;
  onChange: (s: GenerationSource) => void;
  canUseByo: boolean;
  byoCredentials: ApiCredentialState | null;
  comfyReady: boolean;
  drawReady: boolean;
  mediaMode: "image" | "video";
  creditCost: number;
  userCredits: number;
}) {
  const byoAvail = canUseByo && byoCredentials != null &&
    (byoCredentials.fal?.enabled || byoCredentials.runway?.enabled);
  const credLow = userCredits < creditCost;

  type Opt = { id: GenerationSource; icon: React.ReactNode; label: string; sub: string; };
  const opts: Opt[] = [
    {
      id: "hosted",
      icon: <Cloud size={12} />,
      label: tl(lang, "平台生成", "Platform"),
      sub: credLow
        ? tl(lang, `积分不足 (${userCredits})`, `Low credits (${userCredits})`)
        : `${creditCost} Credits`,
    },
  ];

  if (byoAvail) {
    const name = byoCredentials!.defaultProvider === "runway" ? "Runway" : "fal";
    opts.push({
      id: "byo",
      icon: <Zap size={12} />,
      label: tl(lang, "我的 API", "My API"),
      sub: name,
    });
  }

  if (comfyReady) {
    opts.push({
      id: "local_comfy",
      icon: <Cpu size={12} />,
      label: tl(lang, "本地 ComfyUI", "ComfyUI"),
      sub: tl(lang, "免费", "Free"),
    });
  }

  if (drawReady && mediaMode === "image") {
    opts.push({
      id: "local_draw",
      icon: <Cpu size={12} />,
      label: tl(lang, "Draw Things", "Draw Things"),
      sub: tl(lang, "免费", "Free"),
    });
  }

  // Only one option — show plain text, no button group
  if (opts.length === 1) {
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 0", fontSize: 12,
      }}>
        <span style={{ color: C.textMuted }}>{tl(lang, "平台 Credits", "Platform Credits")}</span>
        <span style={{ color: credLow ? "#f87171" : C.text }}>
          {creditCost} Credits
          {credLow ? ` · ${tl(lang, "不足", "low")}` : ""}
        </span>
      </div>
    );
  }

  const validIds = opts.map(o => o.id);
  const active = validIds.includes(source) ? source : "hosted";

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {opts.map(opt => {
        const isActive = active === opt.id;
        const isLow = isActive && opt.id === "hosted" && credLow;
        return (
          <button
            key={opt.id} type="button"
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "8px 6px", borderRadius: 6,
              border: `1px solid ${isActive ? C.accent : C.border}`,
              background: isActive ? `${C.accent}10` : "transparent",
              color: isActive ? C.accent : C.muted,
              cursor: "pointer", transition: "all 0.1s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: isActive ? 600 : 400 }}>
              {opt.icon}{opt.label}
            </span>
            <span style={{ fontSize: 9, opacity: 0.75, color: isLow ? "#f87171" : "inherit" }}>
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Export mode selector ───────────────────────────────────────────────────

function ExportModeSelector({ lang, value, onChange }: {
  lang: Lang; value: ExportMode; onChange: (v: ExportMode) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {(["prompt_only", "package"] as ExportMode[]).map(mode => (
        <button
          key={mode} type="button" onClick={() => onChange(mode)}
          style={{
            flex: 1, padding: "7px 8px", borderRadius: 6,
            border: `1px solid ${value === mode ? C.accent : C.border}`,
            background: value === mode ? `${C.accent}10` : "transparent",
            color: value === mode ? C.accent : C.textMuted,
            fontSize: 11, fontWeight: value === mode ? 600 : 400,
            cursor: "pointer", transition: "all 0.1s",
          }}
        >
          {mode === "prompt_only"
            ? tl(lang, "仅提示词", "Prompt only")
            : tl(lang, "完整项目包", "Package")}
        </button>
      ))}
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.textMuted,
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: FIGMA_COLORS.border, margin: "0 -14px" }} />;
}

// ── Main ───────────────────────────────────────────────────────────────────

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  platformId: PlatformPresetId;
  onPlatformChange: (id: PlatformPresetId) => void;
  exportMode: ExportMode;
  onExportModeChange: (v: ExportMode) => void;
  generationSource: GenerationSource;
  onGenerationSourceChange: (v: GenerationSource) => void;
  canUseByo: boolean;
  byoCredentials?: ApiCredentialState | null;
  comfyStatus?: LocalProviderStatus;
  drawStatus?: LocalProviderStatus;
  creditCost?: number;
  userCredits?: number;
  // Legacy props — kept for backward compat, not rendered here
  onCopy?: () => void;
  onExport?: () => void;
  onGenerate?: () => void;
  generateBusy?: boolean;
};

export function ExportControlPanel({
  lang, project, scene,
  platformId, onPlatformChange,
  exportMode, onExportModeChange,
  generationSource, onGenerationSourceChange,
  canUseByo,
  byoCredentials = null,
  comfyStatus  = { provider: "comfyui",    state: "idle" },
  drawStatus   = { provider: "drawthings", state: "idle" },
  creditCost   = 3,
  userCredits  = 0,
}: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const comfyReady = comfyStatus.state === "ready";
  const drawReady  = drawStatus.state  === "ready";
  const preset = getPlatformPreset(platformId);

  const prompt = useMemo(() => {
    if (!project) return "";
    try {
      const result = buildPromptForScene({
        project, scene, lang, platformId,
        profile: preset?.baseProfile, workspace: "pro",
      });
      return result.finalCopyPrompt?.trim() ?? "";
    } catch { return ""; }
  }, [project, scene, lang, platformId, preset?.baseProfile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Step header */}
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>
          {tl(lang, "步骤 10 · 输出", "Step 10 · Output")}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          {tl(lang, "选择目标平台、生成方式，点底部「生成」执行", "Set target platform and generation source, then tap Generate below")}
        </div>
      </div>

      <Divider />

      {/* ── 1. Target platform ───────────────────────────── */}
      <div style={{ padding: "12px 14px 14px" }}>
        <SectionLabel>{tl(lang, "目标平台", "Target Platform")}</SectionLabel>
        <PlatformSelector lang={lang} value={platformId} onChange={onPlatformChange} />
        {!preset.nativeStrategy && (
          <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted, lineHeight: 1.4 }}>
            {tl(lang,
              `适配自通用格式 → ${preset.labelZh}`,
              `Adapted from universal → ${preset.labelEn}`
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* ── 2. Generation source ─────────────────────────── */}
      <div style={{ padding: "12px 14px 14px" }}>
        <SectionLabel>{tl(lang, "生成方式", "Generation")}</SectionLabel>
        <GenSourceSelector
          lang={lang} source={generationSource} onChange={onGenerationSourceChange}
          canUseByo={canUseByo} byoCredentials={byoCredentials}
          comfyReady={comfyReady} drawReady={drawReady}
          mediaMode={mediaMode} creditCost={creditCost} userCredits={userCredits}
        />
        {/* Hint per source */}
        {generationSource === "byo" && (
          <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted }}>
            {tl(lang, "使用你自己的 API Key，不消耗 Credits", "Uses your API key — no credits deducted")}
          </div>
        )}
        {(generationSource === "local_comfy" || generationSource === "local_draw") && (
          <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted }}>
            {tl(lang, "本地运行，完全免费", "Runs locally — completely free")}
          </div>
        )}
      </div>

      <Divider />

      {/* ── 3. Export mode ───────────────────────────────── */}
      <div style={{ padding: "12px 14px 14px" }}>
        <SectionLabel>{tl(lang, "导出内容", "Export Mode")}</SectionLabel>
        <ExportModeSelector lang={lang} value={exportMode} onChange={onExportModeChange} />
        <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted }}>
          {exportMode === "prompt_only"
            ? tl(lang, "导出提示词 .txt 文件", "Exports prompt as .txt file")
            : tl(lang, "导出提示词 + 参考图 + 项目 .json", "Exports prompt + refs + project .json")}
        </div>
      </div>

      <Divider />

      {/* ── 4. Prompt preview ────────────────────────────── */}
      {prompt ? (
        <div style={{ padding: "12px 14px" }}>
          <SectionLabel>{tl(lang, "提示词预览", "Prompt Preview")}</SectionLabel>
          <div style={{
            fontSize: 10, color: C.textMuted, lineHeight: 1.6,
            maxHeight: 110, overflowY: "auto",
            padding: "8px 10px",
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 5, fontFamily: "monospace",
            scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent`,
          }}>
            {prompt}
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
            {tl(lang, "填写场景内容后提示词将在此预览", "Fill in scene details to preview the prompt")}
          </div>
        </div>
      )}

    </div>
  );
}
