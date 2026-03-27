import React, { useEffect, useMemo, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { resolveSceneConfig } from "../../../model";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { FIGMA_COLORS } from "../constants";
import type { ApiCredentialState } from "../../../types/account";
import type { LocalProviderStatus } from "../../../utils/localGeneration";

export type ExportMode = "prompt_only" | "package";
export type GenerationSource = "hosted" | "byo" | "local_comfy" | "local_draw";

export type GenerateSettings = {
  executionMode: "hosted" | "api" | "comfyui" | "drawthings";
  engine?: "fal" | "runway";
  exportProfile: "universal" | "reference" | "camera" | "fast" | "commercial" | "api_local";
  quality: "standard" | "high" | "ultra";
  count: number;
  resultMode: "new" | "overwrite";
  referenceMode?: "auto" | "prefer" | "ignore";
  creditsRequired?: number;
  canGenerate: boolean;
  generateLabel: string;
  statusHint: string;
};

type ExecutionMode = GenerateSettings["executionMode"];
type ExportProfile = GenerateSettings["exportProfile"];
type Quality = GenerateSettings["quality"];
type ResultMode = GenerateSettings["resultMode"];
type ReferenceMode = NonNullable<GenerateSettings["referenceMode"]>;

const C = FIGMA_COLORS;
const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);
const BASE_COST = {
  image: {
    standard: 6,
    high: 12,
    ultra: 20,
  },
  video: {
    standard: 30,
    high: 60,
  },
} as const;

function sectionTitle(text: string) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: C.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );
}

function divider() {
  return <div style={{ height: 1, background: C.border, margin: "0 -14px" }} />;
}

function optionRow(params: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const { selected, disabled, title, desc, onClick } = params;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 8,
        border: `1px solid ${selected ? C.accent : C.border}`,
        background: selected ? `${C.accent}14` : C.panel,
        color: selected ? C.accent : C.text,
        padding: "9px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span
        aria-hidden
        style={{
          marginTop: 1,
          width: 12,
          height: 12,
          borderRadius: "50%",
          border: `1px solid ${selected ? C.accent : C.textMuted}`,
          background: selected ? C.accent : "transparent",
          flexShrink: 0,
        }}
      />
      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: selected ? 700 : 600, color: selected ? C.accent : C.text }}>{title}</span>
        <span style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.35 }}>{desc}</span>
      </span>
    </button>
  );
}

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
  onCopy?: () => void;
  onExport?: () => void;
  onGenerate?: () => void;
  generateBusy?: boolean;
  onGenerateSettingsChange?: (settings: GenerateSettings) => void;
};

