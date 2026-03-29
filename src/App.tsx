import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Lang } from "./i18n";
import { defaultProject, resolveSceneConfig, sanitizeProject } from "./model";
import type { Project, Scene, SceneCompiler, ShotPlan, TransitionType } from "./model";
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
import { getCanonicalPromptV3 } from "./utils/promptPipeline";
import { deleteRefBlob, getRefBlob, putRefBlob } from "./utils/localRefs";
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
import {
  generateByo,
  generationErrorMessage,
  type GenerationInput,
} from "./services/generationService";

import { ChevronDown, ChevronRight, CircleHelp, FolderOpen, Image as ImageIcon, Languages, Layout, MoreHorizontal } from "lucide-react";
import { CreditCard, Crown, Cpu, KeyRound, LogOut, UserRound, Wallet } from "lucide-react";
import { AccountCenterModal } from "./components/AccountCenterModal";
import { BillingOverlay } from "./components/billing/BillingOverlay";
import { QuickGeneratePanel } from "./features/quick-generate/QuickGeneratePanel";
import { GenerationGatePanel } from "./features/quick-generate/GenerationGatePanel";
import type { AccountCenterSection, ApiCredentialState, UserState } from "./types/account";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "./types/billing";
import {
  consumeOAuthErrorCode,
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
import { computeUnsavedChanges, runUnsavedChangesGuard, shouldBlockPageLeave } from "./services/unsavedChangesGuard";
import { createTemplateFromScene, saveUserTemplate } from "./lib/templateStore";
import {
  TemplateWorkspace,
  type TemplateWorkspaceState,
  DEFAULT_TEMPLATE_WORKSPACE_STATE,
  getTemplateMetadataFromIndex,
  getTemplateIndex,
  type TemplateIndex
} from "./features/template-workspace";
import {
  consumePendingTemplateIntent,
  consumePendingTemplateSubTask,
  findIntentByFamilyId,
  getTemplatesForSubTask,
  TEMPLATE_INTENTS,
  pickDefaultTemplateForIntent,
  saveLastTemplateIntent
} from "./features/template-workspace/model/templateIntent";
import { findTemplateBySlug } from "./features/template-workspace/utils/templateShare";
import { consumePendingSharePayload, encodeSharePayload, setPendingSharePayload, type SharePayload } from "./types/share";
import { applyTemplateCharge } from "./features/billing";
import { getTemplatePricingForTemplate } from "./pricing";
import { createProjectFromTemplate, createProjectFromUserTemplate, duplicateProject } from "./lib/projectCreation";
import { isTemplateOwned, markTemplateOwned } from "./lib/ownedTemplatesStore";
import { saveCurrentProjectAsTemplate } from "./lib/userTemplatesStore";
import type { UserPrivateTemplate } from "./lib/userTemplatesStore";
import { isUserPrivateTemplate } from "./features/template-workspace/components/TemplateCard";
import { FeedbackBar, OutputConsole, ProWorkspaceShell, PromptMiniPreview, WorkspaceLeftPanel, type FeedbackBarApi } from "./features/pro-workspace";
import { addToRecent, type TemplateWorkspaceItem, type ApplyTemplateMode } from "./data/templateWorkspaceData";
import type { ExportMode } from "./utils/exportViewModel";
import type { PromptExportScope } from "./types/export";
import { detectSceneConflicts } from "./utils/conflictRules";
import { canOpenCustomerPortal, canUseUnlimitedTemplates, getProAccessState } from "./utils/entitlement";
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
import { identifyUser as identifyPostHogUser, initPostHog, resetUser as resetPostHogUser, setPostHogEnabled } from "./services/posthog";
import { initSentry, setSentryTags, setSentryUser } from "./services/sentry";
import { UI_ACTION, UI_COMMAND, UI_EFFECT, UI_MENU, UI_PALETTE, UI_PANEL, UI_RADIUS, UI_SPACE, UI_TYPO } from "./uiTokens";

const API_PROVIDER_IDS = [
  "fal",
  "replicate",
  "runway",
  "pika",
  "luma",
  "stability",
  "fal_control",
  "replicate_control",
  "comfyui",
  "drawthings",
  "custom_api",
] as const;

type FSDirectoryHandle = any;
type LibraryEntry = { name: string; kind: "file" | "directory"; label: string };
type SavePlatformId = PlatformPresetId;
type SavePlatformPickMode = "save" | "save_as" | "save_all";
type ExportPanelOpenAction = "open" | "copy" | "package" | "prompt_txt" | "prompt_plus_refs";
type PendingTemplateSwitch = {
  indexOrItem: TemplateIndex | TemplateWorkspaceItem | UserPrivateTemplate;
  applyMode?: ApplyTemplateMode;
};
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
const FILE_RUNTIME_KEY = "sp_file_runtime_v1";
const HANDLE_KEY_PROJECT_DIR = "last_project_dir";
const HANDLE_KEY_EXPORT_DIR = "last_export_dir";
const HANDLE_KEY_PROJECT_FILE = "current_project_file";
const DEFAULT_PROJECT_DIR_LABEL = "Documents/ScenePilotix Projects";
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

type RecentProjectItem = {
  name: string;
  path: string;
  updatedAt: number;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
};

type FileRuntimeState = {
  lastProjectDirectory: string;
  lastExportDirectory: string;
  recentProjects: RecentProjectItem[];
  currentProjectFilePath: string;
};

type ProGenerationSource = "api" | "local_comfy" | "local_draw" | "hosted";

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

async function savePersistedHandle(key: string, handle: any): Promise<void> {
  if (getTestBridge()?.skipHandlePersistence) return;
  const db = await openLibDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readwrite");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.put(handle, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function loadPersistedHandle(key: string): Promise<any | null> {
  if (getTestBridge()?.skipHandlePersistence) return null;
  const db = await openLibDb();
  return await new Promise<any | null>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readonly");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function loadFileRuntimeState(): FileRuntimeState {
  try {
    const raw = localStorage.getItem(FILE_RUNTIME_KEY);
    if (!raw) {
      return {
        lastProjectDirectory: DEFAULT_PROJECT_DIR_LABEL,
        lastExportDirectory: "",
        recentProjects: [],
        currentProjectFilePath: ""
      };
    }
    const parsed = JSON.parse(raw) as Partial<FileRuntimeState>;
    const recent = Array.isArray(parsed.recentProjects)
      ? parsed.recentProjects
          .filter((item): item is RecentProjectItem => !!item && typeof item.path === "string" && typeof item.name === "string")
          .slice(0, 30)
      : [];
    return {
      lastProjectDirectory:
        typeof parsed.lastProjectDirectory === "string" && parsed.lastProjectDirectory.trim()
          ? parsed.lastProjectDirectory.trim()
          : DEFAULT_PROJECT_DIR_LABEL,
      lastExportDirectory: typeof parsed.lastExportDirectory === "string" ? parsed.lastExportDirectory.trim() : "",
      recentProjects: recent,
      currentProjectFilePath: typeof parsed.currentProjectFilePath === "string" ? parsed.currentProjectFilePath.trim() : ""
    };
  } catch {
    return {
      lastProjectDirectory: DEFAULT_PROJECT_DIR_LABEL,
      lastExportDirectory: "",
      recentProjects: [],
      currentProjectFilePath: ""
    };
  }
}

function persistFileRuntimeState(next: FileRuntimeState) {
  try {
    localStorage.setItem(FILE_RUNTIME_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function basenameWithoutExt(name: string) {
  return String(name || "").replace(/\.[^.]+$/, "").trim();
}

function joinPath(dir: string, fileName: string) {
  const d = String(dir || "").trim().replace(/[\\/]+$/, "");
  const f = String(fileName || "").trim().replace(/^[\\/]+/, "");
  if (!d) return f;
  return `${d}/${f}`;
}

function dirnameFromPath(path: string) {
  const cleaned = String(path || "").trim().replace(/[\\/]+$/, "");
  if (!cleaned) return "";
  const idx = Math.max(cleaned.lastIndexOf("/"), cleaned.lastIndexOf("\\"));
  if (idx <= 0) return "";
  return cleaned.slice(0, idx);
}

const ONBOARDING_KEY = "sp_onboarding_done";
const SAVE_PLATFORM_KEY = "sp_save_prompt_platform";
const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";
const SIGNIN_QUERY_KEY = "signin";
const REDIRECT_QUERY_KEY = "redirect";
const AUTH_POST_LOGIN_REDIRECT_KEY = "sp_auth_post_login_redirect_v1";
const SKIP_ONBOARDING_ONCE_KEY = "sp_skip_onboarding_once_v1";

function normalizePostAuthRedirect(input: string | null | undefined): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (typeof window === "undefined") return "";
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return "";
    const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!target.startsWith("/")) return "";
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

function isOAuthCallbackBootstrap(url: URL) {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  return (
    String(url.searchParams.get("auth_provider") || "").toLowerCase() === "google"
    || Boolean(url.searchParams.get("code"))
    || Boolean(url.searchParams.get("error"))
    || Boolean(url.searchParams.get("error_code"))
    || Boolean(hashParams.get("access_token"))
    || Boolean(hashParams.get("refresh_token"))
  );
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
  const runtimeStateInit = useMemo(() => loadFileRuntimeState(), []);
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
  const [proGenerationSource, setProGenerationSource] = useState<ProGenerationSource>("api");
  const [proGenerateBusy, setProGenerateBusy] = useState(false);
  const [proGenerateHint, setProGenerateHint] = useState("");
  const [proAdvancedSettingsOpen, setProAdvancedSettingsOpen] = useState(false);
  const [proProfileDropdownOpen, setProProfileDropdownOpen] = useState(false);
  const [proWorkspaceSection, setProWorkspaceSection] = useState<import("./features/pro-workspace").ProWorkspaceSection>("shot");
  const proProfileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [proAssetsBySceneId, setProAssetsBySceneId] = useState<Record<string, ProGeneratedAsset[]>>({});
  const [proActiveAssetBySceneId, setProActiveAssetBySceneId] = useState<Record<string, string>>({});
  const [proAssetMenuId, setProAssetMenuId] = useState<string | null>(null);

  const [fileHandle, setFileHandle] = useState<any | null>(null);
  const [projectFilePath, setProjectFilePath] = useState<string>(runtimeStateInit.currentProjectFilePath || "");
  const [lastProjectDirectory, setLastProjectDirectory] = useState<string>(runtimeStateInit.lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL);
  const [lastExportDirectory, setLastExportDirectory] = useState<string>(runtimeStateInit.lastExportDirectory || "");
  const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>(runtimeStateInit.recentProjects || []);
  const [lastProjectDirHandle, setLastProjectDirHandle] = useState<any | null>(null);
  const [lastExportDirHandle, setLastExportDirHandle] = useState<any | null>(null);
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
  const [templateSwitchConfirmOpen, setTemplateSwitchConfirmOpen] = useState(false);
  const [templateSwitchConfirmBusy, setTemplateSwitchConfirmBusy] = useState(false);
  const [pendingTemplateSwitch, setPendingTemplateSwitch] = useState<PendingTemplateSwitch | null>(null);
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
  const [generationGateOpen, setGenerationGateOpen] = useState(false);
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

  const quickRefInputRef = useRef<HTMLInputElement | null>(null);
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
    ? ""
    : (lang === "zh" ? "登录 / 注册" : "Sign In / Sign Up");
  const proAccess = useMemo(() => getProAccessState(accountUser), [accountUser]);
  const hasProAccess = proAccess.hasPro;
  const canUseByoAccess = hasProAccess;
  const showDevProBadge = import.meta.env.DEV && proAccess.source === "dev_override";

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

  function upsertRecentProject(item: RecentProjectItem) {
    setRecentProjects((prev) => {
      const next = [item, ...prev.filter((p) => p.path !== item.path)].slice(0, 30);
      return next;
    });
  }

  function rememberProjectDirectory(label: string, handle?: any | null) {
    const next = (label || DEFAULT_PROJECT_DIR_LABEL).trim();
    setLastProjectDirectory(next);
    if (handle) {
      setLastProjectDirHandle(handle);
      void savePersistedHandle(HANDLE_KEY_PROJECT_DIR, handle);
    }
  }

  function rememberExportDirectory(label: string, handle?: any | null) {
    const next = (label || "").trim();
    if (!next) return;
    setLastExportDirectory(next);
    if (handle) {
      setLastExportDirHandle(handle);
      void savePersistedHandle(HANDLE_KEY_EXPORT_DIR, handle);
    }
  }

  function clearCurrentFileBinding() {
    setFileHandle(null);
    setProjectFilePath("");
  }

  function rememberCurrentFileBinding(nextHandle: any, nextPath: string) {
    setFileHandle(nextHandle ?? null);
    setProjectFilePath(nextPath || "");
    if (nextHandle) {
      void savePersistedHandle(HANDLE_KEY_PROJECT_FILE, nextHandle);
    }
  }

  function openExportPanel(action: ExportPanelOpenAction) {
    setOpenExportAction(action);
    setOpenExportNonce((v) => v + 1);
  }

  /** Export actions stay in ExportPanel pipeline; copy prompt is independent. */
  function handleCopyPrompt() {
    void (async () => {
      const text = promptForMiniPreview.trim();
      if (!text) {
        feedbackBarRef.current?.pushMessage(lang === "zh" ? "暂无可复制提示词" : "No prompt to copy");
        return;
      }
      const ok = await copyToClipboard(text);
      feedbackBarRef.current?.pushMessage(
        ok ? (lang === "zh" ? "已复制当前提示词" : "Current prompt copied")
          : (lang === "zh" ? "复制失败，请重试" : "Copy failed, please retry")
      );
      trackExportFlow("copy_prompt", { result: ok ? "success" : "fail" }, lang);
    })();
  }
  function handleExportTxt() {
    rememberExportDirectory(dirnameFromPath(projectFilePath) || lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL);
    openExportPanel("prompt_txt");
  }
  function handleExportZip() {
    rememberExportDirectory(dirnameFromPath(projectFilePath) || lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL);
    openExportPanel("prompt_plus_refs");
  }
  function handleExportProject() {
    rememberExportDirectory(dirnameFromPath(projectFilePath) || lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL);
    openExportPanel("open");
  }

  async function handleQuickPickReference() {
    quickRefInputRef.current?.click();
  }

  async function handleQuickReferenceChange(file: File | null) {
    if (!file) return;
    const nextRef = {
      id: `bgref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      mime: file.type,
      size: file.size,
      updatedAt: Date.now(),
    };
    await putRefBlob(nextRef.id, file);
    const prev = scene.backgroundRef;
    if (prev?.id) {
      try {
        await deleteRefBlob(prev.id);
      } catch {
        // noop
      }
    }
    updateScene({ ...scene, backgroundRef: nextRef });
    feedbackBarRef.current?.pushMessage(lang === "zh" ? "已更新参考图" : "Reference updated");
  }

  function openQuickGenerationGate() {
    setGenerationGateOpen(true);
  }

  function handleProExportModeChange(mode: ExportMode) {
    setProExportMode(mode);
    updateProject({
      ...project,
      meta: { ...project.meta, proExportMode: mode }
    });
  }

  function enterProWorkspace() {
    if (!hasProAccess) {
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

  useEffect(() => {
    persistFileRuntimeState({
      lastProjectDirectory,
      lastExportDirectory,
      recentProjects,
      currentProjectFilePath: projectFilePath
    });
  }, [lastProjectDirectory, lastExportDirectory, recentProjects, projectFilePath]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projDir, expDir, file] = await Promise.all([
          loadPersistedHandle(HANDLE_KEY_PROJECT_DIR),
          loadPersistedHandle(HANDLE_KEY_EXPORT_DIR),
          loadPersistedHandle(HANDLE_KEY_PROJECT_FILE)
        ]);
        if (cancelled) return;
        if (projDir) setLastProjectDirHandle(projDir);
        if (expDir) setLastExportDirHandle(expDir);
        if (file && projectFilePath) setFileHandle(file);
      } catch {
        // ignore persisted handle load failures
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectFilePath]);

  const emitEvent = useCallback((
    event: "ui_action" | "project_flow" | "editor_change" | "export_flow",
    props: Record<string, any>,
    eventLang: Lang = lang
  ) => {
    if (!isTelemetryOn()) return;
    track(event, {
      ...props,
      pro_access_source: proAccess.source,
      is_dev_pro_override: proAccess.isDevOverride,
      is_real_paid_pro: accountUser?.tier === "pro"
    }, eventLang);
  }, [lang, proAccess.source, proAccess.isDevOverride, accountUser?.tier]);
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
  /** Prompt for Mini Preview and copy path: canonical V3 only. */
  const promptForMiniPreview = useMemo(() => {
    try {
      return getCanonicalPromptV3({
        project: { ...safeProject, scenes: [scene] },
        lang
      }).trim();
    } catch {
      return "";
    }
  }, [safeProject, scene, lang]);
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
  const hasUnsavedLibraryChanges = useMemo(
    () => computeUnsavedChanges(currentLibrarySnapshot, lastLibrarySavedSnapshot),
    [currentLibrarySnapshot, lastLibrarySavedSnapshot]
  );

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldBlockPageLeave(hasUnsavedLibraryChanges)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedLibraryChanges]);

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
    const persistedSource = source === "hosted" ? "api" : source;
    setProGenerationSource(persistedSource);
    saveGenerationPreferences(accountUser?.id ?? null, { lastProviderMode: persistedSource });
    setProGenPrefs((prev) => ({ ...prev, lastProviderMode: persistedSource }));
  };

  const currentGenProfile = currentProfileForMedia(proGenPrefs, mediaMode) as GenerationProfileId;
  const videoSeconds = Math.max(1, Math.ceil(Number(scene?.duration_s) || 5));
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
    initPostHog();
    initSentry();

    // ✅ 默认开启埋点（你若要默认关闭：改成 setTelemetryOptIn(false)）
    try {
      const v = localStorage.getItem("spx_telemetry_on");
      if (v == null) setTelemetryOptIn(true);
    } catch {
      // Ignore localStorage access failures (privacy mode / blocked storage).
    }

    // ✅ 新会话
    newSession();
    setPostHogEnabled(isTelemetryOn());
    installGlobalErrorHooks(lang);

    if (isTelemetryOn()) {
      trackProjectFlow("app_open", { app: "ScenePilotix", ver: "1.05" }, lang);

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
    setSentryTags({
      workspace: "pro",
      media_mode: mediaMode,
      generation_source: proGenerationSource
    });
  }, [mediaMode, proGenerationSource]);

  useEffect(() => {
    if (!accountUser?.id) {
      resetPostHogUser();
      setSentryUser(null);
      return;
    }

    const username = accountUser.email?.split("@")[0] || "user";
    identifyPostHogUser(accountUser.id, {
      email: accountUser.email,
      tier: accountUser.tier,
      workspace: "pro"
    });
    setSentryUser({
      id: accountUser.id,
      email: accountUser.email,
      username
    });
  }, [accountUser?.email, accountUser?.id, accountUser?.tier]);

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
    const preferred = creds.defaultProvider === "runway" || creds.defaultProvider === "fal"
      ? creds.defaultProvider
      : ordered[0];
    const candidates = [preferred, ...ordered.filter((item) => item !== preferred)];
    for (const provider of candidates) {
      const config = creds[provider];
      if (config?.enabled && config.mode === "personal" && config.apiKey.trim()) return provider;
    }
    return null;
  }

  function resolveProGenerationPlatformId(source: ProGenerationSource, nextMediaMode: "image" | "video"): SavePlatformId {
    if (source === "api") {
      const provider = resolveByoProviderForMedia(nextMediaMode);
      if (provider === "runway") return "runway";
      if (provider === "fal") return "fal";
    }
    if (source === "local_comfy" || source === "local_draw") {
      return savePlatformId;
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

    const normalizedSource: Exclude<ProGenerationSource, "hosted"> =
      requestedSource === "hosted" ? "api" : requestedSource;

    if (!accountUser) {
      openAccountCenter("auth");
      return;
    }
    if (!canUseByoAccess) {
      openAccountCenter("pro");
      return;
    }
    if (normalizedSource === "api" && !resolveByoProviderForMedia(mediaMode)) {
      setProGenerateHint(lang === "zh" ? "请先在账户中心连接 API" : "Connect your API first in Account");
      openAccountCenter("api");
      return;
    }
    if (normalizedSource === "local_comfy" && comfyStatus.state !== "ready") {
      setProGenerateHint(lang === "zh" ? "请先在账户中心连接 ComfyUI" : "Connect ComfyUI first in Account");
      openAccountCenter("api");
      return;
    }
    if (normalizedSource === "local_draw") {
      if (mediaMode !== "image") {
        setProGenerateHint(lang === "zh" ? "Draw Things 当前仅支持图片" : "Draw Things currently supports image only");
        return;
      }
      if (drawThingsStatus.state !== "ready") {
        setProGenerateHint(lang === "zh" ? "请先在账户中心连接 Draw Things" : "Connect Draw Things first in Account");
        openAccountCenter("api");
        return;
      }
    }

    const strategyPlatformId = resolveProGenerationPlatformId(normalizedSource, mediaMode);
    const prompt = buildScenePromptText(scene, strategyPlatformId);
    const resolution = aspectRatioToResolution(scene?.aspectRatio, mediaMode);
    const seed = 101 + currentSceneAssets.length;
    const startMs = Date.now();

    setProGenerateBusy(true);
    setProAssetMenuId(null);

    try {
      // ── Generation dispatch ───────────────────────────────────────
      const genInput: GenerationInput = {
        prompt,
        resolution,
        mediaMode,
        seed,
        durationSeconds: mediaMode === "video" ? Math.max(1, Math.ceil(Number(scene?.duration_s) || 5)) : undefined,
        qualityTier: currentGenProfile as any,
      };

      let genResult: { kind: "image" | "video"; url: string; posterUrl?: string; ownedUrls: string[] };

      if (normalizedSource === "api") {
        if (!accountApiCredentials) throw new Error("byo_api_key_missing");
        const result = await generateByo(genInput, accountApiCredentials);
        genResult = { kind: result.kind, url: result.url, posterUrl: result.posterUrl, ownedUrls: result.ownedUrls };
      } else if (normalizedSource === "local_comfy") {
        if (mediaMode === "video") {
          const anchor = await buildSceneAnchorImage(prompt, resolution, seed);
          const localCfg = loadLocalProviderConfig();
          const durationSeconds = Math.max(1, Math.ceil(Number(scene?.duration_s) || 5));
          const result = await runComfyUiVideoPreview({
            prompt,
            anchorImageUrl: anchor.url,
            resolution,
            seed,
            baseUrls: defaultComfyUiBaseUrls(),
            steps: localCfg.comfySteps,
            cfg: localCfg.comfyCfg,
            frameCount: Math.max(21, durationSeconds * 12)
          });
          genResult = {
            kind: "video",
            url: result.videoUrl,
            posterUrl: result.posterUrl,
            ownedUrls: [result.videoUrl, ...anchor.ownedUrls]
          };
        } else {
          const localCfg = loadLocalProviderConfig();
          const result = await runComfyUiImage({
            prompt,
            resolution,
            seed,
            baseUrls: defaultComfyUiBaseUrls(),
            preferredCheckpoint: comfyStatus.checkpoint,
            steps: localCfg.comfySteps,
            cfg: localCfg.comfyCfg
          });
          genResult = { kind: "image", url: result.imageUrl, ownedUrls: [result.imageUrl] };
        }
      } else {
        const localCfg = loadLocalProviderConfig();
        const result = await runDrawThingsTxt2Img({
          prompt,
          resolution,
          seed,
          baseUrls: defaultDrawThingsBaseUrls(),
          steps: localCfg.drawSteps,
          guidanceScale: localCfg.drawGuidance
        });
        genResult = { kind: "image", url: result.imageUrl, ownedUrls: [result.imageUrl] };
      }

      // ── Append result to canvas tab ───────────────────────────────
      if (genResult.kind === "image") {
        const imageCount = currentSceneAssets.filter((item) => item.kind === "image").length + 1;
        appendProAsset(sceneAssetKey, {
          id: makeProAssetId("image"),
          sceneId: sceneAssetKey,
          kind: "image",
          title: proAssetLabel("image", imageCount),
          prompt,
          source: normalizedSource,
          strategyPlatformId,
          imageUrl: genResult.url,
          ownedUrls: genResult.ownedUrls,
          createdAt: new Date().toISOString()
        });
      } else {
        const videoCount = currentSceneAssets.filter((item) => item.kind === "video").length + 1;
        appendProAsset(sceneAssetKey, {
          id: makeProAssetId("video"),
          sceneId: sceneAssetKey,
          kind: "video",
          title: proAssetLabel("video", videoCount),
          prompt,
          source: normalizedSource,
          strategyPlatformId,
          videoUrl: genResult.url,
          posterUrl: genResult.posterUrl,
          ownedUrls: genResult.ownedUrls,
          createdAt: new Date().toISOString()
        });
      }

      const latencyMs = Date.now() - startMs;
      trackProjectFlow("pro_generate", {
        generation_mode: normalizedSource,
        generation_profile: currentGenProfile,
        provider: strategyPlatformId,
        credits_charged: 0,
        success: true,
        latency_ms: latencyMs,
      }, lang);

      setProGenerateHint(
        normalizedSource === "api"
          ? (lang === "zh" ? "已用我的 API 生成结果" : "Generated with your API")
          : normalizedSource === "local_comfy"
            ? (lang === "zh" ? "已用 ComfyUI 生成结果" : "Generated with ComfyUI")
            : (lang === "zh" ? "已用 Draw Things 生成结果" : "Generated with Draw Things")
      );
    } catch (error) {
      const latencyMs = Date.now() - startMs;
      trackProjectFlow("pro_generate", {
        generation_mode: normalizedSource,
        generation_profile: currentGenProfile,
        provider: strategyPlatformId,
        credits_charged: 0,
        success: false,
        latency_ms: latencyMs,
        error: error instanceof Error ? error.message : String(error),
      }, lang);
      setProGenerateHint(generationErrorMessage(error, lang));
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
    if (section === "local") section = "api";
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

  function nextUntitledProjectName() {
    const base = lang === "zh" ? "未命名项目" : "Untitled Project";
    const names = new Set<string>([
      ...(recentProjects ?? []).map((item) => String(item.name || "").trim()),
      String(project?.name || "").trim(),
      String(fileLabel || "").trim()
    ].filter(Boolean));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n += 1;
    return `${base} ${n}`;
  }

  function nextTemplateProjectName(templateDisplayName: string) {
    const base = String(templateDisplayName || "").trim() || (lang === "zh" ? "模板项目" : "Template Project");
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^${esc}\\s+(\\d{2})$`);
    let max = 0;
    const names = [
      ...(recentProjects ?? []).map((item) => String(item.name || "").trim()),
      String(project?.name || "").trim(),
      String(fileLabel || "").trim()
    ];
    for (const name of names) {
      const hit = name.match(re);
      if (!hit) continue;
      const num = Number.parseInt(hit[1], 10);
      if (Number.isFinite(num)) max = Math.max(max, num);
    }
    const next = max + 1;
    return `${base} ${String(next).padStart(2, "0")}`;
  }

  /** Use Template = always create a new project (never append). Market: pricing resolver; user_private: free. */
  async function applyTemplateFromWorkspaceCore(
    indexOrItem: TemplateIndex | TemplateWorkspaceItem | UserPrivateTemplate,
    _applyMode?: ApplyTemplateMode
  ) {
    if (indexOrItem && isUserPrivateTemplate(indexOrItem)) {
      const userTpl = indexOrItem as UserPrivateTemplate;
      const newProject = {
        ...createProjectFromUserTemplate(userTpl),
        name: nextTemplateProjectName(userTpl.name || (lang === "zh" ? "我的模板" : "My Template"))
      };
      updateProject(newProject);
      setSceneIdx(0);
      setSelectedLayerId(null);
      const name = (newProject as Project & { name?: string }).name ?? defaultProjectName(lang);
      setLabelPersist(name);
      clearCurrentFileBinding();
      setIsTemplateWorkspaceOpen(false);
      setTemplateWorkspaceState((s) => ({ ...s, isQuickModeActive: true, quickModeDismissed: false }));
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已应用模板" : "Template applied");
      return;
    }

    try {
      const index: TemplateIndex | null =
        "familyId" in indexOrItem
          ? (indexOrItem as TemplateIndex)
          : (() => {
              const item = indexOrItem as TemplateWorkspaceItem;
              return getTemplateIndex().find((t) => t.id === item.id) ?? null;
            })();

      if (!index) return;
      if ((index as any).isEnabled !== true) {
        feedbackBarRef.current?.pushMessage(lang === "zh" ? "该模板已冻结，不可应用" : "This template is frozen and cannot be applied");
        return;
      }

      const meta = getTemplateMetadataFromIndex(index);
      addToRecent(meta.id);

      const pricing = await getTemplatePricingForTemplate(index.id);
      if (import.meta.env?.DEV && pricing.debugReasons?.length) {
        console.log("[template pricing]", index.id, pricing.debugReasons);
      }

      const owned = Boolean(accountUser && isTemplateOwned(accountUser.id, index.id));
      const freeOrUnlimited = pricing.creditPrice <= 0 || canUseUnlimitedTemplates(accountUser);

      if (!owned && pricing.accessTier === "pro_credits" && !hasProAccess) {
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
      const templateDisplayName = lang === "zh" ? (index.nameZh || index.nameEn) : (index.nameEn || index.nameZh);
      newProject = { ...newProject, name: nextTemplateProjectName(templateDisplayName) };

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
      setLabelPersist(name);
      clearCurrentFileBinding();
      setIsTemplateWorkspaceOpen(false);
      setTemplateWorkspaceState((s) => ({ ...s, isQuickModeActive: true, quickModeDismissed: false }));
      feedbackBarRef.current?.pushMessage(lang === "zh" ? "已应用模板" : "Template applied");
    } catch (error) {
      console.error("[template apply failed]", error);
      feedbackBarRef.current?.pushMessage(
        lang === "zh" ? "模板应用失败，请稍后重试或更换模板。" : "Failed to apply template. Please retry or try another template."
      );
    }
  }

  async function handleUseTemplateFromWorkspace(
    indexOrItem: TemplateIndex | TemplateWorkspaceItem | UserPrivateTemplate,
    applyMode?: ApplyTemplateMode
  ) {
    const guardResult = await runUnsavedChangesGuard({
      hasUnsavedChanges: hasUnsavedLibraryChanges,
      confirmSaveFirst: () =>
        window.confirm(
          lang === "zh"
            ? "当前项目有未保存改动。点击“确定”先保存当前项目，再切换到新模板。"
            : "Current project has unsaved changes. Click OK to save before switching template."
        ),
      runSave: async () => await (runProjectAction("save") as Promise<boolean>),
      confirmDiscard: () =>
        window.confirm(
          lang === "zh"
            ? "是否放弃未保存改动并切换模板？"
            : "Discard unsaved changes and switch template?"
        ),
    });
    if (!guardResult.allowed) {
      return;
    }
    await applyTemplateFromWorkspaceCore(indexOrItem, applyMode);
  }

  async function applyPendingTemplateSwitchDirectly() {
    if (!pendingTemplateSwitch) return;
    const pending = pendingTemplateSwitch;
    setTemplateSwitchConfirmOpen(false);
    setPendingTemplateSwitch(null);
    await applyTemplateFromWorkspaceCore(pending.indexOrItem, pending.applyMode);
  }

  async function applyPendingTemplateSwitchAfterSave() {
    if (!pendingTemplateSwitch) return;
    setTemplateSwitchConfirmBusy(true);
    try {
      const maybe = runProjectAction("save");
      const ok = typeof maybe === "object" && typeof (maybe as Promise<unknown>).then === "function"
        ? await (maybe as Promise<boolean>)
        : false;
      if (!ok) return;
      const pending = pendingTemplateSwitch;
      setTemplateSwitchConfirmOpen(false);
      setPendingTemplateSwitch(null);
      await applyTemplateFromWorkspaceCore(pending.indexOrItem, pending.applyMode);
    } finally {
      setTemplateSwitchConfirmBusy(false);
    }
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
    if (code.includes("google_pkce_verifier_missing")) {
      return lang === "zh" ? "Google 登录会话已失效，请重试。" : "Google sign-in session expired. Please retry.";
    }
    if (code.includes("google_oauth_exchange_failed")) {
      return lang === "zh" ? "Google 登录回调失败，请重试。" : "Google callback exchange failed. Please retry.";
    }
    if (code.includes("access_denied")) {
      return lang === "zh" ? "你取消了 Google 登录。" : "Google sign-in was canceled.";
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
    const devOverrideNotice = showDevProBadge
      ? (lang === "zh" ? "当前为开发者 Pro 覆盖，仅影响本地权限判断，不代表真实订阅。" : "Developer Pro override is active locally. Real subscription state is unchanged.")
      : "";
    if (!BILLING_ENABLED) {
      const base = lang === "zh" ? "支付通道即将上线，暂不可购买或开通。" : "Billing is coming soon. Purchases are temporarily unavailable.";
      return [base, devOverrideNotice].filter(Boolean).join(" ");
    }
    if (BILLING_LIVE_BLOCKED) {
      const base = lang === "zh" ? "当前环境已启用支付保护：禁止 live 扣费，请使用 sandbox。" : "Live billing is blocked in this environment. Use sandbox billing only.";
      return [base, devOverrideNotice].filter(Boolean).join(" ");
    }
    return devOverrideNotice;
  }, [lang, showDevProBadge]);

  function requestProAccess(section: AccountCenterSection = "pro") {
    if (hasProAccess) return enterProWorkspace();
    openAccountCenter(section);
    return false;
  }

  async function handleSendAuthCode() {
    if (authBusy) return;
    if (!authLegalAccepted) {
      setAuthHint(
        lang === "zh"
          ? "请先勾选并同意服务协议和隐私协议。"
          : "Please accept the Terms and Privacy before continuing."
      );
      return;
    }
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
    if (!authLegalAccepted) {
      setAuthHint(
        lang === "zh"
          ? "请先勾选并同意服务协议和隐私协议。"
          : "Please accept the Terms and Privacy before continuing."
      );
      return;
    }
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
    if (!authLegalAccepted) {
      setAuthHint(
        lang === "zh"
          ? "请先勾选并同意服务协议和隐私协议。"
          : "Please accept the Terms and Privacy before continuing."
      );
      return;
    }
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
    if (!accountUser || !canUseByoAccess) return;
    const current = getApiCredentials(accountUser.id);
    const now = new Date().toISOString();
    const nextWithStatus = API_PROVIDER_IDS.reduce((acc, providerId) => {
      const nextConfig = next[providerId];
      const currentConfig = current[providerId];
      const effectiveApiKey =
        nextConfig.mode === "personal"
          ? (nextConfig.enabled
              ? (nextConfig.apiKey?.trim() ? nextConfig.apiKey : currentConfig.apiKey)
              : "")
          : "";
      acc[providerId] = {
        ...nextConfig,
        apiKey: effectiveApiKey,
        status: nextConfig.mode === "personal" && nextConfig.enabled
          ? (effectiveApiKey ? "connected" : "invalid_key")
          : null,
        lastCheckedAt: nextConfig.mode === "personal" && nextConfig.enabled ? now : null,
        updatedAt: now
      };
      return acc;
    }, { ...next } as ApiCredentialState);
    const withStatus: ApiCredentialState = {
      ...nextWithStatus,
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
    const fallbackExportDir = dirnameFromPath(projectFilePath) || lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL;
    if (fallbackExportDir) {
      setLastExportDirectory(fallbackExportDir);
    }
    return { allowed: true };
  }, [accountUser, projectFilePath, lastProjectDirectory]);

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

  useEffect(() => {
    const code = consumeOAuthErrorCode();
    if (!code) return;
    setAuthHint(authErrorText(code));
    setAccountCenterSection("auth");
    setAccountCenterOpen(true);
  }, [lang]);

  // Handle /signin -> /app?signin=1&redirect=... bootstrap in-app.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const signinRaw = String(url.searchParams.get(SIGNIN_QUERY_KEY) || "").trim().toLowerCase();
    const wantsSignin = ["1", "true", "yes"].includes(signinRaw);
    const oauthCallback = isOAuthCallbackBootstrap(url);
    const redirectRaw = url.searchParams.get(REDIRECT_QUERY_KEY);
    const redirectTarget = normalizePostAuthRedirect(redirectRaw);

    if (!wantsSignin && !redirectTarget) return;

    if (redirectTarget) {
      savePostAuthRedirect(redirectTarget);
      setPostAuthRedirect(redirectTarget);
    }

    if (wantsSignin && !accountUser && !oauthCallback) {
      try {
        window.sessionStorage.setItem(SKIP_ONBOARDING_ONCE_KEY, "1");
      } catch {
        // ignore storage failures
      }
      setAuthStep("email");
      setAuthPassword("");
      setAuthCode("");
      setAuthHint("");
      setBillingPage(null);
      setWizardOpen(false);
      setAccountCenterSection("auth");
      setAccountCenterOpen(true);
    }

    url.searchParams.delete(SIGNIN_QUERY_KEY);
    url.searchParams.delete(REDIRECT_QUERY_KEY);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [accountUser]);

  useEffect(() => {
    saveLastTemplateIntent(templateWorkspaceState.selectedIntentId);
  }, [templateWorkspaceState.selectedIntentId]);

  // ✅ 新用户 onboarding：登录后首次进入自动弹出创建向导
  useEffect(() => {
    if (!accountUser) return;
    try {
      const skipOnce = window.sessionStorage.getItem(SKIP_ONBOARDING_ONCE_KEY) === "1";
      if (skipOnce) {
        window.sessionStorage.removeItem(SKIP_ONBOARDING_ONCE_KEY);
        return;
      }
      const hasPendingTemplateIntent = Boolean(localStorage.getItem("sp_template_pending_intent_v1"));
      const hasPendingSharePayload = Boolean(localStorage.getItem("sp_pending_share_payload_v1"));
      const url = new URL(window.location.href);
      const hasTemplateRoute =
        url.searchParams.get("template") === "1" ||
        Boolean(url.searchParams.get("template_slug")) ||
        Boolean(url.searchParams.get("template_id")) ||
        Boolean(url.searchParams.get("intent")) ||
        Boolean(url.searchParams.get("subtask"));
      if (hasPendingTemplateIntent || hasPendingSharePayload || hasTemplateRoute) return;
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        setWizardCancelable(false);
        setWizardStep("media");
        setWizardOpen(true);
      }
    } catch { /* ignore localStorage errors */ }
  }, [accountUser?.id]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlIntentRaw = url.searchParams.get("intent");
    const urlSubTask = url.searchParams.get("subtask");
    const urlWantsTemplate = url.searchParams.get("template") === "1";
    const urlTemplateSlug = (url.searchParams.get("template_slug") ?? "").trim();
    const urlTemplateId = (url.searchParams.get("template_id") ?? "").trim();
    const urlIntent = TEMPLATE_INTENTS.some((item) => item.id === urlIntentRaw)
      ? (urlIntentRaw as typeof TEMPLATE_INTENTS[number]["id"])
      : null;
    const indexList = getTemplateIndex();
    const routeTemplate =
      (urlTemplateId ? indexList.find((item) => item.id === urlTemplateId) ?? null : null)
      ?? (urlTemplateSlug ? findTemplateBySlug(indexList, urlTemplateSlug) : null);

    if (routeTemplate) {
      const inferred = findIntentByFamilyId(routeTemplate.familyId);
      setTemplateWorkspaceState((s) => ({
        ...s,
        templateWorkspaceView: "market",
        myTemplateSection: "owned",
        scope: "all",
        selectedIntentId: inferred?.intentId ?? s.selectedIntentId,
        selectedSubTaskId: inferred?.subTaskId ?? null,
        selectedCategory: null,
        selectedFamilyId: routeTemplate.familyId ?? null,
        selectedTemplateId: routeTemplate.id,
        searchQuery: "",
        showAllTemplatesInSubTask: false,
        filters: {
          mediaType: "all",
          storyPlan: "all",
          ratio: "all",
          pricing: "all",
          industry: "all"
        }
      }));
      setIsTemplateWorkspaceOpen(true);
      url.searchParams.delete("template");
      url.searchParams.delete("template_slug");
      url.searchParams.delete("template_id");
      url.searchParams.delete("intent");
      url.searchParams.delete("subtask");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      return;
    }

    const pendingIntent = consumePendingTemplateIntent();
    const resolvedIntent = urlIntent ?? pendingIntent;
    if (!resolvedIntent) return;
    const pendingSubTask = consumePendingTemplateSubTask();
    const resolvedSubTask = urlSubTask
      ?? (urlIntent ? null : pendingSubTask);
    const fromLandingEntry = Boolean(pendingIntent || urlWantsTemplate);
    const initialSubTaskId = fromLandingEntry ? null : resolvedSubTask;
    const initialScope = fromLandingEntry ? "all" : "recommended";
    const defaultTemplateId = initialSubTaskId
      ? getTemplatesForSubTask(indexList, resolvedIntent, initialSubTaskId)[0]?.id ?? null
      : pickDefaultTemplateForIntent(resolvedIntent, indexList);
    setTemplateWorkspaceState((s) => ({
      ...s,
      templateWorkspaceView: "market",
      myTemplateSection: "owned",
      scope: initialScope,
      selectedIntentId: resolvedIntent,
      selectedSubTaskId: initialSubTaskId,
      selectedCategory: null,
      selectedFamilyId: null,
      selectedTemplateId: defaultTemplateId,
      searchQuery: "",
      showAllTemplatesInSubTask: false,
      filters: {
        mediaType: "all",
        storyPlan: "all",
        ratio: "all",
        pricing: "all",
        industry: "all"
      }
    }));
    if (pendingIntent || urlWantsTemplate) {
      setIsTemplateWorkspaceOpen(true);
    }
    if (urlIntent || urlWantsTemplate || urlSubTask || urlTemplateSlug || urlTemplateId) {
      url.searchParams.delete("template");
      url.searchParams.delete("template_slug");
      url.searchParams.delete("template_id");
      url.searchParams.delete("intent");
      url.searchParams.delete("subtask");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [accountUser?.id]);

  useEffect(() => {
    if (!accountUser) return;
    const pendingShare = consumePendingSharePayload();
    if (!pendingShare) return;
    const template = getTemplateIndex().find(
      (item) => item.familyId === pendingShare.familyId && item.variant === pendingShare.variantId
    ) ?? null;
    setTemplateWorkspaceState((s) => ({
      ...s,
      templateWorkspaceView: "market",
      myTemplateSection: "owned",
      scope: "recommended",
      selectedIntentId: (pendingShare.intentId as any) ?? s.selectedIntentId,
      selectedSubTaskId: pendingShare.subTaskId ?? s.selectedSubTaskId,
      selectedCategory: null,
      selectedFamilyId: pendingShare.familyId ?? template?.familyId ?? null,
      selectedTemplateId: template?.id ?? null,
      searchQuery: "",
      showAllTemplatesInSubTask: false,
      filters: {
        mediaType: "all",
        storyPlan: "all",
        ratio: "all",
        pricing: "all",
        industry: "all"
      }
    }));
    setIsTemplateWorkspaceOpen(true);
  }, [accountUser]);

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

  async function requestNewProject() {
    const guardResult = await runUnsavedChangesGuard({
      hasUnsavedChanges: hasUnsavedLibraryChanges,
      confirmSaveFirst: () =>
        window.confirm(
          lang === "zh"
            ? "当前项目有未保存改动。点击“确定”先保存，再创建新项目。"
            : "Current project has unsaved changes. Click OK to save before creating a new project."
        ),
      runSave: async () => await (runProjectAction("save") as Promise<boolean>),
      confirmDiscard: () =>
        window.confirm(
          lang === "zh"
            ? "是否放弃未保存改动并创建新项目？"
            : "Discard unsaved changes and create a new project?"
        ),
    });
    if (!guardResult.allowed) return;

    openCreateWizard(false);
    trackProjectFlow(
      "wizard_open",
      { withSave: guardResult.outcome === "allow_after_save", skippedSavePrompt: guardResult.outcome === "allow_no_unsaved" },
      lang
    );
  }

  async function requestOpenProject() {
    const guardResult = await runUnsavedChangesGuard({
      hasUnsavedChanges: hasUnsavedLibraryChanges,
      confirmSaveFirst: () =>
        window.confirm(
          lang === "zh"
            ? "当前项目有未保存改动。点击“确定”先保存，再打开项目。"
            : "Current project has unsaved changes. Click OK to save before opening a project."
        ),
      runSave: async () => await (runProjectAction("save") as Promise<boolean>),
      confirmDiscard: () =>
        window.confirm(
          lang === "zh"
            ? "是否放弃未保存改动并打开项目？"
            : "Discard unsaved changes and open project?"
        ),
    });
    if (!guardResult.allowed) return;
    try {
      if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
        const picker = (window as any).showOpenFilePicker;
        const handles = await picker({
          id: "scenepilotix-open-project",
          multiple: false,
          types: [{
            description: "ScenePilotix Project",
            accept: { "application/json": [".json", ".spx"] }
          }],
          ...(lastProjectDirHandle ? { startIn: lastProjectDirHandle } : {})
        });
        const picked = handles?.[0];
        if (!picked) return;
        const file = await picked.getFile();
        const text = await file.text();
        const obj = JSON.parse(text);
        const parsed = parseProjectPayload(obj);
        if (!parsed) {
          setLibraryHint(lang === "zh" ? "打开失败：项目文件无效" : "Open failed: invalid project file");
          return;
        }
        if (parsed.platformId && SAVE_PLATFORM_OPTIONS.includes(parsed.platformId)) {
          syncSavePlatform(parsed.platformId);
          setProjectSavePlatformLockedPersist(true);
        }
        await restoreProjectAssetsFromLibrary(parsed.payload);
        const opened = sanitizeProject({
          project: parsed.payload.project ?? { mode: "storyboard" },
          scenes: parsed.payload.scenes
        });
        const nextName = basenameWithoutExt(file.name) || opened.name || defaultProjectName(lang);
        opened.name = nextName;
        const dirLabel = lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL;
        const nextPath = joinPath(dirLabel, file.name);
        resetProGeneratedAssets();
        updateProject(opened);
        setSceneIdx(0);
        setSelectedLayerId(null);
        setEditT(0);
        rememberCurrentFileBinding(picked, nextPath);
        rememberProjectDirectory(dirLabel, lastProjectDirHandle);
        setLabelPersist(nextName);
        upsertRecentProject({
          name: nextName,
          path: nextPath,
          updatedAt: Date.now(),
          sourceTemplateId: opened.meta?.sourceTemplateId,
          sourceTemplateName: opened.meta?.currentTemplate
            ? (lang === "zh" ? opened.meta.currentTemplate.titleZh : opened.meta.currentTemplate.titleEn)
            : undefined
        });
        setLastLibrarySavedSnapshot(JSON.stringify({ project: opened, fileLabel: nextName }));
        trackProjectFlow("project_open", { via: "picker" }, lang);
        return;
      }
    } catch {
      // fallback to input picker
    }
    fileInputRef.current?.click();
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
      if (projectFilePath) {
        upsertRecentProject({
          name: trimmed,
          path: projectFilePath,
          updatedAt: Date.now(),
          sourceTemplateId: safeProject.meta?.sourceTemplateId,
          sourceTemplateName: safeProject.meta?.currentTemplate
            ? (lang === "zh" ? safeProject.meta.currentTemplate.titleZh : safeProject.meta.currentTemplate.titleEn)
            : undefined
        });
      }
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
      setLabelPersist(name);
      clearCurrentFileBinding();
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
  
      setNewProjectConfirmOpen(false);
      openCreateWizard(false);
      trackProjectFlow("wizard_open", { withSave: true }, lang);
    } finally {
      setNewProjectConfirmBusy(false);
    }
  }

  function createNewProjectDirectly() {
    setNewProjectConfirmOpen(false);

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
          compiler: "v3" as SceneCompiler,
          sceneTier,
          v2Mode: "strict",
          stability: "standard"
        },
        notes: [
          `media: ${media}`,
          "genmode: quick",
          media === "video" ? "@compiler:v3" : "@compiler:v3",
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
    const projectFileName = wizardDraft.projectName.trim() || nextUntitledProjectName();
    resetProGeneratedAssets();
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    clearCurrentFileBinding();
    p.name = projectFileName;
    setLabelPersist(projectFileName);
    setProjectSavePlatformLockedPersist(false);
    updateProject(p);

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
    if (!hasProAccess) {
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
    if (!hasProAccess) {
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

  function parseProjectPayload(raw: any): { payload: SerializedLibraryProject; platformId?: SavePlatformId } | null {
    if (!raw || typeof raw !== "object") return null;
    if (Array.isArray(raw.scenes)) {
      const payload: SerializedLibraryProject = {
        version: 2,
        project: raw.project ?? { mode: "storyboard" },
        scenes: raw.scenes,
        assets: raw.assets && typeof raw.assets === "object" ? raw.assets : { refs: [] }
      };
      const platformId = raw.exportProfile?.platformId;
      return { payload, platformId };
    }
    return null;
  }

  async function writeProjectToFileHandle(nextProject: Project, target: any, platformId: SavePlatformId): Promise<void> {
    const payload = await serializeProjectForLibrary(nextProject);
    const exported = {
      ...payload,
      exportProfile: {
        platformId,
        platformLabel: savePlatformLabel(platformId, lang)
      }
    };
    const writable = await target.createWritable();
    await writable.write(JSON.stringify(exported, null, 2));
    await writable.close();
  }

  async function saveAsToDisk(): Promise<boolean> {
    const pickedPlatform = savePlatformId;
    syncSavePlatform(pickedPlatform);
    setProjectSavePlatformLockedPersist(true);
    const suggestedName = `${safeExportName((safeProject.name || fileLabel || defaultProjectName(lang)).trim()) || "project"}.json`;
    try {
      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        const picker = (window as any).showSaveFilePicker;
        const file = await picker({
          id: "scenepilotix-save-project",
          suggestedName,
          types: [{
            description: "ScenePilotix Project",
            accept: { "application/json": [".json", ".spx"] }
          }],
          ...(lastProjectDirHandle ? { startIn: lastProjectDirHandle } : {})
        });
        const fileName = String(file?.name || suggestedName);
        const nextName = basenameWithoutExt(fileName) || safeProject.name || defaultProjectName(lang);
        const nextProject = { ...safeProject, name: nextName };
        await writeProjectToFileHandle(nextProject, file, pickedPlatform);
        const dirLabel = lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL;
        const nextPath = joinPath(dirLabel, fileName);
        updateProject(nextProject);
        setLabelPersist(nextName);
        rememberCurrentFileBinding(file, nextPath);
        rememberProjectDirectory(dirLabel, lastProjectDirHandle);
        upsertRecentProject({
          name: nextName,
          path: nextPath,
          updatedAt: Date.now(),
          sourceTemplateId: nextProject.meta?.sourceTemplateId,
          sourceTemplateName: nextProject.meta?.currentTemplate
            ? (lang === "zh" ? nextProject.meta.currentTemplate.titleZh : nextProject.meta.currentTemplate.titleEn)
            : undefined
        });
        setLastLibrarySavedSnapshot(JSON.stringify({ project: nextProject, fileLabel: nextName }));
        trackExportFlow("save_as", { via: "file", platform: pickedPlatform, scope: "project" }, lang);
        return true;
      }
    } catch {
      // fallback below
    }

    const fallbackName = safeExportName(fileLabel || safeProject.name || defaultProjectName(lang)) || defaultProjectName(lang);
    const input = window.prompt(
      lang === "zh" ? "另存为：输入项目名称" : "Save As: enter project name",
      fallbackName
    );
    if (input == null) return false;
    const pickedName = safeExportName(input) || fallbackName;
    const nextProject = { ...safeProject, name: pickedName };
    const ok = await saveProjectToLibrary(pickedPlatform, pickedName);
    if (!ok) return false;
    updateProject(nextProject);
    setLabelPersist(pickedName);
    const nextPath = joinPath(lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL, `${pickedName}.json`);
    clearCurrentFileBinding();
    setProjectFilePath(nextPath);
    upsertRecentProject({
      name: pickedName,
      path: nextPath,
      updatedAt: Date.now(),
      sourceTemplateId: nextProject.meta?.sourceTemplateId,
      sourceTemplateName: nextProject.meta?.currentTemplate
        ? (lang === "zh" ? nextProject.meta.currentTemplate.titleZh : nextProject.meta.currentTemplate.titleEn)
        : undefined
    });
    setLastLibrarySavedSnapshot(JSON.stringify({ project: nextProject, fileLabel: pickedName }));
    trackExportFlow("save_as", { via: "library", platform: pickedPlatform, scope: "project" }, lang);
    return true;
  }

  async function saveToDisk(): Promise<boolean> {
    const pickedPlatform = savePlatformId;
    syncSavePlatform(pickedPlatform);
    setProjectSavePlatformLockedPersist(true);
    if (!fileHandle) {
      if (projectFilePath) {
        const filePart = projectFilePath.split(/[\\/]/).pop() || `${fileLabel || safeProject.name || defaultProjectName(lang)}.json`;
        const saveName = basenameWithoutExt(filePart) || safeProject.name || fileLabel || defaultProjectName(lang);
        const nextProject = { ...safeProject, name: saveName };
        const ok = await saveProjectToLibrary(pickedPlatform, saveName);
        if (ok) {
          updateProject(nextProject);
          setLabelPersist(saveName);
          upsertRecentProject({
            name: saveName,
            path: projectFilePath,
            updatedAt: Date.now(),
            sourceTemplateId: nextProject.meta?.sourceTemplateId,
            sourceTemplateName: nextProject.meta?.currentTemplate
              ? (lang === "zh" ? nextProject.meta.currentTemplate.titleZh : nextProject.meta.currentTemplate.titleEn)
              : undefined
          });
          setLastLibrarySavedSnapshot(JSON.stringify({ project: nextProject, fileLabel: saveName }));
          trackExportFlow("save", { via: "library", platform: pickedPlatform, scope: "project" }, lang);
          return true;
        }
      }
      return await saveAsToDisk();
    }
    try {
      await writeProjectToFileHandle(safeProject, fileHandle, pickedPlatform);
      const nextName = safeProject.name || fileLabel || defaultProjectName(lang);
      setLabelPersist(nextName);
      upsertRecentProject({
        name: nextName,
        path: projectFilePath || joinPath(lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL, `${nextName}.json`),
        updatedAt: Date.now(),
        sourceTemplateId: safeProject.meta?.sourceTemplateId,
        sourceTemplateName: safeProject.meta?.currentTemplate
          ? (lang === "zh" ? safeProject.meta.currentTemplate.titleZh : safeProject.meta.currentTemplate.titleEn)
          : undefined
      });
      setLastLibrarySavedSnapshot(JSON.stringify({ project: safeProject, fileLabel: nextName }));
      trackExportFlow("save", { via: "file", platform: pickedPlatform, scope: "project" }, lang);
      return true;
    } catch {
      setLibraryHint(lang === "zh" ? "保存失败，已切换到另存为" : "Save failed, switched to Save As");
      clearCurrentFileBinding();
      return await saveAsToDisk();
    }
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
      const parsed = parseProjectPayload(obj);
      if (!parsed) return;
      if (parsed.platformId && SAVE_PLATFORM_OPTIONS.includes(parsed.platformId)) {
        syncSavePlatform(parsed.platformId);
        setProjectSavePlatformLockedPersist(true);
      }
      await restoreProjectAssetsFromLibrary(parsed.payload);
      resetProGeneratedAssets();
      const opened = sanitizeProject({
        project: parsed.payload.project ?? { mode: "storyboard" },
        scenes: parsed.payload.scenes
      });
      const nextName = basenameWithoutExt(f.name) || opened.name || defaultProjectName(lang);
      opened.name = nextName;
      updateProject(opened);
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      clearCurrentFileBinding();
      const pseudoPath = joinPath(lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL, f.name);
      setProjectFilePath(pseudoPath);
      setLabelPersist(nextName);
      upsertRecentProject({
        name: nextName,
        path: pseudoPath,
        updatedAt: Date.now(),
        sourceTemplateId: opened.meta?.sourceTemplateId,
        sourceTemplateName: opened.meta?.currentTemplate
          ? (lang === "zh" ? opened.meta.currentTemplate.titleZh : opened.meta.currentTemplate.titleEn)
          : undefined
      });
      setLastLibrarySavedSnapshot(JSON.stringify({ project: opened, fileLabel: nextName }));

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
    openProject: () => { void requestOpenProject(); },
    newProject: () => { void requestNewProject(); },
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

  function buildQuickSharePayload(): SharePayload {
    const selectedPlatform = (() => {
      const hit = (scene.notes ?? "").split("\n").find((line) => line.startsWith("quick_platform:"));
      return hit?.slice("quick_platform:".length).trim() || savePlatformId;
    })();
    const selectedStyle = (() => {
      const hit = (scene.notes ?? "").split("\n").find((line) => line.startsWith("quick_style:"));
      return hit?.slice("quick_style:".length).trim() || undefined;
    })();
    const currentTemplate = safeProject.meta?.currentTemplate;
    return {
      intentId: templateWorkspaceState.selectedIntentId ?? "sell_product",
      subTaskId: templateWorkspaceState.selectedSubTaskId ?? "default",
      familyId: currentTemplate?.familyId ?? "custom",
      variantId: currentTemplate?.variantId ?? "custom",
      mainSubjectPrompt: scene.layers?.[0]?.externalPrompt ?? "",
      aspectRatio: scene.aspectRatio ?? "16:9",
      styleDirection: selectedStyle,
      platformId: selectedPlatform,
      promptText: buildScenePromptText(scene, selectedPlatform as SavePlatformId),
      resultImageUrl: currentSceneActiveAsset?.imageUrl || currentSceneActiveAsset?.posterUrl || undefined,
      createdAt: Date.now()
    };
  }

  async function handleQuickShare() {
    const payload = buildQuickSharePayload();
    const url = `${window.location.origin}/s#${encodeSharePayload(payload)}`;
    await navigator.clipboard.writeText(url);
    feedbackBarRef.current?.pushMessage(lang === "zh" ? "已复制分享链接" : "Share link copied");
  }

  function handleQuickGenerate() {
    if (!hasProAccess) {
      openQuickGenerationGate();
      return;
    }
    void generateProAsset();
  }

  function handleQuickLocalPath() {
    setGenerationGateOpen(false);
    openAccountCenter("api");
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
      rememberProjectDirectory(String(root?.name || lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL), root);
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
    const pickedPlatform = savePlatformId;
    syncSavePlatform(pickedPlatform);
    const ok = await saveProjectToLibrary(pickedPlatform);
    if (!ok) return false;
    setLastLibrarySavedSnapshot(currentLibrarySnapshot);
    trackExportFlow("save_all", { platform: pickedPlatform, scenes: safeProject.scenes.length, result: "success", scope: "project" }, lang);
    return true;
  }

  async function ensureReadyForLibraryOpen(): Promise<boolean> {
    const guardResult = await runUnsavedChangesGuard({
      hasUnsavedChanges: hasUnsavedLibraryChanges,
      confirmSaveFirst: () =>
        window.confirm(
          lang === "zh"
            ? "当前项目有未保存改动。点击“确定”先保存整个项目，再打开分镜库项目。"
            : "Current project has unsaved changes. Click OK to save the whole project before opening a library project."
        ),
      runSave: async () => await (runProjectAction("save") as Promise<boolean>),
      confirmDiscard: () =>
        window.confirm(
          lang === "zh"
            ? "是否放弃未保存改动并直接打开分镜库项目？"
            : "Discard unsaved changes and open the library project directly?"
        ),
    });
    return guardResult.allowed;
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
      const nextName = basenameWithoutExt(entry.label) || entry.label || opened.name || defaultProjectName(lang);
      opened.name = nextName;
      const openedPath = joinPath(lastProjectDirectory || DEFAULT_PROJECT_DIR_LABEL, entry.name);
      resetProGeneratedAssets();
      updateProject(opened);
      setLabelPersist(nextName);
      clearCurrentFileBinding();
      setProjectFilePath(openedPath);
      upsertRecentProject({
        name: nextName,
        path: openedPath,
        updatedAt: Date.now(),
        sourceTemplateId: opened.meta?.sourceTemplateId,
        sourceTemplateName: opened.meta?.currentTemplate
          ? (lang === "zh" ? opened.meta.currentTemplate.titleZh : opened.meta.currentTemplate.titleEn)
          : undefined
      });
      setLastLibrarySavedSnapshot(JSON.stringify({ project: opened, fileLabel: nextName }));
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
        ...(canUseByoAccess
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

        {showDevProBadge && (
          <span style={{
            padding: "2px 8px", borderRadius: 999,
            border: "1px solid rgba(245,158,11,0.5)",
            background: "rgba(245,158,11,0.15)",
            color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 0.2
          }}>
            DEV PRO
          </span>
        )}

        {/* hidden file input for no FS access */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.spx,application/json"
          style={{ display: "none" }}
          onChange={onUploadFile}
        />
      </div>

      {/* account menu now lives in WorkspaceLeftPanel user popup */}

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

      {templateSwitchConfirmOpen && (
        <div
          style={styles.modalMask}
          onMouseDown={() => {
            if (templateSwitchConfirmBusy) return;
            setTemplateSwitchConfirmOpen(false);
            setPendingTemplateSwitch(null);
          }}
          role="presentation"
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{lang === "zh" ? "切换模板" : "Switch Template"}</div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? "当前项目有未保存改动。你可以先保存当前项目，再切换到新模板。"
                : "Current project has unsaved changes. You can save first, then switch to the new template."}
            </div>
            <div style={styles.modalBtns}>
              <button
                style={styles.modalBtnGhost}
                type="button"
                disabled={templateSwitchConfirmBusy}
                onClick={() => {
                  setTemplateSwitchConfirmOpen(false);
                  setPendingTemplateSwitch(null);
                }}
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                style={styles.modalBtnGhost}
                type="button"
                disabled={templateSwitchConfirmBusy}
                onClick={() => void applyPendingTemplateSwitchDirectly()}
              >
                {lang === "zh" ? "不保存，直接离开" : "Leave Without Saving"}
              </button>
              <button
                style={styles.modalBtn}
                type="button"
                disabled={templateSwitchConfirmBusy}
                onClick={() => void applyPendingTemplateSwitchAfterSave()}
              >
                {templateSwitchConfirmBusy
                  ? lang === "zh" ? "保存中…" : "Saving..."
                  : lang === "zh" ? "先保存并切换" : "Save Then Switch"}
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
          <WorkspaceLeftPanel
            lang={lang}
            isMac={isMac}
            section={proWorkspaceSection}
            onSectionChange={setProWorkspaceSection}
            activeGlobalNav={isTemplateWorkspaceOpen ? "templates" : "workspace"}
            onGlobalNavChange={(nav) => {
              if (nav === "templates") setIsTemplateWorkspaceOpen(true);
              else setIsTemplateWorkspaceOpen(false);
            }}
            projectLabel={fileLabel || defaultProjectName(lang)}
            onNewProject={() => void requestNewProject()}
            onOpenProject={() => void requestOpenProject()}
            onSaveProject={() => void runProjectAction("save")}
            onSaveAs={() => void runProjectAction("save_as")}
            onRenameProject={requestRenameProject}
            onOpenLibrary={() => {
              setLibraryOpen(true);
              setLibraryProjectName(null);
              void ensureLibraryRoot(false).then((root) => {
                if (root) void refreshLibraryEntries(root, null);
              });
            }}
            onExportPromptPlusRefs={() => openExportPanel("prompt_plus_refs")}
            onExportProject={handleExportProject}
            onSaveAsTemplate={handleSaveAsTemplate}
            user={accountUser ? {
              displayName: accountUser.email?.split("@")[0] ?? "User",
              email: accountUser.email,
              isPro: hasProAccess,
            } : null}
            credits={accountCredits}
            onOpenAccount={(section) => openAccountCenter((section as any) ?? "overview")}
            onOpenBilling={() => openBillingPage("credits")}
            onOpenUpgrade={() => openBillingPage("upgrade")}
            onLogout={() => void handleLogout()}
            onToggleLang={toggleLang}
            onOpenApiSettings={() => openAccountCenter("api")}
            onOpenLocalSettings={() => openAccountCenter("local")}
            onOpenHelp={() => {
              setFeedbackSent("");
              setHelpCenterSection(DEFAULT_HELP_SECTION);
              setHelpCenterOpen(true);
            }}
          />

          <div
            style={{
              gridColumn: useDesktopFixedLayout ? "2 / -1" : undefined,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              height: "100%",
            }}
          >
            {isTemplateWorkspaceOpen ? (
              <div style={{ flex: 1, width: "100%", minWidth: 0, minHeight: 0, display: "flex" }}>
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
            ) : (
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <ProWorkspaceShell
                  lang={lang}
                  project={safeProject}
                  scene={scene}
                  sceneIdx={sceneIdx}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={(id) => { setSelectedLayerId(id); setEditT(0); }}
                  onUpdateScene={(s) => { updateScene(s); trackEditorChange("scene", "update", { idx: sceneIdx }, lang); }}
                  onRenameLayer={(oldId, newId) => { if (selectedLayerId === oldId) setSelectedLayerId(newId); trackEditorChange("layer", "rename", { oldId, newId }, lang); }}
                  onAddLayer={() => {
                    const layers = scene.layers ?? [];
                    const usedIds = new Set(layers.map((l) => String(l.id || "").trim()).filter(Boolean));
                    let maxN = 0;
                    for (const id of usedIds) {
                      const hit = id.match(/^layer(\d+)$/i);
                      if (!hit) continue;
                      const n = Number.parseInt(hit[1], 10);
                      if (Number.isFinite(n)) maxN = Math.max(maxN, n);
                    }
                    let seq = Math.max(1, maxN + 1);
                    let newId = `layer${seq}`;
                    while (usedIds.has(newId)) {
                      seq += 1;
                      newId = `layer${seq}`;
                    }
                    const newLayer: import("./model").Layer = {
                      id: newId, type: "subject", shape: "rect",
                      look: "", shapeDesc: "", z: (scene.layers?.length ?? 0) + 1,
                      color: "#888888", opacity: 1,
                      kf: [
                        { t: 0, x: 50, y: 50, w: 30, h: 30, rot: 0 }
                      ],
                      notes: "", externalPrompt: "", referenceLinks: "",
                    };
                    updateScene({ ...scene, layers: [...(scene.layers ?? []), newLayer] });
                    setSelectedLayerId(newId);
                    trackEditorChange("layer", "add", { id: newId }, lang);
                  }}
                  onDeleteLayer={(layerId: string) => {
                    const layers = scene.layers ?? [];
                    const idx = layers.findIndex((l) => l.id === layerId);
                    if (idx < 0) return;
                    const nextLayers = layers.filter((l) => l.id !== layerId);
                    updateScene({ ...scene, layers: nextLayers });
                    if (selectedLayerId === layerId) {
                      const prev = nextLayers[Math.max(0, idx - 1)] ?? nextLayers[0] ?? null;
                      setSelectedLayerId(prev?.id ?? null);
                    }
                    trackEditorChange("layer", "delete", { id: layerId }, lang);
                  }}
                  editT={effectiveEditT}
                  setEditT={(t) => { if (mediaMode === "image" && t === 1) return; setEditT(t); }}
                  platformId={savePlatformId}
                  onJumpToConflict={(layerId) => { if (layerId) setSelectedLayerId(layerId); }}
                  onPlatformChange={(id) => syncSavePlatform(id as SavePlatformId)}
                  exportMode={proExportMode}
                  onExportModeChange={handleProExportModeChange}
                  generationSource={proGenerationSource === "hosted" ? "api" : proGenerationSource}
                  onGenerationSourceChange={(s) => setProGenerationSourceAndPersist(s as any)}
                  canUseByo={canUseByoAccess}
                  onCopyPrompt={handleCopyPrompt}
                  onExport={handleExportProject}
                  onGenerate={() => void generateProAsset()}
                  generateBusy={proGenerateBusy}
                  section={proWorkspaceSection}
                  onSectionChange={setProWorkspaceSection}
                  byoCredentials={accountApiCredentials}
                  comfyStatus={comfyStatus}
                  drawStatus={drawThingsStatus}
                  currentAsset={currentSceneActiveAsset ?? null}
                  assetList={currentSceneAssets}
                  activeAssetId={currentSceneActiveAssetId}
                  onSetActiveAsset={(id) => setActiveProAsset(sceneAssetKey, id)}
                  onDownloadAsset={currentSceneActiveAsset ? () => downloadProAsset(currentSceneActiveAsset) : undefined}
                  onDeleteAsset={currentSceneActiveAsset ? () => deleteProAsset(sceneAssetKey, currentSceneActiveAsset.id) : undefined}
                  onRegenerateAsset={currentSceneActiveAsset ? () => void generateProAsset(currentSceneActiveAsset.source as any) : undefined}
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
                        onPlatformChange={(id) => { syncSavePlatform(id as SavePlatformId); feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换平台" : "Platform changed"); }}
                        exportScope={proExportScope}
                        onExportScopeChange={(scope) => { setProExportScope(scope); feedbackBarRef.current?.pushMessage(lang === "zh" ? "已切换导出范围" : "Export scope changed"); }}
                        exportMode={proExportMode}
                        onExportModeChange={handleProExportModeChange}
                        selectedLayerId={selectedLayerId}
                        onJumpToConflict={(layerId) => { if (layerId) setSelectedLayerId(layerId); }}
                        onFeedbackMessage={(msg) => feedbackBarRef.current?.pushMessage(msg)}
                        defaultExportDirectoryHandle={lastExportDirHandle}
                        userId={accountUser?.id ?? null}
                        onExportDirectorySelected={(dirHandle, dirLabel) => {
                          rememberExportDirectory(dirLabel || String(dirHandle?.name || ""), dirHandle);
                        }}
                      />
                    </div>
                  }
                />
              </div>
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

      <GenerationGatePanel
        open={generationGateOpen}
        lang={lang}
        canUseLocal={hasProAccess}
        onClose={() => setGenerationGateOpen(false)}
        onCopyPrompt={() => {
          setGenerationGateOpen(false);
          handleCopyPrompt();
        }}
        onTopUp={() => {
          setGenerationGateOpen(false);
          openBillingPage("upgrade");
        }}
        onLocalGenerate={handleQuickLocalPath}
      />

      <input
        ref={quickRefInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          void handleQuickReferenceChange(file);
          e.currentTarget.value = "";
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
        onGoGenerateSettings={() => {
          setAccountCenterOpen(false);
          setAccountCenterSection("overview");
          setProWorkspaceSection("generate_settings");
        }}
        onGoTemplateStart={() => {
          setAccountCenterOpen(false);
          setAccountCenterSection("overview");
          setIsTemplateWorkspaceOpen(true);
        }}
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
    height: 48,
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
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gridTemplateRows: "1fr",
    height: "100%",
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
