/**
 * Stage object state classification - template-derived, anchor-bound, etc.
 */

import type { Project, Scene, Layer } from "../../../model";

const LAYOUT_LOCKED_MARK = "@layoutlocked:";
const CONTINUITY_ID_MARK = "@continuityid:";

function parseLayoutLocked(notes: string): boolean {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(LAYOUT_LOCKED_MARK.toLowerCase()));
  if (!hit) return false;
  const v = hit.trim().slice(LAYOUT_LOCKED_MARK.length).trim();
  return v === "1" || v === "true" || v === "yes";
}

function parseContinuityId(notes: string): string | null {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(CONTINUITY_ID_MARK.toLowerCase()));
  if (!hit) return null;
  const v = hit.trim().slice(CONTINUITY_ID_MARK.length).trim();
  return v || null;
}

export function writeLayoutLocked(notes: string, locked: boolean): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(LAYOUT_LOCKED_MARK.toLowerCase()));
  if (locked) rest.push(`${LAYOUT_LOCKED_MARK}1`);
  return rest.join("\n");
}

export type StageObjectStateLabel =
  | "template-derived"
  | "anchor-bound"
  | "inherited"
  | "user-added"
  | "locked"
  | "protected-layout";

export type StageObjectState = {
  labels: StageObjectStateLabel[];
  isLocked: boolean;
  continuityId: string | null;
  isTemplateDerived: boolean;
  isProtectedLayout: boolean;
};

export function getStageObjectState(
  layer: Layer,
  scene: Scene,
  project: Project | null
): StageObjectState {
  const isLocked = parseLayoutLocked(layer.notes ?? "");
  const continuityId = parseContinuityId(layer.notes ?? "");
  const sceneLayoutLocked = scene.layoutLocked ?? false;

  const labels: StageObjectStateLabel[] = [];

  if (isLocked) labels.push("locked");
  if (continuityId) labels.push("anchor-bound");
  if (scene.inheritFromPrevious) labels.push("inherited");

  if (project?.meta?.currentTemplate) {
    labels.push("template-derived");
  } else {
    labels.push("user-added");
  }

  if (sceneLayoutLocked) labels.push("protected-layout");

  return {
    labels,
    isLocked,
    continuityId,
    isTemplateDerived: labels.includes("template-derived"),
    isProtectedLayout: sceneLayoutLocked
  };
}