export function ExportControlPanel({
  lang,
  project,
  scene,
  platformId: _platformId,
  onPlatformChange,
  exportMode,
  onExportModeChange,
  generationSource,
  onGenerationSourceChange,
  canUseByo,
  byoCredentials = null,
  comfyStatus = { provider: "comfyui", state: "idle" },
  drawStatus = { provider: "drawthings", state: "idle" },
  creditCost = 3,
  userCredits = 0,
  onCopy,
  onExport,
  onGenerate,
  generateBusy = false,
  onGenerateSettingsChange,
}: Props) {
  void _platformId;
  void exportMode;
  void onExportModeChange;
  void onCopy;
  void onExport;
  void onGenerate;
  void generateBusy;

  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const falConnected = Boolean(canUseByo && byoCredentials?.fal?.enabled);
  const comfyReady = comfyStatus.state === "ready";
  const drawReady = drawStatus.state === "ready";

  const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => {
    if (generationSource === "local_comfy") return "comfyui";
    if (generationSource === "local_draw") return "drawthings";
    if (generationSource === "byo") return "api";
    return "hosted";
  });
  const [engine, setEngine] = useState<"fal" | "runway">("fal");
  const [exportProfile] = useState<ExportProfile>("universal");
  const [quality, setQuality] = useState<Quality>("standard");
  const [count, setCount] = useState(1);
  const [resultMode, setResultMode] = useState<ResultMode>("new");
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>("auto");

  useEffect(() => {
    if (executionMode === "hosted") onGenerationSourceChange("hosted");
    if (executionMode === "api") onGenerationSourceChange("byo");
    if (executionMode === "comfyui") onGenerationSourceChange("local_comfy");
    if (executionMode === "drawthings") onGenerationSourceChange("local_draw");
  }, [executionMode, onGenerationSourceChange]);

  function mapExportProfileToPlatform(id: ExportProfile): PlatformPresetId {
    if (id === "reference") return "keling";
    if (id === "camera") return "runway";
    if (id === "fast") return "hailuo";
    if (id === "commercial") return "fal";
    if (id === "api_local") return "fal";
    return "universal";
  }

  useEffect(() => {
    onPlatformChange(mapExportProfileToPlatform(exportProfile));
  }, [exportProfile, onPlatformChange]);

  const previewPrompt = useMemo(() => {
    if (!project) return "";
    try {
      return (
        buildPromptForScene({
          project,
          scene,
          lang,
          platformId: mapExportProfileToPlatform(exportProfile),
          profile: undefined,
          workspace: "pro",
        }).finalCopyPrompt?.trim() ?? ""
      );
    } catch {
      return "";
    }
  }, [project, scene, lang, exportProfile]);

  const effectiveQuality: Quality = mediaMode === "video" && quality === "ultra" ? "high" : quality;
  const perUnitBase =
    mediaMode === "video"
      ? BASE_COST.video[effectiveQuality as "standard" | "high"]
      : BASE_COST.image[effectiveQuality];
  const referenceEnabled = referenceMode === "prefer";
  const creditsRequired = perUnitBase * Math.max(1, count) + (referenceEnabled ? 2 : 0);

  const settings = useMemo<GenerateSettings>(() => {
    if (executionMode === "hosted") {
      const canGenerate = true;
      const label =
        engine === "runway" ? tl(lang, "使用 Runway 生成", "Generate with Runway") : tl(lang, "使用 Fal 生成", "Generate with Fal");
      return {
        executionMode,
        engine,
        exportProfile,
        quality: effectiveQuality,
        count,
        resultMode,
        referenceMode,
        creditsRequired,
        canGenerate,
        generateLabel: label,
        statusHint: tl(lang, "点击后若余额不足会弹出充值", "If balance is insufficient, recharge prompt appears on click"),
      };
    }

    if (executionMode === "api") {
      const canGenerate = falConnected;
      return {
        executionMode,
        exportProfile,
        quality: effectiveQuality,
        count,
        resultMode,
        referenceMode,
        canGenerate,
        generateLabel: tl(lang, "使用我的 API 生成", "Generate with My API"),
        statusHint: canGenerate ? tl(lang, "使用当前接入执行生成", "Uses current integration") : tl(lang, "未配置 API 或本地连接", "API or local connection is missing"),
      };
    }

    if (executionMode === "comfyui") {
      const canGenerate = comfyReady;
      return {
        executionMode,
        exportProfile,
        quality: effectiveQuality,
        count,
        resultMode,
        referenceMode,
        canGenerate,
        generateLabel: tl(lang, "使用 ComfyUI 生成", "Generate with ComfyUI"),
        statusHint: canGenerate ? tl(lang, "使用当前接入执行生成", "Uses current integration") : tl(lang, "未配置 API 或本地连接", "API or local connection is missing"),
      };
    }

    const canGenerate = drawReady && mediaMode === "image";
    return {
      executionMode,
      exportProfile,
      quality: effectiveQuality,
      count,
      resultMode,
      referenceMode,
      canGenerate,
      generateLabel: tl(lang, "使用 Draw Things 生成", "Generate with Draw Things"),
      statusHint: canGenerate ? tl(lang, "使用当前接入执行生成", "Uses current integration") : tl(lang, "未配置 API 或本地连接", "API or local connection is missing"),
    };
  }, [executionMode, engine, exportProfile, effectiveQuality, count, resultMode, referenceMode, userCredits, creditsRequired, falConnected, comfyReady, drawReady, mediaMode, lang]);

  useEffect(() => {
    onGenerateSettingsChange?.(settings);
  }, [settings, onGenerateSettingsChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>{tl(lang, "生成设置", "Generate Settings")}</div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          {tl(
            lang,
            "选择生成来源与目标平台，然后点击底部生成。也可以复制提示词或者导出项目包到你喜欢的平台生成，完全免费。",
            "Choose source and target platform, then click Generate. You can also copy prompt or export package for free and generate on any platform."
          )}
        </div>
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px", display: "grid", gap: 8 }}>
        {sectionTitle(tl(lang, "执行方式", "Execution Mode"))}
        {optionRow({ selected: executionMode === "hosted", title: tl(lang, "官方生成", "Hosted"), desc: tl(lang, "平台托管执行", "Platform-hosted execution"), onClick: () => setExecutionMode("hosted") })}
        {optionRow({ selected: executionMode === "api", title: tl(lang, "我的 API", "My API"), desc: tl(lang, "使用自有接口", "Use your own endpoint"), onClick: () => setExecutionMode("api") })}
        {optionRow({ selected: executionMode === "comfyui", title: "ComfyUI", desc: tl(lang, "本地节点工作流", "Local node workflow"), onClick: () => setExecutionMode("comfyui") })}
        {optionRow({ selected: executionMode === "drawthings", title: "Draw Things", desc: tl(lang, "本地轻量生成", "Local lightweight generation"), onClick: () => setExecutionMode("drawthings") })}
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px", display: "grid", gap: 8 }}>
        {sectionTitle(tl(lang, "官方生成引擎", "Hosted Engine"))}
        {executionMode === "hosted" ? (
          <>
            {optionRow({ selected: engine === "fal", title: "Fal", desc: tl(lang, "官方托管执行", "Official hosted execution"), onClick: () => setEngine("fal") })}
            {optionRow({ selected: engine === "runway", title: "Runway", desc: tl(lang, "官方托管执行", "Official hosted execution"), onClick: () => setEngine("runway") })}
          </>
        ) : (
          <div style={{ fontSize: 11, color: C.textMuted }}>{tl(lang, "当前执行方式不使用官方引擎", "Current mode does not use hosted engine")}</div>
        )}
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px" }}>
        {sectionTitle(tl(lang, "当前执行摘要", "Execution Summary"))}
        <div style={{ display: "grid", gridTemplateColumns: "94px 1fr", rowGap: 6, columnGap: 8, fontSize: 11 }}>
          <div style={{ color: C.textMuted }}>{tl(lang, "执行方式", "Mode")}</div>
          <div style={{ color: C.text }}>
            {executionMode === "hosted" ? tl(lang, "官方生成", "Hosted") : executionMode === "api" ? tl(lang, "我的 API", "My API") : executionMode === "comfyui" ? "ComfyUI" : "Draw Things"}
          </div>
          <div style={{ color: C.textMuted }}>{tl(lang, "引擎", "Engine")}</div>
          <div style={{ color: C.text }}>{executionMode === "hosted" ? (engine === "runway" ? "Runway" : "Fal") : "-"}</div>
          <div style={{ color: C.textMuted }}>{tl(lang, "导出适配", "Export Adapter")}</div>
          <div style={{ color: C.text }}>{tl(lang, "在导出项目包时选择", "Choose in export package dialog")}</div>
          <div style={{ color: C.textMuted }}>{tl(lang, "参考图", "Reference")}</div>
          <div style={{ color: C.text }}>{referenceMode === "prefer" ? tl(lang, "优先参考图", "Prefer reference") : referenceMode === "ignore" ? tl(lang, "忽略参考图", "Ignore reference") : tl(lang, "自动", "Auto")}</div>
        </div>
      </div>

      {divider()}

      <details style={{ padding: "12px 14px 14px" }}>
        <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.text }}>
          {tl(lang, "生成选项", "Generation Options")}
        </summary>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>{tl(lang, "质量", "Quality")}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {optionRow({ selected: effectiveQuality === "standard", title: tl(lang, "标准", "Standard"), desc: tl(lang, "默认质量", "Default quality"), onClick: () => setQuality("standard") })}
            {optionRow({ selected: effectiveQuality === "high", title: tl(lang, "高质量", "High"), desc: tl(lang, "更高质量输出", "Higher quality output"), onClick: () => setQuality("high") })}
            {mediaMode === "image"
              ? optionRow({ selected: effectiveQuality === "ultra", title: tl(lang, "极致", "Ultra"), desc: tl(lang, "最高质量输出", "Maximum quality output"), onClick: () => setQuality("ultra") })
              : null}
          </div>

          <div style={{ fontSize: 11, color: C.textMuted }}>{tl(lang, "生成数量", "Count")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(mediaMode === "image" ? [1, 2, 4] : [1, 2]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                style={{
                  flex: 1,
                  height: 30,
                  borderRadius: 6,
                  border: `1px solid ${count === n ? C.accent : C.border}`,
                  background: count === n ? `${C.accent}14` : C.panel,
                  color: count === n ? C.accent : C.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: C.textMuted }}>{tl(lang, "结果方式", "Result Mode")}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {optionRow({ selected: resultMode === "new", title: tl(lang, "新建结果版本", "New result version"), desc: tl(lang, "保留当前结果", "Keep current results"), onClick: () => setResultMode("new") })}
            {optionRow({ selected: resultMode === "overwrite", title: tl(lang, "覆盖当前结果", "Overwrite current"), desc: tl(lang, "替换当前结果", "Replace current result"), onClick: () => setResultMode("overwrite") })}
          </div>

          <div style={{ fontSize: 11, color: C.textMuted }}>{tl(lang, "参考图处理", "Reference Mode")}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {optionRow({ selected: referenceMode === "auto", title: tl(lang, "自动", "Auto"), desc: tl(lang, "自动匹配平台能力", "Auto by platform capability"), onClick: () => setReferenceMode("auto") })}
            {optionRow({ selected: referenceMode === "prefer", title: tl(lang, "优先参考图", "Prefer reference"), desc: tl(lang, "尽量保持参考一致（+2 Credits）", "Prioritize reference consistency (+2 Credits)"), onClick: () => setReferenceMode("prefer") })}
            {optionRow({ selected: referenceMode === "ignore", title: tl(lang, "忽略参考图", "Ignore reference"), desc: tl(lang, "仅按文本生成", "Generate from text only"), onClick: () => setReferenceMode("ignore") })}
          </div>

          {!settings.canGenerate && <div style={{ fontSize: 11, color: "#f87171" }}>{settings.statusHint}</div>}
        </div>
      </details>

      {divider()}

      <details style={{ padding: "12px 14px 14px" }}>
        <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.text }}>
          {tl(lang, "Prompt 预览", "Prompt Preview")}
        </summary>
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            color: C.textMuted,
            lineHeight: 1.6,
            maxHeight: 140,
            overflowY: "auto",
            padding: "8px 10px",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontFamily: "monospace",
          }}
        >
          {previewPrompt || tl(lang, "填写场景后这里会显示最终 prompt", "Prompt will appear here after scene input")}
        </div>
      </details>
    </div>
  );
}
