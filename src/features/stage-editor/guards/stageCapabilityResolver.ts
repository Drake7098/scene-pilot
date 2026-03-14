/**
 * Stage capability resolver - which Work Bar actions are allowed for given context.
 */

import type { Project, Scene, Layer } from "../../../model";
import type { StageObjectState } from "./stageObjectState";
import { getStageObjectState } from "./stageObjectState";

export type WorkBarActionId =
  | "select"
  | "move"
  | "center"
  | "reset"
  | "copyT0ToT1"
  | "lock"
  | "unlock"
  | "markAnchor";

export type WorkBarActionCapability = {
  id: WorkBarActionId;
  allowed: boolean;
  reason?: string;
};

export function resolveWorkBarCapabilities(
  layer: Layer,
  scene: Scene,
  project: Project | null,
  mediaMode: "image" | "video"
): WorkBarActionCapability[] {
  const state = getStageObjectState(layer, scene, project);
  const domain = project?.meta?.currentTemplate?.domain ?? "";
  const isContinuity = domain === "webdrama_continuity" || domain === "anime_continuity";

  const canEdit = !state.isLocked && !state.isProtectedLayout;

  const actions: WorkBarActionCapability[] = [
    { id: "select", allowed: true },
    {
      id: "move",
      allowed: canEdit,
      reason: state.isLocked ? "Locked" : state.isProtectedLayout ? "Layout protected" : undefined
    },
    {
      id: "center",
      allowed: canEdit,
      reason: state.isLocked ? "Locked" : undefined
    },
    {
      id: "reset",
      allowed: canEdit,
      reason: state.isLocked ? "Locked" : undefined
    },
    {
      id: "copyT0ToT1",
      allowed: mediaMode === "video" && canEdit,
      reason: mediaMode === "image" ? "Image mode" : state.isLocked ? "Locked" : undefined
    },
    {
      id: "lock",
      allowed: !state.isLocked,
      reason: state.isLocked ? "Already locked" : undefined
    },
    {
      id: "unlock",
      allowed: state.isLocked,
      reason: !state.isLocked ? "Not locked" : undefined
    },
    {
      id: "markAnchor",
      allowed: isContinuity && canEdit,
      reason: !isContinuity ? "Base template" : !canEdit ? "Locked" : undefined
    }
  ];

  return actions;
}
