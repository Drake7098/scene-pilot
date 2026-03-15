export type Mode = "static" | "storyboard";
export type MediaType = "image" | "video";
export type ShotPlan = "single" | "multicam" | "continuous" | "edit";
export type SceneCompiler = "v1" | "v2";
export type SceneTier = "indoor" | "small_plaza" | "open_space";
export type SceneV2Mode = "strict" | "short";
export type SceneStability = "off" | "standard" | "strict";
export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type TransitionType = "cut" | "reverse_angle" | "camera_continues" | "dissolve" | "time_jump";
export type ObjectRefInheritMode = "off" | "identity_only" | "all";

export type Shape = "circle" | "rect" | "ring" | "arrow";

export type LayerKF = {
  t: 0 | 1;
  x: number; // 0..100 (center)
  y: number; // 0..100 (center)
  w: number; // 0..100
  h: number; // 0..100
  rot: number; // degrees
};

export type Layer = {
  id: string;

  // 自由文本：可中英文
  type: string;

  // 仅用于画布渲染（不在 UI 暴露编辑）
  shape: Shape;

  // 形状/外观描述（可选）
  shapeDesc?: string;

  // ✅ 作为“背景/外观描述”的主要字段（替代颜色输入）
  look: string;

  z: number;

  // 仅画布渲染用（固定默认）
  color: string;

  opacity: number;
  kf: LayerKF[];
  notes: string;
  externalPrompt: string;
  referenceLinks: string;
  localRefs?: LocalRefMeta[];
  referencePolicy?: "optional" | "required";
};

export type LocalRefType = "identity" | "appearance" | "style";

export type LocalRefMeta = {
  id: string;
  type: LocalRefType;
  name: string;
  mime: string;
  size: number;
  updatedAt: number;
};

export type SceneRefMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  updatedAt: number;
};

export type Camera = {
  shot: string; // wide/medium/close/custom
  movement: string; // static/pan_left/custom
  keyframes: { t: 0 | 1; x: number; y: number; zoom: number; rot: number }[];
};

export type Lighting = { time: string; key_dir: string; mood: string };

export type ProjectCreativeSource = "quick_workspace" | "manual" | "imported";

export type ProjectCreativeContext = {
  source: ProjectCreativeSource;
  mediaType?: MediaType;
  fileName?: string;
  primaryInput?: string;
  secondaryInput?: string;
  mergedInput?: string;
  intentSummary?: string;
  locationHint?: string;
  styleHint?: string;
  subjectLabels?: string[];
};

export type Scene = {
  id: string;
  name: string;
  index?: number;
  layoutLocked?: boolean;
  backgroundRef?: SceneRefMeta;
  inheritFromPrevious?: boolean;
  inheritBgRefFromPrevious?: boolean;
  inheritObjectRefsFromPrevious?: ObjectRefInheritMode;
  transitionType?: TransitionType;
  duration_s: number;
  cameraPreset?: string;
  shotNote?: string;
  entryDir?: Direction;
  exitDir?: Direction;
  camera: Camera;
  lighting: Lighting;
  layers: Layer[];
  config?: {
    mediaMode?: MediaType;
    compiler?: SceneCompiler;
    sceneTier?: SceneTier;
    v2Mode?: SceneV2Mode;
    stability?: SceneStability;
  };
  notes: string;
};

/** Current template context - which template was applied to this project. */
export type CurrentTemplateContext = {
  templateId: string;
  familyId: string;
  familyNameZh: string;
  familyNameEn: string;
  variantId: string;
  variantNameZh?: string;
  variantNameEn?: string;
  titleZh: string;
  titleEn: string;
  category: string;
  domain: string;
  tier?: string;
  cost: number;
  isFree: boolean;
  applyMode: "layout_only" | "layout_plus_style" | "full_workflow";
  appliedAt?: number;
  fromTemplateWorkspace?: boolean;
};

export type ProExportMode = "prompt_only" | "package";

/** How this project was created. */
export type ProjectSourceType = "blank" | "template" | "duplicate";

