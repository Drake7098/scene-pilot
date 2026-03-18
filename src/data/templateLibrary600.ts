/**
 * Template Library 600 - Spec-driven generation.
 * 40 families × 10 variants = 400 base
 * + 100 webdrama + 100 anime (continuity, built elsewhere)
 *
 * Based on: familySpec, variantRules, payloadSchema (docs/)
 */

import type { Scene, Layer, Camera, Lighting } from "../model";
import type { UnifiedTemplate, TemplateCategory, TemplateVariant } from "../types/templateWorkspace";
import { applyCameraLanguage } from "../content/cameraLanguageLayers";

// --- Variants (from variant rules) ---
const VARIANTS: TemplateVariant[] = [
  "free_starter",
  "vertical_9_16",
  "horizontal_16_9",
  "cinematic",
  "multi_object",
  "advanced_motion"
];

// --- Families (from template-family-spec) ---
const FAMILIES: {
  id: string;
  nameEn: string;
  nameZh: string;
  category: TemplateCategory;
  mediaType: "image" | "video";
  storyPlan: UnifiedTemplate["storyPlan"];
}[] = [
  { id: "product_hero", nameEn: "Product Hero", nameZh: "产品主图", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_center_display", nameEn: "Product Center Display", nameZh: "产品居中展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_compare", nameEn: "Product Compare", nameZh: "双产品对比", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "feature_breakdown", nameEn: "Feature Breakdown", nameZh: "功能拆解", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "logo_copy_layout", nameEn: "Logo Copy Layout", nameZh: "Logo 与文案布局", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_in_hand", nameEn: "Product In Hand", nameZh: "手持产品展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "floating_product_showcase", nameEn: "Floating Product Showcase", nameZh: "悬浮产品展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "white_bg_product", nameEn: "White Background Product", nameZh: "电商白底展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "dialogue_duo", nameEn: "Dialogue Duo", nameZh: "双人对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "solo_speaker", nameEn: "Solo Speaker", nameZh: "单人主讲", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "interview_layout", nameEn: "Interview Layout", nameZh: "采访结构", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "faceoff_scene", nameEn: "Face-off Scene", nameZh: "对峙场景", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "tracking_dialogue", nameEn: "Tracking Dialogue", nameZh: "跟拍对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "multi_person_dialogue", nameEn: "Multi-Person Dialogue", nameZh: "多人站位对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "social_vertical_ad", nameEn: "Social Vertical Ad", nameZh: "社媒竖版广告", category: "social", mediaType: "image", storyPlan: "single" },
  { id: "selling_point_ad", nameEn: "Selling Point Ad", nameZh: "产品卖点广告", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "cta_landing_layout", nameEn: "CTA Landing Layout", nameZh: "行动召唤布局", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "talking_head_ad", nameEn: "Talking Head Ad", nameZh: "口播广告", category: "ad", mediaType: "video", storyPlan: "single" },
  { id: "app_promo_layout", nameEn: "App Promo Layout", nameZh: "应用宣传布局", category: "social", mediaType: "image", storyPlan: "single" },
  { id: "brand_promo_cover", nameEn: "Brand Promo Cover", nameZh: "品牌宣传封面", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "opening_shot", nameEn: "Opening Shot", nameZh: "开场镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "character_entrance", nameEn: "Character Entrance", nameZh: "角色入场", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "scene_push_forward", nameEn: "Scene Push Forward", nameZh: "场景推进", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "emotional_peak", nameEn: "Emotional Peak", nameZh: "情绪爆点", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "turning_point_shot", nameEn: "Turning Point Shot", nameZh: "转折镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "ending_closure", nameEn: "Ending Closure", nameZh: "结尾收束", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "push_in_motion", nameEn: "Push-in Motion", nameZh: "推镜", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "pull_out_motion", nameEn: "Pull-out Motion", nameZh: "拉镜", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "pan_motion", nameEn: "Pan Motion", nameZh: "横移镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "tracking_motion", nameEn: "Tracking Motion", nameZh: "跟拍镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "orbit_motion", nameEn: "Orbit Motion", nameZh: "环绕镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "crane_motion", nameEn: "Crane Motion", nameZh: "升降镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "center_composition", nameEn: "Center Composition", nameZh: "居中构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "symmetry_composition", nameEn: "Symmetry Composition", nameZh: "对称构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "asymmetry_composition", nameEn: "Asymmetry Composition", nameZh: "不对称构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "multi_object_composition", nameEn: "Multi-Object Composition", nameZh: "多对象构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "continuous_single_scene", nameEn: "Continuous Single Scene", nameZh: "单场景连续", category: "continuous", mediaType: "video", storyPlan: "continuous" },
  { id: "multi_scene_continuity", nameEn: "Multi-Scene Continuity", nameZh: "多分镜连续", category: "continuous", mediaType: "video", storyPlan: "multi_cam" },
  { id: "poster_cover", nameEn: "Poster Cover", nameZh: "海报封面", category: "cover_poster", mediaType: "image", storyPlan: "single" },
  { id: "title_subtitle_layout", nameEn: "Title Subtitle Layout", nameZh: "标题字幕布局", category: "cover_poster", mediaType: "image", storyPlan: "single" }
];

