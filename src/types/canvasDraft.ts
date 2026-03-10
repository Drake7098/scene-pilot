import type { ImageStructureHint, VideoStructureHint } from "./structureDraft";

export type CanvasNodeRole = "primary" | "secondary" | "support" | "environment";
export type CanvasDepth = "foreground" | "midground" | "background";

export type ImageSceneType = "indoor" | "outdoor" | "complex" | "product_display";
export type ImageCompositionFocus = "center" | "left_right" | "depth" | "environment_wrap";
export type ImageBackgroundDensity = "clean" | "normal" | "rich" | "strong_environment";
export type ImageRelationMode = "solo" | "eye_contact" | "confront" | "left_right" | "front_back" | "subject_environment";

export type ImageCanvasNode = {
  id: string;
  label: string;
  role: CanvasNodeRole;
  kind: "subject" | "support" | "environment";
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
  depth: CanvasDepth;
  emphasis: "high" | "medium" | "low";
};

export type ImageSceneZone = {
  id: string;
  label: string;
  depth: CanvasDepth;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "subject" | "scene" | "product";
};

export type ImageCanvasDraft = {
  mediaType: "image";
  primaryBrief: string;
  secondaryBrief: string;
  structureType: ImageStructureHint;
  objects: Array<{
    id: string;
    label: string;
    role: CanvasNodeRole;
    kind: "subject" | "support" | "environment";
  }>;
  sceneType: ImageSceneType;
  compositionFocus: ImageCompositionFocus;
  subjectCount: "1" | "2" | "3" | "4+";
  backgroundDensity: ImageBackgroundDensity;
  relationMode: ImageRelationMode;
  emphasis: string;
  draggableNodes: ImageCanvasNode[];
  sceneZones: ImageSceneZone[];
  compileHints: string[];
};

export type VideoRhythm = "stable" | "push" | "switch" | "emotion";
export type VideoMainScene = "indoor" | "outdoor" | "complex" | "multi_scene";
export type VideoContinuityFocus = "identity" | "scene" | "lighting" | "style";
export type VideoSceneTransition = "none" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump";

export type VideoKeyObject = {
  id: string;
  label: string;
  role: CanvasNodeRole;
  appearsInShotIds: string[];
};

export type VideoShotDraft = {
  id: string;
  index: number;
  title: string;
  summary: string;
  transitionFromPrev: VideoSceneTransition;
  emphasis: string;
  sceneLabel: string;
  objectIds: string[];
};

export type VideoStoryboardNode = {
  id: string;
  shotId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type VideoCanvasDraft = {
  mediaType: "video";
  primaryBrief: string;
  secondaryBrief: string;
  structureType: VideoStructureHint;
  shotCount: 1 | 3 | 4 | 5;
  shots: VideoShotDraft[];
  keyObjects: VideoKeyObject[];
  mainScene: VideoMainScene;
  continuityFocus: VideoContinuityFocus;
  rhythm: VideoRhythm;
  sceneTransitions: VideoSceneTransition;
  storyboardNodes: VideoStoryboardNode[];
  compileHints: string[];
};

export type CanvasDraft = ImageCanvasDraft | VideoCanvasDraft;
