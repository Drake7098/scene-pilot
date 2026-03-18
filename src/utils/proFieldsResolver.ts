/**
 * proFieldsResolver.ts
 * 读取 scene.notes 里所有激活的 Pro 字段 marker，
 * 供 UI 层判断「当前场景是否携带专业字段」以及「携带了哪些」。
 *
 * 不修改任何数据，只读取和解析。
 */

import { parseProMotionSelection } from "../content/proCameraPresets";
import { parseDirectorStylePackId } from "../content/directorStylePacks";
import {
  parseVideoClassicModeId,
  parseImageClassicModeId,
  parseImageProEffects
} from "../content/proCreativeModes";
import {
  parseCameraLanguageId,
  isHiddenCameraLanguage
} from "../content/cameraLanguageLayers";

// ── 返回类型 ──────────────────────────────────────────────

export type ActiveProFields = {
  /** pro_plus_motion: 激活的专业镜头语言 id 列表（可多个） */
  proMotionIds: string[];
  /** director_pack: 激活的导演风格包 id，没有则为 null */
  directorPackId: string | null;
  /** video_classic_mode: 激活的视频经典模式 id，没有则为 null */
  videoClassicId: string | null;
  /** image_classic_mode: 激活的图片经典模式 id，没有则为 null */
  imageClassicId: string | null;
  /** image_pro_effects: 激活的图片专业特效 id 列表（可多个） */
  imageProEffectIds: string[];
  /** camera_language (hidden tier): 激活的隐藏镜头语言 id，没有则为 null */
  hiddenCameraLangId: string | null;
};

// ── 主函数 ────────────────────────────────────────────────

/**
 * 解析 scene.notes，返回所有激活的 Pro 字段。
 * 传入空字符串或 undefined 时，所有字段均为空/null。
 */
export function resolveActiveProFields(notes: string | undefined | null): ActiveProFields {
  const raw = notes ?? "";

  const motion = parseProMotionSelection(raw);
  const cameraLangId = parseCameraLanguageId(raw);

  return {
    proMotionIds: motion.proPlusIds ?? [],
    directorPackId: parseDirectorStylePackId(raw) ?? null,
    videoClassicId: parseVideoClassicModeId(raw) ?? null,
    imageClassicId: parseImageClassicModeId(raw) ?? null,
    imageProEffectIds: parseImageProEffects(raw) ?? [],
    hiddenCameraLangId:
      cameraLangId && isHiddenCameraLanguage(cameraLangId) ? cameraLangId : null,
  };
}

/**
 * 快速判断：当前场景是否携带任何 Pro 字段。
 * UI 层用这个决定是否显示 PRO 标识。
 */
export function hasAnyProFields(notes: string | undefined | null): boolean {
  const f = resolveActiveProFields(notes);
  return (
    f.proMotionIds.length > 0 ||
    f.directorPackId !== null ||
    f.videoClassicId !== null ||
    f.imageClassicId !== null ||
    f.imageProEffectIds.length > 0 ||
    f.hiddenCameraLangId !== null
  );
}

/**
 * 返回所有激活 Pro 字段的显示标签，供 tooltip 或 badge 使用。
 * lang: "zh" | "en"
 */
export function getProFieldLabels(
  notes: string | undefined | null,
  lang: "zh" | "en"
): string[] {
  const f = resolveActiveProFields(notes);
  const labels: string[] = [];

  if (f.proMotionIds.length > 0) {
    labels.push(
      lang === "zh"
        ? `专业镜头语言 (${f.proMotionIds.length}个)`
        : `Pro motion (${f.proMotionIds.length})`
    );
  }
  if (f.directorPackId) {
    labels.push(lang === "zh" ? "导演风格包" : "Director pack");
  }
  if (f.videoClassicId) {
    labels.push(lang === "zh" ? "视频经典模式" : "Video classic mode");
  }
  if (f.imageClassicId) {
    labels.push(lang === "zh" ? "图片经典模式" : "Image classic mode");
  }
  if (f.imageProEffectIds.length > 0) {
    labels.push(
      lang === "zh"
        ? `图片专业特效 (${f.imageProEffectIds.length}个)`
        : `Image pro effects (${f.imageProEffectIds.length})`
    );
  }
  if (f.hiddenCameraLangId) {
    labels.push(lang === "zh" ? "隐藏镜头语言层" : "Hidden camera language");
  }

  return labels;
}
