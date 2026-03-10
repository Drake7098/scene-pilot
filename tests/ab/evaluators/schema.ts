import type { TaskType } from "../config/endpoints.js";

export type BaseScoreRecord = {
  taskId: string;
  title: string;
  taskType: TaskType;
  provider: "replicate" | "fal";
  endpoint: string;
  promptMode: "plain" | "structured";
  isUsable: boolean;
  notes: string;
};

export type ImageScoreRecord = BaseScoreRecord & {
  taskType: "image";
  completionScore: number;
  compositionScore: number;
  semanticMatchScore: number;
  usabilityScore: number;
};

export type VideoScoreRecord = BaseScoreRecord & {
  taskType: "video";
  completionScore: number;
  firstFrameScore: number;
  motionScore: number;
  trajectoryScore: number;
  usabilityScore: number;
};

export type ScoreRecord = ImageScoreRecord | VideoScoreRecord;
