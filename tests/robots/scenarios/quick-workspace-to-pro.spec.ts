import { expect, test } from "@playwright/test";
import { captureArtifacts, ensureMockProAccount, openQuickWorkspace, runStep } from "../support/runtime";

test("quick_workspace_to_pro_switches_mode_without_auto_inheriting_quick_text", async ({ page }) => {
  await openQuickWorkspace(page, "zh");
  await ensureMockProAccount(page, { creditsBalance: 240 });
  await openQuickWorkspace(page, "zh");

  await runStep(page, "two_step_input_builds_structure_canvas", async () => {
    await page.getByTestId("result-console-brief").fill("赛博朋克女主在霓虹酒吧，主角偏左，画面有压迫感");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-primary-2").selectOption("multi_subject");
    await page.getByTestId("composer-primary-3").selectOption("relation_expression");
    await page.getByTestId("composer-primary-4").selectOption("cinematic");
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("quick-secondary-layer")).toBeVisible();
    await page.getByTestId("result-console-brief-secondary").fill("两人左右对峙，主角更靠前景，背景更丰富");
    await page.getByTestId("quick-second-image-subject-count").locator("select").selectOption("3");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("left");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("rich");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/赛博朋克女主在霓虹酒吧/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/两人左右对峙/);
  });

  await runStep(page, "open_pro_from_quick_workspace", async () => {
    await page.getByTestId("media-nav-pro").click();
    await expect(page.getByTestId("project-menu-trigger")).toBeVisible();
  });

  await runStep(page, "quick_content_is_not_auto_written_into_pro_project_snapshot", async () => {
    const projectRaw = await page.evaluate(() => localStorage.getItem("scenepilot_project"));
    if (!projectRaw) return;
    expect(projectRaw).not.toContain("赛博朋克女主在霓虹酒吧");
    expect(projectRaw).not.toContain("两人左右对峙");
  });

  await captureArtifacts(page, { robotId: "quick_workspace_to_pro", caseId: "mode_switch_no_auto_inherit" });
});
