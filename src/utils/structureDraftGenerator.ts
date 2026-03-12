import type { Lang } from "../i18n";
import type {
  DraftObject,
  ImageStructureHint,
  StructureDraft,
  StructureHint,
  VideoStructureHint
} from "../types/structureDraft";
import {
  defaultVideoContinuity,
  defaultVideoShotCount,
  extractImageObjects,
  extractImageRelations,
  extractImageScene,
  extractVideoObjects,
  generateVideoShotTitles,
  inferImageFocus,
  inferImageStructureHintByKeywords,
  inferMainSceneByKeywords,
  inferVideoStructureHintByKeywords
} from "./structureDraftRules";

export type GenerateStructureDraftArgs = {
  mediaType: "image" | "video";
  structureHint?: string | null;
  userInput: string;
  lang: Lang;
};

export function defaultStructureHint(mediaType: "image" | "video"): StructureHint {
  return mediaType === "video" ? "single_shot" : "single_subject";
}

export function validStructureHints(mediaType: "image" | "video"): StructureHint[] {
  return mediaType === "video"
    ? ["single_shot", "multicam", "continuous", "multi_scene"]
    : ["single_subject", "multi_subject", "environment", "product_object"];
}

export function normalizeStructureHint(mediaType: "image" | "video", hint: string | null | undefined): StructureHint {
  const valid = validStructureHints(mediaType);
  if (hint && valid.includes(hint as StructureHint)) return hint as StructureHint;
  return defaultStructureHint(mediaType);
}

function inferByKeywords(mediaType: "image" | "video", userInput: string): StructureHint {
  if (mediaType === "image") return inferImageStructureHintByKeywords(userInput);
  return inferVideoStructureHintByKeywords(userInput);
}

function resolveStructureHint(args: GenerateStructureDraftArgs): StructureHint {
  const valid = validStructureHints(args.mediaType);
  if (args.structureHint && valid.includes(args.structureHint as StructureHint)) {
    return args.structureHint as StructureHint;
  }
  const inferred = inferByKeywords(args.mediaType, args.userInput);
  if (valid.includes(inferred)) return inferred;
  return defaultStructureHint(args.mediaType);
}

export function completeStructureDraft(draft: StructureDraft, _args: GenerateStructureDraftArgs): StructureDraft {
  return draft;
}

export function generateStructureDraft(args: GenerateStructureDraftArgs): StructureDraft {
  const structureType = resolveStructureHint(args);
  if (args.mediaType === "image") {
    const imageType = structureType as ImageStructureHint;
    const rawObjects = extractImageObjects(args.userInput, args.lang);
    const objects: DraftObject[] = rawObjects.map((item, index) => ({
      ...item,
      role: item.isPrimary || index === 0 ? "primary" : index === rawObjects.length - 1 && imageType === "environment" ? "environment" : "secondary",
      depth: index === 0 ? "foreground" : index === rawObjects.length - 1 ? "background" : "midground"
    }));
    const scene = extractImageScene(args.userInput, args.lang);
    const spatialRelations = extractImageRelations(args.userInput, args.lang);
    const focus = inferImageFocus(args.userInput, imageType, args.lang);
    const subjectCount = Math.max(1, Math.min(4, objects.length || (imageType === "single_subject" ? 1 : 2))) as 1 | 2 | 3 | 4;
    const focusMode = imageType === "environment"
      ? "environment"
      : imageType === "multi_subject"
        ? "relation"
        : "subject";
    const framing = spatialRelations.some((item) => /左|left/i.test(item))
      ? "left"
      : spatialRelations.some((item) => /右|right/i.test(item))
        ? "right"
        : "center";
    const backgroundDensity = imageType === "environment" ? "rich" : imageType === "product_object" ? "clean" : "normal";
    return completeStructureDraft({
      mediaType: "image",
      primaryBrief: args.userInput.trim(),
      secondaryBrief: "",
      structureType: imageType,
      objects,
      scene,
      sceneType: imageType === "product_object" ? "product_display" : /室内|房间|indoor|room|interior/i.test(scene) ? "indoor" : /室外|街|外景|outdoor|street|city|forest/i.test(scene) ? "outdoor" : "complex",
      spatialRelations,
      focus,
      relationMode: imageType === "multi_subject" ? "left_right" : imageType === "environment" ? "subject_environment" : "solo",
      emphasis: focus,
      compositionFocus: imageType === "environment" ? "environment_wrap" : imageType === "product_object" ? "product_showcase" : imageType === "multi_subject" ? "relation_expression" : "subject_highlight",
      styleGoal: "cinematic",
      subjectScale: "balanced",
      composition: {
        subjectCount,
        focusMode,
        framing,
        backgroundDensity
      }
    }, args);
  }

  const videoType = structureType as VideoStructureHint;
  const rawObjects = extractVideoObjects(args.userInput, args.lang);
  const objects: DraftObject[] = rawObjects.map((name, index) => ({
    id: `subject_${index + 1}`,
    name,
    type: "unknown",
    role: index === 0 ? "primary" : "secondary",
    depth: "midground",
    isPrimary: index === 0
  }));
  const shotCount = defaultVideoShotCount(videoType) as 1 | 3 | 4 | 5;
  const titles = generateVideoShotTitles(args.userInput, shotCount, args.lang);
  const mainScene = inferMainSceneByKeywords(args.userInput, videoType);
  const sceneTransition = videoType === "multi_scene" ? "location_switch" : "none";
  return completeStructureDraft({
    mediaType: "video",
    primaryBrief: args.userInput.trim(),
    secondaryBrief: "",
    structureType: videoType,
    scene: extractImageScene(args.userInput, args.lang),
    objects,
    shotCount,
    mainScene,
    continuityFocus: "identity",
    rhythm: videoType === "continuous" ? "push" : videoType === "multicam" ? "switch" : videoType === "multi_scene" ? "emotion" : "stable",
    sceneTransitions: sceneTransition,
    cameraMotion: videoType === "single_shot" ? "follow" : "static",
    expressionFocus: "character_action",
    styleGoal: "cinematic",
    shots: Array.from({ length: shotCount }, (_, i) => ({
      id: `shot_${i + 1}`,
      index: i + 1,
      title: titles[i],
      durationSec: videoType === "single_shot" ? 6 : 4,
      sceneLabel: extractImageScene(args.userInput, args.lang),
      objectIds: objects.map((item) => item.id),
      transitionFromPrev: i === 0 ? "none" : videoType === "multi_scene" ? "location_switch" : "same_space",
      emphasis: titles[i]
    })),
    continuity: defaultVideoContinuity(args.lang)
  }, args);
}
