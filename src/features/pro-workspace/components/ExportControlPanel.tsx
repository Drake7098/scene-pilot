import React, { useEffect, useMemo, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { resolveSceneConfig } from "../../../model";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { FIGMA_COLORS } from "../constants";
import type { ApiCredentialState } from "../../../types/account";
import type { LocalProviderStatus } from "../../../utils/localGeneration";
import { Sparkles } from "lucide-react";

export type ExportMode = "prompt_only" | "package";
export type GenerationSource = "hosted" | "byo" | "local_comfy" | "local_draw";

type GenerateMode = "platform" | "api_local";
type ApiLocalTarget = "fal" | "replicate" | "custom" | "local";

const C = FIGMA_COLORS;
const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

const PLATFORM_CARDS: Array<{
  id: PlatformPresetId;
  group: string;
  groupZh: string;
  groupEn: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  tagsZh: string[];
  tagsEn: string[];
}> = [
  {
    id: "universal",
    group: "recommended",
    groupZh: "通用推荐",
    groupEn: "Recommended",
    nameZh: "通用",
    nameEn: "Universal",
    descZh: "默认推荐，最稳妥，自动轻适配。",
    descEn: "Default recommendation with the most stable light adaptation.",
    tagsZh: ["推荐给新手", "最稳妥", "自动轻适配"],
    tagsEn: ["Beginner Friendly", "Most Stable", "Auto Adapt"],
  },
  {
    id: "runway",
    group: "pro_video",
    groupZh: "专业创作 / 影视级",
    groupEn: "Professional / Cinematic",
    nameZh: "Runway",
    nameEn: "Runway",
    descZh: "偏专业视频创作、镜头控制、商业内容。",
    descEn: "Professional video creation with stronger camera control.",
    tagsZh: ["图片", "视频", "参考图", "专业创作"],
    tagsEn: ["Image", "Video", "Reference", "Pro"],
  },
  {
    id: "keling",
    group: "asia_high_freq",
    groupZh: "高频出片 / 亚洲主流",
    groupEn: "High Output / Asia Mainstream",
    nameZh: "Kling",
    nameEn: "Kling",
    descZh: "常见于图像、视频、motion control、参考驱动创作。",
    descEn: "Strong for image/video and reference-driven motion workflows.",
    tagsZh: ["图片", "视频", "运动控制", "参考图"],
    tagsEn: ["Image", "Video", "Motion", "Reference"],
  },
  {
    id: "hailuo",
    group: "asia_high_freq",
    groupZh: "高频出片 / 亚洲主流",
    groupEn: "High Output / Asia Mainstream",
    nameZh: "Hailuo",
    nameEn: "Hailuo",
    descZh: "偏快速 text/image to video，适合日常高频生成。",
    descEn: "Fast text/image-to-video for high-frequency daily generation.",
    tagsZh: ["图片", "视频", "快速", "上手简单"],
    tagsEn: ["Image", "Video", "Fast", "Easy"],
  },
  {
    id: "pika",
    group: "social",
    groupZh: "社媒风格 / 快速玩法",
    groupEn: "Social / Fast Creative",
    nameZh: "Pika",
    nameEn: "Pika",
    descZh: "偏社媒内容、快速效果、轻量创意视频。",
    descEn: "Social-first lightweight creative video workflows.",
    tagsZh: ["视频优先", "社媒玩法", "快速创意", "API"],
    tagsEn: ["Video First", "Social", "Fast", "API"],
  },
];

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

function chip(label: string) {
  return (
    <span
      key={label}
      style={{
        fontSize: 10,
        lineHeight: "16px",
        padding: "0 6px",
        borderRadius: 999,
        border: `1px solid ${C.border}`,
        background: C.bg,
        color: C.textMuted,
      }}
    >
      {label}
    </span>
  );
}

function cardButton(params: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  tags: string[];
  suffix?: string;
}) {
  const { selected, disabled, onClick, title, desc, tags, suffix } = params;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 8,
        border: `1px solid ${selected ? C.accent : C.border}`,
        background: selected ? `${C.accent}14` : C.panel,
        padding: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: selected ? 700 : 600, color: selected ? C.accent : C.text }}>{title}</span>
        {suffix ? <span style={{ fontSize: 10, color: C.textMuted }}>{suffix}</span> : null}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.45 }}>{desc}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{tags.map(chip)}</div>
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
};

