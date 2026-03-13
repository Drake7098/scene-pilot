import { expect, test } from "@playwright/test";
import { dismissAccountCenterIfPresent, installMockSessionBeforeLoad } from "../support/runtime";

test.beforeEach(async ({ page }) => {
  await installMockSessionBeforeLoad(page, { tier: "free", creditsBalance: 80 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__workspace_entry_guide_reset_once__") === "1") return;
    localStorage.removeItem("sp_workspace_mode");
    localStorage.removeItem("sp_workspace_entry_guide_done_v1");
    sessionStorage.setItem("__workspace_entry_guide_reset_once__", "1");
  });
});

test("first open shows workspace entry guide", async ({ page }) => {
  await page.goto("/app");
  await dismissAccountCenterIfPresent(page);
  await expect(page.getByTestId("workspace-entry-guide")).toBeVisible();
  await expect(page.getByTestId("workspace-entry-guide-quick")).toBeVisible();
  await expect(page.getByTestId("workspace-entry-guide-pro")).toBeVisible();
});

test("choose quick keeps quick mode and does not show guide again", async ({ page }) => {
  await page.goto("/app");
  await dismissAccountCenterIfPresent(page);
  await page.getByTestId("workspace-entry-guide-quick").click();

  await expect(page.getByTestId("workspace-entry-guide")).toHaveCount(0);
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem("sp_workspace_mode"));
  }).toBe("results");
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem("sp_workspace_entry_guide_done_v1"));
  }).toBe("1");

  await page.reload();
  await expect(page.getByTestId("workspace-entry-guide")).toHaveCount(0);
  await expect(page.getByTestId("result-console-brief")).toBeVisible();
});

test("choose pro switches to pro mode and does not show guide again", async ({ page }) => {
  await page.goto("/app");
  await dismissAccountCenterIfPresent(page);
  await page.getByTestId("workspace-entry-guide-pro").click();

  await expect(page.getByTestId("workspace-entry-guide")).toHaveCount(0);
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem("sp_workspace_mode"));
  }).toBe("pro");
  await expect(page.getByTestId("pro-motion-block")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("workspace-entry-guide")).toHaveCount(0);
  await expect(page.getByTestId("pro-motion-block")).toBeVisible();
});

test("skip stores guide completion and keeps current mode", async ({ page }) => {
  await page.goto("/app");
  await dismissAccountCenterIfPresent(page);
  await page.getByTestId("workspace-entry-guide-skip").click();

  await expect(page.getByTestId("workspace-entry-guide")).toHaveCount(0);
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem("sp_workspace_entry_guide_done_v1"));
  }).toBe("1");
  await expect.poll(async () => {
    return await page.evaluate(() => localStorage.getItem("sp_workspace_mode"));
  }).toBe("results");
});
