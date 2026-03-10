import type { CanvasDraft } from "./canvasDraft";

export type IntentPlan = {
  version: "v1";
  sourceBrief: string;
  lang: "zh" | "en";
  mediaType: "image" | "video";
  goal: "poster" | "storyframe" | "ad" | "portrait" | "scene" | "unknown";
  ratio: "1:1" | "16:9" | "9:16";
  style: {
    genre?: string;
    mood?: string;
    lighting?: string;
    palette?: string;
  };
  camera: {
    shotType?: "closeup" | "medium" | "wide";
    angle?: "eye" | "low" | "high";
    framing?: "center" | "left" | "right" | "balanced";
  };
  scene: {
    location?: string;
    backgroundDensity?: "clean" | "normal" | "rich";
    timeOfDay?: "day" | "night" | "indoor" | "unknown";
  };
  composition?: {
    visualFocus?: "left" | "center" | "right";
    primarySubjectWeight?: number;
    subjectScalePreference?: "small" | "medium" | "large";
    primaryDepth?: "foreground" | "midground" | "background";
  };
  subjects: Array<{
    id: string;
    label: string;
    role?: "main" | "secondary";
    positionHint?: "left" | "center" | "right" | "foreground" | "background";
    sizeHint?: "small" | "medium" | "large";
    locked?: boolean;
  }>;
  constraints: string[];
  hardConstraints?: string[];
  editHints: string[];
  proDirector?: {
    goal: "narrative_clear" | "emotional_impact" | "commercial_showcase";
    strength: "light" | "medium" | "strong";
    style: "realistic" | "cinematic" | "stylized";
    autoPack?: boolean;
  };
  canvas?: CanvasDraft;
};
