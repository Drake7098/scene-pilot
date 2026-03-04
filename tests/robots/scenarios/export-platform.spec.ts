import { expect, test } from "@playwright/test";
import { assertProjectVisible, captureArtifacts, createVideoProject, openWizard, requireLiveMode, runStep } from "../support/runtime";

test("export_platform_switch_and_policy_hint", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-export-${Date.now()}`;

  await runStep(page, "open_and_create_video_project", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 12, "open_space");
    await assertProjectVisible(page, projectName);
  });

  await runStep(page, "open_export_modal", async () => {
    const saveBtn = page.locator('button[title="保存到本地目录"], button[title="Save to local folder"]').first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(page.getByText(/保存分镜文件夹|Save Shot Folder/i)).toBeVisible();
  });

  await runStep(page, "switch_platform_policy", async () => {
    const platformSelect = page.locator('select:has(option:has-text("Runway"))').first();
    await expect(platformSelect).toBeVisible();

    await platformSelect.selectOption({ index: 2 });
    await expect(page.getByText(/当前平台策略：Runway|Current platform strategy: Runway/i)).toBeVisible();

    await platformSelect.selectOption({ index: 10 });
    await expect(page.getByText(/当前平台策略：通义万相|Current platform strategy: Wanx/i)).toBeVisible();

    await page.getByRole("button", { name: /^关闭$|^Close$/i }).first().click();
    await expect(page.getByText(/保存分镜文件夹|Save Shot Folder/i)).toBeHidden({ timeout: 5000 });
  });

  await captureArtifacts(page, { robotId: "export_platform_robot", caseId: "platform_switch" });
});
