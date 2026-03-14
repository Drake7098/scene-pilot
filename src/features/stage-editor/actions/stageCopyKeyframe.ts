/**
 * Stage Copy Keyframe - copy t0 layout to t1.
 */

import type { Scene, Layer } from "../../../model";
import { ensureKF } from "../../../model";

export function stageCopyT0ToT1(scene: Scene, layer: Layer): Scene {
  const next = JSON.parse(JSON.stringify(scene)) as Scene;
  const l = next.layers?.find((x) => x.id === layer.id);
  if (!l) return scene;

  const k0 = ensureKF(l, 0);
  const k1 = ensureKF(l, 1);
  k1.x = k0.x;
  k1.y = k0.y;
  k1.w = k0.w;
  k1.h = k0.h;
  k1.rot = k0.rot;

  return next;
}
