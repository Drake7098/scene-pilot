import { expect, test, type Page } from "@playwright/test";
import { ensureMockProAccount, openQuickWorkspace, runStep } from "../support/runtime";
import { verifySelectRepresentativeOptions } from "../support/uiGuards";

async function openProWorkspace(page: Page, lang: "zh" | "en") {
  await page.goto("/app");
  await page.evaluate((nextLang) => {
    localStorage.setItem("sp_workspace_mode", "pro");
    localStorage.setItem("scenepilot_lang", nextLang);
  }, lang);
  await ensureMockProAccount(page, { creditsBalance: 260 });
  await page.reload();
}

async function reachQuickCanvas(page: Page) {
  await openQuickWorkspace(page, "en");
  await ensureMockProAccount(page, { creditsBalance: 260 });
  await page.getByTestId("result-console-brief").fill("A subject walks into a warm indoor room from snowy outdoors.");
  await page.getByTestId("result-console-generate").click();
  await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
  await page.getByTestId("result-console-brief-secondary").fill("Keep identity stable and smooth camera movement.");
  await page.getByTestId("result-console-generate-secondary").click();
  await expect(page.getByTestId("quick-canvas-actions")).toBeVisible();
}

test("pro_dropdowns_and_canvas_action_bar_layout_guard", async ({ page }) => {
  await runStep(page, "pro_workspace_select_readability_en", async () => {
    await openProWorkspace(page, "en");
    await expect(page.getByTestId("pro-director-block")).toBeVisible();
    await verifySelectRepresentativeOptions(page.getByTestId("pro-shot-recipe-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
    await verifySelectRepresentativeOptions(page.getByTestId("classic-shot-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
    await verifySelectRepresentativeOptions(page.getByTestId("classic-movement-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
  });

  await runStep(page, "pro_workspace_select_readability_zh", async () => {
    await openProWorkspace(page, "zh");
    await expect(page.getByTestId("pro-director-block")).toBeVisible();
    await verifySelectRepresentativeOptions(page.getByTestId("pro-shot-recipe-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
    await verifySelectRepresentativeOptions(page.getByTestId("classic-shot-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
    await verifySelectRepresentativeOptions(page.getByTestId("classic-movement-select"), {
      maxSlackPx: 96,
      maxSlackRatio: 3.15
    });
  });

  await runStep(page, "quick_canvas_generate_position_and_background", async () => {
    await reachQuickCanvas(page);
    const actionBar = page.getByTestId("quick-canvas-actions");
    const copyBtn = page.getByTestId("quick-canvas-copy");
    const generateBtn = page.getByTestId("quick-canvas-generate");
    await expect(copyBtn).toBeVisible();
    await expect(generateBtn).toBeVisible();

    const copyBox = await copyBtn.boundingBox();
    const generateBox = await generateBtn.boundingBox();
    expect(copyBox).not.toBeNull();
    expect(generateBox).not.toBeNull();
    if (!copyBox || !generateBox) return;
    expect(generateBox.x).toBeGreaterThan(copyBox.x + 40);
    expect(Math.abs(generateBox.y - copyBox.y)).toBeLessThanOrEqual(14);

    const actionBarBg = await actionBar.evaluate((node) => {
      const style = getComputedStyle(node as HTMLElement);
      return { bgImage: style.backgroundImage, bgColor: style.backgroundColor };
    });
    expect(actionBarBg.bgImage !== "none" || actionBarBg.bgColor !== "rgba(0, 0, 0, 0)").toBeTruthy();

    const generateBg = await generateBtn.evaluate((node) => {
      const style = getComputedStyle(node as HTMLElement);
      return { bgImage: style.backgroundImage, bgColor: style.backgroundColor };
    });
    expect(generateBg.bgImage !== "none" || generateBg.bgColor !== "rgba(0, 0, 0, 0)").toBeTruthy();
  });
});
