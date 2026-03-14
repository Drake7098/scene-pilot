/**
 * Types formerly from ResultConsole (Quick Workspace removed).
 * Kept for CreateWizard, BillingOverlay, and App state compatibility.
 */

import type { IntentPlan } from "./intentPlan";

export type ResultConsoleMode = "results" | "pro";

export type ResultGenerationPrefs = {
  mediaType: "image" | "video";
  ratio: "16:9" | "9:16" | "1:1";
  durationSec: 6 | 15 | 30;
  batchSize: 1 | 2 | 4 | 8;
  engineMode: "auto" | "comfyui" | "drawthings";
  showcaseMode: "show" | "headless";
};

export type ResultStructureState = {
  subjectX: number;
  subjectY: number;
  subjectSize: number;
  subjectLayer: number;
  compositionFocus: "left" | "center" | "right";
};

export type ResultPlanStructure =
  | ResultStructureState
  | IntentPlan
  | {
      subject: string;
      composition: string;
      background: string;
      style: string;
      keyChecks: string[];
    };

export type ResultPlan = {
  brief: string;
  mediaType: "image" | "video";
  shotPlan: "single" | "multicam" | "continuous" | "edit";
  shotCount: number;
  totalDuration: number;
  ratio: "16:9" | "9:16" | "1:1";
  outputCount: number;
  engineMode: ResultGenerationPrefs["engineMode"];
  headline: string;
  summary: string;
  target: string;
  route: string[];
  checkpoints: string[];
  scenes: Array<{ title: string; goal: string }>;
  structure?: ResultPlanStructure;
  routeReason?: string;
};

export type ResultPreview = {
  id: string;
  title: string;
  summary: string;
  status: "draft" | "refine" | "approved";
  hint: string;
  tone: string;
  mediaType?: "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
  provider?: "comfyui" | "drawthings";
};

export type LocalRuntimeCard = {
  comfy: { state: "idle" | "checking" | "ready" | "fail"; label: string };
  draw: { state: "idle" | "checking" | "ready" | "handoff" | "fail"; label: string };
  drawPackReady: boolean;
  drawPackCount: number;
};
