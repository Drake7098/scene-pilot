import { expect, test } from "@playwright/test";
import {
  assertProjectVisible,
  captureArtifacts,
  createVideoProject,
  ensureMockProAccount,
  openProjectMenu,
  openWizard,
  requireLiveMode,
  runStep,
} from "../support/runtime";

test("modal_interaction_guard_save_model_and_export_overlay", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-modal-${Date.now()}`;

  await runStep(page, "open_and_create_project", async () => {
    await page.goto("/");
    await ensureMockProAccount(page, { creditsBalance: 240 });
    await page.evaluate(() => {
      localStorage.setItem("sp_workspace_mode", "pro");
    });
    await page.reload();
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 12, "small_plaza");
    await assertProjectVisible(page, projectName);
  });

  await runStep(page, "save_model_select_supports_real_interaction", async () => {
    await openProjectMenu(page);
    await page.getByTestId("project-menu-save").click();

    const modal = page.getByTestId("save-platform-modal");
    await expect(modal).toBeVisible();
    const select = modal.getByTestId("save-platform-select");
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();

    const box = await select.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click((box?.x || 0) + (box?.width || 0) / 2, (box?.y || 0) + (box?.height || 0) / 2);
    await expect(select).toBeFocused();
    const activeTag = await page.evaluate(() => document.activeElement?.tagName || "");
    expect(activeTag.toUpperCase()).toBe("SELECT");

    await select.selectOption("wanx");
    await expect(select).toHaveValue("wanx");

    await modal.getByTestId("save-platform-confirm").click();
    await expect(modal).toBeHidden();
  });

  await runStep(page, "export_modal_centered_and_closeable", async () => {
    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();

    const exportModal = page.getByTestId("export-modal");
    await expect(exportModal).toBeVisible();

    const geometry = await exportModal.evaluate((el) => {
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

    await exportModal.getByTestId("export-close-top").click();
    await expect(exportModal).toBeHidden();

    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();
    await expect(exportModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(exportModal).toBeHidden();

    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();
    await expect(exportModal).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(exportModal).toBeHidden();
  });

  await captureArtifacts(page, { robotId: "modal_interaction_guard", caseId: "save_export_modal" });
});