/** Project-level metadata for billing, tracking, future backend sync. */
export type ProjectMeta = {
  /** How the project was created. */
  sourceType?: ProjectSourceType;
  /** Template id when sourceType is template. */
  sourceTemplateId?: string;
  /** Template slug for naming (e.g. premium-product). */
  sourceTemplateSlug?: string;
  /** Original project id when sourceType is duplicate. */
  basedOnProjectId?: string;
  /** True if template was already owned when project was created (no charge). */
  templateOwnedAtCreation?: boolean;
  /** Pricing bucket at creation (F0/C1/C2/P2/P3) when sourceType is template. */
  pricingBucketAtCreation?: string;
  /** @deprecated Use meta.billing.appliedTemplateCharges. Kept for migration. */
  appliedTemplateIds?: string[];
  /** Current template applied to this project (serializable, persists with project). */
  currentTemplate?: CurrentTemplateContext;
  /** Pro workspace export mode: quick (prompt only) or package (prompt+refs). Persists with project. */
  proExportMode?: ProExportMode;
  /** Detailed billing records - source of truth for no-repeat-charge. */
  billing?: {
    appliedTemplateCharges: Array<{
      templateId: string;
      familyId?: string;
      variantId?: string;
      cost: number;
      chargedAt: string;
      chargeType: "template_apply";
    }>;
    generationCharges: Array<{
      sceneId?: string;
      platformId?: string;
      cost: number;
      chargedAt: string;
      chargeType: "generate_image" | "generate_video";
    }>;
  };
};

/** Continuity config from template apply; matches TemplateContinuity. */
export type ProjectContinuity = {
  enabled?: boolean;
  characterCarryOver?: boolean;
  directionCarryOver?: boolean;
  cameraCarryOver?: boolean;
  bgCarryOver?: boolean;
  referenceSlots?: unknown[];
};

export type Project = {
  /** Stable project id (set on create/duplicate). */
  id?: string;
  /** Display name (set on create/duplicate, user can rename). */
  name?: string;
  project: { mode: Mode; mediaType?: MediaType; shotPlan?: ShotPlan; creativeContext?: ProjectCreativeContext };
  scenes: Scene[];
  meta?: ProjectMeta;
  /** From payload.continuity when template applied. */
  continuity?: ProjectContinuity;
};

const MEDIA_MARK = "media:";
const COMPILER_MARK = "@compiler:";
const SCENE_TIER_MARK = "@scene_tier:";
const V2_MODE_MARK = "@v2_mode:";
const STAB_MARK = "stability:";

function parseMarker(notes: string, mark: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
  if (!hit) return "";
  return hit.trim().slice(mark.length).trim().toLowerCase();
}

