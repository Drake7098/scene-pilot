import { expect, test } from "@playwright/test";
import type { Project, Scene } from "../../../src/model";
import { generatePrompts } from "../../../src/utils/prompt";

function makeSceneWithMultiRefs(): Scene {
  return {
    id: "s_ref_guard",
    name: "ref guard scene",
    duration_s: 4,
    notes: "media: image",
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
        id: "L_ref",
        type: "product box",
        shape: "rect",
        shapeDesc: "",
        look: "matte package",
        z: 1,
        color: "#ffffff",
        opacity: 1,
        kf: [
          { t: 0, x: 50, y: 50, w: 20, h: 20, rot: 0 },
          { t: 1, x: 50, y: 50, w: 20, h: 20, rot: 0 },
        ],
        notes: "",
        externalPrompt: "",
        referenceLinks: "https://img.example.com/a.png\nhttps://img.example.com/b.png\nhttps://img.example.com/c.png",
      },
    ],
  };
}

test("ref_attachment_guard_keeps_only_first_reference_link_per_object", async () => {
  const project: Project = {
    project: { mode: "storyboard", mediaType: "image", shotPlan: "single" },
    scenes: [makeSceneWithMultiRefs()],
  };

  const prompt = generatePrompts(project, "en", "openai");

  expect(prompt).toContain("Reference links: https://img.example.com/a.png");
  expect(prompt).not.toContain("https://img.example.com/b.png");
  expect(prompt).not.toContain("https://img.example.com/c.png");
  expect(prompt).not.toMatch(/Reference links: .*\|.*\|/);
});