const MULTI_PERSON_DIALOGUE_FAMILIES = [
  "dialogue_duo",
  "interview_layout",
  "faceoff_scene",
  "tracking_dialogue",
  "multi_person_dialogue"
];

const CAMERA_MOVE_FAMILIES = [
  "push_in_motion",
  "pull_out_motion",
  "pan_motion",
  "tracking_motion",
  "orbit_motion",
  "crane_motion"
];

const FREE_DESCRIPTIONS: Record<string, { descriptionZh: string; descriptionEn: string }> = {
  product_hero: { descriptionZh: "适合快速生成单产品主视觉，居中主体，保留标题与 logo 区域。", descriptionEn: "A quick starter for single-product hero scenes with centered subject and reserved title/logo zones." },
  product_center_display: { descriptionZh: "适合产品居中陈列与干净背景展示，适合电商与演示图。", descriptionEn: "A centered product display starter for clean layouts, ideal for commerce and demo visuals." },
  product_compare: { descriptionZh: "适合两款产品左右对比，强调差异与信息并列。", descriptionEn: "A starter for side-by-side comparison of two products with balanced information zones." },
  feature_breakdown: { descriptionZh: "适合主产品加多个说明区域，突出功能与结构分层。", descriptionEn: "A starter for main product plus supporting explanation areas to highlight features and structure." },
  logo_copy_layout: { descriptionZh: "适合品牌标题、主文案与 logo 的标准广告布局。", descriptionEn: "A starter for standard brand layouts with title, main copy, and logo placement." },
  product_in_hand: { descriptionZh: "适合人物手持产品的近景展示与代入式构图。", descriptionEn: "A starter for close-up product-in-hand scenes with more immersive framing." },
  floating_product_showcase: { descriptionZh: "适合产品悬浮、科技感或高端展示风格。", descriptionEn: "A starter for floating product layouts with a sleek tech or premium feel." },
  white_bg_product: { descriptionZh: "适合白底产品图、详情页主图与标准电商展示。", descriptionEn: "A starter for clean white-background product shots used in product listings and e-commerce." },
  dialogue_duo: { descriptionZh: "适合两人对话、对视、交流的基础镜头结构。", descriptionEn: "A starter for two-person dialogue scenes with balanced conversational framing." },
  solo_speaker: { descriptionZh: "适合单人口播、叙述、独白类镜头。", descriptionEn: "A starter for solo speaking, narration, or monologue-focused shots." },
  interview_layout: { descriptionZh: "适合采访、问答、半正式访谈结构。", descriptionEn: "A starter for interview or Q&A layouts with semi-formal framing." },
  faceoff_scene: { descriptionZh: "适合人物对立、冲突、张力关系的基础站位。", descriptionEn: "A starter for confrontational scenes with strong opposing character positioning." },
  tracking_dialogue: { descriptionZh: "适合边走边说、移动对话、跟拍式交流镜头。", descriptionEn: "A starter for walking dialogue and moving conversational shots." },
  multi_person_dialogue: { descriptionZh: "适合三人及以上交流场景，强调站位与关系层次。", descriptionEn: "A starter for three-or-more person dialogue scenes with layered character placement." },
  social_vertical_ad: { descriptionZh: "适合短视频平台竖版广告与快速传播场景。", descriptionEn: "A starter for vertical social ads optimized for short-form platforms." },
  selling_point_ad: { descriptionZh: "适合突出一个核心卖点的产品宣传镜头。", descriptionEn: "A starter for ads focused on one strong product selling point." },
  cta_landing_layout: { descriptionZh: "适合带按钮感、引导感的行动召唤型结构。", descriptionEn: "A starter for layouts with strong call-to-action emphasis." },
  talking_head_ad: { descriptionZh: "适合人物正面对镜介绍产品或观点。", descriptionEn: "A starter for talking-head presentations facing the camera directly." },
  app_promo_layout: { descriptionZh: "适合 App、SaaS、界面展示型宣传结构。", descriptionEn: "A starter for app and SaaS promotional layouts featuring UI showcases." },
  brand_promo_cover: { descriptionZh: "适合品牌海报、宣传封面与品牌识别镜头。", descriptionEn: "A starter for brand covers, promo posters, and identity-focused visuals." },
  opening_shot: { descriptionZh: "适合视频或故事的第一镜，建立空间与基调。", descriptionEn: "A starter for opening shots that establish space and tone." },
  character_entrance: { descriptionZh: "适合角色首次出现与注意力导入。", descriptionEn: "A starter for character entrance moments and first-appearance framing." },
  scene_push_forward: { descriptionZh: "适合从静态过渡到更聚焦主体的推进结构。", descriptionEn: "A starter for scenes that transition into a more focused subject framing." },
  emotional_peak: { descriptionZh: "适合情绪升高、冲突升级、爆点瞬间的构图。", descriptionEn: "A starter for emotional peaks, tension spikes, and dramatic moments." },
  turning_point_shot: { descriptionZh: "适合故事转折、信息变化、人物决断时刻。", descriptionEn: "A starter for turning points, revelations, and character decisions." },
  ending_closure: { descriptionZh: "适合结尾、回收情绪、完成收束的镜头结构。", descriptionEn: "A starter for ending shots that resolve tone and close the scene." },
  push_in_motion: { descriptionZh: "适合从中景推进主体，增强关注与压迫感。", descriptionEn: "A starter for push-in motion that increases focus and dramatic intensity." },
  pull_out_motion: { descriptionZh: "适合从近到远拉开空间，建立环境与关系。", descriptionEn: "A starter for pull-out motion that reveals space and context." },
  pan_motion: { descriptionZh: "适合水平移动展示空间、角色或对象关系。", descriptionEn: "A starter for horizontal motion that reveals space or object relationships." },
  tracking_motion: { descriptionZh: "适合跟随主体移动，保持关注与节奏。", descriptionEn: "A starter for motion that follows the subject while maintaining focus." },
  orbit_motion: { descriptionZh: "适合围绕主体建立立体感与戏剧张力。", descriptionEn: "A starter for orbit-style motion around the subject with more spatial drama." },
  crane_motion: { descriptionZh: "适合垂直运动、建立气势与层级变化。", descriptionEn: "A starter for crane-style vertical motion with stronger sense of scale." },
  center_composition: { descriptionZh: "适合主体明确、视觉中心稳定的标准构图。", descriptionEn: "A starter for centered compositions with clear, stable focal placement." },
  symmetry_composition: { descriptionZh: "适合秩序感、仪式感、品牌感较强的画面。", descriptionEn: "A starter for symmetrical scenes with order, ritual, or premium visual balance." },
  asymmetry_composition: { descriptionZh: "适合更自然、更动态、更具故事感的画面布局。", descriptionEn: "A starter for asymmetrical layouts with more natural and narrative-driven balance." },
  multi_object_composition: { descriptionZh: "适合三对象以上的复杂布局与前后层次关系。", descriptionEn: "A starter for multi-object layouts with layered depth and structured placement." },
  continuous_single_scene: { descriptionZh: "适合在同一场景中保持角色和构图连续推进。", descriptionEn: "A starter for maintaining continuity within a single evolving scene." },
  multi_scene_continuity: { descriptionZh: "适合多镜头之间保持角色、方向与空间一致。", descriptionEn: "A starter for preserving character, direction, and spatial continuity across scenes." },
  poster_cover: { descriptionZh: "适合封面、海报、宣传主视觉构图。", descriptionEn: "A starter for poster covers and promotional key visual layouts." },
  title_subtitle_layout: { descriptionZh: "适合标题、副标题、口号、字幕占位的标准结构。", descriptionEn: "A starter for title, subtitle, slogan, and caption-driven layouts." }
};

