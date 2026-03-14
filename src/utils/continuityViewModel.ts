/**
 * Continuity View Model - read layer for Continuity Panel.
 * Centralizes continuity state derived from project / scene data.
 */

import type { Project, Scene, Direction } from "../model";

const CONTINUITY_ID_MARK = "@continuityid:";
const DIRS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function parseContinuityId(notes: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(CONTINUITY_ID_MARK.toLowerCase()));
  if (!hit) return "";
  return hit.trim().slice(CONTINUITY_ID_MARK.length).trim();
}

function dirLabel(dir: Direction, lang: "zh" | "en"): string {
  const map: Record<Direction, { zh: string; en: string }> = {
    N: { zh: "北", en: "N" },
    NE: { zh: "东北", en: "NE" },
    E: { zh: "东", en: "E" },
    SE: { zh: "东南", en: "SE" },
    S: { zh: "南", en: "S" },
    SW: { zh: "西南", en: "SW" },
    W: { zh: "西", en: "W" },
    NW: { zh: "西北", en: "NW" }
  };
  const m = map[dir];
  return lang === "zh" ? (m?.zh ?? dir) : (m?.en ?? dir);
}

export type ContinuityViewModel = {
  continuityEnabled: boolean;
  templateType: "base" | "webdrama" | "anime" | null;
  currentSceneIndex: number;
  totalScenes: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevSceneId: string | null;
  nextSceneId: string | null;
  carryOver: {
    character: boolean;
    direction: boolean;
    camera: boolean;
    background: boolean;
  };
  sceneLinks: {
    fromPrevious: boolean;
    toNext: boolean;
    transition: string;
    entryDir: string;
    exitDir: string;
  };
  anchorSummary: string[];
  directionSummary: string;
};

export function buildContinuityViewModel(
  project: Project,
  currentSceneIndex: number
): ContinuityViewModel {
  const scenes = project.scenes ?? [];
  const shotPlan = (project.project?.shotPlan ?? "single") as string;
  const mediaType = project.project?.mediaType ?? "video";
  const current = scenes[currentSceneIndex] ?? null;
  const domain = project.meta?.currentTemplate?.domain ?? "";
  const isVideo = mediaType === "video";
  const isMultiScene = shotPlan === "continuous" || shotPlan === "multicam";
  const continuityEnabled = isVideo && isMultiScene;

  const templateType: ContinuityViewModel["templateType"] =
    domain === "webdrama_continuity"
      ? "webdrama"
      : domain === "anime_continuity"
        ? "anime"
        : "base";

  const prevScene = currentSceneIndex > 0 ? scenes[currentSceneIndex - 1] ?? null : null;
  const nextScene = currentSceneIndex < scenes.length - 1 && currentSceneIndex >= 0
    ? scenes[currentSceneIndex + 1] ?? null
    : null;

  const carryOver = {
    character: current?.inheritFromPrevious ?? false,
    direction: Boolean(current?.entryDir ?? current?.exitDir),
    camera: (current?.transitionType ?? "") === "camera_continues",
    background: current?.inheritBgRefFromPrevious ?? false
  };

  const transitionRaw = current?.transitionType ?? "cut";
  const transitionLabel = transitionRaw === "cut"
    ? "cut"
    : transitionRaw === "reverse_angle"
      ? "reverse_angle"
      : transitionRaw === "camera_continues"
        ? "camera_continues"
        : transitionRaw === "dissolve"
          ? "dissolve"
          : transitionRaw === "time_jump"
            ? "time_jump"
            : transitionRaw;

  const sceneLinks = {
    fromPrevious: currentSceneIndex > 0,
    toNext: currentSceneIndex < scenes.length - 1 && currentSceneIndex >= 0,
    transition: transitionLabel,
    entryDir: current?.entryDir ?? "",
    exitDir: current?.exitDir ?? ""
  };

  const anchorIds = new Set<string>();
  if (current?.layers) {
    for (const layer of current.layers) {
      const cid = parseContinuityId(layer.notes ?? "");
      if (cid) anchorIds.add(cid);
    }
  }
  const anchorSummary = Array.from(anchorIds);

  const dirParts: string[] = [];
  if (sceneLinks.entryDir) dirParts.push(`entry: ${sceneLinks.entryDir}`);
  if (sceneLinks.exitDir) dirParts.push(`exit: ${sceneLinks.exitDir}`);
  const directionSummary = dirParts.length > 0 ? dirParts.join(", ") : "";

  return {
    continuityEnabled,
    templateType,
    currentSceneIndex,
    totalScenes: scenes.length,
    hasPrev: currentSceneIndex > 0,
    hasNext: currentSceneIndex < scenes.length - 1 && currentSceneIndex >= 0,
    prevSceneId: prevScene?.id ?? null,
    nextSceneId: nextScene?.id ?? null,
    carryOver,
    sceneLinks,
    anchorSummary,
    directionSummary
  };
}

export function transitionLabel(lang: "zh" | "en", t: string): string {
  const map: Record<string, { zh: string; en: string }> = {
    cut: { zh: "切", en: "Cut" },
    reverse_angle: { zh: "反打", en: "Reverse" },
    camera_continues: { zh: "镜头延续", en: "Camera continues" },
    dissolve: { zh: "溶", en: "Dissolve" },
    time_jump: { zh: "跳切", en: "Time jump" }
  };
  const m = map[t] ?? { zh: t, en: t };
  return lang === "zh" ? m.zh : m.en;
}

export function dirDisplay(dir: string, lang: "zh" | "en"): string {
  if (!dir) return "";
  const d = dir.toUpperCase() as Direction;
  return DIRS.includes(d) ? dirLabel(d, lang) : dir;
}
