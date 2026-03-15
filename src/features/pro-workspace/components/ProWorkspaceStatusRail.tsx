import React, { useMemo } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { detectSceneConflicts } from "../../../utils/conflictRules";
import { getStageObjectState } from "../../../features/stage-editor/guards/stageObjectState";
import { resolveSceneConfig } from "../../../model";
import { buildPromptForScene } from "../../../utils/promptEngine";
import { getPlatformPreset } from "../../../config/platformPresets";
import { AlertTriangle } from "lucide-react";
import { RuleSummarySection } from "./RuleSummarySection";
import { FIGMA_COLORS, PRO_RAIL_WIDTH, PRO_PANEL_PADDING, PRO_SECTION_GAP } from "../constants";

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  platformId?: string;
};

function applyModeLabel(mode: string, lang: Lang): string {
  if (lang === "zh") {
    if (mode === "layout_only") return "仅布局";
    if (mode === "layout_plus_style") return "布局+风格";
    if (mode === "full_workflow") return "完整工作流";
  } else {
    if (mode === "layout_only") return "Layout only";
    if (mode === "layout_plus_style") return "Layout + style";
    if (mode === "full_workflow") return "Full workflow";
  }
  return mode;
}

export function ProWorkspaceStatusRail({ lang, project, scene, platformId }: Props) {
  const currentTemplate = project?.meta?.currentTemplate;
  const applyMode = currentTemplate?.applyMode ?? "layout_only";
  const conflicts = detectSceneConflicts(scene, lang);
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const layoutLocked = applyMode === "layout_only";
  const layers = scene.layers ?? [];
  const objectStateCount = layers.filter((l) => {
    const s = getStageObjectState(l, scene, project);
    return s.isLocked || s.continuityId || s.isProtectedLayout;
  }).length;

  const promptSummary = useMemo(() => {
    if (!project || !platformId) return null;
    const preset = getPlatformPreset(platformId as any);
    const result = buildPromptForScene({
      project,
      scene,
      lang,
      platformId: platformId as any,
      profile: preset?.baseProfile,
      workspace: "pro",
    });
    const text = result.finalCopyPrompt?.trim() ?? "";
    return { length: text.length, engineId: result.metadata?.engineId };
  }, [project, scene, lang, platformId]);

  return (
    <aside
      style={{
        width: PRO_RAIL_WIDTH,
        minWidth: PRO_RAIL_WIDTH,
        borderLeft: `1px solid ${FIGMA_COLORS.border}`,
        background: FIGMA_COLORS.panel,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="pro-rail-scroll" style={{ flex: 1, padding: `${PRO_PANEL_PADDING}px` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: PRO_SECTION_GAP }}>
          {lang === "zh" ? "状态" : "Status"}
        </div>

        <div style={{ marginBottom: PRO_SECTION_GAP }}>
          <RuleSummarySection
            lang={lang}
            conflicts={conflicts}
            layoutLocked={layoutLocked}
            objectStateCount={objectStateCount}
          />
        </div>

        {currentTemplate && (
          <div style={{ marginBottom: PRO_SECTION_GAP }}>
            <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
              {lang === "zh" ? "模板来源" : "Template source"}
            </div>
            <div style={{ fontSize: 12, color: FIGMA_COLORS.text }}>
              {currentTemplate.templateId || (lang === "zh" ? "—" : "—")}
            </div>
          </div>
        )}

        <div style={{ marginBottom: PRO_SECTION_GAP }}>
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
            {lang === "zh" ? "应用模式" : "Apply mode"}
          </div>
          <div style={{ fontSize: 12, color: FIGMA_COLORS.text }}>
            {applyModeLabel(applyMode, lang)}
          </div>
        </div>

        <div style={{ marginBottom: PRO_SECTION_GAP }}>
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
            {lang === "zh" ? "场景状态" : "Scene status"}
          </div>
          <div style={{ fontSize: 12, color: FIGMA_COLORS.text }}>
            {mediaMode === "image" ? (lang === "zh" ? "图片" : "Image") : (lang === "zh" ? "视频" : "Video")}
          </div>
        </div>

        {promptSummary && (
          <div style={{ marginBottom: PRO_SECTION_GAP }}>
            <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
              {lang === "zh" ? "提示词" : "Prompt"}
            </div>
            <div style={{ fontSize: 12, color: FIGMA_COLORS.text }}>
              {promptSummary.length} {lang === "zh" ? "字符" : "chars"}
              {promptSummary.engineId && (
                <span style={{ color: FIGMA_COLORS.textMuted, marginLeft: 6 }}>({promptSummary.engineId})</span>
              )}
            </div>
          </div>
        )}

        {layoutLocked && (
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              background: `${FIGMA_COLORS.accent}15`,
              border: `1px solid ${FIGMA_COLORS.border}`,
              marginBottom: PRO_SECTION_GAP,
              fontSize: 11,
              color: FIGMA_COLORS.textMuted,
            }}
          >
            {lang === "zh" ? "布局锁定中，场景字段不可编辑" : "Layout locked, scene fields read-only"}
          </div>
        )}

        {conflicts.length > 0 && (
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              background: `${FIGMA_COLORS.accent}15`,
              border: `1px solid ${FIGMA_COLORS.accent}`,
              marginBottom: PRO_SECTION_GAP,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 11, fontWeight: 600, color: FIGMA_COLORS.accent }}>
              <AlertTriangle size={12} />
              {lang === "zh" ? "风险提示" : "Risk"}
            </div>
            <div style={{ fontSize: 11, color: FIGMA_COLORS.text }}>
              {conflicts.length} {lang === "zh" ? "个冲突" : "conflict(s)"}
            </div>
          </div>
        )}

        {!currentTemplate && (
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {lang === "zh" ? "未使用模板" : "No template applied"}
          </div>
        )}
      </div>
    </aside>
  );
}
