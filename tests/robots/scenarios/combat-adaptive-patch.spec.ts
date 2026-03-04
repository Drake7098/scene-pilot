import { expect, test } from "@playwright/test";
import { buildAdaptivePatches, type AdaptivePatchInput } from "../support/adaptive-patch";

test("adaptive_patch_static_scene_removes_fake_motion", async () => {
  const input: AdaptivePatchInput = {
    scores: {
      countFidelity: 0.96,
      layoutFidelity: 0.92,
      depthSeparation: 0.83,
      motionConsistency: 0.88,
      antiDirectorCompliance: 0.86,
      promptRedundancy: 0.12,
      conflictRate: 0.0,
    },
    context: {
      sceneTier: "indoor",
      durationSec: 3,
      objectCount: 3,
      isStaticTimeline: true,
      mode: "strict",
    },
  };

  const patches = buildAdaptivePatches(input);
  const ids = patches.map((p) => p.id);

  expect(ids).toContain("v2.static_lock");
  expect(ids).not.toContain("v2.motion_unroll");
});

test("adaptive_patch_open_space_boosts_depth_and_anti_director", async () => {
  const input: AdaptivePatchInput = {
    scores: {
      countFidelity: 0.89,
      layoutFidelity: 0.79,
      depthSeparation: 0.62,
      motionConsistency: 0.68,
      antiDirectorCompliance: 0.71,
      promptRedundancy: 0.31,
      conflictRate: 0.07,
    },
    context: {
      sceneTier: "open_space",
      durationSec: 6,
      objectCount: 10,
      isStaticTimeline: false,
      mode: "strict",
    },
  };

  const patches = buildAdaptivePatches(input);
  const ids = patches.map((p) => p.id);

  expect(ids).toEqual(
    expect.arrayContaining([
      "v2.motion_unroll",
      "v2.depth_tier_enforce",
      "v2.identity_count_lock",
      "v2.anti_director_boost",
      "v2.conflict_guard",
      "v2.dedupe_tail",
    ]),
  );

  const depthPatch = patches.find((p) => p.id === "v2.depth_tier_enforce");
  const depthLine = depthPatch?.ops.find((op) => op.op === "append_layout_line");
  expect(depthLine).toBeTruthy();
  if (!depthLine || depthLine.op !== "append_layout_line") return;

  expect(depthLine.line).toContain("0.05");
});
