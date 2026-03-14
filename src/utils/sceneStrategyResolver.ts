import type { Lang } from "../i18n";
import type { Project, Scene } from "../model";
import { resolveSceneConfig } from "../model";
import { getDirectorStylePack, parseDirectorStylePackId } from "../content/directorStylePacks";
import { getLightingProfile, type LightingProfileId } from "../content/lightingProfiles";
import {
  parseImageProEffects,
  getImageClassicMode,
  getVideoClassicMode,
  parseImageClassicModeId,
  parseVideoClassicModeId
} from "../content/proCreativeModes";
import { parseProMotionSelection } from "../content/proCameraPresets";
import { parseCameraLanguageId, getCameraLanguageDisplayLabel } from "../content/cameraLanguageLayers";

export type SceneStrategyLayer = "none" | "classic" | "director" | "mixed";

export type ResolvedSceneStrategy = {
  classicModeId: string | null;
  directorPackId: string | null;
  defaults: {
    shot: string;
    movement: string;
    transitionType: string;
    time: string;
    keyDir: string;
    mood: string;
  };
  promptLines: string[];
  lightingProfileIds: LightingProfileId[];
};

export type ProjectSceneStrategySummary = {
  layer: SceneStrategyLayer;
  classicModeIds: string[];
  directorPackIds: string[];
  usesAdvancedLanguage: boolean;
  usesLightingDefaults: boolean;
  lightingProfileIds: LightingProfileId[];
};

export function resolveSceneStrategy(scene: Scene, lang: Lang, mediaMode: "image" | "video"): ResolvedSceneStrategy {
  const directorPackId = parseDirectorStylePackId(scene.notes ?? "");
  const directorPack = getDirectorStylePack(directorPackId);
  const classicModeId = mediaMode === "video"
    ? parseVideoClassicModeId(scene.notes ?? "")
    : parseImageClassicModeId(scene.notes ?? "");
  const classicMode = mediaMode === "video"
    ? getVideoClassicMode(classicModeId)
    : getImageClassicMode(classicModeId);

  const promptLines: string[] = [];
  const lightingProfileIds = Array.from(new Set<LightingProfileId>([
    ...((classicMode?.lightingProfileIds ?? []) as LightingProfileId[]),
    ...((directorPack?.lightingProfileIds ?? []) as LightingProfileId[])
  ]));
  if (classicMode) {
    promptLines.push(
      lang === "zh"
        ? `经典模式：${classicMode.nameZh}。${classicMode.effectZh}`
        : `Classic mode: ${classicMode.nameEn}. ${classicMode.effectEn}`
    );
  }
  if (directorPack) {
    promptLines.push(lang === "zh" ? directorPack.promptZh : directorPack.promptEn);
    const lightingCue = lang === "zh" ? directorPack.lightingCueZh : directorPack.lightingCueEn;
    const rhythmCue = lang === "zh" ? directorPack.rhythmCueZh : directorPack.rhythmCueEn;
    if (lightingCue) promptLines.push(lightingCue);
    if (rhythmCue) promptLines.push(rhythmCue);
  }
  for (const lightingProfileId of lightingProfileIds) {
    const profile = getLightingProfile(lightingProfileId);
    if (!profile) continue;
    promptLines.push(lang === "zh" ? profile.promptZh : profile.promptEn);
  }

  const cameraLanguageId = parseCameraLanguageId(scene.notes ?? "");
  if (cameraLanguageId) {
    const label = getCameraLanguageDisplayLabel(cameraLanguageId, lang, false);
    promptLines.push(lang === "zh" ? `镜头语言：${label}` : `Camera language: ${label}`);
  }

  return {
    classicModeId,
    directorPackId,
    defaults: {
      shot: classicMode?.shot ?? directorPack?.[mediaMode === "video" ? "videoDefaults" : "imageDefaults"]?.shot ?? "",
      movement: mediaMode === "video"
        ? ((classicMode && "movement" in classicMode ? classicMode.movement : "") || directorPack?.videoDefaults?.movement || "")
        : "",
      transitionType: mediaMode === "video"
        ? ((classicMode && "transitionType" in classicMode ? classicMode.transitionType ?? "" : "") || directorPack?.videoDefaults?.transitionType || "")
        : "",
      time: (classicMode?.time ?? "") || directorPack?.[mediaMode === "video" ? "videoDefaults" : "imageDefaults"]?.time || "",
      keyDir: (classicMode?.keyDir ?? "") || directorPack?.[mediaMode === "video" ? "videoDefaults" : "imageDefaults"]?.keyDir || "",
      mood: (classicMode?.mood ?? "") || directorPack?.[mediaMode === "video" ? "videoDefaults" : "imageDefaults"]?.mood || ""
    },
    promptLines,
    lightingProfileIds
  };
}

export function summarizeProjectSceneStrategy(project: Project): ProjectSceneStrategySummary {
  const classicModeIds = new Set<string>();
  const directorPackIds = new Set<string>();
  let usesAdvancedLanguage = false;
  let usesLightingDefaults = false;
  const lightingProfileIds = new Set<LightingProfileId>();

  for (const scene of project.scenes ?? []) {
    const mediaMode = resolveSceneConfig(scene).mediaMode;
    const strategy = resolveSceneStrategy(scene, "en", mediaMode);
    if (strategy.classicModeId) classicModeIds.add(strategy.classicModeId);
    if (strategy.directorPackId) directorPackIds.add(strategy.directorPackId);
    if (strategy.defaults.time || strategy.defaults.keyDir || strategy.defaults.mood || strategy.defaults.transitionType) {
      usesLightingDefaults = true;
    }
    for (const profileId of strategy.lightingProfileIds) lightingProfileIds.add(profileId);

    const notes = scene.notes ?? "";
    if (mediaMode === "video") {
      if (parseProMotionSelection(notes).proPlusIds.length) usesAdvancedLanguage = true;
    } else if (parseImageProEffects(notes).length) {
      usesAdvancedLanguage = true;
    }
  }

  const hasClassic = classicModeIds.size > 0;
  const hasDirector = directorPackIds.size > 0;
  const layer: SceneStrategyLayer = hasClassic && hasDirector
    ? "mixed"
    : hasDirector
      ? "director"
      : hasClassic
        ? "classic"
        : "none";

  return {
    layer,
    classicModeIds: Array.from(classicModeIds),
    directorPackIds: Array.from(directorPackIds),
    usesAdvancedLanguage,
    usesLightingDefaults,
    lightingProfileIds: Array.from(lightingProfileIds)
  };
}
