/**
 * 镜头语言分层规则 - 模板系统强制规则
 *
 * Layer 1: 用户可见 (~10-12) - Camera Control 面板可选
 * Layer 2: 模板内部隐藏 (~20-25) - 仅模板使用，UI 不可选
 * Layer 3: 底层完整 (50+) - engine / future pro mode
 *
 * @see docs/camera-language-layers-rule.md
 */

import type { Lang } from "../i18n";

export type CameraLanguageLayer = "user" | "template" | "internal";

export type CameraLanguageOption = {
  id: string;
  layer: CameraLanguageLayer;
  labelZh: string;
  labelEn: string;
  /** Layer 2 only: maps to Layer 1 id for display */
  mapsToUser?: string;
};

// --- Layer 1: User-visible (10-12) ---
const LAYER1_USER: CameraLanguageOption[] = [
  { id: "realistic_restrained", layer: "user", labelZh: "写实克制", labelEn: "Restrained Realistic" },
  { id: "commercial_ad", layer: "user", labelZh: "商业广告", labelEn: "Commercial Ad" },
  { id: "cinematic_narrative", layer: "user", labelZh: "电影叙事", labelEn: "Cinematic Narrative" },
  { id: "dialogue_cover", layer: "user", labelZh: "对话覆盖式", labelEn: "Dialogue Cover" },
  { id: "product_quality", layer: "user", labelZh: "产品质感", labelEn: "Product Quality" },
  { id: "social_direct", layer: "user", labelZh: "社媒直给", labelEn: "Social Direct" },
  { id: "emotional_pressure", layer: "user", labelZh: "情绪压迫", labelEn: "Emotional Pressure" },
  { id: "suspense_atmosphere", layer: "user", labelZh: "悬疑氛围", labelEn: "Suspense Atmosphere" },
  { id: "anime_dramatic", layer: "user", labelZh: "动漫戏剧化", labelEn: "Anime Dramatic" },
  { id: "premium_blockbuster", layer: "user", labelZh: "高级大片感", labelEn: "Premium Blockbuster" }
];

// --- Layer 2: Template-internal (hidden from user UI) ---
// Maps to Layer 1 for display when template applies
const LAYER2_TEMPLATE: CameraLanguageOption[] = [
  { id: "cinematic_soft", layer: "template", labelZh: "(电影柔和)", labelEn: "(Cinematic Soft)", mapsToUser: "cinematic_narrative" },
  { id: "cinematic_dark", layer: "template", labelZh: "(电影暗调)", labelEn: "(Cinematic Dark)", mapsToUser: "cinematic_narrative" },
  { id: "cinematic_wide", layer: "template", labelZh: "(电影宽幅)", labelEn: "(Cinematic Wide)", mapsToUser: "cinematic_narrative" },
  { id: "ad_luxury", layer: "template", labelZh: "(广告奢感)", labelEn: "(Ad Luxury)", mapsToUser: "commercial_ad" },
  { id: "ad_clean", layer: "template", labelZh: "(广告洁净)", labelEn: "(Ad Clean)", mapsToUser: "commercial_ad" },
  { id: "drama_tension", layer: "template", labelZh: "(戏剧张力)", labelEn: "(Drama Tension)", mapsToUser: "emotional_pressure" },
  { id: "drama_close", layer: "template", labelZh: "(戏剧特写)", labelEn: "(Drama Close)", mapsToUser: "emotional_pressure" },
  { id: "suspense_observe", layer: "template", labelZh: "(悬疑观察)", labelEn: "(Suspense Observe)", mapsToUser: "suspense_atmosphere" },
  { id: "thriller_lowkey", layer: "template", labelZh: "(惊悚低调)", labelEn: "(Thriller Lowkey)", mapsToUser: "suspense_atmosphere" },
  { id: "noir_shadow", layer: "template", labelZh: "(黑色电影)", labelEn: "(Noir Shadow)", mapsToUser: "suspense_atmosphere" },
  { id: "product_glossy", layer: "template", labelZh: "(产品光泽)", labelEn: "(Product Glossy)", mapsToUser: "product_quality" },
  { id: "product_dark", layer: "template", labelZh: "(产品暗调)", labelEn: "(Product Dark)", mapsToUser: "product_quality" },
  { id: "anime_dynamic", layer: "template", labelZh: "(动漫动态)", labelEn: "(Anime Dynamic)", mapsToUser: "anime_dramatic" },
  { id: "anime_pose", layer: "template", labelZh: "(动漫pose)", labelEn: "(Anime Pose)", mapsToUser: "anime_dramatic" },
  { id: "anime_battle", layer: "template", labelZh: "(动漫战斗)", labelEn: "(Anime Battle)", mapsToUser: "anime_dramatic" },
  { id: "hero_entry", layer: "template", labelZh: "(英雄出场)", labelEn: "(Hero Entry)", mapsToUser: "premium_blockbuster" },
  { id: "reveal_focus", layer: "template", labelZh: "(揭示聚焦)", labelEn: "(Reveal Focus)", mapsToUser: "cinematic_narrative" },
  { id: "emotional_peak", layer: "template", labelZh: "(情绪巅峰)", labelEn: "(Emotional Peak)", mapsToUser: "emotional_pressure" },
  { id: "handheld_real", layer: "template", labelZh: "(手持纪实)", labelEn: "(Handheld Real)", mapsToUser: "realistic_restrained" },
  { id: "documentary", layer: "template", labelZh: "(纪录片)", labelEn: "(Documentary)", mapsToUser: "realistic_restrained" },
  { id: "neon_city", layer: "template", labelZh: "(霓虹都市)", labelEn: "(Neon City)", mapsToUser: "social_direct" },
  { id: "studio_highkey", layer: "template", labelZh: "(棚拍高调)", labelEn: "(Studio Highkey)", mapsToUser: "commercial_ad" },
  { id: "studio_lowkey", layer: "template", labelZh: "(棚拍低调)", labelEn: "(Studio Lowkey)", mapsToUser: "commercial_ad" },
  { id: "luxury_light", layer: "template", labelZh: "(奢华光感)", labelEn: "(Luxury Light)", mapsToUser: "premium_blockbuster" },
  { id: "rim_light_focus", layer: "template", labelZh: "(边缘光聚焦)", labelEn: "(Rim Light Focus)", mapsToUser: "product_quality" }
];

