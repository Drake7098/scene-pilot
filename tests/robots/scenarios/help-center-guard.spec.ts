import { expect, test } from "@playwright/test";
import { captureArtifacts, requireLiveMode, runStep } from "../support/runtime";

test("help_center_guard_top_menu_and_modal_controls", async ({ page }) => {
  requireLiveMode();
  await page.addInitScript(() => {
    localStorage.setItem("scenepilot_lang", "zh");
  });

  await runStep(page, "open_home_no_legacy_tutorial_modal", async () => {
    await page.goto("/app");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
    await expect(page.getByText(/新手教程|Beginner Tutorial/i)).toHaveCount(0);

    const wizard = page.locator(".spx-wizard-modal");
    if (await wizard.isVisible()) {
      const skipBtn = wizard.getByRole("button", { name: /^跳过$|^Skip$|^取消$|^Cancel$/i }).first();
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
      }
      await expect(wizard).toBeHidden({ timeout: 10_000 });
    }
  });

  await runStep(page, "open_help_center_from_top_menu", async () => {
    await page.getByTestId("top-help-trigger").click();
    await page.getByTestId("top-help-item-help_center").click();

    const modal = page.getByTestId("help-center-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("help-center-tab-quick_start")).toBeVisible();
    await expect(page.getByTestId("help-center-tab-export")).toBeVisible();
    await expect(page.getByTestId("help-center-tab-troubleshoot")).toBeVisible();
    await expect(page.getByTestId("help-center-tab-feedback")).toBeVisible();
    await expect(page.getByTestId("help-center-tab-about")).toBeVisible();

    const geometry = await modal.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });

    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.vw);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.vh);
    expect(Math.abs(geometry.cx - geometry.vw / 2)).toBeLessThanOrEqual(24);
    expect(Math.abs(geometry.cy - geometry.vh / 2)).toBeLessThanOrEqual(40);
  });

  await runStep(page, "help_center_contains_new_copy_fragments", async () => {
    const modal = page.getByTestId("help-center-modal");
    await expect(modal).toContainText(/快速开始|Quick Start/);
    await expect(modal).toContainText(/创建项目|Create Project/);

    await page.getByTestId("help-center-tab-export").click();
    await expect(modal).toContainText(/Quick Export|快速导出/);
    await expect(modal).toContainText("适合快速把当前提示词送到大模型平台，先测试初步效果与方向是否正确");
    await expect(modal).toContainText(/Package Export|交付包导出/);
    await expect(modal).toContainText(/Current Scene|当前分镜/);
    await expect(modal).toContainText(/Continuity Sequence|连续序列/);
  });

  await runStep(page, "close_help_center_top_button", async () => {
    const modal = page.getByTestId("help-center-modal");
    await modal.getByTestId("help-center-close-top").click();
    await expect(modal).toBeHidden();
  });

  await runStep(page, "close_help_center_with_escape", async () => {
    await page.getByTestId("top-help-trigger").click();
    await page.getByTestId("top-help-item-help_center").click();

    const modal = page.getByTestId("help-center-modal");
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  await runStep(page, "close_help_center_by_mask_click", async () => {
    await page.getByTestId("top-help-trigger").click();
    await page.getByTestId("top-help-item-help_center").click();

    const modal = page.getByTestId("help-center-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("help-center-mask").click({ position: { x: 8, y: 8 } });
    await expect(modal).toBeHidden();
  });

  await captureArtifacts(page, { robotId: "help_center_guard", caseId: "help_center_controls" });
});
