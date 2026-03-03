import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Project, Scene, Layer, ShotPlan, Direction, TransitionType } from "../model";
import { UI_FONT, UI_OPACITY, UI_SIZE } from "../uiTokens";
import { Plus, Minus } from "lucide-react";

type Props = {
  lang: Lang;
  project: Project;
  projectFileLabel?: string;
  sceneIdx: number;
  setSceneIdx: (i: number) => void;
  onUpdateProject: (p: Project) => void;
  onRequestNewProject: () => void;

  scene: Scene;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
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
  const n = (name ?? "").trim();
  if (!n) return `${sceneNo} ${fallbackId}`;
  // 避免重复编号：如 "01 01｜镜头01"
  if (/^\d{1,3}\s*[｜|]/.test(n)) return n;
  return `${sceneNo} ${n}`;
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

// ✅ NEW: pick next default scene name by scanning existing names
function nextSceneDefaultName(lang: Lang, scenes: Scene[]) {
  const zh = lang === "zh";
  const prefix = zh ? "分镜 " : "Scene ";
  const re = zh ? /^分镜\s*(\d+)\s*$/ : /^scene\s*(\d+)\s*$/i;

  const used = new Set<number>();
  for (const s of scenes) {
    const name = (s?.name ?? "").trim();
    const m = name.match(re);
    if (m) used.add(Number(m[1]));
  }

  for (let i = 1; i < 9999; i++) {
    if (!used.has(i)) return `${prefix}${i}`;
  }

  return `${prefix}${scenes.length + 1}`;
}

// -------------------- Media mode marker in scene.notes --------------------
type MediaMode = "image" | "video";
const MEDIA_MARK = "media:";
type GenMode = "quick" | "pro";
const GEN_MARK = "genmode:";

function parseMedia(notes: string): MediaMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(MEDIA_MARK));
  if (!hit) return "video"; // existing scenes without marker -> treat as video
  const v = hit.trim().slice(MEDIA_MARK.length).trim().toLowerCase();
  return v === "image" ? "image" : "video";
}

function setMedia(notes: string, mode: MediaMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(MEDIA_MARK));
  return [`${MEDIA_MARK} ${mode}`, ...rest].join("\n");
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
type StabilityMode = "off" | "standard" | "strict";
type FloatingHintTone = "info" | "danger";
const STAB_MARK = "stability:";

function parseStability(notes: string): StabilityMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(STAB_MARK));
  if (!hit) return "standard"; // default
  const v = hit.trim().slice(STAB_MARK.length).trim().toLowerCase();
  // backward compatibility: historical "on" maps to "standard"
  if (v === "on") return "standard";
  if (v === "strict") return "strict";
  if (v === "off") return "off";
  return "standard";
}

