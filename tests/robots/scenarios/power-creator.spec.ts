import { expect, test } from "@playwright/test";
import {
  assertProjectVisible,
  assertVideoProjectUsesV2,
  captureArtifacts,
  createVideoProject,
  openWizard,
  requireLiveMode,
  runStep,
} from "../support/runtime";

const SCENE_1 = /01\s*[｜|]\s*(镜头|Shot)01/i;
const SCENE_2 = /02\s*[｜|]\s*(镜头|Shot)02/i;
const SCENE_3 = /03\s*[｜|]\s*(镜头|Shot)03/i;

test("power_creator_high_frequency_edits", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-power-${Date.now()}`;

  await runStep(page, "open_workspace", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "create_video_project", async () => {
    await openWizard(page);
    await createVideoProject(page, projectName, 3, 18);
    await assertProjectVisible(page, projectName);
  });

  await runStep(page, "rapid_scene_switch", async () => {
    const switches = [SCENE_1, SCENE_2, SCENE_3, SCENE_2, SCENE_1, SCENE_3, SCENE_1, SCENE_2, SCENE_3];
    for (const scenePattern of switches) {
      await page.getByText(scenePattern).first().click();
    }

    await expect(page.getByText(SCENE_3).first()).toBeVisible();
    await expect(page.getByText(/分镜列表|Scenes/i).first()).toBeVisible();
  });

  await runStep(page, "verify_multishot_structure", async () => {
    await expect(page.getByText(SCENE_1).first()).toBeVisible();
    await expect(page.getByText(SCENE_2).first()).toBeVisible();
    await expect(page.getByText(SCENE_3).first()).toBeVisible();
    await assertVideoProjectUsesV2(page, { minScenes: 3, expectedMode: "strict" });
  });

  await captureArtifacts(page, { robotId: "power_creator", caseId: "rapid_edits" });
});
