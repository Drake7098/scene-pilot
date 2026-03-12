import type { CanvasDraft } from "../types/canvasDraft";
import { applyDirectorStylePack, type DirectorStylePackId } from "../content/directorStylePacks";
import { setImageClassicModeMarker, setVideoClassicModeMarker } from "../content/proCreativeModes";

function hasWord(input: string, patterns: RegExp[]) {
  const text = (input ?? "").trim();
  return patterns.some((pattern) => pattern.test(text));
}

function inferImageClassicMode(canvas: Extract<CanvasDraft, { mediaType: "image" }>) {
  if (canvas.structureType === "product_object" || canvas.sceneType === "product_display") return "premium_product";
  if (canvas.subjectCount === "2" && ["eye_contact", "confront", "left_right"].includes(canvas.relationMode)) return "duo_tension";
  if (canvas.compositionFocus === "environment_wrap" || canvas.relationMode === "subject_environment" || canvas.backgroundDensity === "strong_environment") {
    return "lonely_env";
  }
  if (hasWord(canvas.emphasis, [/dream|ethereal|memory|soft|poetic/i, /梦|诗|回忆|朦胧|柔和/])) return "dream_portrait";
  if (canvas.subjectCount === "1" && canvas.compositionFocus === "center") return "poster_center";
  return "cinematic_still";
}

function inferImageDirectorPack(canvas: Extract<CanvasDraft, { mediaType: "image" }>) {
  if (canvas.structureType === "product_object" || canvas.sceneType === "product_display") return "commercial_spectacle";
  if (hasWord(canvas.emphasis, [/dream|ethereal|memory|soft|poetic|quiet/i, /梦|诗|回忆|朦胧|安静|留白/])) return "poetic_restraint";
  if (canvas.sceneType === "complex" || canvas.backgroundDensity === "strong_environment") return "architectural_tension";
  return "";
}

function inferVideoClassicMode(canvas: Extract<CanvasDraft, { mediaType: "video" }>) {
  if (canvas.structureType === "continuous") return "character_trail";
  if (canvas.sceneTransitions === "time_jump" || canvas.sceneTransitions === "location_switch" || canvas.sceneTransitions === "indoor_outdoor") return "rhythm_transition";
  if (canvas.rhythm === "emotion") return "emotion_push";
  if (canvas.rhythm === "push") return "hero_entry";
  return "steady_dialogue";
}

function inferVideoDirectorPack(canvas: Extract<CanvasDraft, { mediaType: "video" }>) {
  if (canvas.structureType === "continuous" || canvas.rhythm === "push") return "kinetic_pursuit";
  if (canvas.rhythm === "emotion") return "intimate_observation";
  if (canvas.mainScene === "complex" && canvas.continuityFocus === "scene") return "architectural_tension";
  if (canvas.continuityFocus === "style") return "commercial_spectacle";
  if (canvas.rhythm === "stable") return "poetic_restraint";
  return "";
}

export function applySceneStrategyFromCanvas(notes: string, canvas: CanvasDraft | null | undefined) {
  if (!canvas) return notes ?? "";

  if (canvas.mediaType === "image") {
    const classicModeId = inferImageClassicMode(canvas);
    const directorPackId = inferImageDirectorPack(canvas);
    let next = setImageClassicModeMarker(notes ?? "", classicModeId);
    next = applyDirectorStylePack(next, directorPackId as DirectorStylePackId | "");
    return next;
  }

  const classicModeId = inferVideoClassicMode(canvas);
  const directorPackId = inferVideoDirectorPack(canvas);
  let next = setVideoClassicModeMarker(notes ?? "", classicModeId);
  next = applyDirectorStylePack(next, directorPackId as DirectorStylePackId | "");
  return next;
}
