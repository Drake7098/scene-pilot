/**
 * Rule Engine UI v1 - ConstraintInspectorPanel
 * Composes: RuleSummarySection, ActiveRuleList, DisabledStateSection,
 * ConflictListSection, ResolutionHintSection.
 * Read-only rule inspection, no editing. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { detectSceneConflicts } from "../../../utils/conflictRules";
import { getStageObjectState } from "../../../features/stage-editor/guards/stageObjectState";
import { resolveSceneConfig } from "../../../model";
import { EditorSection } from "../../../components/ui";
import { Shield, AlertTriangle, Lock, ListChecks, Lightbulb } from "lucide-react";
import { RuleSummarySection } from "./RuleSummarySection";
import { ActiveRuleList } from "./ActiveRuleList";
import { DisabledStateSection } from "./DisabledStateSection";
import { ConflictListSection } from "./ConflictListSection";
import { ResolutionHintSection } from "./ResolutionHintSection";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  selectedLayerId?: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ConstraintInspectorPanel({
  lang,
  scene,
  project,
  selectedLayerId,
  onJumpToConflict,
}: Props) {
  const conflicts = detectSceneConflicts(scene, lang);
  const layers = scene.layers ?? [];
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "full_workflow";
  const layoutLocked = applyMode === "layout_only";

  const objectStates = layers.map((l) => ({
    layer: l,
    state: getStageObjectState(l, scene, project),
  }));

  const objectStateCount = objectStates.filter(
    (s) =>
      s.state.isLocked ||
      s.state.continuityId ||
      s.state.isProtectedLayout ||
      s.state.labels.some((l) => ["locked", "anchor-bound", "protected-layout"].includes(l))
  ).length;

  const hasContent =
    conflicts.length > 0 ||
    layoutLocked ||
    objectStateCount > 0 ||
    mediaMode === "image";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection
        title={t(lang, "规则汇总", "Rule Summary")}
        icon={Shield}
        defaultOpen={true}
      >
        <RuleSummarySection
          lang={lang}
          conflicts={conflicts}
          layoutLocked={layoutLocked}
          objectStateCount={objectStateCount}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "生效规则", "Active Rules")}
        icon={ListChecks}
        defaultOpen={conflicts.length > 0}
      >
        <ActiveRuleList
          lang={lang}
          conflicts={conflicts}
          selectedLayerId={selectedLayerId}
          onJumpToConflict={onJumpToConflict}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "禁用字段", "Disabled Fields")}
        icon={Lock}
        defaultOpen={layoutLocked || mediaMode === "image" || objectStateCount > 0}
      >
        <DisabledStateSection
          lang={lang}
          layoutLocked={layoutLocked}
          mediaMode={mediaMode}
          objectStates={objectStates}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "冲突列表", "Conflicts")}
        icon={AlertTriangle}
        defaultOpen={conflicts.length > 0}
      >
        <ConflictListSection
          lang={lang}
          conflicts={conflicts}
          selectedLayerId={selectedLayerId}
          onJumpToConflict={onJumpToConflict}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "处理建议", "Resolution Hints")}
        icon={Lightbulb}
        defaultOpen={conflicts.length > 0 || layoutLocked}
      >
        <ResolutionHintSection
          lang={lang}
          conflicts={conflicts}
          layoutLocked={layoutLocked}
        />
      </EditorSection>

      {!hasContent && (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 12,
          }}
        >
          {t(lang, "暂无约束或冲突", "No constraints or conflicts")}
        </div>
      )}
    </div>
  );
}
