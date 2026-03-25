import type { Direction } from "../../model";
import type { ShotModel } from "../types";

export type ShotSequenceNode = {
  shotId: string;
  index: number;
  durationSec: number;
  entryDir: Direction | null;
  exitDir: Direction | null;
  camera: {
    shot: string;
    movement: string;
  };
  continuity: {
    identity: boolean;
    camera: boolean;
    direction: boolean;
  };
};

export type ShotSequenceEdge = {
  fromShotId: string;
  toShotId: string;
  carryOver: {
    identity: boolean;
    camera: boolean;
    direction: boolean;
  };
  motionRelation: "hold" | "accelerate" | "decelerate" | "switch";
};

export type ShotSequence = {
  durationSec: number;
  nodes: ShotSequenceNode[];
  edges: ShotSequenceEdge[];
  sourceShotIds: string[];
  entryDirection: Direction | null;
  exitDirection: Direction | null;
};

export type BuildShotSequenceInput = {
  shotModels: ShotModel[];
};
