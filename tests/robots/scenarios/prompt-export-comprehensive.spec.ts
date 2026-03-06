import { expect, test } from "@playwright/test";
import type { Layer, Project, Scene } from "../../../src/model";
import { generatePrompts } from "../../../src/utils/prompt";

function makeLayer(i: number, withLocalPrompt = true, withRefs = false): Layer {
  const idx = i + 1;
  return {
    id: `obj${idx}`,
    type: `对象${idx}`,
    shape: "rect",
    shapeDesc: "",
    look: `look_${idx}`,
    z: idx,
    color: "#ffffff",
    opacity: 1,
    kf: [
      { t: 0, x: 10 + i * 7, y: 20 + i * 4, w: 12 + (i % 3), h: 20 + (i % 4), rot: 0 },
      { t: 1, x: 12 + i * 7, y: 22 + i * 4, w: 12 + (i % 3), h: 20 + (i % 4), rot: 4 },
    ],
    notes: `备注_${idx}`,
    externalPrompt: withLocalPrompt ? `局部提示_${idx}\n局部细节_${idx}` : "",
    referenceLinks: withRefs
      ? `https://img.example.com/${idx}_a.png\nhttps://img.example.com/${idx}_b.png`
      : "",
  };
}

function makeScene({
  id,
  name,
  media = "video",
  compiler = "v1",
  tier = "small_plaza",
  layerCount = 3,
  withLocalPrompt = true,
  withRefs = false,
}: {
  id: string;
  name: string;
  media?: "image" | "video";
  compiler?: "v1" | "v2";
  tier?: "indoor" | "small_plaza" | "open_space";
  layerCount?: number;
  withLocalPrompt?: boolean;
  withRefs?: boolean;
}): Scene {
  const layers = Array.from({ length: layerCount }, (_, i) => makeLayer(i, withLocalPrompt, withRefs));
  const compilerTags =
    compiler === "v2"
      ? `\n@compiler:v2\n@scene_tier:${tier}\n@v2_mode:strict`
      : "";
  return {
    id,
    name,
    duration_s: 8,
    notes: `media: ${media}${compilerTags}\nbg:https://img.example.com/scene_bg.png`,
    camera: {
      shot: "wide",
      movement: "static",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "day", key_dir: "front", mood: "neutral" },
    layers,
  };
}

function makeProject(scene: Scene): Project {
  return {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
    scenes: [scene],
  };
}

test("prompt_export_v1_video_keeps_object_local_prompt_and_single_ref_link", async () => {
  const scene = makeScene({
    id: "s_v1_video",
    name: "V1视频回归",
    media: "video",
    compiler: "v1",
    layerCount: 3,
    withLocalPrompt: true,
    withRefs: true,
  });
  const prompt = generatePrompts(makeProject(scene), "zh", "universal");

  expect(prompt).toContain("对象局部参考：局部提示_1 | 局部细节_1");
  expect(prompt).toContain("参考图链接：https://img.example.com/1_a.png");
  expect(prompt).not.toContain("https://img.example.com/1_b.png");
  expect(prompt).toContain("起点t0：x=");
  expect(prompt).toContain("终点t1：x=");
});

test("prompt_export_v2_video_keeps_object_local_prompt_in_t0", async () => {
  const scene = makeScene({
    id: "s_v2_video",
    name: "V2视频回归",
    media: "video",
    compiler: "v2",
    tier: "open_space",
    layerCount: 3,
    withLocalPrompt: true,
  });
  const prompt = generatePrompts(makeProject(scene), "zh", "universal");

  expect(prompt).toContain("[V2 SCENEPILOT COMPILE]");
  expect(prompt).toContain("T0 Frame Spec:");
  expect(prompt).toContain("对象局部提示：局部提示_1 | 局部细节_1");
  expect(prompt).toContain("（仅作用于 obj1）");
});

test("prompt_export_image_mode_omits_v1_t1_coordinates", async () => {
  const scene = makeScene({
    id: "s_v1_image",
    name: "V1图片回归",
    media: "image",
    compiler: "v1",
    layerCount: 2,
    withLocalPrompt: true,
  });
  const prompt = generatePrompts(makeProject(scene), "zh", "universal");

  expect(prompt).toContain("你将根据以下分镜结构生成图像画面。");
  expect(prompt).toContain("起点t0：x=");
  expect(prompt).not.toContain("终点t1：x=");
});

test("prompt_export_v2_handles_up_to_ten_objects_without_dropping_rows", async () => {
  const scene = makeScene({
    id: "s_v2_10_objects",
    name: "V2十对象回归",
    media: "video",
    compiler: "v2",
    tier: "small_plaza",
    layerCount: 10,
    withLocalPrompt: true,
  });
  const prompt = generatePrompts(makeProject(scene), "zh", "universal");

  const t0Block = prompt.match(/T0 Frame Spec:\n([\s\S]*?)\n\nT1 Frame Spec:/)?.[1] ?? "";
  const rowCount = t0Block
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("- ")).length;

  expect(rowCount).toBe(10);
  expect(prompt).toContain("对象局部提示：局部提示_10 | 局部细节_10");
});
