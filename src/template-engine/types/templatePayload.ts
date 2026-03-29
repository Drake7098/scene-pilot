/**
 * TemplatePayload - full project-level snapshot.
 */

import type { TemplateMediaType, TemplateStoryPlan, TemplateRatio } from "./templateTypes";

export type TemplateProjectDefaults = {
  mediaType?: TemplateMediaType;
  aspectRatio?: TemplateRatio;
  spaceLevel?: string;
  storyPlan?: TemplateStoryPlan;
  workspaceMode?: string;
  sceneCount?: number;
  totalDuration?: number;
  sceneDurations?: number[];
};

export type TemplateSceneSnapshot = {
  nameZh?: string;
  nameEn?: string;
  duration?: number;
  sceneChangeMode?: string;
  cameraMoveMode?: string;
  jumpCutMode?: string;
  entryDirection?: string;
  exitDirection?: string;
  objectInheritance?: string;
  lensRecipe?: string;
  classicShot?: string;
  classicMotion?: string;
  directorStylePack?: string;
  proMotions?: string;
  imageProEffects?: string;
  /** Layer 1 (user) or Layer 2 (template) camera language id. See cameraLanguageLayers. */
  cameraLanguage?: string;
  constraintStrength?: string;
  lightingSetup?: string;
  backgroundPreset?: string;
  backgroundPromptZh?: string;
  backgroundPromptEn?: string;
  raw?: unknown;
};

export type TemplateObjectSnapshot = {
  id: string;
  role?: "primary" | "secondary" | "support";
  continuityId?: string;
  type?: string;
  name?: string;
  appearance?: string;
  form?: string;
  objectPromptZh?: string;
  objectPromptEn?: string;
  statusNote?: string;
  fineDetail?: string;
  notesZh?: string;
  notesEn?: string;
  tags?: string[];
  zOrder?: number;
  color?: string;
  opacity?: number;
  t0?: unknown;
  t1?: unknown;
  raw?: unknown;
};

export type TemplateContinuity = {
  enabled?: boolean;
  characterCarryOver?: boolean;
  directionCarryOver?: boolean;
  cameraCarryOver?: boolean;
  bgCarryOver?: boolean;
  referenceSlots?: unknown[];
};

export type TemplateExportDefaults = {
  range?: string;
  method?: string;
  target?: string;
};

export type TemplatePayload = {
  id?: string;
  masterTemplateId?: string;
  isMasterTemplate?: boolean;
  isDerivedTemplate?: boolean;
  isUserTemplate?: boolean;
  isNewTemplate?: boolean;
  version?: number | string;
  nameZh?: string;
  nameEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  frontCategory?: FrontCategory;
  backStructure?: BackStructure;
  mediaType?: TemplateMediaType;
  storyPlan?: TemplateStoryPlan;
  ratio?: TemplateRatio;
  score?: number;
  price?: number;
  isFree?: boolean;
  qualityLevel?: QualityLevel;
  generationSource?: GenerationSource;
  preview?: string;
  tags?: string[];
  enabled?: boolean;
  scenePreset?: ScenePreset;
  objectPresets?: TemplateObjectSnapshot[];
  cameraPreset?: Record<string, unknown>;
  lightingPreset?: Record<string, unknown>;
  stylePreset?: Record<string, unknown>;
  constraintPreset?: Record<string, unknown>;
  continuityPreset?: TemplateContinuity;
  exportPreset?: TemplateExportDefaults;
  newUntil?: number;
  createdAt?: number;
  publishedAt?: number;
  meta?: Record<string, unknown>;
  projectDefaults?: TemplateProjectDefaults;
  scenes: TemplateSceneSnapshot[];
  objects?: TemplateObjectSnapshot[];
  continuity?: TemplateContinuity;
  exportDefaults?: TemplateExportDefaults;
};

export type FrontCategory =
  | "sell_product"
  | "people_portrait"
  | "cover_poster"
  | "video_talking_head"
  | "story_video"
  | "continuous_storyboard"
  | "dialogue_multishot"
  | "action_motion"
  | "chase_sequence"
  | "anime_stylized";

export type BackStructure =
  | "single_subject"
  | "dual_subject"
  | "multi_subject"
  | "product_focus"
  | "talking_head"
  | "cover_poster"
  | "continuous_story"
  | "dialogue_multishot"
  | "action_motion"
  | "chase_sequence"
  | "anime_stylized";

