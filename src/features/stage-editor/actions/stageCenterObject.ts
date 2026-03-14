/**
 * Stage Center Object - align object to canvas center (50, 50).
 */

import type { Scene, Layer } from "../../../model";
import { ensureKF } from "../../../model";

export function stageCenterObject(scene: Scene, layer: Layer, t: 0 | 1): Scene {
  const next = JSON.parse(JSON.stringify(scene)) as Scene;
  const l = next.layers?.find((x) => x.id === layer.id);
  if (!l) return scene;

  const k = ensureKF(l, t);
  k.x = 50;
  k.y = 50;

  return next;
}
