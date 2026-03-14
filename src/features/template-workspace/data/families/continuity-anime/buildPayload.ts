/**
 * Build continuity payload for anime templates.
 * Real continuity: scenes >= 2, continuity.enabled, entry/exit direction, inherit.
 */

import type { Scene, Layer, Camera } from "../../../../../model";
import type { TemplatePayload, TemplateSceneSnapshot, TemplateProjectDefaults, TemplateContinuity } from "../../../model/templatePayload";
import type { ContinuityVariantAnime } from "../../../model/templateTypes";
import type { AnimeFamily } from "./families";

function layer(
  type: string,
  z: number,
  kf0: { x: number; y: number; w: number; h: number },
  continuityId?: string
): Layer {
  return {
    id: `layer_${type}_${z}`,
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
    notes: continuityId ? `@continuityId:${continuityId}` : "",
    externalPrompt: "",
    referenceLinks: "",
    referencePolicy: "optional"
  };
}

function mkScene(
  id: string,
  name: string,
  layers: Layer[],
  opts: { shot?: string; movement?: string; entryDir?: Scene["entryDir"]; exitDir?: Scene["exitDir"]; inheritFromPrevious?: boolean }
): Scene {
  return {
    id,
    name,
    index: 1,
    duration_s: 6,
    transitionType: "cut",
    inheritFromPrevious: opts.inheritFromPrevious ?? false,
    camera: {
      shot: opts.shot ?? "medium",
      movement: opts.movement ?? "static",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
      ]
    } as Camera,
    lighting: { time: "", key_dir: "", mood: "" },
    layers,
    config: { mediaMode: "video", compiler: "v2" },
    notes: `media: video\ngenmode: pro`,
    entryDir: opts.entryDir,
    exitDir: opts.exitDir
  };
}

export function buildAnimePayload(
  family: AnimeFamily,
  variant: ContinuityVariantAnime
): TemplatePayload {
  const subject = layer("Subject", 20, { x: 50, y: 50, w: 28, h: 40 }, "subject");
  const bg = layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 });

  const scene1 = mkScene(
    `s1_${family.id}`,
    `${family.nameEn} - Scene 1`,
    [bg, subject],
    { shot: "medium", movement: "static", exitDir: "E" }
  );
  const scene2 = mkScene(
    `s2_${family.id}`,
    `${family.nameEn} - Scene 2`,
    [bg, subject],
    { shot: "close", movement: "slow_push_in", entryDir: "W", inheritFromPrevious: true }
  );

  const scenes: TemplateSceneSnapshot[] = [
    { nameEn: scene1.name, duration: 6, raw: scene1, exitDirection: "E" },
    { nameEn: scene2.name, duration: 6, raw: scene2, entryDirection: "W", objectInheritance: "identity_only" }
  ];

  const continuity: TemplateContinuity = {
    enabled: true,
    characterCarryOver: true,
    directionCarryOver: true,
    cameraCarryOver: true,
    bgCarryOver: true,
    referenceSlots: [{ id: "subject", slot: 0 }] as unknown[]
  };

  const projectDefaults: TemplateProjectDefaults = {
    mediaType: "video",
    storyPlan: "continuous",
    aspectRatio: "16:9",
    sceneCount: 2,
    totalDuration: 12,
    sceneDurations: [6, 6]
  };

  return {
    projectDefaults,
    scenes,
    continuity,
    exportDefaults: { range: "continuous_sequence", method: "prompt", target: "fal" }
  };
}
