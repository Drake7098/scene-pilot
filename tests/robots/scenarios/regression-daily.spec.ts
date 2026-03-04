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
    await assertProjectVisible(page, PROJECT_NAME);
    await expect(page.getByText(/01\s*[｜|]\s*(镜头|Shot)01/i).first()).toBeVisible();
    await expect(page.getByText(/02\s*[｜|]\s*(镜头|Shot)02/i).first()).toBeVisible();
    await assertVideoProjectUsesV2(page, { minScenes: 2, expectedMode: "strict" });

    const savedLabel = await page.evaluate(() => localStorage.getItem("scene_pilot_last_file_label") || "");
    expect(savedLabel).toBe(PROJECT_NAME);
  });

  await captureArtifacts(page, { robotId: "regression_daily", caseId: "fixed_flow" });
});
