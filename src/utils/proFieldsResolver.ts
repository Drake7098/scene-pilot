import { parseProMotionSelection, PRO_CAMERA_PRESETS } from "../content/proCameraPresets";
import { DIRECTOR_STYLE_PACKS } from "../content/directorStylePacks";
import {
  VIDEO_CLASSIC_MODES,
  IMAGE_CLASSIC_MODES,
  IMAGE_PRO_EFFECTS,
  parseVideoClassicModeId,
  parseImageClassicModeId,
  parseImageProEffects,
} from "../content/proCreativeModes";
import { parseCameraLanguageId, isHiddenCameraLanguage, getTemplateHiddenCameraLanguageOptions } from "../content/cameraLanguageLayers";
import type { TemplatePayload } from "../template-engine/types/templatePayload";
import type { Lang } from "../i18n";

export type ActiveProFields = {
  proMotionIds: string[];
  directorPackId: string | null;
  videoClassicId: string | null;
  imageClassicId: string | null;
  imageProEffectIds: string[];
  hiddenCameraLangId: string | null;
};

export type ProFieldLabel = {
  key: string;
  labelZh: string;
  labelEn: string;
  category: "motion" | "director" | "classic" | "effect" | "camera";
};

/** 从 scene.notes 解析激活的 Pro 字段（Sidebar 用） */
export function resolveActiveProFields(notes: string): ActiveProFields {
  const motion = parseProMotionSelection(notes ?? "");
  const cameraLangId = parseCameraLanguageId(notes ?? "");
  return {
    proMotionIds: motion.proPlusIds ?? [],
    directorPackId: parseDirectorStylePackId(notes ?? "") ?? null,
    videoClassicId: parseVideoClassicModeId(notes ?? "") ?? null,
    imageClassicId: parseImageClassicModeId(notes ?? "") ?? null,
    imageProEffectIds: parseImageProEffects(notes ?? ""),
    hiddenCameraLangId: cameraLangId && isHiddenCameraLanguage(cameraLangId) ? cameraLangId : null,
  };
}

function parseDirectorStylePackId(notes: string): string | null {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find(l => l.trim().toLowerCase().startsWith("director_pack:"));
  return hit ? hit.trim().slice("director_pack:".length).trim() || null : null;
}

export function hasAnyProFields(notes: string): boolean {
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

/** 从 TemplatePayload 读取 Pro 字段标签（详情页用，优先 raw.notes，缺失时回退快照） */
export function getProFieldLabelsFromPayload(payload: TemplatePayload, lang: Lang): ProFieldLabel[] {
  const scene = payload.scenes?.[0];
  if (!scene) return [];
  const rawNotes = (scene.raw as { notes?: string } | undefined)?.notes;
  const notesSource = rawNotes ?? buildNotesFromSnapshot(scene);
  return getProFieldLabels(notesSource, lang);
}

function buildNotesFromSnapshot(scene: TemplatePayload["scenes"][0]): string {
  const parts: string[] = [];
  if (scene.directorStylePack) parts.push(`director_pack: ${scene.directorStylePack}`);
  if (scene.cameraLanguage) parts.push(`camera_language: ${scene.cameraLanguage}`);
  if (scene.imageProEffects) parts.push(`image_pro_effects: ${scene.imageProEffects}`);
  if (scene.classicMotion) parts.push(`video_classic_mode: ${scene.classicMotion}`);
  return parts.join("\n");
}

/** 从 scene.notes 读取标签（Sidebar 用） */
export function getProFieldLabels(notes: string, lang: Lang): ProFieldLabel[] {
  const f = resolveActiveProFields(notes);
  const labels: ProFieldLabel[] = [];

  if (f.videoClassicId) {
    const m = VIDEO_CLASSIC_MODES.find(x => x.id === f.videoClassicId);
    if (m) labels.push({ key: m.id, labelZh: m.nameZh, labelEn: m.nameEn, category: "classic" });
  }
  if (f.imageClassicId) {
    const m = IMAGE_CLASSIC_MODES.find(x => x.id === f.imageClassicId);
    if (m) labels.push({ key: m.id, labelZh: m.nameZh, labelEn: m.nameEn, category: "classic" });
  }
  if (f.directorPackId) {
    const m = DIRECTOR_STYLE_PACKS.find(x => x.id === f.directorPackId);
    if (m) labels.push({ key: m.id, labelZh: m.labelZh, labelEn: m.labelEn, category: "director" });
  }
  for (const id of f.proMotionIds) {
    const m = PRO_CAMERA_PRESETS.find(x => x.id === id);
    if (m) labels.push({ key: m.id, labelZh: m.labelZh, labelEn: m.labelEn, category: "motion" });
  }
  for (const id of f.imageProEffectIds) {
    const m = IMAGE_PRO_EFFECTS.find(x => x.id === id);
    if (m) labels.push({ key: m.id, labelZh: m.labelZh, labelEn: m.labelEn, category: "effect" });
  }
  if (f.hiddenCameraLangId) {
    const m = getTemplateHiddenCameraLanguageOptions().find(x => x.id === f.hiddenCameraLangId);
    if (m) labels.push({ key: m.id, labelZh: m.labelZh, labelEn: m.labelEn, category: "camera" });
  }

  return labels;
}
