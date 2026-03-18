import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Lang } from "./i18n";
import { defaultProject, resolveSceneConfig, sanitizeProject } from "./model";
import type { Project, Scene, ShotPlan, TransitionType } from "./model";
import { loadLang, saveLang, loadProject, saveProject } from "./utils/storage";

import { Sidebar } from "./components/Sidebar";
import { Stage } from "./components/Stage";
import { PropsPanel } from "./components/PropsPanel";
import { ExportPanel } from "./components/ExportPanel";
import { ProjectControlBar } from "./components/ProjectControlBar";
import type {
  ResultConsoleMode,
  ResultGenerationPrefs,
  ResultPlan,
  ResultPreview,
  ResultStructureState
} from "./types/resultConsole";
import {
  CreateWizard,
  type CreateStep,
  type WizardDraft
} from "./components/CreateWizard";
import { buildPromptForScene } from "./utils/promptEngine";
import { getRefBlob, putRefBlob } from "./utils/localRefs";
import { defaultObjectName, defaultProjectName, defaultSceneName, safeExportName } from "./utils/naming";
import { getPlatformLabel, getPlatformPreset, PLATFORM_PRESETS } from "./config/platformPresets";
import type { PlatformPresetId } from "./config/platformPresets";
import type { IntentPlan } from "./types/intentPlan";
import { briefToIntentPlan } from "./utils/briefParser";
import { deriveRefineStrategy } from "./utils/refineStrategy";
import { applyFeedbackToStructure } from "./utils/feedbackToStructure";
import { intentPlanToProProject } from "./utils/intentPlanToProject";
import {
  getComfyUiBaseUrls as defaultComfyUiBaseUrls,
  getDrawThingsBaseUrls as defaultDrawThingsBaseUrls,
  aspectRatioToResolution,
  loadLocalProviderConfig,
  saveLocalProviderConfig,
} from "./utils/localProviderConfig";
import {
  buildDrawThingsQueuePack,
  downloadTextFile,
  probeComfyUi,
  probeDrawThings,
  runComfyUiImage,
  runComfyUiVideoPreview,
  runDrawThingsTxt2Img,
  type DrawThingsQueuePack,
  type LocalProviderStatus
} from "./utils/localGeneration";

import { ChevronDown, ChevronRight, CircleHelp, FolderOpen, Image as ImageIcon, Languages, Layout, MoreHorizontal } from "lucide-react";
import { CreditCard, Crown, Cpu, KeyRound, LogOut, UserRound, Wallet } from "lucide-react";
import { AccountCenterModal } from "./components/AccountCenterModal";
import { BillingOverlay } from "./components/billing/BillingOverlay";
import type { AccountCenterSection, ApiCredentialState, UserState } from "./types/account";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "./types/billing";
import {
  getCurrentUser,
  isGoogleSignInEnabled,
  logout,
  sendCode,
  signInWithPassword,
  signInWithGoogle,
  verifyCode
} from "./services/authService";
import { PRICING_FINAL_CREDIT_PACKS, creditCostFor, creditCostForProfile, GENERATION_PROFILE_LABELS, getBillingSnapshot, launchCheckout, openCustomerPortal, PRO_PLAN, type GenerationProfileId } from "./services/billingService";
import { finalizeReservedCredits, getCreditLedger, getWalletState, reserveCredits, rollbackReservedCredits } from "./services/creditService";
import { recordLegalConsent, syncPendingLegalConsents } from "./services/legalConsentService";
import { getApiCredentials, setApiCredentials } from "./services/mockAccountStore";
import { createTemplateFromScene, saveUserTemplate } from "./lib/templateStore";
import {
  TemplateWorkspace,
  type TemplateWorkspaceState,
  DEFAULT_TEMPLATE_WORKSPACE_STATE,
  getTemplateMetadataFromIndex,
  getTemplateIndex,
  type TemplateIndex
} from "./features/template-workspace";
import { applyTemplateCharge } from "./features/billing";
import { getTemplatePricingForTemplate } from "./pricing";
import { createProjectFromTemplate, createProjectFromUserTemplate, duplicateProject } from "./lib/projectCreation";
import { isTemplateOwned, markTemplateOwned } from "./lib/ownedTemplatesStore";
import { saveCurrentProjectAsTemplate } from "./lib/userTemplatesStore";
import type { UserPrivateTemplate } from "./lib/userTemplatesStore";
import { isUserPrivateTemplate } from "./features/template-workspace/components/TemplateCard";
import { FeedbackBar, OutputConsole, ProWorkspaceShell, PromptMiniPreview, type FeedbackBarApi } from "./features/pro-workspace";
import { addToRecent, type TemplateWorkspaceItem, type ApplyTemplateMode } from "./data/templateWorkspaceData";
import type { ExportMode } from "./utils/exportViewModel";
import type { PromptExportScope } from "./types/export";
import { detectSceneConflicts } from "./utils/conflictRules";
import { canOpenCustomerPortal, canUseBringYourOwnApi, canUseHostedGeneration, canUseProConsole, canUseUnlimitedTemplates } from "./utils/entitlement";
import {
  loadGenerationPreferences,
  saveGenerationPreferences,
  currentProfileForMedia,
  type StoredGenerationPrefs,
  type GenerationProfile,
} from "./features/pro-workspace/utils/generationPreferences";
import { HelpModal, DEFAULT_HELP_SECTION, type HelpSectionId } from "./features/help-center";
import type { PromptExportAction, PromptExportTicket } from "./types/promptExport";
import { PUBLIC_CONTACT_CHANNELS, SYSTEM_NOTIFICATION_MAILBOX } from "./config/contactChannels";
import { BILLING_ENABLED, BILLING_LIVE_BLOCKED } from "./config/billingFlags";

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
type LibraryEntry = { name: string; kind: "file" | "directory"; label: string };
type SavePlatformId = PlatformPresetId;
type SavePlatformPickMode = "save" | "save_as" | "save_all";
type ExportPanelOpenAction = "open" | "copy" | "package" | "prompt_txt" | "prompt_plus_refs";
type TestBridge = {
  skipHandlePersistence?: boolean;
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite"; id?: string }) => Promise<any>;
};
const LOCAL_TEST_IMAGE_PROVIDER: "comfyui" | "drawthings" = "comfyui";
type LocalTestImageProvider = "comfyui" | "drawthings";
const LIB_DB_NAME = "scenepilot_library_handles";
const LIB_DB_STORE = "handles";
const LIB_DB_VER = 1;
const LIB_ROOT_KEY = "root";
const LIB_INIT_KEY = "spx_library_initialized";
const AUTH_LEGAL_CONSENT_KEY = "sp_auth_legal_consent_v1";
const AUTH_EMAIL_DRAFT_KEY = "sp_auth_email_draft_v1";
const BILLING_LEGAL_CONSENT_KEY = "sp_billing_legal_consent_v1";
const PROJECT_SAVE_PLATFORM_LOCK_KEY = "sp_project_save_platform_locked";
const GUEST_AVATAR_COLOR_KEY = "sp_guest_avatar_color_v1";
type SerializedLibraryRefAsset = {
  id: string;
  name: string;
  mime: string;
  size: number;
  updatedAt: number;
  dataUrl: string;
};
type SerializedLibraryProject = {
  version: 2;
  project: Project["project"];
  scenes: Scene[];
  assets?: {
    refs: SerializedLibraryRefAsset[];
  };
};

type ProGenerationSource = "hosted" | "byo";

type ProGeneratedAsset = {
  id: string;
  sceneId: string;
  kind: "image" | "video";
  title: string;
  prompt: string;
  source: ProGenerationSource;
  strategyPlatformId: SavePlatformId;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  ownedUrls: string[];
  createdAt: string;
};

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

const ONBOARDING_KEY = "sp_onboarding_done";
const SAVE_PLATFORM_KEY = "sp_save_prompt_platform";
const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";
const SIGNIN_QUERY_KEY = "signin";
const REDIRECT_QUERY_KEY = "redirect";
const AUTH_POST_LOGIN_REDIRECT_KEY = "sp_auth_post_login_redirect_v1";

function normalizePostAuthRedirect(input: string | null | undefined): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (typeof window === "undefined") return "";
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return "";
    const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!target.startsWith("/")) return "";
    if (target === "/app" || target.startsWith("/app?")) return "";
    return target;
  } catch {
    return "";
  }
}

function savePostAuthRedirect(pathname: string) {
  try {
    if (!pathname) return;
    window.sessionStorage.setItem(AUTH_POST_LOGIN_REDIRECT_KEY, pathname);
  } catch {
    // ignore storage failures
  }
}

function readPostAuthRedirect() {
  try {
    return window.sessionStorage.getItem(AUTH_POST_LOGIN_REDIRECT_KEY) || "";
  } catch {
    return "";
  }
}

