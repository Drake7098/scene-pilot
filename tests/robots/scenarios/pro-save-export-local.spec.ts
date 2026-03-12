import { expect, test } from "@playwright/test";
import {
  captureArtifacts,
  ensureMockProAccount,
  installLocalProviderMocks,
  installTestDirectoryBridge,
  openQuickWorkspace,
  openProjectMenu,
  queuePromptResponse,
  readTestFsSnapshot,
  runStep,
} from "../support/runtime";

test("pro_save_export_flow_stays_stable_after_quick_workspace_handoff", async ({ page }) => {
  await installLocalProviderMocks(page, "drawthings_ready");
  await installTestDirectoryBridge(page);
  await openQuickWorkspace(page, "en");
  await ensureMockProAccount(page, { creditsBalance: 240 });
  await openQuickWorkspace(page, "en");

  await runStep(page, "generate_image_and_enter_pro", async () => {
    await page.getByTestId("result-console-brief").fill("poster composition, bigger subject, simplified background, 9:16");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("single_subject");
    await page.getByTestId("composer-primary-3").selectOption("subject_highlight");
    await page.getByTestId("composer-primary-4").selectOption("commercial");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await page.getByTestId("result-console-brief-secondary").fill("make the poster subject larger, vertical frame, keep the background minimal");
    await page.getByTestId("quick-second-image-subject-scale").locator("select").selectOption("tight");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("center");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("clean");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await page.getByTestId("quick-canvas-ratio").selectOption("9:16");
    await page.getByTestId("quick-canvas-generate").click();
    await expect(page.getByTestId("quick-preview-image").first()).toBeVisible();
    await page.getByTestId("media-nav-pro").click();
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
    const files = Object.keys(snapshot.files);
    expect(files.some((file) => file.endsWith(".json"))).toBeTruthy();
    expect(files.some((file) => /robot-quick-save-as/i.test(file) && file.endsWith(".json"))).toBeTruthy();
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
    await expect(exportModal).toBeHidden();

    await openProjectMenu(page);
    await page.getByTestId("project-menu-export").click();
    await expect(exportModal).toBeVisible();
    await exportModal.getByTestId("export-mode-package").click();
    await exportModal.getByTestId("export-platform-select").selectOption("runway");
    await exportModal.getByTestId("export-submit").click();
    await expect.poll(async () => {
      const snapshot = await readTestFsSnapshot(page);
      return Object.keys(snapshot.files).filter((file) => /prompt\.txt$|refs-manifest\.txt$/i.test(file)).length;
    }).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect(exportModal).toBeHidden();
  });

  await captureArtifacts(page, { robotId: "pro_save_export_local", caseId: "quick_workspace_image" });
});
