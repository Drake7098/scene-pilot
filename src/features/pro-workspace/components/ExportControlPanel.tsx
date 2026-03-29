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
export type GenerationSource = "api" | "local_comfy" | "local_draw";

export type GenerateSettings = {
  executionMode: "copy" | "package" | "api" | "comfyui" | "drawthings";
  exportProfile: "universal" | "reference" | "text_only" | "video_first" | "image_first";
  count: number;
  resultMode: "new" | "overwrite";
  referenceMode?: "auto" | "prefer" | "ignore";
  canGenerate: boolean;
  generateLabel: string;
  statusHint: string;
};

type ExecutionMode = GenerateSettings["executionMode"];
type ExportProfile = GenerateSettings["exportProfile"];
type ResultMode = GenerateSettings["resultMode"];
type ReferenceMode = NonNullable<GenerateSettings["referenceMode"]>;

const C = FIGMA_COLORS;
const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

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
  const falConnected = Boolean(canUseByo && byoCredentials?.fal?.enabled && byoCredentials?.fal?.apiKey?.trim());
  const comfyReady = comfyStatus.state === "ready";
  const drawReady = drawStatus.state === "ready";

  const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => {
    if (generationSource === "local_comfy") return "comfyui";
    if (generationSource === "local_draw") return "drawthings";
    return "api";
  });
  const [exportProfile, setExportProfile] = useState<ExportProfile>("universal");
  const [count, setCount] = useState(1);
  const [resultMode, setResultMode] = useState<ResultMode>("new");
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>("auto");

  useEffect(() => {
    if (executionMode === "api") onGenerationSourceChange("api");
    if (executionMode === "comfyui") onGenerationSourceChange("local_comfy");
    if (executionMode === "drawthings") onGenerationSourceChange("local_draw");
  }, [executionMode, onGenerationSourceChange]);

  function mapExportProfileToPlatform(id: ExportProfile): PlatformPresetId {
    if (id === "reference") return "keling";
    if (id === "video_first") return "runway";
    if (id === "image_first") return "fal";
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

  const settings = useMemo<GenerateSettings>(() => {
    if (executionMode === "api") {
      const canGenerate = canUseByo && falConnected;
      return {
        executionMode,
        exportProfile,
        count,
        resultMode,
        referenceMode,
        canGenerate,
        generateLabel: tl(lang, "使用我的 API 执行", "Run with My API"),
        statusHint: canGenerate
          ? tl(lang, "已连接 Fal", "Fal is connected")
          : canUseByo
            ? tl(lang, "请先在账户中心连接 API", "Connect your API first in Account")
            : tl(lang, "此功能需要 Pro", "This feature requires Pro"),
      };
    }

    if (executionMode === "comfyui") {
      const canGenerate = canUseByo && comfyReady;
      return {
        executionMode,
        exportProfile,
        count,
        resultMode,
        referenceMode,
        canGenerate,
        generateLabel: tl(lang, "使用 ComfyUI 执行", "Run with ComfyUI"),
        statusHint: canGenerate
          ? tl(lang, "本地 ComfyUI 已就绪", "Local ComfyUI is ready")
          : canUseByo
            ? tl(lang, "请先在账户中心连接 ComfyUI", "Connect ComfyUI first in Account")
            : tl(lang, "此功能需要 Pro", "This feature requires Pro"),
      };
    }

    const canGenerate = canUseByo && drawReady && mediaMode === "image";
    return {
      executionMode,
      exportProfile,
      count,
      resultMode,
      referenceMode,
      canGenerate,
      generateLabel: tl(lang, "使用 Draw Things 执行", "Run with Draw Things"),
      statusHint: mediaMode !== "image"
        ? tl(lang, "Draw Things 当前仅支持图片", "Draw Things currently supports image only")
        : canGenerate
          ? tl(lang, "本地 Draw Things 已就绪", "Local Draw Things is ready")
          : canUseByo
            ? tl(lang, "请先在账户中心连接 Draw Things", "Connect Draw Things first in Account")
            : tl(lang, "此功能需要 Pro", "This feature requires Pro"),
    };
  }, [executionMode, exportProfile, count, resultMode, referenceMode, falConnected, comfyReady, drawReady, mediaMode, lang, canUseByo]);

  useEffect(() => {
    onGenerateSettingsChange?.(settings);
  }, [settings, onGenerateSettingsChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>{tl(lang, "自有API生成", "BYO API Generate")}</div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          {tl(
            lang,
            "这里只管理 Pro 用户的 API 与本地生成方式。",
            "This panel only manages Pro API and local generation."
          )}
        </div>
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px", display: "grid", gap: 8 }}>
        {sectionTitle(tl(lang, "生成方式", "Generation Mode"))}
        {optionRow({ selected: executionMode === "api", title: tl(lang, "我的 API · Pro", "My API · Pro"), desc: tl(lang, "使用你自己的 API 执行", "Run with your own API"), onClick: () => setExecutionMode("api") })}
        {optionRow({ selected: executionMode === "comfyui", title: "ComfyUI · Pro", desc: tl(lang, "连接本地 ComfyUI 执行", "Run through local ComfyUI"), onClick: () => setExecutionMode("comfyui") })}
        {optionRow({ selected: executionMode === "drawthings", title: "Draw Things · Pro", desc: tl(lang, "连接本地 Draw Things 执行", "Run through local Draw Things"), onClick: () => setExecutionMode("drawthings") })}
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px" }}>
        {sectionTitle(tl(lang, "当前生成摘要", "Generation Summary"))}
        <div style={{ display: "grid", gridTemplateColumns: "94px 1fr", rowGap: 6, columnGap: 8, fontSize: 11 }}>
          <div style={{ color: C.textMuted }}>{tl(lang, "生成方式", "Mode")}</div>
          <div style={{ color: C.text }}>
            {executionMode === "api"
              ? tl(lang, "我的 API", "My API")
              : executionMode === "comfyui"
                ? "ComfyUI"
                : "Draw Things"}
          </div>
          <div style={{ color: C.textMuted }}>{tl(lang, "连接状态", "Connection")}</div>
          <div style={{ color: C.text }}>
            {executionMode === "api"
              ? (falConnected ? tl(lang, "已连接", "Connected") : tl(lang, "未连接", "Not connected"))
              : executionMode === "comfyui"
                ? (comfyReady ? tl(lang, "已连接", "Connected") : tl(lang, "未连接", "Not connected"))
                : executionMode === "drawthings"
                  ? (drawReady ? tl(lang, "已连接", "Connected") : tl(lang, "未连接", "Not connected"))
                  : "-"}
          </div>
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
                  opacity: 1,
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
            {optionRow({ selected: referenceMode === "prefer", title: tl(lang, "优先参考图", "Prefer reference"), desc: tl(lang, "尽量保持参考一致", "Prioritize reference consistency"), onClick: () => setReferenceMode("prefer") })}
            {optionRow({ selected: referenceMode === "ignore", title: tl(lang, "忽略参考图", "Ignore reference"), desc: tl(lang, "仅按文本生成", "Generate from text only"), onClick: () => setReferenceMode("ignore") })}
          </div>

          {!settings.canGenerate && <div style={{ fontSize: 11, color: "#f87171" }}>{settings.statusHint}</div>}
        </div>
      </details>
    </div>
  );
}
