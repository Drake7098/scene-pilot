import { expect, test } from "@playwright/test";
import type { Project, Scene } from "../../../src/model";
import { generatePrompts } from "../../../src/utils/prompt";

function makeBaseScene(id: string, name: string, notes: string): Scene {
  return {
    id,
    name,
    duration_s: 5,
    notes,
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
        type: "person",
        shape: "rect",
        shapeDesc: "",
        look: "blue jacket",
        z: 1,
        color: "#ffffff",
        opacity: 1,
        kf: [
          { t: 0, x: 40, y: 50, w: 18, h: 28, rot: 0 },
          { t: 1, x: 55, y: 50, w: 18, h: 28, rot: 0 },
        ],
        notes: "",
        externalPrompt: "",
        referenceLinks: "",
      },
    ],
  };
}

test("compiler_fallback_guard_keeps_v2_and_v1_paths_together", async () => {
  const v2Scene = makeBaseScene(
    "s_v2",
    "Scene V2",
    "@compiler:v2\n@scene_tier:open_space\n@v2_mode:strict\nmedia: video",
  );
  const v1Scene = makeBaseScene("s_v1", "Scene V1", "media: video");

  const project: Project = {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
    scenes: [v2Scene, v1Scene],
  };

  const prompt = generatePrompts(project, "en", "openai");

  expect(prompt).toContain("[V2 SCENEPILOT COMPILE]");
  expect(prompt).toContain("Scene: Scene V2 (5s)");
  expect(prompt).toContain("# Scene V1 (5s)");
  expect(prompt).toContain("Start t0: x=");
});
