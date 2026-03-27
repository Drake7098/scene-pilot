/**
 * Platform Adapt UI v1 - PlatformAdaptPanel
 * Composes 6 platform explanation sections. Explanation only, no engine/schema changes.
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
import { Settings, Zap, AlertCircle, ArrowRight, FileText, Download } from "lucide-react";
import { PlatformOverviewSection } from "./PlatformOverviewSection";
import { PlatformCapabilitySection } from "./PlatformCapabilitySection";
import { PlatformLimitSection } from "./PlatformLimitSection";
import { PlatformMappingSection } from "./PlatformMappingSection";
import { PlatformPromptPreviewSection } from "./PlatformPromptPreviewSection";
import { PlatformExportBehaviorSection } from "./PlatformExportBehaviorSection";
import type { GenerationSource } from "./EngineSelectSection";

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  platformId: PlatformPresetId;
  exportMode: string;
  generationSource: GenerationSource;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function PlatformAdaptPanel({
  lang,
  project,
  scene,
  platformId,
  exportMode,
  generationSource,
}: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const engineId = mediaMode === "image" ? "IM V5P" : "VI V5P";
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "full_workflow";

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
      <EditorSection title={t(lang, "平台概览", "Platform Overview")} icon={Settings} defaultOpen={true}>
        <PlatformOverviewSection
          lang={lang}
          platformId={platformId}
          engineId={engineId}
          mediaMode={mediaMode}
          exportMode={exportMode}
          applyMode={applyMode}
        />
      </EditorSection>

      <EditorSection title={t(lang, "平台能力", "Platform Capabilities")} icon={Zap} defaultOpen={true}>
        <PlatformCapabilitySection lang={lang} platformId={platformId} mediaMode={mediaMode} />
      </EditorSection>

      <EditorSection title={t(lang, "平台限制", "Platform Limits")} icon={AlertCircle} defaultOpen={true}>
        <PlatformLimitSection lang={lang} platformId={platformId} mediaMode={mediaMode} />
      </EditorSection>

      <EditorSection title={t(lang, "映射说明", "Mapping")} icon={ArrowRight} defaultOpen={true}>
        <PlatformMappingSection lang={lang} platformId={platformId} />
      </EditorSection>

      <EditorSection title={t(lang, "Prompt 预览", "Prompt Preview")} icon={FileText} defaultOpen={true}>
        <PlatformPromptPreviewSection
          lang={lang}
          platformId={platformId}
          prompt={prompt}
          mediaMode={mediaMode}
        />
      </EditorSection>

      <EditorSection title={t(lang, "导出行为", "Export Behavior")} icon={Download} defaultOpen={true}>
        <PlatformExportBehaviorSection
          lang={lang}
          platformId={platformId}
          exportMode={exportMode}
          generationSource={generationSource}
        />
      </EditorSection>
    </div>
  );
}
