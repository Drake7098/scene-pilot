/**
 * TechPanel — Step 9
 * Compiler / V2Mode / SceneTier / Stability — 技术配置
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
  const layoutLocked = false; // compiler always selectable
  const config = resolveSceneConfig(scene);

  const compilerOptions = [
    { value: "v3", label: tl(lang, "V3 编译器（商业级）", "V3 Compiler (Commercial)") },
    { value: "v2", label: tl(lang, "V2 编译器", "V2 Compiler") },
    { value: "v1", label: tl(lang, "V1 编译器（兼容）", "V1 Compiler (Legacy)") },
  ];

  const v2ModeOptions = [
    { value: "strict", label: tl(lang, "Strict — 精确控制", "Strict — Precise Control") },
    { value: "short",  label: tl(lang, "Short — 精简输出",  "Short — Compact Output") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 9 · 提示词引擎", "Step 9 · Prompt Engine")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择提示词编译器版本", "Select prompt compiler version")}
        </div>
      </div>

      <EditorSection title={tl(lang, "提示词引擎", "Prompt Engine")} icon={Settings2} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "编译器", "Compiler")} value={config.compiler ?? "v3"}
          onChange={(v) => onUpdateScene(withSceneConfig(scene, { compiler: v as any }))}
          disabled={layoutLocked} options={compilerOptions} />
        <EditorSelect compact label={tl(lang, "V2 模式", "V2 Mode")} value={config.v2Mode ?? "strict"}
          onChange={(v) => onUpdateScene(withSceneConfig(scene, { v2Mode: v as any }))}
          disabled={layoutLocked || config.compiler !== "v2"} options={v2ModeOptions} />
      </EditorSection>
    </div>
  );
}
