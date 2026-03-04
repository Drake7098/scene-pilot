import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { t } from "./i18n";
import { defaultProject, sanitizeProject } from "./model";
import type { Project, Scene, ShotPlan, TransitionType } from "./model";
import { loadLang, saveLang, loadProject, saveProject } from "./utils/storage";

import { Sidebar } from "./components/Sidebar";
import { Stage } from "./components/Stage";
import { PropsPanel } from "./components/PropsPanel";
import { ExportPanel } from "./components/ExportPanel";
import {
  CreateWizard,
  type CreateStep,
  type WizardDraft
} from "./components/CreateWizard";
import { generatePrompts } from "./utils/prompt";
import type { PromptProfile } from "./utils/prompt";
import { getRefBlob } from "./utils/localRefs";

import {
  Languages,
  Menu,
  FilePlus2,
  Save,
  SaveAll,
  BookOpen,
  MessageSquareWarning,
  Info
} from "lucide-react";

// ✅ telemetry (需要你已添加 ./utils/analytics.ts)
import {
  isTelemetryOn,
  setTelemetryOptIn,
  track,
  flush,
  newSession,
  installGlobalErrorHooks,
  sendFeedback
} from "./utils/analytics";

type FSDirectoryHandle = any;
type LibraryEntry = { name: string; kind: "file" | "directory" };
type SavePlatformId =
  | "universal"
  | "midjourney"
  | "runway"
  | "pika"
  | "luma"
  | "krea"
  | "jimeng"
  | "keling"
  | "vidu"
  | "hailuo"
  | "wanx";
type SavePlatformPickMode = "save" | "save_as" | "save_all";
const LIB_DB_NAME = "scenepilot_library_handles";
const LIB_DB_STORE = "handles";
const LIB_DB_VER = 1;
const LIB_ROOT_KEY = "root";
const LIB_INIT_KEY = "spx_library_initialized";

function openLibDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LIB_DB_NAME, LIB_DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIB_DB_STORE)) db.createObjectStore(LIB_DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePersistedLibraryRootHandle(handle: any): Promise<void> {
  const db = await openLibDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readwrite");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.put(handle, LIB_ROOT_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function loadPersistedLibraryRootHandle(): Promise<any | null> {
  const db = await openLibDb();
  return await new Promise<any | null>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readonly");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.get(LIB_ROOT_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

type HelpModal = "tutorial" | "feedback" | "about" | null;
const ONBOARDING_KEY = "sp_onboarding_done";
const SAVE_PLATFORM_KEY = "sp_save_prompt_platform";

function savePlatformToProfile(id: SavePlatformId): PromptProfile {
  if (id === "midjourney" || id === "krea") return "midjourney";
  if (id === "runway" || id === "pika" || id === "luma" || id === "vidu" || id === "hailuo") return "runway";
  if (id === "jimeng" || id === "keling") return "jimeng";
  if (id === "wanx") return "qwen";
  return "universal";
}

function savePlatformLabel(id: SavePlatformId, lang: Lang) {
  const map: Record<SavePlatformId, { zh: string; en: string }> = {
    universal: { zh: "通用", en: "Universal" },
    midjourney: { zh: "Midjourney", en: "Midjourney" },
    runway: { zh: "Runway", en: "Runway" },
    pika: { zh: "Pika", en: "Pika" },
    luma: { zh: "Luma", en: "Luma" },
    krea: { zh: "Krea", en: "Krea" },
    jimeng: { zh: "即梦", en: "Jimeng" },
    keling: { zh: "可灵", en: "Keling" },
    vidu: { zh: "Vidu", en: "Vidu" },
    hailuo: { zh: "海螺 AI", en: "Hailuo AI" },
    wanx: { zh: "通义万相", en: "Wanx" }
  };
  return lang === "zh" ? map[id].zh : map[id].en;
}

const SAVE_PLATFORM_OPTIONS: SavePlatformId[] = ["universal", "midjourney", "runway", "pika", "luma", "krea", "jimeng", "keling", "vidu", "hailuo", "wanx"];

function defaultRefInheritByPlan(shotPlan: ShotPlan, isFirst: boolean) {
  if (isFirst || shotPlan === "single") {
    return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "off" as const };
  }
  if (shotPlan === "multicam" || shotPlan === "continuous") {
    return { inheritBgRefFromPrevious: true, inheritObjectRefsFromPrevious: "all" as const };
  }
  return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "identity_only" as const };
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [project, setProject] = useState<Project>(() => loadProject() ?? defaultProject());
  const [sceneIdx, setSceneIdx] = useState<number>(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editT, setEditT] = useState<0 | 1>(0);

  const [, setFileHandle] = useState<any | null>(null);
  const [fileLabel, setFileLabel] = useState<string>(() => {
    try {
      return localStorage.getItem("scene_pilot_last_file_label") || "";
    } catch {
      return "";
    }
  });

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardCancelable, setWizardCancelable] = useState(false);
  const [wizardStep, setWizardStep] = useState<CreateStep>("media");
  const [wizardDraft, setWizardDraft] = useState<WizardDraft>({
    projectName: "",
    mediaType: "video",
    ratio: "16:9",
    sceneTier: "small_plaza",
    shotPlan: "single",
    shotCount: 1,
    totalDuration: 12,
    durationMode: "average",
    manualDurations: [12]
  });

  // ✅ 顶部菜单（除中英文切换外，其它按钮都进下拉）
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);

  // ✅ 帮助类弹窗：新手教程 / 问题反馈 / 关于
  const [helpModal, setHelpModal] = useState<HelpModal>(null);
  const [tutorialPage, setTutorialPage] = useState<0 | 1>(0);
  const [feedbackText, setFeedbackText] = useState("");

  // ✅ 反馈发送状态
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<"ok" | "fail" | "">("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryRootHandle, setLibraryRootHandle] = useState<FSDirectoryHandle | null>(null);
  const [libraryRootName, setLibraryRootName] = useState("");
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);
  const [libraryProjectName, setLibraryProjectName] = useState<string | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryHint, setLibraryHint] = useState("");
  const [, setLibraryHydrated] = useState(false);
  const [newProjectConfirmOpen, setNewProjectConfirmOpen] = useState(false);
  const [newProjectConfirmBusy, setNewProjectConfirmBusy] = useState(false);
  const [savePlatformId, setSavePlatformId] = useState<SavePlatformId>(() => {
    try {
      const raw = localStorage.getItem(SAVE_PLATFORM_KEY) as SavePlatformId | null;
      return raw && SAVE_PLATFORM_OPTIONS.includes(raw) ? raw : "universal";
    } catch {
      return "universal";
    }
  });
  const [savePlatformLocked, setSavePlatformLocked] = useState<boolean>(false);
  const [savePlatformModalOpen, setSavePlatformModalOpen] = useState(false);
  const [savePlatformPickMode, setSavePlatformPickMode] = useState<SavePlatformPickMode>("save");
  const [pendingSavePlatformId, setPendingSavePlatformId] = useState<SavePlatformId>("universal");
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const savePlatformResolverRef = useRef<((id: SavePlatformId | null) => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);
  const useDesktopFixedLayout = viewportWidth >= 1400;
  const emitEvent = useCallback((
    event: "ui_action" | "project_flow" | "editor_change" | "export_flow",
    props: Record<string, any>,
    eventLang: Lang = lang
  ) => {
    if (!isTelemetryOn()) return;
    track(event, props, eventLang);
  }, [lang]);
  const trackUiAction = useCallback((
    area: string,
    action: string,
    target: string,
    props: Record<string, any> = {},
    eventLang: Lang = lang
  ) => emitEvent("ui_action", { area, action, target, ...props }, eventLang), [emitEvent, lang]);
  const trackProjectFlow = useCallback((step: string, props: Record<string, any> = {}, eventLang: Lang = lang) =>
    emitEvent("project_flow", { step, ...props }, eventLang), [emitEvent, lang]);
  const trackEditorChange = useCallback((scope: string, op: string, props: Record<string, any> = {}, eventLang: Lang = lang) =>
    emitEvent("editor_change", { scope, op, ...props }, eventLang), [emitEvent, lang]);
  const trackExportFlow = useCallback((action: string, props: Record<string, any> = {}, eventLang: Lang = lang) =>
    emitEvent("export_flow", { action, ...props }, eventLang), [emitEvent, lang]);

  const safeProject = useMemo(() => {
    if (project.scenes && project.scenes.length > 0) return project;
    return defaultProject();
  }, [project]);

  const scene: Scene = useMemo(() => {
    const list = safeProject.scenes;
    const idx = clampInt(sceneIdx, 0, Math.max(0, list.length - 1));
    return list[idx] ?? list[0];
  }, [safeProject, sceneIdx]);
  const sceneNo = useMemo(() => clampInt(sceneIdx, 0, Math.max(0, safeProject.scenes.length - 1)) + 1, [sceneIdx, safeProject.scenes.length]);
  const currentLibrarySnapshot = useMemo(() => JSON.stringify({ project: safeProject, fileLabel: fileLabel || "" }), [safeProject, fileLabel]);
  const [lastLibrarySavedSnapshot, setLastLibrarySavedSnapshot] = useState<string>("");
  const hasUnsavedLibraryChanges = currentLibrarySnapshot !== lastLibrarySavedSnapshot;

  // ---------------------- mediaMode + editT lock (minimal) ----------------------
  const mediaMode = useMemo<"image" | "video">(() => {
    // 尽量兼容不同字段命名（按你项目实际字段优先命中）
    const s: any = scene as any;
    const m =
      s?.mediaMode ??
      s?.mode ??
      s?.media?.mode ??
      s?.media?.type ??
      s?.export?.mediaMode ??
      "video";
    return m === "image" ? "image" : "video";
  }, [scene]);

  // image 模式强制只用 t0
  const effectiveEditT: 0 | 1 = mediaMode === "image" ? 0 : editT;

  // 当切到 image 时，把状态 editT 拉回 0（避免 UI 残留在 1）
  useEffect(() => {
    if (mediaMode === "image" && editT !== 0) setEditT(0);
  }, [mediaMode, editT]);

  // ---------------------- Telemetry boot (最小新增) ----------------------
  useEffect(() => {
    // ✅ 默认开启埋点（你若要默认关闭：改成 setTelemetryOptIn(false)）
    try {
      const v = localStorage.getItem("spx_telemetry_on");
      if (v == null) setTelemetryOptIn(true);
    } catch {
      // Ignore localStorage access failures (privacy mode / blocked storage).
    }

    // ✅ 新会话
    newSession();

    if (isTelemetryOn()) {
      trackProjectFlow("app_open", { app: "ScenePilotix", ver: "1.05" }, lang);
      installGlobalErrorHooks(lang);

      // ✅ 在线心跳
      const ping = () => {
        trackUiAction("session", "ping", "heartbeat", { sceneIdx }, lang);
        void flush();
      };
      ping();
      const timer = window.setInterval(ping, 30000);

      // 关闭/刷新前尽量 flush 一次
      const onUnload = () => {
        void flush();
      };
      window.addEventListener("beforeunload", onUnload);

      return () => {
        window.clearInterval(timer);
        window.removeEventListener("beforeunload", onUnload);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语言切换埋点
  useEffect(() => {
    trackUiAction("app", "view", "language", { lang }, lang);
  }, [lang, trackUiAction]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!lastLibrarySavedSnapshot) setLastLibrarySavedSnapshot(currentLibrarySnapshot);
  }, [currentLibrarySnapshot, lastLibrarySavedSnapshot]);

  useEffect(() => {
    if (!libraryHint) return;
    const timer = window.setTimeout(() => setLibraryHint(""), 2200);
    return () => window.clearTimeout(timer);
  }, [libraryHint]);

  useEffect(() => {
    let alive = true;
    if (!hasDirectoryPicker()) {
      setLibraryHydrated(true);
      return;
    }
    void (async () => {
      try {
        const handle = await loadPersistedLibraryRootHandle();
        if (!alive || !handle) {
          setLibraryHydrated(true);
          return;
        }
        let perm = "prompt";
        try {
          perm = await handle.queryPermission({ mode: "readwrite" });
        } catch {
          // ignore
        }
        if (perm !== "granted") {
          try {
            perm = await handle.requestPermission({ mode: "readwrite" });
          } catch {
            // ignore
          }
        }
        if (!alive) return;
        if (perm === "granted") {
          setLibraryRootHandle(handle);
          setLibraryRootName(handle.name || "ScenePilotix");
          await refreshLibraryEntries(handle, null);
        }
      } catch {
        // ignore hydration failures
      } finally {
        if (alive) setLibraryHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY) === "1";
      if (!done) openCreateWizard(true);
    } catch {
      openCreateWizard(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProject(next: Project) {
    setProject(next);
    saveProject(next);
  }

  function updateScene(nextScene: Scene) {
    const idx = clampInt(sceneIdx, 0, Math.max(0, safeProject.scenes.length - 1));
    const next: Project = {
      ...safeProject,
      scenes: safeProject.scenes.map((s, i) => (i === idx ? nextScene : s))
    };
    updateProject(next);
  }

  useEffect(() => {
    const scenes = safeProject.scenes ?? [];
    const idx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
    if (idx <= 0) return;
    const cur = scenes[idx];
    const prev = scenes[idx - 1];
    if (!cur || !prev) return;
    if (safeProject.project?.mediaType !== "video") return;
    const shotPlan = (safeProject.project?.shotPlan as ShotPlan) ?? "single";
    const inheritRefs = defaultRefInheritByPlan(shotPlan, false);
    const nextCur: Scene = { ...cur };
    let changed = false;

    if (cur.inheritFromPrevious && (cur.layers ?? []).length === 0 && (prev.layers ?? []).length > 0) {
      const clonedLayers = JSON.parse(JSON.stringify(prev.layers));
      if ((nextCur.inheritObjectRefsFromPrevious ?? inheritRefs.inheritObjectRefsFromPrevious) === "identity_only") {
        for (const layer of clonedLayers) {
          const refs = (layer.localRefs ?? []).filter((r: any) => r?.type === "identity");
          layer.localRefs = refs;
        }
      } else if ((nextCur.inheritObjectRefsFromPrevious ?? inheritRefs.inheritObjectRefsFromPrevious) === "off") {
        for (const layer of clonedLayers) layer.localRefs = [];
      }
      nextCur.layers = clonedLayers;
      changed = true;
    }

    const shouldInheritBg = nextCur.inheritBgRefFromPrevious ?? inheritRefs.inheritBgRefFromPrevious;
    if (shouldInheritBg && !nextCur.backgroundRef && prev.backgroundRef) {
      nextCur.backgroundRef = JSON.parse(JSON.stringify(prev.backgroundRef));
      changed = true;
    }

    if (!changed) return;
    updateProject({
      ...safeProject,
      scenes: scenes.map((s, i) => (i === idx ? nextCur : s))
    });
  }, [sceneIdx, safeProject]);

  function defaultShotCount(plan: ShotPlan): number {
    if (plan === "single") return 1;
    if (plan === "multicam") return 4;
    if (plan === "continuous") return 4;
    return 4;
  }

  function nextWizardDraft(base?: Partial<WizardDraft>): WizardDraft {
    const media = (base?.mediaType ?? (safeProject.project?.mediaType as "image" | "video") ?? "video") as "image" | "video";
    const planBase = (base?.shotPlan ?? (safeProject.project?.shotPlan as ShotPlan) ?? "single") as ShotPlan;
    const shotPlan: ShotPlan = media === "image" ? "single" : planBase;
    const shotCount = Math.max(1, Math.round(base?.shotCount ?? defaultShotCount(shotPlan)));
    const totalDuration = Math.max(1, Math.round(base?.totalDuration ?? 12));
    const manualDurations = Array.from({ length: shotCount }, (_, i) =>
      Math.max(1, Math.round(base?.manualDurations?.[i] ?? Math.max(1, Math.round(totalDuration / shotCount))))
    );
    return {
      projectName: (base?.projectName ?? "").trim(),
      mediaType: media,
      ratio: (base?.ratio ?? "16:9") as "16:9" | "9:16" | "1:1",
      sceneTier: (base?.sceneTier ?? "small_plaza") as "indoor" | "small_plaza" | "open_space",
      shotPlan,
      shotCount,
      totalDuration,
      durationMode: (base?.durationMode ?? "average") as "average" | "manual",
      manualDurations
    };
  }

  function openCreateWizard(showWelcome: boolean) {
    setWizardCancelable(!showWelcome);
    setWizardDraft(nextWizardDraft());
    setWizardStep("media");
    setWizardOpen(true);
  }

  function cancelCreateWizard() {
    if (!wizardCancelable) return;
    setWizardOpen(false);
  }

  function markOnboardingDone() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
  }

  function requestNewProject() {
    if (!hasUnsavedLibraryChanges) {
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: false, skippedSavePrompt: true }, lang);
      return;
    }
    setNewProjectConfirmOpen(true);
  }

  function requestSavePlatform(mode: SavePlatformPickMode, forceAsk: boolean): Promise<SavePlatformId | null> {
    if (!forceAsk && savePlatformLocked) return Promise.resolve(savePlatformId);
    return new Promise((resolve) => {
      savePlatformResolverRef.current = resolve;
      setSavePlatformPickMode(mode);
      setPendingSavePlatformId(savePlatformId);
      setSavePlatformModalOpen(true);
    });
  }

  function closeSavePlatformModal(result: SavePlatformId | null) {
    const resolver = savePlatformResolverRef.current;
    savePlatformResolverRef.current = null;
    setSavePlatformModalOpen(false);
    resolver?.(result);
  }

  async function createNewProjectAfterSave() {
    setNewProjectConfirmBusy(true);
    try {
      const ok = await saveToDisk();
      if (!ok) return;
      setNewProjectConfirmOpen(false);
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: true }, lang);
    } finally {
      setNewProjectConfirmBusy(false);
    }
  }

  function createNewProjectDirectly() {
    setNewProjectConfirmOpen(false);
    openCreateWizard(false);
    trackProjectFlow("wizard_open", { withSave: false }, lang);
  }

  function normalizeDurations(draft: WizardDraft): number[] {
    const count = Math.max(1, Math.round(draft.shotCount));
    if (count === 1) return [Math.max(1, Math.round(draft.totalDuration || 6))];
    if (draft.durationMode === "manual") {
      return Array.from({ length: count }, (_, i) => Math.max(1, Math.round(draft.manualDurations[i] || 1)));
    }
    const total = Math.max(count, Math.round(draft.totalDuration || 12));
    const base = Math.floor(total / count);
    let rest = total - base * count;
    return Array.from({ length: count }, () => {
      if (rest > 0) {
        rest -= 1;
        return base + 1;
      }
      return base;
    });
  }

  function buildProjectFromWizard(draft: WizardDraft): Project {
    const media = draft.mediaType;
    const sceneTier = draft.sceneTier ?? "small_plaza";
    const shotPlan: ShotPlan = media === "image" ? "single" : draft.shotPlan;
    const count = media === "image" ? 1 : Math.max(1, Math.round(draft.shotCount));
    const durations = normalizeDurations({ ...draft, shotCount: count, shotPlan });
    const shotNameBase = media === "image" ? (lang === "zh" ? "主画面" : "Main Frame") : (lang === "zh" ? "镜头" : "Shot");
    const presetByIndex = (index: number): string => {
      if (shotPlan === "multicam") {
        const presets = ["wide", "over_shoulder_left", "close", "return_wide", "medium", "over_shoulder_right"];
        return presets[index % presets.length];
      }
      if (shotPlan === "continuous") return "first-person steady_walk";
      if (shotPlan === "edit") {
        const presets = ["wide_establishing", "medium", "close_up", "wide", "detail"];
        return presets[index % presets.length];
      }
      return media === "video" ? "wide" : "";
    };
    const scenes: Scene[] = Array.from({ length: count }, (_, i) => {
      const no = i + 1;
      const isFirst = i === 0;
      const defaultTransition: TransitionType =
        shotPlan === "continuous" ? "camera_continues" : shotPlan === "multicam" ? "reverse_angle" : "cut";
      const inheritFromPrevious = media === "video" && !isFirst && (shotPlan === "multicam" || shotPlan === "continuous");
      const { inheritBgRefFromPrevious, inheritObjectRefsFromPrevious } = defaultRefInheritByPlan(shotPlan, isFirst || media !== "video");
      const shotName = media === "image" ? shotNameBase : `${String(no).padStart(2, "0")}｜${shotNameBase}${String(no).padStart(2, "0")}`;
      return {
        id: `s${no}`,
        index: no,
        name: shotName,
        duration_s: Math.max(1, durations[i] ?? 1),
        cameraPreset: presetByIndex(i),
        layoutLocked: false,
        inheritFromPrevious,
        inheritBgRefFromPrevious,
        inheritObjectRefsFromPrevious,
        transitionType: defaultTransition,
        camera: {
          shot: "",
          movement: "",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "", key_dir: "", mood: "" },
        layers: [],
        notes: [
          `media: ${media}`,
          "genmode: quick",
          media === "video" ? "@compiler:v2" : "",
          media === "video" ? `@scene_tier:${sceneTier}` : "",
          media === "video" ? "@v2_mode:strict" : ""
        ]
          .filter(Boolean)
          .join("\n")
      };
    });
    if (media === "video" && shotPlan === "continuous") {
      scenes.forEach((s, i) => {
        s.entryDir = i > 0 ? "E" : undefined;
        s.exitDir = i < scenes.length - 1 ? "E" : undefined;
      });
    }
    return {
      project: { mode: "storyboard", mediaType: media, shotPlan },
      scenes
    };
  }

  function createProjectFromWizard() {
    const p = sanitizeProject(buildProjectFromWizard(wizardDraft));
    const fallbackName = lang === "zh" ? "未命名项目" : "Untitled";
    const projectFileName = wizardDraft.projectName.trim() || fallbackName;
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    setFileHandle(null);
    setLabelPersist(projectFileName);
    updateProject(p);
    setWizardOpen(false);
    setSavePlatformLocked(false);
    try {
      localStorage.removeItem(SAVE_PLATFORM_KEY);
    } catch {
      // ignore
    }
    markOnboardingDone();
    trackProjectFlow("project_create", { media: wizardDraft.mediaType, shotPlan: wizardDraft.shotPlan, sceneTier: wizardDraft.sceneTier }, lang);
  }

  function toggleLang() {
    const next: Lang = lang === "zh" ? "en" : "zh";
    setLang(next);
    saveLang(next);
    trackUiAction("app", "toggle", "language", { from: lang, to: next }, next);
  }

  // ---------------------- File IO ----------------------
  function setLabelPersist(label: string) {
    setFileLabel(label);
    try {
      if (label) localStorage.setItem("scene_pilot_last_file_label", label);
      else localStorage.removeItem("scene_pilot_last_file_label");
    } catch {
      // Ignore localStorage access failures when persisting file label.
    }
  }

  async function saveAsToDisk(): Promise<boolean> {
    const pickedPlatform = await requestSavePlatform("save_as", true);
    if (!pickedPlatform) return false;
    setSavePlatformId(pickedPlatform);
    setSavePlatformLocked(true);
    try {
      localStorage.setItem(SAVE_PLATFORM_KEY, pickedPlatform);
    } catch {
      // ignore
    }
    const defaultProjectName = safeFsName(fileLabel || (lang === "zh" ? "未命名项目" : "Untitled")) || (lang === "zh" ? "未命名项目" : "Untitled");
    const input = window.prompt(lang === "zh" ? "另存为：输入项目目录名（同名将覆盖）" : "Save As: enter project folder name (same name will overwrite)", defaultProjectName);
    if (input == null) return false;
    const pickedName = safeFsName(input) || defaultProjectName;
    setLibraryHint(
      lang === "zh"
        ? `另存项目：${pickedName}（平台 ${savePlatformLabel(pickedPlatform, lang)}，同名覆盖）`
        : `Save As project: ${pickedName} (platform ${savePlatformLabel(pickedPlatform, lang)}, same name will be overwritten)`
    );
    const ok = await saveSceneProToLibrary(pickedPlatform, pickedName);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save_as", { mode: "pro", via: "library", platform: pickedPlatform }, lang);
    return true;
  }

  async function saveToDisk(): Promise<boolean> {
    const pickedPlatform = await requestSavePlatform("save", !savePlatformLocked);
    if (!pickedPlatform) return false;
    setSavePlatformId(pickedPlatform);
    setSavePlatformLocked(true);
    try {
      localStorage.setItem(SAVE_PLATFORM_KEY, pickedPlatform);
    } catch {
      // ignore
    }
    setLibraryHint(
      lang === "zh"
        ? `保存当前分镜到项目目录（平台 ${savePlatformLabel(pickedPlatform, lang)}）。`
        : `Saving current shot to project folder (platform ${savePlatformLabel(pickedPlatform, lang)}).`
    );
    const ok = await saveSceneQuickToLibrary(pickedPlatform);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save", { mode: "quick", via: "library", platform: pickedPlatform }, lang);
    return true;
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.scenes)) return;
      setProject(obj as Project);
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      setFileHandle(null);
      setLabelPersist(f.name);

      trackProjectFlow("project_open", { via: "upload" }, lang);
    } catch {
      // Ignore invalid upload payloads and JSON parse failures.
    }
  }

  function hasDirectoryPicker() {
    return typeof window !== "undefined" && "showDirectoryPicker" in window;
  }

  function safeFsName(input: string) {
    return (input ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 64);
  }

  function extFromName(name: string) {
    const m = (name ?? "").trim().match(/\.([a-zA-Z0-9]{2,5})$/);
    return m ? m[1].toLowerCase() : "jpg";
  }

  async function writeTextToDirectory(dirHandle: any, filename: string, content: string) {
    const file = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await file.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function writeBlobToDirectory(dirHandle: any, filename: string, blob: Blob) {
    const file = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await file.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function copyDirectoryRecursive(srcDir: any, dstDir: any) {
    for await (const [, handle] of srcDir.entries()) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        await writeBlobToDirectory(dstDir, handle.name, file);
      } else if (handle.kind === "directory") {
        const nextDst = await dstDir.getDirectoryHandle(handle.name, { create: true });
        await copyDirectoryRecursive(handle, nextDst);
      }
    }
  }

  async function writeSceneRefsToDirectory(sceneDir: any, sceneItem: Scene, sceneFolder: string) {
    if (sceneItem.backgroundRef?.id) {
      const bgBlob = await getRefBlob(sceneItem.backgroundRef.id);
      if (bgBlob) {
        const bgExt = extFromName(sceneItem.backgroundRef.name);
        await writeBlobToDirectory(sceneDir, `${sceneFolder}__bg.${bgExt}`, bgBlob);
      }
    }

    for (let layerIdx = 0; layerIdx < (sceneItem.layers ?? []).length; layerIdx++) {
      const layer = sceneItem.layers[layerIdx];
      const refs = (layer.localRefs ?? []).slice(0, 1);
      for (let refIdx = 0; refIdx < refs.length; refIdx++) {
        const ref = refs[refIdx];
        const blob = await getRefBlob(ref.id);
        if (!blob) continue;
        const ext = extFromName(ref.name);
        const objCode = `obj${String(layerIdx + 1).padStart(2, "0")}`;
        const imgName = `${sceneFolder}__${objCode}__ref${String(refIdx + 1).padStart(2, "0")}.${ext}`;
        await writeBlobToDirectory(sceneDir, imgName, blob);
      }
    }
  }

  async function refreshLibraryEntries(root: any, projectName?: string | null) {
    try {
      const out: LibraryEntry[] = [];
      const target = projectName ? await root.getDirectoryHandle(projectName) : root;
      for await (const [, handle] of target.entries()) {
        if (handle.kind === "directory") out.push({ name: handle.name, kind: handle.kind });
      }
      out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
      setLibraryEntries(out);
    } catch {
      setLibraryEntries([]);
    }
  }

  async function ensureLibraryRoot(pickIfMissing = true): Promise<any | null> {
    if (!hasDirectoryPicker()) {
      setLibraryHint(lang === "zh" ? "当前浏览器不支持目录选择" : "Directory picker is not supported in this browser");
      return null;
    }
    if (libraryRootHandle) return libraryRootHandle;
    if (!pickIfMissing) return null;
    try {
      const inited = (() => {
        try {
          return localStorage.getItem(LIB_INIT_KEY) === "1";
        } catch {
          return false;
        }
      })();
      setLibraryHint(
        inited
          ? lang === "zh"
            ? "需要重新确认分镜库目录权限。"
            : "Please re-confirm library folder permission."
          : lang === "zh"
            ? "请选择分镜库目录（可直接选择已有 ScenePilotix 目录）。"
            : "Choose your storyboard library folder (you can select existing ScenePilotix directly)."
      );
      const picker = (window as any).showDirectoryPicker;
      const picked = await picker({ mode: "readwrite", id: "scenepilotix-library-root" });
      let root = picked;
      if (picked.name !== "ScenePilotix") {
        try {
          root = await picked.getDirectoryHandle("ScenePilotix");
        } catch {
          root = picked;
        }
      }
      setLibraryRootHandle(root);
      setLibraryRootName(root.name || "ScenePilotix");
      setLibraryProjectName(null);
      await savePersistedLibraryRootHandle(root);
      try {
        localStorage.setItem(LIB_INIT_KEY, "1");
      } catch {
        // ignore
      }
      await refreshLibraryEntries(root, null);
      setLibraryHint(lang === "zh" ? `已连接分镜库：${root.name || "ScenePilotix"}` : `Connected library: ${root.name || "ScenePilotix"}`);
      return root;
    } catch {
      return null;
    }
  }

  async function importLibraryFromExternalDirectory() {
    const root = await ensureLibraryRoot(true);
    if (!root) return false;
    try {
      const picker = (window as any).showDirectoryPicker;
      const source = await picker({ mode: "read", id: "scenepilotix-import-source" });
      setLibraryBusy(true);
      let importedDirs = 0;
      let importedFiles = 0;
      for await (const [, handle] of source.entries()) {
        if (handle.kind === "directory") {
          try {
            await root.removeEntry(handle.name, { recursive: true });
          } catch {
            // ignore when target doesn't exist
          }
          const dst = await root.getDirectoryHandle(handle.name, { create: true });
          await copyDirectoryRecursive(handle, dst);
          importedDirs += 1;
        } else if (handle.kind === "file") {
          const file = await handle.getFile();
          await writeBlobToDirectory(root, handle.name, file);
          importedFiles += 1;
        }
      }
      await refreshLibraryEntries(root, null);
      setLibraryHint(
        lang === "zh"
          ? `已导入：${importedDirs} 个目录${importedFiles ? `，${importedFiles} 个文件` : ""}`
          : `Imported: ${importedDirs} folder(s)${importedFiles ? `, ${importedFiles} file(s)` : ""}`
      );
      return true;
    } catch {
      return false;
    } finally {
      setLibraryBusy(false);
    }
  }

  function projectDirName(customProjectName?: string) {
    const fallback = lang === "zh" ? "未命名项目" : "Untitled";
    return safeFsName(customProjectName || fileLabel || fallback) || fallback;
  }

  function sceneDirName(sceneItem: Scene, idx: number, projectName: string) {
    const sceneTitle = safeFsName(sceneItem?.name || sceneItem?.id || (lang === "zh" ? `分镜_${idx + 1}` : `scene_${idx + 1}`)) || `scene_${idx + 1}`;
    return `${projectName}_${sceneTitle}`;
  }

  function buildScenePromptText(sceneItem: Scene, platformId: SavePlatformId) {
    const promptProject: Project = { ...safeProject, scenes: [sceneItem] };
    return generatePrompts(promptProject, lang, savePlatformToProfile(platformId)).trim();
  }

  async function ensureFreshSubDir(parent: any, dirName: string): Promise<any> {
    try {
      await parent.removeEntry(dirName, { recursive: true });
    } catch {
      // ignore when not exists
    }
    return await parent.getDirectoryHandle(dirName, { create: true });
  }

  async function saveSceneQuickToLibrary(platformId: SavePlatformId): Promise<boolean> {
    const root = await ensureLibraryRoot(true);
    if (!root) return false;
    setLibraryBusy(true);
    try {
      const proj = projectDirName();
      const projectDir = await root.getDirectoryHandle(proj, { create: true });
      const sceneFolder = sceneDirName(scene, sceneNo - 1, proj);
      const sceneDir = await ensureFreshSubDir(projectDir, sceneFolder);
      const platformLabel = safeFsName(savePlatformLabel(platformId, lang));
      const promptFile = `${sceneFolder}__${platformLabel}.txt`;
      await writeTextToDirectory(sceneDir, promptFile, buildScenePromptText(scene, platformId) + "\n");
      await writeTextToDirectory(sceneDir, "scene.json", JSON.stringify({ project: { mode: safeProject.project.mode }, scenes: [scene] }, null, 2));
      await writeSceneRefsToDirectory(sceneDir, scene, sceneFolder);
      await refreshLibraryEntries(root, libraryProjectName);
      setLibraryHint(lang === "zh" ? `已保存：${proj}/${sceneDir.name}` : `Saved: ${proj}/${sceneDir.name}`);
      trackExportFlow("save_scene", { mode: "quick", platform: platformId, result: "success" }, lang);
      return true;
    } catch {
      setLibraryHint(lang === "zh" ? "快速存储失败" : "Quick save failed");
      trackExportFlow("save_scene", { mode: "quick", platform: platformId, result: "fail" }, lang);
      return false;
    } finally {
      setLibraryBusy(false);
    }
  }

  async function saveSceneProToLibrary(platformId: SavePlatformId, pickedName?: string): Promise<boolean> {
    const root = await ensureLibraryRoot(true);
    if (!root) return false;
    setLibraryBusy(true);
    try {
      const proj = projectDirName(pickedName);
      const projectDir = await root.getDirectoryHandle(proj, { create: true });
      const sceneFolder = sceneDirName(scene, sceneNo - 1, proj);
      const sceneDir = await ensureFreshSubDir(projectDir, sceneFolder);
      const platformLabel = safeFsName(savePlatformLabel(platformId, lang));
      const promptFile = `${sceneFolder}__${platformLabel}.txt`;
      await writeTextToDirectory(sceneDir, promptFile, buildScenePromptText(scene, platformId) + "\n");
      await writeTextToDirectory(sceneDir, "scene.json", JSON.stringify({ project: { mode: safeProject.project.mode }, scenes: [scene] }, null, 2));
      await writeSceneRefsToDirectory(sceneDir, scene, sceneFolder);
      await refreshLibraryEntries(root, libraryProjectName);
      setLibraryHint(lang === "zh" ? `已保存：${proj}/${sceneDir.name}` : `Saved: ${proj}/${sceneDir.name}`);
      trackExportFlow("save_scene", { mode: "pro", platform: platformId, result: "success" }, lang);
      return true;
    } catch {
      setLibraryHint(lang === "zh" ? "PRO 存储失败" : "PRO save failed");
      trackExportFlow("save_scene", { mode: "pro", platform: platformId, result: "fail" }, lang);
      return false;
    } finally {
      setLibraryBusy(false);
    }
  }

  async function saveAllScenesToLibrary(): Promise<boolean> {
    const pickedPlatform = await requestSavePlatform("save_all", !savePlatformLocked);
    if (!pickedPlatform) return false;
    setSavePlatformId(pickedPlatform);
    setSavePlatformLocked(true);
    try {
      localStorage.setItem(SAVE_PLATFORM_KEY, pickedPlatform);
    } catch {
      // ignore
    }
    const root = await ensureLibraryRoot(true);
    if (!root) return false;
    setLibraryBusy(true);
    try {
      const proj = projectDirName();
      const projectDir = await root.getDirectoryHandle(proj, { create: true });
      const platformLabel = safeFsName(savePlatformLabel(pickedPlatform, lang));
      for (let i = 0; i < safeProject.scenes.length; i++) {
        const s = safeProject.scenes[i];
        const sceneFolder = sceneDirName(s, i, proj);
        const sceneDir = await ensureFreshSubDir(projectDir, sceneFolder);
        await writeTextToDirectory(sceneDir, `${sceneFolder}__${platformLabel}.txt`, buildScenePromptText(s, pickedPlatform) + "\n");
        await writeTextToDirectory(sceneDir, "scene.json", JSON.stringify({ project: { mode: safeProject.project.mode }, scenes: [s] }, null, 2));
        await writeSceneRefsToDirectory(sceneDir, s, sceneFolder);
      }
      await refreshLibraryEntries(root, libraryProjectName);
      setLibraryHint(lang === "zh" ? `已保存全部分镜：${proj}` : `Saved all shots: ${proj}`);
      setLastLibrarySavedSnapshot(currentLibrarySnapshot);
      trackExportFlow("save_all", { platform: pickedPlatform, scenes: safeProject.scenes.length, result: "success" }, lang);
      return true;
    } catch {
      setLibraryHint(lang === "zh" ? "保存全部失败" : "Save all failed");
      trackExportFlow("save_all", { platform: pickedPlatform, scenes: safeProject.scenes.length, result: "fail" }, lang);
      return false;
    } finally {
      setLibraryBusy(false);
    }
  }

  async function ensureReadyForLibraryOpen(): Promise<boolean> {
    if (!hasUnsavedLibraryChanges) return true;
    const askSave = window.confirm(
      lang === "zh"
        ? "当前项目有未保存改动。点击“确定”先保存再打开分镜库项目。"
        : "Current project has unsaved changes. Click OK to save first before opening a library project."
    );
    if (askSave) {
      return await saveToDisk();
    }
    return window.confirm(
      lang === "zh"
        ? "是否放弃未保存改动并直接打开分镜库项目？"
        : "Discard unsaved changes and open the library project directly?"
    );
  }

  async function importLibraryEntryToEditor(entry: LibraryEntry) {
    const root = await ensureLibraryRoot(false);
    if (!root) return;
    const canOpen = await ensureReadyForLibraryOpen();
    if (!canOpen) return;
    setLibraryBusy(true);
    try {
      const projectDir = await root.getDirectoryHandle(entry.name);
      const importedScenes: Scene[] = [];
      let importedMode: "static" | "storyboard" = "storyboard";
      for await (const [, handle] of projectDir.entries()) {
        if (handle.kind !== "directory") continue;
        try {
          const sceneFile = await handle.getFileHandle("scene.json");
          const text = await (await sceneFile.getFile()).text();
          const parsed = JSON.parse(text);
          const sourceScene: Scene | undefined = Array.isArray(parsed?.scenes) ? parsed.scenes[0] : parsed?.scene ?? parsed;
          if (!sourceScene || !Array.isArray(sourceScene.layers)) continue;
          importedScenes.push(JSON.parse(JSON.stringify(sourceScene)) as Scene);
          if (parsed?.project?.mode === "static" || parsed?.project?.mode === "storyboard") {
            importedMode = parsed.project.mode;
          }
        } catch {
          // skip invalid scene folder
        }
      }
      if (!importedScenes.length) {
        setLibraryHint(lang === "zh" ? "导入失败：项目下未找到有效分镜(scene.json)" : "Import failed: no valid shot scene.json found");
        return;
      }
      importedScenes.sort((a, b) => {
        const ai = Number.isFinite(a.index) ? Number(a.index) : Number.MAX_SAFE_INTEGER;
        const bi = Number.isFinite(b.index) ? Number(b.index) : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return String(a.name || a.id).localeCompare(String(b.name || b.id), undefined, { numeric: true, sensitivity: "base" });
      });
      const opened: Project = sanitizeProject({
        project: { mode: importedMode },
        scenes: importedScenes
      });
      updateProject(opened);
      setLabelPersist(entry.name);
      setLastLibrarySavedSnapshot(JSON.stringify({ project: opened, fileLabel: entry.name }));
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      setLibraryOpen(false);
      setLibraryHint(lang === "zh" ? `已打开分镜库项目：${entry.name}` : `Opened library project: ${entry.name}`);
    } catch {
      setLibraryHint(lang === "zh" ? "导入失败：无法读取项目目录" : "Import failed: unable to read project folder");
    } finally {
      setLibraryBusy(false);
    }
  }

  async function deleteLibraryEntry(entry: LibraryEntry) {
    const ok = window.confirm(
      lang === "zh"
        ? `确认完全删除「${entry.name}」吗？删除后无法恢复。`
        : `Confirm permanent deletion of "${entry.name}"? This cannot be undone.`
    );
    if (!ok) return;
    const root = await ensureLibraryRoot(false);
    if (!root) return;
    setLibraryBusy(true);
    try {
      const parentDir = libraryProjectName ? await root.getDirectoryHandle(libraryProjectName) : root;
      await parentDir.removeEntry(entry.name, { recursive: true });
      await refreshLibraryEntries(root, libraryProjectName);
      setLibraryHint(lang === "zh" ? `已删除：${entry.name}` : `Deleted: ${entry.name}`);
    } catch {
      setLibraryHint(lang === "zh" ? "删除失败" : "Delete failed");
    } finally {
      setLibraryBusy(false);
    }
  }

  // ---------------------- Helpers: dropdown actions ----------------------
  function closeMenu() {
    setMenuOpen(false);
  }

  async function menuAction(fn: () => void | Promise<void>, ev?: string) {
    closeMenu();
    if (ev) trackUiAction("menu", "click", ev, {}, lang);
    try {
      await fn();
    } catch {
      // ignore
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      document.body.removeChild(ta);
      return true;
    }
  }

  // ✅ 发送反馈到服务器（最小新增）
  async function submitFeedback() {
    const msg =
      feedbackText.trim() ||
      (lang === "zh"
        ? "【问题】\n【复现步骤】1) \n【期望】\n【实际】\n【环境】"
        : "[Issue]\n[Steps] 1)\n[Expected]\n[Actual]\n[Env]");

    setFeedbackSending(true);
    setFeedbackSent("");

    try {
      // 备注：sendFeedback 只在 telemetry on 时才会发；你已默认开启
      const ok = await sendFeedback(msg, { app: "ScenePilotix", ver: "1.05", sceneIdx }, lang);
      setFeedbackSent(ok ? "ok" : "fail");
      if (ok) {
        trackUiAction("feedback", "send", "modal", { len: msg.length, result: "success" }, lang);
        setFeedbackText("");
      } else {
        trackUiAction("feedback", "send", "modal", { len: msg.length, result: "fail" }, lang);
      }
    } catch {
      setFeedbackSent("fail");
      trackUiAction("feedback", "send", "modal", { len: msg.length, result: "fail" }, lang);
    } finally {
      setFeedbackSending(false);
    }
  }

  // ---------------------- UI ----------------------
  return (
    <div style={styles.app}>
      <div style={styles.top}>
        {/* ✅ 左上角 Logo：ScenePilotix + 放大中文；彻底移除原 tagline 行 */}
        <div style={styles.brand} title="ScenePilotix">
          <div style={styles.logoRow}>
            <div style={styles.logoEn}>ScenePilotix</div>
            <div style={styles.logoZh}>场景领航</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* ✅ 保留中英文切换按钮 */}
        <button style={styles.topBtn} onClick={toggleLang} type="button">
          <Languages size={16} />
          <span>{lang === "zh" ? "EN" : "中文"}</span>
        </button>

        <button
          style={styles.topBtn}
          onClick={() => {
            setLibraryOpen(true);
            setLibraryProjectName(null);
            void ensureLibraryRoot(false).then((root) => {
              if (root) void refreshLibraryEntries(root, null);
            });
          }}
          type="button"
          title={lang === "zh" ? "我的分镜库" : "My Storyboard Library"}
        >
          <BookOpen size={16} />
          <span>{lang === "zh" ? "我的分镜库" : "My Library"}</span>
        </button>

        {/* ✅ 其它按钮：统一收入口径 -> 下拉菜单 */}
        <button
          style={styles.topBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setMenuOpen((v) => !v);
            trackUiAction("menu", "toggle", "top_menu", { open: !menuOpen }, lang);
          }}
          type="button"
          title={lang === "zh" ? "菜单" : "Menu"}
        >
          <Menu size={16} />
          <span>{lang === "zh" ? "菜单" : "Menu"}</span>
        </button>

        {/* hidden file input for no FS access */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={onUploadFile}
        />
      </div>

      {/* ✅ 下拉菜单：点击外部关闭 */}
      {menuOpen && (
        <div
          style={styles.menuMask}
          onMouseDown={() => setMenuOpen(false)}
          onClick={() => {
            setMenuOpen(false);
            setHoveredMenuItem(null);
          }}
          role="presentation"
        >
          <div
            style={styles.menu}
            onMouseLeave={() => setHoveredMenuItem(null)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.menuNotice}>
              <div style={styles.menuNoticeTitle}>{lang === "zh" ? "重要提醒" : "Important"}</div>
              <div style={styles.menuNoticeText}>
                {lang === "zh"
                  ? (
                    <>
                      ScenePilotix 重点解决分镜连续性与结构性。建议你根据不同大模型逐步尝试；系统可帮助沉淀可复用的提示词资产，持续提升
                      <span style={styles.nowrapInline}>生成质量与效率</span>。
                    </>
                  )
                  : "ScenePilotix focuses on storyboard continuity and structure. Iterate gradually per model; the prompt system helps you preserve reusable prompt assets and improve quality and efficiency over time."}
              </div>
            </div>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_new_project" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_new_project")}
              onClick={() => menuAction(() => requestNewProject(), "menu_new_project")}
            >
              <FilePlus2 size={16} />
              <span>{tt("top.newProject")}</span>
            </button>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_save" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_save")}
              onClick={() => menuAction(() => void saveToDisk(), "menu_save")}
            >
              <Save size={16} />
              <span>{lang === "zh" ? "保存" : "Save"}</span>
            </button>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_save_all" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_save_all")}
              onClick={() => menuAction(() => void saveAllScenesToLibrary(), "menu_save_all")}
            >
              <Save size={16} />
              <span>{lang === "zh" ? "保存全部分镜" : "Save All Shots"}</span>
            </button>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_save_as" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_save_as")}
              onClick={() => menuAction(() => void saveAsToDisk(), "menu_save_as")}
            >
              <SaveAll size={16} />
              <span>{lang === "zh" ? "另存为" : "Save As"}</span>
            </button>

            <div style={styles.menuSep} />

            <div style={styles.menuSectionTitle}>{lang === "zh" ? "帮助" : "Help"}</div>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_tutorial" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_tutorial")}
              onClick={() =>
                menuAction(() => {
                  setHelpModal("tutorial");
                  setTutorialPage(0);
                }, "menu_tutorial")
              }
            >
              <BookOpen size={16} />
              <span>{lang === "zh" ? "新手教程" : "Beginner Tutorial"}</span>
            </button>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_feedback" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_feedback")}
              onClick={() =>
                menuAction(() => {
                  setHelpModal("feedback");
                  setFeedbackSent("");
                }, "menu_feedback")
              }
            >
              <MessageSquareWarning size={16} />
              <span>{lang === "zh" ? "问题反馈" : "Feedback"}</span>
            </button>

            <button
              style={{ ...styles.menuItem, ...(hoveredMenuItem === "menu_about" ? styles.menuItemHover : {}) }}
              type="button"
              onMouseEnter={() => setHoveredMenuItem("menu_about")}
              onClick={() =>
                menuAction(() => {
                  setHelpModal("about");
                }, "menu_about")
              }
            >
              <Info size={16} />
              <span>{lang === "zh" ? "关于" : "About"}</span>
            </button>
          </div>
        </div>
      )}

      {newProjectConfirmOpen && (
        <div style={styles.modalMask} onMouseDown={() => !newProjectConfirmBusy && setNewProjectConfirmOpen(false)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{lang === "zh" ? "创建新项目" : "Create New Project"}</div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? "创建前建议先保存当前项目。你可以先保存，再进入创建向导。"
                : "Saving current project is recommended before creating a new one."}
            </div>
            <div style={styles.modalBtns}>
              <button
                style={styles.modalBtnGhost}
                type="button"
                disabled={newProjectConfirmBusy}
                onClick={() => setNewProjectConfirmOpen(false)}
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                style={styles.modalBtnGhost}
                type="button"
                disabled={newProjectConfirmBusy}
                onClick={createNewProjectDirectly}
              >
                {lang === "zh" ? "不保存，直接新建" : "New Without Saving"}
              </button>
              <button
                style={styles.modalBtn}
                type="button"
                disabled={newProjectConfirmBusy}
                onClick={() => void createNewProjectAfterSave()}
              >
                {newProjectConfirmBusy
                  ? lang === "zh" ? "保存中…" : "Saving..."
                  : lang === "zh" ? "先保存并新建" : "Save Then New"}
              </button>
            </div>
          </div>
        </div>
      )}

      {savePlatformModalOpen && (
        <div style={styles.modalMask} onMouseDown={() => closeSavePlatformModal(null)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>
              {lang === "zh"
                ? savePlatformPickMode === "save"
                  ? "保存：选择平台"
                  : savePlatformPickMode === "save_all"
                    ? "保存全部：选择平台"
                    : "另存为：选择平台"
                : savePlatformPickMode === "save"
                  ? "Save: Select Platform"
                  : savePlatformPickMode === "save_all"
                    ? "Save All: Select Platform"
                    : "Save As: Select Platform"}
            </div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? "用于生成对应平台优化的提示词文本。保存将按你选择的平台输出。"
                : "Used to generate platform-optimized prompt text. Save outputs by the selected platform."}
            </div>
            <div style={{ ...styles.modalFormRow, gridTemplateColumns: "120px 1fr" }}>
              <div style={styles.modalLabel}>{lang === "zh" ? "平台" : "Platform"}</div>
              <select
                style={styles.modalSelect}
                value={pendingSavePlatformId}
                onChange={(e) => setPendingSavePlatformId(e.target.value as SavePlatformId)}
              >
                {SAVE_PLATFORM_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {savePlatformLabel(id, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.modalBtnGhost} type="button" onClick={() => closeSavePlatformModal(null)}>
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button style={styles.modalBtn} type="button" onClick={() => closeSavePlatformModal(pendingSavePlatformId)}>
                {lang === "zh" ? "确认" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {libraryOpen && (
        <div style={styles.modalMask} onMouseDown={() => setLibraryOpen(false)} role="presentation">
          <div
            style={styles.libraryModal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.libraryHead}>
              <div style={styles.modalTitle}>
                {lang === "zh" ? "我的分镜库（项目列表）" : "My Storyboard Library (Projects)"}
              </div>
              <div style={styles.libraryPath}>
                {libraryRootName
                  ? libraryRootName
                  : (lang === "zh" ? "未选择目录" : "No directory selected")}
              </div>
            </div>

            <div style={styles.libraryList}>
              {libraryEntries.length === 0 ? (
                <div style={styles.libraryEmpty}>
                  {lang === "zh" ? "当前目录下暂无可打开的分镜项目。" : "No storyboard projects found in this folder."}
                </div>
              ) : (
                libraryEntries.map((entry) => (
                  <div key={`${entry.kind}:${entry.name}`} style={styles.libraryItem}>
                    <div style={styles.libraryItemName}>{`📁 ${entry.name}`}</div>
                    <button
                      style={styles.modalBtnGhost}
                      type="button"
                      disabled={libraryBusy}
                      onClick={() => void importLibraryEntryToEditor(entry)}
                    >
                      {lang === "zh" ? "打开分镜库项目" : "Open Project"}
                    </button>
                    <button
                      style={styles.modalBtnDanger}
                      type="button"
                      disabled={libraryBusy}
                      onClick={() => void deleteLibraryEntry(entry)}
                    >
                      {lang === "zh" ? "删除" : "Delete"}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={styles.modalBtns}>
              <button
                style={styles.modalBtnGhost}
                type="button"
                disabled={libraryBusy}
                onClick={async () => {
                  await importLibraryFromExternalDirectory();
                }}
              >
                {lang === "zh" ? "导入分镜库" : "Import Library"}
              </button>
              <button style={styles.modalBtnGhost} type="button" onClick={() => setLibraryOpen(false)}>
                {lang === "zh" ? "关闭" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {libraryHint ? <div style={styles.libraryFloatHint}>{libraryHint}</div> : null}

      <div style={{ ...styles.main, ...(useDesktopFixedLayout ? styles.mainDesktop : {}) }}>
        <Sidebar
          lang={lang}
          project={safeProject}
          projectFileLabel={fileLabel}
          sceneIdx={sceneIdx}
          setSceneIdx={(i) => {
            setSceneIdx(i);
            setSelectedLayerId(null);
            setEditT(0);
            trackEditorChange("scene", "select", { idx: i }, lang);
          }}
          onUpdateProject={(p) => {
            updateProject(p);
            trackEditorChange("project", "update", { scenes: (p.scenes || []).length }, lang);
          }}
          onRequestNewProject={requestNewProject}
          scene={scene}
          selectedLayerId={selectedLayerId}
          onSelectLayer={(id) => {
            setSelectedLayerId(id);
            setEditT(0);
            trackEditorChange("layer", "select", { id: id || "" }, lang);
          }}
          onUpdateScene={(s) => {
            updateScene(s);
            trackEditorChange("scene", "update", { idx: sceneIdx }, lang);
          }}
        />

        <div style={styles.center}>
          <Stage
            scene={scene}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => {
              setSelectedLayerId(id);
              if (!id) setEditT(0);
              trackEditorChange("stage", "select", { id: id || "" }, lang);
            }}
            onUpdateScene={(s) => {
              updateScene(s);
              trackEditorChange("stage", "update", { idx: sceneIdx }, lang);
            }}
            editT={effectiveEditT}
          />

        <ExportPanel
          lang={lang}
          project={safeProject}
          projectLabel={fileLabel}
          sceneIdx={sceneIdx}
          selectedLayerId={selectedLayerId}
          onJumpToConflict={(layerId) => {
            if (layerId) setSelectedLayerId(layerId);
          }}
        />
        </div>

        <PropsPanel
          lang={lang}
          scene={scene}
          selectedLayerId={selectedLayerId}
          onUpdateScene={(s) => {
            updateScene(s);
            trackEditorChange("props", "update", { idx: sceneIdx }, lang);
          }}
          onRenameLayer={(oldId, newId) => {
            if (selectedLayerId === oldId) setSelectedLayerId(newId);
            trackEditorChange("layer", "rename", { oldId, newId }, lang);
          }}
          editT={effectiveEditT}
          setEditT={(tv) => {
            // ✅ image 模式禁止进 t1（保留数据但锁编辑）
            if (mediaMode === "image" && tv === 1) return;

            setEditT(tv);
            trackEditorChange("timeline", "set_t", { t: tv }, lang);
          }}
        />
      </div>

      <CreateWizard
        lang={lang}
        open={wizardOpen}
        canCancel={wizardCancelable}
        step={wizardStep}
        draft={wizardDraft}
        setStep={setWizardStep}
        setDraft={setWizardDraft}
        nextWizardDraft={nextWizardDraft}
        defaultShotCount={defaultShotCount}
        onCreateProject={createProjectFromWizard}
        onMarkOnboardingDone={markOnboardingDone}
        onToggleLang={toggleLang}
        onCancel={cancelCreateWizard}
      />

      {/* ✅ 新手教程 / 问题反馈 / 关于 */}
      {helpModal && (
        <div style={styles.modalMask} onMouseDown={() => setHelpModal(null)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {helpModal === "tutorial" && (
              <>
                <div style={styles.tutorialTop}>
                  <div style={styles.modalTitle}>{lang === "zh" ? "新手教程" : "Beginner Tutorial"}</div>
                  {tutorialPage === 0 ? (
                    <button
                      style={styles.tutorialPill}
                      onClick={() => {
                        setTutorialPage(1);
                        trackUiAction("help", "open", "tutorial_workflow", {}, lang);
                      }}
                      type="button"
                    >
                      {lang === "zh" ? "查看流程设计" : "View Workflow"}
                    </button>
                  ) : (
                    <div style={styles.tutorialPageTag}>{lang === "zh" ? "流程设计" : "Workflow Design"}</div>
                  )}
                </div>
                <div style={styles.modalText}>
                  {tutorialPage === 0 ? (
                    lang === "zh" ? (
                      <>
                        <div style={styles.tutBlockTitle}>核心操作（4 步）</div>
                        <div style={styles.tutText}>
                          1) 先创建项目：选择图片或视频。<br />
                          2) 设置分镜数量与每镜时长（视频模式）。<br />
                          3) 逐个分镜编辑对象：位置、大小、层级、对象参考图。<br />
                          4) 保存或复制提示词到目标平台生成。
                        </div>

                        <div style={styles.tutBlockTitle}>操作顺序（必须）</div>
                        <div style={styles.tutText}>
                          媒体选择 → 分镜结构 → 分镜内对象编辑 → 提示词导出。<br />
                          不要跳步；先定结构，再做细节。
                        </div>

                        <div style={styles.tutBlockTitle}>核心原则</div>
                        <div style={styles.tutText}>
                          图片模式固定单分镜；视频模式按分镜逐镜编辑并串联导出。
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={styles.tutBlockTitle}>Core Operations (4 Steps)</div>
                        <div style={styles.tutText}>
                          1) Create project: choose Image or Video.<br />
                          2) Set shot count and per-shot duration (Video mode).<br />
                          3) Edit objects shot by shot: position, scale, layer order, object references.<br />
                          4) Save or copy prompts to target platform.
                        </div>

                        <div style={styles.tutBlockTitle}>Required Order</div>
                        <div style={styles.tutText}>
                          Media Selection → Shot Structure → Per-shot Object Editing → Prompt Export.<br />
                          Do not skip steps; lock structure before style.
                        </div>

                        <div style={styles.tutBlockTitle}>Core Rule</div>
                        <div style={styles.tutText}>
                          Image mode stays single-shot; Video mode is edited and exported shot-by-shot.
                        </div>
                      </>
                    )
                  ) : lang === "zh" ? (
                    <>
                      <div style={styles.tutBlockTitle}>流程设计（简版）</div>
                      <div style={styles.tutText}>
                        <b>Step 1 创建结构</b><br />
                        先完成媒体与分镜配置，得到可执行的分镜骨架。
                      </div>

                      <div style={styles.tutBlockTitle}>Step 2 填充分镜</div>
                      <div style={styles.tutText}>
                        每个分镜单独编辑对象，可添加背景参考图与对象参考图。
                      </div>

                      <div style={styles.tutBlockTitle}>Step 3 导出与迭代</div>
                      <div style={styles.tutText}>
                        选择平台后保存提示词文件夹；生成结果不理想时，优先回改分镜结构与对象约束。
                      </div>

                      <div style={styles.tutBlockTitle}>交付标准</div>
                      <div style={styles.tutText}>
                        提示词应与分镜结构一致，且参考图描述与附件命名一致。
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.tutBlockTitle}>Workflow Design (Compact)</div>
                      <div style={styles.tutText}>
                        <b>Step 1 Build Structure</b><br />
                        Finish media and shot configuration first to create an executable shot skeleton.
                      </div>

                      <div style={styles.tutBlockTitle}>Step 2 Fill Shots</div>
                      <div style={styles.tutText}>
                        Edit objects per shot and optionally attach shot background references and object references.
                      </div>

                      <div style={styles.tutBlockTitle}>Step 3 Export and Iterate</div>
                      <div style={styles.tutText}>
                        Save prompt folder after choosing platform; if output drifts, adjust shot structure and object constraints first.
                      </div>

                      <div style={styles.tutBlockTitle}>Delivery Rule</div>
                      <div style={styles.tutText}>
                        Prompt text must match shot structure and attachment names.
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.modalBtns}>
                  {tutorialPage === 1 ? (
                    <button style={styles.modalBtnGhost} onClick={() => setTutorialPage(0)} type="button">
                      {lang === "zh" ? "返回核心操作" : "Back to Core Ops"}
                    </button>
                  ) : (
                    <button style={styles.modalBtnGhost} onClick={() => setTutorialPage(1)} type="button">
                      {lang === "zh" ? "下一页：流程设计" : "Next: Workflow Design"}
                    </button>
                  )}
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      setTutorialPage(0);
                      trackUiAction("help", "close", "tutorial", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </>
            )}

            {helpModal === "feedback" && (
              <>
                <div style={styles.modalTitle}>{lang === "zh" ? "问题反馈" : "Feedback"}</div>
                <div style={styles.modalText}>
                  {lang === "zh"
                    ? "你可以直接在这里发送到服务器（我能看到统计与内容），也可以复制模板贴给我。"
                    : "You can send it to the server (so I can see stats & content), or copy the template to share with me."}
                </div>

                <div style={styles.feedbackTpl}>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【问题】" : "[Issue]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【复现步骤】1) 2) 3)" : "[Steps] 1) 2) 3)"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【期望】" : "[Expected]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【实际】" : "[Actual]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【环境】浏览器/系统" : "[Env] Browser/OS"}</div>
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    lang === "zh"
                      ? "把你的反馈写在这里（可选），然后点“发送”或“复制”"
                      : "Write your feedback here (optional), then click Send or Copy"
                  }
                  style={styles.feedbackArea}
                />

                {feedbackSent && (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.82 }}>
                    {feedbackSent === "ok"
                      ? lang === "zh"
                        ? "✅ 已发送"
                        : "✅ Sent"
                      : lang === "zh"
                        ? "❌ 发送失败（可能是未部署 telemetry worker 或网络问题）"
                        : "❌ Failed (worker not deployed or network issue)"}
                  </div>
                )}

                <div style={styles.modalBtns}>
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      setFeedbackSent("");
                      trackUiAction("help", "close", "feedback", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>

                  <button
                    style={styles.modalBtnGhost}
                    onClick={async () => {
                      const text =
                        feedbackText.trim() ||
                        (lang === "zh"
                          ? "【问题】\n【复现步骤】1) \n【期望】\n【实际】\n【环境】"
                          : "[Issue]\n[Steps] 1)\n[Expected]\n[Actual]\n[Env]");
                      await copyToClipboard(text);
                      trackUiAction("feedback", "copy", "template", { len: text.length }, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "复制" : "Copy"}
                  </button>

                  <button style={styles.modalBtn} onClick={submitFeedback} type="button" disabled={feedbackSending}>
                    {feedbackSending ? (lang === "zh" ? "发送中…" : "Sending…") : lang === "zh" ? "发送" : "Send"}
                  </button>
                </div>
              </>
            )}

            {helpModal === "about" && (
              <>
                <div style={styles.modalTitle}>{lang === "zh" ? "关于" : "About"}</div>
                <div style={styles.modalText}>
                  <div style={{ fontWeight: 900, opacity: 0.95 }}>ScenePilotix</div>
                  <div style={{ marginTop: 6, opacity: 0.82, lineHeight: 1.55 }}>
                    {lang === "zh"
                      ? "一个用于“分镜结构 + 精准构图 + 运动轨迹”提示词生成的工具。目标：让大模型更稳定地理解你想要的画面位置、尺寸和运动。"
                      : "A tool for storyboard structure + precise composition + motion paths prompt generation. Goal: make models follow layout/scale/motion more reliably."}
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.7 }}>
                    {lang === "zh" ? "Version: 1.05 (Universal)" : "Version: 1.05 (Universal)"}
                  </div>
                </div>

                <div style={styles.modalBtns}>
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      trackUiAction("help", "close", "about", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "rgba(255,255,255,0.92)",
    background: "radial-gradient(1200px 700px at 20% 10%, rgba(120,180,255,0.18), transparent 50%), #0b1020"
  },
  top: {
    height: 58,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(8px)"
  },

  // ✅ brand：单行（彻底去掉 File badge 与 tagline）
  brand: { display: "flex", alignItems: "center" },
  logoRow: { display: "flex", alignItems: "baseline", gap: 10, lineHeight: 1 },
  logoEn: { fontWeight: 900, fontSize: 16, letterSpacing: 0.2 },
  logoZh: { fontWeight: 900, fontSize: 18, opacity: 0.88 },

  topBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    outline: "none",
    boxShadow: "none"
  },

  main: { flex: 1, display: "flex", minHeight: 0 },
  mainDesktop: {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr) 344px"
  },

  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0
  },

  // ---- dropdown menu ----
  menuMask: {
    position: "fixed",
    inset: 0,
    zIndex: 9998
  },
  menu: {
    position: "absolute",
    top: 58,
    right: 12,
    width: "clamp(296px, 34vw, 360px)",
    maxWidth: "calc(100vw - 24px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 10
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.65,
    padding: "6px 8px"
  },
  menuNotice: {
    margin: "2px 0 10px",
    borderRadius: 12,
    border: "1px solid rgba(120,180,255,0.35)",
    background: "rgba(120,180,255,0.10)",
    padding: "8px 10px"
  },
  menuNoticeTitle: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.95,
    marginBottom: 4
  },
  menuNoticeText: {
    fontSize: 12,
    lineHeight: 1.5,
    opacity: 0.9,
    whiteSpace: "normal",
    wordBreak: "break-word"
  },
  nowrapInline: {
    whiteSpace: "nowrap"
  },
  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none",
    marginBottom: 8,
    textAlign: "left",
    transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease"
  },
  menuItemHover: {
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(120,180,255,0.16)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.22) inset"
  },
  menuSep: {
    height: 1,
    background: "rgba(255,255,255,0.10)",
    margin: "8px 6px 10px"
  },

  // ---- modal ----
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
    width: 520,
    maxWidth: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 14
  },
  libraryModal: {
    width: 720,
    maxWidth: "100%",
    maxHeight: "min(80vh, 760px)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 8, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },
  wizardBrand: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.66,
    marginBottom: 8,
    fontWeight: 800
  },
  wizardTitle: { fontWeight: 900, fontSize: 20, lineHeight: 1.25, opacity: 0.98 },
  wizardSubtitle: { marginTop: 8, fontSize: 13, opacity: 0.82, lineHeight: 1.45 },
  newProjectMediaRow: { display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 10 },
  newProjectMediaBtn: {
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800
  },
  newProjectMediaBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },
  wizardBullets: {
    marginTop: 8,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.45,
    display: "grid",
    gap: 6
  },
  wizardStepRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8
  },
  wizardStepItem: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    padding: "8px 10px",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 700
  },
  wizardPrinciple: {
    marginTop: 8,
    border: "1px solid rgba(120,180,255,0.22)",
    borderRadius: 10,
    background: "rgba(120,180,255,0.10)",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.92
  },
  wizardPrincipleColumn: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6
  },
  wizardPrincipleSub: {
    marginLeft: 14,
    opacity: 0.9
  },
  wizardPlanGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
    marginTop: 8
  },
  wizardPlanCard: {
    textAlign: "left",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "inherit"
  },
  wizardPlanCardOn: {
    border: "1px solid rgba(120,180,255,0.7)",
    background: "rgba(120,180,255,0.12)"
  },
  wizardPlanTitle: { fontSize: 13, fontWeight: 900, marginBottom: 4 },
  wizardPlanDesc: { fontSize: 12, opacity: 0.76, lineHeight: 1.4 },
  modalFormRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    alignItems: "center",
    marginTop: 8
  },
  modalLabel: { fontSize: 12, opacity: 0.86, fontWeight: 800 },
  modalInput: {
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    padding: "0 10px",
    outline: "none",
    fontSize: 12
  },
  modalSelect: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    padding: "0 34px 0 10px",
    outline: "none",
    fontSize: 12,
    fontWeight: 700,
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, rgba(220,232,255,0.78) 50%), linear-gradient(135deg, rgba(220,232,255,0.78) 50%, transparent 50%), linear-gradient(to right, transparent, transparent)",
    backgroundPosition: "calc(100% - 18px) calc(50% - 1px), calc(100% - 12px) calc(50% - 1px), 100% 0",
    backgroundSize: "6px 6px, 6px 6px, 2.2em 2.2em",
    backgroundRepeat: "no-repeat"
  },
  manualDurGrid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    gap: 8
  },
  libraryHead: { display: "flex", alignItems: "center", gap: 10 },
  libraryPath: {
    marginLeft: "auto",
    fontSize: 12,
    opacity: 0.78,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "6px 8px"
  },
  libraryActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  libraryHint: {
    fontSize: 12,
    border: "1px solid rgba(120,180,255,0.35)",
    borderRadius: 10,
    padding: "6px 8px",
    background: "rgba(120,180,255,0.12)",
    opacity: 0.92
  },
  libraryFloatHint: {
    position: "fixed",
    right: 14,
    top: 74,
    zIndex: 1200,
    maxWidth: 420,
    fontSize: 12,
    lineHeight: 1.35,
    border: "1px solid rgba(120,180,255,0.35)",
    borderRadius: 10,
    padding: "8px 10px",
    background: "rgba(20,28,46,0.96)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  libraryList: {
    minHeight: 180,
    maxHeight: "min(50vh, 420px)",
    overflow: "auto",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    background: "rgba(0,0,0,0.16)",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  libraryEmpty: {
    fontSize: 12,
    opacity: 0.7,
    padding: "8px 6px"
  },
  libraryItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    padding: "8px 10px",
    background: "rgba(255,255,255,0.03)"
  },
  libraryItemName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 12 },

  modalBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(120,180,255,0.35)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnGhost: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnDanger: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,80,80,0.10)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },

  // ---- tutorial formatting ----
  tutorialTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  tutorialPill: {
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid rgba(120,180,255,0.4)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 900
  },
  tutorialPageTag: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.78,
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)"
  },
  tutBlockTitle: { marginTop: 10, fontWeight: 900, opacity: 0.92 },
  tutText: { marginTop: 6, opacity: 0.82 },

  // ---- feedback ----
  feedbackTpl: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)"
  },
  feedbackTplLine: { fontSize: 12, opacity: 0.82, lineHeight: 1.55 },
  feedbackArea: {
    width: "100%",
    marginTop: 10,
    minHeight: 110,
    resize: "vertical",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "10px 10px",
    fontSize: 12,
    lineHeight: 1.45
  }
};
