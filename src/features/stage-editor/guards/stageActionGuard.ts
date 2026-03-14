/**
 * Stage Action Guard - structural safety check before any Stage write action.
 */

import type { Project, Scene, Layer } from "../../../model";
import { getStageObjectState } from "./stageObjectState";

export type GuardResult =
  | { kind: "allow" }
  | { kind: "allow-with-normalize" }
  | { kind: "deny"; reason?: string }
  | { kind: "reroute-to-panel"; panel: string };

export type StageActionKind =
  | "move"
  | "resize"
  | "center"
  | "reset"
  | "copyKeyframe"
  | "toggleLock"
  | "markAnchor";

export function stageActionGuard(
  action: StageActionKind,
  layer: Layer,
  scene: Scene,
  project: Project | null
): GuardResult {
  const state = getStageObjectState(layer, scene, project);

  if (state.isLocked) {
    if (action === "toggleLock") return { kind: "allow" };
    return { kind: "deny", reason: "Layer is locked" };
  }

  if (state.isProtectedLayout) {
    if (action === "toggleLock") return { kind: "allow" };
    return { kind: "deny", reason: "Layout protected" };
  }

  switch (action) {
    case "move":
    case "resize":
      return { kind: "allow-with-normalize" };
    case "center":
    case "reset":
      return { kind: "allow" };
    case "copyKeyframe":
      return { kind: "allow" };
    case "toggleLock":
      return { kind: "allow" };
    case "markAnchor":
      return state.continuityId !== null || (project?.meta?.currentTemplate?.domain ?? "").includes("continuity")
        ? { kind: "allow" }
        : { kind: "deny", reason: "Continuity template required" };
    default:
      return { kind: "deny", reason: "Unknown action" };
  }
}