// --- Spec→Payload helpers (template-payload-schema-v2) ---
function layer(
  type: string,
  z: number,
  kf0: { x: number; y: number; w: number; h: number },
  continuityId?: string
): Omit<Layer, "id"> {
  const notes = continuityId ? `@continuityId:${continuityId}` : "";
  return {
    type,
    shape: "rect",
    look: "",
    z,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, x: kf0.x, y: kf0.y, w: kf0.w, h: kf0.h, rot: 0 },
      { t: 1, x: kf0.x, y: kf0.y, w: kf0.w, h: kf0.h, rot: 0 }
    ],
    notes,
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function mkScene(
  id: string,
  name: string,
  mediaType: "image" | "video",
  layers: Omit<Layer, "id">[],
  opts: {
    shot?: string;
    movement?: string;
    notes?: string;
  } = {}
): Scene {
  const genIds = (prefix: string) =>
    layers.map((_, i) => ({ ...layers[i], id: `${prefix}${i + 1}` })) as Layer[];
  let notes = `media: ${mediaType}\ngenmode: pro`;
  if (opts.notes) notes = opts.notes;
  return {
    id,
    name,
    index: 1,
    duration_s: 6,
    transitionType: "cut",
    camera: {
      shot: (opts.shot ?? (mediaType === "video" ? "medium" : "")) as Camera["shot"],
      movement: (opts.movement ?? (mediaType === "video" ? "static" : "")) as Camera["movement"],
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
      ]
    } as Camera,
    lighting: { time: "", key_dir: "", mood: "" } as Lighting,
    layers: genIds("layer"),
    config: { mediaMode: mediaType, compiler: mediaType === "video" ? "v2" : "v1" },
    notes
  };
}

