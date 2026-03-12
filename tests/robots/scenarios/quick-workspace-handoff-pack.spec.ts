import { expect, test } from "@playwright/test";
import { captureArtifacts, ensureMockProAccount, installLocalProviderMocks, openQuickWorkspace, runStep } from "../support/runtime";

test("quick_workspace_degrades_to_drawthings_handoff_pack_when_local_engines_are_offline", async ({ page }) => {
  await installLocalProviderMocks(page, "handoff_only");
  await openQuickWorkspace(page, "en");
  await ensureMockProAccount(page, { creditsBalance: 240 });
  await openQuickWorkspace(page, "en");

  await runStep(page, "generate_keeps_structure_and_offers_handoff_pack", async () => {
    await page.getByTestId("result-console-brief").fill("street night scene, two subjects, separated foreground and background, 16:9");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("multi_subject");
    await page.getByTestId("composer-primary-3").selectOption("relation_expression");
    await page.getByTestId("composer-primary-4").selectOption("cinematic");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await page.getByTestId("result-console-brief-secondary").fill("keep the lead closer in foreground, keep depth separation, no extra people");
    await page.getByTestId("quick-second-image-subject-count").locator("select").selectOption("2");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("depth");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("rich");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await page.getByTestId("quick-canvas-ratio").selectOption("16:9");
    await page.getByTestId("quick-canvas-generate").click();

    await expect(page.getByTestId("quick-preview-pane")).toBeVisible();
    await expect(page.getByTestId("quick-preview-image")).toHaveCount(0);
    await expect(page.getByTestId("quick-canvas-local")).toBeVisible();
  });

  await runStep(page, "drawthings_pack_can_be_downloaded", async () => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("quick-canvas-local").click()
    ]);
    expect(download.suggestedFilename()).toMatch(/scenepilotix_drawthings_queue\.json/i);
  });

  await captureArtifacts(page, { robotId: "quick_workspace_handoff_pack", caseId: "dual_offline" });
});
