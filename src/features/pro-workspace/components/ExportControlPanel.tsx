/**
 * Export UI v1 - ExportControlPanel
 * Composes all 7 Export sections. Output control center within Pro Workspace.
 * Aligns with Figma design reference.
 */

import React, { useMemo } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { getPlatformPreset } from "../../../config/platformPresets";
import { resolveSceneConfig } from "../../../model";
import { EditorSection } from "../../../components/ui";
import { Download, Settings, Cpu, FileOutput, Copy, Wand2, Share2 } from "lucide-react";
import { ExportOverviewSection } from "./ExportOverviewSection";
import { PlatformSelectSection } from "./PlatformSelectSection";
import { EngineSelectSection, type GenerationSource } from "./EngineSelectSection";
import { ExportModeSection, type ExportMode } from "./ExportModeSection";
import { ExportCopySection } from "./ExportCopySection";
import { ExportGenerateSection } from "./ExportGenerateSection";
import { ExportActionSection } from "./ExportActionSection";

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
  onCopy: () => void;
  onExport: () => void;
  onGenerate: () => void;
  generateBusy: boolean;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

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
  onCopy,
  onExport,
  onGenerate,
  generateBusy,
}: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const engineId = mediaMode === "image" ? "IM V5P" : "VI V5P";
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const templateId = project?.meta?.currentTemplate?.templateId ?? null;

  const prompt = useMemo(() => {
    if (!project) return "";
    const preset = getPlatformPreset(platformId);
    const result = buildPromptForScene({
      project,
      scene,
      lang,
      platformId,
      profile: preset?.baseProfile,
      workspace: "pro",
    });
    return result.finalCopyPrompt?.trim() ?? "";
  }, [project, scene, lang, platformId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection title={t(lang, "导出概览", "Export Overview")} icon={Settings} defaultOpen={true}>
        <ExportOverviewSection
          lang={lang}
          platformId={platformId}
          engineId={engineId}
          applyMode={applyMode}
          mediaMode={mediaMode}
          templateId={templateId}
        />
      </EditorSection>

      <EditorSection title={t(lang, "平台选择", "Platform")} icon={Download} defaultOpen={true}>
        <PlatformSelectSection lang={lang} value={platformId} onChange={onPlatformChange} />
      </EditorSection>

      <EditorSection title={t(lang, "引擎与生成源", "Engine & Source")} icon={Cpu} defaultOpen={true}>
        <EngineSelectSection
          lang={lang}
          engineId={engineId}
          generationSource={generationSource}
          onGenerationSourceChange={onGenerationSourceChange}
          canUseByo={canUseByo}
        />
      </EditorSection>

      <EditorSection title={t(lang, "导出模式", "Export Mode")} icon={FileOutput} defaultOpen={true}>
        <ExportModeSection lang={lang} value={exportMode} onChange={onExportModeChange} />
      </EditorSection>

      <EditorSection title={t(lang, "复制", "Copy")} icon={Copy} defaultOpen={true}>
        <ExportCopySection lang={lang} prompt={prompt} onCopy={onCopy} />
      </EditorSection>

      <EditorSection title={t(lang, "生成", "Generate")} icon={Wand2} defaultOpen={true}>
        <ExportGenerateSection lang={lang} onGenerate={onGenerate} busy={generateBusy} />
      </EditorSection>

      <EditorSection title={t(lang, "导出动作", "Export Actions")} icon={Share2} defaultOpen={true}>
        <ExportActionSection lang={lang} onExport={onExport} onCopy={onCopy} />
      </EditorSection>
    </div>
  );
}
