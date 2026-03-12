import { expect, test } from "@playwright/test";
import { captureArtifacts, ensureMockProAccount, installLocalProviderMocks, openQuickWorkspace, runStep } from "../support/runtime";

test("quick_workspace_falls_back_to_drawthings_when_comfyui_is_unavailable", async ({ page }) => {
  const providers = await installLocalProviderMocks(page, "draw_fallback");
  await openQuickWorkspace(page, "en");
  await ensureMockProAccount(page, { creditsBalance: 240 });
  await openQuickWorkspace(page, "en");

  await runStep(page, "generate_uses_drawthings_after_comfy_probe_failure", async () => {
    await page.getByTestId("result-console-brief").fill("product still life, close shot, minimal background, 1:1");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("product_object");
    await page.getByTestId("composer-primary-3").selectOption("product_showcase");
    await page.getByTestId("composer-primary-4").selectOption("commercial");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await page.getByTestId("result-console-brief-secondary").fill("keep the product large, centered, background extremely simple");
    await page.getByTestId("quick-second-image-subject-scale").locator("select").selectOption("tight");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("center");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("clean");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    const beforeCalls = providers.drawTxt2ImgCalls;
    await page.getByTestId("quick-canvas-ratio").selectOption("1:1");
    await page.getByTestId("quick-canvas-generate").click();

    await expect.poll(() => providers.drawTxt2ImgCalls).toBeGreaterThan(beforeCalls);
    await expect(page.getByTestId("quick-preview-image").first()).toBeVisible();
    expect(providers.drawProbeCalls).toBeGreaterThan(0);
    expect(providers.comfyProbeCalls).toBeGreaterThan(0);
    expect(providers.comfyPromptCalls).toBe(0);
  });

  await captureArtifacts(page, { robotId: "quick_workspace_local_fallback", caseId: "comfy_fallback" });
});
