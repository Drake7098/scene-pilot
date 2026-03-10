import { expect, test } from "@playwright/test";
import { captureArtifacts, getStoredProject, installLocalProviderMocks, runStep } from "../support/runtime";

test("quick_workspace_to_pro_preserves_goal_composition_and_structure", async ({ page }) => {
  await installLocalProviderMocks(page, "drawthings_ready");

  await runStep(page, "generate_adjust_structure_and_open_pro", async () => {
    await page.goto("/");
    await page.getByTestId("result-console-brief").fill("cyberpunk heroine, left position, neon light, 16:9");
    await page.getByTestId("composer-media-type").selectOption("image");
    await page.getByTestId("composer-ratio").selectOption("16:9");
    await page.getByTestId("composer-variants").selectOption("1");
    await page.getByTestId("result-console-generate").click();
    await expect(page.getByTestId("inspector-preview-image")).toBeVisible();

    await page.getByTestId("inspector-toggle-structure").click();
    await page.getByTestId("structure-subject-size").evaluate((node) => {
      const input = node as HTMLInputElement;
      input.value = "46";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.getByTestId("structure-composition-focus").selectOption("right");
    await page.getByTestId("inspector-open-pro").click();

    await expect(page.getByTestId("project-menu-trigger")).toBeVisible();
  });

  await runStep(page, "project_snapshot_contains_goal_and_composition_focus", async () => {
    const project = await getStoredProject(page);
    expect(project).not.toBeNull();
    const notes = String(project?.scenes?.[0]?.notes ?? "");
    expect(notes).toContain("goal:");
    expect(notes).toContain("composition_focus:right");

    const layerXs = (project?.scenes?.[0]?.layers ?? []).map((layer) => Number(layer.kf?.[0]?.x ?? 0));
    expect(layerXs.some((x) => x >= 40)).toBeTruthy();
  });

  await runStep(page, "top_quick_workspace_button_returns_without_losing_brief", async () => {
    await page.getByTestId("top-open-quick-workspace").click();
    await expect(page.getByText(/快捷工作台|Quick Workspace/i).first()).toBeVisible();
    await expect(page.getByTestId("result-console-brief")).toHaveValue(/cyberpunk heroine/i);
    await expect(page.getByTestId("inspector-provider-badge")).toContainText("Draw Things");
  });

  await captureArtifacts(page, { robotId: "quick_workspace_to_pro", caseId: "handoff" });
});
