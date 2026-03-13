import { expect, test } from "@playwright/test";
import { assertProjectVisible, captureArtifacts, createImageProject, openWizard, requireLiveMode, runStep } from "../support/runtime";

test("novice_user_create_first_storyboard", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-novice-${Date.now()}`;

  await runStep(page, "open_home", async () => {
    await page.goto("/app");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "open_wizard", async () => {
    await openWizard(page);
  });

  await runStep(page, "create_image_project", async () => {
    await createImageProject(page, projectName);
  });

  await runStep(page, "assert_project_created", async () => {
    await assertProjectVisible(page, projectName);

    const savedLabel = await page.evaluate(() => localStorage.getItem("scene_pilot_last_file_label") || "");
    expect(savedLabel).toBe(projectName);
  });

  await captureArtifacts(page, { robotId: "novice_user", caseId: "first_storyboard" });
});
