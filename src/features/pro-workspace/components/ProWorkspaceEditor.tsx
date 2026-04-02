import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, Layer } from "../../../model";
import type { PlatformPresetId } from "../../../config/platformPresets";
import type { ProWorkspaceSection } from "../types";
import type { ExportMode } from "./ExportModeSection";
import type { GenerationSource } from "./EngineSelectSection";

// ── Workflow panels (new ordered flow) ──────────────────────────────────────
import { ShotPanel }        from "./ShotPanel";
import { DirectorPanel }    from "./DirectorPanel";
import { OutputTypePanel }  from "./OutputTypePanel";
import { CameraLangPanel }  from "./CameraLangPanel";
import { SceneBgPanel }     from "./SceneBgPanel";
import { ObjectEditorPanel }from "./ObjectEditorPanel";
import { LightingPanel }    from "./LightingPanel";
import { StylePanel }       from "./StylePanel";
import { TechPanel }        from "./TechPanel";

// ── Tool panels (existing, kept as-is) ─────────────────────────────────────
import { CompositionEditorPanel }  from "./CompositionEditorPanel";
import { ConstraintInspectorPanel }from "./ConstraintInspectorPanel";
import { PromptPreviewPanel }      from "./PromptPreviewPanel";
import { ExportControlPanel }      from "./ExportControlPanel";
import { PlatformAdaptPanel }      from "./PlatformAdaptPanel";
import { Stage }                   from "../../../components/Stage";
import { FIGMA_COLORS, PRO_PANEL_PADDING, PRO_SECTION_GAP, PRO_BOTTOM_PANEL_HEIGHT } from "../constants";

type Props = {
  lang: Lang;
  section: ProWorkspaceSection;
  project: Project | null;
  scene: Scene;
  sceneIdx: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onRenameLayer?: (oldId: string, newId: string) => void;
  onJumpToConflict?: (layerId: string | null) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
  platformId: string;
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

export function ProWorkspaceEditor({
  lang, section, project, scene, sceneIdx,
  selectedLayerId, onSelectLayer, onUpdateScene, onRenameLayer, onJumpToConflict,
  editT, setEditT, platformId, onPlatformChange,
  exportMode = "prompt_only", onExportModeChange,
  generationSource = "hosted", onGenerationSourceChange,
  canUseByo = false, onCopyPrompt, onExport, onGenerate, generateBusy = false,
}: Props) {

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    const layers = [...(scene.layers ?? [])];
    const idx = layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return;
    layers[idx] = { ...layers[idx], ...patch };
    onUpdateScene({ ...scene, layers });
  };

  const content = (() => {
    // ── Workflow sections ──────────────────────────────────────────────────
    switch (section) {
      case "shot":
        return <ShotPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "director":
        return <DirectorPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "output":
        return <OutputTypePanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "camera_lang":
        return <CameraLangPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "scene_bg":
        return <SceneBgPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "objects":
        return (
          <ObjectEditorPanel
            lang={lang} scene={scene} project={project}
            selectedLayerId={selectedLayerId} onSelectLayer={onSelectLayer}
            onUpdateScene={onUpdateScene} onUpdateLayer={updateLayer} onRenameLayer={onRenameLayer}
          />
        );

      case "lighting":
        return <LightingPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "style":
        return <StylePanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      case "tech":
        return <TechPanel lang={lang} scene={scene} project={project} onUpdateScene={onUpdateScene} />;

      // ── Tool sections (unchanged logic) ──────────────────────────────────
      case "composition":
        return (
          <CompositionEditorPanel
            lang={lang} scene={scene} project={project}
            selectedLayerId={selectedLayerId} onSelectLayer={onSelectLayer}
            onUpdateScene={onUpdateScene} onUpdateLayer={updateLayer}
            editT={editT} setEditT={setEditT}
          />
        );

      case "constraints":
        return (
          <ConstraintInspectorPanel
            lang={lang} scene={scene} project={project}
            selectedLayerId={selectedLayerId} onJumpToConflict={onJumpToConflict}
            onUpdateScene={onUpdateScene}
          />
        );

      case "prompt_preview":
        return (
          <PromptPreviewPanel
            lang={lang} project={project} scene={scene}
            platformId={platformId} onCopyPrompt={onCopyPrompt}
          />
        );

      case "platform":
        return (
          <PlatformAdaptPanel
            lang={lang} project={project} scene={scene}
            platformId={platformId as PlatformPresetId}
            exportMode={exportMode} generationSource={generationSource}
          />
        );

      case "export":
        return (
          <ExportControlPanel
            lang={lang} project={project} scene={scene}
            platformId={platformId as PlatformPresetId}
            onPlatformChange={onPlatformChange ?? (() => {})}
            exportMode={exportMode} onExportModeChange={onExportModeChange ?? (() => {})}
            generationSource={generationSource as any} onGenerationSourceChange={(onGenerationSourceChange as any) ?? (() => {})}
            canUseByo={canUseByo ?? false}
            onCopy={onCopyPrompt ?? (() => {})}
            onExport={onExport ?? (() => {})}
            onGenerate={onGenerate ?? (() => {})}
            generateBusy={generateBusy ?? false}
          />
        );

      default:
        return null;
    }
  })();

  const showStage = section === "composition";

  return (
    <section
      style={{
        flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
        background: FIGMA_COLORS.bg, overflow: "hidden",
      }}
    >
      {showStage ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              flex: 1, minHeight: 160, position: "relative", background: FIGMA_COLORS.bg,
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          >
            <Stage
              project={project} lang={lang} scene={scene}
              selectedLayerId={selectedLayerId} onSelectLayer={onSelectLayer}
              onUpdateScene={onUpdateScene} editT={editT} className="pro-workspace-stage"
            />
          </div>
          <div
            className="pro-rail-scroll"
            style={{
              borderTop: `1px solid ${FIGMA_COLORS.border}`, background: FIGMA_COLORS.panel,
              padding: `${PRO_SECTION_GAP}px ${PRO_PANEL_PADDING}px`,
              minHeight: PRO_BOTTOM_PANEL_HEIGHT, maxHeight: PRO_BOTTOM_PANEL_HEIGHT,
            }}
          >
            {content}
          </div>
        </div>
      ) : (
        <div className="pro-rail-scroll" style={{ flex: 1, padding: PRO_PANEL_PADDING }}>
          {content}
        </div>
      )}
    </section>
  );
}
