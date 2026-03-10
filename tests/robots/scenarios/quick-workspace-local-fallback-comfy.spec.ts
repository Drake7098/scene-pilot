import { expect, test } from "@playwright/test";
import { captureArtifacts, installLocalProviderMocks, runStep } from "../support/runtime";

test("quick_workspace_falls_back_to_comfyui_when_drawthings_is_unavailable", async ({ page }) => {
  const providers = await installLocalProviderMocks(page, "comfy_fallback");

  await runStep(page, "generate_uses_comfyui_after_drawthings_probe_failure", async () => {
    await page.goto("/");
    await page.getByTestId("result-console-brief").fill("product still life, close shot, minimal background, 1:1");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-ratio").selectOption("1:1");
    await page.getByTestId("result-console-generate").click();

    await expect.poll(() => providers.comfyPromptCalls).toBe(1);
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();
    await expect(page.getByTestId("inspector-provider-badge")).toContainText("ComfyUI");
    await expect(page.getByTestId("inspector-summary")).toContainText(/fell back to ComfyUI|回退到 ComfyUI/i);
    await expect(page.getByTestId("runtime-comfy-status")).toContainText(/connected|workflow/i);
    expect(providers.drawTxt2ImgCalls).toBe(0);
  });

  await captureArtifacts(page, { robotId: "quick_workspace_local_fallback", caseId: "comfy_fallback" });
});
