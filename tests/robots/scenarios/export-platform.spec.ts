import { expect, test } from "@playwright/test";
import { assertProjectVisible, captureArtifacts, createVideoProject, openWizard, requireLiveMode, runStep } from "../support/runtime";

test("export_platform_switch_and_policy_hint", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-export-${Date.now()}`;

  await runStep(page, "open_and_create_video_project", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
    await openWizard(page);
    await createVideoProject(page, projectName, 2, 12, "open_space");
    await assertProjectVisible(page, projectName);
  });

  await runStep(page, "open_export_modal", async () => {
    await page.getByTestId("project-menu-trigger").click();
    await page.getByTestId("project-menu-export").click();
    await expect(page.getByTestId("export-modal")).toBeVisible();
  });

  await runStep(page, "switch_platform_policy", async () => {
    const platformSelect = page.getByTestId("export-platform-select");
    await expect(platformSelect).toBeVisible();

    const runwayValue = await platformSelect.locator("option").evaluateAll((options) => {
      const item = options.find((o) => /runway/i.test(o.textContent || ""));
      return item ? item.getAttribute("value") || "" : "";
    });
    expect(runwayValue).not.toBe("");
    await platformSelect.selectOption(runwayValue);

    const wanxValue = await platformSelect.locator("option").evaluateAll((options) => {
      const item = options.find((o) => /wanx|通义万相/i.test(o.textContent || ""));
      return item ? item.getAttribute("value") || "" : "";
    });
    expect(wanxValue).not.toBe("");
    await platformSelect.selectOption(wanxValue);

    await page.getByTestId("export-close").click();
    await expect(page.getByTestId("export-modal")).toBeHidden({ timeout: 5000 });
  });

  await captureArtifacts(page, { robotId: "export_platform_robot", caseId: "platform_switch" });
});
