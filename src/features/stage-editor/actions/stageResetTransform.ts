/**
 * Stage Reset Transform - restore layer kf to template default or object default.
 */

import type { Project, Scene, Layer } from "../../../model";
import { ensureKF } from "../../../model";

const DEFAULT_KF = { x: 50, y: 50, w: 18, h: 18, rot: 0 };

export function stageResetTransform(
  scene: Scene,
  layer: Layer,
  t: 0 | 1,
  _project: Project | null
): Scene {
  const next = JSON.parse(JSON.stringify(scene)) as Scene;
  const l = next.layers?.find((x) => x.id === layer.id);
  if (!l || !l.kf) return scene;

  const k = ensureKF(l, t);
  const def = DEFAULT_KF;
  k.x = def.x;
  k.y = def.y;
  k.w = def.w;
  k.h = def.h;
  k.rot = def.rot;

  return next;
}
