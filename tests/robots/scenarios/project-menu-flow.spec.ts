import { expect, test } from "@playwright/test";
import {
  assertProjectVisible,
  captureArtifacts,
  createVideoProject,
  installTestDirectoryBridge,
  openProjectMenu,
  openWizard,
  queuePromptResponse,
  readTestFsSnapshot,
  runStep,
} from "../support/runtime";

test("project_menu_save_export_flow_is_continuous", async ({ page }) => {
  const projectName = `robot-project-menu-${Date.now()}`;

  await installTestDirectoryBridge(page);

  await runStep(page, "open_and_create_project", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 12, "small_plaza");
    await assertProjectVisible(page, projectName);
  });

  await runStep(page, "project_menu_items_visible", async () => {
    await openProjectMenu(page);
    await expect(page.getByTestId("project-menu-open")).toBeVisible();
    await expect(page.getByTestId("project-menu-rename")).toBeVisible();
    await expect(page.getByTestId("project-menu-save")).toBeVisible();
    await expect(page.getByTestId("project-menu-save-as")).toBeVisible();
    await expect(page.getByTestId("project-menu-export")).toBeVisible();
    await expect(page.getByTestId("project-menu-new")).toBeVisible();
  });

  await runStep(page, "save_flow_selects_target_model_and_succeeds", async () => {
    await page.getByTestId("project-menu-save").click();
    await expect(page.getByTestId("project-menu")).toBeHidden();

    const modal = page.getByTestId("save-platform-modal");
    await expect(modal).toBeVisible();
    await modal.getByTestId("save-platform-select").selectOption("wanx");
    await modal.getByTestId("save-platform-confirm").click();
    await expect(modal).toBeHidden();
    await expect(page.getByText(/已保存：|Saved:/i).first()).toBeVisible();

    const chosen = await page.evaluate(() => localStorage.getItem("sp_save_prompt_platform"));
    expect(chosen).toBe("wanx");

    const snapshot = await readTestFsSnapshot(page);
    expect(Object.keys(snapshot.files).some((path) => path.endsWith(".txt"))).toBeTruthy();
    expect(Object.keys(snapshot.files).some((path) => path.endsWith("/scene.json"))).toBeTruthy();
  });

  await runStep(page, "save_as_flow_reasks_target_model_and_writes_new_project_dir", async () => {
    await queuePromptResponse(page, "robot-menu-save-as");
    await openProjectMenu(page);
    await page.getByTestId("project-menu-save-as").click();
    await expect(page.getByTestId("project-menu")).toBeHidden();

    const modal = page.getByTestId("save-platform-modal");
    await expect(modal).toBeVisible();
    await modal.getByTestId("save-platform-select").selectOption("runway");
    await modal.getByTestId("save-platform-confirm").click();
    await expect(modal).toBeHidden();
    await expect(page.getByText(/已保存：|Saved:/i).first()).toBeVisible();

    const chosen = await page.evaluate(() => localStorage.getItem("sp_save_prompt_platform"));
    expect(chosen).toBe("runway");

    const snapshot = await readTestFsSnapshot(page);
    expect(snapshot.dirs).toContain("/ScenePilotix/robot-menu-save-as");
  });

  await runStep(page, "export_flow_opens_modal_and_finishes_quick_export", async () => {
    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();
    await expect(page.getByTestId("project-menu")).toBeHidden();

    const exportModal = page.getByTestId("export-modal");
    await expect(exportModal).toBeVisible();
    await exportModal.getByTestId("export-mode-quick").click();
    await exportModal.getByTestId("export-platform-select").selectOption("jimeng");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportModal.getByTestId("export-submit").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/prompt\.txt$/i);
    await expect(exportModal.getByText(/prompt\.txt 已下载|prompt\.txt downloaded/i)).toBeVisible();

    const chosen = await page.evaluate(() => localStorage.getItem("sp_save_prompt_platform"));
    expect(chosen).toBe("jimeng");
  });

  await captureArtifacts(page, { robotId: "project_menu_flow", caseId: "save_export" });
});
