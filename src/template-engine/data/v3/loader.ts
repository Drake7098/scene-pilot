/**
 * V3 Template Loader
 * Builds TemplatePayload from V3Payload definition.
 * Templates without explicit payloads get a sensible default.
 */

import type { TemplatePayload } from "../../types/templatePayload";
import { getV3TemplateIndex } from "./templateIndex";
import { V3_PAYLOADS, type V3Payload } from "./payloads";

const payloadMap = new Map<string, V3Payload>(
  V3_PAYLOADS.map((p) => [p.templateId, p])
);

function buildDefaultNotes(mediaMode: "image" | "video"): string {
  return [
    "@compiler: v3",
    `media: ${mediaMode}`,
    "render_style:commercial",
    "shot_size:MCU",
    "focal_length:85mm",
    "depth_of_field:very_shallow",
    "bg_preset:gradient_black",
    "env_mood:luxurious",
    "key_light_time:studio",
    "color_temp:3200K",
    "spec_light:rim_light",
    "color_grade:warm_golden",
    "film_look:digital_clean",
    "narrative_rhythm:meditative",
    "visual_tension:none",
  ].join("\n");
}

export function loadV3TemplatePayload(templateId: string): TemplatePayload | null {
  const index = getV3TemplateIndex().find((t) => t.id === templateId);
  if (!index) return null;

  const def = payloadMap.get(templateId);
  const mediaMode = def?.mediaMode ?? index.mediaType ?? "image";
  const duration = def?.duration ?? (mediaMode === "video" ? 6 : 0);
  const aspectRatio = def?.aspectRatio ?? index.ratio ?? "16:9";

  const sceneNotes = def?.sceneNotes ?? buildDefaultNotes(mediaMode as "image" | "video");

  const layers = def?.layerLook
    ? [
        {
          id: "layer_subject_1",
          type: "subject",
          shape: "rect" as const,
          look: def.layerLook,
          shapeDesc: def.layerShapeDesc ?? "",
          z: 1,
          color: "#b7c3ff",
          opacity: 1,
          kf: [
            { t: 0, x: 50, y: 50, w: 35, h: 50, rot: 0 },
            { t: 1, x: 50, y: 50, w: 35, h: 50, rot: 0 },
          ],
          notes: def.layerNotes ?? "",
          externalPrompt: "",
          referenceLinks: "",
          referencePolicy: "optional" as const,
        },
      ]
    : [];

  const scene = {
    id: "scene_1",
    name: index.nameZh,
    index: 1,
    duration_s: duration,
    transitionType: "cut" as const,
    inheritFromPrevious: false,
    camera: {
      shot: "medium",
      movement: "static",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "", key_dir: "", mood: "" },
    layers,
    config: {
      mediaMode: mediaMode as "image" | "video",
      compiler: "v3" as const,
    },
    notes: sceneNotes,
    aspectRatio,
  };

  return {
    projectDefaults: {
      mediaType: mediaMode as "image" | "video",
      aspectRatio,
      storyPlan: "single" as const,
    },
    scenes: [
      {
        raw: scene,
      },
    ],
  };
}
