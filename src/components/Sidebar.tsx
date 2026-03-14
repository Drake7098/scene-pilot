import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { resolveSceneConfig } from "../model";
import type { Project, Scene, Layer, ShotPlan, Direction, TransitionType } from "../model";
import { defaultObjectName, defaultSceneName } from "../utils/naming";
import { UI_ACTION, UI_COLOR, UI_CONTROL, UI_EFFECT, UI_FONT, UI_INFO, UI_OPACITY, UI_PALETTE, UI_RADIUS, UI_SIZE, UI_SPACE, UI_STATUS, UI_TYPO, PRO_TYPO } from "../uiTokens";
import {
  PRO_PLUS_MOTION_CATEGORIES,
  applyProMotionSelection,
  getProCameraPreset,
  parseProMotionSelection,
  proMotionDesc,
  proMotionLabel
} from "../content/proCameraPresets";
import {
  IMAGE_PRO_CATEGORIES,
  applyImageProEffects,
  applyImageClassicMode,
  applyVideoClassicMode,
  disabledImageEffectIds,
  disabledVideoProPlusIds,
  getImageClassicModes,
  parseImageClassicModeId,
  getImageProEffect,
  getImageProEffectsByCategory,
  parseVideoClassicModeId,
  setImageClassicModeMarker,
  setVideoClassicModeMarker,
  getVideoClassicModes,
  getVisibleVideoProPlusPresets,
  parseImageProEffects,
  syncImageClassicMode,
  syncVideoClassicMode
} from "../content/proCreativeModes";
import {
  DIRECTOR_STYLE_PACKS,
  applyDirectorStylePack,
  directorStylePackLabel,
  parseDirectorStylePackId,
  type DirectorStylePackId
} from "../content/directorStylePacks";
import {
  getUserVisibleCameraLanguageOptions,
  parseCameraLanguageId,
  applyCameraLanguage,
  normalizeForUserSelection,
  isUserVisibleCameraLanguage
} from "../content/cameraLanguageLayers";
import { resolveSceneStrategy } from "../utils/sceneStrategyResolver";
import { TemplateSidebarEntry, CurrentTemplateContext } from "../features/template-workspace";
import type { TemplateIndex } from "../features/template-workspace";
import type { SceneTemplate } from "../model/template";
import { useProCollapseSections } from "../hooks/useProCollapseSections";
import { EditorSection, EditorSelect, EditorInput, EditorCheckbox } from "./ui";
import { ContinuityPanel } from "./ContinuityPanel";
import { editorTheme } from "../theme/editorTheme";
import { Film, LayoutGrid, Layers, Camera, Settings, Play, Plus, Minus, ChevronDown, ChevronRight, Save, Copy, Download, FilePlus2, FolderOpen, PencilLine, Sun } from "lucide-react";

type Props = {
  lang: Lang;
  project: Project;
  sceneIdx: number;
  setSceneIdx: (i: number) => void;
  onUpdateProject: (p: Project) => void;

  scene: Scene;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;

  isPro?: boolean;
  onLockedTemplateClick?: (template: SceneTemplate) => void;
  onRequestSaveTemplate?: () => boolean;
  onTrackTemplate?: (event: string, props?: Record<string, unknown>) => void;
  projectLabel?: string;
  isMac?: boolean;
  onOpenProject?: () => void;
  onRenameProject?: () => void;
  onNewProject?: () => void;
  onSaveProject?: () => void;
  onSaveAs?: () => void;
  onCopyPrompt?: () => void;
  onExportProject?: () => void;
  onOpenLibrary?: () => void;
  onOpenTemplateWorkspace?: () => void;
  onOpenTemplateWorkspaceWithTemplate?: (templateId: string) => void;
  onUseTemplateFromEntry?: (item: TemplateIndex | import("../data/templateWorkspaceData").TemplateWorkspaceItem) => void;
};

function isComposing(e: any) {
  return !!e?.nativeEvent?.isComposing;
}
function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}
function nextId(prefix: string, exists: (id: string) => boolean) {
  for (let i = 1; i < 9999; i++) {
    const id = `${prefix}${i}`;
    if (!exists(id)) return id;
  }
  return `${prefix}${Math.floor(Math.random() * 9999)}`;
}
function fmtDuration(lang: Lang, s: number) {
  const n = Math.max(0, Math.round(Number(s) || 0));
  return lang === "zh" ? `${n}秒` : `${n}s`;
}

function formatSceneRowName(sceneNo: string, name: string | undefined, fallbackId: string) {
  void sceneNo;
  const n = (name ?? "").trim();
  if (!n) return fallbackId;
  return n;
}

function kf0(layer: Layer) {
  return (layer.kf ?? []).find((k) => k.t === 0) ?? layer.kf?.[0] ?? { x: 50, y: 50, w: 24, h: 24 };
}

function suggestSpawnKf(layers: Layer[]) {
  const w = 24;
  const h = 24;
  let best = { x: 50, y: 50, w, h };
  for (let i = 0; i < 24; i++) {
    const x = 50 + (Math.random() * 30 - 15);
    const y = 50 + (Math.random() * 20 - 10);
    const candidate = { x: Math.max(18, Math.min(82, x)), y: Math.max(18, Math.min(82, y)), w, h };
    const minDist = (layers ?? []).reduce((m, l) => {
      const k = kf0(l);
      const d = Math.hypot(k.x - candidate.x, k.y - candidate.y);
      return Math.min(m, d);
    }, 9999);
    if (minDist > 14) return candidate;
    if (minDist > 8) best = candidate;
  }
  return best;
}

function buildDefaultObjectLayer(lang: Lang, layers: Layer[], seedLabel?: string): Layer {
  const nextIndex = Math.max(1, layers.length + 1);
  const id = (seedLabel ?? "").trim() || defaultObjectName(lang, nextIndex);
  return {
    id,
    type: (seedLabel ?? "").trim() || (lang === "zh" ? "主体" : "subject"),
    shape: "rect",
    shapeDesc: "",
    look: "",
    z: layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 10,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, x: 50, y: 50, w: 24, h: 24, rot: 0 },
      { t: 1, x: 50, y: 50, w: 24, h: 24, rot: 0 }
    ],
    notes: "",
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

// -------------------- Media mode marker in scene.notes --------------------
type MediaMode = "image" | "video";
type GenMode = "quick" | "pro";
const GEN_MARK = "genmode:";

function parseMedia(scene: Scene): MediaMode {
  return resolveSceneConfig(scene).mediaMode;
}

function parseGenMode(notes: string): GenMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(GEN_MARK));
  if (!hit) return "quick";
  const v = hit.trim().slice(GEN_MARK.length).trim().toLowerCase();
  return v === "pro" ? "pro" : "quick";
}

function setGenMode(notes: string, mode: GenMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(GEN_MARK));
  return [`${GEN_MARK} ${mode}`, ...rest].join("\n");
}

// -------------------- Stability marker in scene.notes --------------------
type FloatingHintTone = "info" | "danger";

const IMAGE_PRO_PLUS_CATEGORY_IDS = new Set(["psychology", "surreal_material", "body_perception"]);
const MAX_SCENES = 6;
const MAX_LAYERS_PER_SCENE = 8;

// -------------------- New Scene Draft UI --------------------
type NewSceneDraft = {
  open: boolean;
  mode: MediaMode;
  genMode: GenMode;
  locationScope: "same" | "different";
  cameraTravel: "angle_only" | "travel";
  allowJump: "yes" | "no";
  shotCount: string;
  name: string;
  duration_s: string; // for input
};

function defaultShotCountForPlan(plan: ShotPlan): number {
  if (plan === "single") return 1;
  if (plan === "continuous") return 4;
  return 3;
}

function resolveShotPlanFromDraft(draft: NewSceneDraft): ShotPlan {
  if (draft.mode === "image") return "single";
  if (draft.locationScope === "same") {
    return draft.cameraTravel === "travel" ? "continuous" : "multicam";
  }
  return draft.allowJump === "yes" ? "edit" : "continuous";
}

function defaultTransitionByPlan(plan: ShotPlan): TransitionType {
  if (plan === "continuous") return "camera_continues";
  if (plan === "multicam") return "reverse_angle";
  if (plan === "edit") return "cut";
  return "cut";
}

function defaultRefInheritByPlan(plan: ShotPlan, isFirst: boolean) {
  if (isFirst || plan === "single") {
    return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "off" as const };
  }
  if (plan === "multicam" || plan === "continuous") {
    return { inheritBgRefFromPrevious: true, inheritObjectRefsFromPrevious: "all" as const };
  }
  return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "identity_only" as const };
}

function transitionLabel(lang: Lang, t: TransitionType | undefined) {
  const v = t ?? "cut";
  if (lang === "zh") {
    if (v === "reverse_angle") return "反打";
    if (v === "camera_continues") return "连续推进";
    if (v === "dissolve") return "叠化";
    if (v === "time_jump") return "时间跳转";
    return "切换";
  }
  if (v === "reverse_angle") return "Reverse";
  if (v === "camera_continues") return "Continue";
  if (v === "dissolve") return "Dissolve";
  if (v === "time_jump") return "Time Jump";
  return "Cut";
}