export type QualityLevel = "free" | "standard" | "advanced" | "premium";
export type GenerationSource = "manual" | "derived_from_master" | "ai_generated" | "user_created";

export type ScenePreset = {
  backgroundPreset?: string;
  backgroundPromptZh?: string;
  backgroundPromptEn?: string;
  locationMode?: string;
  sceneTier?: string;
  atmosphere?: string;
  weather?: string;
  timeOfDay?: string;
  environmentalDetail?: string;
  imperfectionScene?: string;
  enabled?: boolean;
};

export type TemplateValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export type TemplateValidationResult = {
  ok: boolean;
  issues: TemplateValidationIssue[];
  normalized: TemplatePayload;
};

export type TemplateScoreBreakdown = {
  objectComplexity: number;
  cameraComplexity: number;
  sceneComplexity: number;
  continuityComplexity: number;
  detailRealismCompleteness: number;
  total: number;
  qualityLevel: QualityLevel;
  price: number;
  isFree: boolean;
};

export type AIBatchGenerateProtocol = {
  masterTemplateId: string;
  frontCategory: FrontCategory;
  backStructure: BackStructure;
  count: number;
  mediaType: TemplateMediaType;
  storyPlan: TemplateStoryPlan;
  ratio?: TemplateRatio;
  styleRange?: string[];
  complexityRange?: [number, number];
  freeRatio?: number;
  disallowBackgroundInObjects?: boolean;
};

export type TemplateNormalizeContext = {
  templateId?: string;
  nameZh?: string;
  nameEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  mediaType?: TemplateMediaType;
  storyPlan?: TemplateStoryPlan;
  ratio?: TemplateRatio;
  isFree?: boolean;
  cost?: number;
  category?: string;
  domain?: string;
  tags?: string[];
};

const BG_LEAKY_KEYWORDS = [
  "city", "room", "forest", "studio", "alley", "night city", "street", "indoor", "outdoor",
  "城市", "房间", "森林", "棚拍", "街道", "巷子", "室内", "室外", "夜景"
];

