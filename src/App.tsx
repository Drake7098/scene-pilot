import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "./i18n";
import { defaultProject, resolveSceneConfig, sanitizeProject } from "./model";
import type { Project, Scene, ShotPlan, TransitionType } from "./model";
import { loadLang, saveLang, loadProject, saveProject } from "./utils/storage";

import { Sidebar } from "./components/Sidebar";
import { Stage } from "./components/Stage";
import { PropsPanel } from "./components/PropsPanel";
import { ExportPanel } from "./components/ExportPanel";
import { ProjectControlBar } from "./components/ProjectControlBar";
import {
  ResultConsole,
  type ResultConsoleMode,
  type ResultGenerationPrefs,
  type ResultPlan,
  type ResultPreview,
  type ResultStructureState
} from "./components/ResultConsole";
import {
  CreateWizard,
  type CreateStep,
  type WizardDraft
} from "./components/CreateWizard";
import { generatePrompts } from "./utils/prompt";
import type { PromptProfile } from "./utils/prompt";
import { getRefBlob } from "./utils/localRefs";
import { defaultObjectName, defaultProjectName, defaultSceneName, safeExportName } from "./utils/naming";
import { getPlatformLabel, getPlatformPreset, PLATFORM_PRESETS } from "./config/platformPresets";
import type { PlatformPresetId } from "./config/platformPresets";
import type { IntentPlan } from "./types/intentPlan";
import { briefToIntentPlan } from "./utils/briefParser";
import { deriveRefineStrategy } from "./utils/refineStrategy";
import { applyFeedbackToStructure } from "./utils/feedbackToStructure";
import { intentPlanToProProject } from "./utils/intentPlanToProject";
import {
  buildDrawThingsQueuePack,
  defaultComfyUiBaseUrls,
  defaultDrawThingsBaseUrls,
  downloadTextFile,
  probeComfyUi,
  probeDrawThings,
  runComfyUiImage,
  runDrawThingsTxt2Img,
  type DrawThingsQueuePack,
  type LocalProviderStatus
} from "./utils/localGeneration";

import { CircleHelp, Languages, MoreHorizontal, X } from "lucide-react";
import { CreditCard, Crown, KeyRound, LogOut, UserRound, Wallet } from "lucide-react";
import { AccountCenterModal } from "./components/AccountCenterModal";
import { BillingOverlay } from "./components/billing/BillingOverlay";
import type { AccountCenterSection, ApiCredentialState, UserState } from "./types/account";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "./types/billing";
import { sendCode, verifyCode, getCurrentUser, logout } from "./services/authService";
import { CREDIT_PACKS, creditCostFor, getBillingSnapshot, launchCheckout, openCustomerPortal, PRO_PLAN } from "./services/billingService";
import { finalizeReservedCredits, getCreditLedger, getWalletState, reserveCredits, rollbackReservedCredits } from "./services/creditService";
import { getApiCredentials, setApiCredentials } from "./services/mockAccountStore";
import { canOpenCustomerPortal, canUseBringYourOwnApi, canUseHostedGeneration, canUseProConsole } from "./utils/entitlement";
import { PRO_PLUS_MOTION_CATEGORIES } from "./content/proCameraPresets";
import {
  advancedCreativeTutorialBlocks,
  beginnerCreativeTutorialBlocks,
  getImageClassicModes,
  getImageProEffectsByCategory,
  getVideoClassicModes,
  getVisibleVideoProPlusPresets,
  IMAGE_PRO_CATEGORIES
} from "./content/proCreativeModes";

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
import { UI_ACTION, UI_COMMAND, UI_EFFECT, UI_MENU, UI_PALETTE, UI_PANEL, UI_RADIUS, UI_SPACE, UI_TYPO } from "./uiTokens";

type FSDirectoryHandle = any;
type LibraryEntry = { name: string; kind: "file" | "directory" };
type SavePlatformId = PlatformPresetId;
type SavePlatformPickMode = "save" | "save_as" | "save_all";
type TestBridge = {
  skipHandlePersistence?: boolean;
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite"; id?: string }) => Promise<any>;
};
const LIB_DB_NAME = "scenepilot_library_handles";
const LIB_DB_STORE = "handles";
const LIB_DB_VER = 1;
const LIB_ROOT_KEY = "root";
const LIB_INIT_KEY = "spx_library_initialized";
const AUTH_LEGAL_CONSENT_KEY = "sp_auth_legal_consent_v1";
const BILLING_LEGAL_CONSENT_KEY = "sp_billing_legal_consent_v1";

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

function getTestBridge(): TestBridge | null {
  if (typeof window === "undefined") return null;
  return ((window as any).__SCENEPILOT_TEST_BRIDGE__ as TestBridge | undefined) ?? null;
}

async function savePersistedLibraryRootHandle(handle: any): Promise<void> {
  if (getTestBridge()?.skipHandlePersistence) return;
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
  if (getTestBridge()?.skipHandlePersistence) return null;
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

type HelpCenterSection = "quick_start" | "pro_motion_beginner" | "pro_motion_advanced" | "export" | "troubleshoot" | "feedback" | "about";
const ONBOARDING_KEY = "sp_onboarding_done";
const SAVE_PLATFORM_KEY = "sp_save_prompt_platform";
const WORKSPACE_MODE_KEY = "sp_workspace_mode";

function savePlatformToProfile(id: SavePlatformId): PromptProfile {
  return getPlatformPreset(id).baseProfile;
}

function savePlatformLabel(id: SavePlatformId, lang: Lang) {
  return getPlatformLabel(id, lang === "zh" ? "zh" : "en");
}

const SAVE_PLATFORM_OPTIONS: SavePlatformId[] = PLATFORM_PRESETS.map((preset) => preset.id);
const STRUCTURE_FIRST_PRESET = {
  imageDrawSteps: 6,
  imageDrawGuidance: 3.5,
  comfySteps: 8,
  comfyCfg: 3.5
} as const;

function resultModeResolution(ratio: ResultPlan["ratio"], mediaType: ResultPlan["mediaType"]) {
  if (ratio === "9:16") return mediaType === "video" ? "288x512" : "320x576";
  if (ratio === "1:1") return mediaType === "video" ? "320x320" : "384x384";
  return mediaType === "video" ? "512x288" : "576x320";
}

function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(userAgent);
}

