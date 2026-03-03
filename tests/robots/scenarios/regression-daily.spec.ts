import { expect, test } from "@playwright/test";
import { captureArtifacts, requireLiveMode, runStep } from "../support/runtime";

test("regression_daily_fixed_script", async ({ page }) => {
  requireLiveMode();

  await runStep(page, "open_app", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "replay_fixed_flow", async () => {
    // TODO: encode deterministic business flow for daily replay.
  });

  await captureArtifacts(page, { robotId: "regression_daily", caseId: "fixed_flow" });
});
