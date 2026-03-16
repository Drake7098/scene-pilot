import { useState, useMemo } from "react";
import type { Lang } from "../i18n";
import type { Project, Scene } from "../model";
import { defaultProject, sanitizeProject, resolveSceneConfig } from "../model";
import { loadProject, saveProject } from "../utils/storage";
import { PLATFORM_PRESETS } from "../config/platformPresets";
import type { PlatformPresetId } from "../config/platformPresets";
import type { ExportMode } from "../utils/exportViewModel";
import type { PromptExportScope } from "../types/export";
import type { TemplateWorkspaceState } from "../features/template-workspace";
import { DEFAULT_TEMPLATE_WORKSPACE_STATE } from "../features/template-workspace";

const SAVE_PLATFORM_KEY = "sp_save_prompt_platform";
const PROJECT_SAVE_PLATFORM_LOCK_KEY = "sp_project_save_platform_locked";
const PLATFORM_OPTIONS = PLATFORM_PRESETS.map((p) => p.id) as PlatformPresetId[];

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

export function useProjectState(lang: Lang) {
  const [project, setProject] = useState<Project>(() => loadProject() ?? defaultProject());
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editT, setEditT] = useState<0 | 1>(0);
  const [fileLabel, setFileLabel] = useState<string>(() => {
    try { return localStorage.getItem("scene_pilot_last_file_label") || ""; } catch { return ""; }
  });
  const [savePlatformId, setSavePlatformId] = useState<PlatformPresetId>(() => {
    try {
      const raw = localStorage.getItem(SAVE_PLATFORM_KEY) as PlatformPresetId | null;
      return raw && PLATFORM_OPTIONS.includes(raw) ? raw : "universal";
    } catch { return "universal"; }
  });
  const [projectSavePlatformLocked, setProjectSavePlatformLocked] = useState<boolean>(() => {
    try { return localStorage.getItem(PROJECT_SAVE_PLATFORM_LOCK_KEY) === "1"; } catch { return false; }
  });
  const [proExportMode, setProExportMode] = useState<ExportMode>("prompt_only");
  const [proExportScope, setProExportScope] = useState<PromptExportScope>("current_scene");
  const [openExportNonce, setOpenExportNonce] = useState(0);
  const [openExportAction, setOpenExportAction] = useState("open");
  const [miniPreviewCollapsed, setMiniPreviewCollapsed] = useState(true);
  const [isTemplateWorkspaceOpen, setIsTemplateWorkspaceOpen] = useState(false);
  const [templateWorkspaceState, setTemplateWorkspaceState] = useState<TemplateWorkspaceState>(DEFAULT_TEMPLATE_WORKSPACE_STATE);
  const [templatesRefresh, setTemplatesRefresh] = useState(0);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [renameProjectDraft, setRenameProjectDraft] = useState("");
  const [savePlatformModalOpen, setSavePlatformModalOpen] = useState(false);
  const [savePlatformPickMode, setSavePlatformPickMode] = useState<"save" | "save_as" | "save_all">("save");
  const [pendingSavePlatformId, setPendingSavePlatformId] = useState<PlatformPresetId>("universal");
  const [newProjectConfirmOpen, setNewProjectConfirmOpen] = useState(false);
  const [newProjectConfirmBusy, setNewProjectConfirmBusy] = useState(false);

  const safeProject = useMemo(() => {
    if (project.scenes && project.scenes.length > 0) return project;
    return defaultProject();
  }, [project]);

  const scene: Scene = useMemo(() => {
    const list = safeProject.scenes;
    const idx = clampInt(sceneIdx, 0, Math.max(0, list.length - 1));
    return list[idx] ?? list[0];
  }, [safeProject, sceneIdx]);

  const sceneNo = useMemo(
    () => clampInt(sceneIdx, 0, Math.max(0, safeProject.scenes.length - 1)) + 1,
    [sceneIdx, safeProject.scenes.length]
  );

  const mediaMode = useMemo<"image" | "video">(
    () => resolveSceneConfig(scene).mediaMode,
    [scene]
  );

  function updateProject(next: Project) {
    setProject(next);
    saveProject(next);
  }

  function updateScene(nextScene: Scene) {
    const idx = clampInt(sceneIdx, 0, Math.max(0, safeProject.scenes.length - 1));
    updateProject({
      ...safeProject,
      scenes: safeProject.scenes.map((s, i) => (i === idx ? nextScene : s)),
    });
  }

  function setLabelPersist(label: string) {
    setFileLabel(label);
    try {
      if (label) localStorage.setItem("scene_pilot_last_file_label", label);
      else localStorage.removeItem("scene_pilot_last_file_label");
    } catch { /* ignore */ }
  }

  function syncSavePlatform(id: PlatformPresetId) {
    setSavePlatformId(id);
    try { localStorage.setItem(SAVE_PLATFORM_KEY, id); } catch { /* ignore */ }
  }

  function setProjectSavePlatformLockedPersist(next: boolean) {
    setProjectSavePlatformLocked(next);
    try { localStorage.setItem(PROJECT_SAVE_PLATFORM_LOCK_KEY, next ? "1" : "0"); } catch { /* ignore */ }
  }

  return {
    project, safeProject, scene, sceneNo, mediaMode,
    sceneIdx, setSceneIdx,
    selectedLayerId, setSelectedLayerId,
    editT, setEditT,
    fileLabel, setFileLabel, setLabelPersist,
    savePlatformId, syncSavePlatform,
    projectSavePlatformLocked, setProjectSavePlatformLockedPersist,
    proExportMode, setProExportMode,
    proExportScope, setProExportScope,
    openExportNonce, setOpenExportNonce,
    openExportAction, setOpenExportAction,
    miniPreviewCollapsed, setMiniPreviewCollapsed,
    isTemplateWorkspaceOpen, setIsTemplateWorkspaceOpen,
    templateWorkspaceState, setTemplateWorkspaceState,
    templatesRefresh, setTemplatesRefresh,
    renameProjectOpen, setRenameProjectOpen,
    renameProjectDraft, setRenameProjectDraft,
    savePlatformModalOpen, setSavePlatformModalOpen,
    savePlatformPickMode, setSavePlatformPickMode,
    pendingSavePlatformId, setPendingSavePlatformId,
    newProjectConfirmOpen, setNewProjectConfirmOpen,
    newProjectConfirmBusy, setNewProjectConfirmBusy,
    updateProject,
    updateScene,
    sanitizeProject,
  };
}