function clamp(n: number, a: number, b: number): number {
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function hasAnyKeyword(text: string, words: string[]): boolean {
  const t = String(text || "").toLowerCase();
  return words.some((w) => t.includes(w));
}

function scoreToQualityLevel(score: number): QualityLevel {
  if (score <= 3) return "free";
  if (score <= 6) return "standard";
  if (score <= 8) return "advanced";
  return "premium";
}

function qualityLevelToPrice(level: QualityLevel): number {
  if (level === "free") return 0;
  if (level === "standard") return 1;
  if (level === "advanced") return 3;
  return 5;
}

function inferFrontCategory(ctx?: TemplateNormalizeContext): FrontCategory {
  const c = String(ctx?.category || "").toLowerCase();
  const d = String(ctx?.domain || "").toLowerCase();
  const s = String(ctx?.storyPlan || "").toLowerCase();
  if (d.includes("anime")) return "anime_stylized";
  if (d.includes("dialogue")) return "dialogue_multishot";
  if (d.includes("chase")) return "chase_sequence";
  if (d.includes("product")) return "sell_product";
  if (d.includes("portrait") || d.includes("people")) return "people_portrait";
  if (d.includes("poster")) return "cover_poster";
  if (d.includes("action")) return "action_motion";
  if (s === "continuous") return "continuous_storyboard";
  if (c === "ad") return "sell_product";
  return "story_video";
}

function inferBackStructure(payload: TemplatePayload, ctx?: TemplateNormalizeContext): BackStructure {
  const d = String(ctx?.domain || "").toLowerCase();
  if (d.includes("anime")) return "anime_stylized";
  if (d.includes("dialogue")) return "dialogue_multishot";
  if (d.includes("chase")) return "chase_sequence";
  if (d.includes("action")) return "action_motion";
  if (d.includes("product")) return "product_focus";
  if ((payload.objectPresets ?? payload.objects ?? []).length >= 3) return "multi_subject";
  if ((payload.objectPresets ?? payload.objects ?? []).length === 2) return "dual_subject";
  return "single_subject";
}

function deriveScenePreset(payload: TemplatePayload): ScenePreset {
  const first = payload.scenes?.[0];
  return {
    backgroundPreset: first?.backgroundPreset,
    backgroundPromptZh: first?.backgroundPromptZh,
    backgroundPromptEn: first?.backgroundPromptEn,
    locationMode: payload.projectDefaults?.spaceLevel,
    sceneTier: payload.projectDefaults?.spaceLevel,
    atmosphere: "",
    weather: "",
    timeOfDay: "",
    environmentalDetail: "",
    imperfectionScene: "",
    enabled: true
  };
}

function normalizeObjectRole(objects: TemplateObjectSnapshot[]): TemplateObjectSnapshot[] {
  let usedPrimary = false;
  return objects.map((obj, idx) => {
    let role = obj.role;
    if (role !== "primary" && role !== "secondary" && role !== "support") {
      role = idx === 0 ? "primary" : "secondary";
    }
    if (role === "primary") {
      if (usedPrimary) role = "secondary";
      usedPrimary = true;
    }
    return { ...obj, role };
  });
}

export function computeTemplateScore(payload: TemplatePayload): TemplateScoreBreakdown {
  const objectPresets = normalizeObjectRole((payload.objectPresets ?? payload.objects ?? []).filter(Boolean));
  const scenes = payload.scenes ?? [];
  const firstScene = scenes[0];

  const objectComplexity = clamp(
    (objectPresets.length >= 4 ? 2 : objectPresets.length >= 2 ? 1 : 0),
    0,
    2
  );

  const cameraSignals = [
    firstScene?.cameraMoveMode,
    firstScene?.lensRecipe,
    firstScene?.classicMotion,
    firstScene?.cameraLanguage
  ].filter(Boolean).length;
  const cameraComplexity = clamp(cameraSignals >= 3 ? 2 : cameraSignals >= 1 ? 1 : 0, 0, 2);

  const sceneSignals = [
    firstScene?.backgroundPreset,
    firstScene?.lightingSetup,
    payload.scenePreset?.atmosphere,
    payload.scenePreset?.weather
  ].filter(Boolean).length;
  const sceneComplexity = clamp(sceneSignals >= 3 ? 2 : sceneSignals >= 1 ? 1 : 0, 0, 2);

  const continuitySignals = [
    payload.continuityPreset?.enabled,
    payload.continuity?.enabled,
    payload.storyPlan === "continuous",
    firstScene?.sceneChangeMode === "continuous"
  ].filter(Boolean).length;
  const continuityComplexity = clamp(continuitySignals >= 2 ? 2 : continuitySignals === 1 ? 1 : 0, 0, 2);

  const detailSignals = objectPresets.filter((o) =>
    Boolean(o.fineDetail || o.notesZh || o.notesEn || o.statusNote)
  ).length;
  const detailRealismCompleteness = clamp(
    detailSignals >= Math.max(1, objectPresets.length) ? 2 : detailSignals > 0 ? 1 : 0,
    0,
    2
  );

  const total = clamp(
    objectComplexity + cameraComplexity + sceneComplexity + continuityComplexity + detailRealismCompleteness,
    0,
    10
  );
  const qualityLevel = scoreToQualityLevel(total);
  const price = qualityLevelToPrice(qualityLevel);
  const isFree = qualityLevel === "free";
  return {
    objectComplexity,
    cameraComplexity,
    sceneComplexity,
    continuityComplexity,
    detailRealismCompleteness,
    total,
    qualityLevel,
    price,
    isFree
  };
}

export function isTemplateNew(payload: TemplatePayload, now = Date.now()): boolean {
  if (payload.isNewTemplate === true) return true;
  const until = Number(payload.newUntil || 0);
  return Number.isFinite(until) && until > now;
}

export function normalizeAndValidateTemplatePayload(
  payload: TemplatePayload,
  ctx?: TemplateNormalizeContext
): TemplateValidationResult {
  const baseId = (payload.id || ctx?.templateId || "").trim();
  const normalizedObjects = normalizeObjectRole(
    ((payload.objectPresets ?? payload.objects ?? []) as TemplateObjectSnapshot[]).filter(Boolean)
  );
  const score = computeTemplateScore({ ...payload, objectPresets: normalizedObjects });
  const normalized: TemplatePayload = {
    ...payload,
    id: baseId || payload.id,
    masterTemplateId: payload.masterTemplateId || (payload.isMasterTemplate ? (baseId || payload.id) : payload.masterTemplateId),
    isMasterTemplate: payload.isMasterTemplate === true,
    isDerivedTemplate: payload.isDerivedTemplate === true || (!!payload.masterTemplateId && payload.isMasterTemplate !== true),
    isUserTemplate: payload.isUserTemplate === true,
    isNewTemplate: isTemplateNew(payload),
    version: payload.version ?? 1,
    nameZh: payload.nameZh || ctx?.nameZh,
    nameEn: payload.nameEn || ctx?.nameEn,
    descriptionZh: payload.descriptionZh || ctx?.descriptionZh,
    descriptionEn: payload.descriptionEn || ctx?.descriptionEn,
    frontCategory: payload.frontCategory || inferFrontCategory(ctx),
    backStructure: payload.backStructure || inferBackStructure(payload, ctx),
    mediaType: payload.mediaType || ctx?.mediaType || payload.projectDefaults?.mediaType,
    storyPlan: payload.storyPlan || ctx?.storyPlan || payload.projectDefaults?.storyPlan,
    ratio: payload.ratio || ctx?.ratio || payload.projectDefaults?.aspectRatio,
    score: Number.isFinite(payload.score as number) ? Number(payload.score) : score.total,
    qualityLevel: payload.qualityLevel || score.qualityLevel,
    price: Number.isFinite(payload.price as number) ? Number(payload.price) : score.price,
    isFree: typeof payload.isFree === "boolean" ? payload.isFree : score.isFree,
    generationSource: payload.generationSource || (payload.isDerivedTemplate ? "derived_from_master" : "manual"),
    tags: payload.tags ?? ctx?.tags ?? [],
    enabled: payload.enabled !== false,
    scenePreset: payload.scenePreset ?? deriveScenePreset(payload),
    objectPresets: normalizedObjects,
    continuityPreset: payload.continuityPreset ?? payload.continuity,
    exportPreset: payload.exportPreset ?? payload.exportDefaults,
    createdAt: Number(payload.createdAt || Date.now()),
    publishedAt: Number(payload.publishedAt || payload.createdAt || Date.now())
  };

  const issues: TemplateValidationIssue[] = [];
  if (!normalized.frontCategory) {
    issues.push({ level: "error", code: "missing_front_category", message: "frontCategory is required" });
  }
  if (!normalized.backStructure) {
    issues.push({ level: "error", code: "missing_back_structure", message: "backStructure is required" });
  }
  if (!normalized.scenePreset) {
    issues.push({ level: "error", code: "missing_scene_preset", message: "scenePreset is required" });
  }
  if ((normalized.objectPresets ?? []).filter((o) => o.role === "primary").length > 1) {
    issues.push({ level: "error", code: "multi_primary_object", message: "Only one primary object is allowed" });
  }
  if (normalized.isDerivedTemplate && !normalized.masterTemplateId) {
    issues.push({ level: "error", code: "derived_without_master", message: "Derived template must include masterTemplateId" });
  }
  if ((normalized.objectPresets ?? []).some((obj) => {
    const text = [obj.objectPromptZh, obj.objectPromptEn, obj.appearance, obj.notesZh, obj.notesEn].filter(Boolean).join(" ");
    return hasAnyKeyword(text, BG_LEAKY_KEYWORDS);
  })) {
    issues.push({
      level: "warning",
      code: "scene_bg_leak_into_object",
      message: "Object prompts seem to include scene/background keywords"
    });
  }
  if ((normalized.objectPresets ?? []).length > 0) {
    const hasAnyFineDetail = (normalized.objectPresets ?? []).some((o) => Boolean(o.fineDetail));
    if (!hasAnyFineDetail) {
      issues.push({
        level: "warning",
        code: "missing_fine_detail",
        message: "People/object templates should include fineDetail for quality consistency"
      });
    }
  }
  if (normalized.storyPlan === "continuous" && !(normalized.continuityPreset?.enabled || normalized.continuity?.enabled)) {
    issues.push({
      level: "warning",
      code: "continuous_without_continuity",
      message: "Continuous templates should include continuityPreset"
    });
  }
  const emptyScene = !Array.isArray(normalized.scenes) || normalized.scenes.length === 0;
  const emptyObjects = !Array.isArray(normalized.objectPresets) || normalized.objectPresets.length === 0;
  if (emptyScene && emptyObjects) {
    issues.push({ level: "error", code: "empty_template", message: "Template cannot be empty" });
  }

  return {
    ok: !issues.some((i) => i.level === "error"),
    issues,
    normalized
  };
}
