import { expect, test } from "@playwright/test";
import { captureArtifacts, requireLiveMode, runStep } from "../support/runtime";

test("chaos_breaker_invalid_and_extreme_inputs", async ({ page }) => {
  requireLiveMode();

  await runStep(page, "open_app", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "inject_extreme_inputs", async () => {
    // TODO: push boundary values and verify graceful failures.
  });

  await captureArtifacts(page, { robotId: "chaos_breaker", caseId: "boundary" });
});
