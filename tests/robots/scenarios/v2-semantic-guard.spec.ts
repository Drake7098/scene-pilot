import { expect, test } from "@playwright/test";
import type { Scene } from "../../../src/model";
import { compileScenePromptV2 } from "../../../src/utils/compileV2";
import { optimizeV2ScenePrompt } from "../../../src/utils/adaptivePatch";

function makeStaticSceneWithMotionIntent(): Scene {
  return {
    id: "s_semantic_guard",
    name: "语义动作防冲突",
    duration_s: 6,
    notes: "@compiler:v2\n@scene_tier:open_space\n@v2_mode:strict\nmedia: video",
    camera: {
      shot: "wide",
      movement: "static",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "day", key_dir: "front", mood: "neutral" },
    layers: [
      {
        id: "L1",
        type: "女性角色",
        shape: "rect",
        shapeDesc: "",
        look: "白色连衣裙",
        z: 1,
        color: "#ffffff",
        opacity: 1,
        kf: [
          { t: 0, x: 50, y: 58, w: 16, h: 28, rot: 0 },
          { t: 1, x: 50, y: 58, w: 16, h: 28, rot: 0 },
        ],
        notes: "跑了三步后转身挥手",
        externalPrompt: "",
        referenceLinks: "",
      },
    ],
  };
}

test("v2_semantic_guard_blocks_static_lock_when_motion_intent_exists", async () => {
  const scene = makeStaticSceneWithMotionIntent();
  const compiled = compileScenePromptV2(scene, "zh", "open_space", "strict", undefined);
  const optimized = optimizeV2ScenePrompt(compiled, scene, "zh", "open_space", "strict");

  expect(optimized).not.toContain("当前 t0=t1");
  expect(optimized).not.toContain("整段 6 秒保持静止构图");
  expect(optimized).toContain("在 6 秒时长内完成 t0→t1 变化");
  expect(optimized).toContain("在 6 秒内按 T0→T1 完成变化");
  expect(optimized).toContain("左右位移 / 远近变化 / 尺寸增减 / 轻微转向");
});
