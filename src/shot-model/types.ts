import type { Direction, MediaType, Project, Scene, ShotPlan, TransitionType } from "../model";

export type ShotRole = "primary" | "secondary" | "environment";

export type ShotSubjectNode = {
  id: string;
  role: ShotRole;
  type: string;
  look: string;
  notes: string;
  localPrompt: string;
  referenceLinks: string[];
  z: number;
  anchor: {
    start: { x: number; y: number; w: number; h: number; rot: number };
    end: { x: number; y: number; w: number; h: number; rot: number };
  };
};

export type ShotRelationEdge = {
  from: string;
  to: string;
  relation: "foreground" | "background" | "left_of" | "right_of" | "overlap" | "isolation";
  priority: "hard" | "soft";
  reason: string;
};

export type ShotConflictDecision = {
  id: string;
  field: string;
  conflict: string;
  winner: "structural" | "scene" | "layer_notes" | "layer_prompt" | "derived";
  action: "drop" | "downgrade" | "keep";
  detail: string;
};

export type ShotModel = {
  context: {
    sceneId: string;
    sceneName: string;
    index: number;
    totalScenes: number;
    mediaMode: MediaType;
    shotPlan: ShotPlan;
    durationSec: number;
  };
  subject: {
    primary: ShotSubjectNode | null;
    secondary: ShotSubjectNode[];
    environment: ShotSubjectNode[];
    relations: ShotRelationEdge[];
  };
  action: {
    primaryAction: string;
    supportActions: string[];
    blockedActions: string[];
  };
  camera: {
    shot: string;
    movement: string;
    preset: string;
    cameraLanguageId: string | null;
    directorPackId: string | null;
    proBasicMotionId: string | null;
    proPlusMotionIds: string[];
    transitionType: TransitionType;
  };
  composition: {
    focus: "single_subject" | "multi_subject" | "environment_first";
    framing: string[];
    antiRules: string[];
  };
  space: {
    background: string;
    entryDir: Direction | null;
    exitDir: Direction | null;
    depthOrder: Array<{ id: string; z: number }>;
    spatialNarrative: string[];
  };
  layer: {
    orderedIds: string[];
    anchors: Array<{ id: string; start: string; end: string }>;
  };
  lighting: {
    time: string;
    keyDir: string;
    mood: string;
    profileIds: string[];
    cues: string[];
  };
  material: {
    surfaceCues: string[];
    styleCues: string[];
  };
  detail: {
    shotNote: string;
    sceneNotes: string;
    localPromptCues: string[];
    referenceLinks: string[];
  };
  mood: {
    tone: string;
    energy: "low" | "medium" | "high";
    keywords: string[];
  };
  style: {
    imageClassicModeId: string | null;
    videoClassicModeId: string | null;
    imageProEffectIds: string[];
  };
  semantic: {
    intentLabels: string[];
    hardConstraints: string[];
    softConstraints: string[];
  };
  motion: {
    mode: "static" | "kinetic";
    pathSummary: string[];
    continuityHints: string[];
  };
  continuity: {
    enabled: boolean;
    carryOver: {
      identity: boolean;
      camera: boolean;
      direction: boolean;
      background: boolean;
    };
    bridgeToNext: string[];
  };
  metadata: {
    sourceProject: Pick<Project, "id" | "name">;
    sourceScene: Pick<Scene, "id" | "name">;
    consumedFields: string[];
    unresolvedFields: string[];
    conflictDecisions: ShotConflictDecision[];
  };
};

export type BuildShotModelInput = {
  project: Project;
  scene: Scene;
  sceneIndex: number;
};

export type ShotDescription = {
  title: string;
  lines: string[];
  text: string;
  segments: {
    subjectAction: string;
    cameraComposition: string;
    spaceLayer: string;
    lightingMaterial: string;
    moodStyle: string;
    constraintsContinuity: string;
  };
};
