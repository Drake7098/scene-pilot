import { expect, test } from "@playwright/test";
import { captureArtifacts, installLocalProviderMocks, runStep } from "../support/runtime";

test("quick_workspace_local_drawthings_flow_covers_generate_refine_and_structure_patch", async ({ page }) => {
  const providers = await installLocalProviderMocks(page, "drawthings_ready");

  await runStep(page, "open_quick_workspace_and_generate_real_image", async () => {
    await page.goto("/");
    await page.getByTestId("result-console-brief").fill("portrait indoors, centered subject, clean background, 1:1");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-ratio").selectOption("1:1");
    await page.getByTestId("composer-variants").selectOption("1");
    await page.getByTestId("result-console-generate").click();

    await expect.poll(() => providers.drawTxt2ImgCalls).toBe(1);
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();
    await expect(page.getByTestId("inspector-provider-badge")).toContainText("Draw Things");
    await expect(page.getByTestId("runtime-draw-status")).toContainText(/connected|HTTP/i);
    await expect(page.getByTestId("result-console-generate")).toBeEnabled();
    expect(providers.comfyPromptCalls).toBe(0);
  });

  await runStep(page, "continue_generation_returns_a_second_real_result", async () => {
    await page.getByTestId("inspector-feedback-input").fill("Make the subject slightly larger and simplify the background.");
    await page.getByTestId("inspector-continue").click();

    await expect.poll(() => providers.drawTxt2ImgCalls).toBe(2);
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();
    await expect(page.getByTestId("inspector-provider-badge")).toContainText("Draw Things");
    await expect(page.getByTestId("result-console-generate")).toBeEnabled();
  });

  await runStep(page, "structure_adjustment_is_reflected_in_refine_hint", async () => {
    await page.getByTestId("inspector-toggle-structure").click();
    await expect(page.getByTestId("result-structure-editor")).toBeVisible();

    await page.getByTestId("structure-subject-size").evaluate((node) => {
      const input = node as HTMLInputElement;
      input.value = "48";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.getByTestId("structure-composition-focus").selectOption("left");
    await page.getByRole("button", { name: /Zoom Subject|放大主体/i }).click();
    await page.getByTestId("inspector-feedback-input").fill("Push the framing tighter.");
    await page.getByTestId("inspector-continue").click();

    await expect.poll(() => providers.drawTxt2ImgCalls).toBe(3);
    await expect(page.getByTestId("inspector-hint")).toContainText(/Structure updates:|结构调整：/i);
    await expect(page.getByTestId("inspector-hint")).toContainText(/composition focus=left|构图重心=left|构图重心=左/i);
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();
  });

  await captureArtifacts(page, { robotId: "quick_workspace_local_drawthings", caseId: "image_refine_structure" });
});