export function Sidebar(props: Props) {
  const {
    lang,
    project,
    sceneIdx,
    setSceneIdx,
    onUpdateProject,
    scene,
    selectedLayerId,
    onSelectLayer,
    onUpdateScene,
    isPro = false,
    onLockedTemplateClick,
    onRequestSaveTemplate,
    onTrackTemplate,
    projectLabel,
    isMac = false,
    onOpenProject,
    onRenameProject,
    onNewProject,
    onSaveProject,
    onSaveAs,
    onCopyPrompt,
    onExportProject,
    onOpenLibrary,
    onOpenTemplateWorkspace,
    onOpenTemplateWorkspaceWithTemplate,
    onUseTemplateFromEntry
  } = props;

  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);
  const scenes = project.scenes ?? [];
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [sceneNameDraft, setSceneNameDraft] = useState("");

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [layerIdDraft, setLayerIdDraft] = useState("");

  const [editingDurSceneId, setEditingDurSceneId] = useState<string | null>(null);
  const [durDraft, setDurDraft] = useState<string>("");

  // per-scene markers (current scene)
  const projectShotPlan: ShotPlan = (project.project?.shotPlan as ShotPlan) ?? "single";
  const projectMediaType: MediaMode = (project.project?.mediaType as MediaMode) ?? "video";
  const sceneMediaType: MediaMode = resolveSceneConfig(scene).mediaMode;
  const activeMediaType: MediaMode = sceneMediaType || projectMediaType;
  const isImageProject = activeMediaType === "image";
  const isVideoProject = activeMediaType === "video";
  const proMotionSelection = useMemo(() => parseProMotionSelection(scene.notes ?? ""), [scene.notes]);
  const imageProSelection = useMemo(() => parseImageProEffects(scene.notes ?? ""), [scene.notes]);
  const directorStylePackId = useMemo(() => parseDirectorStylePackId(scene.notes ?? ""), [scene.notes]);
  const videoClassicModes = useMemo(() => getVideoClassicModes(), []);
  const imageClassicModes = useMemo(() => getImageClassicModes(), []);
  const disabledProPlusIds = useMemo(
    () => disabledVideoProPlusIds((scene.camera?.shot ?? "").toString(), (scene.camera?.movement ?? "").toString(), proMotionSelection.proPlusIds),
    [proMotionSelection.proPlusIds, scene.camera?.movement, scene.camera?.shot]
  );
  const disabledImageIds = useMemo(() => disabledImageEffectIds(imageProSelection), [imageProSelection]);
  const selectedVideoClassicModeId = useMemo(() => parseVideoClassicModeId(scene.notes ?? "") ?? "", [scene.notes]);
  const selectedImageClassicModeId = useMemo(() => parseImageClassicModeId(scene.notes ?? "") ?? "", [scene.notes]);
  const [videoProMenuOpen, setVideoProMenuOpen] = useState(false);
  const [imageProMenuOpen, setImageProMenuOpen] = useState(false);
  const [videoProCategoryHover, setVideoProCategoryHover] = useState<string | null>(null);
  const [imageProCategoryHover, setImageProCategoryHover] = useState<string | null>(null);
  const [videoProOptionHover, setVideoProOptionHover] = useState<string | null>(null);
  const [imageProOptionHover, setImageProOptionHover] = useState<string | null>(null);
  const videoProMenuRef = useRef<HTMLDivElement | null>(null);
  const imageProMenuRef = useRef<HTMLDivElement | null>(null);
  const videoProTriggerRef = useRef<HTMLButtonElement | null>(null);
  const imageProTriggerRef = useRef<HTMLButtonElement | null>(null);
  const videoProPopupRef = useRef<HTMLDivElement | null>(null);
  const imageProPopupRef = useRef<HTMLDivElement | null>(null);
  const [videoProCategoryTop, setVideoProCategoryTop] = useState(0);
  const [imageProCategoryTop, setImageProCategoryTop] = useState(0);

  // ✅ NEW: add scene mini panel
  const [newScene, setNewScene] = useState<NewSceneDraft>({
    open: false,
    mode: "video",
    genMode: "quick",
    locationScope: "same",
    cameraTravel: "angle_only",
    allowJump: "yes",
    shotCount: "1",
    name: "",
    duration_s: "6"
  });
  const [newSceneModeTouched, setNewSceneModeTouched] = useState(false);
  const [newSceneGenModeTouched, setNewSceneGenModeTouched] = useState(false);
  const [showGenHint, setShowGenHint] = useState(false);

  // ✅ 替代 alert/confirm：轻量 toast + 自定义确认框
  const [toastText, setToastText] = useState<string>("");
  const toastTimerRef = useRef<number | null>(null);
  const [floatingHint, setFloatingHint] = useState<{ text: string; top: number; left: number; tone: FloatingHintTone } | null>(null);
  const floatingHintTimerRef = useRef<number | null>(null);
  const deleteHintAnchorRef = useRef<HTMLElement | null>(null);

  const [confirmDelIdx, setConfirmDelIdx] = useState<number | null>(null);
  const sceneLimitReached = scenes.length >= MAX_SCENES;
  const layerLimitReached = (scene.layers ?? []).length >= MAX_LAYERS_PER_SCENE;
  const remainingSceneSlots = Math.max(0, MAX_SCENES - scenes.length);

  function sceneLimitText() {
    return lang === "zh" ? `分镜最多 ${MAX_SCENES} 个` : `Max ${MAX_SCENES} shots`;
  }

  function layerLimitText() {
    return lang === "zh" ? `单分镜对象最多 ${MAX_LAYERS_PER_SCENE} 个` : `Max ${MAX_LAYERS_PER_SCENE} objects per shot`;
  }

  useEffect(() => {
    setVideoProMenuOpen(false);
    setImageProMenuOpen(false);
    setVideoProCategoryHover(null);
    setImageProCategoryHover(null);
    setVideoProOptionHover(null);
    setImageProOptionHover(null);
  }, [scene.id]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        videoProMenuRef.current &&
        !videoProMenuRef.current.contains(target) &&
        !videoProPopupRef.current?.contains(target)
      ) {
        setVideoProMenuOpen(false);
        setVideoProCategoryHover(null);
        setVideoProOptionHover(null);
      }
      if (
        imageProMenuRef.current &&
        !imageProMenuRef.current.contains(target) &&
        !imageProPopupRef.current?.contains(target)
      ) {
        setImageProMenuOpen(false);
        setImageProCategoryHover(null);
        setImageProOptionHover(null);
      }
    };
    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVideoProMenuOpen(false);
        setImageProMenuOpen(false);
        setVideoProCategoryHover(null);
        setImageProCategoryHover(null);
        setVideoProOptionHover(null);
        setImageProOptionHover(null);
      }
    };
    window.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onDocKeyDown);
    return () => {
      window.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  function projectMediaDefault(): MediaMode {
    return project.project?.mediaType === "image" ? "image" : "video";
  }
  function projectShotPlanDefault(): ShotPlan {
    const p = project.project?.shotPlan as ShotPlan;
    if (p === "single" || p === "multicam" || p === "continuous" || p === "edit") return p;
    return "single";
  }

  function addSceneByProjectDefaults(anchorEl: HTMLElement | null) {
    if (sceneLimitReached) {
      showFloatingHint(sceneLimitText(), anchorEl, "danger");
      return;
    }
    const mode = projectMediaDefault();
    const shotPlan = projectShotPlanDefault();
    const genMode: GenMode = parseGenMode(scene?.notes ?? "");
    const idxNo = scenes.length + 1;
    const name = defaultSceneName(lang, mode, idxNo);
    const copyLayers = JSON.parse(JSON.stringify(scene.layers ?? [])) as Layer[];
    const nextSceneObj: Scene = buildSceneSeed(mode, shotPlan, idxNo, name, genMode);
    if (mode === "video" && shotPlan === "multicam") {
      nextSceneObj.layers = copyLayers;
      nextSceneObj.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
    } else if (mode === "video" && shotPlan === "continuous") {
      nextSceneObj.layers = copyLayers;
      nextSceneObj.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
    } else if (mode === "video" && shotPlan === "edit") {
      nextSceneObj.layers = [buildDefaultObjectLayer(lang, [])];
    }
    if (!(nextSceneObj.layers ?? []).length) {
      nextSceneObj.layers = [buildDefaultObjectLayer(lang, [])];
    }

    const next: Project = {
      ...project,
      scenes: [...scenes, nextSceneObj].map((s, i) => ({ ...s, index: i + 1 }))
    };
    onUpdateProject(next);
    setSceneIdx(next.scenes.length - 1);
    onSelectLayer(null);
    showFloatingHint(lang === "zh" ? "已新增分镜" : "Shot added", anchorEl, "info");
  }

  function showToast(text: string) {
    setToastText(text);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(""), 1400);
  }

  function showFloatingHint(text: string, anchorEl: HTMLElement | null, tone: FloatingHintTone = "info") {
    if (!anchorEl) {
      showToast(text);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const safeLeft = Math.max(18, Math.min(window.innerWidth - 18, centerX));
    setFloatingHint({
      text,
      top: rect.bottom + 8,
      left: safeLeft,
      tone
    });
    if (floatingHintTimerRef.current != null) window.clearTimeout(floatingHintTimerRef.current);
    floatingHintTimerRef.current = window.setTimeout(() => setFloatingHint(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
      if (floatingHintTimerRef.current != null) window.clearTimeout(floatingHintTimerRef.current);
    };
  }, []);

  function commitSceneName(sid: string) {
    const name = sceneNameDraft.trim();
    if (!name) {
      setEditingSceneId(null);
      return;
    }
    onUpdateProject({
      ...project,
      scenes: scenes.map((s) => (s.id === sid ? { ...s, name } : s))
    });
    setEditingSceneId(null);
  }

  function commitSceneDuration(sid: string) {
    const raw = Number(durDraft);
    const duration_s = Math.max(0, Math.round(Number.isFinite(raw) ? raw : 0));
    onUpdateProject({
      ...project,
      scenes: scenes.map((s) => (s.id === sid ? { ...s, duration_s } : s))
    });
    setEditingDurSceneId(null);
    if (duration_s > 20) {
      showToast(lang === "zh" ? "已更新时长，建议单镜头时长不宜过长。" : "Duration updated. Keep single-shot duration reasonable.");
    }
  }

  function commitLayerId(oldId: string) {
    const nextIdVal = layerIdDraft.trim();
    if (!nextIdVal || nextIdVal === oldId) {
      setEditingLayerId(null);
      return;
    }
    const exists = (scene.layers ?? []).some((l) => l.id === nextIdVal);
    if (exists) return;

    const nextLayers = (scene.layers ?? []).map((l) => (l.id === oldId ? { ...l, id: nextIdVal } : l));
    onUpdateScene({ ...scene, layers: nextLayers });
    if (selectedLayerId === oldId) onSelectLayer(nextIdVal);
    setEditingLayerId(null);
  }

  function cancelAddScenePanel() {
    setNewScene((s) => ({ ...s, open: false }));
    setNewSceneModeTouched(false);
    setNewSceneGenModeTouched(false);
    setShowGenHint(false);
  }

  function confirmAddScene(anchorEl: HTMLElement | null) {
    if (remainingSceneSlots <= 0) {
      showFloatingHint(sceneLimitText(), anchorEl, "danger");
      return;
    }
    const mode: MediaMode = newScene.mode;
    const fallbackName = defaultSceneName(lang, mode, scenes.length + 1);
    const name = (newScene.name ?? "").trim() || fallbackName;
    const genMode: GenMode = newScene.genMode;
    const shotPlan: ShotPlan = resolveShotPlanFromDraft(newScene);

    // ✅ keep data stable: even image keeps duration_s in data, but UI badge won't show it
    const duration_s = mode === "video" ? Math.max(0, Math.round(Number(newScene.duration_s) || 0)) : 6;
    const askedCount = Math.max(1, Math.round(Number(newScene.shotCount) || defaultShotCountForPlan(shotPlan)));
    const shotCount =
      mode === "image" || shotPlan === "single" ? 1 : Math.max(2, askedCount);
    const allowedShotCount = Math.min(shotCount, remainingSceneSlots);
    if (allowedShotCount < shotCount) {
      showToast(
        lang === "zh"
          ? `超出分镜上限，已按剩余名额创建 ${allowedShotCount} 个`
          : `Shot limit reached. Creating ${allowedShotCount} with the remaining slots.`
      );
    }
    const baseLayers = JSON.parse(JSON.stringify(scene.layers ?? [])) as Layer[];

    const makeBaseScene = (sceneName: string, index: number): Scene => {
      const base = buildSceneSeed(mode, shotPlan, index, sceneName, genMode);
      base.id = nextId("s", (x) => scenes.some((s) => s.id === x) || addedScenes.some((s) => s.id === x));
      base.duration_s = duration_s;
      return base;
    };

    const addedScenes: Scene[] = [];
    if (mode === "video" && allowedShotCount > 1) {
      for (let i = 0; i < allowedShotCount; i++) {
        const idxNo = scenes.length + i + 1;
        const s = makeBaseScene(defaultSceneName(lang, mode, idxNo), idxNo);
        if (shotPlan === "multicam") {
          s.layers = JSON.parse(JSON.stringify(baseLayers));
          s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
        } else if (shotPlan === "continuous") {
          s.layers = JSON.parse(JSON.stringify(baseLayers));
          s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
        }
        if (shotPlan === "edit") {
          s.layers = i === 0 ? JSON.parse(JSON.stringify(baseLayers)) : [buildDefaultObjectLayer(lang, [])];
        }
        if (!(s.layers ?? []).length) s.layers = [buildDefaultObjectLayer(lang, [])];
        addedScenes.push(s);
      }
      if (addedScenes.length) addedScenes[addedScenes.length - 1].exitDir = undefined;
    } else {
      const s = makeBaseScene(mode === "video" ? defaultSceneName(lang, "video", scenes.length + 1) : name, scenes.length + 1);
      if (shotPlan === "multicam") {
        s.layers = JSON.parse(JSON.stringify(baseLayers));
        s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
      } else if (shotPlan === "continuous") {
        s.layers = JSON.parse(JSON.stringify(baseLayers));
        s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
      }
      if (!(s.layers ?? []).length) s.layers = [buildDefaultObjectLayer(lang, [])];
      addedScenes.push(s);
    }

    const next: Project = {
      ...project,
      project: {
        ...project.project,
        mediaType: mode,
        shotPlan: mode === "video" ? shotPlan : "single"
      },
      scenes: [...scenes, ...addedScenes].map((s, i) => ({ ...s, index: i + 1 }))
    };
    onUpdateProject(next);
    setSceneIdx(scenes.length);
    onSelectLayer(null);

    setNewScene((s) => ({ ...s, open: false }));
    setNewSceneModeTouched(false);
    setNewSceneGenModeTouched(false);
    setShowGenHint(false);
    showFloatingHint(tt("sidebar.sceneCreated"), anchorEl, "info");
  }

  // ✅ 修复：删除分镜不用 window.confirm（同样是怪弹窗）
  function requestDeleteScene(idx: number, anchorEl: HTMLElement | null) {
    if (scenes.length <= 1) return;
    deleteHintAnchorRef.current = anchorEl;
    setConfirmDelIdx(idx);
  }
  function doDeleteScene(idx: number) {
    if (scenes.length <= 1) return;
    const nextScenes = scenes.filter((_, i) => i !== idx);
    onUpdateProject({ ...project, scenes: nextScenes });
    setSceneIdx(Math.max(0, idx - 1));
    onSelectLayer(null);
    setConfirmDelIdx(null);
    showFloatingHint(tt("sidebar.sceneDeleted"), deleteHintAnchorRef.current, "danger");
  }

  function addLayer() {
    const layers = scene.layers ?? [];
    if (layers.length >= MAX_LAYERS_PER_SCENE) {
      showToast(layerLimitText());
      return;
    }
    const spawn = suggestSpawnKf(layers);
    const newLayer = buildDefaultObjectLayer(lang, layers);
    let objectNo = 1;
    let nextName = defaultObjectName(lang, objectNo);
    while (layers.some((l) => l.id === nextName)) {
      objectNo += 1;
      nextName = defaultObjectName(lang, objectNo);
    }
    newLayer.id = nextName;
    newLayer.kf = [
      { t: 0, x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h, rot: 0 },
      { t: 1, x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h, rot: 0 }
    ];

    onUpdateScene({ ...scene, layers: [...layers, newLayer] });
    onSelectLayer(newLayer.id);

    // 可选提示：新对象已创建（不想要就删）
    // showToast(lang === "zh" ? "已添加对象" : "Object added");
  }

  function deleteLayer(layerId: string) {
    const layers = scene.layers ?? [];
    onUpdateScene({ ...scene, layers: layers.filter((l) => l.id !== layerId) });
    if (selectedLayerId === layerId) onSelectLayer(null);
    showToast(tt("sidebar.objectDeleted"));
  }

  const shotOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "wide", label: tt("opt.wide") },
      { v: "medium", label: tt("opt.medium") },
      { v: "close", label: tt("opt.close") },
      { v: "extreme_close", label: tt("opt.extreme_close") },
      { v: "over_shoulder", label: tt("opt.over_shoulder") },
      { v: "pov", label: lang === "zh" ? "主观视角 (POV)" : "POV" },
      { v: "insert_closeup", label: lang === "zh" ? "插入特写" : "Insert close-up" },
      { v: "establishing", label: lang === "zh" ? "建立镜头" : "Establishing shot" },
      { v: "dutch_angle", label: tt("opt.dutch_angle") }
    ],
    [lang, tt]
  );
  const moveOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "static", label: tt("opt.static") },
      { v: "slow_push_in", label: tt("opt.slow_push_in") },
      { v: "slow_pull_out", label: tt("opt.slow_pull_out") },
      { v: "pan_left", label: tt("opt.pan_left") },
      { v: "pan_right", label: tt("opt.pan_right") },
      { v: "tilt_up", label: tt("opt.tilt_up") },
      { v: "tilt_down", label: tt("opt.tilt_down") },
      { v: "handheld", label: tt("opt.handheld") },
      { v: "orbit", label: tt("opt.orbit") }
    ],
    [tt]
  );
  const timeOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "day", label: tt("opt.day") },
      { v: "dawn", label: tt("opt.dawn") },
      { v: "sunset", label: tt("opt.sunset") },
      { v: "golden_hour", label: tt("opt.golden_hour") },
      { v: "blue_hour", label: tt("opt.blue_hour") },
      { v: "night", label: tt("opt.night") }
    ],
    [tt]
  );
  const dirOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "top_left", label: tt("opt.top_left") },
      { v: "top_right", label: tt("opt.top_right") },
      { v: "bottom_left", label: tt("opt.bottom_left") },
      { v: "bottom_right", label: tt("opt.bottom_right") },
      { v: "backlight", label: tt("opt.backlight") },
      { v: "rim_light", label: tt("opt.rim_light") }
    ],
    [tt]
  );
  const moodOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "cinematic", label: tt("opt.cinematic") },
      { v: "mysterious", label: tt("opt.mysterious") },
      { v: "bright", label: tt("opt.bright") },
      { v: "dark", label: tt("opt.dark") },
      { v: "noir", label: tt("opt.noir") },
      { v: "warm", label: tt("opt.warm") },
      { v: "cold", label: tt("opt.cold") }
    ],
    [tt]
  );

  const currentShot = (scene.camera?.shot ?? "").toString();
  const currentMovement = (scene.camera?.movement ?? "").toString();
  const sceneStrategy = useMemo(
    () => resolveSceneStrategy(scene, lang, isVideoProject ? "video" : "image"),
    [scene, lang, isVideoProject]
  );
  const visibleShot = currentShot || sceneStrategy.defaults.shot || "";
  const visibleMovement = currentMovement || sceneStrategy.defaults.movement || "";
  const visibleTransition = (scene.transitionType ?? sceneStrategy.defaults.transitionType ?? defaultTransitionByPlan(projectShotPlan)).toString();
  const visibleLightingTime = (scene.lighting?.time ?? "").toString() || sceneStrategy.defaults.time || "";
  const visibleLightingKeyDir = (scene.lighting?.key_dir ?? "").toString() || sceneStrategy.defaults.keyDir || "";
  const visibleLightingMood = (scene.lighting?.mood ?? "").toString() || sceneStrategy.defaults.mood || "";
  const hasVideoManualClassic = !selectedVideoClassicModeId && Boolean(currentShot || currentMovement || proMotionSelection.proPlusIds.length);
  const hasImageManualClassic = !selectedImageClassicModeId && Boolean(currentShot || imageProSelection.length);
  const videoClassicSelectValue = selectedVideoClassicModeId || (hasVideoManualClassic ? "__manual__" : "");
  const imageClassicSelectValue = selectedImageClassicModeId || (hasImageManualClassic ? "__manual__" : "");

  function buildInheritedSceneNotes(mode: MediaMode, genMode: GenMode) {
    let nextNotes = setGenMode(`media: ${mode}`, genMode);
    if (mode !== activeMediaType) return nextNotes;
    nextNotes = applyDirectorStylePack(nextNotes, directorStylePackId ?? "");
    if (mode === "video") {
      nextNotes = setVideoClassicModeMarker(nextNotes, selectedVideoClassicModeId);
      nextNotes = applyProMotionSelection(nextNotes, proMotionSelection);
      return nextNotes;
    }
    nextNotes = setImageClassicModeMarker(nextNotes, selectedImageClassicModeId);
    nextNotes = applyImageProEffects(nextNotes, imageProSelection);
    return nextNotes;
  }

  function buildSceneSeed(mode: MediaMode, shotPlan: ShotPlan, idxNo: number, name: string, genMode: GenMode): Scene {
    return {
      id: nextId("s", (x) => scenes.some((s) => s.id === x)),
      index: idxNo,
      name,
      duration_s: Math.max(1, Math.round(Number(scene?.duration_s) || 6)),
      cameraPreset: mode === "video" ? "first-person" : "",
      inheritFromPrevious: mode === "video" && idxNo > 1 && (shotPlan === "multicam" || shotPlan === "continuous"),
      ...defaultRefInheritByPlan(shotPlan, mode !== "video" || idxNo <= 1),
      transitionType: mode === "video" ? (scene.transitionType ?? defaultTransitionByPlan(shotPlan)) : "cut",
      entryDir: mode === "video" && shotPlan === "continuous" && idxNo > 1 ? "E" : undefined,
      exitDir: mode === "video" && shotPlan === "continuous" ? "E" : undefined,
      camera: {
        shot: mode === activeMediaType ? visibleShot : "",
        movement: mode === "video" && mode === activeMediaType ? visibleMovement : "",
        keyframes: [
          { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
        ]
      } as any,
      lighting: {
        time: mode === activeMediaType ? visibleLightingTime : "",
        key_dir: mode === activeMediaType ? visibleLightingKeyDir : "",
        mood: mode === activeMediaType ? visibleLightingMood : ""
      } as any,
      layoutLocked: false,
      layers: [buildDefaultObjectLayer(lang, [])],
      config: {
        mediaMode: mode,
        compiler: mode === "video" ? "v2" : "v1",
        sceneTier: resolveSceneConfig(scene).sceneTier,
        v2Mode: resolveSceneConfig(scene).v2Mode
      },
      notes: buildInheritedSceneNotes(mode, genMode)
    };
  }

  function updateCameraField(field: "shot" | "movement", value: string) {
    const nextShot = field === "shot" ? value : currentShot;
    const nextMovement = field === "movement" ? value : currentMovement;
    const nextNotes = isVideoProject
      ? syncVideoClassicMode(scene.notes ?? "", nextShot, nextMovement, proMotionSelection.proPlusIds)
      : syncImageClassicMode(scene.notes ?? "", nextShot, imageProSelection);
    onUpdateScene({
      ...scene,
      camera: { ...scene.camera, [field]: value } as any,
      notes: nextNotes
    });
  }

  function pickVideoClassicMode(recipeId: string) {
    if (!recipeId) {
      const nextNotes = syncVideoClassicMode(scene.notes ?? "", currentShot, currentMovement, proMotionSelection.proPlusIds);
      onUpdateScene({ ...scene, notes: nextNotes });
      return;
    }
    const nextNotes = applyVideoClassicMode(scene.notes ?? "", currentShot, currentMovement, recipeId);
    const recipe = videoClassicModes.find((item) => item.id === recipeId);
    onUpdateScene({
      ...scene,
      camera: { ...scene.camera, shot: recipe?.shot ?? currentShot, movement: recipe?.movement ?? currentMovement } as any,
      notes: nextNotes
    });
  }

  function pickImageClassicMode(recipeId: string) {
    if (!recipeId) {
      const nextNotes = syncImageClassicMode(scene.notes ?? "", currentShot, imageProSelection);
      onUpdateScene({ ...scene, notes: nextNotes });
      return;
    }
    const nextNotes = applyImageClassicMode(scene.notes ?? "", currentShot, recipeId);
    const recipe = imageClassicModes.find((item) => item.id === recipeId);
    onUpdateScene({
      ...scene,
      camera: { ...scene.camera, shot: recipe?.shot ?? currentShot } as any,
      notes: nextNotes
    });
  }

  function selectVideoProPlusForCategory(categoryId: string, value: string) {
    const withoutCurrent = proMotionSelection.proPlusIds.filter((id) => getProCameraPreset(id)?.category !== categoryId);
    if (!value) {
      const nextNotes = syncVideoClassicMode(scene.notes ?? "", currentShot, currentMovement, withoutCurrent);
      onUpdateScene({ ...scene, notes: nextNotes });
      return;
    }
    if (disabledProPlusIds.has(value)) return;
    const nextIds = [...withoutCurrent, value];
    const nextNotes = syncVideoClassicMode(scene.notes ?? "", currentShot, currentMovement, nextIds);
    onUpdateScene({ ...scene, notes: nextNotes });
  }

  function pickVideoProPlus(value: string) {
    if (!value) return;
    const item = getProCameraPreset(value);
    if (!item?.category) return;
    selectVideoProPlusForCategory(item.category, value);
    setVideoProMenuOpen(false);
    setVideoProCategoryHover(null);
  }

  function selectImageProEffectForCategory(categoryId: string, value: string) {
    const withoutCurrent = imageProSelection.filter((id) => getImageProEffect(id)?.category !== categoryId);
    if (!value) {
      const nextNotes = syncImageClassicMode(scene.notes ?? "", currentShot, withoutCurrent);
      onUpdateScene({ ...scene, notes: nextNotes });
      return;
    }
    if (disabledImageIds.has(value)) return;
    const nextIds = [...withoutCurrent, value];
    const nextNotes = syncImageClassicMode(scene.notes ?? "", currentShot, nextIds);
    onUpdateScene({ ...scene, notes: nextNotes });
  }

  function pickImageProEffect(value: string) {
    if (!value) return;
    const item = getImageProEffect(value);
    if (!item?.category) return;
    selectImageProEffectForCategory(item.category, value);
    setImageProMenuOpen(false);
    setImageProCategoryHover(null);
  }

  function currentVideoProMenuLabel() {
    if (!proMotionSelection.proPlusIds.length) return lang === "zh" ? "未选择" : "None";
    return proMotionLabel(proMotionSelection.proPlusIds[proMotionSelection.proPlusIds.length - 1], lang);
  }

  function currentImageProMenuLabel() {
    if (!imageProSelection.length) return lang === "zh" ? "未选择" : "None";
    const item = getImageProEffect(imageProSelection[imageProSelection.length - 1]);
    return item ? (lang === "zh" ? item.labelZh : item.labelEn) : (lang === "zh" ? "未选择" : "None");
  }

  function currentDirectorStylePackLabel() {
    return directorStylePackLabel(directorStylePackId, lang);
  }

  function compactRecipeNameEn(recipeId: string, name: string) {
    const map: Record<string, string> = {
      premium_commercial: "Premium Ad",
      relationship_standoff: "Standoff",
      first_person_impact: "FP Impact",
      character_trail: "Trail Follow",
      rhythm_transition: "Rhythm Cut",
      mystery_reveal: "Mystery Reveal"
    };
    if (map[recipeId]) return map[recipeId];
    return name;
  }

  function recipeOptionLabel(recipe: { id: string; nameZh: string; nameEn: string }) {
    if (lang === "zh") return recipe.nameZh;
    return compactRecipeNameEn(recipe.id, recipe.nameEn);
  }

  function updateDirectorStylePack(packId: string) {
    const nextNotes = applyDirectorStylePack(scene.notes ?? "", packId as DirectorStylePackId | "");
    onUpdateScene({ ...scene, notes: nextNotes });
  }

  function menuRect(trigger: HTMLButtonElement | null) {
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const minMenuWidth = lang === "zh" ? 216 : 248;
    const maxMenuWidth = Math.max(minMenuWidth, Math.floor(window.innerWidth * 0.42));
    const width = Math.min(maxMenuWidth, Math.max(rect.width, minMenuWidth));
    const maxLeft = Math.max(8, window.innerWidth - width * 2 - 12);
    const maxMenuHeight = 320;
    const desiredTop = rect.bottom + 4;
    const maxTop = Math.max(8, window.innerHeight - maxMenuHeight - 8);
    return {
      top: Math.max(8, Math.min(desiredTop, maxTop)),
      left: Math.min(rect.left, maxLeft),
      width
    };
  }

  const videoMenuRect = videoProMenuOpen ? menuRect(videoProTriggerRef.current) : null;
  const imageMenuRect = imageProMenuOpen ? menuRect(imageProTriggerRef.current) : null;

  function renderVideoCascadeMenu() {
    if (!videoProMenuOpen || !videoMenuRect || typeof document === "undefined") return null;
    return createPortal(
      <div
        ref={videoProPopupRef}
        style={{ ...styles.proCascadeRoot, top: videoMenuRect.top, left: videoMenuRect.left }}
        data-testid="pro-plus-menu"
        onMouseLeave={() => {
          setVideoProCategoryHover(null);
          setVideoProOptionHover(null);
        }}
      >
        <div
          style={{
            ...styles.proMotionSelectMenu,
            width: videoMenuRect.width,
            ...(videoProCategoryHover
              ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
              : null)
          }}
        >
          {PRO_PLUS_MOTION_CATEGORIES.map((category) => {
            const items = getVisibleVideoProPlusPresets(category.id);
            const allDisabled = items.length > 0 && items.every((item) => disabledProPlusIds.has(item.id) && !proMotionSelection.proPlusIds.includes(item.id));
            return (
              <button
                key={category.id}
                type="button"
                disabled={allDisabled}
                style={{
                  ...styles.proMenuRow,
                  ...(videoProCategoryHover === category.id ? styles.proMenuRowActive : null),
                  ...(allDisabled ? styles.proMenuRowDisabled : null)
                }}
                onMouseEnter={(e) => {
                  if (allDisabled) return;
                  setVideoProCategoryHover(category.id);
                  setVideoProCategoryTop((e.currentTarget as HTMLButtonElement).getBoundingClientRect().top - videoMenuRect.top);
                }}
                data-testid={`pro-plus-category-${category.id}`}
              >
                <span style={styles.proMotionSelectItemTitle}>{lang === "zh" ? category.labelZh : category.labelEn}</span>
                <ChevronRight size={14} />
              </button>
            );
          })}
        </div>
        {videoProCategoryHover ? (
          <div
            style={{
              ...styles.proCascadeSubmenu,
              top: videoProCategoryTop,
              left: videoMenuRect.width,
              width: videoMenuRect.width,
              borderLeft: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0
            }}
            data-testid="pro-plus-submenu"
          >
            {getVisibleVideoProPlusPresets(videoProCategoryHover as any).map((item) => {
              const selected = proMotionSelection.proPlusIds.includes(item.id);
              const disabled = disabledProPlusIds.has(item.id) && !selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    ...styles.proMenuRow,
                    ...(videoProOptionHover === item.id ? styles.proMenuRowActive : null),
                    ...(selected ? styles.proMenuRowActive : null),
                    ...(disabled ? styles.proMenuRowDisabled : null)
                  }}
                  disabled={disabled}
                  onMouseEnter={() => setVideoProOptionHover(item.id)}
                  onMouseLeave={() => setVideoProOptionHover((current) => (current === item.id ? null : current))}
                  onClick={() => pickVideoProPlus(item.id)}
                  data-testid={`pro-plus-option-${item.id}`}
                >
                  <span style={styles.proMotionSelectItemTitle}>{lang === "zh" ? item.labelZh : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>,
      document.body
    );
  }

  function renderImageCascadeMenu() {
    if (!imageProMenuOpen || !imageMenuRect || typeof document === "undefined") return null;
    return createPortal(
      <div
        ref={imageProPopupRef}
        style={{ ...styles.proCascadeRoot, top: imageMenuRect.top, left: imageMenuRect.left }}
        data-testid="pro-image-menu"
        onMouseLeave={() => {
          setImageProCategoryHover(null);
          setImageProOptionHover(null);
        }}
      >
        <div
          style={{
            ...styles.proMotionSelectMenu,
            width: imageMenuRect.width,
            ...(imageProCategoryHover
              ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
              : null)
          }}
        >
          {IMAGE_PRO_CATEGORIES.map((category) => {
            const items = getImageProEffectsByCategory(category.id);
            const allDisabled = items.length > 0 && items.every((item) => disabledImageIds.has(item.id) && !imageProSelection.includes(item.id));
            return (
              <button
                key={category.id}
                type="button"
                disabled={allDisabled}
                style={{
                  ...styles.proMenuRow,
                  ...(imageProCategoryHover === category.id ? styles.proMenuRowActive : null),
                  ...(allDisabled ? styles.proMenuRowDisabled : null)
                }}
                onMouseEnter={(e) => {
                  if (allDisabled) return;
                  setImageProCategoryHover(category.id);
                  setImageProCategoryTop((e.currentTarget as HTMLButtonElement).getBoundingClientRect().top - imageMenuRect.top);
                }}
                data-testid={`pro-image-category-${category.id}`}
              >
                <span style={styles.proMotionSelectItemTitle}>{lang === "zh" ? category.labelZh : category.labelEn}</span>
                <ChevronRight size={14} />
              </button>
            );
          })}
        </div>
        {imageProCategoryHover ? (
          <div
            style={{
              ...styles.proCascadeSubmenu,
              top: imageProCategoryTop,
              left: imageMenuRect.width,
              width: imageMenuRect.width,
              borderLeft: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0
            }}
            data-testid="pro-image-submenu"
          >
            {getImageProEffectsByCategory(imageProCategoryHover as any).map((item) => {
              const selected = imageProSelection.includes(item.id);
              const disabled = disabledImageIds.has(item.id) && !selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    ...styles.proMenuRow,
                    ...(imageProOptionHover === item.id ? styles.proMenuRowActive : null),
                    ...(selected ? styles.proMenuRowActive : null),
                    ...(disabled ? styles.proMenuRowDisabled : null)
                  }}
                  disabled={disabled}
                  onMouseEnter={() => setImageProOptionHover(item.id)}
                  onMouseLeave={() => setImageProOptionHover((current) => (current === item.id ? null : current))}
                  onClick={() => pickImageProEffect(item.id)}
                  data-testid={`pro-image-option-${item.id}`}
                >
                  <span style={styles.proMotionSelectItemTitle}>{lang === "zh" ? item.labelZh : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>,
      document.body
    );
  }

  const [sidebarCollapsed, toggleSidebar] = useProCollapseSections(
    "sidebar",
    ["project", "scenes", "continuity", "templates", "scene_strategy", "camera_control", "camera_lighting", "objects"],
    ["project", "scenes", "continuity", "scene_strategy", "camera_control", "camera_lighting", "objects"]
  );

  const { colors: ec, spacing: es } = editorTheme;

  return (
    <>
    {/* Override global .pro-sidebar select/input so EditorSelect/EditorInput theme wins */}
    <style dangerouslySetInnerHTML={{
      __html: `
        .editor-sidebar-forms select {
          height: auto !important;
          min-height: 28px !important;
          padding: 6px 28px 6px 10px !important;
          font-size: 12px !important;
          background-color: ${ec.bg} !important;
          border: 1px solid ${ec.border} !important;
          color: ${ec.text} !important;
          border-radius: ${editorTheme.radius.input}px !important;
        }
        .editor-sidebar-forms select:focus {
          border-color: ${ec.accent} !important;
        }
        .editor-sidebar-forms input[type="text"],
        .editor-sidebar-forms input[type="number"] {
          height: auto !important;
          min-height: 24px !important;
          padding: 0 8px !important;
          font-size: 12px !important;
          color: ${ec.text} !important;
        }
      `
    }} />
    <div
      className="pro-sidebar spx-glass-left editor-sidebar-forms"
      style={{
        ...styles.wrap,
        ...styles.wrapPro,
        background: ec.panel,
        borderRight: `1px solid ${ec.border}`,
        padding: es.panelPadding,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minHeight: 0,
        overflow: "auto"
      }}
    >
      {/* Project (collapsible section, same style as other sidebar sections) */}
      {projectLabel != null && onSaveProject && (
        <EditorSection
          title={(projectLabel || (lang === "zh" ? "未命名项目" : "Untitled Project")).trim() || (lang === "zh" ? "未命名项目" : "Untitled Project")}
          icon={FolderOpen}
          open={!sidebarCollapsed.has("project")}
          onOpenChange={(open) => {
            const currentlyOpen = !sidebarCollapsed.has("project");
            if (open !== currentlyOpen) toggleSidebar("project");
          }}
        >
        <div style={styles.projectSectionBody}>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onSaveProject?.()}>
            <Save size={12} />
            <span>{lang === "zh" ? "保存项目…" : "Save Project..."}</span>
          </button>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onCopyPrompt?.()}>
            <Copy size={12} />
            <span>{lang === "zh" ? "复制提示词" : "Copy Prompt"}</span>
          </button>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onExportProject?.()}>
            <Download size={12} />
            <span>{lang === "zh" ? "导出…" : "Export..."}</span>
          </button>
          <div style={styles.projectActionSep} />
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onOpenProject?.()}>
            <FolderOpen size={12} />
            <span>{lang === "zh" ? "打开项目" : "Open Project"}</span>
          </button>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onOpenLibrary?.()}>
            <FolderOpen size={12} />
            <span>{lang === "zh" ? "项目库" : "Project Library"}</span>
          </button>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onRenameProject?.()}>
            <PencilLine size={12} />
            <span>{lang === "zh" ? "重命名项目" : "Rename Project"}</span>
          </button>
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onSaveAs?.()}>
            <Save size={12} />
            <span>{lang === "zh" ? "另存项目…" : "Save Project As..."}</span>
          </button>
          <div style={styles.projectActionSep} />
          <button type="button" className="pro-project-action" style={styles.projectAction} onClick={() => onNewProject?.()}>
            <FilePlus2 size={12} />
            <span>{lang === "zh" ? "新建项目" : "New Project"}</span>
          </button>
        </div>
        </EditorSection>
      )}
      {/* ✅ toast */}
      {toastText ? <div style={styles.toast}>{toastText}</div> : null}
      {floatingHint ? (
        <div
          style={{
            ...styles.floatingHint,
            ...(floatingHint.tone === "danger" ? styles.floatingHintDanger : styles.floatingHintInfo),
            top: floatingHint.top,
            left: floatingHint.left
          }}
        >
          {floatingHint.text}
        </div>
      ) : null}
      {/* ✅ confirm modal (for delete scene) */}
      {confirmDelIdx != null ? (
        <div
          style={styles.modalMask}
          role="presentation"
          onMouseDown={() => setConfirmDelIdx(null)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{tt("sidebar.deleteScene")}</div>
            <div style={styles.modalText}>
              {tt("sidebar.deleteConfirm")}
            </div>
            <div style={styles.modalBtns}>
              <button type="button" className="pro-btn-ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmDelIdx(null)}>
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                className="pro-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => doDeleteScene(confirmDelIdx)}
              >
                {tt("sidebar.delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ create scene modal */}
      {newScene.open ? (
        <div
          style={styles.modalMask}
          role="presentation"
          onMouseDown={() => cancelAddScenePanel()}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{tt("sidebar.createScene")}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 40, marginBottom: 8 }}>
              <div style={{ width: 88, minHeight: 36, display: "flex", alignItems: "center", fontSize: 12, color: ec.textMuted, fontWeight: 600 }}>{tt("sidebar.type")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
                <button
                  type="button"
                  className={newSceneModeTouched && newScene.mode === "image" ? "pro-btn" : "pro-btn-ghost"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNewSceneModeTouched(true);
                    setNewScene((s) => ({ ...s, mode: "image", shotCount: "1" }));
                  }}
                  style={{ height: 36, padding: "0 10px" }}
                >
                  {tt("sidebar.image")}
                </button>
                <button
                  type="button"
                  className={newSceneModeTouched && newScene.mode === "video" ? "pro-btn" : "pro-btn-ghost"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNewSceneModeTouched(true);
                    setNewScene((s) => ({
                      ...s,
                      mode: "video",
                      shotCount: String(defaultShotCountForPlan(resolveShotPlanFromDraft({ ...s, mode: "video" } as NewSceneDraft)))
                    }));
                  }}
                  style={{ height: 36, padding: "0 10px" }}
                >
                  {tt("sidebar.video")}
                </button>
              </div>
            </div>
            {newScene.mode === "video" ? (
              <>
                <EditorSelect
                  label={lang === "zh" ? "Q1 场景变化" : "Q1 Location"}
                  options={[
                    { label: lang === "zh" ? "不变（同一地点）" : "Same location", value: "same" },
                    { label: lang === "zh" ? "变化（多地点）" : "Different locations", value: "different" }
                  ]}
                  value={newScene.locationScope}
                  onChange={(v) => setNewScene((s) => ({ ...s, locationScope: v as "same" | "different" }))}
                />
                {newScene.locationScope === "same" ? (
                  <EditorSelect
                    label={lang === "zh" ? "Q2 镜头移动" : "Q2 Camera Move"}
                    options={[
                      { label: lang === "zh" ? "只换机位" : "Angle change only", value: "angle_only" },
                      { label: lang === "zh" ? "连续移动" : "Continuous travel", value: "travel" }
                    ]}
                    value={newScene.cameraTravel}
                    onChange={(v) => {
                      const nextTravel = v as "angle_only" | "travel";
                      const nextPlan = nextTravel === "travel" ? "continuous" : "multicam";
                      setNewScene((s) => ({ ...s, cameraTravel: nextTravel, shotCount: String(defaultShotCountForPlan(nextPlan)) }));
                    }}
                  />
                ) : (
                  <EditorSelect
                    label={lang === "zh" ? "Q3 允许跳切" : "Q3 Jump Cut"}
                    options={[
                      { label: lang === "zh" ? "允许（标准剪辑）" : "Yes (Edit)", value: "yes" },
                      { label: lang === "zh" ? "不允许（连续跨场）" : "No (Continuous)", value: "no" }
                    ]}
                    value={newScene.allowJump}
                    onChange={(v) => {
                      const nextPlan = v === "yes" ? "edit" : "continuous";
                      setNewScene((s) => ({ ...s, allowJump: v as "yes" | "no", shotCount: String(defaultShotCountForPlan(nextPlan)) }));
                    }}
                  />
                )}
                <EditorInput
                  label={lang === "zh" ? "分镜数量" : "Shot Count"}
                  value={newScene.shotCount}
                  onChange={(v) => setNewScene((s) => ({ ...s, shotCount: v }))}
                  type="text"
                  inputMode="numeric"
                />
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.35,
                    border: `1px solid ${ec.border}`,
                    borderRadius: editorTheme.radius.input,
                    background: ec.bg,
                    padding: "8px 10px",
                    opacity: 0.9,
                    marginTop: 0
                  }}
                >
                  {lang === "zh"
                    ? `已选模式：${resolveShotPlanFromDraft(newScene)}`
                    : `Mode: ${resolveShotPlanFromDraft(newScene)}`}
                </div>
              </>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 40, marginBottom: 8 }}>
              <div style={{ width: 88, minHeight: 36, display: "flex", alignItems: "center", fontSize: 12, color: ec.textMuted, fontWeight: 600 }}>{tt("sidebar.mode")}</div>
              <div style={styles.genModeRow}>
                <button
                  type="button"
                  className={newSceneGenModeTouched && newScene.genMode === "quick" ? "pro-btn" : "pro-btn-ghost"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNewSceneGenModeTouched(true);
                    setNewScene((s) => ({ ...s, genMode: "quick" }));
                  }}
                  style={{ height: 36, padding: "0 10px" }}
                >
                  {tt("sidebar.quick")}
                </button>
                <button
                  type="button"
                  className={newSceneGenModeTouched && newScene.genMode === "pro" ? "pro-btn" : "pro-btn-ghost"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNewSceneGenModeTouched(true);
                    setNewScene((s) => ({ ...s, genMode: "pro" }));
                  }}
                  style={{ height: 36, padding: "0 10px" }}
                >
                  PRO
                </button>
                <button
                  type="button"
                  className="pro-btn-ghost"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowGenHint((v) => !v)}
                  title={tt("sidebar.showModeDiff")}
                  style={{ height: 36, minWidth: 36, padding: 0 }}
                >
                  ?
                </button>
              </div>
            </div>
            {showGenHint ? (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.35,
                  border: `1px solid ${ec.border}`,
                  borderRadius: editorTheme.radius.input,
                  background: ec.bg,
                  padding: "8px 10px",
                  opacity: 0.9,
                  marginTop: 0
                }}
              >
                {tt("sidebar.modeDiffHint")}
              </div>
            ) : null}

            <EditorInput
              label={tt("sidebar.name")}
              value={newScene.name}
              onChange={(v) => setNewScene((s) => ({ ...s, name: v }))}
              placeholder={tt("sidebar.namePlaceholder")}
              maxLength={40}
            />

            <div style={{ visibility: newScene.mode === "video" ? "visible" : "hidden" }}>
              <EditorInput
                label={tt("sidebar.seconds")}
                value={newScene.duration_s}
                onChange={(v) => setNewScene((s) => ({ ...s, duration_s: v }))}
                type="text"
                inputMode="numeric"
                disabled={newScene.mode !== "video"}
                suffix={lang === "zh" ? "秒" : "s"}
              />
            </div>

            <div style={styles.modalBtns}>
              <button
                type="button"
                className="pro-btn-ghost"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelAddScenePanel}
              >
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                className="pro-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => confirmAddScene(e.currentTarget as HTMLElement)}
                style={{ opacity: remainingSceneSlots <= 0 ? 0.6 : 1 }}
                disabled={remainingSceneSlots <= 0}
                title={remainingSceneSlots <= 0 ? sceneLimitText() : undefined}
              >
                {tt("sidebar.create")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Template Library (Figma: first) */}
      <EditorSection
        title={tt("sidebar.templates")}
        icon={LayoutGrid}
        open={!sidebarCollapsed.has("templates")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("templates");
          if (open !== currentlyOpen) toggleSidebar("templates");
        }}
      >
      <div style={styles.section}>
        <CurrentTemplateContext
          lang={lang}
          project={project}
          onOpenWorkspace={() => onOpenTemplateWorkspace?.()}
          onOpenWorkspaceWithTemplate={(templateId) => onOpenTemplateWorkspaceWithTemplate?.(templateId) ?? onOpenTemplateWorkspace?.()}
        />
        <TemplateSidebarEntry
          key={lang}
          lang={lang}
          onOpenWorkspace={() => {
            const tid = project?.meta?.currentTemplate?.templateId;
            if (tid) onOpenTemplateWorkspaceWithTemplate?.(tid);
            else onOpenTemplateWorkspace?.();
          }}
          onUseTemplate={(item) => {
            if (onUseTemplateFromEntry) {
              onUseTemplateFromEntry(item);
            }
          }}
        />
      </div>
      </EditorSection>

      {/* Scene List (Figma: second) */}
      <EditorSection
        title={tt("sidebar.scenes")}
        icon={Film}
        open={!sidebarCollapsed.has("scenes")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("scenes");
          if (open !== currentlyOpen) toggleSidebar("scenes");
        }}
        extraColumnWidth={28}
        extra={
          <div style={styles.plusMinusCol}>
            <button
              type="button"
              className="pro-icon-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); addSceneByProjectDefaults(e.currentTarget as HTMLElement); }}
              title={sceneLimitReached ? sceneLimitText() : tt("sidebar.addScene")}
              disabled={isImageProject || sceneLimitReached}
            >
              <Plus size={14} />
            </button>
          </div>
        }
      >
      <div style={styles.sectionListOnly}>
        <div style={styles.sceneCardList}>
          {scenes.map((s, i) => {
            const isOn = i === safeIdx;
            const mode = parseMedia(s);
            const durationSec = Math.max(0, Math.round(Number(s.duration_s) || 0));
            const sceneIndex = Number.isFinite(s.index) ? Number(s.index) : i + 1;
            const sceneNo = String(sceneIndex).padStart(2, "0");

            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                className="pro-scene-card"
                data-active={isOn ? "true" : "false"}
                style={{
                  ...styles.sceneCard,
                  background: isOn ? ec.accentSoft : "rgba(42,45,50,0.6)",
                  borderColor: isOn ? `${ec.accent}66` : ec.border,
                  boxShadow: isOn ? `0 0 15px ${ec.accent}0D` : "none"
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSceneIdx(i);
                  onSelectLayer(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSceneIdx(i);
                    onSelectLayer(null);
                  }
                }}
              >
                {isOn ? <div style={styles.sceneCardActiveBar} aria-hidden /> : null}
                <div style={styles.sceneCardRow1}>
                  <div style={styles.sceneCardTitleWrap}>
                    <Film size={14} style={{ color: isOn ? ec.accent : ec.textMuted, flexShrink: 0 }} />
                    {editingSceneId === s.id ? (
                      <input
                        autoFocus
                        value={sceneNameDraft}
                        onChange={(e) => setSceneNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (isComposing(e)) return;
                          if (e.key === "Enter") commitSceneName(s.id);
                          if (e.key === "Escape") setEditingSceneId(null);
                        }}
                        onBlur={() => commitSceneName(s.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: 22,
                          borderRadius: 6,
                          border: `1px solid ${ec.accent}`,
                          background: ec.bg,
                          color: ec.text,
                          outline: "none",
                          padding: "0 6px",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          ...styles.sceneCardName,
                          color: isOn ? ec.accent : ec.text
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingSceneId(s.id);
                          setSceneNameDraft(s.name ?? "");
                        }}
                        title={tt("sidebar.renameHint")}
                      >
                        {formatSceneRowName(sceneNo, s.name, s.id)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="pro-scene-card-delete"
                    style={styles.sceneCardDelete}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteScene(i, e.currentTarget as HTMLElement);
                    }}
                    title={tt("sidebar.deleteScene")}
                    disabled={scenes.length <= 1 || isImageProject}
                  >
                    <Minus size={14} />
                  </button>
                </div>
                <div style={styles.sceneCardRow2}>
                  <span style={styles.sceneCardPill}>
                    {mode === "image" ? tt("sidebar.image") : (lang === "zh" ? "视频" : "Video")}
                  </span>
                  {mode === "video" ? (
                    editingDurSceneId === s.id ? (
                      <input
                        autoFocus
                        value={durDraft}
                        onChange={(e) => setDurDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (isComposing(e)) return;
                          if (e.key === "Enter") commitSceneDuration(s.id);
                          if (e.key === "Escape") setEditingDurSceneId(null);
                        }}
                        onBlur={() => commitSceneDuration(s.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 48,
                          height: 20,
                          borderRadius: 4,
                          border: `1px solid ${ec.accent}`,
                          background: ec.bg,
                          color: ec.text,
                          outline: "none",
                          padding: "0 6px",
                          fontSize: 10,
                          fontFamily: "monospace",
                          textAlign: "right"
                        }}
                      />
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        style={styles.sceneCardPillDuration}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingDurSceneId(s.id);
                          setDurDraft(String(durationSec));
                        }}
                        title={tt("sidebar.editDuration")}
                      >
                        <Play size={10} style={{ opacity: 0.5, marginRight: 4 }} />
                        {durationSec}s
                      </div>
                    )
                  ) : (
                    <span style={styles.sceneCardPill}>—</span>
                  )}
                  {mode === "video" && i > 0 ? (
                    <span
                      style={styles.sceneCardPill}
                      title={
                        s.inheritFromPrevious
                          ? (lang === "zh" ? "继承上一镜布局" : "Inherit previous shot layout")
                          : (lang === "zh" ? "独立镜头布局" : "Independent shot layout")
                      }
                    >
                      {s.inheritFromPrevious ? (lang === "zh" ? "继承" : "Inherit") : (lang === "zh" ? "独立" : "Indep.")}
                    </span>
                  ) : null}
                  {mode === "video" && i > 0 && i < scenes.length - 1 ? (
                    <span style={styles.sceneCardPill} title={lang === "zh" ? "衔接方式" : "Transition"}>
                      {transitionLabel(lang, s.transitionType)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </EditorSection>

      {/* Continuity Panel - scene links, carry-over, prev/next */}
      <ContinuityPanel
        lang={lang}
        project={project}
        currentSceneIndex={safeIdx}
        onSetSceneIdx={(i) => {
          setSceneIdx(i);
          onSelectLayer(null);
        }}
        collapsed={sidebarCollapsed.has("continuity")}
        onToggle={() => toggleSidebar("continuity")}
      />

      {/* Object Layers (Figma: fourth) */}
      <EditorSection
        title={tt("sidebar.layers")}
        icon={Layers}
        open={!sidebarCollapsed.has("objects")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("objects");
          if (open !== currentlyOpen) toggleSidebar("objects");
        }}
        extraColumnWidth={28}
        extra={
          <div style={styles.plusMinusCol}>
            <button
              type="button"
              className="pro-icon-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); addLayer(); }}
              title={layerLimitReached ? layerLimitText() : tt("sidebar.addLayer")}
              disabled={layerLimitReached}
            >
              <Plus size={14} />
            </button>
          </div>
        }
      >
      <div style={styles.sectionListOnly}>
        <div style={styles.list}>
          {(scene.layers ?? []).length === 0 ? (
            <div style={styles.itemRowWrap}>
              <div
                style={{
                  ...styles.listItemContent,
                  opacity: 0.55,
                  cursor: "default",
                  background: "transparent",
                  border: `1px solid ${ec.border}`,
                  color: ec.textMuted
                }}
                title={lang === "zh" ? "示例占位，不会写入项目" : "Example placeholder only"}
              >
                <div style={styles.rowInner}>
                  <div style={styles.renameText}>{lang === "zh" ? "人物1" : "character1"}</div>
                </div>
              </div>
              <div style={{ width: 28, minWidth: 28 }} />
            </div>
          ) : null}
          {(scene.layers ?? [])
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((l) => {
              const isOn = l.id === selectedLayerId;

              return (
                <div key={l.id} style={styles.itemRowWrap}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="pro-object-row"
                    data-active={isOn ? "true" : "false"}
                    style={{
                      ...styles.listItemContent,
                      background: isOn ? ec.hover : "transparent",
                      color: isOn ? ec.text : ec.textMuted,
                      border: `1px solid ${ec.border}`,
                      transition: `background ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}, color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}, border-color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectLayer(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelectLayer(l.id);
                    }}
                  >
                    <div style={styles.rowInner}>
                      {editingLayerId === l.id ? (
                        <input
                          autoFocus
                          value={layerIdDraft}
                          onChange={(e) => setLayerIdDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (isComposing(e)) return;
                            if (e.key === "Enter") commitLayerId(l.id);
                            if (e.key === "Escape") setEditingLayerId(null);
                          }}
                          onBlur={() => commitLayerId(l.id)}
                          style={{
                            flex: 1,
                            height: 26,
                            borderRadius: editorTheme.radius.input,
                            border: `1px solid ${ec.accent}`,
                            background: ec.bg,
                            color: ec.text,
                            outline: "none",
                            padding: "0 8px",
                            fontSize: editorTheme.typography.bodySize
                          }}
                        />
                      ) : (
                        <div
                          style={styles.renameText}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingLayerId(l.id);
                            setLayerIdDraft(l.id);
                          }}
                          title={tt("sidebar.renameHint")}
                        >
                          {l.id}
                        </div>
                      )}
                      <div style={{ width: 1 }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pro-icon-btn"
                    style={styles.minusColBtn}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => deleteLayer(l.id)}
                    title={tt("sidebar.deleteLayer")}
                  >
                    <Minus size={14} />
                  </button>
                </div>
              );
            })}
        </div>

      </div>
      </EditorSection>

      {/* Director Control - 导演预设、一键选择、导演级风格包 */}
      <EditorSection
        title={lang === "zh" ? "导演控制" : "Director Control"}
        icon={Settings}
        open={!sidebarCollapsed.has("scene_strategy")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("scene_strategy");
          if (open !== currentlyOpen) toggleSidebar("scene_strategy");
        }}
      >
      <div style={styles.section}>
        {isVideoProject && projectShotPlan === "continuous" ? (
          <>
            <EditorSelect
              label={lang === "zh" ? "入镜方向" : "Entry"}
              options={[
                { label: lang === "zh" ? "自动" : "Auto", value: "" },
                "N", "NE", "E", "SE", "S", "SW", "W", "NW"
              ]}
              value={(scene.entryDir ?? "").toString()}
              onChange={(v) => onUpdateScene({ ...scene, entryDir: (v || undefined) as Direction | undefined })}
            />
            <EditorSelect
              label={lang === "zh" ? "出镜方向" : "Exit"}
              options={[
                { label: lang === "zh" ? "自动" : "Auto", value: "" },
                "N", "NE", "E", "SE", "S", "SW", "W", "NW"
              ]}
              value={(scene.exitDir ?? "").toString()}
              onChange={(v) => onUpdateScene({ ...scene, exitDir: (v || undefined) as Direction | undefined })}
            />
          </>
        ) : null}

        {isVideoProject && projectShotPlan !== "single" ? (
          <EditorSelect
            label={lang === "zh" ? "对象继承" : "Inherit Objects"}
            options={[
              { label: lang === "zh" ? "开启" : "On", value: "on" },
              { label: lang === "zh" ? "关闭" : "Off", value: "off" }
            ]}
            value={scene.inheritFromPrevious ? "on" : "off"}
            onChange={(v) => {
              const on = v === "on";
              const forced = projectShotPlan === "continuous" ? true : on;
              onUpdateScene({ ...scene, inheritFromPrevious: forced });
            }}
            disabled={safeIdx === 0 || projectShotPlan === "continuous"}
          />
        ) : null}

        <div style={styles.proDirectorBlock} data-testid="pro-director-block">
          <div data-testid="pro-shot-recipe-select">
            <EditorSelect
              label={lang === "zh" ? "导演预设" : "Director Preset"}
              options={[
                { label: lang === "zh" ? "未选择" : "None", value: "" },
                ...((isVideoProject ? hasVideoManualClassic : hasImageManualClassic)
                  ? [{ label: lang === "zh" ? "手动设置" : "Manual Setup", value: "__manual__", disabled: true as const }]
                  : []),
                ...(isVideoProject ? videoClassicModes : imageClassicModes).map((recipe) => ({
                  label: recipeOptionLabel(recipe),
                  value: recipe.id,
                  disabled: false as const
                }))
              ]}
              value={isVideoProject ? videoClassicSelectValue : imageClassicSelectValue}
              onChange={(v) => {
                if (v === "__manual__") return;
                return isVideoProject ? pickVideoClassicMode(v) : pickImageClassicMode(v);
              }}
            />
          </div>
          <div style={styles.proMotionPanel}>
            <div data-testid="director-style-pack-select">
              <EditorSelect
                label={lang === "zh" ? "导演级风格包" : "Directing Pack"}
                options={[
                  { label: lang === "zh" ? "自动" : "Auto", value: "" },
                  ...DIRECTOR_STYLE_PACKS.map((pack) => ({ label: lang === "zh" ? pack.labelZh : pack.labelEn, value: pack.id }))
                ]}
                value={directorStylePackId ?? ""}
                onChange={(v) => updateDirectorStylePack(v)}
              />
            </div>
          </div>
        </div>

      </div>
      </EditorSection>

      {/* Camera Control - 景别、运动、镜头语言、转场 */}
      <EditorSection
        title={lang === "zh" ? "镜头控制" : "Camera Control"}
        icon={Camera}
        open={!sidebarCollapsed.has("camera_control")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("camera_control");
          if (open !== currentlyOpen) toggleSidebar("camera_control");
        }}
      >
      <div style={styles.section}>
        <div style={styles.proDirectorBlock} data-testid="pro-shot-recipe-select">
          <EditorSelect
            label={isVideoProject ? tt("camera.shot") : (lang === "zh" ? "构图景别" : "Framing")}
            options={shotOptions.map((o) => ({ label: o.label, value: o.v }))}
            value={visibleShot}
            onChange={(v) => updateCameraField("shot", v)}
          />
          {isVideoProject ? (
            <EditorSelect
              label={tt("camera.movement")}
              options={moveOptions.map((o) => ({ label: o.label, value: o.v }))}
              value={visibleMovement}
              onChange={(v) => updateCameraField("movement", v)}
            />
          ) : null}
        </div>
        <div style={styles.proDirectorBlock} data-testid="pro-camera-language-style">
          <EditorSelect
            label={lang === "zh" ? "镜头语言" : "Camera Language"}
            options={getUserVisibleCameraLanguageOptions().map((o) => ({
              label: lang === "zh" ? o.labelZh : o.labelEn,
              value: o.id
            }))}
            value={(() => {
              const raw = parseCameraLanguageId(scene.notes);
              if (!raw) return undefined;
              if (isUserVisibleCameraLanguage(raw)) return raw;
              return normalizeForUserSelection(raw) || undefined;
            })()}
            onChange={(v) => {
              const nextNotes = applyCameraLanguage(scene.notes ?? "", v ?? "");
              onUpdateScene({ ...scene, notes: nextNotes });
            }}
          />
        </div>
        {isVideoProject ? (
          <div style={styles.proMotionBlock} data-testid="pro-motion-block">
            <div style={{ ...styles.proDirectorTitle, color: ec.text }}>{lang === "zh" ? "专业运镜" : "Pro Motion"}</div>
            <div style={styles.proMotionPanel} data-testid="pro-motion-plus-panel">
              <div ref={videoProMenuRef} style={styles.proMotionSelectShell}>
                <div style={{ marginBottom: editorTheme.spacing.fieldMarginBottom }}>
                  <label style={{ display: "block", fontSize: editorTheme.typography.labelSize, fontWeight: editorTheme.typography.labelWeight, color: ec.textMuted, marginBottom: 4 }}>
                    {lang === "zh" ? "专业运镜" : "Pro Motion"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <button
                      ref={videoProTriggerRef}
                      type="button"
                      data-testid="pro-plus-trigger"
                      data-open={videoProMenuOpen ? "true" : undefined}
                      onClick={() => {
                        setVideoProMenuOpen((prev) => !prev);
                        setVideoProCategoryHover(null);
                      }}
                      style={{
                        ...styles.proShotLanguageBtn,
                        borderColor: videoProMenuOpen ? ec.accent : undefined,
                        transition: `border-color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`
                      }}
                      onMouseEnter={(e) => {
                        if (!videoProMenuOpen) e.currentTarget.style.borderColor = ec.textMuted;
                      }}
                      onMouseLeave={(e) => {
                        if (!videoProMenuOpen) e.currentTarget.style.borderColor = ec.border;
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = ec.accent;
                      }}
                      onBlur={(e) => {
                        if (!videoProMenuOpen) e.currentTarget.style.borderColor = ec.border;
                      }}
                    >
                      <span style={styles.proShotLanguageValue}>{currentVideoProMenuLabel()}</span>
                      <ChevronDown
                        size={editorTheme.sizing.selectArrowSize}
                        style={{
                          flexShrink: 0,
                          color: ec.textMuted,
                          opacity: videoProMenuOpen ? 1 : 0.85,
                          transform: videoProMenuOpen ? "rotate(180deg)" : "none",
                          transition: `transform ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`
                        }}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.proMotionBlock} data-testid="pro-image-block">
            <div style={styles.proMotionPanel}>
              <div ref={imageProMenuRef} style={styles.proMotionSelectShell}>
                <div style={{ marginBottom: editorTheme.spacing.fieldMarginBottom }}>
                  <label style={{ display: "block", fontSize: editorTheme.typography.labelSize, fontWeight: editorTheme.typography.labelWeight, color: ec.textMuted, marginBottom: 4 }}>
                    {lang === "zh" ? "画面语言" : "Visual Language"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <button
                      ref={imageProTriggerRef}
                      type="button"
                      data-testid="pro-image-trigger"
                      data-open={imageProMenuOpen ? "true" : undefined}
                      onClick={() => {
                        setImageProMenuOpen((prev) => !prev);
                        setImageProCategoryHover(null);
                      }}
                      style={{
                        ...styles.proShotLanguageBtn,
                        borderColor: imageProMenuOpen ? ec.accent : undefined,
                        transition: `border-color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`
                      }}
                      onMouseEnter={(e) => {
                        if (!imageProMenuOpen) e.currentTarget.style.borderColor = ec.textMuted;
                      }}
                      onMouseLeave={(e) => {
                        if (!imageProMenuOpen) e.currentTarget.style.borderColor = ec.border;
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = ec.accent;
                      }}
                      onBlur={(e) => {
                        if (!imageProMenuOpen) e.currentTarget.style.borderColor = ec.border;
                      }}
                    >
                      <span style={styles.proShotLanguageValue}>{currentImageProMenuLabel()}</span>
                      <ChevronDown
                        size={editorTheme.sizing.selectArrowSize}
                        style={{
                          flexShrink: 0,
                          color: ec.textMuted,
                          opacity: imageProMenuOpen ? 1 : 0.85,
                          transform: imageProMenuOpen ? "rotate(180deg)" : "none",
                          transition: `transform ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`
                        }}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isVideoProject && projectShotPlan !== "single" ? (
          <EditorSelect
            label={lang === "zh" ? "衔接方式" : "Transition"}
            options={[
              { label: lang === "zh" ? "切换 (cut)" : "Cut", value: "cut" },
              { label: lang === "zh" ? "反打 (reverse angle)" : "Reverse angle", value: "reverse_angle" },
              { label: lang === "zh" ? "连续推进 (camera continues)" : "Camera continues", value: "camera_continues" },
              { label: lang === "zh" ? "叠化 (dissolve)" : "Dissolve", value: "dissolve" },
              { label: lang === "zh" ? "时间跳转 (time jump)" : "Time jump", value: "time_jump" }
            ]}
            value={visibleTransition}
            onChange={(v) => onUpdateScene({ ...scene, transitionType: v as TransitionType })}
            disabled={projectShotPlan === "continuous" || safeIdx >= scenes.length - 1}
          />
        ) : null}
      </div>
      </EditorSection>

      {/* Lighting / Atmosphere - 光与氛围 */}
      <EditorSection
        title={lang === "zh" ? "光与氛围" : "Lighting / Atmosphere"}
        icon={Sun}
        open={!sidebarCollapsed.has("camera_lighting")}
        onOpenChange={(open) => {
          const currentlyOpen = !sidebarCollapsed.has("camera_lighting");
          if (open !== currentlyOpen) toggleSidebar("camera_lighting");
        }}
      >
      <div style={styles.section}>
        <EditorSelect
          label={tt("lighting.time")}
          options={timeOptions.map((o) => ({ label: o.label, value: o.v }))}
          value={visibleLightingTime}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, time: v } as any })}
        />
        <EditorSelect
          label={tt("lighting.keyDir")}
          options={dirOptions.map((o) => ({ label: o.label, value: o.v }))}
          value={visibleLightingKeyDir}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, key_dir: v } as any })}
        />
        <EditorSelect
          label={tt("lighting.mood")}
          options={moodOptions.map((o) => ({ label: o.label, value: o.v }))}
          value={visibleLightingMood}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, mood: v } as any })}
        />
      </div>
      </EditorSection>
    </div>
    {renderVideoCascadeMenu()}
    {renderImageCascadeMenu()}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: "clamp(252px, 26vw, 332px)",
    minWidth: 252,
    borderRight: "none",
    background: "#f7f9fc",
    backdropFilter: "none",
    padding: UI_SPACE.sm,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
    overflow: "auto",
    position: "relative",
    boxShadow: "none"
  },
  wrapPro: {
    background: "var(--pro-bg-panel)",
    borderRight: "1px solid var(--pro-border-soft)"
  },
  projectSectionBody: {
    display: "flex",
    flexDirection: "column",
    gap: 0
  },
  projectAction: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "6px 0",
    border: "none",
    background: "transparent",
    color: editorTheme.colors.text,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 6,
    transition: "background 150ms ease"
  },
  projectActionSep: {
    height: 1,
    margin: "6px 0",
    background: editorTheme.colors.border
  },

  section: {
    border: "none",
    borderRadius: UI_RADIUS.panel,
    background: "transparent",
    padding: UI_SPACE.sm,
    boxShadow: "none"
  },
  /** Section for scene/object lists: no horizontal padding so plus/minus column aligns with header */
  sectionListOnly: {
    border: "none",
    borderRadius: 0,
    background: "transparent",
    padding: "4px 0 12px 0",
    boxShadow: "none"
  },

  sectionHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 2 },
  sectionTitle: { fontWeight: PRO_TYPO.weightBold, fontSize: PRO_TYPO.sm, fontFamily: PRO_TYPO.fontFamily, opacity: UI_OPACITY.title, color: "rgba(255,255,255,0.94)", letterSpacing: 0.1 },
  projectNameRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: 8,
    alignItems: "center",
    marginBottom: 10
  },
  projectName: {
    borderRadius: 10,
    border: "none",
    background: "transparent",
    padding: "8px 10px",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    opacity: 0.9,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  newProjectBtn: {
    height: 32,
    padding: "0 10px",
    borderRadius: 10,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    whiteSpace: "nowrap",
    maxWidth: "100%",
    boxShadow: UI_CONTROL.shadow.soft,
    ["--spx-btn-bg-hover" as any]: UI_CONTROL.bg.hover,
    ["--spx-btn-bg-active" as any]: UI_CONTROL.bg.active,
    ["--spx-btn-border-hover" as any]: UI_CONTROL.border.hover,
    ["--spx-btn-border-active" as any]: UI_CONTROL.border.active
  },
  ruleSummaryBox: {
    borderRadius: 10,
    border: "none",
    background: "rgba(255,255,255,0.02)",
    padding: "8px 10px",
    marginBottom: 10,
    display: "grid",
    gap: 4,
    boxShadow: "none"
  },
  ruleSummaryTitle: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    color: UI_INFO.text.title
  },
  ruleSummaryLine: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: UI_INFO.text.body,
    opacity: 0.9
  },

  mediaRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8
  },
  mediaHint: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    lineHeight: 1.35,
    opacity: 0.55,
    padding: "0 2px 10px 2px"
  },
  profileHint: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    lineHeight: 1.35,
    opacity: 0.68,
    padding: "0 2px 6px 2px"
  },

  mediaBtn: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    userSelect: "none",
    outline: "none",
    padding: "0 10px",
    boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset"
  },
  mediaBtnOn: {
    border: "1px solid rgba(255,255,255,0.34)",
    background: "rgba(255,255,255,0.14)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
    ["--spx-btn-bg-hover" as any]: "rgba(255,255,255,0.16)",
    ["--spx-btn-bg-active" as any]: "rgba(255,255,255,0.1)",
    ["--spx-btn-border-hover" as any]: "rgba(255,255,255,0.42)",
    ["--spx-btn-border-active" as any]: "rgba(255,255,255,0.34)"
  },

  // ✅ New scene card
  addCard: {
    borderRadius: UI_RADIUS.control,
    border: "none",
    background: "transparent",
    padding: UI_SPACE.sm,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  addRow: { display: "flex", alignItems: "center", gap: 12, minHeight: 40 },
  addLabel: {
    width: UI_SIZE.labelWSidebar,
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    opacity: UI_OPACITY.label,
    lineHeight: 1.3
  },
  addInput: {
    flex: 1,
    width: "100%",
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: UI_COLOR.text,
    outline: "none",
    padding: "0 10px",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily
  },
  addInputSmall: {
    width: "clamp(74px, 28%, 92px)",
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: UI_COLOR.text,
    outline: "none",
    padding: "0 10px",
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    textAlign: "right"
  },
  addActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2, flexWrap: "wrap" },
  genModeRow: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, flex: 1, alignItems: "center" },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  genHintFloat: {
    fontSize: 11,
    lineHeight: 1.35,
    border: `1px solid ${UI_INFO.border.subtle}`,
    borderRadius: 10,
    background: UI_INFO.surface.subtle,
    padding: "8px 10px",
    opacity: 0.78,
    marginTop: 0
  },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  btnPrimary: {
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${UI_ACTION.border.default}`,
    background: UI_ACTION.surface.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft,
    ["--spx-btn-bg-hover" as any]: UI_ACTION.surface.hover,
    ["--spx-btn-bg-active" as any]: UI_ACTION.surface.active,
    ["--spx-btn-border-hover" as any]: UI_ACTION.border.hover,
    ["--spx-btn-border-active" as any]: UI_ACTION.border.active,
    ["--spx-btn-shadow-hover" as any]: UI_ACTION.shadow.hover
  },
  btnDanger: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.35)",
    background: UI_CONTROL.bg.danger,
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  sceneCardList: { display: "flex", flexDirection: "column", gap: 8 },
  sceneCard: {
    position: "relative",
    padding: 12,
    borderRadius: 12,
    border: "1px solid",
    cursor: "pointer",
    transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease"
  },
  sceneCardActiveBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: editorTheme.colors.accent,
    borderRadius: "0 2px 2px 0"
  },
  sceneCardRow1: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8
  },
  sceneCardTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1
  },
  sceneCardName: {
    fontSize: 12,
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  sceneCardDelete: {
    flexShrink: 0,
    padding: 4,
    border: "none",
    background: "transparent",
    color: editorTheme.colors.textMuted,
    cursor: "pointer",
    opacity: 0.6,
    transition: "opacity 150ms ease, color 150ms ease"
  },
  sceneCardRow2: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6
  },
  sceneCardPill: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    background: editorTheme.colors.bg,
    color: editorTheme.colors.textMuted,
    border: `1px solid ${editorTheme.colors.border}`,
    textTransform: "uppercase",
    lineHeight: 1.2
  },
  sceneCardPillDuration: {
    display: "flex",
    alignItems: "center",
    fontSize: 10,
    fontFamily: "monospace",
    padding: "2px 8px",
    borderRadius: 4,
    background: editorTheme.colors.bg,
    color: editorTheme.colors.textMuted,
    border: `1px solid ${editorTheme.colors.border}`,
    cursor: "pointer",
    transition: "border-color 150ms ease"
  },
  itemRowWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 28px",
    gap: 8,
    alignItems: "center",
    minWidth: 0,
    width: "100%"
  },

  rowBtn: {
    flex: "1 1 0",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    borderRadius: UI_RADIUS.control,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    color: "inherit",
    cursor: "pointer",
    padding: "8px 10px",
    userSelect: "none",
    outline: "none",
    boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
    overflow: "hidden"
  },

  rowBtnOn: {
    border: "1px solid rgba(255,255,255,0.34)",
    background: "rgba(255,255,255,0.12)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
    ["--spx-btn-bg-hover" as any]: "rgba(255,255,255,0.16)",
    ["--spx-btn-bg-active" as any]: "rgba(255,255,255,0.1)",
    ["--spx-btn-border-hover" as any]: "rgba(255,255,255,0.42)",
    ["--spx-btn-border-active" as any]: "rgba(255,255,255,0.34)"
  },
  placeholderRow: {
    opacity: 0.55,
    cursor: "default"
  },

  rowInner: { display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexWrap: "nowrap" },
  plusMinusCol: { width: 28, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" },
  listItemContent: {
    flex: "1 1 0",
    minWidth: 0,
    overflow: "hidden",
    borderRadius: editorTheme.radius.input,
    padding: "6px 8px",
    minHeight: "var(--pro-row-height)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box"
  },
  infoBadge: {
    flex: "0 0 auto",
    width: 88,
    minWidth: 88,
    maxWidth: 88,
    fontSize: "var(--pro-font-2xs)",
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    textAlign: "center"
  },
  minusColBtn: { width: 28, minWidth: 28, height: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gridColumn: 2 },

  renameText: {
    flex: "1 1 0",
    minWidth: 0,
    fontWeight: 600,
    fontSize: "var(--pro-font-2xs)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "2px 0",
    lineHeight: 1.3,
    opacity: 0.95
  },

  renameInput: {
    flex: 1,
    height: UI_SIZE.compactH,
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 900
  },

  badgeBtn: {
    flex: "0 0 auto",
    width: 88,
    minWidth: 88,
    maxWidth: 88,
    fontSize: UI_FONT.tiny,
    fontWeight: 900,
    opacity: 0.85,
    padding: "3px 7px",
    borderRadius: UI_RADIUS.chip,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    userSelect: "none",
    outline: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
    textAlign: "center"
  },
  durInput: {
    width: 58,
    height: 26,
    borderRadius: 999,
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    textAlign: "right"
  },

  iconBtn: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  iconBtnDanger: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 34px",
    lineHeight: 0,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.danger}`,
    background: UI_CONTROL.bg.danger,
    color: "inherit",
    cursor: "pointer",
    opacity: 0.95,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },

  formRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  formLabel: {
    width: UI_SIZE.labelWSidebar,
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.28,
    letterSpacing: 0.08,
    color: "rgba(255,255,255,0.86)"
  },
  select: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    flex: "0 0 clamp(166px, 44%, 208px)",
    width: "clamp(166px, 44%, 208px)",
    minWidth: 166,
    maxWidth: 208,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: "linear-gradient(180deg, rgba(26,31,41,0.86), rgba(16,20,29,0.92))",
    color: UI_COLOR.text,
    outline: "none",
    padding: "0 30px 0 11px",
    fontSize: UI_FONT.body,
    fontWeight: 700,
    lineHeight: 1.2,
    boxShadow: UI_CONTROL.shadow.soft,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.72) 50%), linear-gradient(135deg, rgba(255,255,255,0.72) 50%, transparent 50%), linear-gradient(to right, transparent, transparent)",
    backgroundPosition: "calc(100% - 16px) calc(50% - 1px), calc(100% - 10px) calc(50% - 1px), 100% 0",
    backgroundSize: "6px 6px, 6px 6px, 2.2em 2.2em",
    backgroundRepeat: "no-repeat"
  },
  selectWide: {
    flex: "1 1 0",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%"
  },
  proMotionSelectShell: {
    position: "relative",
    flex: 1,
    minWidth: 0
  },
  proShotLanguageBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    textAlign: "left",
    appearance: "none",
    backgroundColor: editorTheme.colors.bg,
    border: `1px solid ${editorTheme.colors.border}`,
    borderRadius: editorTheme.radius.input,
    padding: `${editorTheme.spacing.selectPaddingY}px ${editorTheme.spacing.selectPaddingX}px`,
    color: editorTheme.colors.text,
    fontSize: editorTheme.typography.bodySize,
    cursor: "pointer",
    outline: "none",
    minHeight: editorTheme.sizing.controlHeight
  },
  proShotLanguageValue: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.24
  },
  proMotionSelectBtn: {
    width: "100%",
    textAlign: "left"
  },
  proMotionSelectValue: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.24
  },
  proMotionSelectMenu: {
    width: 188,
    maxHeight: 320,
    overflowY: "auto",
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: "#0b0f16",
    boxShadow: "0 18px 36px rgba(0,0,0,0.56)",
    padding: 0,
    zIndex: 30,
    display: "grid",
    gap: 0
  },
  proCascadeRoot: {
    position: "fixed",
    display: "flex",
    alignItems: "flex-start",
    zIndex: 12050
  },
  proCascadeSubmenu: {
    width: 188,
    maxHeight: 320,
    overflowY: "auto",
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: "#0b0f16",
    boxShadow: "0 18px 36px rgba(0,0,0,0.56)",
    padding: 0,
    display: "grid",
    gap: 0,
    position: "absolute",
    zIndex: 12051
  },
  proMotionSelectItem: {
    border: "none",
    borderRadius: 0,
    background: "transparent",
    color: "#ffffff",
    textAlign: "left",
    minHeight: UI_SIZE.controlH,
    height: UI_SIZE.controlH,
    padding: "0 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  proMotionSelectItemTitle: {
    fontSize: UI_FONT.body,
    fontWeight: 700,
    lineHeight: 1.3
  },
  proMotionSelectItemDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.38
  },
  proMenuRow: {
    border: "none",
    borderRadius: 0,
    background: "transparent",
    color: "#ffffff",
    textAlign: "left",
    minHeight: UI_SIZE.controlH,
    height: UI_SIZE.controlH,
    padding: "0 10px",
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: UI_FONT.body,
    fontWeight: 700,
    lineHeight: 1.24,
    whiteSpace: "nowrap"
  },
  proMenuRowActive: {
    background: "linear-gradient(180deg, rgba(130,104,70,0.96), rgba(102,80,53,0.96))",
    color: "#ffffff"
  },
  proMenuRowDisabled: {
    color: "rgba(255,255,255,0.28)",
    cursor: "not-allowed"
  },
  proMotionBlock: {
    display: "grid",
    gap: 6,
    marginBottom: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "none",
    background: "transparent"
  },
  proTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  infoDotBtn: {
    width: 20,
    height: 20,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: 900,
    cursor: "help",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1
  },
  labelTooltipTrigger: {
    border: "none",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    padding: 0,
    margin: 0,
    cursor: "help",
    textAlign: "left"
  },
  proMotionSubtitle: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.62)"
  },
  proMotionToggleRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  proMotionToggleBtn: {
    minHeight: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    padding: "0 14px",
    fontSize: 12,
    fontWeight: 850,
    cursor: "pointer"
  },
  proPlusToggleBtn: {
    letterSpacing: "0.04em"
  },
  proMotionToggleBtnOn: {
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.28)"
  },
  proMotionSummary: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.78)"
  },
  proMotionPanel: {
    display: "grid",
    gap: 12
  },
  proPlusGroup: {
    display: "grid",
    gap: 8
  },
  proPlusInlineDesc: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.58)",
    paddingLeft: UI_SIZE.labelWSidebar
  },
  proPlusGroupTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.9)"
  },
  proPlusOptionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8
  },
  proPlusOptionBtn: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    padding: "10px 10px 11px",
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: 6,
    minHeight: 86
  },
  proPlusOptionBtnOn: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.28)"
  },
  proPlusOptionBtnDisabled: {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.28)",
    cursor: "not-allowed"
  },
  proPlusOptionTitle: {
    fontSize: 12,
    fontWeight: 900
  },
  proPlusOptionDesc: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "inherit"
  },
  proMotionHint: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.58)"
  },
  proDirectorBlock: {
    display: "grid",
    gap: 12,
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "none",
    background: "transparent"
  },
  proDirectorTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "rgba(255,255,255,0.96)"
  },
  proDirectorHint: {
    fontSize: 11,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.62)"
  },
  proDirectorActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  proTooltip: {
    position: "fixed",
    zIndex: 130,
    transform: "translate(-50%, -100%)",
    maxWidth: 280,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(12,12,12,0.92)",
    color: "rgba(255,255,255,0.94)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.38)",
    fontSize: 11,
    lineHeight: 1.45,
    pointerEvents: "none"
  },

  // ✅ toast（Pro 工作台：统一信息框样式）
  toast: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    marginBottom: 8,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.2,
    maxHeight: "var(--pro-info-height)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "flex",
    alignItems: "center",
    color: "var(--pro-text-primary)"
  },
  floatingHint: {
    position: "fixed",
    zIndex: 120,
    transform: "translateX(-50%)",
    width: "max-content",
    minWidth: 108,
    maxWidth: "min(320px, calc(100vw - 24px))",
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.35,
    textAlign: "center",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    pointerEvents: "none",
    backdropFilter: "blur(6px)"
  },
  floatingHintInfo: {
    background: "color-mix(in srgb, var(--pro-bg-panel) 95%, transparent)",
    border: "1px solid var(--pro-border)",
    color: "var(--pro-text-primary)"
  },
  floatingHintDanger: {
    background: "color-mix(in srgb, var(--pro-bg-panel) 95%, transparent)",
    border: "1px solid var(--pro-accent)",
    color: "var(--pro-text-primary)"
  },

  // ✅ confirm modal
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 420,
    maxWidth: "100%",
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: "rgba(12,17,27,0.96)",
    boxShadow: UI_EFFECT.floatShadow,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 0, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },
  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 2 }
};
