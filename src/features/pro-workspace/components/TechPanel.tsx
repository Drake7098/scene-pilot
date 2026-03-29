/**
 * TechPanel — Step 9
 * Prompt Review panel shell (engine selection removed).
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig, withSceneConfig } from "../../../model";
import { EditorSection } from "../../../components/ui";
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
  void project;
  const config = resolveSceneConfig(scene);
  React.useEffect(() => {
    if (config.compiler === "v3" && config.v2Mode === "strict") return;
    onUpdateScene(withSceneConfig(scene, { compiler: "v3", v2Mode: "strict" }));
  }, [config.compiler, config.v2Mode, onUpdateScene, scene]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 9 · 提示词", "Step 9 · Prompt")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "查看最终编译结果与风险提示", "Review final compiled output and warnings")}
        </div>
      </div>

      <EditorSection title={tl(lang, "提示词审查", "Prompt Review")} icon={Settings2} defaultOpen={true}>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, lineHeight: 1.5 }}>
          {tl(
            lang,
            "本步骤仅展示最终编译结果、约束影响与异常提示。平台差异化适配请在「输出」步骤查看。",
            "This step shows final compiled result, constraint impact, and warnings. Platform adaptation remains in Output."
          )}
        </div>
      </EditorSection>
    </div>
  );
}
