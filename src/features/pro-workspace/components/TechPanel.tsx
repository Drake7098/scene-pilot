/**
 * TechPanel — Step 9
 * 提示词引擎选择（V1/V2/V3）
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig, withSceneConfig } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { Settings2 } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

export function TechPanel({ lang, scene, project, onUpdateScene }: Props) {
  // Compiler always selectable - don't lock based on template applyMode
  const layoutLocked = false;
  const config = resolveSceneConfig(scene);

  const compilerOptions = [
    { value: "v3", label: tl(lang, "V3 — 商业级结构化输出", "V3 — Commercial Structured") },
    { value: "v2", label: tl(lang, "V2 — 精确布局控制",    "V2 — Precise Layout") },
    { value: "v1", label: tl(lang, "V1 — 兼容简洁模式",    "V1 — Legacy Compact") },
  ];

  const v2ModeOptions = [
    { value: "strict", label: tl(lang, "Strict — 完整约束输出", "Strict — Full Constraints") },
    { value: "short",  label: tl(lang, "Short — 精简输出",      "Short — Compact Output") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 9 · 引擎", "Step 9 · Engine")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "V3 适合商业输出，V2 适合精确布局，V1 兼容简单场景", "V3 for commercial output, V2 for precise layout, V1 for simple scenes")}
        </div>
      </div>

      <EditorSection title={tl(lang, "提示词引擎", "Prompt Engine")} icon={Settings2} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "编译器版本", "Compiler")}
          value={config.compiler ?? "v3"}
          onChange={(v) => onUpdateScene(withSceneConfig(scene, { compiler: v as any }))}
          disabled={layoutLocked} options={compilerOptions} />
        <EditorSelect compact label={tl(lang, "V2 输出模式", "V2 Output Mode")}
          value={config.v2Mode ?? "strict"}
          onChange={(v) => onUpdateScene(withSceneConfig(scene, { v2Mode: v as any }))}
          disabled={layoutLocked || config.compiler !== "v2"} options={v2ModeOptions} />
      </EditorSection>

      <div style={{ margin: "4px 16px 12px", padding: "8px 10px", borderRadius: 4, background: FIGMA_COLORS.bg, border: `1px solid ${FIGMA_COLORS.border}`, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {config.compiler === "v3"
          ? tl(lang, "V3：14段结构化输出，含镜头/灯光/情绪/技术，适合 Midjourney、Runway、Pika", "V3: 14-segment structured output covering camera, lighting, mood, and technical — best for MJ, Runway, Pika")
          : config.compiler === "v2"
            ? tl(lang, "V2：精确布局约束，主体位置与运动严格控制，适合需要精确构图的场景", "V2: strict layout constraints with precise subject placement and motion — for composition-critical shots")
            : tl(lang, "V1：简洁直排输出，适合简单单主体场景或兼容性需求", "V1: compact linear output for simple single-subject scenes or compatibility needs")}
      </div>
    </div>
  );
}
