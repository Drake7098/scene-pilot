import { expect, test } from "@playwright/test";
import { assertVideoProjectUsesV2, captureArtifacts, openWizard, requireLiveMode, runStep } from "../support/runtime";

test("chaos_breaker_invalid_and_extreme_inputs", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-chaos-${Date.now()}-${"x".repeat(24)}`;

  await runStep(page, "open_app", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "enter_video_setup", async () => {
    await openWizard(page);
    await page.getByRole("button", { name: /^视频$|^Video$/i }).click();
    await page.getByRole("button", { name: /^下一步$|^Next$/i }).click();
    await page.getByRole("button", { name: /标准剪辑|Edit/i }).click();
    await page.getByRole("button", { name: /^下一步$|^Next$/i }).click();
    await expect(page.locator(".spx-wizard-modal")).toBeVisible();
  });

  await runStep(page, "invalid_then_extreme_inputs", async () => {
    const modal = page.locator(".spx-wizard-modal");
    const startEditingBtn = modal.getByRole("button", { name: /^开始编辑$|^Start Editing$/i });

    await startEditingBtn.scrollIntoViewIfNeeded();
    await startEditingBtn.evaluate((el) => (el as HTMLButtonElement).click());
    await expect(modal.getByText(/请先输入项目名称|Please enter project name first\./i)).toBeVisible();

    const inputs = modal.locator("input");
    const selects = modal.locator("select");

    await inputs.first().fill(projectName);
    await selects.first().selectOption("8");
    await inputs.nth(1).fill("9999");

    await expect(modal.getByText(/分镜骨架预览|Shot Skeleton Preview/i)).toBeVisible();
  });

  await runStep(page, "create_after_stress", async () => {
    const modal = page.locator(".spx-wizard-modal");
    const startEditingBtn = modal.getByRole("button", { name: /^开始编辑$|^Start Editing$/i });
    await startEditingBtn.scrollIntoViewIfNeeded();
    await startEditingBtn.evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator(".spx-wizard-modal")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(/分镜列表|Scenes/i).first()).toBeVisible();
    await expect(page.getByText(/项目|Project/i).first()).toBeVisible();
    await assertVideoProjectUsesV2(page, { minScenes: 2, expectedMode: "strict" });
  });

  await captureArtifacts(page, { robotId: "chaos_breaker", caseId: "boundary" });
});