/** spec.cameraLanguage → notes.camera_language */
function applyNotesCameraLanguage(notes: string, id: string): string {
  return applyCameraLanguage(notes, id);
}

/** spec.proMotion → notes.pro_basic_motion / pro_plus_motion */
function appendProMotionNotes(notes: string, basic?: string, plus?: string): string {
  let out = notes;
  if (basic) out += `\npro_basic_motion: ${basic}`;
  if (plus) out += `\npro_plus_motion: ${plus}`;
  return out;
}

/** Build scene from spec (variant rules + payload schema) */
function buildSceneFromSpec(
  familyId: string,
  variant: TemplateVariant,
  family: (typeof FAMILIES)[0]
): Scene {
  const mediaType = family.mediaType;
  const baseLayers = [
    layer("Subject", 20, { x: 50, y: 50, w: 28, h: 36 })
  ];
  let shot = "medium";
  let movement: string = mediaType === "video" ? "static" : "";
  let layers = baseLayers;
  let notes = `media: ${mediaType}\ngenmode: pro`;

  if (variant === "horizontal_16_9") shot = "wide";

  if (variant === "advanced_motion" && mediaType === "video") {
    movement = "slow_push_in";
  }

  if (variant === "cinematic") {
    notes = applyNotesCameraLanguage(notes, "cinematic_soft");
  } else if (variant === "advanced_motion") {
    notes = applyNotesCameraLanguage(notes, "hero_entry");
  }

  if (variant === "multi_object") {
    layers = [
      layer("Object 2", 18, { x: 30, y: 45, w: 18, h: 24 }),
      layer("Subject", 20, { x: 50, y: 50, w: 28, h: 36 }),
      layer("Object 3", 18, { x: 70, y: 45, w: 18, h: 24 })
    ];
  }

  const sceneId = `tpl_${familyId}_${variant}`;
  const scene = mkScene(sceneId, `${family.nameEn} - ${variant}`, mediaType, layers, {
    shot,
    movement: movement as Camera["movement"],
    notes
  });
  return scene;
}

function variantRatio(v: TemplateVariant): UnifiedTemplate["ratio"] {
  if (v === "vertical_9_16") return "9:16";
  if (v === "horizontal_16_9") return "16:9";
  return "16:9";
}

/** Template cost: 0=free, 1=basic, 2=advanced, 3=director/continuity/multi-shot. */
function templateCost(family: (typeof FAMILIES)[0], variant: TemplateVariant): number {
  if (variant === "free_starter") return 0;
  if (family.category === "continuous") return 3;
  if (variant === "multi_object" || variant === "advanced_motion") return 2;
  return 1;
}