const ALL_OPTIONS: CameraLanguageOption[] = [...LAYER1_USER, ...LAYER2_TEMPLATE];
const LAYER1_IDS = new Set(LAYER1_USER.map((o) => o.id));
const LAYER2_IDS = new Set(LAYER2_TEMPLATE.map((o) => o.id));
const OPTION_MAP = new Map(ALL_OPTIONS.map((o) => [o.id, o]));

/** 用户可见的镜头语言选项（仅 Layer 1） */
export function getUserVisibleCameraLanguageOptions(): CameraLanguageOption[] {
  return LAYER1_USER;
}

/** 模板内部可用的隐藏镜头语言（Layer 2） */
export function getTemplateHiddenCameraLanguageOptions(): CameraLanguageOption[] {
  return LAYER2_TEMPLATE;
}

/** 是否为隐藏镜头语言（Layer 2 或 Layer 3） */
export function isHiddenCameraLanguage(id: string | null | undefined): boolean {
  if (!id) return false;
  return LAYER2_IDS.has(id) || (!LAYER1_IDS.has(id) && OPTION_MAP.has(id));
}

/** 是否为 Layer 1 用户可见 */
export function isUserVisibleCameraLanguage(id: string | null | undefined): boolean {
  return id != null && LAYER1_IDS.has(id);
}

/** 获取显示标签：隐藏值映射到对应用户层标签，或返回「模板默认」 */
export function getCameraLanguageDisplayLabel(
  id: string | null | undefined,
  lang: Lang,
  fallbackTemplateDefault = false
): string {
  if (!id) return lang === "zh" ? "未选择" : "None";
  const opt = OPTION_MAP.get(id);
  if (!opt) return id;
  if (opt.layer === "user") return lang === "zh" ? opt.labelZh : opt.labelEn;
  if (opt.mapsToUser) {
    const userOpt = OPTION_MAP.get(opt.mapsToUser);
    if (userOpt) return lang === "zh" ? userOpt.labelZh : userOpt.labelEn;
  }
  return fallbackTemplateDefault
    ? (lang === "zh" ? "模板默认" : "Template default")
    : (lang === "zh" ? opt.labelZh : opt.labelEn);
}

/** 验证并规范化：若为隐藏值且用户不可选，返回映射后的用户层 id 或空 */
export function normalizeForUserSelection(id: string | null | undefined): string {
  if (!id) return "";
  if (LAYER1_IDS.has(id)) return id;
  const opt = OPTION_MAP.get(id);
  return opt?.mapsToUser ?? "";
}

/** 模板是否使用高级镜头语言（Layer 2+） */
export function templateUsesAdvancedCameraLanguage(cameraLanguageId: string | null | undefined): boolean {
  return isHiddenCameraLanguage(cameraLanguageId);
}

/** 高级模板标签（用于模板详情） */
export const ADVANCED_TEMPLATE_TAGS = {
  advanced_camera: { zh: "高级镜头", en: "Advanced Camera" },
  advanced_lighting: { zh: "高级光影", en: "Advanced Lighting" },
  director_preset: { zh: "导演控制", en: "Director Preset" },
  continuity: { zh: "连续模板", en: "Continuity" },
  multi_scene: { zh: "多分镜", en: "Multi Scene" },
  cinematic_mode: { zh: "电影模式", en: "Cinematic Mode" },
  anime_mode: { zh: "动漫模式", en: "Anime Mode" },
  drama_mode: { zh: "剧情模式", en: "Drama Mode" }
} as const;

export type AdvancedTemplateTagId = keyof typeof ADVANCED_TEMPLATE_TAGS;

export function getAdvancedTagLabel(tagId: AdvancedTemplateTagId, lang: Lang): string {
  const t = ADVANCED_TEMPLATE_TAGS[tagId];
  return lang === "zh" ? t.zh : t.en;
}

/** 镜头语言存储 marker */
export const CAMERA_LANGUAGE_MARK = "camera_language:";

function readMarker(notes: string, mark: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
  return hit ? hit.trim().slice(mark.length).trim() : "";
}

function writeMarker(notes: string, mark: string, value: string): string {
  const lines = (notes ?? "").split("\n").filter((line) => line.trim().length > 0);
  const next = lines.filter((line) => !line.trim().toLowerCase().startsWith(mark));
  if (value.trim()) next.push(`${mark} ${value.trim()}`);
  return next.join("\n");
}

/** Parse camera language id from scene notes */
export function parseCameraLanguageId(notes: string | null | undefined): string {
  const raw = readMarker(notes ?? "", CAMERA_LANGUAGE_MARK);
  return OPTION_MAP.has(raw) ? raw : "";
}

/** Apply camera language id to scene notes */
export function applyCameraLanguage(notes: string, id: string): string {
  const valid = id && OPTION_MAP.has(id) ? id : "";
  return writeMarker(notes, CAMERA_LANGUAGE_MARK, valid);
}
