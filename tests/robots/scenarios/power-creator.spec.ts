import { expect, test } from "@playwright/test";
import { captureArtifacts, requireLiveMode, runStep } from "../support/runtime";

test("power_creator_high_frequency_edits", async ({ page }) => {
  requireLiveMode();

  await runStep(page, "open_workspace", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "rapid_parameter_updates", async () => {
    // TODO: implement repeated parameter updates and assert no UI freeze.
  });

  await captureArtifacts(page, { robotId: "power_creator", caseId: "rapid_edits" });
});
