import { expect, test } from "@playwright/test";

function imageProjectFixture() {
  return {
    project: { mode: "storyboard", mediaType: "image", shotPlan: "single" },
    scenes: [
      {
        id: "s1",
        name: "Image Scene",
        duration_s: 6,
        camera: {
          shot: "medium",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "top_left", mood: "cinematic" },
        layers: [
          {
            id: "Subject 1",
            type: "subject",
            shape: "rect",
            shapeDesc: "",
            look: "",
            z: 10,
            color: "#b7c3ff",
            opacity: 1,
            kf: [
              { t: 0, x: 50, y: 50, w: 24, h: 24, rot: 0 },
              { t: 1, x: 50, y: 50, w: 24, h: 24, rot: 0 }
            ],
            notes: "",
            externalPrompt: "",
            referenceLinks: "",
            localRefs: [],
            referencePolicy: "optional"
          }
        ],
        config: {
          mediaMode: "image",
          compiler: "v1",
          sceneTier: "indoor",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: "media: image\ngenmode: pro"
      }
    ]
  };
}

function videoProjectFixture() {
  return {
    project: { mode: "storyboard", mediaType: "video", shotPlan: "multicam" },
    scenes: [
      {
        id: "s1",
        name: "Video Scene",
        duration_s: 6,
        camera: {
          shot: "over_shoulder",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "night", key_dir: "rim_light", mood: "noir" },
        layers: [
          {
            id: "Subject 1",
            type: "subject",
            shape: "rect",
            shapeDesc: "",
            look: "",
            z: 10,
            color: "#b7c3ff",
            opacity: 1,
            kf: [
              { t: 0, x: 50, y: 50, w: 24, h: 24, rot: 0 },
              { t: 1, x: 50, y: 50, w: 24, h: 24, rot: 0 }
            ],
            notes: "",
            externalPrompt: "",
            referenceLinks: "",
            localRefs: [],
            referencePolicy: "optional"
          }
        ],
        config: {
          mediaMode: "video",
          compiler: "v2",
          sceneTier: "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: "media: video\ngenmode: pro"
      }
    ]
  };
}

test("pro_media_contract_image_vs_video_controls", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((payload) => {
    localStorage.setItem("sp_workspace_mode", "pro");
    localStorage.setItem("scenepilot_project", JSON.stringify(payload));
  }, imageProjectFixture());
  await page.reload();

  await expect(page.getByTestId("pro-director-block")).toBeVisible();
  await expect(page.getByTestId("classic-movement-select")).toHaveCount(0);
  await expect(page.getByTestId("pro-image-block")).toBeVisible();
  await expect(page.getByTestId("pro-motion-block")).toHaveCount(0);

  await page.evaluate((payload) => {
    localStorage.setItem("sp_workspace_mode", "pro");
    localStorage.setItem("scenepilot_project", JSON.stringify(payload));
  }, videoProjectFixture());
  await page.reload();

  await expect(page.getByTestId("classic-movement-select")).toBeVisible();
  await expect(page.getByTestId("pro-motion-block")).toBeVisible();
  await expect(page.getByTestId("pro-image-block")).toHaveCount(0);
});
