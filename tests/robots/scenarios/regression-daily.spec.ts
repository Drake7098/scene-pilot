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

const PROJECT_NAME = "robot-regression-daily-fixed";

test("regression_daily_fixed_script", async ({ page }) => {
  requireLiveMode();

  await runStep(page, "open_app", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "replay_fixed_flow", async () => {
    await openWizard(page);
    await createVideoProject(page, PROJECT_NAME, 2, 12);
  });

  await runStep(page, "assert_deterministic_result", async () => {
    const SCENE_1 = /(?:01\s*[｜|]\s*(镜头|Shot)01|Scene\s*1|分镜\s*1)/i;
    const SCENE_2 = /(?:02\s*[｜|]\s*(镜头|Shot)02|Scene\s*2|分镜\s*2)/i;
    await assertProjectVisible(page, PROJECT_NAME);
    await expect(page.getByText(SCENE_1).first()).toBeVisible();
    await expect(page.getByText(SCENE_2).first()).toBeVisible();
    await assertVideoProjectUsesV2(page, { minScenes: 2, expectedMode: "strict" });

    const savedLabel = await page.evaluate(() => localStorage.getItem("scene_pilot_last_file_label") || "");
    expect(savedLabel).toBe(PROJECT_NAME);
  });

  await captureArtifacts(page, { robotId: "regression_daily", caseId: "fixed_flow" });
});
