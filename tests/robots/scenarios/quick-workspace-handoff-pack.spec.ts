import { expect, test } from "@playwright/test";
import { captureArtifacts, installLocalProviderMocks, runStep } from "../support/runtime";

test("quick_workspace_degrades_to_drawthings_handoff_pack_when_local_engines_are_offline", async ({ page }) => {
  await installLocalProviderMocks(page, "handoff_only");

  await runStep(page, "generate_keeps_structure_and_offers_handoff_pack", async () => {
    await page.goto("/");
    await page.getByTestId("result-console-brief").fill("street night scene, two subjects, separated foreground and background, 16:9");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-ratio").selectOption("16:9");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("inspector-summary")).toContainText(/Local engines are unavailable|本地引擎暂不可用/i);
    await expect(page.getByTestId("runtime-draw-status")).toContainText(/task pack|任务包/i);
    await expect(page.getByTestId("runtime-comfy-status")).toContainText(/unavailable|未就绪/i);
    await expect(page.getByTestId("inspector-preview-placeholder")).toBeVisible();
    await expect(page.getByTestId("runtime-download-draw-pack")).toBeVisible();
  });

  await runStep(page, "drawthings_pack_can_be_downloaded", async () => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("runtime-download-draw-pack").click()
    ]);
    expect(download.suggestedFilename()).toMatch(/scenepilotix_drawthings_queue\.json/i);
  });

  await captureArtifacts(page, { robotId: "quick_workspace_handoff_pack", caseId: "dual_offline" });
});
