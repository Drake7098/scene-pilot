/**
 * Prompt UI v1 - PromptPreviewPanel
 * Composes: PromptOverviewSection, PromptBreakdownSection, PromptSourceSection,
 * PromptWarningSection, PromptMetaSection. Read-only, no editing.
 * Aligns with Figma design reference.
 */

import React, { useMemo } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { getPlatformPreset } from "../../../config/platformPresets";
import { detectSceneConflicts } from "../../../utils/conflictRules";
import { getStageObjectState } from "../../stage-editor/guards/stageObjectState";
import { resolveSceneConfig } from "../../../model";
import { EditorSection } from "../../../components/ui";
import { FileText, Layers, Info, AlertTriangle, Settings } from "lucide-react";
import { PromptOverviewSection } from "./PromptOverviewSection";
import { PromptBreakdownSection } from "./PromptBreakdownSection";
import { PromptSourceSection } from "./PromptSourceSection";
import { PromptWarningSection } from "./PromptWarningSection";
import { PromptMetaSection } from "./PromptMetaSection";

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  platformId: string;
  /** Unified copy flow; when provided, Copy button uses ExportPanel pipeline (no direct clipboard). */
  onCopyPrompt?: () => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function PromptPreviewPanel({ lang, project, scene, platformId, onCopyPrompt }: Props) {
  const pipeline = useMemo(() => {
    if (!project) return null;
    const preset = getPlatformPreset(platformId as any);
    return buildPromptForScene({
      project,
      scene,
      lang,
      platformId: platformId as any,
      profile: preset?.baseProfile,
      workspace: "pro",
    });
  }, [project, scene, lang, platformId]);

  const prompt = pipeline?.finalCopyPrompt?.trim() ?? "";
  const metadata = pipeline?.metadata;
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";
  const templateId = project?.meta?.currentTemplate?.templateId ?? null;
  const conflicts = useMemo(() => detectSceneConflicts(scene, lang), [scene, lang]);

  const disabledFieldCount = useMemo(() => {
    let n = 0;
    if (layoutLocked) n += 1; // all scene fields
    if (mediaMode === "image") n += 1; // video motion fields
    const layers = scene.layers ?? [];
    for (const l of layers) {
      const s = getStageObjectState(l, scene, project);
      if (s.isLocked || s.continuityId || s.isProtectedLayout) n += 1;
    }
    return n;
  }, [layoutLocked, mediaMode, scene, project]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection
        title={t(lang, "提示词概览", "Prompt Overview")}
        icon={FileText}
        defaultOpen={true}
      >
        <PromptOverviewSection lang={lang} prompt={prompt} onCopyPrompt={onCopyPrompt} />
      </EditorSection>

      <EditorSection
        title={t(lang, "上下文", "Context")}
        icon={Settings}
        defaultOpen={true}
      >
        <PromptMetaSection
          lang={lang}
          mediaMode={mediaMode}
          sceneName={scene.name ?? ""}
          templateId={templateId}
          applyMode={applyMode}
          engineId={metadata?.engineId}
          conflictCount={conflicts.length}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "分段展示", "Section Breakdown")}
        icon={Layers}
        defaultOpen={true}
      >
        <PromptBreakdownSection lang={lang} prompt={prompt} />
      </EditorSection>

      <EditorSection
        title={t(lang, "来源说明", "Source Explanation")}
        icon={Info}
        defaultOpen={false}
      >
        <PromptSourceSection
          lang={lang}
          prompt={prompt}
          hasTemplate={Boolean(project?.meta?.currentTemplate)}
          applyMode={applyMode}
          mediaMode={mediaMode}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "提示词相关警告", "Prompt Warnings")}
        icon={AlertTriangle}
        defaultOpen={conflicts.length > 0 || layoutLocked || disabledFieldCount > 0}
      >
        <PromptWarningSection
          lang={lang}
          layoutLocked={layoutLocked}
          mediaMode={mediaMode}
          conflicts={conflicts}
          disabledFieldCount={disabledFieldCount}
        />
      </EditorSection>
    </div>
  );
}
