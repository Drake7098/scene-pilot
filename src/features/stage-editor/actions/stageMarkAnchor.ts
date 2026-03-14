/**
 * Stage Mark Anchor - add @continuityId to layer notes for continuity templates.
 */

import type { Scene, Layer } from "../../../model";

const CONTINUITY_ID_MARK = "@continuityId:";

function parseContinuityId(notes: string): string | null {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(CONTINUITY_ID_MARK.toLowerCase()));
  if (!hit) return null;
  const v = hit.trim().slice(CONTINUITY_ID_MARK.length).trim();
  return v || null;
}

function setContinuityId(notes: string, id: string): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(CONTINUITY_ID_MARK.toLowerCase()));
  if (id) rest.push(`${CONTINUITY_ID_MARK}${id}`);
  return rest.join("\n");
}

export function stageMarkAnchor(scene: Scene, layer: Layer, anchorId: string): Scene {
  const next = JSON.parse(JSON.stringify(scene)) as Scene;
  const l = next.layers?.find((x) => x.id === layer.id);
  if (!l) return scene;

  l.notes = setContinuityId(l.notes ?? "", anchorId);
  return next;
}

export function stageClearAnchor(scene: Scene, layer: Layer): Scene {
  return stageMarkAnchor(scene, layer, "");
}

export function getLayerAnchorId(layer: Layer): string | null {
  return parseContinuityId(layer.notes ?? "");
}
