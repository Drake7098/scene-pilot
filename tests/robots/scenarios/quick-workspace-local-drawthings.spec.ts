import { expect, test } from "@playwright/test";
import { captureArtifacts, ensureMockProAccount, installLocalProviderMocks, openQuickWorkspace, runStep } from "../support/runtime";

test("quick_workspace_local_generation_prefers_comfyui_when_both_local_engines_are_available", async ({ page }) => {
  const providers = await installLocalProviderMocks(page, "drawthings_ready");
  await openQuickWorkspace(page, "en");
  await ensureMockProAccount(page, { creditsBalance: 240 });
  await openQuickWorkspace(page, "en");

  await runStep(page, "build_quick_image_canvas", async () => {
    await page.getByTestId("result-console-brief").fill("portrait indoors, centered subject, clean background, 1:1");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("single_subject");
    await page.getByTestId("composer-primary-3").selectOption("subject_highlight");
    await page.getByTestId("composer-primary-4").selectOption("realistic");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await page.getByTestId("result-console-brief-secondary").fill("make the subject slightly larger, eye-level framing, cleaner background");
    await page.getByTestId("quick-second-image-subject-scale").locator("select").selectOption("tight");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("center");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("clean");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-generate")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/portrait indoors/i);
  });

  await runStep(page, "generate_first_local_preview_prefers_comfyui", async () => {
    const beforeCalls = providers.comfyPromptCalls;
    await page.getByTestId("quick-canvas-ratio").selectOption("1:1");
    await page.getByTestId("quick-canvas-generate").click();

    await expect.poll(() => providers.comfyPromptCalls).toBeGreaterThan(beforeCalls);
    await expect(page.getByTestId("quick-preview-image").first()).toBeVisible();
    await expect(page.getByTestId("quick-canvas-generate")).toBeEnabled();
    expect(providers.drawTxt2ImgCalls).toBe(0);
  });

  await runStep(page, "second_generate_keeps_comfyui_after_ratio_change", async () => {
    const beforeCalls = providers.comfyPromptCalls;
    await page.getByTestId("quick-canvas-ratio").selectOption("16:9");
    await page.getByTestId("quick-canvas-generate").click();

    await expect.poll(() => providers.comfyPromptCalls).toBeGreaterThan(beforeCalls);
    await expect(page.getByTestId("quick-preview-image").first()).toBeVisible();
    await expect(page.getByTestId("quick-canvas-generate")).toBeEnabled();
    expect(providers.drawTxt2ImgCalls).toBe(0);
  });

  await runStep(page, "canvas_prompt_and_preview_stay_in_sync", async () => {
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/clean/i);
    await expect(page.getByTestId("quick-preview-pane")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-local")).toBeVisible();
  });

  await captureArtifacts(page, { robotId: "quick_workspace_local_drawthings", caseId: "image_refine_structure" });
});
