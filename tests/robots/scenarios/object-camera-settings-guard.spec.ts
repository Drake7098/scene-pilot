import { expect, test } from "@playwright/test";
import type { Project, Scene } from "../../../src/model";
import { generatePrompts } from "../../../src/utils/prompt";

function makeV2Scene(objectCount = 6): Scene {
  return {
    id: "s_obj_cam_v2",
    name: "对象镜头检测V2",
    duration_s: 5,
    notes: "media: video\n@compiler:v2\n@scene_tier:small_plaza\n@v2_mode:strict",
    camera: {
      shot: "wide",
      movement: "pan_left",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "day", key_dir: "front", mood: "neutral" },
    layers: Array.from({ length: objectCount }, (_, i) => {
      const idx = i + 1;
      return {
        id: `obj${idx}`,
        type: `角色${idx}`,
        shape: "rect" as const,
        shapeDesc: "",
        look: `外观_${idx}`,
        z: idx,
        color: "#ffffff",
        opacity: 1,
        kf: [
          { t: 0 as const, x: 12 + i * 12, y: 25 + i * 6, w: 12 + (i % 3), h: 20 + (i % 4), rot: 0 },
          { t: 1 as const, x: 12 + i * 12, y: 25 + i * 6, w: 12 + (i % 3), h: 20 + (i % 4), rot: 0 },
        ],
        notes: `备注_${idx}`,
        externalPrompt: `局部提示_${idx}`,
        referenceLinks: "",
      };
    }),
  };
}

function makeV1Scene(objectCount = 6): Scene {
  return {
    id: "s_obj_cam_v1",
    name: "对象镜头检测V1",
    duration_s: 5,
    notes: "media: video",
    camera: {
      shot: "wide",
      movement: "pan_left",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "day", key_dir: "front", mood: "moody" },
    layers: Array.from({ length: objectCount }, (_, i) => {
      const idx = i + 1;
      return {
        id: `obj${idx}`,
        type: `角色${idx}`,
        shape: "rect" as const,
        shapeDesc: "",
        look: `外观_${idx}`,
        z: idx,
        color: "#ffffff",
        opacity: 1,
        kf: [
          { t: 0 as const, x: 12 + i * 12, y: 25 + i * 6, w: 12 + (i % 3), h: 20 + (i % 4), rot: 0 },
          { t: 1 as const, x: 14 + i * 12, y: 28 + i * 6, w: 12 + (i % 3), h: 20 + (i % 4), rot: 5 },
        ],
        notes: `备注_${idx}`,
        externalPrompt: `局部提示_${idx}`,
        referenceLinks: "",
      };
    }),
  };
}

test("object_camera_settings_guard_v2", async () => {
  const project: Project = {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
    scenes: [makeV2Scene(8)],
  };

  const prompt = generatePrompts(project, "zh", "universal");

  expect(prompt).toContain("[V2 SCENEPILOT COMPILE]");
  expect(prompt).toContain("Scene: 对象镜头检测V2（5秒）。");
  expect(prompt).toContain("Camera Contract:");
  expect(
    prompt.includes("在 5 秒时长内完成 t0→t1 变化") ||
      prompt.includes("当前 t0=t1，整段 5 秒保持静止构图")
  ).toBeTruthy();
  expect(prompt).toContain("Layout Contract (obey strictly):");
  expect(prompt).toContain("T0 Frame Spec:");
  expect(prompt).toContain("T1 Frame Spec:");
  expect(prompt).toContain("Anti-Director Rules:");

  for (let i = 1; i <= 8; i += 1) {
    expect(prompt).toContain(`obj${i}（角色${i}）`);
    expect(prompt).toContain(`外观_${i}`);
    expect(prompt).toContain(`备注_${i}`);
    expect(prompt).toContain(`对象局部提示：局部提示_${i}（仅作用于 obj${i}）`);
  }
});

test("object_camera_settings_guard_v1", async () => {
  const project: Project = {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
    scenes: [makeV1Scene(8)],
  };

  const prompt = generatePrompts(project, "zh", "universal");

  expect(prompt).toContain("# 对象镜头检测V1（5秒）");
  expect(prompt).toContain("摄像机：景别=wide，运动=pan_left");
  expect(prompt).toContain("光照：时间=day，主光=front，氛围=moody");
  for (let i = 1; i <= 8; i += 1) {
    expect(prompt).toContain(`- obj${i}`);
    expect(prompt).toContain(`主体(type)：角色${i}`);
    expect(prompt).toContain(`外观(look)：外观_${i}`);
    expect(prompt).toContain(`约束/备注：备注_${i}`);
    expect(prompt).toContain(`对象局部参考：局部提示_${i}`);
    expect(prompt).toContain("起点t0：x=");
    expect(prompt).toContain("终点t1：x=");
  }
});