export function ExportControlPanel({
  lang,
  project,
  scene,
  platformId,
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
}: Props) {
  void exportMode;
  void onExportModeChange;

  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const comfyReady = comfyStatus.state === "ready";
  const drawReady = drawStatus.state === "ready";
  const localReady = comfyReady || (mediaMode === "image" && drawReady);
  const falConnected = Boolean(canUseByo && byoCredentials?.fal?.enabled);

  const mode: GenerateMode = generationSource === "hosted" ? "platform" : "api_local";
  const [apiTarget, setApiTarget] = useState<ApiLocalTarget>(() => {
    if (generationSource === "local_comfy" || generationSource === "local_draw") return "local";
    return "fal";
  });

  useEffect(() => {
    if (generationSource === "local_comfy" || generationSource === "local_draw") {
      setApiTarget("local");
      return;
    }
    if (generationSource === "byo" && apiTarget === "local") {
      setApiTarget("fal");
    }
  }, [generationSource, apiTarget]);

  const hasLowCredits = userCredits < creditCost;

  const resolvePreferredLocalSource = (): GenerationSource => {
    if (comfyReady) return "local_comfy";
    if (drawReady && mediaMode === "image") return "local_draw";
    return "local_comfy";
  };

  const switchGenerateMode = (nextMode: GenerateMode) => {
    if (nextMode === "platform") {
      onGenerationSourceChange("hosted");
      return;
    }
    if (apiTarget === "local") {
      onGenerationSourceChange(resolvePreferredLocalSource());
      return;
    }
    onGenerationSourceChange("byo");
  };

  const selectApiTarget = (target: ApiLocalTarget) => {
    setApiTarget(target);
    if (target === "local") {
      onGenerationSourceChange(resolvePreferredLocalSource());
      return;
    }
    onGenerationSourceChange("byo");
    if (target === "fal") {
      onPlatformChange("fal");
    }
  };

  const previewPlatformId: PlatformPresetId =
    mode === "platform" ? platformId : apiTarget === "fal" ? "fal" : platformId;

  const previewPrompt = useMemo(() => {
    if (!project) return "";
    try {
      return (
        buildPromptForScene({
          project,
          scene,
          lang,
          platformId: previewPlatformId,
          profile: undefined,
          workspace: "pro",
        }).finalCopyPrompt?.trim() ?? ""
      );
    } catch {
      return "";
    }
  }, [project, scene, lang, previewPlatformId]);

  const capability = useMemo(() => {
    if (mode === "platform") {
      const table: Record<PlatformPresetId, { output: string; refs: string; adapt: string; scene: string }> = {
        universal: {
          output: tl(lang, "跟随当前项目", "Follows current project"),
          refs: tl(lang, "自动按目标能力处理", "Auto handled by target capability"),
          adapt: tl(lang, "ScenePilotix 轻量适配", "ScenePilotix light adapter"),
          scene: tl(lang, "大多数用户默认使用", "Default for most users"),
        },
        runway: {
          output: tl(lang, "图片 + 视频", "Image + Video"),
          refs: tl(lang, "支持", "Supported"),
          adapt: tl(lang, "专业视频平台轻适配", "Pro video light adapter"),
          scene: tl(lang, "高质量商业视频 / 镜头控制", "High-quality commercial video & camera control"),
        },
        keling: {
          output: tl(lang, "图片 + 视频", "Image + Video"),
          refs: tl(lang, "支持", "Supported"),
          adapt: tl(lang, "参考驱动 / 运动轻适配", "Reference + motion light adapter"),
          scene: tl(lang, "图像驱动视频、镜头运动", "Image-driven video and camera motion"),
        },
        hailuo: {
          output: tl(lang, "图片 + 视频", "Image + Video"),
          refs: tl(lang, "支持图片输入", "Image input supported"),
          adapt: tl(lang, "快速视频轻适配", "Fast video light adapter"),
          scene: tl(lang, "日常快速 text/image to video", "Daily fast text/image to video"),
        },
        pika: {
          output: tl(lang, "视频优先", "Video First"),
          refs: tl(lang, "按接入方式处理", "Depends on integration"),
          adapt: tl(lang, "社媒视频轻适配", "Social video light adapter"),
          scene: tl(lang, "社媒玩法、快速创意", "Social use-cases and fast creativity"),
        },
        fal: {
          output: tl(lang, "图片 + 视频", "Image + Video"),
          refs: tl(lang, "支持", "Supported"),
          adapt: tl(lang, "平台轻适配", "Platform light adapter"),
          scene: tl(lang, "开发者 API 与可控生成", "Developer API and controllable generation"),
        },
        midjourney: { output: "", refs: "", adapt: "", scene: "" },
        luma: { output: "", refs: "", adapt: "", scene: "" },
        krea: { output: "", refs: "", adapt: "", scene: "" },
        jimeng: { output: "", refs: "", adapt: "", scene: "" },
        vidu: { output: "", refs: "", adapt: "", scene: "" },
        wanx: { output: "", refs: "", adapt: "", scene: "" },
      };
      return table[platformId] ?? table.universal;
    }

    if (apiTarget === "local") {
      return {
        output: tl(lang, "跟随当前项目", "Follows current project"),
        refs: tl(lang, "按本地路由能力处理", "Handled by local route capability"),
        adapt: tl(lang, "自定义 API / 本地", "Custom API / local route"),
        scene: tl(lang, "本地测试与隐私优先工作流", "Local-first testing and privacy workflows"),
      };
    }

    return {
      output: tl(lang, "跟随当前项目", "Follows current project"),
      refs: tl(lang, "按提供商能力处理", "Depends on provider capability"),
      adapt: tl(lang, "自定义 API", "Custom API"),
      scene: tl(lang, "Pro 用户外部 API 路由", "External API route for Pro users"),
    };
  }, [mode, apiTarget, platformId, lang]);

  const canGenerate = useMemo(() => {
    if (mode === "platform") return !hasLowCredits;
    if (apiTarget === "local") return localReady;
    if (apiTarget === "fal") return falConnected;
    return false;
  }, [mode, apiTarget, hasLowCredits, localReady, falConnected]);

  const generateLabel = useMemo(() => {
    if (mode === "platform") {
      return tl(lang, `生成（${creditCost} Credits）`, `Generate (${creditCost} Credits)`);
    }
    if (apiTarget === "local") return tl(lang, "使用本地路由生成", "Generate with Local Route");
    if (apiTarget === "fal") return tl(lang, "使用 Fal 生成", "Generate with Fal");
    if (apiTarget === "replicate") return tl(lang, "使用 Replicate 生成", "Generate with Replicate");
    return tl(lang, "使用自定义 API 生成", "Generate with Custom API");
  }, [mode, apiTarget, creditCost, lang]);

  const groupedCards = useMemo(() => {
    const groups = new Map<string, { titleZh: string; titleEn: string; items: typeof PLATFORM_CARDS }>();
    for (const card of PLATFORM_CARDS) {
      if (!groups.has(card.group)) {
        groups.set(card.group, { titleZh: card.groupZh, titleEn: card.groupEn, items: [] });
      }
      groups.get(card.group)!.items.push(card);
    }
    return Array.from(groups.values());
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>
          {tl(lang, "步骤 10 · 生成", "Step 10 · Generate")}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          {tl(lang, "选择生成方式与平台，点击底部“生成”执行", "Choose source and platform, then click Generate.")}
        </div>
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px" }}>
        {sectionTitle(tl(lang, "生成方式", "Generation Mode"))}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => switchGenerateMode("platform")}
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: 8,
              border: `1px solid ${mode === "platform" ? C.accent : C.border}`,
              background: mode === "platform" ? `${C.accent}14` : C.panel,
              color: mode === "platform" ? C.accent : C.text,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>{tl(lang, "平台生成", "Platform")}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
              {tl(lang, "使用 ScenePilotix 平台 Credits，适合大多数用户", "Uses ScenePilotix credits, best for most users")}
            </div>
          </button>
          <button
            type="button"
            onClick={() => switchGenerateMode("api_local")}
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: 8,
              border: `1px solid ${mode === "api_local" ? C.accent : C.border}`,
              background: mode === "api_local" ? `${C.accent}14` : C.panel,
              color: mode === "api_local" ? C.accent : C.text,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>{tl(lang, "我的 API / 本地", "My API / Local")}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
              {tl(lang, "使用你自己的 API 路由或本地配置，适合 Pro 用户", "Use your own API route or local setup, for Pro users")}
            </div>
          </button>
        </div>
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {sectionTitle(tl(lang, "选择目标平台", "Select Platform"))}

        {mode === "platform" ? (
          groupedCards.map((group) => (
            <div key={group.titleEn} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>
                {lang === "zh" ? group.titleZh : group.titleEn}
              </div>
              {group.items.map((card) =>
                cardButton({
                  selected: platformId === card.id,
                  onClick: () => onPlatformChange(card.id),
                  title: lang === "zh" ? card.nameZh : card.nameEn,
                  desc: lang === "zh" ? card.descZh : card.descEn,
                  tags: lang === "zh" ? card.tagsZh : card.tagsEn,
                })
              )}
            </div>
          ))
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>
              {tl(lang, "我的 API / 本地路由", "My API / Local Route")}
            </div>
            {cardButton({
              selected: apiTarget === "fal",
              disabled: !canUseByo,
              onClick: () => selectApiTarget("fal"),
              title: "Fal",
              desc: tl(lang, "API 路由，适合可控生成。", "API route for controllable generation."),
              tags: lang === "zh" ? ["API", falConnected ? "已连接" : "未连接"] : ["API", falConnected ? "Connected" : "Not Connected"],
            })}
            {cardButton({
              selected: apiTarget === "replicate",
              disabled: true,
              onClick: () => selectApiTarget("replicate"),
              title: "Replicate",
              desc: tl(lang, "预留入口，当前版本未接入。", "Reserved entry, not connected in current build."),
              tags: lang === "zh" ? ["API", "未连接"] : ["API", "Not Connected"],
            })}
            {cardButton({
              selected: apiTarget === "custom",
              disabled: true,
              onClick: () => selectApiTarget("custom"),
              title: tl(lang, "自定义网关", "Custom Gateway"),
              desc: tl(lang, "预留入口，当前版本未接入。", "Reserved entry, not connected in current build."),
              tags: lang === "zh" ? ["自定义", "未连接"] : ["Custom", "Not Connected"],
            })}
            {cardButton({
              selected: apiTarget === "local",
              onClick: () => selectApiTarget("local"),
              title: tl(lang, "本地路由", "Local Route"),
              desc: tl(lang, "使用本地桥接，不消耗平台 Credits。", "Use local bridge with no platform credit cost."),
              tags: lang === "zh"
                ? ["本地", localReady ? "已连接" : "未连接", mediaMode === "image" ? "图片" : "视频"]
                : ["Local", localReady ? "Connected" : "Not Connected", mediaMode === "image" ? "Image" : "Video"],
            })}
          </div>
        )}
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px" }}>
        {sectionTitle(tl(lang, "平台能力", "Platform Capability"))}
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 6, columnGap: 8, fontSize: 11 }}>
          <div style={{ color: C.textMuted }}>{tl(lang, "输出类型", "Output")}</div>
          <div style={{ color: C.text }}>{capability.output}</div>
          <div style={{ color: C.textMuted }}>{tl(lang, "参考图支持", "Reference")}</div>
          <div style={{ color: C.text }}>{capability.refs}</div>
          <div style={{ color: C.textMuted }}>{tl(lang, "适配方式", "Adaptation")}</div>
          <div style={{ color: C.text }}>{capability.adapt}</div>
          <div style={{ color: C.textMuted }}>{tl(lang, "推荐场景", "Best for")}</div>
          <div style={{ color: C.text }}>{capability.scene}</div>
        </div>
      </div>

      {divider()}

      <div style={{ padding: "12px 14px 14px" }}>
        {sectionTitle(tl(lang, "生成来源", "Generation Source"))}
        {mode === "platform" ? (
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ color: C.textMuted }}>
              {tl(lang, "Credits 余额", "Credits Balance")}: <span style={{ color: C.text }}>{userCredits}</span>
            </div>
            <div style={{ color: C.textMuted }}>
              {tl(lang, "本次预计消耗", "Estimated Cost")}: <span style={{ color: C.text }}>{creditCost} Credits</span>
            </div>
            {hasLowCredits ? (
              <div style={{ color: "#f87171", marginTop: 4 }}>
                {tl(lang, "余额不足，请充值", "Insufficient balance, please top up")}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ color: C.textMuted }}>
              {tl(lang, "当前提供商", "Current Provider")}: <span style={{ color: C.text }}>
                {apiTarget === "fal" ? "Fal" : apiTarget === "replicate" ? "Replicate" : apiTarget === "custom" ? tl(lang, "自定义", "Custom") : tl(lang, "本地路由", "Local Route")}
              </span>
            </div>
            <div style={{ color: C.textMuted }}>
              {tl(lang, "连接状态", "Connection")}: <span style={{ color: C.text }}>
                {apiTarget === "fal"
                  ? falConnected ? tl(lang, "已连接", "Connected") : tl(lang, "未配置", "Missing")
                  : apiTarget === "local"
                    ? localReady ? tl(lang, "已连接", "Connected") : tl(lang, "未配置", "Missing")
                    : tl(lang, "未配置", "Missing")}
              </span>
            </div>
            {apiTarget === "fal" && falConnected ? (
              <div style={{ color: C.textMuted }}>{tl(lang, "将使用你的 API，不消耗平台 Credits", "Uses your API with no platform credits.")}</div>
            ) : null}
            {(apiTarget !== "fal" && apiTarget !== "local") || (apiTarget === "fal" && !falConnected) || (apiTarget === "local" && !localReady) ? (
              <div style={{ color: C.textMuted, marginTop: 4 }}>{tl(lang, "前往设置：账户中心 → API / 本地", "Go to settings: Account Center → API / Local")}</div>
            ) : null}
          </div>
        )}
      </div>

      {divider()}

      <details style={{ padding: "12px 14px 14px" }}>
        <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.text }}>
          {tl(lang, "高级设置", "Advanced Settings")}
        </summary>
        <div style={{ marginTop: 10, display: "grid", gap: 6, fontSize: 11, color: C.textMuted }}>
          <div>{tl(lang, "分辨率：跟随当前项目设置", "Resolution: follows current project")}</div>
          {mediaMode === "video" ? <div>{tl(lang, `时长：${scene.duration_s || 5} 秒`, `Duration: ${scene.duration_s || 5}s`)}</div> : null}
          <div>{tl(lang, "适配强度：标准", "Adaptation Strength: Standard")}</div>
          <div>{tl(lang, "参考图强化：按平台支持自动处理", "Reference enhancement: auto by platform support")}</div>
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

      {divider()}

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          disabled={!canGenerate || generateBusy}
          onClick={() => onGenerate?.()}
          style={{
            minHeight: 36,
            borderRadius: 8,
            border: "none",
            background: !canGenerate || generateBusy ? "#6b7280" : C.accent,
            color: "#111",
            fontSize: 12,
            fontWeight: 700,
            cursor: !canGenerate || generateBusy ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Sparkles size={14} />
          {generateBusy ? tl(lang, "生成中…", "Generating…") : generateLabel}
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onCopy?.()}
            style={{
              flex: 1,
              minHeight: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.panel,
              color: C.text,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {tl(lang, "复制提示词", "Copy Prompt")}
          </button>
          <button
            type="button"
            onClick={() => onExport?.()}
            style={{
              flex: 1,
              minHeight: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.panel,
              color: C.text,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {tl(lang, "导出项目包", "Export Package")}
          </button>
        </div>
      </div>
    </div>
  );
}
