export type QuickWorkspaceStage = "input" | "draft" | "results" | "pro";

export type ImageStructureHint = "single_subject" | "multi_subject" | "environment" | "product_object";
export type VideoStructureHint = "single_shot" | "multicam" | "continuous" | "multi_scene";
export type StructureHint = ImageStructureHint | VideoStructureHint;

export type DraftObjectRole = "primary" | "secondary" | "support" | "environment";
export type DraftObjectDepth = "foreground" | "midground" | "background";

export type DraftObject = {
  id: string;
  name: string;
  type: "person" | "animal" | "prop" | "environment" | "unknown";
  role: DraftObjectRole;
  depth: DraftObjectDepth;
  isPrimary?: boolean;
};

export type StructureDraft =
  | {
      mediaType: "image";
      primaryBrief: string;
      secondaryBrief: string;
      structureType: ImageStructureHint;
      objects: DraftObject[];
      scene: string;
      sceneType: "indoor" | "outdoor" | "complex" | "product_display";
      spatialRelations: string[];
      focus: string;
      relationMode: "solo" | "eye_contact" | "confront" | "left_right" | "front_back" | "subject_environment";
      emphasis: string;
      compositionFocus: "subject_highlight" | "relation_expression" | "environment_wrap" | "product_showcase";
      styleGoal: "cinematic" | "realistic" | "animation" | "commercial";
      subjectScale: "tight" | "balanced" | "wide" | "detail";
      composition: {
        subjectCount: 1 | 2 | 3 | 4;
        focusMode: "subject" | "relation" | "environment";
        framing: "center" | "left" | "right" | "depth";
        backgroundDensity: "clean" | "normal" | "rich" | "strong_environment";
      };
    }
  | {
      mediaType: "video";
      primaryBrief: string;
      secondaryBrief: string;
      structureType: VideoStructureHint;
      scene: string;
      objects: DraftObject[];
      shotCount: 1 | 3 | 4 | 5;
      mainScene: "indoor" | "outdoor" | "complex" | "multi_scene";
      continuityFocus: "identity" | "scene" | "lighting" | "style";
      rhythm: "stable" | "push" | "switch" | "emotion";
      sceneTransitions: "none" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump";
      cameraMotion: "static" | "follow" | "push" | "orbit";
      expressionFocus: "character_action" | "relation_change" | "scene_progression" | "mood_atmosphere";
      styleGoal: "cinematic" | "realistic" | "animation" | "advertising";
      shots: Array<{
        id: string;
        index: number;
        title: string;
        durationSec: number;
        sceneLabel: string;
        objectIds: string[];
        transitionFromPrev: "none" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump";
        emphasis: string;
      }>;
      continuity: string[];
    };