function consumePostAuthRedirect() {
  const next = readPostAuthRedirect();
  try {
    window.sessionStorage.removeItem(AUTH_POST_LOGIN_REDIRECT_KEY);
  } catch {
    // ignore storage failures
  }
  return next;
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

const LOGIN_AVATAR_GRADIENT = "linear-gradient(145deg, rgba(108,168,245,0.82), rgba(84,203,169,0.78))";

const AVATAR_COLOR_PALETTE = [
  "#4F46E5",
  "#0EA5E9",
  "#06B6D4",
  "#10B981",
  "#84CC16",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899"
] as const;

function hashStringToInt(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickAvatarColor(seed: string): string {
  const idx = hashStringToInt(seed) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[idx] ?? AVATAR_COLOR_PALETTE[0];
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
  const workspaceMode: ResultConsoleMode = "pro";
  const [sceneIdx, setSceneIdx] = useState<number>(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editT, setEditT] = useState<0 | 1>(0);
  const [resultBrief, setResultBrief] = useState("");
  const [resultSecondaryBrief, setResultSecondaryBrief] = useState("");
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
  const [authEmail, setAuthEmail] = useState(() => {
    try { return localStorage.getItem(AUTH_EMAIL_DRAFT_KEY) || ""; } catch { return ""; }
  });
  const [authPassword, setAuthPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [postAuthRedirect, setPostAuthRedirect] = useState("");
  const [lastSentCode, setLastSentCode] = useState("");
  const activeWorkspaceMode: ResultConsoleMode = "pro";
  const [authLegalAccepted, setAuthLegalAccepted] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTH_LEGAL_CONSENT_KEY) === "1"; } catch { return false; }
  });
  const [billingLegalAccepted, setBillingLegalAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BILLING_LEGAL_CONSENT_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [creditPacks] = useState<CreditPackConfig[]>(PRICING_FINAL_CREDIT_PACKS);
  const [proPlan] = useState<ProPlanConfig | null>(PRO_PLAN);
  const [billingPage, setBillingPage] = useState<"upgrade" | "credits" | null>(null);
  const [templatesRefresh, setTemplatesRefresh] = useState(0);
  const [billingLocalHint, setBillingLocalHint] = useState("");
  const [resultToast, setResultToast] = useState<string | null>(null);
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false);
  const [insufficientCreditsMessage, setInsufficientCreditsMessage] = useState("");
  const [templateCreditsInsufficientOpen, setTemplateCreditsInsufficientOpen] = useState(false);
  const [templateCreditsNeeded, setTemplateCreditsNeeded] = useState(0);
  const [templateCreditsHave, setTemplateCreditsHave] = useState(0);
  const [templateCreditsName, setTemplateCreditsName] = useState("");
  const [resultPrefs, setResultPrefs] = useState<ResultGenerationPrefs>({
    mediaType: "image",
    ratio: "16:9",
    durationSec: 6,
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
  const [proGenPrefs, setProGenPrefs] = useState<StoredGenerationPrefs>(() => loadGenerationPreferences(null));
  const [proGenerationSource, setProGenerationSource] = useState<ProGenerationSource>("hosted");
  const [proGenerateBusy, setProGenerateBusy] = useState(false);
  const [proGenerateHint, setProGenerateHint] = useState("");
  const [proAdvancedSettingsOpen, setProAdvancedSettingsOpen] = useState(false);
  const [proProfileDropdownOpen, setProProfileDropdownOpen] = useState(false);
  const proProfileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [proAssetsBySceneId, setProAssetsBySceneId] = useState<Record<string, ProGeneratedAsset[]>>({});
  const [proActiveAssetBySceneId, setProActiveAssetBySceneId] = useState<Record<string, string>>({});
  const [proAssetMenuId, setProAssetMenuId] = useState<string | null>(null);

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

  // ✅ Help Center (Stage 1: new 14-section structure, see features/help-center)
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [helpCenterSection, setHelpCenterSection] = useState<HelpSectionId>(DEFAULT_HELP_SECTION);
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
  const [projectSavePlatformLocked, setProjectSavePlatformLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROJECT_SAVE_PLATFORM_LOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [renameProjectDraft, setRenameProjectDraft] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isTemplateWorkspaceOpen, setIsTemplateWorkspaceOpen] = useState(false);
  const [templateWorkspaceState, setTemplateWorkspaceState] = useState<TemplateWorkspaceState>(
    DEFAULT_TEMPLATE_WORKSPACE_STATE
  );
  const [openExportNonce, setOpenExportNonce] = useState(0);
  const [openExportAction, setOpenExportAction] = useState<ExportPanelOpenAction>("open");
  const [miniPreviewCollapsed, setMiniPreviewCollapsed] = useState(true);
  const [proExportMode, setProExportMode] = useState<ExportMode>("prompt_only");
  const [proExportScope, setProExportScope] = useState<PromptExportScope>("current_scene");
  const [workspaceSwitchShield, setWorkspaceSwitchShield] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const savePlatformResolverRef = useRef<((id: SavePlatformId | null) => void) | null>(null);
  const feedbackBarRef = useRef<FeedbackBarApi | null>(null);
  const proAssetsRef = useRef<Record<string, ProGeneratedAsset[]>>({});
  const shortcutActionsRef = useRef<{
    openProject: () => void;
    newProject: () => void;
    save: () => void;
    saveAs: () => void;
    copyPrompt: () => void;
    exportProject: () => void;
  }>({
    openProject: () => undefined,
    newProject: () => undefined,
    save: () => undefined,
    saveAs: () => undefined,
    copyPrompt: () => undefined,
    exportProject: () => undefined
  });


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const useDesktopFixedLayout = viewportWidth >= 1400;
  const showBrandZh = viewportWidth >= 980;
  const isMac = useMemo(() => isApplePlatform(), []);
  const googleSignInEnabled = useMemo(() => isGoogleSignInEnabled(), []);
  const accountAvatarColor = useMemo(() => {
    if (accountUser?.id) {
      return pickAvatarColor(`${accountUser.id}:${accountUser.email}`);
    }
    try {
      const cached = localStorage.getItem(GUEST_AVATAR_COLOR_KEY);
      if (cached) return cached;
      const randomSeed = `${Date.now()}-${Math.random()}`;
      const color = pickAvatarColor(randomSeed);
      localStorage.setItem(GUEST_AVATAR_COLOR_KEY, color);
      return color;
    } catch {
      return AVATAR_COLOR_PALETTE[0];
    }
  }, [accountUser]);
  const accountEntryLabel = accountUser
    ? (lang === "zh" ? "账户" : "Account")
    : (lang === "zh" ? "登录 / 注册" : "Sign In / Sign Up");

  function syncSavePlatform(id: SavePlatformId) {
    setSavePlatformId(id);
    try {
      localStorage.setItem(SAVE_PLATFORM_KEY, id);
    } catch {
      // ignore
    }
  }

  function setProjectSavePlatformLockedPersist(next: boolean) {
    setProjectSavePlatformLocked(next);
    try {
      localStorage.setItem(PROJECT_SAVE_PLATFORM_LOCK_KEY, next ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }

  function openExportPanel(action: ExportPanelOpenAction) {
    setOpenExportAction(action);
    setOpenExportNonce((v) => v + 1);
  }

  /** Unified handlers for Prompt/Export convergence. All copy/export flows go through ExportPanel pipeline. */
  function handleCopyPrompt() {
    openExportPanel("copy");
  }
  function handleExportTxt() {
    openExportPanel("prompt_txt");
  }
  function handleExportZip() {
    openExportPanel("prompt_plus_refs");
  }
  function handleExportProject() {
    openExportPanel("open");
  }

  function handleProExportModeChange(mode: ExportMode) {
    setProExportMode(mode);
    updateProject({
      ...project,
      meta: { ...project.meta, proExportMode: mode }
    });
  }

  function enterProWorkspace() {
    if (!canUseProConsole(accountUser)) {
      openAccountCenter("pro");
      return false;
    }
    setWorkspaceSwitchShield(true);
    window.setTimeout(() => setWorkspaceSwitchShield(false), 180);
    return true;
  }

  useEffect(() => {
    if (!accountMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountMenuOpen]);

  useEffect(() => {
    const mode = project?.meta?.proExportMode === "package" ? "package" : "prompt_only";
    setProExportMode(mode);
  }, [project?.meta?.proExportMode]);
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
  const sceneAssetKey = scene.id || `scene_${sceneNo}`;
  /** Prompt for Mini Preview only; reuses buildPromptForScene, no extra engine. */
  const promptForMiniPreview = useMemo(() => {
    try {
      const preset = getPlatformPreset(savePlatformId);
      const out = buildPromptForScene({
        project: safeProject,
        scene,
        lang,
        platformId: savePlatformId,
        profile: preset?.baseProfile,
        workspace: "pro",
      });
      return out?.finalCopyPrompt?.trim() ?? "";
    } catch {
      return "";
    }
  }, [safeProject, scene, lang, savePlatformId]);
  const sceneConflicts = useMemo(
    () => detectSceneConflicts(scene, lang, safeProject),
    [scene, lang, safeProject]
  );
  const feedbackBarPlatformLabel = useMemo(
    () => (lang === "zh" ? getPlatformPreset(savePlatformId).labelZh : getPlatformPreset(savePlatformId).labelEn),
    [savePlatformId, lang]
  );
  const feedbackBarScopeLabel = useMemo(
    () => (proExportScope === "continuous_sequence" ? (lang === "zh" ? "连续序列" : "Continuity Sequence") : lang === "zh" ? "当前分镜" : "Current Scene"),
    [proExportScope, lang]
  );
  const currentLibrarySnapshot = useMemo(() => JSON.stringify({ project: safeProject, fileLabel: fileLabel || "" }), [safeProject, fileLabel]);
  const [lastLibrarySavedSnapshot, setLastLibrarySavedSnapshot] = useState<string>("");
  const hasUnsavedLibraryChanges = currentLibrarySnapshot !== lastLibrarySavedSnapshot;

  // ---------------------- mediaMode + editT lock (minimal) ----------------------
  const mediaMode = useMemo<"image" | "video">(() => resolveSceneConfig(scene).mediaMode, [scene]);
  const currentSceneAssets = useMemo(() => proAssetsBySceneId[sceneAssetKey] ?? [], [proAssetsBySceneId, sceneAssetKey]);
  const currentSceneActiveAssetId = proActiveAssetBySceneId[sceneAssetKey] ?? "canvas";
  const currentSceneActiveAsset = useMemo(
    () => currentSceneAssets.find((item) => item.id === currentSceneActiveAssetId) ?? null,
    [currentSceneAssets, currentSceneActiveAssetId]
  );

  // image 模式强制只用 t0
  const effectiveEditT: 0 | 1 = mediaMode === "image" ? 0 : editT;

  // 当切到 image 时，把状态 editT 拉回 0（避免 UI 残留在 1）
  useEffect(() => {
    if (mediaMode === "image" && editT !== 0) setEditT(0);
  }, [mediaMode, editT]);

  // Load and persist generation preferences (last profile + provider mode)
  useEffect(() => {
    const userId = accountUser?.id ?? null;
    const prefs = loadGenerationPreferences(userId);
    setProGenPrefs(prefs);
    setProGenerationSource(prefs.lastProviderMode);
  }, [accountUser?.id]);

  const setProGenerationSourceAndPersist = (source: ProGenerationSource) => {
    setProGenerationSource(source);
    saveGenerationPreferences(accountUser?.id ?? null, { lastProviderMode: source });
    setProGenPrefs((prev) => ({ ...prev, lastProviderMode: source }));
  };

  const currentGenProfile = currentProfileForMedia(proGenPrefs, mediaMode) as GenerationProfileId;
  const videoSeconds = Math.max(1, Math.ceil(Number(scene?.duration_s) || 5));
  const hostedCostPreview = creditCostForProfile(currentGenProfile, mediaMode === "video" ? videoSeconds : 1);

  const setGenerationProfile = (profile: GenerationProfile) => {
    if (profile === "image_standard" || profile === "image_hq") {
      saveGenerationPreferences(accountUser?.id ?? null, { lastImageProfile: profile });
      setProGenPrefs((prev) => ({ ...prev, lastImageProfile: profile }));
    } else {
      saveGenerationPreferences(accountUser?.id ?? null, { lastVideoProfile: profile });
      setProGenPrefs((prev) => ({ ...prev, lastVideoProfile: profile }));
    }
    setProProfileDropdownOpen(false);
  };

  useEffect(() => {
    if (!proProfileDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (proProfileDropdownRef.current && !proProfileDropdownRef.current.contains(e.target as Node)) {
        setProProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [proProfileDropdownOpen]);

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
        return;
      }
      if (key === "c" && e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.copyPrompt();
        return;
      }
      if (key === "e" && !e.shiftKey) {
        e.preventDefault();
        shortcutActionsRef.current.exportProject();
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
    const handler = () => {
      openAccountCenter("auth");
    };
    window.addEventListener("sp:session_expired", handler);
    return () => window.removeEventListener("sp:session_expired", handler);
  }, []);

  const refreshLocalProviders = useCallback(async () => {
    setComfyStatus({ provider: "comfyui", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
    setDrawThingsStatus({ provider: "drawthings", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
    const [nextComfy, nextDraw] = await Promise.all([
      probeComfyUi(defaultComfyUiBaseUrls()),
      probeDrawThings(defaultDrawThingsBaseUrls())
    ]);
    setComfyStatus(nextComfy);
    setDrawThingsStatus(nextDraw);
    return { nextComfy, nextDraw };
  }, [lang]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await refreshLocalProviders();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [refreshLocalProviders]);

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

  useEffect(() => {
    if (!proGenerateHint) return;
    const timer = window.setTimeout(() => setProGenerateHint(""), 1800);
    return () => window.clearTimeout(timer);
  }, [proGenerateHint]);

  useEffect(() => {
    if (!resultToast) return;
    const timer = window.setTimeout(() => setResultToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [resultToast]);

  useEffect(() => {
    if (!proAssetMenuId) return;
    const onPointerDown = () => setProAssetMenuId(null);
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [proAssetMenuId]);

  useEffect(() => {
    proAssetsRef.current = proAssetsBySceneId;
  }, [proAssetsBySceneId]);

  useEffect(() => {
    return () => {
      for (const assets of Object.values(proAssetsRef.current)) {
        for (const asset of assets) {
          for (const url of asset.ownedUrls) {
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          }
        }
      }
    };
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

  function makeProAssetId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function revokeAssetUrls(asset: ProGeneratedAsset | null | undefined) {
    if (!asset) return;
    for (const url of asset.ownedUrls) {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
  }

  function resetProGeneratedAssets() {
    setProAssetsBySceneId((prev) => {
      for (const assets of Object.values(prev)) {
        for (const asset of assets) revokeAssetUrls(asset);
      }
      return {};
    });
    setProActiveAssetBySceneId({});
    setProAssetMenuId(null);
  }

  function setActiveProAsset(sceneKey: string, assetId: string) {
    setProActiveAssetBySceneId((prev) => ({ ...prev, [sceneKey]: assetId }));
  }

  function appendProAsset(sceneKey: string, asset: ProGeneratedAsset) {
    setProAssetsBySceneId((prev) => ({
      ...prev,
      [sceneKey]: [...(prev[sceneKey] ?? []), asset]
    }));
    setActiveProAsset(sceneKey, asset.id);
  }

  function deleteProAsset(sceneKey: string, assetId: string) {
    setProAssetsBySceneId((prev) => {
      const current = prev[sceneKey] ?? [];
      const target = current.find((item) => item.id === assetId);
      revokeAssetUrls(target);
      const nextSceneAssets = current.filter((item) => item.id !== assetId);
      const next = { ...prev };
      if (nextSceneAssets.length) next[sceneKey] = nextSceneAssets;
      else delete next[sceneKey];
      return next;
    });
    setProActiveAssetBySceneId((prev) => {
      if (prev[sceneKey] !== assetId) return prev;
      return { ...prev, [sceneKey]: "canvas" };
    });
    setProAssetMenuId((prev) => (prev === assetId ? null : prev));
  }

  function proAssetLabel(kind: "image" | "video", index: number) {
    if (lang === "zh") return kind === "image" ? `图 ${index}` : `视频 ${index}`;
    return kind === "image" ? `Image ${index}` : `Video ${index}`;
  }

  function resolveByoProviderForMedia(nextMediaMode: "image" | "video"): "fal" | "runway" | null {
    const creds = accountApiCredentials;
    if (!creds) return null;
    const ordered = nextMediaMode === "video"
      ? ["runway", "fal"] as const
      : ["fal", "runway"] as const;
    const preferred = creds.defaultProvider;
    const candidates = [preferred, ...ordered.filter((item) => item !== preferred)];
    for (const provider of candidates) {
      const config = creds[provider];
      if (config?.enabled && config.mode === "personal" && config.apiKey.trim()) return provider;
    }
    return null;
  }

  function resolveProGenerationPlatformId(source: ProGenerationSource, nextMediaMode: "image" | "video"): SavePlatformId {
    if (source === "byo") {
      const provider = resolveByoProviderForMedia(nextMediaMode);
      if (provider === "runway") return "runway";
      if (provider === "fal") return "fal";
    }
    return nextMediaMode === "video" ? "runway" : "fal";
  }

  async function runPreferredLocalImage(args: {
    prompt: string;
    resolution: string;
    seed: number;
    prefix?: string;
    steps?: number;
    cfg?: number;
    guidanceScale?: number;
    preferredCheckpoint?: string;
    preferredProvider?: LocalTestImageProvider;
    strictProvider?: boolean;
  }) {
    const preferredProvider = args.preferredProvider ?? LOCAL_TEST_IMAGE_PROVIDER;
    const strictProvider = Boolean(args.strictProvider);
    const comfyArgs = {
      prompt: args.prompt,
      resolution: args.resolution,
      seed: args.seed,
      baseUrls: defaultComfyUiBaseUrls(),
      preferredCheckpoint: args.preferredCheckpoint ?? comfyStatus.checkpoint,
      prefix: args.prefix,
      steps: args.steps,
      cfg: args.cfg
    };
    const drawArgs = {
      prompt: args.prompt,
      resolution: args.resolution,
      seed: args.seed,
      baseUrls: defaultDrawThingsBaseUrls(),
      steps: args.steps,
      guidanceScale: args.guidanceScale
    };

    if (preferredProvider === "comfyui") {
      if (strictProvider) return await runComfyUiImage(comfyArgs);
      try {
        return await runComfyUiImage(comfyArgs);
      } catch {
        return await runDrawThingsTxt2Img(drawArgs);
      }
    }

    if (strictProvider) return await runDrawThingsTxt2Img(drawArgs);
    try {
      return await runDrawThingsTxt2Img(drawArgs);
    } catch {
      return await runComfyUiImage(comfyArgs);
    }
  }

  async function buildSceneAnchorImage(prompt: string, resolution: string, seed: number): Promise<{ url: string; ownedUrls: string[] }> {
    const candidateRefs = [
      scene.backgroundRef,
      ...(scene.layers ?? []).flatMap((layer) => layer.localRefs ?? [])
    ];
    for (const ref of candidateRefs) {
      if (!ref?.id) continue;
      const blob = await getRefBlob(ref.id);
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      return { url, ownedUrls: [url] };
    }

    try {
      const draft = await runPreferredLocalImage({
        prompt,
        resolution,
        seed,
        preferredCheckpoint: comfyStatus.checkpoint
      });
      return { url: draft.imageUrl, ownedUrls: [draft.imageUrl] };
    } catch {
      // If local image generation fails here, we do not create any blob URLs.
      throw new Error("Local image anchor generation failed");
    }
  }

  async function generateProAsset(requestedSource: ProGenerationSource = proGenerationSource) {
    if (proGenerateBusy) return;

    if (requestedSource === "hosted") {
      if (!canUseHostedGeneration(accountUser)) {
        openBillingPage("upgrade");
        return;
      }
    } else {
      if (!accountUser) {
        openAccountCenter("auth");
        return;
      }
      if (!canUseBringYourOwnApi(accountUser)) {
        openAccountCenter("api");
        return;
      }
      if (!resolveByoProviderForMedia(mediaMode)) {
        openAccountCenter("api");
        return;
      }
    }

    const strategyPlatformId = resolveProGenerationPlatformId(requestedSource, mediaMode);
    const prompt = buildScenePromptText(scene, strategyPlatformId);
    const resolution = aspectRatioToResolution(scene?.aspectRatio, mediaMode);
    const seed = 101 + currentSceneAssets.length;
    const videoSec = Math.max(1, Math.ceil(Number(scene?.duration_s) || 5));
    const cost = requestedSource === "hosted" ? creditCostForProfile(currentGenProfile, mediaMode === "video" ? videoSec : 1) : 0;
    let reservedEntryId = "";
    const startMs = Date.now();

    setProGenerateBusy(true);
    setProAssetMenuId(null);

    try {
      if (requestedSource === "hosted" && accountUser) {
        if (accountCredits < cost) {
          setProGenerateBusy(false);
          openNotEnoughCredits(lang === "zh" ? `Credits 不足。需要 ${cost}，当前余额 ${accountCredits}。` : `Not enough credits. Need ${cost}, available ${accountCredits}.`);
          openBillingPage("credits");
          trackProjectFlow("pro_generate", { generation_mode: "hosted", generation_profile: currentGenProfile, success: false, reason: "insufficient_credits", credits_required: cost }, lang);
          return;
        }
        const reserved = await reserveCredits(accountUser.id, cost, `pro_generate_${mediaMode}`);
        reservedEntryId = reserved.id;
      }

      if (mediaMode === "image") {
        const localImage = await runPreferredLocalImage({
          prompt,
          resolution,
          seed,
          preferredCheckpoint: comfyStatus.checkpoint
        });

        const imageCount = currentSceneAssets.filter((item) => item.kind === "image").length + 1;
        appendProAsset(sceneAssetKey, {
          id: makeProAssetId("image"),
          sceneId: sceneAssetKey,
          kind: "image",
          title: proAssetLabel("image", imageCount),
          prompt,
          source: requestedSource,
          strategyPlatformId,
          imageUrl: localImage.imageUrl,
          ownedUrls: [localImage.imageUrl],
          createdAt: new Date().toISOString()
        });
      } else {
        let anchor: { url: string; ownedUrls: string[] } | null = null;
        try {
          anchor = await buildSceneAnchorImage(prompt, resolution, seed);
          const localVideo = await runComfyUiVideoPreview({
            prompt,
            anchorImageUrl: anchor.url,
            resolution,
            seed,
            baseUrls: defaultComfyUiBaseUrls(),
            prefix: `scenepilotix_scene_${sceneNo}_${Date.now()}`
          });
          const videoCount = currentSceneAssets.filter((item) => item.kind === "video").length + 1;
          appendProAsset(sceneAssetKey, {
            id: makeProAssetId("video"),
            sceneId: sceneAssetKey,
            kind: "video",
            title: proAssetLabel("video", videoCount),
            prompt,
            source: requestedSource,
            strategyPlatformId,
            videoUrl: localVideo.videoUrl,
            posterUrl: localVideo.posterUrl || anchor.url,
            ownedUrls: [...new Set([localVideo.videoUrl, localVideo.posterUrl || "", ...(anchor.ownedUrls ?? [])].filter(Boolean))],
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          // Revoke any anchor blobs we created but did not attach to an owned asset.
          if (anchor?.ownedUrls) {
            for (const url of anchor.ownedUrls) {
              if (typeof url === "string" && url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
              }
            }
          }
          throw error;
        }
      }

      if (requestedSource === "hosted" && accountUser && reservedEntryId) {
        await finalizeReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }

      const latencyMs = Date.now() - startMs;
      trackProjectFlow("pro_generate", {
        generation_mode: requestedSource,
        generation_profile: currentGenProfile,
        provider: strategyPlatformId,
        credits_charged: requestedSource === "hosted" ? cost : 0,
        success: true,
        latency_ms: latencyMs,
      }, lang);

      setProGenerateHint(
        requestedSource === "hosted"
          ? (lang === "zh" ? "已生成新结果" : "New result generated")
          : (lang === "zh" ? "已用我的 API 生成结果" : "Generated with your API")
      );
    } catch (error) {
      const latencyMs = Date.now() - startMs;
      trackProjectFlow("pro_generate", {
        generation_mode: requestedSource,
        generation_profile: currentGenProfile,
        provider: strategyPlatformId,
        credits_charged: 0,
        success: false,
        latency_ms: latencyMs,
        error: error instanceof Error ? error.message : String(error),
      }, lang);
      if (requestedSource === "hosted" && accountUser && reservedEntryId) {
        await rollbackReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      const message = error instanceof Error ? error.message : String(error);
      setProGenerateHint(
        lang === "zh"
          ? `生成失败：${message}`
          : `Generation failed: ${message}`
      );
    } finally {
      setProGenerateBusy(false);
    }
  }

  function downloadProAsset(asset: ProGeneratedAsset) {
    const href = asset.kind === "video" ? asset.videoUrl : asset.imageUrl;
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.download = `${safeExportName(fileLabel || defaultProjectName(lang)) || "project"}_${safeExportName(asset.title) || asset.id}.${asset.kind === "video" ? "mp4" : "png"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  function openAccountCenter(section: AccountCenterSection) {
    if (!accountUser) {
      setAuthStep("email");
      setAuthCode("");
      setAuthPassword("");
      setAuthHint("");
    }
    setAccountCenterSection(section);
    setAccountCenterOpen(true);
  }

  function openBillingPage(page: "upgrade" | "credits") {
    setBillingPage(page);
    if (page === "upgrade") {
      setBillingLocalHint("");
    }
  }

  function closeBillingPage() {
    setBillingPage(null);
  }

  /** Use Template = always create a new project (never append). Market: pricing resolver; user_private: free. */
  async function handleUseTemplateFromWorkspace(
    indexOrItem: TemplateIndex | TemplateWorkspaceItem | UserPrivateTemplate,
    _applyMode?: ApplyTemplateMode
  ) {
    if (indexOrItem && isUserPrivateTemplate(indexOrItem)) {
      const userTpl = indexOrItem as UserPrivateTemplate;
      const newProject = createProjectFromUserTemplate(userTpl);
      updateProject(newProject);
      setSceneIdx(0);
      setSelectedLayerId(null);
      const name = (newProject as Project & { name?: string }).name ?? defaultProjectName(lang);
      setFileLabel(name);
      setLabelPersist(name);
      setIsTemplateWorkspaceOpen(false);
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已应用模板" : "Template applied");
      return;
    }

    const index: TemplateIndex | null =
      "familyId" in indexOrItem
        ? (indexOrItem as TemplateIndex)
        : (() => {
            const item = indexOrItem as TemplateWorkspaceItem;
            return getTemplateIndex().find((t) => t.id === item.id) ?? null;
          })();

    if (!index) return;

    const meta = getTemplateMetadataFromIndex(index);
    addToRecent(meta.id);

    const pricing = await getTemplatePricingForTemplate(index.id);
    if (import.meta.env?.DEV && pricing.debugReasons?.length) {
      console.log("[template pricing]", index.id, pricing.debugReasons);
    }

    const owned = Boolean(accountUser && isTemplateOwned(accountUser.id, index.id));
    const freeOrUnlimited = pricing.creditPrice <= 0 || canUseUnlimitedTemplates(accountUser);

    if (!owned && pricing.accessTier === "pro_credits" && !canUseProConsole(accountUser)) {
      openBillingPage("upgrade");
      return;
    }

    if (!freeOrUnlimited && !owned) {
      if (!accountUser) {
        setTemplateCreditsNeeded(pricing.creditPrice);
        setTemplateCreditsHave(0);
        setTemplateCreditsName(meta.nameZh ?? meta.name ?? "");
        setTemplateCreditsInsufficientOpen(true);
        return;
      }
      if (accountCredits < pricing.creditPrice) {
        setTemplateCreditsNeeded(pricing.creditPrice);
        setTemplateCreditsHave(accountCredits);
        setTemplateCreditsName(meta.nameZh ?? meta.name ?? "");
        setTemplateCreditsInsufficientOpen(true);
        return;
      }
    }

    let newProject = await createProjectFromTemplate(index, {
      templateOwnedAtCreation: freeOrUnlimited || owned,
      pricingBucketAtCreation: pricing.pricingBucket
    });

    if (!freeOrUnlimited && !owned && accountUser) {
      const chargeResult = await applyTemplateCharge(
        accountUser.id,
        newProject,
        index,
        pricing.creditPrice
      );
      if (!chargeResult.success) {
        setTemplateCreditsNeeded(pricing.creditPrice);
        setTemplateCreditsHave(accountCredits);
        setTemplateCreditsName(meta.nameZh ?? meta.name ?? "");
        setTemplateCreditsInsufficientOpen(true);
        return;
      }
      newProject = chargeResult.project;
      markTemplateOwned(accountUser.id, index.id);
      await refreshAccountState();
    }

    updateProject(newProject);
    setSceneIdx(0);
    setSelectedLayerId(null);
    const name = (newProject as Project & { name?: string }).name ?? defaultProjectName(lang);
    setFileLabel(name);
    setLabelPersist(name);
    setIsTemplateWorkspaceOpen(false);
    feedbackBarRef.current?.pushMessage(lang === "zh" ? "已应用模板" : "Template applied");
  }

  /** Proxy: duplicate via unified runProjectAction. */
  function handleDuplicateProject() {
    runProjectAction("duplicate");
  }

  /** Proxy: save as template via unified runProjectAction. */
  function handleSaveAsTemplate() {
    runProjectAction("save_as_template");
  }


  // No protocol interception: initial auth state from localStorage only; no ?signin / ?redirect URL handling.

  function providerReadyText(provider: LocalTestImageProvider, status: LocalProviderStatus) {
    const providerLabel = provider === "comfyui" ? "ComfyUI" : "Draw Things";
    if (status.state === "ready") {
      return lang === "zh"
        ? `${providerLabel} 已连通${status.baseUrl ? ` (${status.baseUrl})` : ""}`
        : `${providerLabel} is reachable${status.baseUrl ? ` (${status.baseUrl})` : ""}`;
    }
    const detail = status.error || status.detail || (lang === "zh" ? "服务不可用" : "service unavailable");
    return lang === "zh"
      ? `${providerLabel} 不可用：${detail}`
      : `${providerLabel} unavailable: ${detail}`;
  }

  function authErrorText(error: unknown) {
    const code = String(error instanceof Error ? error.message : error || "")
      .trim()
      .toLowerCase();
    if (code.includes("invalid_email")) {
      return lang === "zh" ? "邮箱格式无效。" : "Invalid email format.";
    }
    if (code.includes("missing_challenge")) {
      return lang === "zh" ? "请先发送验证码。" : "Send code first.";
    }
    if (code.includes("code_expired")) {
      return lang === "zh" ? "验证码已过期，请重新发送。" : "Code expired. Request a new one.";
    }
    if (code.includes("code_invalid")) {
      return lang === "zh" ? "验证码错误，请重试。" : "Invalid code. Try again.";
    }
    if (code.includes("too_many_requests")) {
      return lang === "zh" ? "请求过于频繁，请稍后再试。" : "Too many requests. Please try again later.";
    }
    if (code.includes("auth_redirect_started")) {
      return "";
    }
    if (code.includes("supabase_not_configured")) {
      return lang === "zh" ? "登录服务未配置完成。" : "Auth service is not configured.";
    }
    if (code.includes("invalid_grant") || code.includes("otp_expired")) {
      return lang === "zh" ? "验证码错误或已过期，请重新发送。" : "Code is invalid or expired. Request a new one.";
    }
    if (code.includes("supabase_network_error")) {
      return lang === "zh" ? "登录网络异常，请稍后重试。" : "Auth network error. Please try again.";
    }
    if (code.includes("auth_backend_unavailable")) {
      return lang === "zh" ? "登录服务暂不可用，请稍后重试。" : "Auth service is unavailable right now. Please retry.";
    }
    if (code.includes("password_too_short")) {
      return lang === "zh" ? "密码至少 6 位。" : "Password must be at least 6 characters.";
    }
    if (code.includes("invalid_login_credentials") || code.includes("invalid_grant")) {
      return lang === "zh" ? "邮箱或密码错误。" : "Invalid email or password.";
    }
    if (code.includes("email_not_confirmed")) {
      return lang === "zh" ? "邮箱未验证，请先完成邮箱验证。" : "Email is not confirmed yet.";
    }
    if (code.includes("user_already_registered")) {
      return lang === "zh" ? "账号已存在，请直接登录。" : "Account already exists. Please sign in.";
    }
    if (code.includes("code_locked")) {
      return lang === "zh" ? "验证码尝试次数过多，请重新发送。" : "Too many invalid attempts. Request a new code.";
    }
    if (code.includes("google_not_configured") || code.includes("google_client_id_missing")) {
      return lang === "zh" ? "Google 登录未配置完成。" : "Google sign-in is not configured.";
    }
    if (code.includes("google_prompt_")) {
      return lang === "zh" ? "Google 登录窗口未完成，请重试。" : "Google prompt was not completed. Please retry.";
    }
    if (code.includes("google_verify")) {
      return lang === "zh" ? "Google 身份校验失败，请重试。" : "Google verification failed. Please retry.";
    }
    return lang === "zh" ? "登录失败，请重试。" : "Sign-in failed. Please retry.";
  }

  const billingRuntimeEnabled = BILLING_ENABLED && !BILLING_LIVE_BLOCKED;
  const billingNotice = useMemo(() => {
    if (!BILLING_ENABLED) {
      return lang === "zh" ? "支付通道即将上线，暂不可购买或开通。" : "Billing is coming soon. Purchases are temporarily unavailable.";
    }
    if (BILLING_LIVE_BLOCKED) {
      return lang === "zh" ? "当前环境已启用支付保护：禁止 live 扣费，请使用 sandbox。" : "Live billing is blocked in this environment. Use sandbox billing only.";
    }
    return "";
  }, [lang]);

  function requestProAccess(section: AccountCenterSection = "pro") {
    if (canUseProConsole(accountUser)) return enterProWorkspace();
    openAccountCenter(section);
    return false;
  }

  async function handleSendAuthCode() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const result = await sendCode(authEmail);
      setLastSentCode(result.devCode);
      setAuthStep("code");
      setAuthHint("");
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleVerifyAuthCode() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await verifyCode(authEmail, authCode);
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      setAuthHint("");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang
      });
      setAccountCenterSection("overview");
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await signInWithGoogle();
      setAuthPassword("");
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang
      });
      setAccountCenterSection("overview");
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handlePasswordSignIn() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await signInWithPassword(authEmail, authPassword);
      setAuthPassword("");
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang
      });
      setAccountCenterSection("overview");
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    setAccountCenterSection("auth");
    setAuthStep("email");
    setAuthPassword("");
    setAuthCode("");
    setAuthHint("");
    setLastSentCode("");
    await refreshAccountState();
  }

  async function handlePurchaseCredits(packId: string) {
    if (!accountUser || billingBusy) {
      openAccountCenter("auth");
      return;
    }
    if (!billingRuntimeEnabled) {
      openBillingPage("credits");
      return;
    }
    if (!billingLegalAccepted) {
      openBillingPage("credits");
      return;
    }
    void recordLegalConsent({
      userId: accountUser.id,
      context: "billing_credits",
      docs: ["billing", "refund", "terms", "privacy"],
      source: "billing_overlay_credits",
      locale: lang
    });
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "credits", productId: packId });
      await refreshAccountState();
      setBillingPage("credits");
    } catch {
      openBillingPage("credits");
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleUpgradePro() {
    if (!accountUser || billingBusy) {
      openAccountCenter("auth");
      return;
    }
    if (!billingRuntimeEnabled) {
      openBillingPage("upgrade");
      return;
    }
    if (!billingLegalAccepted) {
      openBillingPage("upgrade");
      return;
    }
    void recordLegalConsent({
      userId: accountUser.id,
      context: "billing_upgrade",
      docs: ["billing", "refund", "terms", "privacy"],
      source: "billing_overlay_upgrade",
      locale: lang
    });
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "pro", productId: PRO_PLAN.id });
      await refreshAccountState();
      setBillingPage("upgrade");
    } catch {
      openBillingPage("upgrade");
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
    if (!billingRuntimeEnabled) {
      openBillingPage("upgrade");
      return;
    }
    setBillingBusy(true);
    try {
      const portal = await openCustomerPortal(accountUser.id);
      window.open(portal.url, "_blank", "noopener,noreferrer");
    } catch {
      openBillingPage("upgrade");
    } finally {
      setBillingBusy(false);
    }
  }

  function handleSaveApiCredentials(next: ApiCredentialState) {
    if (!accountUser || !canUseBringYourOwnApi(accountUser)) return;
    const current = getApiCredentials(accountUser.id);
    const now = new Date().toISOString();
    const effectiveFalKey = next.fal.mode === "personal" && next.fal.apiKey?.trim() ? next.fal.apiKey : (next.fal.mode === "personal" ? current.fal.apiKey : "");
    const effectiveRunwayKey = next.runway.mode === "personal" && next.runway.apiKey?.trim() ? next.runway.apiKey : (next.runway.mode === "personal" ? current.runway.apiKey : "");
    const withStatus: ApiCredentialState = {
      ...next,
      fal: {
        ...next.fal,
        apiKey: effectiveFalKey,
        status: next.fal.mode === "personal"
          ? (effectiveFalKey ? "connected" : "invalid_key")
          : undefined,
        lastCheckedAt: next.fal.mode === "personal" ? now : undefined,
        updatedAt: now
      },
      runway: {
        ...next.runway,
        apiKey: effectiveRunwayKey,
        status: next.runway.mode === "personal"
          ? (effectiveRunwayKey ? "connected" : "invalid_key")
          : undefined,
        lastCheckedAt: next.runway.mode === "personal" ? now : undefined,
        updatedAt: now
      },
      updatedAt: now
    };
    setApiCredentials(accountUser.id, withStatus);
    setAccountApiCredentials(withStatus);
  }

  function openNotEnoughCredits(message: string) {
    setInsufficientCreditsMessage(message);
    setInsufficientCreditsOpen(true);
  }

  /** Prompt export is free; no charge. Empty note. */
  const promptExportNote = useMemo(() => "", []);

  /** Prompt export is always free; no credit reserve or paywall. */
  const preparePromptExport = useCallback(async (_action: PromptExportAction): Promise<PromptExportTicket> => {
    if (!accountUser) {
      openAccountCenter("auth");
      return { allowed: false };
    }
    return { allowed: true };
  }, [accountUser]);

  const settlePromptExport = useCallback(async (reservationId: string | undefined, committed: boolean) => {
    if (!accountUser || !reservationId) return;
    try {
      if (committed) await finalizeReservedCredits(accountUser.id, reservationId);
      else await rollbackReservedCredits(accountUser.id, reservationId);
    } finally {
      await refreshAccountState();
    }
  }, [accountUser, refreshAccountState]);

  useEffect(() => {
    void refreshAccountState();
  }, [refreshAccountState]);

  // ✅ 新用户 onboarding：登录后首次进入自动弹出创建向导
  useEffect(() => {
    if (!accountUser) return;
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        setWizardCancelable(false);
        setWizardStep("media");
        setWizardOpen(true);
      }
    } catch { /* ignore localStorage errors */ }
  }, [accountUser?.id]);

  useEffect(() => {
    if (!accountUser) return;
    const target = postAuthRedirect || readPostAuthRedirect();
    const normalized = normalizePostAuthRedirect(target);
    if (!normalized) return;
    consumePostAuthRedirect();
    setPostAuthRedirect("");
    window.location.assign(normalized);
  }, [accountUser, postAuthRedirect]);

  useEffect(() => {
    if (!accountUser?.id) return;
    void syncPendingLegalConsents(accountUser.id);
  }, [accountUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_LEGAL_CONSENT_KEY, authLegalAccepted ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }, [authLegalAccepted]);

  useEffect(() => {
    try {
      if (authEmail.trim()) localStorage.setItem(AUTH_EMAIL_DRAFT_KEY, authEmail.trim());
      else localStorage.removeItem(AUTH_EMAIL_DRAFT_KEY);
    } catch {
      // ignore localStorage errors
    }
  }, [authEmail]);

  useEffect(() => {
    try {
      localStorage.setItem(BILLING_LEGAL_CONSENT_KEY, billingLegalAccepted ? "1" : "0");
    } catch {
      // ignore localStorage errors
    }
  }, [billingLegalAccepted]);

  function requestNewProject() {
    if (!hasUnsavedLibraryChanges) {
      if (!requestProAccess("pro")) return;
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

  /** Unified project action entry. All Rename/Save/SaveAs/Duplicate/SaveAsTemplate go through here. */
  function runProjectAction(
    action: "rename_confirm" | "save" | "save_as" | "duplicate" | "save_as_template",
    payload?: { renameDraft?: string }
  ): void | Promise<boolean> {
    if (action === "rename_confirm" && payload?.renameDraft != null) {
      const trimmed = payload.renameDraft.trim() || defaultProjectName(lang);
      updateProject({ ...safeProject, name: trimmed });
      setFileLabel(trimmed);
      setLabelPersist(trimmed);
      setRenameProjectOpen(false);
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已重命名项目" : "Project renamed");
      return;
    }
    if (action === "save") {
      const p = saveToDisk();
      if (p && typeof p.then === "function") {
        p.then((ok) => {
          if (ok) feedbackBarRef.current?.pushMessage(lang === "zh" ? "已保存项目" : "Project saved");
        });
      }
      return p;
    }
    if (action === "save_as") {
      const p = saveAsToDisk();
      if (p && typeof p.then === "function") {
        p.then((ok) => {
          if (ok) feedbackBarRef.current?.pushMessage(lang === "zh" ? "已另存项目" : "Project saved as");
        });
      }
      return p;
    }
    if (action === "duplicate") {
      const dup = duplicateProject(safeProject);
      updateProject(dup);
      setSceneIdx(0);
      setSelectedLayerId(null);
      const name = (dup as Project & { name?: string }).name ?? defaultProjectName(lang);
      setFileLabel(name);
      setLabelPersist(name);
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已复制项目" : "Project duplicated");
      return;
    }
    if (action === "save_as_template") {
      const uid = accountUser?.id ?? "guest";
      const t = saveCurrentProjectAsTemplate(uid, safeProject);
      setLibraryHint(lang === "zh" ? `已保存为模板：${t.name}` : `Saved as template: ${t.name}`);
      setTemplatesRefresh((r) => r + 1);
      setIsTemplateWorkspaceOpen(true);
      setTemplateWorkspaceState((s) => ({
        ...s,
        templateWorkspaceView: "my_templates",
        myTemplateSection: "created",
        selectedTemplateId: t.id
      }));
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已保存为模板" : "Saved as template");
      return;
    }
  }

  function requestRenameProject() {
    setRenameProjectDraft(fileLabel || defaultProjectName(lang));
    setRenameProjectOpen(true);
  }

  /** Proxy: applies rename via unified entry and syncs project.name + fileLabel + labelPersist. */
  function confirmRenameProject() {
    runProjectAction("rename_confirm", { renameDraft: renameProjectDraft });
  }

  async function createNewProjectAfterSave() {
    setNewProjectConfirmBusy(true);
    try {
      const maybe = runProjectAction("save");
      const ok = typeof maybe === "object" && typeof (maybe as Promise<unknown>).then === "function"
        ? await (maybe as Promise<boolean>)
        : false;
      if (!ok) return;
      if (!requestProAccess("pro")) return;
      setNewProjectConfirmOpen(false);
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: true }, lang);
    } finally {
      setNewProjectConfirmBusy(false);
    }
  }

  function createNewProjectDirectly() {
    setNewProjectConfirmOpen(false);
    if (!enterProWorkspace()) return;
    setProjectSavePlatformLockedPersist(false);
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
    const p = sanitizeProject(buildProjectFromWizard(wizardDraft));
    const fallbackName = defaultProjectName(lang);
    const projectFileName = wizardDraft.projectName.trim() || fallbackName;
    resetProGeneratedAssets();
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    setFileHandle(null);
    setLabelPersist(projectFileName);
    setProjectSavePlatformLockedPersist(false);
    updateProject(p);
    if (!enterProWorkspace()) return;
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
    const totalDuration = mediaType === "video"
      ? prefs.durationSec
      : parseDurationFromBrief(mergedBrief, mediaType, shotCount);
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
        ? "当前测试链路默认优先 ComfyUI；如本地不可用则回退 Draw Things；两者都不可用则回退任务包。"
        : "Current test flow prioritizes ComfyUI; fallback to Draw Things if unavailable; if both fail, fallback to handoff package."
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
    const projectForPlan = intentPlan.canvas
      ? intentPlanToProProject(intentPlan, resultStructureState, lang)
      : buildProjectForResultPlan(plan);
    if (plan.mediaType === "image") {
      const sceneItem = projectForPlan.scenes[0];
      if (!sceneItem) return [];
      const prompt = buildPromptForScene({
        project: projectForPlan,
        scene: sceneItem,
        lang,
        platformId: savePlatformId,
        profile: getPlatformPreset(savePlatformId).baseProfile,
        workspace: "quick"
      }).finalCopyPrompt.trim();
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
      prompt: buildPromptForScene({
        project: projectForPlan,
        scene: sceneItem,
        lang,
        platformId: savePlatformId,
        profile: getPlatformPreset(savePlatformId).baseProfile,
        workspace: "quick"
      }).finalCopyPrompt.trim(),
      resolution: resultModeResolution(plan.ratio, plan.mediaType),
      seed: 101 + index
    }));
  }

  async function generateLocalPreviews(
    plan: ResultPlan,
    preferredProvider: LocalTestImageProvider = LOCAL_TEST_IMAGE_PROVIDER,
    strictProvider = false
  ): Promise<ResultPreview[]> {
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
        const localImage = await runPreferredLocalImage({
          prompt: item.prompt,
          resolution: item.resolution,
          seed: item.seed,
          preferredProvider,
          strictProvider,
          preferredCheckpoint: comfyStatus.checkpoint,
          prefix: `${item.id}_${Date.now()}`,
          steps: STRUCTURE_FIRST_PRESET.comfySteps,
          cfg: STRUCTURE_FIRST_PRESET.comfyCfg,
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
            ? (lang === "zh" ? "ComfyUI 不可用，当前结果来自 Draw Things 本地 HTTP，先验证构图和对象关系。" : "ComfyUI was unavailable, so this result came from local Draw Things HTTP to validate composition and subject relationships first.")
            : (lang === "zh" ? "当前结果来自 ComfyUI 本地 workflow，优先验证构图和对象关系。" : "This result came from the local ComfyUI workflow, prioritizing composition and subject relationships first."),
          imageUrl: localImage.imageUrl,
          provider: localImage.provider,
          hint: localImage.provider === "drawthings"
            ? (lang === "zh" ? "这是 Draw Things 的临时回退结果，可继续指出偏差再修。" : "This is a temporary Draw Things fallback result; point out deviations to refine.")
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

  function hasGeneratedMedia(previews: ResultPreview[]) {
    return previews.some((item) => Boolean(item.imageUrl || item.videoUrl));
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

  function openProFromQuickWorkspace() {
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, "pro");
    } catch {
      /* ignore */
    }
    setWorkspaceSwitchShield(true);
    window.setTimeout(() => setWorkspaceSwitchShield(false), 180);
  }

  async function generateResultPlan() {
    const brief = resultBrief.trim();
    if (!brief || resultBusy) return;
    if (!canUseHostedGeneration(accountUser)) {
      openBillingPage("upgrade");
      return;
    }
    if (freeTrialUsed >= 20) {
      setResultToast(
        lang === "zh"
          ? "已达到当前环境的助手生成体验上限。"
          : "You have reached the current assistant generation trial limit."
      );
      return;
    }
    setResultBusy(true);
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
        openNotEnoughCredits(lang === "zh" ? `Credits 不足。需要 ${cost}，当前余额 ${accountCredits}。` : `Not enough credits. Need ${cost}, available ${accountCredits}.`);
        openBillingPage("credits");
        return;
      }
      if (accountUser) {
        const reserved = await reserveCredits(accountUser.id, cost, `generate_${plan.mediaType}`);
        reservedEntryId = reserved.id;
      }
      setResultPlan(plan);
      const previews = await generateLocalPreviews(plan);
      const generated = hasGeneratedMedia(previews);
      if (accountUser && reservedEntryId) {
        if (generated) {
          await finalizeReservedCredits(accountUser.id, reservedEntryId);
        } else {
          await rollbackReservedCredits(accountUser.id, reservedEntryId);
          reservedEntryId = "";
        }
        await refreshAccountState();
      }
      setResultPreviews(previews);
      setResultSelectedPreviewId(previews[0]?.id ?? null);
      setResultRatings({});
      setResultCardFeedbacks({});
      setResultFeedback("");
      if (generated) {
        setFreeTrialUsed((v) => Math.min(20, v + 1));
      }
      setInsufficientCreditsOpen(false);
      setInsufficientCreditsMessage("");
      closeBillingPage();
    } catch (error) {
      if (accountUser && reservedEntryId) {
        await rollbackReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      const message = error instanceof Error ? error.message : String(error);
      setResultToast(
        lang === "zh"
          ? `助手生成失败：${message}`
          : `Assistant generation failed: ${message}`
      );
    } finally {
      setResultBusy(false);
    }
  }

  async function generateResultPlanLocalTest(preferredProvider: LocalTestImageProvider) {
    const brief = resultBrief.trim();
    if (!brief || resultBusy) {
      setBillingLocalHint(
        lang === "zh"
          ? "请先输入第一句需求，再执行本地测试生成。"
          : "Please enter the first-line brief before running local test generation."
      );
      return;
    }

    setResultBusy(true);
    setBillingLocalHint(lang === "zh" ? "正在探测本地引擎..." : "Checking local engines...");
    trackProjectFlow("assistant_generate_local_test", { len: brief.length, provider: preferredProvider }, lang);

    try {
      const { nextComfy, nextDraw } = await refreshLocalProviders();
      const selected = preferredProvider === "comfyui" ? nextComfy : nextDraw;
      const selectedText = providerReadyText(preferredProvider, selected);
      const bothReady = nextComfy.state === "ready" && nextDraw.state === "ready";
      if (!bothReady) {
        const comfyText = providerReadyText("comfyui", nextComfy);
        const drawText = providerReadyText("drawthings", nextDraw);
        setBillingLocalHint(`${comfyText} | ${drawText}`);
      }
      if (selected.state !== "ready") {
        setBillingLocalHint(selectedText);
        setResultBusy(false);
        return;
      }

      await wait(260);
      const intentPlan = resultIntentPlan ?? briefToIntentPlan(brief, lang);
      setResultIntentPlan(intentPlan);
      const plan = inferResultPlan(brief, "", resultPrefs, intentPlan);
      setResultPlan(plan);
      const previews = await generateLocalPreviews(plan, preferredProvider, true);
      const generated = hasGeneratedMedia(previews);

      setResultPreviews(previews);
      setResultSelectedPreviewId(previews[0]?.id ?? null);
      setResultRatings({});
      setResultCardFeedbacks({});
      setResultFeedback("");

      if (generated) {
        const msg = lang === "zh"
          ? `本地测试生成完成（优先 ${preferredProvider === "comfyui" ? "ComfyUI" : "Draw Things"}）。`
          : `Local test generation completed (preferred ${preferredProvider === "comfyui" ? "ComfyUI" : "Draw Things"}).`;
        setBillingLocalHint(msg);
        setResultToast(msg);
        closeBillingPage();
      } else {
        setBillingLocalHint(
          lang === "zh"
            ? "本地引擎未返回可预览结果，已保留任务包降级路径。"
            : "Local engines returned no preview media; handoff package fallback is preserved."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBillingLocalHint(
        lang === "zh"
          ? `本地测试生成失败：${message}`
          : `Local test generation failed: ${message}`
      );
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
        openNotEnoughCredits(lang === "zh" ? `Credits 不足。需要 ${cost}，当前余额 ${accountCredits}。` : `Not enough credits. Need ${cost}, available ${accountCredits}.`);
        openBillingPage("credits");
        return;
      }
      if (accountUser) {
        const reserved = await reserveCredits(accountUser.id, cost, `refine_${refinedPlan.mediaType}`);
        reservedEntryId = reserved.id;
      }
      setResultPlan(refinedPlan);
      const nextPreviews = await generateLocalPreviews(refinedPlan);
      const generated = hasGeneratedMedia(nextPreviews);
      if (accountUser && reservedEntryId) {
        if (generated) {
          await finalizeReservedCredits(accountUser.id, reservedEntryId);
        } else {
          await rollbackReservedCredits(accountUser.id, reservedEntryId);
          reservedEntryId = "";
        }
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
      const message = error instanceof Error ? error.message : String(error);
      setResultToast(
        lang === "zh"
          ? `助手精修失败：${message}`
          : `Assistant refine failed: ${message}`
      );
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
    setProjectSavePlatformLockedPersist(true);
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
    const ok = await saveProjectToLibrary(pickedPlatform, pickedName);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save_as", { via: "library", platform: pickedPlatform, scope: "project" }, lang);
    return true;
  }

  async function saveToDisk(): Promise<boolean> {
    const pickedPlatform = projectSavePlatformLocked ? savePlatformId : await requestSavePlatform("save");
    if (!pickedPlatform) return false;
    syncSavePlatform(pickedPlatform);
    setProjectSavePlatformLockedPersist(true);
    setLibraryHint(
      lang === "zh"
        ? `保存当前项目到分镜库（适用大模型 ${savePlatformLabel(pickedPlatform, lang)}）。`
        : `Saving current project to the library (target model ${savePlatformLabel(pickedPlatform, lang)}).`
    );
    const ok = await saveProjectToLibrary(pickedPlatform);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save", { via: "library", platform: pickedPlatform, scope: "project" }, lang);
    return true;
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    // Basic size guard to avoid loading unexpectedly large files into memory.
    const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
    if (f.size > MAX_UPLOAD_BYTES) {
      setLibraryHint(
        lang === "zh"
          ? "导入的项目文件过大，请压缩后重试。"
          : "The imported project file is too large. Please compress or trim it and try again."
      );
      return;
    }
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.scenes)) return;
      resetProGeneratedAssets();
      setProject(sanitizeProject(obj as Project));
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      setFileHandle(null);
      setLabelPersist(f.name);
      setProjectSavePlatformLockedPersist(false);

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
    save: () => { void runProjectAction("save"); },
    saveAs: () => { void runProjectAction("save_as"); },
    copyPrompt: handleCopyPrompt,
    exportProject: handleExportProject
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

  function stripJsonExtension(name: string) {
    return name.replace(/\.json$/i, "");
  }

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });
  }

  async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  async function serializeProjectForLibrary(project: Project): Promise<SerializedLibraryProject> {
    const clonedProject = JSON.parse(JSON.stringify(project)) as Project;
    const assets = new Map<string, SerializedLibraryRefAsset>();
    const registerRef = async (ref: { id: string; name: string; mime: string; size: number; updatedAt: number } | undefined) => {
      if (!ref?.id || assets.has(ref.id)) return;
      const blob = await getRefBlob(ref.id);
      if (!blob) return;
      assets.set(ref.id, {
        id: ref.id,
        name: ref.name,
        mime: ref.mime || blob.type || "application/octet-stream",
        size: ref.size || blob.size,
        updatedAt: ref.updatedAt || Date.now(),
        dataUrl: await blobToDataUrl(blob)
      });
    };

    for (const sceneItem of clonedProject.scenes ?? []) {
      await registerRef(sceneItem.backgroundRef);
      for (const layer of sceneItem.layers ?? []) {
        for (const ref of layer.localRefs ?? []) {
          await registerRef(ref);
        }
      }
    }

    return {
      version: 2,
      project: clonedProject.project,
      scenes: clonedProject.scenes,
      assets: { refs: [...assets.values()] }
    };
  }

  async function restoreProjectAssetsFromLibrary(payload: SerializedLibraryProject) {
    const refs = payload.assets?.refs ?? [];
    for (const asset of refs) {
      if (!asset?.id || !asset.dataUrl) continue;
      const blob = await dataUrlToBlob(asset.dataUrl);
      await putRefBlob(asset.id, blob);
    }
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
        if (handle.kind === "file" && /\.json$/i.test(handle.name)) {
          out.push({ name: handle.name, kind: handle.kind, label: stripJsonExtension(handle.name) });
        } else if (handle.kind === "directory") {
          out.push({ name: handle.name, kind: handle.kind, label: handle.name });
        }
      }
      out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }));
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

  function projectJsonFileName(customProjectName?: string) {
    return `${projectDirName(customProjectName)}.json`;
  }

  function sceneDirName(sceneItem: Scene, idx: number, projectName: string) {
    const sceneTitle = safeFsName(sceneItem?.name || sceneItem?.id || defaultSceneName(lang, "video", idx + 1)) || `scene_${idx + 1}`;
    return `${projectName}_${sceneTitle}`;
  }

  function buildScenePromptText(sceneItem: Scene, platformId: SavePlatformId) {
    return buildPromptForScene({
      project: safeProject,
      scene: sceneItem,
      lang,
      platformId,
      profile: getPlatformPreset(platformId).baseProfile,
      workspace: activeWorkspaceMode === "pro" ? "pro" : "quick"
    }).finalCopyPrompt.trim();
  }

  async function ensureFreshSubDir(parent: any, dirName: string): Promise<any> {
    try {
      await parent.removeEntry(dirName, { recursive: true });
    } catch {
      // ignore when not exists
    }
    return await parent.getDirectoryHandle(dirName, { create: true });
  }

  async function saveProjectToLibrary(platformId: SavePlatformId, pickedName?: string): Promise<boolean> {
    const root = await ensureLibraryRoot(true);
    if (!root) return false;
    setLibraryBusy(true);
    try {
      const proj = projectDirName(pickedName);
      try {
        await root.removeEntry(proj, { recursive: true });
      } catch {
        // ignore legacy directory absence
      }
      const payload = await serializeProjectForLibrary(safeProject);
      const exported = {
        ...payload,
        exportProfile: {
          platformId,
          platformLabel: savePlatformLabel(platformId, lang)
        }
      };
      await writeTextToDirectory(root, projectJsonFileName(pickedName), JSON.stringify(exported, null, 2));
      await refreshLibraryEntries(root, libraryProjectName);
      setLibraryHint(lang === "zh" ? `已保存项目：${proj}` : `Saved project: ${proj}`);
      trackExportFlow("save_project", { platform: platformId, scenes: safeProject.scenes.length, result: "success" }, lang);
      return true;
    } catch {
      setLibraryHint(lang === "zh" ? "项目保存失败" : "Project save failed");
      trackExportFlow("save_project", { platform: platformId, scenes: safeProject.scenes.length, result: "fail" }, lang);
      return false;
    } finally {
      setLibraryBusy(false);
    }
  }

  async function saveAllScenesToLibrary(): Promise<boolean> {
    const pickedPlatform = await requestSavePlatform("save_all");
    if (!pickedPlatform) return false;
    syncSavePlatform(pickedPlatform);
    const ok = await saveProjectToLibrary(pickedPlatform);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save_all", { platform: pickedPlatform, scenes: safeProject.scenes.length, result: "success", scope: "project" }, lang);
    return true;
  }

  async function ensureReadyForLibraryOpen(): Promise<boolean> {
    if (!hasUnsavedLibraryChanges) return true;
    const askSave = window.confirm(
      lang === "zh"
        ? "当前项目有未保存改动。点击“确定”先保存整个项目，再打开分镜库项目。"
        : "Current project has unsaved changes. Click OK to save the whole project before opening a library project."
    );
    if (askSave) {
      return await (runProjectAction("save") as Promise<boolean>);
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
      let opened: Project | null = null;
      if (entry.kind === "file") {
        const projectFile = await root.getFileHandle(entry.name);
        const text = await (await projectFile.getFile()).text();
        const parsed = JSON.parse(text) as SerializedLibraryProject & { exportProfile?: { platformId?: SavePlatformId } };
        if (!parsed || !Array.isArray(parsed.scenes)) {
          setLibraryHint(lang === "zh" ? "导入失败：项目文件无效" : "Import failed: invalid project file");
          return;
        }
        if (parsed.exportProfile?.platformId && SAVE_PLATFORM_OPTIONS.includes(parsed.exportProfile.platformId)) {
          syncSavePlatform(parsed.exportProfile.platformId);
          setProjectSavePlatformLockedPersist(true);
        } else {
          setProjectSavePlatformLockedPersist(false);
        }
        await restoreProjectAssetsFromLibrary(parsed);
        opened = sanitizeProject({
          project: parsed.project ?? { mode: "storyboard" },
          scenes: parsed.scenes
        });
      } else {
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
            // skip invalid legacy scene folder
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
        opened = sanitizeProject({
          project: { mode: importedMode },
          scenes: importedScenes
        });
        setProjectSavePlatformLockedPersist(false);
      }
      if (!opened) {
        setLibraryHint(lang === "zh" ? "导入失败：项目无效" : "Import failed: invalid project");
        return;
      }
      resetProGeneratedAssets();
      updateProject(opened);
      setLabelPersist(entry.label);
      setLastLibrarySavedSnapshot(JSON.stringify({ project: opened, fileLabel: entry.label }));
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      setLibraryOpen(false);
      setLibraryHint(lang === "zh" ? `已打开分镜库项目：${entry.label}` : `Opened library project: ${entry.label}`);
    } catch {
      setLibraryHint(lang === "zh" ? "导入失败：无法读取项目文件" : "Import failed: unable to read project file");
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
      let ta: HTMLTextAreaElement | null = null;
      try {
        ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        if (ta && ta.parentNode) {
          ta.parentNode.removeChild(ta);
        }
      }
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
      // sendFeedback 不依赖 telemetry 开关：用户主动提交时始终尝试发送
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

  /** Top-right account menu: grouped (Identity / Account | Plan & API | Help). Logged-out: minimal. Logged-in: account first, then plan/API, then help. */
  const accountMenuEntries: Array<
    | { key: string; isGroupLabel: true; label: string }
    | { key: string; label: string; icon: React.ReactNode; onClick: () => void }
  > = accountUser
    ? [
        { key: "g_account", isGroupLabel: true, label: lang === "zh" ? "账户" : "Account" },
        {
          key: "account_center",
          label: lang === "zh" ? "账户中心" : "Account Center",
          icon: <UserRound size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            openAccountCenter("overview");
          }
        },
        {
          key: "user_management",
          label: lang === "zh" ? "用户管理" : "User Management",
          icon: <UserRound size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            window.location.assign("/account");
          }
        },
        {
          key: "logout",
          label: lang === "zh" ? "退出登录" : "Log Out",
          icon: <LogOut size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            void handleLogout();
          }
        },
        { key: "g_plan_api", isGroupLabel: true, label: lang === "zh" ? "会员与 API" : "Plan & API" },
        {
          key: "upgrade",
          label: lang === "zh" ? "升级会员" : "Upgrade",
          icon: <CreditCard size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            window.location.assign("/pricing");
          }
        },
        {
          key: "credits",
          label: lang === "zh" ? "充值 Credits" : "Buy Credits",
          icon: <Wallet size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            openBillingPage("credits");
          }
        },
        {
          key: "manage_billing",
          label: lang === "zh" ? "管理订阅" : "Manage Billing",
          icon: <CreditCard size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            void handleOpenCustomerPortal();
          }
        },
        ...(canUseBringYourOwnApi(accountUser)
          ? [
              {
                key: "api",
                label: lang === "zh" ? "自带 API" : "Bring Your Own API",
                icon: <KeyRound size={UI_MENU.item.iconSize} />,
                onClick: () => {
                  setAccountMenuOpen(false);
                  openAccountCenter("api");
                }
              } as const,
              {
                key: "local",
                label: lang === "zh" ? "本地连接" : "Local Connect",
                icon: <Cpu size={UI_MENU.item.iconSize} />,
                onClick: () => {
                  setAccountMenuOpen(false);
                  openAccountCenter("local" as any);
                }
              } as const
            ]
          : []),
        { key: "g_help", isGroupLabel: true, label: lang === "zh" ? "帮助" : "Help" },
        {
          key: "help_center",
          label: lang === "zh" ? "帮助中心" : "Help Center",
          icon: <CircleHelp size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            setFeedbackSent("");
            setHelpCenterSection(DEFAULT_HELP_SECTION);
            setHelpCenterOpen(true);
          }
        }
      ]
    : [
        { key: "g_identity", isGroupLabel: true, label: lang === "zh" ? "身份入口" : "Identity" },
        {
          key: "signin",
          label: lang === "zh" ? "登录 / 注册" : "Sign In / Sign Up",
          icon: <UserRound size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            openAccountCenter("auth");
          }
        },
        { key: "g_membership", isGroupLabel: true, label: lang === "zh" ? "会员入口" : "Membership" },
        {
          key: "upgrade",
          label: lang === "zh" ? "升级会员" : "Upgrade",
          icon: <CreditCard size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            window.location.assign("/pricing");
          }
        },
        { key: "g_help", isGroupLabel: true, label: lang === "zh" ? "帮助" : "Help" },
        {
          key: "help_center",
          label: lang === "zh" ? "帮助中心" : "Help Center",
          icon: <CircleHelp size={UI_MENU.item.iconSize} />,
          onClick: () => {
            setAccountMenuOpen(false);
            setFeedbackSent("");
            setHelpCenterSection(DEFAULT_HELP_SECTION);
            setHelpCenterOpen(true);
          }
        }
      ];


  // ---------------------- UI ----------------------
  return (
    <div
      data-workspace={activeWorkspaceMode}
      style={{ ...styles.app, ...styles.appPro }}
    >
      <div style={styles.appBackdrop} aria-hidden="true">
        <div style={styles.appBackdropPro} />
      </div>
      {workspaceSwitchShield ? <div style={styles.workspaceSwitchShield} aria-hidden="true" /> : null}
      <div data-top style={styles.top}>
        {/* ✅ 左上角 Logo：ScenePilotix + 放大中文；彻底移除原 tagline 行 */}
        <div style={styles.brand} title="ScenePilotix">
          <div style={styles.logoRow}>
            <div style={styles.logoEn}>ScenePilotix</div>
            {showBrandZh ? <div style={styles.logoZh}>场景领航</div> : null}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        <button style={styles.topBtn} onClick={toggleLang} type="button">
          <Languages size={16} />
          <span style={styles.topBtnText}>{lang === "zh" ? "EN" : "中文"}</span>
        </button>

        <button
          data-testid="top-account-trigger"
          style={{
            ...styles.topAccountBtn,
            ...(accountUser ? {} : {
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.35)",
              borderRadius: 8,
              padding: "0 12px",
              color: "#f59e0b",
              fontSize: 13
            })
          }}
          onClick={() => setAccountMenuOpen((v) => !v)}
          type="button"
          aria-label={accountUser ? (lang === "zh" ? "账户中心" : "Account Center") : (lang === "zh" ? "登录 / 注册" : "Sign In")}
          title={accountUser ? (lang === "zh" ? "账户中心" : "Account Center") : (lang === "zh" ? "登录 / 注册" : "Sign In")}
        >
          <span style={{ ...styles.topAccountAvatar, background: accountUser ? accountAvatarColor : "#3a3f46" }}>
            {accountUser?.avatarUrl ? (
              <img src={accountUser.avatarUrl} alt="" style={styles.topAvatarImage} />
            ) : (
              <UserRound size={14} style={{ color: accountUser ? "#f4fbff" : "#9ca3af" }} />
            )}
          </span>
          <span style={styles.topBtnText}>{accountEntryLabel}</span>
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

      {accountMenuOpen ? (
        <div
          style={styles.menuMask}
          onMouseDown={() => setAccountMenuOpen(false)}
          role="presentation"
        />
      ) : null}

      {accountMenuOpen ? (
        <div style={styles.helpMenu} data-testid="top-account-menu">
          {accountMenuEntries.map((entry) =>
            "isGroupLabel" in entry && entry.isGroupLabel ? (
              <div key={entry.key} style={styles.helpMenuGroupLabel} data-testid={`top-menu-group-${entry.key}`}>
                {entry.label}
              </div>
            ) : (
              (() => {
                const item = entry as { key: string; label: string; icon: React.ReactNode; onClick: () => void };
                return (
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
                );
              })()
            )
          )}
        </div>
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
                  ? "保存项目：选择适用大模型"
                  : savePlatformPickMode === "save_all"
                    ? "保存项目：选择适用大模型"
                    : "另存为：选择适用大模型"
                : savePlatformPickMode === "save"
                  ? "Save Project: Choose Target Model"
                  : savePlatformPickMode === "save_all"
                    ? "Save Project: Choose Target Model"
                    : "Save As: Choose Target Model"}
            </div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? savePlatformPickMode === "save_as"
                  ? `另存项目时可以重新指定适用大模型。当前默认值是 ${savePlatformLabel(savePlatformId, lang)}。`
                  : `首次保存项目时需要指定适用大模型。设置后，后续“保存项目”将直接沿用当前选择：${savePlatformLabel(savePlatformId, lang)}。`
                : savePlatformPickMode === "save_as"
                  ? `Save As lets you choose a different target model. Current default: ${savePlatformLabel(savePlatformId, lang)}.`
                  : `Choose the target model the first time you save this project. Later saves will reuse: ${savePlatformLabel(savePlatformId, lang)}.`}
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={styles.modalTitle}>
                  {lang === "zh" ? "项目库" : "Project Library"}
                </div>
                {libraryRootName ? (
                  <div style={styles.libraryPath}>{libraryRootName}</div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #3a3f46", background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: 14, fontWeight: 900, flexShrink: 0 }}
              >×</button>
            </div>

            <div style={styles.libraryList}>
              {libraryEntries.length === 0 ? (
                <div style={styles.libraryEmpty}>
                  {lang === "zh" ? "当前目录下暂无可打开的分镜项目。" : "No storyboard projects found in this folder."}
                </div>
              ) : (
                libraryEntries.map((entry) => (
                  <div key={`${entry.kind}:${entry.name}`} style={styles.libraryItem}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{entry.kind === "file" ? "📄" : "📁"}</span>
                    <div style={styles.libraryItemName}>{entry.label}</div>
                    <button
                      style={styles.libraryItemOpenBtn}
                      type="button"
                      disabled={libraryBusy}
                      onClick={() => void importLibraryEntryToEditor(entry)}
                    >
                      {lang === "zh" ? "打开" : "Open"}
                    </button>
                    <button
                      style={styles.libraryItemDeleteBtn}
                      type="button"
                      disabled={libraryBusy}
                      onClick={() => void deleteLibraryEntry(entry)}
                      title={lang === "zh" ? "删除" : "Delete"}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }}>
              <button
                style={styles.libraryImportBtn}
                type="button"
                disabled={libraryBusy}
                onClick={async () => {
                  await importLibraryFromExternalDirectory();
                }}
              >
                {lang === "zh" ? "+ 导入分镜库" : "+ Import Library"}
              </button>
              <button style={styles.modalBtnGhost} type="button" onClick={() => setLibraryOpen(false)}>
                {lang === "zh" ? "关闭" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {libraryHint ? <div style={styles.libraryFloatHint}>{libraryHint}</div> : null}

      {
        <div style={{ ...styles.main, ...(useDesktopFixedLayout ? styles.mainDesktop : {}) }}>
          <Sidebar
            lang={lang}
            project={safeProject}
            sceneIdx={sceneIdx}
            projectLabel={fileLabel || defaultProjectName(lang)}
            isMac={isMac}
            onOpenProject={() => fileInputRef.current?.click()}
            onRenameProject={requestRenameProject}
            onNewProject={requestNewProject}
            onSaveProject={() => void runProjectAction("save")}
            onSaveAs={() => runProjectAction("save_as")}
            onDuplicateProject={handleDuplicateProject}
            onSaveAsTemplate={handleSaveAsTemplate}
            onCopyPrompt={handleCopyPrompt}
            onExportPromptTxt={() => openExportPanel("prompt_txt")}
            onExportPromptPlusRefs={() => openExportPanel("prompt_plus_refs")}
            onExportProject={handleExportProject}
            onOpenLibrary={() => {
              setLibraryOpen(true);
              setLibraryProjectName(null);
              void ensureLibraryRoot(false).then((root) => {
                if (root) void refreshLibraryEntries(root, null);
              });
            }}
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
            isPro={canUseProConsole(accountUser)}
            onLockedTemplateClick={() => setBillingPage("upgrade")}
            onRequestSaveTemplate={() => {
              const sc = safeProject?.scenes?.[sceneIdx];
              if (!sc) return false;
              const tpl = createTemplateFromScene(sc, {
                name: (sc.name ?? "").trim() || (lang === "zh" ? "未命名模板" : "Untitled Template"),
                category: "custom"
              });
              saveUserTemplate(tpl);
              setTemplatesRefresh((r) => r + 1);
              return true;
            }}
            onOpenTemplateWorkspace={() => setIsTemplateWorkspaceOpen(true)}
            onOpenTemplateWorkspaceWithTemplate={(templateId) => {
              const index = getTemplateIndex().find((t) => t.id === templateId);
              setTemplateWorkspaceState((s) => ({
                ...s,
                selectedTemplateId: templateId,
                selectedFamilyId: index?.familyId ?? s.selectedFamilyId
              }));
              setIsTemplateWorkspaceOpen(true);
            }}
            onUseTemplateFromEntry={(item) => void handleUseTemplateFromWorkspace(item, "layout_only")}
          />

          <div
            style={{
              gridColumn: useDesktopFixedLayout ? "2 / -1" : undefined,
              display: useDesktopFixedLayout ? "grid" : "flex",
              gridTemplateColumns: useDesktopFixedLayout ? "minmax(0, 1fr) clamp(240px, 26vw, 344px)" : undefined,
              flex: useDesktopFixedLayout ? undefined : 1,
              minWidth: 0,
              minHeight: 0
            }}
          >
            {isTemplateWorkspaceOpen ? (
              <div style={{ gridColumn: "1 / -1", minWidth: 0, minHeight: 0, display: "flex" }}>
                <TemplateWorkspace
                  lang={lang}
                  state={templateWorkspaceState}
                  onStateChange={setTemplateWorkspaceState}
                  onClose={() => setIsTemplateWorkspaceOpen(false)}
                  onUseTemplate={handleUseTemplateFromWorkspace}
                  project={safeProject}
                  userCredits={accountCredits}
                  userId={accountUser?.id ?? null}
                  isTemplateOwned={(id: string) => isTemplateOwned(accountUser?.id ?? "", id)}
                  templatesRefresh={templatesRefresh}
                />
              </div>
            ) : canUseProConsole(accountUser) ? (
              <div style={{ gridColumn: "1 / -1", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <ProWorkspaceShell
                  lang={lang}
                  project={safeProject}
                  scene={scene}
                  sceneIdx={sceneIdx}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={(id) => {
                    setSelectedLayerId(id);
                    setEditT(0);
                  }}
                  onUpdateScene={(s) => {
                    updateScene(s);
                    trackEditorChange("scene", "update", { idx: sceneIdx }, lang);
                  }}
                  onRenameLayer={(oldId, newId) => {
                    if (selectedLayerId === oldId) setSelectedLayerId(newId);
                    trackEditorChange("layer", "rename", { oldId, newId }, lang);
                  }}
                  editT={effectiveEditT}
                  setEditT={(t) => {
                    if (mediaMode === "image" && t === 1) return;
                    setEditT(t);
                    trackEditorChange("timeline", "set_t", { t }, lang);
                  }}
                  platformId={savePlatformId}
                  onJumpToConflict={(layerId) => {
                    if (layerId) setSelectedLayerId(layerId);
                  }}
                  onPlatformChange={(id) => syncSavePlatform(id as SavePlatformId)}
                  exportMode={proExportMode}
                  onExportModeChange={handleProExportModeChange}
                  generationSource={proGenerationSource}
                  onGenerationSourceChange={setProGenerationSourceAndPersist}
                  canUseByo={canUseBringYourOwnApi(accountUser)}
                  onCopyPrompt={handleCopyPrompt}
                  onExport={handleExportProject}
                  onGenerate={() => void generateProAsset()}
                  generateBusy={proGenerateBusy}
                  bottomSlot={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {proGenerateHint ? (
                          <div style={{ fontSize: 12, color: "var(--pro-text-muted)" }}>{proGenerateHint}</div>
                        ) : null}
                        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                          <button
                            type="button"
                            className="pro-btn-ghost"
                            style={styles.proGenerateBtnSecondary}
                            onClick={() => void generateProAsset()}
                            disabled={proGenerateBusy}
                            title={lang === "zh" ? "主生成区在下方" : "Main generate is below"}
                          >
                            {proGenerateBusy
                              ? (lang === "zh" ? "生成中…" : "Generating…")
                              : (lang === "zh" ? "生成" : "Generate")}
                          </button>
                          <div ref={proProfileDropdownRef} style={{ position: "relative" }}>
                            <button
                              type="button"
                              className="pro-btn-ghost"
                              style={{ ...styles.proGenerateBtnSecondary, minWidth: 32, paddingLeft: 8, paddingRight: 8 }}
                              onClick={() => setProProfileDropdownOpen((o) => !o)}
                              disabled={proGenerateBusy}
                              aria-expanded={proProfileDropdownOpen}
                              aria-haspopup="listbox"
                            >
                              <ChevronDown size={14} style={{ opacity: 0.9 }} />
                            </button>
                            {proProfileDropdownOpen ? (
                              <div
                                role="listbox"
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  bottom: "100%",
                                  marginBottom: 4,
                                  background: "var(--pro-bg-panel)",
                                  border: "1px solid var(--pro-border)",
                                  borderRadius: 8,
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                                  zIndex: 100,
                                  minWidth: 200,
                                  overflow: "hidden",
                                }}
                              >
                                {mediaMode === "image"
                                  ? (["image_standard", "image_hq"] as const).map((id) => {
                                      const meta = GENERATION_PROFILE_LABELS[id];
                                      const label = lang === "zh" ? meta.labelZh : meta.labelEn;
                                      const credits = lang === "zh" ? meta.creditsZh : meta.creditsEn;
                                      return (
                                        <button
                                          key={id}
                                          type="button"
                                          role="option"
                                          aria-selected={currentGenProfile === id}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 14px",
                                            textAlign: "left",
                                            border: "none",
                                            background: currentGenProfile === id ? "rgba(255,255,255,0.08)" : "transparent",
                                            color: "var(--pro-text-primary)",
                                            fontSize: 12,
                                            cursor: "pointer",
                                          }}
                                          onClick={() => setGenerationProfile(id)}
                                        >
                                          {label} ({credits})
                                        </button>
                                      );
                                    })
                                  : (["video_standard", "video_hq"] as const).map((id) => {
                                      const meta = GENERATION_PROFILE_LABELS[id];
                                      const label = lang === "zh" ? meta.labelZh : meta.labelEn;
                                      const credits = lang === "zh" ? meta.creditsZh : meta.creditsEn;
                                      return (
                                        <button
                                          key={id}
                                          type="button"
                                          role="option"
                                          aria-selected={currentGenProfile === id}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 14px",
                                            textAlign: "left",
                                            border: "none",
                                            background: currentGenProfile === id ? "rgba(255,255,255,0.08)" : "transparent",
                                            color: "var(--pro-text-primary)",
                                            fontSize: 12,
                                            cursor: "pointer",
                                          }}
                                          onClick={() => setGenerationProfile(id)}
                                        >
                                          {label} ({credits})
                                        </button>
                                      );
                                    })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="pro-btn-ghost"
                          onClick={handleCopyPrompt}
                          style={{ padding: "8px 12px", fontSize: 12 }}
                        >
                          {lang === "zh" ? "复制提示词" : "Copy Prompt"}
                        </button>
                        <button
                          type="button"
                          className="pro-btn-ghost"
                          onClick={handleExportProject}
                          style={{ padding: "8px 12px", fontSize: 12 }}
                        >
                          {lang === "zh" ? "导出" : "Export"}
                        </button>
                      </div>
                      {/* Advanced Settings (collapsed by default) */}
                      <div style={{ borderTop: "1px solid var(--pro-border)", paddingTop: 8 }}>
                        <button
                          type="button"
                          className="pro-btn-ghost"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 11, color: "var(--pro-text-muted)" }}
                          onClick={() => setProAdvancedSettingsOpen((o) => !o)}
                        >
                          {proAdvancedSettingsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {lang === "zh" ? "高级设置" : "Advanced Settings"}
                        </button>
                        {proAdvancedSettingsOpen ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>{lang === "zh" ? "生成源" : "Provider"}</span>
                              {canUseBringYourOwnApi(accountUser) ? (
                                <>
                                  <button
                                    type="button"
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      border: `1px solid ${proGenerationSource === "hosted" ? "var(--pro-accent)" : "var(--pro-border)"}`,
                                      background: proGenerationSource === "hosted" ? "rgba(84,145,232,0.2)" : "transparent",
                                      color: "var(--pro-text-primary)",
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setProGenerationSourceAndPersist("hosted")}
                                  >
                                    {lang === "zh" ? "平台生成" : "Hosted"}
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      border: `1px solid ${proGenerationSource === "byo" ? "var(--pro-accent)" : "var(--pro-border)"}`,
                                      background: proGenerationSource === "byo" ? "rgba(84,145,232,0.2)" : "transparent",
                                      color: "var(--pro-text-primary)",
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setProGenerationSourceAndPersist("byo")}
                                  >
                                    {lang === "zh" ? "我的 API" : "My API"}
                                  </button>
                                </>
                              ) : (
                                <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                                  {lang === "zh" ? "Pro 可连接自己的 API" : "Pro unlocks My API"}
                                  <button type="button" className="pro-btn-ghost" style={{ marginLeft: 8, fontSize: 11 }} onClick={() => openBillingPage("upgrade")}>
                                    {lang === "zh" ? "升级" : "Upgrade"}
                                  </button>
                                </div>
                              )}
                            </div>
                            {proGenerationSource === "hosted" ? (
                              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                                {lang === "zh" ? "费用预览" : "Cost"}: {currentGenProfile.startsWith("image") ? `${hostedCostPreview} Credits` : `${hostedCostPreview} Credits (${videoSeconds}s)`}
                              </div>
                            ) : canUseBringYourOwnApi(accountUser) ? (
                              <div style={{ fontSize: 11, color: "var(--pro-text-muted)" }}>
                                {lang === "zh" ? "生成不扣 Credits，模板仍扣" : "Generation does not consume Credits; templates still do."}
                              </div>
                            ) : null}
                            <div style={{ fontSize: 10, color: "var(--pro-text-muted)", display: "flex", flexWrap: "wrap", gap: 6 }}>
                              <span>{lang === "zh" ? "支持参考图" : "supports references"}</span>
                              <span>·</span>
                              <span>{lang === "zh" ? "支持连续镜头" : "supports continuity"}</span>
                              <span>·</span>
                              <span>{lang === "zh" ? "多分镜" : "multi-shot"}</span>
                              <span>·</span>
                              <span>{lang === "zh" ? "风格一致" : "style consistency"}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  }
                  exportPanelSlot={
                    <div style={{ position: "fixed", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none", zIndex: -1 }}>
                      <ExportPanel
                        lang={lang}
                        project={safeProject}
                        projectLabel={fileLabel}
                        sceneIdx={sceneIdx}
                        platformId={savePlatformId}
                        openExportNonce={openExportNonce}
                        openExportAction={openExportAction}
                        promptExportNote=""
                        onPreparePromptExport={preparePromptExport}
                        onSettlePromptExport={settlePromptExport}
                        onPlatformChange={(id) => {
                          syncSavePlatform(id as SavePlatformId);
                          feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换平台" : "Platform changed");
                        }}
                        exportScope={proExportScope}
                        onExportScopeChange={(scope) => {
                          setProExportScope(scope);
                          feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换导出范围" : "Export scope changed");
                        }}
                        exportMode={proExportMode}
                        onExportModeChange={handleProExportModeChange}
                        selectedLayerId={selectedLayerId}
                        onJumpToConflict={(layerId) => {
                          if (layerId) setSelectedLayerId(layerId);
                        }}
                        onFeedbackMessage={(msg) => feedbackBarRef.current?.pushMessage(msg)}
                      />
                    </div>
                  }
                />
              </div>
            ) : (
              <>
          <div style={styles.center}>
            {/* Canvas tab bar (Figma-style browser tabs) */}
            <div style={styles.proCanvasTabBar}>
              <button
                type="button"
                className="pro-canvas-tab"
                data-active={currentSceneActiveAssetId === "canvas" ? true : undefined}
                style={{
                  ...styles.proCanvasTab,
                  ...(currentSceneActiveAssetId === "canvas" ? styles.proCanvasTabActive : null)
                }}
                onClick={() => setActiveProAsset(sceneAssetKey, "canvas")}
                title={lang === "zh" ? "画布" : "Canvas"}
              >
                <Layout size={14} style={{ marginRight: 6, opacity: 0.8 }} />
                {lang === "zh" ? "画布" : "Canvas"}
                {currentSceneActiveAssetId === "canvas" ? (
                  <div style={styles.proCanvasTabSeam} aria-hidden />
                ) : null}
              </button>
              {currentSceneAssets.map((asset, index) => {
                const tabLabel = asset.title?.trim() || proAssetLabel(asset.kind, index + 1);
                const isActive = currentSceneActiveAssetId === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    className="pro-canvas-tab"
                    data-active={isActive ? true : undefined}
                    style={{
                      ...styles.proCanvasTab,
                      ...(isActive ? styles.proCanvasTabActive : null)
                    }}
                    onClick={() => setActiveProAsset(sceneAssetKey, asset.id)}
                    title={tabLabel}
                  >
                    <ImageIcon size={14} style={{ marginRight: 6, opacity: 0.8 }} />
                    {tabLabel}
                    {isActive ? <div style={styles.proCanvasTabSeam} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <div style={styles.stageShell}>
              <div
                className={!currentSceneActiveAsset ? "pro-canvas-viewport" : undefined}
                style={styles.proCanvasWorkspace}
                data-view={!currentSceneActiveAsset ? "canvas" : "asset"}
              >
                {currentSceneActiveAsset ? (
                  <div style={styles.proAssetStage}>
                    <div style={styles.proAssetPreviewTop}>
                      <div style={styles.proAssetMeta}>
                        <span style={styles.proAssetMetaTitle}>{currentSceneActiveAsset.title}</span>
                        <span style={styles.proAssetMetaChip}>
                          {currentSceneActiveAsset.source === "hosted"
                            ? (lang === "zh" ? "平台生成" : "Hosted")
                            : (lang === "zh" ? "我的 API" : "My API")}
                        </span>
                        <span style={styles.proAssetMetaChip}>
                          {getPlatformLabel(currentSceneActiveAsset.strategyPlatformId, lang)}
                        </span>
                      </div>

                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          style={styles.proAssetMenuBtn}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setProAssetMenuId((prev) => (prev === currentSceneActiveAsset.id ? null : currentSceneActiveAsset.id))}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {proAssetMenuId === currentSceneActiveAsset.id ? (
                          <div style={styles.proAssetMenu} onPointerDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="pro-btn-ghost"
                              style={styles.proAssetMenuItem}
                              onClick={() => {
                                downloadProAsset(currentSceneActiveAsset);
                                setProAssetMenuId(null);
                              }}
                            >
                              {lang === "zh" ? "下载" : "Download"}
                            </button>
                            <button
                              type="button"
                              className="pro-btn-ghost"
                              style={styles.proAssetMenuItem}
                              onClick={() => {
                                setProAssetMenuId(null);
                                void generateProAsset(currentSceneActiveAsset.source);
                              }}
                            >
                              {lang === "zh" ? "继续生成" : "Generate Again"}
                            </button>
                            <button
                              type="button"
                              className="pro-btn-ghost"
                              style={{ ...styles.proAssetMenuItem, ...styles.proAssetMenuDanger }}
                              onClick={() => {
                                deleteProAsset(sceneAssetKey, currentSceneActiveAsset.id);
                              }}
                            >
                              {lang === "zh" ? "删除" : "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div style={styles.proAssetViewport}>
                      {currentSceneActiveAsset.kind === "video" && currentSceneActiveAsset.videoUrl ? (
                        <video
                          key={currentSceneActiveAsset.id}
                          src={currentSceneActiveAsset.videoUrl}
                          poster={currentSceneActiveAsset.posterUrl}
                          style={styles.proAssetVideo}
                          controls
                          playsInline
                        />
                      ) : currentSceneActiveAsset.imageUrl ? (
                        <img
                          src={currentSceneActiveAsset.imageUrl}
                          alt={currentSceneActiveAsset.title}
                          style={styles.proAssetImage}
                        />
                      ) : (
                        <div style={styles.proAssetEmpty}>
                          {lang === "zh" ? "结果暂不可预览" : "Preview unavailable"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Stage
                    className="spx-pro-stage"
                    project={safeProject}
                    lang={lang}
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
                )}

              </div>
            </div>

            {/* Feedback bar + output console placeholders: reserve space so canvas is one grid unit up. */}
            <FeedbackBar
              ref={feedbackBarRef}
              lang={lang}
              platformLabel={feedbackBarPlatformLabel}
              exportScopeLabel={feedbackBarScopeLabel}
              statusLabel={lang === "zh" ? "可生成" : "Ready"}
              conflicts={sceneConflicts}
            />
            <OutputConsole
              lang={lang}
              onGenerate={generateProAsset}
              generateBusy={proGenerateBusy}
              onCopyPrompt={handleCopyPrompt}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
            <PropsPanel
            topSection={
              <PromptMiniPreview
                lang={lang}
                prompt={promptForMiniPreview}
                collapsed={miniPreviewCollapsed}
                onToggleCollapse={() => setMiniPreviewCollapsed((v) => !v)}
                onCopyPrompt={handleCopyPrompt}
                onOpenExport={() => openExportPanel("open")}
                embedded
              />
            }
            lang={lang}
            scene={scene}
            selectedLayerId={selectedLayerId}
            project={safeProject}
            platformId={savePlatformId}
            onPlatformChange={(id) => syncSavePlatform(id as SavePlatformId)}
            exportMode={proExportMode}
            onExportModeChange={handleProExportModeChange}
            onUpdateProject={(p) => {
              updateProject(p);
              trackEditorChange("props", "update", {}, lang);
            }}
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
            bottomSlot={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {proGenerateHint ? (
                  <div style={{ ...styles.proGenerateToast, position: "relative", right: "auto", bottom: "auto" }}>{proGenerateHint}</div>
                ) : null}
                <div style={{ ...styles.proCanvasFooter, justifyContent: "center" }}>
                  <div style={styles.proGenerateHandle}>
                    <button
                      type="button"
                      className="pro-btn-ghost"
                      style={styles.proGenerateBtnSecondary}
                      onClick={() => void generateProAsset()}
                      disabled={proGenerateBusy}
                      title={lang === "zh" ? "主生成区在下方" : "Main generate is below"}
                    >
                      {proGenerateBusy
                        ? (lang === "zh" ? "生成中…" : "Generating…")
                        : (lang === "zh" ? "生成" : "Generate")}
                    </button>
                  </div>
                </div>
              </div>
            }
          />
          </div>

          <div style={{ position: "fixed", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none", zIndex: -1 }}>
            <ExportPanel
              lang={lang}
              project={safeProject}
              projectLabel={fileLabel}
              sceneIdx={sceneIdx}
              platformId={savePlatformId}
              openExportNonce={openExportNonce}
              openExportAction={openExportAction}
              promptExportNote=""
              onPreparePromptExport={preparePromptExport}
              onSettlePromptExport={settlePromptExport}
              onPlatformChange={(id) => {
                syncSavePlatform(id as SavePlatformId);
                feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换平台" : "Platform changed");
              }}
              exportScope={proExportScope}
              onExportScopeChange={(scope) => {
                setProExportScope(scope);
                feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换导出范围" : "Export scope changed");
              }}
              exportMode={proExportMode}
              onExportModeChange={handleProExportModeChange}
              selectedLayerId={selectedLayerId}
              onJumpToConflict={(layerId) => {
                if (layerId) setSelectedLayerId(layerId);
              }}
              onFeedbackMessage={(msg) => feedbackBarRef.current?.pushMessage(msg)}
            />
          </div>
              </>
            )}
          </div>
        </div>
      }

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
        lang={lang}
        user={accountUser}
        billingEnabled={billingRuntimeEnabled}
        billingNotice={billingNotice}
        creditsBalance={accountCredits}
        creditPacks={creditPacks}
        proPlan={proPlan}
        billingBusy={billingBusy}
        localTestBusy={resultBusy}
        localTestHint={billingLocalHint}
        localProviderStatus={{
          comfy: comfyStatus,
          draw: drawThingsStatus
        }}
        billingLegalAccepted={billingLegalAccepted}
        onClose={closeBillingPage}
        onOpenUpgrade={() => openBillingPage("upgrade")}
        onOpenCredits={() => openBillingPage("credits")}
        onProbeLocalProviders={() => {
          void (async () => {
            try {
              const { nextComfy, nextDraw } = await refreshLocalProviders();
              const comfyText = providerReadyText("comfyui", nextComfy);
              const drawText = providerReadyText("drawthings", nextDraw);
              setBillingLocalHint(`${comfyText} | ${drawText}`);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              setBillingLocalHint(
                lang === "zh"
                  ? `本地探测失败：${message}`
                  : `Local probing failed: ${message}`
              );
            }
          })();
        }}
        onRunLocalTest={(provider) => {
          void generateResultPlanLocalTest(provider);
        }}
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
            <div style={styles.modalTitle}>{lang === "zh" ? "Credits 不足" : "Not enough credits"}</div>
            <div style={styles.modalText}>{insufficientCreditsMessage || (lang === "zh" ? "Credits 不足，生成图像或视频需要更多 Credits。" : "You need more credits to generate images or videos.")}</div>
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
                disabled={!billingRuntimeEnabled}
                data-testid="insufficient-credits-buy"
              >
                {lang === "zh" ? "购买 Credits" : "Buy credits"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {templateCreditsInsufficientOpen ? (
        <div style={styles.modalMask} onMouseDown={() => setTemplateCreditsInsufficientOpen(false)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid="template-credits-insufficient-modal"
          >
            <div style={styles.modalTitle}>
              {lang === "zh" ? "Credits 不足" : "Not enough credits"}
            </div>
            <div style={styles.modalText}>
              {templateCreditsName
                ? (lang === "zh"
                    ? `此模板需要 ${templateCreditsNeeded} Credits，你当前余额不足。购买 Credits 后可继续使用。`
                    : `This template needs ${templateCreditsNeeded} Credits. Your balance is insufficient. Buy credits to continue.`)
                : (lang === "zh"
                    ? `此模板需要 ${templateCreditsNeeded} Credits，你当前余额不足。购买 Credits 后可继续使用。`
                    : `This template needs ${templateCreditsNeeded} Credits. Your balance is insufficient. Buy credits to continue.`)}
            </div>
            <div style={styles.modalBtns}>
              <button
                style={styles.modalBtnGhost}
                type="button"
                onClick={() => setTemplateCreditsInsufficientOpen(false)}
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                style={styles.modalBtn}
                type="button"
                onClick={() => {
                  setTemplateCreditsInsufficientOpen(false);
                  openBillingPage("credits");
                }}
                disabled={!billingRuntimeEnabled}
                data-testid="template-credits-buy"
              >
                {lang === "zh" ? "购买 Credits" : "Buy Credits"}
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
        billingEnabled={billingRuntimeEnabled}
        billingNotice={billingNotice}
        authStep={authStep}
        authEmail={authEmail}
        authPassword={authPassword}
        authCode={authCode}
        authHint={authHint}
        lastSentCode={lastSentCode}
        googleSignInEnabled={googleSignInEnabled}
        authLegalAccepted={authLegalAccepted}
        billingLegalAccepted={billingLegalAccepted}
        localComfyStatus={comfyStatus}
        localDrawStatus={drawThingsStatus}
        onRefreshLocalProviders={() => refreshLocalProviders().then(() => {})}
        onClose={() => {
          setAccountCenterOpen(false);
          setAuthHint("");
        }}
        onSectionChange={(nextSection) => {
          setAccountCenterSection(nextSection);
          if (nextSection === "auth") {
            setAuthHint("");
          }
        }}
        onAuthEmailChange={(value) => {
          setAuthEmail(value);
          if (authHint) setAuthHint("");
        }}
        onAuthPasswordChange={(value) => {
          setAuthPassword(value);
          if (authHint) setAuthHint("");
        }}
        onAuthCodeChange={(value) => {
          setAuthCode(value);
          if (authHint) setAuthHint("");
        }}
        onAuthLegalAcceptedChange={setAuthLegalAccepted}
        onBillingLegalAcceptedChange={setBillingLegalAccepted}
        onGoogleSignIn={() => void handleGoogleSignIn()}
        onPasswordSignIn={() => void handlePasswordSignIn()}
        onSendCode={() => void handleSendAuthCode()}
        onVerifyCode={() => void handleVerifyAuthCode()}
        onBackToEmail={() => {
          setAuthStep("email");
          setAuthCode("");
        }}
        onLogout={() => void handleLogout()}
        onPurchasePack={(packId) => void handlePurchaseCredits(packId)}
        onUpgradePro={() => void handleUpgradePro()}
        onOpenCustomerPortal={() => void handleOpenCustomerPortal()}
        onSaveApiCredentials={handleSaveApiCredentials}
      />

      <HelpModal
        open={helpCenterOpen}
        onClose={() => setHelpCenterOpen(false)}
        sectionId={helpCenterSection}
        setSectionId={setHelpCenterSection}
        lang={lang}
        viewportWidth={viewportWidth}
        feedbackProps={{
          feedbackText,
          setFeedbackText,
          feedbackSending,
          feedbackSent,
          onCopyTemplate: async () => {
            const text =
              feedbackText.trim() ||
              (lang === "zh"
                ? "【问题】\n【复现步骤】1) \n【期望】\n【实际】\n【环境】"
                : "[Issue]\n[Steps] 1)\n[Expected]\n[Actual]\n[Env]");
            await copyToClipboard(text);
            trackUiAction("feedback", "copy", "template", { len: text.length }, lang);
          },
          onSubmitFeedback: submitFeedback,
          supportChannel: PUBLIC_CONTACT_CHANNELS.support,
          businessChannel: PUBLIC_CONTACT_CHANNELS.business,
          systemMailbox: SYSTEM_NOTIFICATION_MAILBOX
        }}
      />
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
    background: "#000000",
    overflow: "hidden",
    position: "relative",
    isolation: "isolate"
  },
  appQuick: {
    background: "#000000"
  },
  appPro: {
    background: "var(--pro-bg)"
  },
  appBackdrop: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 0
  },
  appBackdropPro: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.008) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.012) 0%, rgba(0,0,0,0) 18%)"
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
    borderBottom: "none",
    background: "#000000",
    backdropFilter: "none",
    position: "relative",
    zIndex: 1300
  },
  topProjectDock: {
    position: "absolute",
    left: "calc(clamp(232px, 24vw, 320px) + 13px)",
    top: 13,
    zIndex: 31
  },
  topModeSwitch: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: 2,
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    marginRight: 8
  },
  topModeBtn: {
    minHeight: 30,
    padding: "0 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: UI_PALETTE.text.secondary,
    cursor: "pointer",
    fontSize: UI_TYPO.size12,
    fontWeight: 720,
    outline: "none"
  },
  topModeBtnOn: {
    background: "rgba(255,255,255,0.12)",
    color: UI_PALETTE.text.primary
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
  topAccountBtn: {
    border: "none",
    background: "transparent",
    color: "#f4fbff",
    fontSize: 14,
    fontWeight: 720,
    padding: 0,
    minHeight: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    flexShrink: 0,
    outline: "none"
  },
  topAccountAvatar: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.16)",
    overflow: "hidden",
    flexShrink: 0
  },
  topAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  topAvatarDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "rgba(248,252,255,0.92)"
  },
  topBtnText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 118
  },
  entryGuideMask: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.54)",
    backdropFilter: "blur(6px)"
  },
  entryGuideCard: {
    width: "min(520px, calc(100vw - 40px))",
    borderRadius: 16,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "linear-gradient(160deg, rgba(12,20,34,0.98), rgba(8,12,20,0.98))",
    boxShadow: "0 18px 42px rgba(0,0,0,0.44)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  entryGuideHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  entryGuideTitle: {
    fontSize: UI_TYPO.size16,
    fontWeight: 860,
    color: UI_PALETTE.text.primary
  },
  entryGuideClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${UI_COMMAND.border.default}`,
    background: UI_COMMAND.surface.default,
    color: UI_PALETTE.text.secondary,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  entryGuideDesc: {
    fontSize: UI_TYPO.size13,
    color: UI_PALETTE.text.secondary,
    lineHeight: 1.55
  },
  entryGuideActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  entryGuideBtn: {
    minHeight: 44,
    borderRadius: 12,
    border: `1px solid ${UI_COMMAND.border.default}`,
    background: UI_COMMAND.surface.default,
    color: UI_PALETTE.text.primary,
    fontSize: UI_TYPO.size13,
    fontWeight: 760,
    cursor: "pointer",
    padding: "0 10px"
  },
  entryGuideBtnPrimary: {
    border: `1px solid ${UI_COMMAND.border.accent}`,
    background: UI_COMMAND.surface.accent
  },
  entryGuideSkip: {
    minHeight: 30,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: UI_PALETTE.text.secondary,
    fontSize: UI_TYPO.size12,
    cursor: "pointer",
    justifySelf: "center"
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
    gridTemplateColumns: "clamp(232px, 24vw, 320px) minmax(0, 1fr) clamp(240px, 26vw, 344px)",
    gridTemplateRows: "minmax(0, 1fr)"
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
  proCanvasTabBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 1,
    height: 38,
    padding: "8px 8px 0",
    background: "#24262b",
    borderBottom: "1px solid #3a3f46",
    flexShrink: 0,
    zIndex: 10,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
  },
  proCanvasTab: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: "6px 6px 0 0",
    border: "1px solid transparent",
    borderBottom: "none",
    background: "#1a1c1f",
    color: "#9ca3af",
    cursor: "pointer",
    outline: "none",
    transition: "background 120ms, color 120ms, border-color 120ms"
  },
  proCanvasTabActive: {
    background: "#1f2125",
    border: "1px solid #3a3f46",
    borderBottomColor: "transparent",
    color: "#f59e0b",
    zIndex: 10
  },
  proCanvasTabSeam: {
    position: "absolute",
    bottom: -1,
    left: 0,
    width: "100%",
    height: 1,
    background: "#1f2125"
  },
  stageShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex"
  },
  /** Reserves space for FeedbackBar (80px) + output console so canvas shifts up. */
  centerFeedbackBarPlaceholder: {
    flexShrink: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column"
  },
  centerOutputConsolePlaceholder: {
    flexShrink: 0,
    height: 56,
    minHeight: 56,
    borderTop: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    fontSize: 11,
    color: "var(--pro-text-muted)"
  },
  proResultTab: {
    position: "relative",
    zIndex: 1,
    height: 28,
    minWidth: 72,
    maxWidth: 180,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px 6px 0 0",
    border: "1px solid var(--pro-border)",
    borderBottomColor: "transparent",
    background: "#1a1c1f",
    color: "var(--pro-text-muted)",
    fontSize: "var(--pro-font-xs)",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: -1
  },
  proResultTabOn: {
    border: "1px solid var(--pro-border)",
    borderBottomColor: "transparent",
    background: "var(--pro-bg)",
    color: "var(--pro-accent)",
    boxShadow: "0 -1px 0 0 var(--pro-bg)"
  },
  proResultTabTrigger: {
    paddingRight: 10
  },
  proCanvasTabMenu: {
    position: "absolute",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 160,
    maxHeight: 280,
    overflowY: "auto",
    padding: 6,
    borderRadius: "8px 8px 0 0",
    border: "1px solid var(--pro-border)",
    borderBottom: "none",
    background: "var(--pro-bg-panel)",
    boxShadow: "0 -6px 16px rgba(0,0,0,0.35)"
  },
  proCanvasTabMenuItem: {
    padding: "8px 14px",
    textAlign: "left",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--pro-text-muted)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  proCanvasTabMenuItemOn: {
    background: "var(--pro-hover)",
    color: "var(--pro-text-primary)"
  },
  proActionBtnPrimary: {
    minHeight: 36,
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "none",
    background: "var(--pro-accent)",
    color: "#1f2125",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
  },
  proSourceSelect: {
    width: 128,
    minWidth: 128,
    height: 36,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    fontSize: 12,
    fontWeight: 500,
    outline: "none"
  },
  proGenerateToast: {
    position: "absolute",
    right: 12,
    bottom: 46,
    zIndex: 40,
    maxWidth: 240,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    color: "var(--pro-text-primary)",
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.2,
    minHeight: "var(--pro-info-height)",
    maxHeight: "var(--pro-info-height)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
  },
  proCanvasWorkspace: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    paddingBottom: 0,
    background: "var(--pro-bg)",
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    backgroundPosition: "center center"
  },
  proCanvasFooterOutside: {
    position: "relative",
    marginTop: -1,
    padding: "0 12px 8px",
    background: "var(--pro-bg-panel)",
    borderTop: "1px solid var(--pro-border)"
  },
  proCanvasFooter: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    minHeight: "var(--pro-row-height)",
    pointerEvents: "auto"
  },
  proResultRailDock: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 2,
    minWidth: 0,
    flex: 1,
    maxWidth: "100%",
    minHeight: "var(--pro-row-height)",
    padding: 0,
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    pointerEvents: "auto"
  },
  proResultTabShoulder: {
    position: "absolute",
    top: -1,
    width: 14,
    height: 14,
    borderTop: `1px solid ${UI_PALETTE.border.default}`,
    background: "rgba(9,13,24,0)",
    pointerEvents: "none"
  },
  proResultTabShoulderLeft: {
    left: -13,
    borderLeft: `1px solid ${UI_PALETTE.border.default}`,
    borderTopLeftRadius: 14
  },
  proResultTabShoulderRight: {
    right: -13,
    borderRight: `1px solid ${UI_PALETTE.border.default}`,
    borderTopRightRadius: 14
  },
  proGenerateHandle: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    flexShrink: 0,
    minHeight: "var(--pro-row-height)",
    padding: 0,
    pointerEvents: "auto"
  },
  proGenerateBtn: {
    minWidth: 160,
    paddingLeft: 20,
    paddingRight: 20
  },
  /** Right-column generate entry: de-emphasized; main generate is in OutputConsole below */
  proGenerateBtnSecondary: {
    fontSize: 11,
    color: "var(--pro-text-muted)",
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 10
  },
  proPromptZone: {
    marginTop: 0,
    background: "var(--pro-bg-panel)",
    borderTop: "1px solid var(--pro-border)",
    minHeight: 100,
    display: "flex",
    flexDirection: "column",
    opacity: 0.96
  },
  proAssetStage: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    boxShadow: "none",
    overflow: "hidden"
  },
  proAssetPreviewTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderBottom: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)"
  },
  proAssetMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flexWrap: "wrap"
  },
  proAssetMetaTitle: {
    fontSize: "var(--pro-font-xs)",
    fontWeight: 600,
    color: "var(--pro-text-primary)"
  },
  proAssetMetaChip: {
    height: "var(--pro-info-height)",
    padding: "0 8px",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 4,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-muted)",
    fontSize: "var(--pro-font-3xs)",
    fontWeight: 500
  },
  proAssetMenuBtn: {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    cursor: "pointer"
  },
  proAssetMenu: {
    position: "absolute",
    top: 38,
    right: 0,
    zIndex: 6,
    width: 156,
    display: "grid",
    gap: 4,
    padding: 6,
    borderRadius: 14,
    border: "1px solid rgba(122,154,202,0.22)",
    background: "rgba(6,8,12,0.98)",
    boxShadow: "0 16px 32px rgba(0,0,0,0.42)"
  },
  proAssetMenuItem: {
    minHeight: 34,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    color: UI_PALETTE.text.primary,
    fontSize: UI_TYPO.size12,
    fontWeight: 760,
    cursor: "pointer",
    textAlign: "left"
  },
  proAssetMenuDanger: {
    color: "#ff8c8c"
  },
  proAssetViewport: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    background: "var(--pro-bg)"
  },
  proAssetImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 18,
    boxShadow: UI_EFFECT.panelShadow
  },
  proAssetVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: 18,
    background: "#000"
  },
  proAssetEmpty: {
    fontSize: UI_TYPO.size13,
    color: UI_PALETTE.text.secondary
  },

  // ---- dropdown menu ----
  menuMask: {
    position: "fixed",
    inset: 0,
    zIndex: 9998
  },
  workspaceSwitchShield: {
    position: "fixed",
    inset: 0,
    zIndex: 10020,
    background: "transparent",
    pointerEvents: "auto"
  },
  helpMenu: {
    position: "absolute",
    top: 62,
    right: 12,
    zIndex: 9999,
    width: "min(232px, calc(100vw - 24px))",
    display: "grid",
    gap: 2,
    padding: 6,
    borderRadius: 12,
    border: "1px solid #3a3f46",
    background: "#24262b",
    boxShadow: "0 24px 56px rgba(0,0,0,0.46)",
    overflow: "hidden",
  },
  helpMenuGroupLabel: {
    padding: "6px 10px 2px",
    fontSize: 10,
    fontWeight: 600,
    color: UI_PALETTE.text.secondary,
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  accountMenu: {
    position: "absolute",
    top: 62,
    right: 12,
    zIndex: 9999,
    width: "min(220px, calc(100vw - 24px))",
    display: "grid",
    gap: 2,
    padding: 6,
    borderRadius: 12,
    border: "1px solid #3a3f46",
    background: "#24262b",
    boxShadow: "0 24px 56px rgba(0,0,0,0.46)",
    overflow: "hidden",
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
  accountMenuItem: {
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
    borderRadius: 12,
    border: "1px solid #3a3f46",
    background: "#24262b",
    boxShadow: "0 24px 56px rgba(0,0,0,0.46)",
    padding: 16,
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
    borderRadius: 12,
    border: "1px solid #3a3f46",
    background: "#24262b",
    boxShadow: "0 24px 56px rgba(0,0,0,0.46)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  modalTitle: { fontWeight: 900, fontSize: UI_TYPO.size14, opacity: 0.96 },
  modalText: {
    marginTop: 8,
    fontSize: UI_TYPO.size12,
    lineHeight: 1.6,
    color: UI_PALETTE.text.primary,
    opacity: 0.96
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
    border: "1px solid rgba(245,158,11,0.7)",
    background: "rgba(245,158,11,0.12)",
    boxShadow: "0 0 0 2px rgba(245,158,11,0.18) inset"
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
    border: "1px solid rgba(245,158,11,0.22)",
    borderRadius: 10,
    background: "rgba(245,158,11,0.08)",
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
    border: "1px solid rgba(245,158,11,0.7)",
    background: "rgba(245,158,11,0.12)"
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
  libraryHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  libraryPath: {
    fontSize: 11,
    color: "#9ca3af",
    border: "1px solid #3a3f46",
    borderRadius: 6,
    padding: "3px 8px"
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
    background: "#24262b",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  resultToast: {
    position: "fixed",
    left: "50%",
    bottom: 24,
    transform: "translateX(-50%)",
    zIndex: 1200,
    maxWidth: 420,
    fontSize: 13,
    lineHeight: 1.4,
    border: `1px solid ${UI_PALETTE.border.active}`,
    borderRadius: UI_RADIUS.control,
    padding: "10px 14px",
    background: "#24262b",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    color: "#e5e7eb"
  },
  libraryList: {
    minHeight: 180,
    maxHeight: "min(50vh, 420px)",
    overflow: "auto",
    border: "1px solid #3a3f46",
    borderRadius: 8,
    background: "#1f2125",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6
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
    border: "1px solid #3a3f46",
    borderRadius: 8,
    padding: "8px 12px",
    background: "#24262b"
  },
  libraryItemName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#e5e7eb"
  },
  libraryItemOpenBtn: {
    padding: "5px 14px",
    borderRadius: 8,
    border: "1px solid #f59e0b",
    background: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0
  },
  libraryItemDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: "1px solid #3a3f46",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 900,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0
  },
  libraryImportBtn: {
    padding: "7px 16px",
    borderRadius: 8,
    border: "1px solid #3a3f46",
    background: "#1f2125",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600
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
    padding: "7px 16px",
    borderRadius: 8,
    border: "none",
    background: "#f59e0b",
    color: "#1f2125",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700
  },
  modalBtnGhost: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #3a3f46",
    background: "transparent",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600
  },
  modalBtnDanger: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,100,100,0.4)",
    background: "rgba(255,100,100,0.1)",
    color: "rgba(255,160,160,0.9)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600
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
