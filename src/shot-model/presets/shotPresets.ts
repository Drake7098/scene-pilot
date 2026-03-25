import type { MediaType } from "../../model";

export type ShotPresetId =
  | "sports_action_freeze"
  | "product_highlight_commercial"
  | "cinematic_space_atmosphere";

export type ShotPreset = {
  id: ShotPresetId;
  labelZh: string;
  labelEn: string;
  mediaMode: MediaType;
  intent: {
    subject: string;
    action: string;
    camera: string;
    composition: string;
    space: string;
    lighting: string;
    mood: string;
    continuity: string;
  };
  guardrails: string[];
};

export const SHOT_PRESETS: ShotPreset[] = [
  {
    id: "sports_action_freeze",
    labelZh: "体育动作冻结镜头",
    labelEn: "Sports Action Freeze Shot",
    mediaMode: "image",
    intent: {
      subject: "athlete as primary subject with clear body silhouette",
      action: "freeze the explosive action beat",
      camera: "tight-medium dynamic angle",
      composition: "subject-first with directional tension",
      space: "clean background separation",
      lighting: "high-contrast readable edge light",
      mood: "high energy with controlled clarity",
      continuity: "not required"
    },
    guardrails: [
      "keep object count stable",
      "no motion blur that breaks limb readability",
      "no text overlays"
    ]
  },
  {
    id: "product_highlight_commercial",
    labelZh: "广告级产品高光镜头",
    labelEn: "Commercial Product Highlight Shot",
    mediaMode: "image",
    intent: {
      subject: "single hero product",
      action: "micro-rotation or still hero emphasis",
      camera: "insert close-up with premium framing",
      composition: "center-pressure with material priority",
      space: "minimal clean set with depth layering",
      lighting: "premium highlights and controlled reflections",
      mood: "bright, premium, conversion-ready",
      continuity: "not required"
    },
    guardrails: [
      "preserve product geometry",
      "avoid over-stylized texture hallucination",
      "no unrelated extra objects"
    ]
  },
  {
    id: "cinematic_space_atmosphere",
    labelZh: "电影级空间氛围镜头",
    labelEn: "Cinematic Spatial Atmosphere Shot",
    mediaMode: "video",
    intent: {
      subject: "character plus environment relationship",
      action: "slow motivated movement through space",
      camera: "wide-to-medium cinematic progression",
      composition: "space-first with readable subject path",
      space: "foreground-midground-background separation",
      lighting: "low-key atmospheric depth",
      mood: "restrained tension and immersion",
      continuity: "carry direction, identity, and camera intent"
    },
    guardrails: [
      "no teleport or jump discontinuity",
      "maintain direction continuity",
      "keep identity stable across shots"
    ]
  }
];

export function getShotPreset(id: ShotPresetId): ShotPreset | null {
  return SHOT_PRESETS.find((item) => item.id === id) ?? null;
}
