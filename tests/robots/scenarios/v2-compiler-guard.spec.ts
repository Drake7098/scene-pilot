import { expect, test } from "@playwright/test";
import {
  assertProjectVisible,
  assertVideoProjectUsesV2,
  captureArtifacts,
  createVideoProject,
  getStoredProject,
  openWizard,
  requireLiveMode,
  runStep,
} from "../support/runtime";

test("v2_compiler_guard_scene_tier_and_mode", async ({ page }) => {
  requireLiveMode();

  await runStep(page, "open_app", async () => {
    await page.goto("/app");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "create_v2_open_space_project", async () => {
    const projectName = `robot-v2-open-${Date.now()}`;
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 12, "open_space");
    await assertProjectVisible(page, projectName);
    await assertVideoProjectUsesV2(page, { minScenes: 2, expectedMode: "strict" });

    const stored = await getStoredProject(page);
    const notes = String(stored?.scenes?.[0]?.notes ?? "");
    expect(notes).toContain("@scene_tier:open_space");
  });

  await runStep(page, "create_v2_indoor_project", async () => {
    const projectName = `robot-v2-indoor-${Date.now()}`;
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 10, "indoor");
    await assertProjectVisible(page, projectName);
    await assertVideoProjectUsesV2(page, { minScenes: 2, expectedMode: "strict" });

    const stored = await getStoredProject(page);
    const notes = String(stored?.scenes?.[0]?.notes ?? "");
    expect(notes).toContain("@scene_tier:indoor");
  });

  await captureArtifacts(page, { robotId: "v2_compiler_guard", caseId: "tier_mode_guard" });
});
