import { expect, test, type Page } from "@playwright/test";
import { captureArtifacts, runStep } from "../support/runtime";
import {
  assertNoVerticalOverlap,
  verifySelectRepresentativeOptions,
} from "../support/uiGuards";

async function openQuickWorkspace(page: Page, lang: "zh" | "en") {
  await page.goto("/");
  await page.evaluate((nextLang) => {
    localStorage.setItem("sp_workspace_mode", "results");
    localStorage.setItem("scenepilot_lang", nextLang);
    localStorage.removeItem("sp_quick_media_type");
  }, lang);
  await page.reload();
}

async function enterSecondStep(page: Page, primary: string) {
  await page.getByTestId("result-console-brief").fill(primary);
  await page.getByTestId("result-console-generate").click();
  await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId("result-console-brief-secondary")).toBeFocused();
}

test("quick_workspace_layout_guard_for_zh_and_en", async ({ page }) => {
  await runStep(page, "zh_layout_and_dropdown_fit", async () => {
    await openQuickWorkspace(page, "zh");
    await enterSecondStep(page, "三个人在酒吧对峙，主角居中");
    await assertNoVerticalOverlap(
      page.getByTestId("result-console-brief"),
      page.getByTestId("result-console-brief-secondary"),
    );

    await verifySelectRepresentativeOptions(page.getByTestId("composer-media-type"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-2"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-3"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-4"));

    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("single_subject");
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-image-subject-scale").locator("select"));
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-image-composition-position").locator("select"));
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-image-background-complexity").locator("select"));
  });

  await runStep(page, "en_layout_and_dropdown_fit", async () => {
    await openQuickWorkspace(page, "en");
    await page.getByTestId("composer-media-type").selectOption("video");
    await enterSecondStep(page, "A character enters from snow into a warm indoor shelter.");
    await assertNoVerticalOverlap(
      page.getByTestId("result-console-brief"),
      page.getByTestId("result-console-brief-secondary"),
    );

    await verifySelectRepresentativeOptions(page.getByTestId("composer-media-type"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-2"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-3"));
    await verifySelectRepresentativeOptions(page.getByTestId("composer-primary-4"));

    await page.getByTestId("composer-media-type").selectOption("video");
    await page.getByTestId("composer-primary-2").selectOption("single_shot");
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-video-camera-motion").locator("select"));
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-video-main-scene").locator("select"));
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-video-continuity-focus").locator("select"));
    await verifySelectRepresentativeOptions(page.getByTestId("quick-second-video-shot-grammar").locator("select"));
  });

  await captureArtifacts(page, { robotId: "quick_workspace_layout_guard", caseId: "zh_en" });
});