function isTypingTarget(target: EventTarget | null) {
  const node = target as HTMLElement | null;
  if (!node) return false;
  if (node.isContentEditable) return true;
  const tag = (node.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function defaultRefInheritByPlan(shotPlan: ShotPlan, isFirst: boolean) {
  if (isFirst || shotPlan === "single") {
    return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "off" as const };
  }
  if (shotPlan === "multicam" || shotPlan === "continuous") {
    return { inheritBgRefFromPrevious: true, inheritObjectRefsFromPrevious: "all" as const };
  }
  return { inheritBgRefFromPrevious: false, inheritObjectRefsFromPrevious: "identity_only" as const };
}

function buildDefaultObjectLayer(lang: Lang, index: number) {
  return {
    id: defaultObjectName(lang, index),
    type: lang === "zh" ? "主体" : "subject",
    shape: "rect" as const,
    shapeDesc: "",
    look: "",
    z: 10,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0 as const, x: 50, y: 50, w: 24, h: 24, rot: 0 },
      { t: 1 as const, x: 50, y: 50, w: 24, h: 24, rot: 0 }
    ],
    notes: "",
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional" as const
  };
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [project, setProject] = useState<Project>(() => loadProject() ?? defaultProject());
  const [workspaceMode, setWorkspaceMode] = useState<ResultConsoleMode>(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_MODE_KEY);
      return saved === "pro" || saved === "results" ? saved : "results";
    } catch {
      return "results";
    }
  });
  const [sceneIdx, setSceneIdx] = useState<number>(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editT, setEditT] = useState<0 | 1>(0);
  const [resultBrief, setResultBrief] = useState("");
  const [resultFeedback, setResultFeedback] = useState("");
  const [resultBusy, setResultBusy] = useState(false);
  const [accountCenterOpen, setAccountCenterOpen] = useState(false);
  const [accountCenterSection, setAccountCenterSection] = useState<AccountCenterSection>("overview");
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [accountCredits, setAccountCredits] = useState(0);
  const [accountLedger, setAccountLedger] = useState<CreditLedgerEntry[]>([]);
  const [accountSubscription, setAccountSubscription] = useState<SubscriptionState | null>(null);
  const [accountApiCredentials, setAccountApiCredentials] = useState<ApiCredentialState | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "code">("email");
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [allowProSkip, setAllowProSkip] = useState(false);
  const [lastSentCode, setLastSentCode] = useState("");
  const [authLegalAccepted, setAuthLegalAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_LEGAL_CONSENT_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [billingLegalAccepted, setBillingLegalAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BILLING_LEGAL_CONSENT_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [creditPacks] = useState<CreditPackConfig[]>(CREDIT_PACKS);
  const [proPlan] = useState<ProPlanConfig | null>(PRO_PLAN);
  const [billingPage, setBillingPage] = useState<"upgrade" | "credits" | null>(null);
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false);
  const [insufficientCreditsMessage, setInsufficientCreditsMessage] = useState("");
  const [resultPrefs, setResultPrefs] = useState<ResultGenerationPrefs>({
    mediaType: "image",
    ratio: "16:9",
    batchSize: 2,
    engineMode: "auto",
    showcaseMode: "show"
  });
  const [resultPlan, setResultPlan] = useState<ResultPlan | null>(null);
  const [resultIntentPlan, setResultIntentPlan] = useState<IntentPlan | null>(null);
  const [resultPreviews, setResultPreviews] = useState<ResultPreview[]>([]);
  const [resultSelectedPreviewId, setResultSelectedPreviewId] = useState<string | null>(null);
  const [resultRatings, setResultRatings] = useState<Record<string, number>>({});
  const [resultCardFeedbacks, setResultCardFeedbacks] = useState<Record<string, string>>({});
  const [resultStructureState, setResultStructureState] = useState<ResultStructureState>({
    subjectX: 42,
    subjectY: 30,
    subjectSize: 24,
    subjectLayer: 5,
    compositionFocus: "center"
  });
  const [freeTrialUsed, setFreeTrialUsed] = useState(0);
  const [drawThingsPack, setDrawThingsPack] = useState<DrawThingsQueuePack | null>(null);
  const [comfyStatus, setComfyStatus] = useState<LocalProviderStatus>({ provider: "comfyui", state: "idle" });
  const [drawThingsStatus, setDrawThingsStatus] = useState<LocalProviderStatus>({ provider: "drawthings", state: "idle" });

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

  // ✅ Help Center
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [helpCenterSection, setHelpCenterSection] = useState<HelpCenterSection>("quick_start");
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
  const [savePlatformModalOpen, setSavePlatformModalOpen] = useState(false);
  const [savePlatformPickMode, setSavePlatformPickMode] = useState<SavePlatformPickMode>("save");
  const [pendingSavePlatformId, setPendingSavePlatformId] = useState<SavePlatformId>("universal");
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [renameProjectDraft, setRenameProjectDraft] = useState("");
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [openExportNonce, setOpenExportNonce] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const savePlatformResolverRef = useRef<((id: SavePlatformId | null) => void) | null>(null);
  const shortcutActionsRef = useRef<{
    openProject: () => void;
    newProject: () => void;
    save: () => void;
    saveAs: () => void;
  }>({
    openProject: () => undefined,
    newProject: () => undefined,
    save: () => undefined,
    saveAs: () => undefined
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const useDesktopFixedLayout = viewportWidth >= 1400;
  const showBrandZh = viewportWidth >= 980;
  const isMac = useMemo(() => isApplePlatform(), []);

  function syncSavePlatform(id: SavePlatformId) {
    setSavePlatformId(id);
    try {
      localStorage.setItem(SAVE_PLATFORM_KEY, id);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!helpMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpMenuOpen]);
  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, workspaceMode);
    } catch {
      // ignore
    }
  }, [workspaceMode]);
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
  const mediaMode = useMemo<"image" | "video">(() => resolveSceneConfig(scene).mediaMode, [scene]);

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
    const onKeyDown = (e: KeyboardEvent) => {
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (!modKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const key = (e.key || "").toLowerCase();
      if (key === "o" && !e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.openProject();
        return;
      }
      if (key === "n" && !e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.newProject();
        return;
      }
      if (key === "s" && e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.saveAs();
        return;
      }
      if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMac]);

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
    if (!helpCenterOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpCenterOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpCenterOpen]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setComfyStatus({ provider: "comfyui", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
      setDrawThingsStatus({ provider: "drawthings", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
      const [nextComfy, nextDraw] = await Promise.all([
        probeComfyUi(defaultComfyUiBaseUrls()),
        probeDrawThings(defaultDrawThingsBaseUrls())
      ]);
      if (!alive) return;
      setComfyStatus(nextComfy);
      setDrawThingsStatus(nextDraw);
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => {
    return () => {
      for (const preview of resultPreviews) {
        if (preview.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.imageUrl);
        if (preview.videoUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.videoUrl);
      }
    };
  }, [resultPreviews]);

  useEffect(() => {
    if (!resultPreviews.length) {
      setResultSelectedPreviewId(null);
      return;
    }
    setResultSelectedPreviewId((prev) => (prev && resultPreviews.some((item) => item.id === prev) ? prev : resultPreviews[0].id));
    setResultRatings((prev) => {
      const next = { ...prev };
      for (const item of resultPreviews) {
        if (next[item.id] == null) next[item.id] = 72;
      }
      return next;
    });
  }, [resultPreviews]);

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
    setWizardCancelable(true);
    setWizardDraft(nextWizardDraft());
    setWizardStep(showWelcome ? "welcome_1" : "media");
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

  const refreshAccountState = useCallback(async () => {
    const user = await getCurrentUser();
    setAccountUser(user);
    if (!user) {
      setAccountCredits(0);
      setAccountLedger([]);
      setAccountSubscription(null);
      setAccountApiCredentials(null);
      return;
    }
    const [wallet, ledger, billingSnapshot] = await Promise.all([
      getWalletState(user.id),
      getCreditLedger(user.id),
      getBillingSnapshot(user.id)
    ]);
    setAccountCredits(wallet.creditsBalance);
    setAccountLedger(ledger);
    setAccountSubscription(billingSnapshot.subscription);
    setAccountApiCredentials(getApiCredentials(user.id));
  }, []);

  function openAccountCenter(section: AccountCenterSection, options?: { allowProSkip?: boolean }) {
    if (!accountUser) {
      setAuthStep("email");
      setAuthCode("");
    }
    setAllowProSkip(Boolean(options?.allowProSkip && section === "pro" && !accountUser));
    setAccountCenterSection(section);
    setAccountCenterOpen(true);
  }

  function openBillingPage(page: "upgrade" | "credits") {
    setBillingPage(page);
  }

  function closeBillingPage() {
    setBillingPage(null);
  }

  function requestProAccess(section: AccountCenterSection = "pro") {
    if (canUseProConsole(accountUser)) {
      setWorkspaceMode("pro");
      return true;
    }
    openAccountCenter(section, { allowProSkip: section === "pro" });
    return false;
  }

  async function handleSendAuthCode() {
    if (authBusy || !authLegalAccepted) return;
    setAuthBusy(true);
    try {
      const result = await sendCode(authEmail);
      setLastSentCode(result.devCode);
      setAuthStep("code");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleVerifyAuthCode() {
    if (authBusy || !authLegalAccepted) return;
    setAuthBusy(true);
    try {
      await verifyCode(authEmail, authCode);
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      await refreshAccountState();
      setAccountCenterSection("overview");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    setAccountCenterSection("auth");
    setAuthStep("email");
    setAuthCode("");
    setLastSentCode("");
    await refreshAccountState();
  }

  async function handlePurchaseCredits(packId: string) {
    if (!accountUser || billingBusy) {
      openAccountCenter("auth");
      return;
    }
    if (!billingLegalAccepted) {
      openBillingPage("credits");
      return;
    }
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "credits", productId: packId });
      await refreshAccountState();
      setBillingPage("credits");
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleUpgradePro() {
    if (!accountUser || billingBusy) {
      openAccountCenter("auth");
      return;
    }
    if (!billingLegalAccepted) {
      openBillingPage("upgrade");
      return;
    }
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "pro", productId: PRO_PLAN.id });
      await refreshAccountState();
      setBillingPage("upgrade");
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleOpenCustomerPortal() {
    if (!accountUser) {
      openAccountCenter("auth");
      return;
    }
    if (!canOpenCustomerPortal(accountUser)) {
      openBillingPage("upgrade");
      return;
    }
    setBillingBusy(true);
    try {
      const portal = await openCustomerPortal(accountUser.id);
      window.open(portal.url, "_blank", "noopener,noreferrer");
    } finally {
      setBillingBusy(false);
    }
  }

  function handleSaveApiCredentials(next: ApiCredentialState) {
    if (!accountUser || !canUseBringYourOwnApi(accountUser)) return;
    setApiCredentials(accountUser.id, next);
    setAccountApiCredentials(next);
  }

  function openNotEnoughCredits(message: string) {
    setInsufficientCreditsMessage(message);
    setInsufficientCreditsOpen(true);
  }

  useEffect(() => {
    void refreshAccountState();
  }, [refreshAccountState]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_LEGAL_CONSENT_KEY, authLegalAccepted ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }, [authLegalAccepted]);

  useEffect(() => {
    try {
      localStorage.setItem(BILLING_LEGAL_CONSENT_KEY, billingLegalAccepted ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }, [billingLegalAccepted]);

  function requestNewProject() {
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return;
    }
    if (!hasUnsavedLibraryChanges) {
      setWorkspaceMode("pro");
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: false, skippedSavePrompt: true }, lang);
      return;
    }
    setNewProjectConfirmOpen(true);
  }

  function requestSavePlatform(mode: SavePlatformPickMode): Promise<SavePlatformId | null> {
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

  function requestRenameProject() {
    setRenameProjectDraft(fileLabel || defaultProjectName(lang));
    setRenameProjectOpen(true);
  }

  function confirmRenameProject() {
    setLabelPersist(renameProjectDraft.trim() || defaultProjectName(lang));
    setRenameProjectOpen(false);
  }

  async function createNewProjectAfterSave() {
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return;
    }
    setNewProjectConfirmBusy(true);
    try {
      const ok = await saveToDisk();
      if (!ok) return;
      setNewProjectConfirmOpen(false);
      setWorkspaceMode("pro");
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: true }, lang);
    } finally {
      setNewProjectConfirmBusy(false);
    }
  }

  function createNewProjectDirectly() {
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return;
    }
    setNewProjectConfirmOpen(false);
    setWorkspaceMode("pro");
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
      const shotName = defaultSceneName(lang, media, no);
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
        layers: [buildDefaultObjectLayer(lang, 1)],
        config: {
          mediaMode: media,
          compiler: media === "video" ? "v2" : "v1",
          sceneTier,
          v2Mode: "strict",
          stability: "standard"
        },
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
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return;
    }
    const p = sanitizeProject(buildProjectFromWizard(wizardDraft));
    const fallbackName = defaultProjectName(lang);
    const projectFileName = wizardDraft.projectName.trim() || fallbackName;
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    setFileHandle(null);
    setLabelPersist(projectFileName);
    updateProject(p);
    setWorkspaceMode("pro");
    setWizardOpen(false);
    markOnboardingDone();
    trackProjectFlow("project_create", { media: wizardDraft.mediaType, shotPlan: wizardDraft.shotPlan, sceneTier: wizardDraft.sceneTier }, lang);
  }

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function briefIncludes(brief: string, terms: string[]) {
    const text = brief.toLowerCase();
    return terms.some((term) => text.includes(term.toLowerCase()));
  }

  function parseDurationFromBrief(brief: string, mediaType: "image" | "video", shotCount: number) {
    if (mediaType === "image") return 0;
    const explicit = brief.match(/(\d+)\s*(?:s|sec|secs|second|seconds|秒)/i);
    if (explicit) return clampInt(Number(explicit[1]), Math.max(shotCount, 4), 30);
    if (briefIncludes(brief, ["6秒", "6 second", "6-sec", "6s"])) return 6;
    if (briefIncludes(brief, ["15秒", "15 second"])) return 15;
    if (briefIncludes(brief, ["30秒", "30 second"])) return 30;
    return 6;
  }

  function scoreBandText(score: number) {
    if (score <= 39) return lang === "zh" ? "评分 0-39：方向错了，优先重构结构。" : "Score 0-39: direction is wrong, rebuild structure first.";
    if (score <= 69) return lang === "zh" ? "评分 40-69：方向基本对，做局部修正。" : "Score 40-69: direction mostly right, make local fixes.";
    if (score <= 89) return lang === "zh" ? "评分 70-89：可继续细修，收敛细节。" : "Score 70-89: keep refining details.";
    return lang === "zh" ? "评分 90-100：可交付，或进入 Pro 精修。" : "Score 90-100: deliverable or optional Pro polish.";
  }

  function inferResultPlan(
    brief: string,
    feedback = "",
    prefs: ResultGenerationPrefs = resultPrefs,
    intentPlan: IntentPlan = briefToIntentPlan(brief, lang)
  ): ResultPlan {
    const mergedBrief = `${brief}\n${feedback}`.trim();
    const mediaType: "image" | "video" = intentPlan.mediaType === "video" ? "video" : "image";
    const shotPlan: ResultPlan["shotPlan"] = "single";
    const shotCount = 1;
    const ratio: ResultPlan["ratio"] = prefs.ratio ?? intentPlan.ratio;
    const outputCount = Math.min(4, prefs.batchSize);
    const totalDuration = parseDurationFromBrief(mergedBrief, mediaType, shotCount);
    const target = lang === "zh" ? "先把图做快、做准，再决定是否进 Pro" : "Get image direction right first, then decide on Pro";
    const route = [
      lang === "zh" ? "Intent Parser" : "Intent Parser",
      lang === "zh" ? "Structure Planner" : "Structure Planner",
      lang === "zh" ? "Model Router" : "Model Router",
      lang === "zh" ? "Execution Loop" : "Execution Loop",
      lang === "zh" ? "Feedback Scorer" : "Feedback Scorer"
    ];
    const checkpoints = [
      lang === "zh" ? "先验证主体、构图和背景层次是否正确。" : "Validate subject, composition, and background layering first.",
      lang === "zh" ? "评分和一句话反馈直接进入下一轮。" : "Score plus one-line feedback goes into next round directly.",
      lang === "zh" ? "视频能力保留，但首页不作为主验证链路。" : "Video stays available, but is not the homepage validation path."
    ];
    const scenes = [{
      title: lang === "zh" ? "首轮图像结果" : "First-pass image result",
      goal: lang === "zh" ? "先锁主体、构图、背景，再看风格方向。" : "Lock subject, composition, background, then check style direction."
    }];
    const structure = intentPlan;
    return {
      brief,
      mediaType,
      shotPlan,
      shotCount,
      totalDuration,
      ratio,
      outputCount,
      engineMode: prefs.engineMode,
      headline: lang === "zh"
        ? `先用 ${outputCount} 张图拿到可判断结果，再决定是否进入 Pro。`
        : `Use ${outputCount} images to get a judgeable result before moving into Pro.`,
      summary: lang === "zh"
        ? "自动拆结构、自动选本地引擎，用户只做判断、评分和轻干预。"
        : "Auto-plan structure and auto-route local engines, while users focus on judgment, scoring, and light intervention.",
      target,
      route,
      checkpoints,
      scenes,
      structure,
      routeReason: lang === "zh"
        ? "默认优先 Draw Things（低成本图像首轮更快）；不可用时回退 ComfyUI；两者都不可用则回退任务包。"
        : "Prioritize Draw Things for faster low-cost first pass; fallback to ComfyUI; if both fail, fallback to handoff package."
    };
  }

  function buildResultPreviews(plan: ResultPlan, feedback = ""): ResultPreview[] {
    const issueLabel = feedback.trim()
      ? (lang === "zh" ? `已吸收修改：${feedback.trim()}` : `Incorporated change: ${feedback.trim()}`)
      : (lang === "zh" ? "先看方向、构图和主体关系。" : "Check direction, composition, and subject relation first.");
    const previewCount = Math.min(4, Math.max(1, plan.outputCount || 1));
    return Array.from({ length: previewCount }, (_, index) => {
      const tonePool = [
        "linear-gradient(135deg, rgba(52,120,240,0.72), rgba(18,34,56,0.92))",
        "linear-gradient(135deg, rgba(42,170,166,0.72), rgba(15,30,42,0.92))",
        "linear-gradient(135deg, rgba(232,154,82,0.72), rgba(52,28,20,0.92))"
      ];
      return {
        id: `preview_${index + 1}`,
        title: plan.scenes[index]?.title ?? (lang === "zh" ? `结果 ${index + 1}` : `Preview ${index + 1}`),
        mediaType: "image",
        summary: lang === "zh"
          ? `系统先回传低成本方向图，确认 ${plan.scenes[index]?.goal ?? "画面方向"} 是否正确。`
          : `The system returns a low-cost directional image first to confirm whether ${plan.scenes[index]?.goal ?? "the direction"} is correct.`,
        status: feedback.trim() ? "refine" : "draft",
        hint: issueLabel,
        tone: tonePool[index % tonePool.length]
      };
    });
  }

  function buildProjectForResultPlan(plan: ResultPlan): Project {
    return sanitizeProject(buildProjectFromWizard(resultPlanToWizardDraft(plan)));
  }

  function buildScenePromptsForPlan(plan: ResultPlan): Array<{ id: string; title: string; prompt: string; resolution: string; seed: number }> {
    const intentPlan = resultIntentPlan ?? resultPlanToIntentPlan(plan);
    const projectForPlan = plan.mediaType === "image"
      ? intentPlanToProProject(intentPlan, resultStructureState, lang)
      : buildProjectForResultPlan(plan);
    if (plan.mediaType === "image") {
      const sceneItem = projectForPlan.scenes[0];
      if (!sceneItem) return [];
      const prompt = generatePrompts({ ...projectForPlan, scenes: [sceneItem] }, lang, savePlatformToProfile(savePlatformId)).trim();
      const count = Math.min(4, Math.max(1, plan.outputCount || 1));
      return Array.from({ length: count }, (_, index) => ({
        id: `${sceneItem.id || "scene_1"}_out_${index + 1}`,
        title: lang === "zh" ? `结果 ${index + 1}` : `Output ${index + 1}`,
        prompt,
        resolution: resultModeResolution(plan.ratio, plan.mediaType),
        seed: 101 + index
      }));
    }
    return projectForPlan.scenes.slice(0, Math.min(3, projectForPlan.scenes.length)).map((sceneItem, index) => ({
      id: sceneItem.id || `scene_${index + 1}`,
      title: sceneItem.name || (lang === "zh" ? `镜头 ${index + 1}` : `Shot ${index + 1}`),
      prompt: generatePrompts({ ...projectForPlan, scenes: [sceneItem] }, lang, savePlatformToProfile(savePlatformId)).trim(),
      resolution: resultModeResolution(plan.ratio, plan.mediaType),
      seed: 101 + index
    }));
  }

  async function generateLocalPreviews(plan: ResultPlan): Promise<ResultPreview[]> {
    const prompts = buildScenePromptsForPlan(plan);
    const fallback = buildResultPreviews(plan);
    const drawPack = buildDrawThingsQueuePack(prompts.map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      resolution: item.resolution,
      seed: item.seed
    })));
    setDrawThingsPack(drawPack);

    const previews = [...fallback];
    const maxExecutions = prompts.length;

    for (let index = 0; index < maxExecutions; index += 1) {
      const item = prompts[index];
      try {
        const localImage = plan.engineMode === "comfyui"
          ? await runComfyUiImage({
              prompt: item.prompt,
              resolution: item.resolution,
              seed: item.seed,
              baseUrls: defaultComfyUiBaseUrls(),
              preferredCheckpoint: comfyStatus.checkpoint,
              prefix: `${item.id}_${Date.now()}`,
              steps: STRUCTURE_FIRST_PRESET.comfySteps,
              cfg: STRUCTURE_FIRST_PRESET.comfyCfg
            })
          : await runDrawThingsTxt2Img({
              prompt: item.prompt,
              resolution: item.resolution,
              seed: item.seed,
              baseUrls: defaultDrawThingsBaseUrls(),
              steps: STRUCTURE_FIRST_PRESET.imageDrawSteps,
              guidanceScale: STRUCTURE_FIRST_PRESET.imageDrawGuidance
            });
        if (localImage.provider === "drawthings") {
          setDrawThingsStatus({
            provider: "drawthings",
            state: "ready",
            baseUrl: localImage.baseUrl,
            detail: lang === "zh" ? "HTTP API 直连成功" : "HTTP API connected"
          });
        } else {
          setComfyStatus({
            provider: "comfyui",
            state: "ready",
            baseUrl: localImage.baseUrl,
            checkpoint: comfyStatus.checkpoint,
              detail: lang === "zh" ? "workflow 执行成功" : "workflow executed"
          });
        }
        previews[index] = {
          ...previews[index],
          summary: localImage.provider === "drawthings"
            ? (lang === "zh" ? "来自 Draw Things 本地 HTTP 的低清结构预览，优先验证构图和对象关系。" : "Low-res structural preview from local Draw Things HTTP, prioritizing composition and object relationships.")
            : (lang === "zh" ? "来自 ComfyUI 本地 workflow 的低清结构预览，优先验证构图和对象关系。" : "Low-res structural preview from local ComfyUI workflow, prioritizing composition and object relationships."),
          imageUrl: localImage.imageUrl,
          provider: localImage.provider,
          hint: localImage.provider === "drawthings"
            ? (lang === "zh" ? "如需批量或 HTTP 不稳定，可直接下载 Draw Things 任务包。" : "If you need batch runs or HTTP is unstable, download the Draw Things pack.")
            : (lang === "zh" ? "ComfyUI 已直接回传首轮图，可继续指出偏差再修。" : "ComfyUI returned a first pass directly; point out the deviation to refine.")
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        try {
          const comfyImage = await runComfyUiImage({
            prompt: item.prompt,
            resolution: item.resolution,
            seed: item.seed,
            baseUrls: defaultComfyUiBaseUrls(),
            preferredCheckpoint: comfyStatus.checkpoint,
            prefix: `${item.id}_comfy_${Date.now()}`,
            steps: STRUCTURE_FIRST_PRESET.comfySteps,
            cfg: STRUCTURE_FIRST_PRESET.comfyCfg
          });
          setComfyStatus({
            provider: "comfyui",
            state: "ready",
            baseUrl: comfyImage.baseUrl,
            checkpoint: comfyStatus.checkpoint,
            detail: lang === "zh" ? "Draw Things 不可用，已回退 ComfyUI" : "Draw Things unavailable, fallback to ComfyUI"
          });
          setDrawThingsStatus({
            provider: "drawthings",
            state: "fail",
            error: message,
            detail: lang === "zh" ? "Draw Things 失败，已自动回退" : "Draw Things failed, auto-fallback"
          });
          previews[index] = {
            ...previews[index],
            summary: lang === "zh"
              ? "Draw Things 不可用，已自动回退到 ComfyUI 继续图像验证。"
              : "Draw Things unavailable, automatically fell back to ComfyUI for image validation.",
            imageUrl: comfyImage.imageUrl,
            provider: "comfyui",
            hint: message
          };
        } catch (comfyError) {
          const comfyMessage = comfyError instanceof Error ? comfyError.message : String(comfyError);
          setComfyStatus({
            provider: "comfyui",
            state: "fail",
            error: comfyMessage,
            detail: lang === "zh" ? "ComfyUI 回退失败" : "ComfyUI fallback failed"
          });
          setDrawThingsStatus({
            provider: "drawthings",
            state: "handoff",
            error: message,
            detail: lang === "zh" ? "本地引擎不可用，已降级任务包" : "Local engines unavailable, downgraded to handoff pack"
          });
          previews[index] = {
            ...previews[index],
            summary: lang === "zh"
              ? "本地引擎暂不可用，已保留结构方案并生成任务包。"
              : "Local engines are unavailable. Structure is preserved and handoff package is ready.",
            hint: `${message}; ${comfyMessage}`
          };
        }
      }
    }
    return previews;
  }

  function resultPlanToWizardDraft(plan: ResultPlan): WizardDraft {
    const totalDuration = plan.mediaType === "image" ? 12 : Math.max(plan.shotCount, plan.totalDuration || plan.shotCount * 4);
    return nextWizardDraft({
      projectName: plan.brief.slice(0, 36).trim() || defaultProjectName(lang),
      mediaType: plan.mediaType,
      ratio: plan.ratio,
      sceneTier: plan.mediaType === "video" && plan.shotCount >= 5 ? "open_space" : "small_plaza",
      shotPlan: plan.shotPlan,
      shotCount: plan.shotCount,
      totalDuration,
      durationMode: "average",
      manualDurations: Array.from({ length: Math.max(1, plan.shotCount) }, () =>
        Math.max(1, Math.round(totalDuration / Math.max(1, plan.shotCount))))
    });
  }

  function resultPlanToIntentPlan(plan: ResultPlan): IntentPlan {
    const fromStructure = plan.structure;
    if (fromStructure && typeof fromStructure === "object" && "version" in fromStructure) {
      return fromStructure as IntentPlan;
    }
    return briefToIntentPlan(plan.brief, lang);
  }

  function applyResultPlanToProject(plan: ResultPlan) {
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return;
    }
    const intentPlan = resultIntentPlan ?? resultPlanToIntentPlan(plan);
    const nextProject = intentPlanToProProject(intentPlan, resultStructureState, lang);
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    setFileHandle(null);
    setLabelPersist(intentPlan.sourceBrief.slice(0, 36).trim() || defaultProjectName(lang));
    updateProject(nextProject);
    setWizardOpen(false);
    setWorkspaceMode("pro");
    markOnboardingDone();
    trackProjectFlow("assistant_to_pro", { media: intentPlan.mediaType, shots: intentPlan.subjects.length }, lang);
  }

  async function generateResultPlan() {
    const brief = resultBrief.trim();
    if (!brief || resultBusy || freeTrialUsed >= 20) return;
    if (!canUseHostedGeneration(accountUser)) {
      openBillingPage("upgrade");
      return;
    }
    setResultBusy(true);
    setWorkspaceMode("results");
    trackProjectFlow("assistant_generate", { len: brief.length }, lang);
    let reservedEntryId = "";
    try {
      await wait(720);
      const intentPlan = resultIntentPlan ?? briefToIntentPlan(brief, lang);
      setResultIntentPlan(intentPlan);
      const plan = inferResultPlan(brief, "", resultPrefs, intentPlan);
      const cost = plan.mediaType === "video"
        ? creditCostFor("video", "video", Math.max(1, plan.outputCount || 1))
        : creditCostFor("image", "standard", Math.max(1, plan.outputCount || 1));
      if (accountCredits < cost) {
        openNotEnoughCredits(`Not enough credits. Need ${cost}, available ${accountCredits}.`);
        openBillingPage("credits");
        return;
      }
      if (accountUser) {
        const reserved = await reserveCredits(accountUser.id, cost, `generate_${plan.mediaType}`);
        reservedEntryId = reserved.id;
      }
      setResultPlan(plan);
      const previews = await generateLocalPreviews(plan);
      if (accountUser && reservedEntryId) {
        await finalizeReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      setResultPreviews(previews);
      setResultSelectedPreviewId(previews[0]?.id ?? null);
      setResultRatings({});
      setResultCardFeedbacks({});
      setResultFeedback("");
      setFreeTrialUsed((v) => Math.min(20, v + 1));
      setInsufficientCreditsOpen(false);
      setInsufficientCreditsMessage("");
      closeBillingPage();
    } catch (error) {
      if (accountUser && reservedEntryId) {
        await rollbackReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      throw error;
    } finally {
      setResultBusy(false);
    }
  }

  async function refineResultPlan() {
    if (!resultPlan || resultBusy) return;
    if (!canUseHostedGeneration(accountUser)) {
      openBillingPage("upgrade");
      return;
    }
    const activeId = resultSelectedPreviewId ?? resultPreviews[0]?.id ?? "";
    const activeScore = activeId ? (resultRatings[activeId] ?? 72) : 72;
    const activeFeedback = activeId ? (resultCardFeedbacks[activeId] ?? "") : "";
    const strategy = deriveRefineStrategy(activeScore, activeFeedback);
    const inputFeedback = [activeFeedback.trim(), resultFeedback.trim()].filter(Boolean).join("\n");
    const baseIntentPlan = resultIntentPlan ?? resultPlanToIntentPlan(resultPlan);
    const mapped = applyFeedbackToStructure(baseIntentPlan, resultStructureState, inputFeedback, lang);
    const structuralPatch = lang === "zh"
      ? `结构调整：主体位置(${mapped.structureState.subjectX},${mapped.structureState.subjectY})，主体大小=${mapped.structureState.subjectSize}，层级=${mapped.structureState.subjectLayer}，构图重心=${mapped.structureState.compositionFocus}`
      : `Structure updates: subject position (${mapped.structureState.subjectX},${mapped.structureState.subjectY}), size=${mapped.structureState.subjectSize}, layer=${mapped.structureState.subjectLayer}, composition focus=${mapped.structureState.compositionFocus}`;
    const mergedFeedback = [scoreBandText(activeScore), `strategy:${strategy.mode}`, strategy.summary, inputFeedback, ...mapped.notes, structuralPatch].filter(Boolean).join("\n");
    if (!mergedFeedback.trim()) return;
    setResultBusy(true);
    trackProjectFlow("assistant_refine", { len: mergedFeedback.trim().length, score: activeScore, strategy: strategy.mode }, lang);
    let reservedEntryId = "";
    try {
      await wait(640);
      setResultStructureState(mapped.structureState);
      setResultIntentPlan(mapped.intentPlan);
      const refinedPlan = inferResultPlan(resultPlan.brief, mergedFeedback, resultPrefs, mapped.intentPlan);
      const cost = refinedPlan.mediaType === "video"
        ? creditCostFor("video", "video", Math.max(1, refinedPlan.outputCount || 1))
        : creditCostFor("image", "standard", Math.max(1, refinedPlan.outputCount || 1));
      if (accountCredits < cost) {
        openNotEnoughCredits(`Not enough credits. Need ${cost}, available ${accountCredits}.`);
        openBillingPage("credits");
        return;
      }
      if (accountUser) {
        const reserved = await reserveCredits(accountUser.id, cost, `refine_${refinedPlan.mediaType}`);
        reservedEntryId = reserved.id;
      }
      setResultPlan(refinedPlan);
      const nextPreviews = await generateLocalPreviews(refinedPlan);
      if (accountUser && reservedEntryId) {
        await finalizeReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      setResultPreviews(nextPreviews.map((item, index) => ({
        ...item,
        status: activeScore >= 90 ? (index === 0 ? "approved" : "refine") : "refine",
        hint: mergedFeedback
      })));
    } catch (error) {
      if (accountUser && reservedEntryId) {
        await rollbackReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      throw error;
    } finally {
      setResultBusy(false);
    }
  }

  function downloadDrawThingsPack() {
    if (!drawThingsPack) return;
    downloadTextFile("scenepilotix_drawthings_queue.json", drawThingsPack.queueJson, "application/json;charset=utf-8");
    downloadTextFile("scenepilotix_drawthings_tasks.csv", drawThingsPack.tasksCsv, "text/csv;charset=utf-8");
    downloadTextFile("scenepilotix_drawthings_README.txt", drawThingsPack.readme);
  }

  function openProWizardFromResults() {
    if (!requestProAccess("pro")) return;
    openCreateWizard(false);
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
    const pickedPlatform = await requestSavePlatform("save_as");
    if (!pickedPlatform) return false;
    syncSavePlatform(pickedPlatform);
    const defaultProjectDirName = safeExportName(fileLabel || defaultProjectName(lang)) || defaultProjectName(lang);
    const input = window.prompt(
      lang === "zh" ? "另存为：输入项目目录名（同名将覆盖）" : "Save As: enter project folder name (same name will overwrite)",
      defaultProjectDirName
    );
    if (input == null) return false;
    const pickedName = safeExportName(input) || defaultProjectDirName;
    setLibraryHint(
      lang === "zh"
        ? `另存项目：${pickedName}（适用大模型 ${savePlatformLabel(pickedPlatform, lang)}，同名覆盖）`
        : `Save As project: ${pickedName} (target model ${savePlatformLabel(pickedPlatform, lang)}, same name will be overwritten)`
    );
    const ok = await saveSceneProToLibrary(pickedPlatform, pickedName);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save_as", { mode: "pro", via: "library", platform: pickedPlatform }, lang);
    return true;
  }

  async function saveToDisk(): Promise<boolean> {
    const pickedPlatform = await requestSavePlatform("save");
    if (!pickedPlatform) return false;
    syncSavePlatform(pickedPlatform);
    setLibraryHint(
      lang === "zh"
        ? `保存当前分镜到项目目录（适用大模型 ${savePlatformLabel(pickedPlatform, lang)}）。`
        : `Saving current shot to project folder (target model ${savePlatformLabel(pickedPlatform, lang)}).`
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
    if (typeof window === "undefined") return false;
    const bridge = getTestBridge();
    return typeof bridge?.showDirectoryPicker === "function" || "showDirectoryPicker" in window;
  }

  function safeFsName(input: string) {
    return safeExportName(input);
  }

  function extFromName(name: string) {
    const m = (name ?? "").trim().match(/\.([a-zA-Z0-9]{2,5})$/);
    return m ? m[1].toLowerCase() : "jpg";
  }

  shortcutActionsRef.current = {
    openProject: () => fileInputRef.current?.click(),
    newProject: requestNewProject,
    save: () => { void saveToDisk(); },
    saveAs: () => { void saveAsToDisk(); }
  };

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
      const bridge = getTestBridge();
      const picker = bridge?.showDirectoryPicker ?? (window as any).showDirectoryPicker;
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
    const fallback = defaultProjectName(lang);
    return safeFsName(customProjectName || fileLabel || fallback) || fallback;
  }

  function sceneDirName(sceneItem: Scene, idx: number, projectName: string) {
    const sceneTitle = safeFsName(sceneItem?.name || sceneItem?.id || defaultSceneName(lang, "video", idx + 1)) || `scene_${idx + 1}`;
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
    const pickedPlatform = await requestSavePlatform("save_all");
    if (!pickedPlatform) return false;
    syncSavePlatform(pickedPlatform);
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

  const helpMenuItems = [
    {
      key: "account",
      label: accountUser ? (lang === "zh" ? "我的账户" : "My Account") : (lang === "zh" ? "登录 / 注册" : "Sign In"),
      icon: <UserRound size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        openAccountCenter(accountUser ? "overview" : "auth");
      }
    },
    {
      key: "upgrade",
      label: "Upgrade",
      icon: <Crown size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        openBillingPage("upgrade");
      }
    },
    {
      key: "credits",
      label: "Credits",
      icon: <Wallet size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        openBillingPage("credits");
      }
    },
    {
      key: "manage_billing",
      label: "Manage billing",
      icon: <CreditCard size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        if (!accountUser) {
          openAccountCenter("auth");
          return;
        }
        void handleOpenCustomerPortal();
      }
    },
    ...(canUseBringYourOwnApi(accountUser) ? [{
      key: "api",
      label: lang === "zh" ? "自带 API" : "Bring Your Own API",
      icon: <KeyRound size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        openAccountCenter("api");
      }
    }] : []),
    {
      key: "help_center",
      label: lang === "zh" ? "帮助中心" : "Help Center",
      icon: <CircleHelp size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        setFeedbackSent("");
        setHelpCenterSection("quick_start");
        setHelpCenterOpen(true);
      }
    },
    ...(accountUser ? [{
      key: "logout",
      label: lang === "zh" ? "退出登录" : "Log Out",
      icon: <LogOut size={UI_MENU.item.iconSize} />,
      onClick: () => {
        setHelpMenuOpen(false);
        void handleLogout();
      }
    }] : [])
  ];

  const helpSections: Array<{ id: HelpCenterSection; label: string }> = [
    { id: "quick_start", label: lang === "zh" ? "快速开始" : "Quick Start" },
    { id: "pro_motion_beginner", label: lang === "zh" ? "新手教程" : "Beginner Motion" },
    { id: "pro_motion_advanced", label: lang === "zh" ? "进阶专业教程" : "Advanced Motion" },
    { id: "export", label: lang === "zh" ? "导出说明" : "Export Guide" },
    { id: "troubleshoot", label: lang === "zh" ? "排错" : "Troubleshooting" },
    { id: "feedback", label: lang === "zh" ? "反馈" : "Feedback" },
    { id: "about", label: lang === "zh" ? "关于" : "About" }
  ];

  // ---------------------- UI ----------------------
  return (
    <div style={{ ...styles.app, ...(workspaceMode === "pro" ? styles.appPro : styles.appQuick) }}>
      <div style={styles.appBackdrop} aria-hidden="true">
        <div style={styles.appGlowLeft} />
        <div style={styles.appGlowRight} />
        <div style={styles.appGrid} />
      </div>
      <div style={styles.top}>
        {/* ✅ 左上角 Logo：ScenePilotix + 放大中文；彻底移除原 tagline 行 */}
        <div style={styles.brand} title="ScenePilotix">
          <div style={styles.logoRow}>
            <div style={styles.logoEn}>ScenePilotix</div>
            {showBrandZh ? <div style={styles.logoZh}>场景领航</div> : null}
          </div>
        </div>

        {workspaceMode === "pro" ? (
          <div style={styles.topProjectDock}>
            <div style={styles.commandDock}>
              <ProjectControlBar
                lang={lang}
                isMac={isMac}
                projectLabel={fileLabel || defaultProjectName(lang)}
                onOpenQuickWorkspace={() => setWorkspaceMode("results")}
                onOpenProject={() => fileInputRef.current?.click()}
                onRenameProject={requestRenameProject}
                onNewProject={requestNewProject}
                onSaveProject={() => void saveToDisk()}
                onSaveAs={() => void saveAsToDisk()}
                onExportProject={() => setOpenExportNonce((v) => v + 1)}
                onSaveAll={() => void saveAllScenesToLibrary()}
                onOpenLibrary={() => {
                  setLibraryOpen(true);
                  setLibraryProjectName(null);
                  void ensureLibraryRoot(false).then((root) => {
                    if (root) void refreshLibraryEntries(root, null);
                  });
                }}
              />
            </div>
          </div>
        ) : (
          <div style={styles.topProjectDock}>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }} />

        {workspaceMode === "pro" ? (
          <button
            data-testid="top-open-quick-workspace"
            style={styles.topBtn}
            onClick={() => setWorkspaceMode("results")}
            type="button"
          >
            <span style={styles.topBtnText}>{lang === "zh" ? "快捷工作台" : "Quick Workspace"}</span>
          </button>
        ) : null}

        {/* ✅ 保留中英文切换按钮 */}
        <button style={styles.topBtn} onClick={toggleLang} type="button">
          <Languages size={16} />
          <span style={styles.topBtnText}>{lang === "zh" ? "EN" : "中文"}</span>
        </button>

        <button
          data-testid="top-help-trigger"
          style={styles.topIconBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setHelpMenuOpen((v) => !v)}
          type="button"
        >
          <MoreHorizontal size={16} />
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

      {helpMenuOpen ? (
        <>
          <div style={styles.menuMask} onMouseDown={() => setHelpMenuOpen(false)} role="presentation" />
          <div style={styles.helpMenu}>
            {helpMenuItems.map((item) => (
              <button
                key={item.key}
                data-testid={`top-help-item-${item.key}`}
                style={styles.helpMenuItem}
                type="button"
                onClick={item.onClick}
              >
                <span style={styles.helpMenuItemLabel}>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

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
            data-testid="save-platform-modal"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>
              {lang === "zh"
                ? savePlatformPickMode === "save"
                  ? "保存：选择适用大模型"
                  : savePlatformPickMode === "save_all"
                    ? "保存全部：选择适用大模型"
                    : "另存为：选择适用大模型"
                : savePlatformPickMode === "save"
                  ? "Save: Choose Target Model"
                  : savePlatformPickMode === "save_all"
                    ? "Save All: Choose Target Model"
                    : "Save As: Choose Target Model"}
            </div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? `这一步会决定本次输出适配给哪个大模型。当前默认值是 ${savePlatformLabel(savePlatformId, lang)}，你每次都可以重新选择。`
                : `This decides which model the output will target. The current default is ${savePlatformLabel(savePlatformId, lang)}, and you can change it every time.`}
            </div>
            <div style={{ ...styles.modalFormRow, gridTemplateColumns: "minmax(88px,120px) minmax(0,1fr)" }}>
              <div style={styles.modalLabel}>{lang === "zh" ? "适用大模型" : "Target Model"}</div>
              <select
                style={styles.modalSelect}
                data-testid="save-platform-select"
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
              <button style={styles.modalBtnGhost} data-testid="save-platform-cancel" type="button" onClick={() => closeSavePlatformModal(null)}>
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button style={styles.modalBtn} data-testid="save-platform-confirm" type="button" onClick={() => closeSavePlatformModal(pendingSavePlatformId)}>
                {lang === "zh" ? "确认" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameProjectOpen && (
        <div style={styles.modalMask} onMouseDown={() => setRenameProjectOpen(false)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{lang === "zh" ? "重命名项目" : "Rename Project"}</div>
            <div style={styles.modalText}>
              {lang === "zh" ? "只修改当前项目显示名与默认保存名。" : "This updates the current project label and default save name."}
            </div>
            <div style={{ ...styles.modalFormRow, gridTemplateColumns: "minmax(88px,120px) minmax(0,1fr)" }}>
              <div style={styles.modalLabel}>{lang === "zh" ? "项目名称" : "Project Name"}</div>
              <input
                style={styles.modalInput}
                value={renameProjectDraft}
                onChange={(e) => setRenameProjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRenameProject();
                }}
                autoFocus
              />
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.modalBtnGhost} type="button" onClick={() => setRenameProjectOpen(false)}>
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button style={styles.modalBtn} type="button" onClick={confirmRenameProject}>
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

      {workspaceMode === "results" ? (
        <div style={styles.resultsMain}>
          <ResultConsole
            lang={lang}
            mode={workspaceMode}
            onModeChange={(mode) => {
              if (mode === "pro") {
                requestProAccess("pro");
                return;
              }
              setWorkspaceMode(mode);
            }}
            brief={resultBrief}
            onBriefChange={setResultBrief}
            feedback={resultFeedback}
            onFeedbackChange={setResultFeedback}
            busy={resultBusy}
            freeQuota={20}
            freeUsed={freeTrialUsed}
            plan={resultPlan}
            previews={resultPreviews}
            prefs={resultPrefs}
            onPrefsChange={setResultPrefs}
            canGenerate={canUseHostedGeneration(accountUser)}
            creditsBalance={accountCredits}
            onGenerate={() => void generateResultPlan()}
            onOpenUpgrade={() => openBillingPage("upgrade")}
            onOpenCredits={() => openBillingPage("credits")}
            onRefine={() => void refineResultPlan()}
            onApplyToPro={() => {
              if (resultPlan) applyResultPlanToProject(resultPlan);
              else if (requestProAccess("pro")) {
                const intentPlan = briefToIntentPlan(resultBrief || (lang === "zh" ? "主主体 居中" : "main subject centered"), lang);
                setResultIntentPlan(intentPlan);
                const nextProject = intentPlanToProProject(intentPlan, resultStructureState, lang);
                updateProject(nextProject);
                setWorkspaceMode("pro");
              }
            }}
            onOpenWizard={openProWizardFromResults}
            runtime={{
              comfy: {
                state: comfyStatus.state === "handoff" ? "fail" : comfyStatus.state,
                label: comfyStatus.state === "ready"
                  ? (lang === "zh" ? `已连接 ${comfyStatus.baseUrl ?? ""}` : `connected ${comfyStatus.baseUrl ?? ""}`)
                  : comfyStatus.state === "checking"
                    ? (lang === "zh" ? "探测中…" : "checking…")
                    : (lang === "zh" ? "未就绪" : "unavailable")
              },
              draw: {
                state: drawThingsStatus.state,
                label: drawThingsStatus.state === "ready"
                  ? (lang === "zh" ? `HTTP 已连接 ${drawThingsStatus.baseUrl ?? ""}` : `HTTP connected ${drawThingsStatus.baseUrl ?? ""}`)
                  : drawThingsStatus.state === "handoff"
                    ? (lang === "zh" ? "HTTP 不可用，将使用任务包" : "HTTP unavailable, using task pack")
                    : drawThingsStatus.state === "checking"
                      ? (lang === "zh" ? "探测中…" : "checking…")
                      : (lang === "zh" ? "未就绪" : "unavailable")
              },
              drawPackReady: Boolean(drawThingsPack),
              drawPackCount: drawThingsPack?.tasks.length ?? 0
            }}
            onDownloadDrawPack={downloadDrawThingsPack}
            selectedPreviewId={resultSelectedPreviewId}
            onSelectPreview={setResultSelectedPreviewId}
            ratings={resultRatings}
            onRatingChange={(previewId, score) => {
              setResultRatings((prev) => ({ ...prev, [previewId]: score }));
              setResultPreviews((prev) => prev.map((item) => {
                if (item.id !== previewId) return item;
                const status: ResultPreview["status"] = score >= 90 ? "approved" : score >= 40 ? "refine" : "draft";
                return { ...item, status, hint: scoreBandText(score) };
              }));
            }}
            cardFeedbacks={resultCardFeedbacks}
            onCardFeedbackChange={(previewId, text) => setResultCardFeedbacks((prev) => ({ ...prev, [previewId]: text }))}
            structureState={resultStructureState}
            onStructureChange={setResultStructureState}
            intentPlan={resultIntentPlan}
            onIntentPlanReady={setResultIntentPlan}
          />
        </div>
      ) : (
        <div style={{ ...styles.main, ...(useDesktopFixedLayout ? styles.mainDesktop : {}) }}>
          <Sidebar
            lang={lang}
            project={safeProject}
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
            <div style={styles.stageShell}>
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
            </div>

            <ExportPanel
              lang={lang}
              project={safeProject}
              projectLabel={fileLabel}
              sceneIdx={sceneIdx}
              platformId={savePlatformId}
              openExportNonce={openExportNonce}
              onPlatformChange={(id) => syncSavePlatform(id as SavePlatformId)}
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
              if (mediaMode === "image" && tv === 1) return;
              setEditT(tv);
              trackEditorChange("timeline", "set_t", { t: tv }, lang);
            }}
          />
        </div>
      )}

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

      <BillingOverlay
        open={billingPage !== null}
        page={billingPage}
        user={accountUser}
        creditsBalance={accountCredits}
        creditPacks={creditPacks}
        proPlan={proPlan}
        billingBusy={billingBusy}
        billingLegalAccepted={billingLegalAccepted}
        onClose={closeBillingPage}
        onOpenUpgrade={() => openBillingPage("upgrade")}
        onOpenCredits={() => openBillingPage("credits")}
        onRequireAuth={() => openAccountCenter("auth")}
        onBillingLegalAcceptedChange={setBillingLegalAccepted}
        onUpgrade={() => void handleUpgradePro()}
        onBuyCredits={(packId) => void handlePurchaseCredits(packId)}
        onManageBilling={() => {
          if (!accountUser) {
            openAccountCenter("auth");
            return;
          }
          void handleOpenCustomerPortal();
        }}
      />

      {insufficientCreditsOpen ? (
        <div style={styles.modalMask} onMouseDown={() => setInsufficientCreditsOpen(false)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid="insufficient-credits-modal"
          >
            <div style={styles.modalTitle}>Not enough credits</div>
            <div style={styles.modalText}>{insufficientCreditsMessage || "You need more credits to generate images or videos."}</div>
            <div style={styles.modalBtns}>
              <button
                style={styles.modalBtnGhost}
                type="button"
                onClick={() => setInsufficientCreditsOpen(false)}
              >
                {lang === "zh" ? "关闭" : "Close"}
              </button>
              <button
                style={styles.modalBtn}
                type="button"
                onClick={() => {
                  setInsufficientCreditsOpen(false);
                  openBillingPage("credits");
                }}
                data-testid="insufficient-credits-buy"
              >
                Buy credits
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AccountCenterModal
        key={`${accountUser?.id ?? "guest"}:${accountCenterOpen ? "open" : "closed"}`}
        open={accountCenterOpen}
        lang={lang}
        section={accountCenterSection}
        user={accountUser}
        creditsBalance={accountCredits}
        ledger={accountLedger}
        creditPacks={creditPacks}
        proPlan={proPlan}
        subscription={accountSubscription}
        apiCredentials={accountApiCredentials}
        authBusy={authBusy}
        billingBusy={billingBusy}
        authStep={authStep}
        authEmail={authEmail}
        authCode={authCode}
        lastSentCode={lastSentCode}
        authLegalAccepted={authLegalAccepted}
        billingLegalAccepted={billingLegalAccepted}
        onClose={() => {
          setAccountCenterOpen(false);
          setAllowProSkip(false);
        }}
        onSectionChange={(nextSection) => {
          setAccountCenterSection(nextSection);
          if (nextSection !== "pro") setAllowProSkip(false);
        }}
        onAuthEmailChange={setAuthEmail}
        onAuthCodeChange={setAuthCode}
        onAuthLegalAcceptedChange={setAuthLegalAccepted}
        onBillingLegalAcceptedChange={setBillingLegalAccepted}
        onSendCode={() => void handleSendAuthCode()}
        onVerifyCode={() => void handleVerifyAuthCode()}
        onLogout={() => void handleLogout()}
        onPurchasePack={(packId) => void handlePurchaseCredits(packId)}
        onUpgradePro={() => void handleUpgradePro()}
        onOpenCustomerPortal={() => void handleOpenCustomerPortal()}
        onSaveApiCredentials={handleSaveApiCredentials}
        showSkipProEntry={allowProSkip}
        onSkipProEntry={() => {
          setAccountCenterOpen(false);
          setAllowProSkip(false);
          setWorkspaceMode("pro");
        }}
      />

      {helpCenterOpen && createPortal(
        <div
          data-testid="help-center-mask"
          style={styles.modalMask}
          onMouseDown={() => setHelpCenterOpen(false)}
          role="presentation"
        >
          <div
            data-testid="help-center-modal"
            style={{
              ...styles.modal,
              width: "min(820px, calc(100vw - 32px))",
              maxHeight: "min(82vh, 760px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.helpCenterHead}>
              <div style={styles.modalTitle}>{lang === "zh" ? "帮助中心" : "Help Center"}</div>
              <button
                data-testid="help-center-close-top"
                style={styles.modalIconBtn}
                type="button"
                onClick={() => setHelpCenterOpen(false)}
                aria-label={lang === "zh" ? "关闭帮助中心" : "Close help center"}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ ...styles.helpCenterBody, gridTemplateColumns: viewportWidth < 760 ? "1fr" : "180px minmax(0,1fr)" }}>
              <div style={styles.helpCenterNav}>
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    data-testid={`help-center-tab-${section.id}`}
                    type="button"
                    style={{ ...styles.helpCenterNavBtn, ...(helpCenterSection === section.id ? styles.helpCenterNavBtnOn : {}) }}
                    onClick={() => setHelpCenterSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              <div style={styles.helpCenterPanel}>
                {helpCenterSection === "quick_start" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "快速开始" : "Quick Start"}</div>
                    <div style={styles.tutText}>
                      {lang === "zh"
                        ? "1) 创建项目：先选图片或视频；结果：确定是单张结构（图片）还是逐镜编辑（视频）。\n2) 搭结构：确定分镜数量、时长、镜头关系；结果：提示词的节奏与连续性被提前锁定。\n3) 编对象：逐镜调整对象位置、大小、层级、参考图；结果：先把结构对齐，再补风格，减少生成漂移。\n4) 导出验证：先看当前提示词，再复制或导出到目标模型平台；结果：快速判断方向、构图和主体关系是否达标。"
                        : "1) Create Project: choose Image or Video first; result: you lock single-image structure (Image) or shot-by-shot editing flow (Video).\n2) Build Structure: set shot count, duration, and shot relationships; result: prompt pacing and continuity are defined before generation.\n3) Edit Objects: tune position, size, layer order, and references shot by shot; result: structure is fixed first, style is added second, reducing drift.\n4) Export & Validate: review current prompt first, then copy/export to the target model platform; result: you can quickly verify direction, composition, and subject relationships."}
                    </div>
                  </>
                ) : null}

                {helpCenterSection === "pro_motion_beginner" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "新手教程：先用经典模式" : "Beginner Tutorial: Start with Classic Modes"}</div>
                    {beginnerCreativeTutorialBlocks(lang).map((block) => (
                      <div key={block.title} style={styles.tutSectionBlock}>
                        <div style={styles.tutSectionTitle}>{block.title}</div>
                        <div style={styles.tutText}>{block.body}</div>
                      </div>
                    ))}
                    <div style={styles.tutSectionBlock}>
                      <div style={styles.tutSectionTitle}>{lang === "zh" ? "视频经典模式" : "Video Classic Modes"}</div>
                      <div style={styles.tutMotionGrid}>
                        {getVideoClassicModes().map((item) => (
                          <div key={item.id} style={styles.tutMotionItem}>
                            <div style={styles.tutMotionTitle}>{lang === "zh" ? item.nameZh : item.nameEn}</div>
                            <div style={styles.tutMotionText}>{lang === "zh" ? item.effectZh : item.effectEn}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={styles.tutSectionBlock}>
                      <div style={styles.tutSectionTitle}>{lang === "zh" ? "图片经典模式" : "Image Classic Modes"}</div>
                      <div style={styles.tutMotionGrid}>
                        {getImageClassicModes().map((item) => (
                          <div key={item.id} style={styles.tutMotionItem}>
                            <div style={styles.tutMotionTitle}>{lang === "zh" ? item.nameZh : item.nameEn}</div>
                            <div style={styles.tutMotionText}>{lang === "zh" ? item.effectZh : item.effectEn}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {helpCenterSection === "pro_motion_advanced" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "进阶专业教程：PRO+ 与专业图片" : "Advanced Tutorial: PRO+ and Professional Image"}</div>
                    {advancedCreativeTutorialBlocks(lang).map((block) => (
                      <div key={block.title} style={styles.tutSectionBlock}>
                        <div style={styles.tutSectionTitle}>{block.title}</div>
                        <div style={styles.tutText}>{block.body}</div>
                      </div>
                    ))}
                    {PRO_PLUS_MOTION_CATEGORIES.map((category) => {
                      const items = getVisibleVideoProPlusPresets(category.id as any);
                      return (
                        <div key={category.id} style={styles.tutSectionBlock}>
                          <div style={styles.tutSectionTitle}>{lang === "zh" ? category.labelZh : category.labelEn}</div>
                          <div style={styles.tutMotionGrid}>
                            {items.map((item) => (
                              <div key={item.id} style={styles.tutMotionItem}>
                                <div style={styles.tutMotionTitle}>{lang === "zh" ? item.labelZh : item.labelEn}</div>
                                <div style={styles.tutMotionText}>{lang === "zh" ? item.descZh : item.descEn}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {IMAGE_PRO_CATEGORIES.map((category) => {
                      const items = getImageProEffectsByCategory(category.id);
                      return (
                        <div key={category.id} style={styles.tutSectionBlock}>
                          <div style={styles.tutSectionTitle}>{lang === "zh" ? category.labelZh : category.labelEn}</div>
                          <div style={styles.tutMotionGrid}>
                            {items.map((item) => (
                              <div key={item.id} style={styles.tutMotionItem}>
                                <div style={styles.tutMotionTitle}>{lang === "zh" ? item.labelZh : item.labelEn}</div>
                                <div style={styles.tutMotionText}>{lang === "zh" ? item.descZh : item.descEn}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}

                {helpCenterSection === "export" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "导出说明" : "Export Guide"}</div>
                    <div style={styles.tutText}>
                      {lang === "zh"
                        ? "Quick Export（快速导出）：适合快速把当前提示词送到大模型平台，先测试初步效果与方向是否正确；重点验证方向是否对、构图是否对、主体关系是否对。\nPackage Export（交付包导出）：适合正式交付，包含提示词、参考图、说明文件等完整内容；适用于交接、存档和稳定复用。\nCurrent Scene（当前分镜）：只导出当前分镜，适合单镜验证。\nContinuity Sequence（连续序列）：导出当前镜头及后续连续镜头，适合验证镜头衔接和连续性。\nTarget Model（目标模型）：会影响输出文案和结构更偏向哪个模型；不同模型理解方式不同，结果可能存在差异。"
                        : "Quick Export: best when you need to send the current prompt to a model platform quickly and test whether the initial direction is correct. Use it to validate direction, composition, and subject relationships first.\nPackage Export: best for formal delivery. It includes prompt, references, and instruction files as a complete bundle for handoff, archiving, and stable reuse.\nCurrent Scene: exports only the current shot, ideal for single-shot validation.\nContinuity Sequence: exports the current shot plus following continuous shots, ideal for checking transition quality and sequence continuity.\nTarget Model: changes wording and structure bias toward a selected model profile. Different models may produce different results even with the same project."}
                    </div>
                  </>
                ) : null}

                {helpCenterSection === "troubleshoot" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "排错顺序" : "Troubleshooting Order"}</div>
                    <div style={styles.tutText}>
                      {lang === "zh"
                        ? "1) 先看冲突。\n2) 再看对象数量/位置。\n3) 最后调风格和光照词。"
                        : "1) Check conflicts first.\n2) Verify object count and layout.\n3) Tune style and lighting words last."}
                    </div>
                  </>
                ) : null}

                {helpCenterSection === "feedback" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "反馈" : "Feedback"}</div>
                    <div style={styles.modalText}>
                      {lang === "zh"
                        ? "你可以直接发送反馈，也可以复制模板提交。"
                        : "You can send feedback directly, or copy the template."}
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
                ) : null}

                {helpCenterSection === "about" ? (
                  <>
                    <div style={styles.tutBlockTitle}>{lang === "zh" ? "关于" : "About"}</div>
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
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>,
        document.body
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
    color: UI_PALETTE.text.primary,
    background:
      "linear-gradient(180deg, rgba(5,8,14,0.96) 0%, rgba(8,12,20,0.98) 34%, #080b12 100%)",
    overflow: "hidden",
    position: "relative",
    isolation: "isolate"
  },
  appQuick: {
    background: "linear-gradient(180deg, #050505 0%, #000000 100%)"
  },
  appPro: {
    background: "linear-gradient(180deg, #0a0a0a 0%, #000000 100%)"
  },
  appBackdrop: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 0
  },
  appGlowLeft: {
    position: "absolute",
    width: 720,
    height: 720,
    left: -180,
    top: -220,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 34%, rgba(255,255,255,0) 72%)",
    filter: "blur(26px)"
  },
  appGlowRight: {
    position: "absolute",
    width: 640,
    height: 640,
    right: -160,
    top: 48,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0) 72%)",
    filter: "blur(28px)"
  },
  appGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.22,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.12) 36%, transparent 72%)"
  },
  top: {
    height: 56,
    display: "flex",
    alignItems: "center",
    gap: UI_SPACE.xs,
    padding: `0 ${UI_SPACE.sm}px`,
    borderBottom: `1px solid ${UI_PALETTE.border.soft}`,
    background: "linear-gradient(180deg, rgba(14,14,14,0.84) 0%, rgba(6,6,6,0.8) 100%)",
    backdropFilter: "blur(14px)",
    position: "relative",
    zIndex: 30
  },
  topProjectDock: {
    position: "absolute",
    left: "calc(12px + clamp(232px, 24vw, 320px))",
    top: 13,
    zIndex: 31
  },
  topModeSwitch: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: 4,
    borderRadius: 14,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "rgba(255,255,255,0.03)",
    marginLeft: 10
  },
  topModeBtn: {
    minHeight: 32,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    color: UI_PALETTE.text.secondary,
    cursor: "pointer",
    fontSize: UI_TYPO.size12,
    fontWeight: 900
  },
  topModeBtnOn: {
    border: `1px solid ${UI_COMMAND.border.accent}`,
    background: UI_COMMAND.surface.accent,
    color: UI_PALETTE.text.primary,
    boxShadow: UI_COMMAND.shadow.soft
  },
  commandDock: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  topSpeedBadge: {
    minHeight: 34,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 11,
    border: `1px solid ${UI_PALETTE.border.active}`,
    background: UI_PALETTE.surface.surfaceActive,
    color: UI_PALETTE.text.primary,
    fontSize: UI_TYPO.size12,
    fontWeight: 900,
    whiteSpace: "nowrap"
  },
  brand: { display: "flex", alignItems: "center", paddingRight: 8 },
  logoRow: { display: "flex", alignItems: "baseline", gap: 8, lineHeight: 1 },
  logoEn: { fontWeight: 850, fontSize: UI_TYPO.size16, letterSpacing: 0.18, color: UI_PALETTE.text.primary },
  logoZh: { fontWeight: 820, fontSize: UI_TYPO.size16, opacity: 0.74, color: UI_PALETTE.text.secondary },
  topBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 11,
    border: `1px solid ${UI_COMMAND.border.default}`,
    background: UI_COMMAND.surface.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_TYPO.size12,
    outline: "none",
    boxShadow: UI_COMMAND.shadow.soft,
    minWidth: 0,
    whiteSpace: "nowrap",
    flexShrink: 0,
    backdropFilter: "blur(14px)",
    WebkitTapHighlightColor: "transparent" as any,
    ["--spx-btn-bg-hover" as any]: UI_COMMAND.surface.hover,
    ["--spx-btn-bg-active" as any]: UI_COMMAND.surface.active,
    ["--spx-btn-border-hover" as any]: UI_COMMAND.border.hover,
    ["--spx-btn-border-active" as any]: UI_COMMAND.border.active,
    ["--spx-btn-shadow" as any]: UI_COMMAND.shadow.soft,
    ["--spx-btn-shadow-hover" as any]: UI_COMMAND.shadow.hover,
    ["--spx-btn-shadow-active" as any]: UI_COMMAND.shadow.active
  },
  topIconBtn: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    border: `1px solid ${UI_COMMAND.border.default}`,
    background: UI_COMMAND.surface.default,
    color: "inherit",
    cursor: "pointer",
    outline: "none",
    boxShadow: UI_COMMAND.shadow.soft,
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent" as any,
    ["--spx-btn-bg-hover" as any]: UI_COMMAND.surface.hover,
    ["--spx-btn-bg-active" as any]: UI_COMMAND.surface.active,
    ["--spx-btn-border-hover" as any]: UI_COMMAND.border.hover,
    ["--spx-btn-border-active" as any]: UI_COMMAND.border.active,
    ["--spx-btn-shadow" as any]: UI_COMMAND.shadow.soft,
    ["--spx-btn-shadow-hover" as any]: UI_COMMAND.shadow.hover,
    ["--spx-btn-shadow-active" as any]: UI_COMMAND.shadow.active
  },
  topBtnText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 118
  },

  main: {
    flex: 1,
    display: "flex",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    position: "relative",
    zIndex: 1
  },
  resultsMain: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    position: "relative",
    zIndex: 1
  },
  mainDesktop: {
    display: "grid",
    gridTemplateColumns: "clamp(232px, 24vw, 320px) minmax(0, 1fr) clamp(240px, 26vw, 344px)"
  },

  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0
  },
  workspaceHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "0 12px 12px"
  },
  stageShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex"
  },

  // ---- dropdown menu ----
  menuMask: {
    position: "fixed",
    inset: 0,
    zIndex: 9998
  },
  helpMenu: {
    position: "absolute",
    top: 62,
    right: 12,
    zIndex: 9999,
    width: `min(${UI_MENU.width}px, calc(100vw - 24px))`,
    display: "grid",
    gap: 2,
    padding: UI_MENU.panel.padding,
    borderRadius: UI_MENU.panel.radius,
    border: `1px solid ${UI_MENU.panel.border}`,
    background: UI_MENU.panel.surface,
    boxShadow: UI_MENU.panel.shadow,
    overflow: "hidden",
    backdropFilter: "blur(20px)"
  },
  helpMenuItem: {
    width: "100%",
    minHeight: UI_MENU.item.minHeight,
    padding: `0 ${UI_MENU.item.padX}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: UI_MENU.item.radius,
    border: "1px solid transparent",
    background: "transparent",
    color: UI_PALETTE.text.primary,
    fontSize: UI_MENU.item.fontSize,
    fontWeight: 760,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "none",
    ["--spx-btn-bg-hover" as any]: UI_MENU.item.hover,
    ["--spx-btn-bg-active" as any]: UI_MENU.item.active,
    ["--spx-btn-border-hover" as any]: UI_COMMAND.border.hover,
    ["--spx-btn-border-active" as any]: UI_COMMAND.border.active,
    ["--spx-btn-shadow" as any]: "none",
    ["--spx-btn-shadow-hover" as any]: "none",
    ["--spx-btn-shadow-active" as any]: "none"
  },
  helpMenuItemLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: UI_MENU.item.gap,
    minWidth: 0
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
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: `${UI_PANEL.rightGlow}, rgba(12,17,27,0.96)`,
    boxShadow: UI_EFFECT.floatShadow,
    padding: 14,
    backdropFilter: "blur(18px)"
  },
  modalIconBtn: {
    height: 30,
    width: 30,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2,
    color: "inherit",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  libraryModal: {
    width: 720,
    maxWidth: "100%",
    maxHeight: "min(80vh, 760px)",
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: `${UI_PANEL.leftGlow}, rgba(12,17,27,0.96)`,
    boxShadow: UI_EFFECT.floatShadow,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backdropFilter: "blur(18px)"
  },
  modalTitle: { fontWeight: 900, fontSize: UI_TYPO.size14, opacity: 0.96 },
  modalText: {
    marginTop: 8,
    fontSize: UI_TYPO.size12,
    lineHeight: 1.6,
    color: UI_PALETTE.text.primary,
    opacity: 0.96
  },
  helpCenterHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  helpCenterBody: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "180px minmax(0,1fr)",
    gap: 10,
    minHeight: 0,
    overflow: "hidden"
  },
  helpCenterNav: {
    display: "grid",
    gap: 6,
    alignContent: "start",
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 4
  },
  helpCenterNavBtn: {
    textAlign: "left",
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2,
    color: UI_PALETTE.text.primary,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer"
  },
  helpCenterNavBtnOn: {
    border: `1px solid ${UI_PALETTE.border.active}`,
    background: UI_PALETTE.surface.surfaceActive
  },
  helpCenterPanel: {
    minHeight: 280,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    borderRadius: UI_RADIUS.control,
    background: UI_PALETTE.surface.surface1,
    padding: "10px 12px",
    overflow: "auto"
  },
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
    gridTemplateColumns: "minmax(88px,120px) minmax(0,1fr)",
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
    border: `1px solid ${UI_PALETTE.border.soft}`,
    borderRadius: UI_RADIUS.control,
    padding: "6px 8px"
  },
  libraryActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  libraryHint: {
    fontSize: 12,
    border: `1px solid ${UI_PALETTE.border.active}`,
    borderRadius: UI_RADIUS.control,
    padding: "6px 8px",
    background: UI_PALETTE.surface.surfaceActive,
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
    border: `1px solid ${UI_PALETTE.border.active}`,
    borderRadius: UI_RADIUS.control,
    padding: "8px 10px",
    background: "rgba(20,28,46,0.96)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  libraryList: {
    minHeight: 180,
    maxHeight: "min(50vh, 420px)",
    overflow: "auto",
    border: `1px solid ${UI_PALETTE.border.soft}`,
    borderRadius: UI_RADIUS.control,
    background: UI_PALETTE.surface.surface1,
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
    border: `1px solid ${UI_PALETTE.border.soft}`,
    borderRadius: UI_RADIUS.control,
    padding: "8px 10px",
    background: UI_PALETTE.surface.surface1
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
  rememberRow: {
    marginRight: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    opacity: 0.86
  },

  modalBtn: {
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_ACTION.border.default}`,
    background: UI_ACTION.surface.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: UI_EFFECT.insetShadow,
    ["--spx-btn-bg-hover" as any]: UI_ACTION.surface.hover,
    ["--spx-btn-bg-active" as any]: UI_ACTION.surface.active,
    ["--spx-btn-border-hover" as any]: UI_ACTION.border.hover,
    ["--spx-btn-border-active" as any]: UI_ACTION.border.active,
    ["--spx-btn-shadow-hover" as any]: UI_ACTION.shadow.hover
  },
  modalBtnGhost: {
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2,
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnDanger: {
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.danger}`,
    background: "rgba(255,124,124,0.14)",
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
  tutorialTopActions: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  modalLangBtn: {
    height: 32,
    minWidth: 56,
    padding: "0 12px",
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2,
    color: UI_PALETTE.text.primary,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800
  },
  tutorialPill: {
    padding: "5px 8px",
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_PALETTE.border.active}`,
    background: UI_PALETTE.surface.surfaceActive,
    color: "inherit",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 900
  },
  tutorialPageTag: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.96,
    color: UI_PALETTE.text.primary,
    padding: "5px 8px",
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2
  },
  tutBlockTitle: {
    marginTop: 10,
    fontWeight: 900,
    opacity: 0.98,
    color: UI_PALETTE.text.primary
  },
  tutText: {
    marginTop: 6,
    opacity: 0.96,
    color: UI_PALETTE.text.primary,
    lineHeight: 1.65,
    whiteSpace: "pre-line"
  },
  tutSectionBlock: {
    marginTop: 12,
    display: "grid",
    gap: 6
  },
  tutSectionTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: UI_PALETTE.text.primary
  },
  tutMotionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 8
  },
  tutMotionItem: {
    borderRadius: 12,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "rgba(255,255,255,0.04)",
    padding: 10,
    display: "grid",
    gap: 4
  },
  tutMotionTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: UI_PALETTE.text.primary
  },
  tutMotionText: {
    fontSize: 11,
    lineHeight: 1.55,
    color: UI_PALETTE.text.secondary
  },

  // ---- feedback ----
  feedbackTpl: {
    marginTop: 10,
    padding: 10,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.soft}`,
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
