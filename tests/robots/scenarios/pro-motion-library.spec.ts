import { expect, test } from "@playwright/test";
import { dismissAccountCenterIfPresent, installMockSessionBeforeLoad } from "../support/runtime";

async function openProWorkspace(page: import("@playwright/test").Page) {
  await installMockSessionBeforeLoad(page, { tier: "pro", creditsBalance: 240 });
  await page.goto("/app");
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "pro");
    localStorage.setItem("sp_workspace_entry_guide_done_v1", "1");
  });
  await page.reload();
  await dismissAccountCenterIfPresent(page);
}

test("pro_motion_library_and_tutorials_work", async ({ page }) => {
  await openProWorkspace(page);

  await expect(page.getByTestId("pro-director-block")).toBeVisible();
  await page.getByTestId("pro-shot-recipe-select").selectOption("steady_dialogue");
  await expect(page.getByTestId("classic-shot-select")).toHaveValue("over_shoulder");
  await expect(page.getByTestId("classic-movement-select")).toHaveValue("static");

  await expect(page.getByTestId("pro-motion-block")).toBeVisible();
  await expect(page.getByTestId("pro-plus-trigger")).toContainText(/反打|Reverse Angle/);

  await expect(page.getByTestId("pro-motion-plus-panel")).toBeVisible();
  await dismissAccountCenterIfPresent(page);
  await page.getByTestId("pro-plus-trigger").click();
  await page.getByTestId("pro-plus-category-psychology").hover();
  await expect(page.getByTestId("pro-plus-submenu")).toBeVisible();
  await page.getByTestId("pro-plus-option-dream_drift").click({ force: true });
  await expect(page.getByTestId("pro-plus-trigger")).toContainText(/梦境漂移|Dream Drift/);

  await dismissAccountCenterIfPresent(page);
  await page.getByTestId("top-help-trigger").click();
  await page.getByTestId("top-help-item-help_center").click();
  await expect(page.getByTestId("help-center-tab-pro_motion_beginner")).toBeVisible();
  await expect(page.getByTestId("help-center-tab-pro_motion_advanced")).toBeVisible();
  await page.getByTestId("help-center-tab-pro_motion_beginner").click();
  await expect(page.getByText(/新手教程：先用经典模式|Beginner Tutorial/i)).toBeVisible();
  await page.getByTestId("help-center-tab-pro_motion_advanced").click();
  await expect(page.getByText(/进阶专业教程：PRO\+ 与专业图片|Advanced Tutorial/i)).toBeVisible();
});