function computeAdvancedTags(family: (typeof FAMILIES)[0], variant: TemplateVariant, cost: number): string[] {
  const tags: string[] = [];
  if (cost >= 2) tags.push("advanced_camera");
  if (family.category === "continuous") tags.push("continuity");
  if (family.storyPlan === "multi_cam") tags.push("multi_scene");
  if (variant === "cinematic") tags.push("cinematic_mode");
  if (variant === "advanced_motion") tags.push("drama_mode");
  if (family.category === "dialogue" && variant === "advanced_motion") tags.push("director_preset");
  return tags;
}

const VARIANT_LABELS: Record<TemplateVariant, { en: string; zh: string }> = {
  free_starter: { en: "Free Starter", zh: "免费起步版" },
  vertical_9_16: { en: "Vertical 9:16", zh: "竖版短视频版" },
  horizontal_16_9: { en: "Horizontal 16:9", zh: "横版标准版" },
  cinematic: { en: "Cinematic", zh: "电影质感版" },
  multi_object: { en: "Multi-Object", zh: "多对象复杂版" },
  advanced_motion: { en: "Advanced Motion", zh: "高级运动版" }
};

let _cached: UnifiedTemplate[] | null = null;

/** 400 base templates (spec-driven). Use with index + register400. */
export function getTemplateLibrary600Base(): UnifiedTemplate[] {
  if (_cached) return _cached;
  const out: UnifiedTemplate[] = [];
  for (const family of FAMILIES) {
    for (const variant of VARIANTS) {
      // 删除语义无效模版：多人对话类非 multi_object 变体缺人物层
      if (MULTI_PERSON_DIALOGUE_FAMILIES.includes(family.id) && variant !== "multi_object") continue;
      // 删除语义无效模版：镜头运动类非运动变体无运动参数
      if (CAMERA_MOVE_FAMILIES.includes(family.id) && 
          !["advanced_motion", "cinematic", "multi_object"].includes(variant)) continue;

      const isFree = variant === "free_starter";
      const cost = templateCost(family, variant);
      const scene = buildSceneFromSpec(family.id, variant, family);
      const id = `tpl400_${family.id}_${variant}`;
      const lbl = VARIANT_LABELS[variant];
      const name = `${family.nameEn} / ${lbl.en}`;
      const nameZh = `${family.nameZh}｜${lbl.zh}`;
      const freeDesc = FREE_DESCRIPTIONS[family.id];
      const desc = isFree && freeDesc
        ? freeDesc.descriptionEn
        : `${family.nameEn} template, ${lbl.en} variant. ${family.mediaType === "video" ? "Video" : "Image"} format.`;
      const descZh = isFree && freeDesc ? freeDesc.descriptionZh : undefined;
      const tags = [family.category, family.id, variant, family.mediaType];
      if (isFree) tags.push("free");
      const advancedTags = computeAdvancedTags(family, variant, cost);
      out.push({
        id,
        name,
        nameZh,
        family: family.nameEn,
        familyZh: family.nameZh,
        variant,
        category: family.category,
        description: desc,
        descriptionZh: descZh,
        tags,
        mediaType: family.mediaType,
        storyPlan: family.storyPlan,
        ratio: variantRatio(variant),
        isFree,
        cost,
        popularity: 70,
        isFeatured: isFree,
        scene,
        sceneDefaults: {},
        objects: [],
        exportDefaults: {},
        advancedTags: advancedTags.length > 0 ? advancedTags : undefined
      });
    }
  }
  _cached = out;
  return out;
}

/** Backward compat: same as getTemplateLibrary400 for base 400. */
export function getTemplateLibrary400(): UnifiedTemplate[] {
  return getTemplateLibrary600Base();
}

export function getFreeCount600(): number {
  return getTemplateLibrary600Base().filter((t) => t.isFree).length;
}

export function getTotalCount600(): number {
  return 400 + 200; // 400 base + 100 webdrama + 100 anime
}

/** Backward compat: free count in base 400. */
export function getFreeCount(): number {
  return getFreeCount600();
}

/** Backward compat: total in base 400 only. */
export function getTotalCount(): number {
  return 400;
}
