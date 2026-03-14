/**
 * Stage Toggle Lock - lock/unlock layer via notes marker.
 */

import type { Scene, Layer } from "../../../model";
import { writeLayoutLocked } from "../guards/stageObjectState";

export function stageToggleLock(scene: Scene, layer: Layer, nextLocked: boolean): Scene {
  const next = JSON.parse(JSON.stringify(scene)) as Scene;
  const l = next.layers?.find((x) => x.id === layer.id);
  if (!l) return scene;

  l.notes = writeLayoutLocked(l.notes ?? "", nextLocked);
  return next;
}