function setStability(notes: string, mode: StabilityMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(STAB_MARK));
  return [`${STAB_MARK} ${mode}`, ...rest].join("\n");
}

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
    projectFileLabel,
    sceneIdx,
    setSceneIdx,
    onUpdateProject,
    onRequestNewProject,
    scene,
    selectedLayerId,
    onSelectLayer,
    onUpdateScene
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
  const sceneNotes = scene?.notes ?? "";
  const stabilityMode = useMemo<StabilityMode>(() => parseStability(sceneNotes), [sceneNotes]);
  const projectShotPlan: ShotPlan = (project.project?.shotPlan as ShotPlan) ?? "single";
  const projectMediaType: MediaMode = (project.project?.mediaType as MediaMode) ?? "video";
  const isImageProject = projectMediaType === "image";
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
  const [showGenHint, setShowGenHint] = useState(false);

  // ✅ 替代 alert/confirm：轻量 toast + 自定义确认框
  const [toastText, setToastText] = useState<string>("");
  const toastTimerRef = useRef<number | null>(null);
  const [floatingHint, setFloatingHint] = useState<{ text: string; top: number; left: number; tone: FloatingHintTone } | null>(null);
  const floatingHintTimerRef = useRef<number | null>(null);
  const deleteHintAnchorRef = useRef<HTMLElement | null>(null);

  const [confirmDelIdx, setConfirmDelIdx] = useState<number | null>(null);

  function projectMediaDefault(): MediaMode {
    return project.project?.mediaType === "image" ? "image" : "video";
  }
  function projectShotPlanDefault(): ShotPlan {
    const p = project.project?.shotPlan as ShotPlan;
    if (p === "single" || p === "multicam" || p === "continuous" || p === "edit") return p;
    return "single";
  }

  function addSceneByProjectDefaults(anchorEl: HTMLElement | null) {
    const mode = projectMediaDefault();
    const shotPlan = projectShotPlanDefault();
    const genMode: GenMode = parseGenMode(scene?.notes ?? "");
    const duration_s = Math.max(1, Math.round(Number(scene?.duration_s) || 6));
    const name = nextSceneDefaultName(lang, scenes);
    const idxNo = scenes.length + 1;
    const id = nextId("s", (x) => scenes.some((s) => s.id === x));
    const copyLayers = JSON.parse(JSON.stringify(scene.layers ?? [])) as Layer[];
    const nextSceneObj: Scene = {
      id,
      index: idxNo,
      name,
      duration_s,
      cameraPreset: mode === "video" ? "first-person" : "",
      inheritFromPrevious: mode === "video" && idxNo > 1 && (shotPlan === "multicam" || shotPlan === "continuous"),
      ...defaultRefInheritByPlan(shotPlan, mode !== "video" || idxNo <= 1),
      transitionType: mode === "video" ? defaultTransitionByPlan(shotPlan) : "cut",
      entryDir: mode === "video" && shotPlan === "continuous" && idxNo > 1 ? "E" : undefined,
      exitDir: mode === "video" && shotPlan === "continuous" ? "E" : undefined,
      camera: {
        shot: "",
        movement: "",
        keyframes: [
          { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
        ]
      } as any,
      lighting: { time: "", key_dir: "", mood: "" } as any,
      layoutLocked: false,
      layers: [],
      notes: setGenMode(setMedia("", mode), genMode)
    };
    if (mode === "video" && shotPlan === "multicam") {
      nextSceneObj.layers = copyLayers;
      nextSceneObj.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
    } else if (mode === "video" && shotPlan === "continuous") {
      nextSceneObj.layers = copyLayers;
      nextSceneObj.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
    } else if (mode === "video" && shotPlan === "edit") {
      nextSceneObj.layers = [];
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
    setFloatingHint({
      text,
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
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

  function commitStabilityMode(mode: StabilityMode) {
    const nextNotes = setStability(scene.notes ?? "", mode);
    onUpdateScene({ ...scene, notes: nextNotes });
    showToast(
      mode === "strict"
        ? tt("sidebar.constraintToastStrict")
        : mode === "standard"
          ? tt("sidebar.constraintToastStandard")
          : tt("sidebar.constraintToastOff")
    );
  }

  function cancelAddScenePanel() {
    setNewScene((s) => ({ ...s, open: false }));
    setShowGenHint(false);
  }

  function confirmAddScene(anchorEl: HTMLElement | null) {
    const fallbackName = nextSceneDefaultName(lang, scenes);
    const name = (newScene.name ?? "").trim() || fallbackName;
    const mode: MediaMode = newScene.mode;
    const genMode: GenMode = newScene.genMode;
    const shotPlan: ShotPlan = resolveShotPlanFromDraft(newScene);

    // ✅ keep data stable: even image keeps duration_s in data, but UI badge won't show it
    const duration_s = mode === "video" ? Math.max(0, Math.round(Number(newScene.duration_s) || 0)) : 6;
    const askedCount = Math.max(1, Math.round(Number(newScene.shotCount) || defaultShotCountForPlan(shotPlan)));
    const shotCount =
      mode === "image" || shotPlan === "single" ? 1 : Math.max(2, askedCount);
    const baseLayers = JSON.parse(JSON.stringify(scene.layers ?? [])) as Layer[];

    const makeBaseScene = (sceneName: string, index: number): Scene => {
      const id = nextId("s", (x) => scenes.some((s) => s.id === x) || addedScenes.some((s) => s.id === x));
      return {
        id,
        index,
        name: sceneName,
        duration_s,
        cameraPreset: mode === "video" ? "first-person" : "",
        inheritFromPrevious: mode === "video" && index > 1 && (shotPlan === "multicam" || shotPlan === "continuous"),
        ...defaultRefInheritByPlan(shotPlan, mode !== "video" || index <= 1),
        transitionType: mode === "video" ? defaultTransitionByPlan(shotPlan) : "cut",
        entryDir: shotPlan === "continuous" && index > 1 ? "E" : undefined,
        exitDir: shotPlan === "continuous" ? "E" : undefined,
        camera: {
          shot: "",
          movement: "",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        } as any,
        lighting: { time: "", key_dir: "", mood: "" } as any,
        layoutLocked: false,
        layers: [],
        notes: setGenMode(setMedia("", mode), genMode)
      };
    };

    const addedScenes: Scene[] = [];
    if (mode === "video" && shotCount > 1) {
      for (let i = 0; i < shotCount; i++) {
        const idxNo = scenes.length + i + 1;
        const padded = String(idxNo).padStart(2, "0");
        const s = makeBaseScene(`${padded}｜${name}${i === 0 ? "" : ` ${i + 1}`}`, idxNo);
        if (shotPlan === "multicam") {
          s.layers = JSON.parse(JSON.stringify(baseLayers));
          s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
        } else if (shotPlan === "continuous") {
          s.layers = JSON.parse(JSON.stringify(baseLayers));
          s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
        }
        if (shotPlan === "edit") {
          s.layers = i === 0 ? JSON.parse(JSON.stringify(baseLayers)) : [];
        }
        addedScenes.push(s);
      }
      if (addedScenes.length) addedScenes[addedScenes.length - 1].exitDir = undefined;
    } else {
      const s = makeBaseScene(name, scenes.length + 1);
      if (shotPlan === "multicam") {
        s.layers = JSON.parse(JSON.stringify(baseLayers));
        s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
      } else if (shotPlan === "continuous") {
        s.layers = JSON.parse(JSON.stringify(baseLayers));
        s.backgroundRef = scene.backgroundRef ? JSON.parse(JSON.stringify(scene.backgroundRef)) : undefined;
      }
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
    const id = nextId("obj", (x) => layers.some((l) => l.id === x));
    const spawn = suggestSpawnKf(layers);

    // ✅ 优化：新增对象默认“未填写”，避免给模型不必要的先验（比如默认 character）
    const newLayer: Layer = {
      id,
      type: "", // ✅ was "character"
      shape: "rect",
      shapeDesc: "",
      look: "",
      z: layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 10,
      color: "#b7c3ff",
      opacity: 1,
      kf: [{ t: 0, x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h, rot: 0 }],
      notes: "",
      externalPrompt: "",
      referenceLinks: "",
      localRefs: [],
      referencePolicy: "optional"
    };

    onUpdateScene({ ...scene, layers: [...layers, newLayer] });
    onSelectLayer(id);

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
      { v: "dutch_angle", label: tt("opt.dutch_angle") }
    ],
    [tt]
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

  return (
    <div style={styles.wrap}>
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
              <button type="button" style={styles.btnGhost} onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmDelIdx(null)}>
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                style={styles.btnDanger}
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

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.type")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, mode: "image", shotCount: "1" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "image" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.image")}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    setNewScene((s) => ({
                      ...s,
                      mode: "video",
                      shotCount: String(defaultShotCountForPlan(resolveShotPlanFromDraft({ ...s, mode: "video" } as NewSceneDraft)))
                    }))
                  }
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "video" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.video")}
                </button>
              </div>
            </div>
            {newScene.mode === "video" ? (
              <>
                <div style={styles.addRow}>
                  <div style={styles.addLabel}>{lang === "zh" ? "Q1 场景变化" : "Q1 Location"}</div>
                  <select
                    value={newScene.locationScope}
                    onChange={(e) => setNewScene((s) => ({ ...s, locationScope: e.target.value as "same" | "different" }))}
                    style={styles.select}
                  >
                    <option value="same">{lang === "zh" ? "不变（同一地点）" : "Same location"}</option>
                    <option value="different">{lang === "zh" ? "变化（多地点）" : "Different locations"}</option>
                  </select>
                </div>
                {newScene.locationScope === "same" ? (
                  <div style={styles.addRow}>
                    <div style={styles.addLabel}>{lang === "zh" ? "Q2 镜头移动" : "Q2 Camera Move"}</div>
                    <select
                      value={newScene.cameraTravel}
                      onChange={(e) => {
                        const nextTravel = e.target.value as "angle_only" | "travel";
                        const nextPlan = nextTravel === "travel" ? "continuous" : "multicam";
                        setNewScene((s) => ({ ...s, cameraTravel: nextTravel, shotCount: String(defaultShotCountForPlan(nextPlan)) }));
                      }}
                      style={styles.select}
                    >
                      <option value="angle_only">{lang === "zh" ? "只换机位" : "Angle change only"}</option>
                      <option value="travel">{lang === "zh" ? "连续移动" : "Continuous travel"}</option>
                    </select>
                  </div>
                ) : (
                  <div style={styles.addRow}>
                    <div style={styles.addLabel}>{lang === "zh" ? "Q3 允许跳切" : "Q3 Jump Cut"}</div>
                    <select
                      value={newScene.allowJump}
                      onChange={(e) => {
                        const v = e.target.value as "yes" | "no";
                        const nextPlan = v === "yes" ? "edit" : "continuous";
                        setNewScene((s) => ({ ...s, allowJump: v, shotCount: String(defaultShotCountForPlan(nextPlan)) }));
                      }}
                      style={styles.select}
                    >
                      <option value="yes">{lang === "zh" ? "允许（标准剪辑）" : "Yes (Edit)"}</option>
                      <option value="no">{lang === "zh" ? "不允许（连续跨场）" : "No (Continuous)"}</option>
                    </select>
                  </div>
                )}
                <div style={styles.addRow}>
                  <div style={styles.addLabel}>{lang === "zh" ? "分镜数量" : "Shot Count"}</div>
                  <input
                    value={newScene.shotCount}
                    onChange={(e) => setNewScene((s) => ({ ...s, shotCount: e.target.value }))}
                    style={styles.addInputSmall}
                    inputMode="numeric"
                  />
                </div>
                <div style={styles.genHintFloat}>
                  {lang === "zh"
                    ? `已选模式：${resolveShotPlanFromDraft(newScene)}`
                    : `Mode: ${resolveShotPlanFromDraft(newScene)}`}
                </div>
              </>
            ) : null}

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.mode")}</div>
              <div style={styles.genModeRow}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, genMode: "quick" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.genMode === "quick" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.quick")}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, genMode: "pro" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.genMode === "pro" ? styles.mediaBtnOn : {}) }}
                >
                  PRO
                </button>
                <button
                  type="button"
                  style={styles.qBtn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowGenHint((v) => !v)}
                  title={tt("sidebar.showModeDiff")}
                >
                  ?
                </button>
              </div>
            </div>
            {showGenHint ? (
              <div style={styles.genHintFloat}>
                {tt("sidebar.modeDiffHint")}
              </div>
            ) : null}

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.name")}</div>
              <input
                value={newScene.name}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setNewScene((s) => ({ ...s, name: e.target.value }))}
                maxLength={40}
                style={styles.addInput}
                placeholder={tt("sidebar.namePlaceholder")}
              />
            </div>

            <div style={{ ...styles.addRow, visibility: newScene.mode === "video" ? "visible" : "hidden" }}>
              <div style={styles.addLabel}>{tt("sidebar.seconds")}</div>
              <input
                value={newScene.duration_s}
                onChange={(e) => setNewScene((s) => ({ ...s, duration_s: e.target.value }))}
                style={styles.addInputSmall}
                inputMode="numeric"
                disabled={newScene.mode !== "video"}
              />
            </div>

            <div style={styles.modalBtns}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelAddScenePanel}
                style={styles.btnGhost}
              >
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => confirmAddScene(e.currentTarget as HTMLElement)}
                style={styles.btnPrimary}
              >
                {tt("sidebar.create")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Scenes */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{lang === "zh" ? "项目" : "Project"}</div>
        </div>
        <div style={styles.projectNameRow}>
          <div style={styles.projectName}>
            {projectFileLabel?.trim() || (lang === "zh" ? "未命名" : "Untitled")}
          </div>
          <button
            type="button"
            style={styles.newProjectBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRequestNewProject}
            title={lang === "zh" ? "创建新项目" : "Create New Project"}
          >
            {lang === "zh" ? "创建新项目" : "New Project"}
          </button>
        </div>

        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.scenes")}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={styles.iconBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => addSceneByProjectDefaults(e.currentTarget as HTMLElement)}
            title={tt("sidebar.addScene")}
            disabled={isImageProject}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={styles.list}>
          {scenes.map((s, i) => {
            const isOn = i === safeIdx;
            const mode = parseMedia(s.notes ?? "");
            const badgeText = mode === "image" ? tt("sidebar.image") : fmtDuration(lang, s.duration_s);
            const sceneIndex = Number.isFinite(s.index) ? Number(s.index) : i + 1;
            const sceneNo = String(sceneIndex).padStart(2, "0");

            return (
              <div key={s.id} style={styles.itemRowWrap}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.rowBtn, ...(isOn ? styles.rowBtnOn : {}) }}
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
                  <div style={styles.rowInner}>
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
                        style={styles.renameInput}
                      />
                    ) : (
                      <div
                        style={styles.renameText}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingSceneId(s.id);
                          setSceneNameDraft(s.name ?? "");
                        }}
                        title={tt("sidebar.renameHint")}
                      >
                        {formatSceneRowName(sceneNo, s.name, s.id)}
                      </div>
                    )}

                    {/* ✅ badge: image shows IMG/图片; video shows seconds (editable) */}
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
                          style={styles.durInput}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          style={styles.badgeBtn}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingDurSceneId(s.id);
                            setDurDraft(String(Math.max(0, Math.round(Number(s.duration_s) || 0))));
                          }}
                          title={tt("sidebar.editDuration")}
                        >
                          {badgeText}
                        </div>
                      )
                    ) : (
                      <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={tt("sidebar.imageScene")}>
                        {badgeText}
                      </div>
                    )}
                    {mode === "video" && i > 0 ? (
                      <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={s.inheritFromPrevious ? (lang === "zh" ? "继承上一镜布局" : "Inherit previous shot layout") : (lang === "zh" ? "独立镜头布局" : "Independent shot layout")}>
                        {s.inheritFromPrevious ? (lang === "zh" ? "继承" : "Inherit") : (lang === "zh" ? "独立" : "Independent")}
                      </div>
                    ) : null}
                    {mode === "video" && i > 0 && i < scenes.length - 1 ? (
                      <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={lang === "zh" ? "衔接方式" : "Transition"}>
                        {transitionLabel(lang, s.transitionType)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.iconBtnDanger}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => requestDeleteScene(i, e.currentTarget as HTMLElement)}
                  title={tt("sidebar.deleteScene")}
                  disabled={scenes.length <= 1 || isImageProject}
                >
                  <Minus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objects */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.layers")}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={styles.iconBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={addLayer}
            title={tt("sidebar.addLayer")}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={styles.list}>
          {(scene.layers ?? []).length === 0 ? (
            <div style={{ ...styles.rowBtn, ...styles.placeholderRow }} title={lang === "zh" ? "示例占位，不会写入项目" : "Example placeholder only"}>
              <div style={styles.rowInner}>
                <div style={styles.renameText}>{lang === "zh" ? "人物1" : "character1"}</div>
              </div>
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
                    style={{ ...styles.rowBtn, ...(isOn ? styles.rowBtnOn : {}) }}
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
                          style={styles.renameInput}
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
                    style={styles.iconBtnDanger}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => deleteLayer(l.id)}
                    title={tt("sidebar.deleteLayer")}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              );
            })}
        </div>

      </div>

      {/* Stability */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.constraintTitle")}</div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("sidebar.constraintField")}</div>
          <select value={stabilityMode} onChange={(e) => commitStabilityMode(e.target.value as StabilityMode)} style={styles.select}>
            <option value="off">{tt("sidebar.constraintOff")}</option>
            <option value="standard">{tt("sidebar.constraintStandard")}</option>
            <option value="strict">{tt("sidebar.constraintStrict")}</option>
          </select>
        </div>

        <div style={styles.mediaHint}>{tt("sidebar.constraintHint")}</div>
      </div>

      {/* Camera + Lighting */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>{tt("camera.title")}</div>

        {projectMediaType === "video" && projectShotPlan === "continuous" ? (
          <>
            <div style={styles.formRow}>
              <div style={styles.formLabel}>{lang === "zh" ? "入镜方向" : "Entry"}</div>
              <select
                style={styles.select}
                value={(scene.entryDir ?? "").toString()}
                onChange={(e) => onUpdateScene({ ...scene, entryDir: (e.target.value || undefined) as Direction | undefined })}
              >
                <option value="">{lang === "zh" ? "自动" : "Auto"}</option>
                <option value="N">N</option>
                <option value="NE">NE</option>
                <option value="E">E</option>
                <option value="SE">SE</option>
                <option value="S">S</option>
                <option value="SW">SW</option>
                <option value="W">W</option>
                <option value="NW">NW</option>
              </select>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formLabel}>{lang === "zh" ? "出镜方向" : "Exit"}</div>
              <select
                style={styles.select}
                value={(scene.exitDir ?? "").toString()}
                onChange={(e) => onUpdateScene({ ...scene, exitDir: (e.target.value || undefined) as Direction | undefined })}
              >
                <option value="">{lang === "zh" ? "自动" : "Auto"}</option>
                <option value="N">N</option>
                <option value="NE">NE</option>
                <option value="E">E</option>
                <option value="SE">SE</option>
                <option value="S">S</option>
                <option value="SW">SW</option>
                <option value="W">W</option>
                <option value="NW">NW</option>
              </select>
            </div>
          </>
        ) : null}

        {projectMediaType === "video" && projectShotPlan !== "single" ? (
          <>
            <div style={styles.formRow}>
              <div style={styles.formLabel}>{lang === "zh" ? "对象继承" : "Inherit Objects"}</div>
              <select
                style={styles.select}
                value={scene.inheritFromPrevious ? "on" : "off"}
                onChange={(e) => {
                  const on = e.target.value === "on";
                  const forced = projectShotPlan === "continuous" ? true : on;
                  onUpdateScene({ ...scene, inheritFromPrevious: forced });
                }}
                disabled={safeIdx === 0 || projectShotPlan === "continuous"}
              >
                <option value="on">{lang === "zh" ? "开启" : "On"}</option>
                <option value="off">{lang === "zh" ? "关闭" : "Off"}</option>
              </select>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formLabel}>{lang === "zh" ? "衔接方式" : "Transition"}</div>
              <select
                style={styles.select}
                value={(scene.transitionType ?? defaultTransitionByPlan(projectShotPlan)).toString()}
                onChange={(e) => onUpdateScene({ ...scene, transitionType: e.target.value as TransitionType })}
                disabled={projectShotPlan === "continuous" || safeIdx >= scenes.length - 1}
              >
                <option value="cut">{lang === "zh" ? "切换 (cut)" : "Cut"}</option>
                <option value="reverse_angle">{lang === "zh" ? "反打 (reverse angle)" : "Reverse angle"}</option>
                <option value="camera_continues">{lang === "zh" ? "连续推进 (camera continues)" : "Camera continues"}</option>
                <option value="dissolve">{lang === "zh" ? "叠化 (dissolve)" : "Dissolve"}</option>
                <option value="time_jump">{lang === "zh" ? "时间跳转 (time jump)" : "Time jump"}</option>
              </select>
            </div>
          </>
        ) : null}

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("camera.shot")}</div>
          <select
            style={styles.select}
            value={(scene.camera?.shot ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, camera: { ...scene.camera, shot: e.target.value } as any })}
          >
            {shotOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("camera.movement")}</div>
          <select
            style={styles.select}
            value={(scene.camera?.movement ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, camera: { ...scene.camera, movement: e.target.value } as any })}
          >
            {moveOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 8 }} />

        <div style={styles.sectionTitle}>{tt("lighting.title")}</div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.time")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.time ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, time: e.target.value } as any })}
          >
            {timeOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.keyDir")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.key_dir ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, key_dir: e.target.value } as any })}
          >
            {dirOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.mood")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.mood ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, mood: e.target.value } as any })}
          >
            {moodOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 320,
    minWidth: 280,
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.12)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
    overflow: "auto",
    position: "relative"
  },

  section: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    padding: 12
  },

  sectionHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontWeight: 900, fontSize: UI_FONT.section, opacity: UI_OPACITY.title },
  projectNameRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
    marginBottom: 10
  },
  projectName: {
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: "8px 10px",
    fontSize: UI_FONT.body,
    fontWeight: 800,
    opacity: 0.9,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  newProjectBtn: {
    height: 32,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap"
  },

  mediaRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8
  },
  mediaHint: {
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.55,
    fontWeight: 800,
    padding: "0 2px 10px 2px"
  },
  profileHint: {
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.68,
    fontWeight: 800,
    padding: "0 2px 6px 2px"
  },

  mediaBtn: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.18)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    userSelect: "none",
    outline: "none",
    boxShadow: "none",
    padding: "0 10px"
  },
  mediaBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },

  // ✅ New scene card
  addCard: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.18)",
    padding: 12,
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
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.3
  },
  addInput: {
    flex: 1,
    width: "100%",
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 800
  },
  addInputSmall: {
    width: 92,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 800,
    textAlign: "right"
  },
  addActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 },
  genModeRow: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, flex: 1, alignItems: "center" },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none"
  },
  genHintFloat: {
    fontSize: 11,
    lineHeight: 1.35,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(0,0,0,0.18)",
    padding: "8px 10px",
    opacity: 0.78,
    marginTop: 0
  },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },
  btnPrimary: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },
  btnDanger: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  itemRowWrap: { display: "flex", gap: 8, alignItems: "center" },

  rowBtn: {
    flex: 1,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.18)",
    color: "inherit",
    cursor: "pointer",
    padding: "8px 10px",
    userSelect: "none",
    outline: "none",
    boxShadow: "none"
  },

  rowBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },
  placeholderRow: {
    opacity: 0.55,
    cursor: "default"
  },

  rowInner: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },

  renameText: {
    flex: 1,
    minWidth: 0,
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "2px 6px",
    borderRadius: 8,
    opacity: 0.92
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
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.85,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    userSelect: "none",
    outline: "none",
    boxShadow: "none"
  },
  durInput: {
    width: 64,
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    outline: "none",
    boxShadow: "none"
  },
  iconBtnDanger: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 34px",
    lineHeight: 0,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    opacity: 0.95,
    outline: "none",
    boxShadow: "none"
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
    lineHeight: 1.3
  },
  select: {
    flex: 1,
    minWidth: 0,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 34px 0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 700
  },

  // ✅ toast（左下角）
  toast: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    marginBottom: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.92)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.92
  },
  floatingHint: {
    position: "fixed",
    zIndex: 120,
    transform: "translateX(-50%)",
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    fontSize: 12,
    fontWeight: 900,
    pointerEvents: "none",
    backdropFilter: "blur(4px)"
  },
  floatingHintInfo: {
    background: "rgba(15,20,35,0.94)",
    color: "rgba(255,255,255,0.95)"
  },
  floatingHintDanger: {
    background: "rgba(55,20,20,0.95)",
    border: "1px solid rgba(255,120,120,0.45)",
    color: "rgba(255,235,235,0.96)"
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
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 0, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },
  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 2 }
};
