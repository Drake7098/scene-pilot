import React, { useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import type { ProWorkspaceSection } from "../types";
import type { ExportMode } from "./ExportModeSection";
import type { GenerationSource } from "./EngineSelectSection";
import { ProWorkspaceNav } from "./ProWorkspaceNav";
import { ProWorkspaceEditor } from "./ProWorkspaceEditor";
import { ProWorkspaceStatusRail } from "./ProWorkspaceStatusRail";
import { FIGMA_COLORS, PRO_FIELD_GAP, PRO_BOTTOM_BAR_PADDING, PRO_SECTION_GAP } from "../constants";

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  sceneIdx: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onRenameLayer?: (oldId: string, newId: string) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
  platformId: string;
  onJumpToConflict?: (layerId: string | null) => void;
  /** Bottom utility: Generate + Copy/Export. Reuses existing flow. */
  bottomSlot?: React.ReactNode;
  /** ExportPanel mount point (for modals). Rendered off-screen. */
  exportPanelSlot?: React.ReactNode;
  /** Export UI v1: platform / mode / generate / copy / export */
  onPlatformChange?: (id: PlatformPresetId) => void;
  exportMode?: ExportMode;
  onExportModeChange?: (v: ExportMode) => void;
  generationSource?: GenerationSource;
  onGenerationSourceChange?: (v: GenerationSource) => void;
  canUseByo?: boolean;
  onCopyPrompt?: () => void;
  onExport?: () => void;
  onGenerate?: () => void;
  generateBusy?: boolean;
};

export function ProWorkspaceShell({
  lang,
  project,
  scene,
  sceneIdx,
  selectedLayerId,
  onSelectLayer,
  onUpdateScene,
  onRenameLayer,
  editT,
  setEditT,
  platformId,
  onJumpToConflict,
  bottomSlot,
  exportPanelSlot,
  onPlatformChange,
  exportMode = "prompt_only",
  onExportModeChange,
  generationSource = "hosted",
  onGenerationSourceChange,
  canUseByo = false,
  onCopyPrompt,
  onExport,
  onGenerate,
  generateBusy = false,
}: Props) {
  const [section, setSection] = useState<ProWorkspaceSection>("scene");

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
        <ProWorkspaceNav
          lang={lang}
          section={section}
          onSectionChange={setSection}
        />
        <ProWorkspaceEditor
          lang={lang}
          section={section}
          project={project}
          scene={scene}
          sceneIdx={sceneIdx}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
          onUpdateScene={onUpdateScene}
          onRenameLayer={onRenameLayer}
          onJumpToConflict={onJumpToConflict}
          editT={editT}
          setEditT={setEditT}
          platformId={platformId}
          onPlatformChange={onPlatformChange}
          exportMode={exportMode}
          onExportModeChange={onExportModeChange}
          generationSource={generationSource}
          onGenerationSourceChange={onGenerationSourceChange}
          canUseByo={canUseByo}
          onCopyPrompt={onCopyPrompt}
          onExport={onExport}
          onGenerate={onGenerate}
          generateBusy={generateBusy}
        />
        <ProWorkspaceStatusRail
          lang={lang}
          project={project}
          scene={scene}
          platformId={platformId}
        />
      </div>

      {bottomSlot ? (
        <div
          style={{
            borderTop: `1px solid ${FIGMA_COLORS.border}`,
            background: FIGMA_COLORS.panel,
            padding: `${PRO_FIELD_GAP}px ${PRO_BOTTOM_BAR_PADDING}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: PRO_SECTION_GAP,
            flexShrink: 0,
          }}
        >
          {bottomSlot}
        </div>
      ) : null}

      {exportPanelSlot}
    </div>
  );
}