function replaceMarker(notes: string, mark: string, value: string): string {
  const lines = (notes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rest = lines.filter((line) => !line.toLowerCase().startsWith(mark));
  return [`${mark} ${value}`, ...rest].join("\n");
}

export type ResolvedSceneConfig = {
  mediaMode: MediaType;
  compiler: SceneCompiler;
  sceneTier: SceneTier;
  v2Mode: SceneV2Mode;
  stability: SceneStability;
};

export function resolveSceneConfig(scene: Pick<Scene, "notes" | "config">): ResolvedSceneConfig {
  const notes = scene?.notes ?? "";
  const conf = scene?.config ?? {};

  const mediaFromMarker = parseMarker(notes, MEDIA_MARK) === "image" ? "image" : "video";
  const compilerFromMarker = parseMarker(notes, COMPILER_MARK) === "v2" ? "v2" : "v1";
  const tierRaw = parseMarker(notes, SCENE_TIER_MARK);
  const sceneTierFromMarker: SceneTier = tierRaw === "indoor" || tierRaw === "open_space" ? tierRaw : "small_plaza";
  const v2FromMarker: SceneV2Mode = parseMarker(notes, V2_MODE_MARK) === "short" ? "short" : "strict";
  const stabRaw = parseMarker(notes, STAB_MARK);
  const stabilityFromMarker: SceneStability = stabRaw === "off" ? "off" : stabRaw === "strict" ? "strict" : "standard";

  return {
    mediaMode: conf.mediaMode === "image" || conf.mediaMode === "video" ? conf.mediaMode : mediaFromMarker,
    compiler: conf.compiler === "v2" ? "v2" : conf.compiler === "v1" ? "v1" : compilerFromMarker,
    sceneTier:
      conf.sceneTier === "indoor" || conf.sceneTier === "small_plaza" || conf.sceneTier === "open_space"
        ? conf.sceneTier
        : sceneTierFromMarker,
    v2Mode: conf.v2Mode === "short" || conf.v2Mode === "strict" ? conf.v2Mode : v2FromMarker,
    stability:
      conf.stability === "off" || conf.stability === "standard" || conf.stability === "strict"
        ? conf.stability
        : stabilityFromMarker
  };
}

export function withSceneConfig(scene: Scene, patch: Partial<ResolvedSceneConfig>): Scene {
  const base = resolveSceneConfig(scene);
  const nextConfig: ResolvedSceneConfig = { ...base, ...patch };
  let nextNotes = scene.notes ?? "";
  nextNotes = replaceMarker(nextNotes, MEDIA_MARK, nextConfig.mediaMode);
  nextNotes = replaceMarker(nextNotes, COMPILER_MARK, nextConfig.compiler);
  nextNotes = replaceMarker(nextNotes, SCENE_TIER_MARK, nextConfig.sceneTier);
  nextNotes = replaceMarker(nextNotes, V2_MODE_MARK, nextConfig.v2Mode);
  nextNotes = replaceMarker(nextNotes, STAB_MARK, nextConfig.stability);
  return { ...scene, notes: nextNotes, config: nextConfig };
}

// ---------- helpers (internal) ----------
function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function ensureArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

function inferMediaTypeFromScenes(scenes: Scene[]): MediaType {
  let hasImage = false;
  let hasVideo = false;
  for (const s of scenes) {
    const mediaMode = resolveSceneConfig(s).mediaMode;
    if (mediaMode === "image") hasImage = true;
    else hasVideo = true;
  }
  if (hasImage && !hasVideo) return "image";
  return "video";
}

/**
 * ✅ 关键点：不要让 UI / Stage 遇到 undefined 的 kf[0] / 找不到 t=0 / t=1
 * 这个函数会“就地补齐” layer.kf 的 t=0 或 t=1。
 */
export function ensureKF(layer: Layer, t: 0 | 1): LayerKF {
  const kfs = ensureArray<LayerKF>(layer.kf, []);
  layer.kf = kfs;

  const found = layer.kf.find((k) => k.t === t);
  if (found) return found;

  const base =
    layer.kf.find((k) => k.t === 0) ??
    layer.kf[0] ?? { t: 0 as const, x: 50, y: 50, w: 20, h: 20, rot: 0 };

  const created: LayerKF = { ...base, t };
  layer.kf.push(created);
  layer.kf.sort((a, b) => a.t - b.t);
  return created;
}

/**
 * ✅ 用于“从 storage 读出来”的项目做一次清洗：
 * - 补齐 scene.camera.keyframes 的 t=0/1
 * - 补齐每个 layer 的 t=0/1
 * - clamp 数值避免 NaN/越界导致画布爆掉
 *
 * 不改变数据结构，只保证字段健壮。
 */
export function sanitizeProject(p: Project): Project {
  // 尽量不假设 p 一定干净：但也不在这里做复杂 schema 校验
  const scenes = ensureArray<Scene>((p as any)?.scenes, []);

  for (const s of scenes) {
    s.duration_s = clamp((s as any).duration_s ?? 6, 1, 600);

    // camera
    if (!s.camera) {
      s.camera = {
        shot: "wide",
        movement: "static",
        keyframes: [
          { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
        ]
      };
    }
    s.camera.keyframes = ensureArray(s.camera.keyframes, []);
    const c0 = s.camera.keyframes.find((k) => k.t === 0) ?? { t: 0 as const, x: 0, y: 0, zoom: 1, rot: 0 };
    const c1 = s.camera.keyframes.find((k) => k.t === 1) ?? { ...c0, t: 1 as const };
    // 去重并排序
    s.camera.keyframes = [c0, c1].map((k) => ({
      ...k,
      x: clamp(k.x, -10000, 10000),
      y: clamp(k.y, -10000, 10000),
      zoom: clamp(k.zoom, 0.01, 100),
      rot: clamp(k.rot, -3600, 3600)
    }));

    // lighting
    if (!s.lighting) s.lighting = { time: "sunset", key_dir: "top_right", mood: "cinematic" };

    // layers
    s.layers = ensureArray<Layer>((s as any).layers, []);
    for (const l of s.layers) {
      l.opacity = clamp((l as any).opacity ?? 1, 0, 1);
      l.z = clamp((l as any).z ?? 0, -9999, 9999);
      l.look = (l as any).look ?? "";
      l.color = (l as any).color ?? "#b7c3ff";
      l.notes = (l as any).notes ?? "";
      l.externalPrompt = (l as any).externalPrompt ?? "";
      l.referenceLinks = (l as any).referenceLinks ?? "";
      l.localRefs = Array.isArray((l as any).localRefs) ? (l as any).localRefs : [];
      l.referencePolicy = (l as any).referencePolicy === "required" ? "required" : "optional";
      l.type = (l as any).type ?? "";
      l.shape = ((l as any).shape ?? "rect") as Shape;

      l.kf = ensureArray<LayerKF>((l as any).kf, []);
      const k0 = ensureKF(l, 0);
      const k1 = ensureKF(l, 1);

      // clamp kf 数值
      for (const k of [k0, k1]) {
        k.x = clamp(k.x, 0, 100);
        k.y = clamp(k.y, 0, 100);
        k.w = clamp(k.w, 0, 100);
        k.h = clamp(k.h, 0, 100);
        k.rot = clamp(k.rot, -3600, 3600);
      }
    }

    s.notes = (s as any).notes ?? "";
    s.config = resolveSceneConfig(s);
    s.name = (s as any).name ?? "Scene";
    s.id = (s as any).id ?? `s_${Math.random().toString(16).slice(2)}`;
    s.index = Number.isFinite((s as any).index) ? Math.max(1, Math.round((s as any).index)) : undefined;
    s.layoutLocked = !!(s as any).layoutLocked;
    const bgRefRaw = (s as any).backgroundRef;
    if (bgRefRaw && typeof bgRefRaw === "object" && typeof bgRefRaw.id === "string") {
      s.backgroundRef = {
        id: String(bgRefRaw.id),
        name: String(bgRefRaw.name ?? "background.jpg"),
        mime: String(bgRefRaw.mime ?? "image/jpeg"),
        size: Number.isFinite(bgRefRaw.size) ? Math.max(0, Number(bgRefRaw.size)) : 0,
        updatedAt: Number.isFinite(bgRefRaw.updatedAt) ? Number(bgRefRaw.updatedAt) : Date.now()
      };
    } else {
      s.backgroundRef = undefined;
    }
    s.cameraPreset = typeof (s as any).cameraPreset === "string" ? (s as any).cameraPreset : "";
    s.shotNote = typeof (s as any).shotNote === "string" ? (s as any).shotNote : "";
    const entryRaw = String((s as any).entryDir ?? "").toUpperCase();
    const exitRaw = String((s as any).exitDir ?? "").toUpperCase();
    s.entryDir = (["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const).includes(entryRaw as any) ? (entryRaw as Direction) : undefined;
    s.exitDir = (["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const).includes(exitRaw as any) ? (exitRaw as Direction) : undefined;
  }

  // project meta
  if (!p.project) p.project = { mode: "storyboard" };
  p.project.mode = (p.project.mode ?? "storyboard") as Mode;
  p.project.mediaType = p.project.mediaType === "image" || p.project.mediaType === "video"
    ? p.project.mediaType
    : inferMediaTypeFromScenes(scenes);
  const rawPlan = (p.project.shotPlan ?? "single") as ShotPlan;
  p.project.shotPlan = (["single", "multicam", "continuous", "edit"] as const).includes(rawPlan as any) ? rawPlan : "single";
  const creativeRaw = (p.project as any).creativeContext;
  if (creativeRaw && typeof creativeRaw === "object") {
    p.project.creativeContext = {
      source:
        creativeRaw.source === "quick_workspace" || creativeRaw.source === "imported"
          ? creativeRaw.source
          : "manual",
      mediaType:
        creativeRaw.mediaType === "image" || creativeRaw.mediaType === "video"
          ? creativeRaw.mediaType
          : undefined,
      fileName: typeof creativeRaw.fileName === "string" ? creativeRaw.fileName.trim() : "",
      primaryInput: typeof creativeRaw.primaryInput === "string" ? creativeRaw.primaryInput.trim() : "",
      secondaryInput: typeof creativeRaw.secondaryInput === "string" ? creativeRaw.secondaryInput.trim() : "",
      mergedInput: typeof creativeRaw.mergedInput === "string" ? creativeRaw.mergedInput.trim() : "",
      intentSummary: typeof creativeRaw.intentSummary === "string" ? creativeRaw.intentSummary.trim() : "",
      locationHint: typeof creativeRaw.locationHint === "string" ? creativeRaw.locationHint.trim() : "",
      styleHint: typeof creativeRaw.styleHint === "string" ? creativeRaw.styleHint.trim() : "",
      subjectLabels: Array.isArray(creativeRaw.subjectLabels)
        ? (Array.from(
            new Set(
              creativeRaw.subjectLabels
                .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
                .filter(Boolean)
            )
          ).slice(0, 12) as string[])
        : []
    };
  } else {
    p.project.creativeContext = undefined;
  }

  scenes.forEach((s, i) => {
    if (!s.index) s.index = i + 1;
    const isFirst = i === 0;
    const rawTransition = String((s as any).transitionType ?? "");
    const transition = (["cut", "reverse_angle", "camera_continues", "dissolve", "time_jump"] as const).includes(rawTransition as any)
      ? (rawTransition as TransitionType)
      : undefined;

    if (p.project.mediaType === "image" || p.project.shotPlan === "single") {
      s.inheritFromPrevious = false;
      s.inheritBgRefFromPrevious = false;
      s.inheritObjectRefsFromPrevious = "off";
      s.transitionType = "cut";
    } else if (p.project.shotPlan === "multicam") {
      s.inheritFromPrevious = isFirst ? false : (typeof (s as any).inheritFromPrevious === "boolean" ? !!(s as any).inheritFromPrevious : true);
      s.inheritBgRefFromPrevious = isFirst
        ? false
        : (typeof (s as any).inheritBgRefFromPrevious === "boolean" ? !!(s as any).inheritBgRefFromPrevious : true);
      s.inheritObjectRefsFromPrevious = isFirst
        ? "off"
        : (String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "identity_only"
            ? "identity_only"
            : String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
              ? "off"
              : "all");
      s.transitionType = transition ?? "reverse_angle";
    } else if (p.project.shotPlan === "continuous") {
      s.inheritFromPrevious = isFirst ? false : true;
      s.inheritBgRefFromPrevious = isFirst ? false : true;
      s.inheritObjectRefsFromPrevious = isFirst
        ? "off"
        : (String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "identity_only"
            ? "identity_only"
            : String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
              ? "off"
              : "all");
      s.transitionType = "camera_continues";
    } else {
      s.inheritFromPrevious = isFirst ? false : (typeof (s as any).inheritFromPrevious === "boolean" ? !!(s as any).inheritFromPrevious : false);
      s.inheritBgRefFromPrevious = isFirst
        ? false
        : (typeof (s as any).inheritBgRefFromPrevious === "boolean" ? !!(s as any).inheritBgRefFromPrevious : false);
      s.inheritObjectRefsFromPrevious = isFirst
        ? "off"
        : (String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "all"
            ? "all"
            : String((s as any).inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
              ? "off"
              : "identity_only");
      s.transitionType = transition ?? "cut";
    }
  });

  // project.meta - appliedTemplateIds + currentTemplate + billing
  const metaRaw = (p as any).meta;
  if (metaRaw && typeof metaRaw === "object") {
    const appliedIds = Array.isArray(metaRaw.appliedTemplateIds)
      ? (metaRaw.appliedTemplateIds as unknown[])
          .filter((id): id is string => typeof id === "string" && id.length > 0)
          .slice(0, 500)
      : [];
    let currentTpl: CurrentTemplateContext | undefined;
    const ct = metaRaw.currentTemplate;
    if (ct && typeof ct === "object" && typeof ct.templateId === "string" && ct.templateId.length > 0) {
      currentTpl = {
        templateId: String(ct.templateId),
        familyId: String(ct.familyId ?? ""),
        familyNameZh: String(ct.familyNameZh ?? ""),
        familyNameEn: String(ct.familyNameEn ?? ""),
        variantId: String(ct.variantId ?? ""),
        variantNameZh: ct.variantNameZh != null ? String(ct.variantNameZh) : undefined,
        variantNameEn: ct.variantNameEn != null ? String(ct.variantNameEn) : undefined,
        titleZh: String(ct.titleZh ?? ""),
        titleEn: String(ct.titleEn ?? ""),
        category: String(ct.category ?? ""),
        domain: String(ct.domain ?? ""),
        tier: ct.tier != null ? String(ct.tier) : undefined,
        cost: Number(ct.cost) || 0,
        isFree: Boolean(ct.isFree),
        applyMode:
          ct.applyMode === "layout_plus_style"
            ? "layout_plus_style"
            : ct.applyMode === "full_workflow"
              ? "full_workflow"
              : "layout_only",
        appliedAt: typeof ct.appliedAt === "number" ? ct.appliedAt : undefined,
        fromTemplateWorkspace: ct.fromTemplateWorkspace === true
      };
    }
    const proExportMode: ProExportMode = metaRaw.proExportMode === "package" ? "package" : "prompt_only";
    const billingRaw = metaRaw.billing;
    const billing =
      billingRaw && typeof billingRaw === "object"
        ? {
            appliedTemplateCharges: Array.isArray(billingRaw.appliedTemplateCharges)
              ? (billingRaw.appliedTemplateCharges as unknown[])
                  .filter(
                    (c): c is { templateId: string; cost: number; chargedAt: string; chargeType: string } =>
                      c != null &&
                      typeof c === "object" &&
                      typeof (c as any).templateId === "string" &&
                      typeof (c as any).cost === "number" &&
                      typeof (c as any).chargedAt === "string" &&
                      (c as any).chargeType === "template_apply"
                  )
                  .map((c) => ({
                    templateId: String((c as any).templateId),
                    familyId: typeof (c as any).familyId === "string" ? (c as any).familyId : undefined,
                    variantId: typeof (c as any).variantId === "string" ? (c as any).variantId : undefined,
                    cost: Number((c as any).cost) || 0,
                    chargedAt: String((c as any).chargedAt),
                    chargeType: "template_apply" as const
                  }))
                  .slice(0, 500)
              : [],
            generationCharges: Array.isArray(billingRaw.generationCharges)
              ? (billingRaw.generationCharges as unknown[])
                  .filter(
                    (c): c is { cost: number; chargedAt: string; chargeType: string } =>
                      c != null &&
                      typeof c === "object" &&
                      typeof (c as any).cost === "number" &&
                      typeof (c as any).chargedAt === "string"
                  )
                  .map((c) => ({
                    sceneId: typeof (c as any).sceneId === "string" ? (c as any).sceneId : undefined,
                    platformId: typeof (c as any).platformId === "string" ? (c as any).platformId : undefined,
                    cost: Number((c as any).cost) || 0,
                    chargedAt: String((c as any).chargedAt),
                    chargeType:
                      (c as any).chargeType === "generate_video"
                        ? ("generate_video" as const)
                        : ("generate_image" as const)
                  }))
                  .slice(0, 200)
              : []
          }
        : undefined;
    const sourceType =
      metaRaw.sourceType === "template" || metaRaw.sourceType === "duplicate"
        ? metaRaw.sourceType
        : metaRaw.sourceType === "blank"
          ? "blank"
          : undefined;
    const pricingBucketAtCreation =
      typeof metaRaw.pricingBucketAtCreation === "string" && /^(F0|C1|C2|P2|P3)$/.test(metaRaw.pricingBucketAtCreation)
        ? metaRaw.pricingBucketAtCreation
        : undefined;
    p.meta = {
      sourceType,
      sourceTemplateId: typeof metaRaw.sourceTemplateId === "string" ? metaRaw.sourceTemplateId : undefined,
      sourceTemplateSlug: typeof metaRaw.sourceTemplateSlug === "string" ? metaRaw.sourceTemplateSlug : undefined,
      basedOnProjectId: typeof metaRaw.basedOnProjectId === "string" ? metaRaw.basedOnProjectId : undefined,
      templateOwnedAtCreation: metaRaw.templateOwnedAtCreation === true,
      pricingBucketAtCreation,
      appliedTemplateIds: appliedIds,
      currentTemplate: currentTpl,
      proExportMode,
      ...(billing ? { billing } : {})
    };
  } else {
    p.meta = { appliedTemplateIds: [], proExportMode: "prompt_only" as ProExportMode };
  }

  if (typeof (p as any).id === "string" && (p as any).id.length > 0) {
    (p as Project).id = (p as any).id;
  }
  if (typeof (p as any).name === "string") {
    (p as Project).name = (p as any).name;
  }

  p.scenes = scenes;
  return p;
}

export function defaultProject(): Project {
  const p: Project = {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
    scenes: [
      {
        id: "s1",
        name: "Main Frame",
        duration_s: 6,
        camera: {
          shot: "wide",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "sunset", key_dir: "top_right", mood: "cinematic" },
        layers: [
          {
            id: "Subject 1",
            type: "subject",
            shape: "ring",
            shapeDesc: "ring station, modular",
            look: "",
            z: 30,
            color: "#b7c3ff",
            opacity: 0.95,
            kf: [
              { t: 0, x: 58, y: 55, w: 26, h: 18, rot: 12 },
              { t: 1, x: 58, y: 55, w: 26, h: 18, rot: 12 }
            ],
            notes: "",
            externalPrompt: "",
            referenceLinks: "",
            localRefs: [],
            referencePolicy: "optional"
          }
        ],
        config: {
          mediaMode: "video",
          compiler: "v1",
          sceneTier: "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: ""
      }
    ]
  };

  return sanitizeProject(p);
}
