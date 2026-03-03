import { expect, Locator, test } from "@playwright/test";
import { captureArtifacts, requireLiveMode, runStep } from "../support/runtime";

const TXT = {
  startCreating: /开始创建|Start Creating/i,
  wizardStep1: /第\s*1\s*步：你要生成什么\?|Step\s*1:\s*What do you want to generate\?/i,
  newProject: /创建新项目|New Project/i,
  newWithoutSaving: /不保存，直接新建|New Without Saving/i,
  image: /^图片$|^Image$/i,
  next: /^下一步$|^Next$/i,
  startEditing: /^开始编辑$|^Start Editing$/i,
  scenes: /分镜列表|Scenes/i,
};

async function isVisible(locator: Locator): Promise<boolean> {
  try {
    return await locator.first().isVisible();
  } catch {
    return false;
  }
}

test("novice_user_create_first_storyboard", async ({ page }) => {
  requireLiveMode();

  const projectName = `robot-novice-${Date.now()}`;

  await runStep(page, "open_home", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Scene|Pilot|Vite/i);
  });

  await runStep(page, "open_wizard", async () => {
    const onboardingStartBtn = page.getByRole("button", { name: TXT.startCreating });
    const wizardStep1Title = page.getByText(TXT.wizardStep1);

    if (await isVisible(onboardingStartBtn)) {
      await onboardingStartBtn.click();
      await expect(wizardStep1Title).toBeVisible();
      return;
    }

    if (await isVisible(wizardStep1Title)) {
      return;
    }

    await page.getByRole("button", { name: TXT.newProject }).first().click();

    const newWithoutSavingBtn = page.getByRole("button", { name: TXT.newWithoutSaving });
    if (await isVisible(newWithoutSavingBtn)) {
      await newWithoutSavingBtn.click();
    }

    await expect(wizardStep1Title).toBeVisible();
  });

  await runStep(page, "create_image_project", async () => {
    await page.getByRole("button", { name: TXT.image }).click();
    await page.getByRole("button", { name: TXT.next }).click();

    const projectNameInput = page.locator(".spx-wizard-modal input").first();
    await expect(projectNameInput).toBeVisible();
    await projectNameInput.fill(projectName);

    await page.getByRole("button", { name: TXT.startEditing }).click();
  });

  await runStep(page, "assert_project_created", async () => {
    await expect(page.locator(".spx-wizard-modal")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(projectName).first()).toBeVisible();
    await expect(page.getByText(TXT.scenes).first()).toBeVisible();

    const savedLabel = await page.evaluate(() => localStorage.getItem("scene_pilot_last_file_label") || "");
    expect(savedLabel).toBe(projectName);
  });

  await captureArtifacts(page, { robotId: "novice_user", caseId: "first_storyboard" });
});
