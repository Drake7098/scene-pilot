/**
 * Capability maps for rules engine.
 * Defines valid combinations of shot/motion and platform support.
 */

import type { MediaType } from "../model/configSchema";

export type ClassicShotId = "wide" | "full" | "medium" | "close" | "close_up" | "extreme_close" | "extreme_close_up";

/** Pro motions allowed per classic shot. Uses existing preset IDs. */
export const motionByShotMap: Record<string, string[]> = {
  wide: ["pan_left", "pan_right", "tilt_up", "tilt_down", "move_left", "move_right", "orbit_left", "orbit_right", "aerial_rise", "follow_front", "follow_back", "side_follow"],
  full: ["pan_left", "pan_right", "move_left", "move_right", "slow_push_in", "slow_pull_out", "orbit_left", "orbit_right", "follow_front", "follow_back", "side_follow"],
  medium: ["slow_push_in", "slow_pull_out", "pan_left", "pan_right", "tilt_up", "tilt_down", "follow_front", "follow_back", "side_follow", "orbit_left", "orbit_right", "handheld"],
  close: ["slow_push_in", "slow_pull_out", "handheld", "follow_front", "follow_back"],
  close_up: ["slow_push_in", "slow_pull_out", "handheld", "follow_front", "follow_back"],
  extreme_close: ["slow_push_in", "handheld"],
  extreme_close_up: ["slow_push_in", "handheld"],
};

/** Pro motions disabled when classicMotion is static (locked_static). */
export const PRO_MOTIONS_DISABLED_WHEN_STATIC = [
  "slow_push_in", "slow_pull_out", "fast_push", "fast_pull",
  "move_left", "move_right", "pan_left", "pan_right", "tilt_up", "tilt_down",
  "follow_front", "follow_back", "side_follow", "orbit_left", "orbit_right",
  "handheld", "locked_static"
];

/** Platform support for image/video. */
export const targetSupportMap: Record<string, { image: boolean; video: boolean }> = {
  universal: { image: true, video: true },
  fal: { image: true, video: true },
  midjourney: { image: true, video: false },
  runway: { image: true, video: true },
  pika: { image: true, video: true },
  luma: { image: true, video: true },
  krea: { image: true, video: true },
  jimeng: { image: true, video: true },
  keling: { image: true, video: true },
  vidu: { image: true, video: true },
  hailuo: { image: true, video: true },
  wanx: { image: true, video: true },
};

export function getTargetSupport(targetId: string): { image: boolean; video: boolean } {
  return targetSupportMap[targetId] ?? { image: true, video: true };
}

export function targetSupportsMedia(targetId: string, mediaType: MediaType): boolean {
  const s = getTargetSupport(targetId);
  return mediaType === "image" ? s.image : s.video;
}

export function getMotionsForShot(shotId: string): string[] {
  const id = (shotId ?? "").toLowerCase().replace(/ /g, "_");
  return motionByShotMap[id] ?? [];
}

export function isMotionAllowedForShot(motionId: string, shotId: string): boolean {
  const allowed = getMotionsForShot(shotId);
  if (allowed.length === 0) return true;
  return allowed.includes(motionId);
}
