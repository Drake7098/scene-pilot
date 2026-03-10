import { expect, test } from "@playwright/test";
import {
  captureArtifacts,
  installLocalProviderMocks,
  installTestDirectoryBridge,
  openProjectMenu,
  queuePromptResponse,
  readTestFsSnapshot,
  runStep,
} from "../support/runtime";

test("pro_save_export_flow_stays_stable_after_quick_workspace_handoff", async ({ page }) => {
  await installLocalProviderMocks(page, "drawthings_ready");
  await installTestDirectoryBridge(page);

  await runStep(page, "generate_image_and_enter_pro", async () => {
    await page.goto("/");
    await page.getByTestId("result-console-brief").fill("poster composition, bigger subject, simplified background, 9:16");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-ratio").selectOption("9:16");
    await page.getByTestId("composer-variants").selectOption("1");
    await page.getByTestId("result-console-generate").click();
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();
    await page.getByTestId("inspector-open-pro").click();
    await expect(page.getByTestId("project-menu-trigger")).toBeVisible();
  });

  await runStep(page, "save_and_save_as_are_operable", async () => {
    await openProjectMenu(page);
    await page.getByTestId("project-menu-save").click();

    const saveModal = page.getByTestId("save-platform-modal");
    await expect(saveModal).toBeVisible();
    await saveModal.getByTestId("save-platform-select").selectOption("wanx");
    await saveModal.getByTestId("save-platform-confirm").click();
    await expect(saveModal).toBeHidden();

    await queuePromptResponse(page, "robot-quick-save-as");
    await openProjectMenu(page);
    await page.getByTestId("project-menu-save-as").click();
    await expect(saveModal).toBeVisible();
    await saveModal.getByTestId("save-platform-select").selectOption("runway");
    await saveModal.getByTestId("save-platform-confirm").click();
    await expect(saveModal).toBeHidden();

    const snapshot = await readTestFsSnapshot(page);
    expect(snapshot.dirs).toContain("/ScenePilotix/robot-quick-save-as");
    expect(Object.keys(snapshot.files).some((file) => file.endsWith("/scene.json"))).toBeTruthy();
  });

  await runStep(page, "quick_and_package_export_both_work_and_modal_closes", async () => {
    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();

    const exportModal = page.getByTestId("export-modal");
    await expect(exportModal).toBeVisible();
    await exportModal.getByTestId("export-mode-quick").click();
    await exportModal.getByTestId("export-platform-select").selectOption("jimeng");
    const [quickDownload] = await Promise.all([
      page.waitForEvent("download"),
      exportModal.getByTestId("export-submit").click()
    ]);
    expect(quickDownload.suggestedFilename()).toMatch(/prompt\.txt$/i);
    await expect(exportModal.getByText(/downloaded|已下载/i)).toBeVisible();
    await exportModal.getByTestId("export-close-top").click();
    await expect(exportModal).toBeHidden();

    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();
    await expect(exportModal).toBeVisible();
    await exportModal.getByTestId("export-mode-package").click();
    await exportModal.getByTestId("export-platform-select").selectOption("runway");
    await exportModal.getByTestId("export-submit").click();
    await expect(exportModal.getByText(/Saving|已保存|saved/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(exportModal).toBeHidden();
  });

  await captureArtifacts(page, { robotId: "pro_save_export_local", caseId: "quick_workspace_image" });
});
