import { expect, test } from "@playwright/test";
import { dismissAccountCenterIfPresent, installMockSessionBeforeLoad, runStep } from "../support/runtime";

async function openQuickWorkspace(page: import("@playwright/test").Page) {
  await installMockSessionBeforeLoad(page, { tier: "free", creditsBalance: 180 });
  await page.goto("/app");
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "results");
    localStorage.setItem("sp_workspace_entry_guide_done_v1", "1");
    localStorage.removeItem("sp_quick_media_type");
  });
  await page.reload();
  await dismissAccountCenterIfPresent(page);
}

test("quick_workspace_two_layer_input_flow_image", async ({ page }) => {
  await openQuickWorkspace(page);

  await runStep(page, "intro_and_initial_state", async () => {
    await expect(page.getByTestId("quick-intro-title")).toHaveText(/先说你想看到什么|Tell us what you want to see first/i);

    await expect(page.getByTestId("quick-primary-choices")).toHaveCount(0);
    await expect(page.getByTestId("quick-primary-media-row")).toHaveCount(0);
    await expect(page.getByTestId("quick-primary-structure-row")).toHaveCount(0);

    await expect(page.getByTestId("result-console-brief")).toBeVisible();
    await expect(page.getByTestId("result-console-generate")).toBeVisible();
    await expect(page.getByTestId("quick-secondary-layer")).toHaveCount(0);
    await expect(page.getByTestId("quick-structure-canvas")).toHaveCount(0);
    await expect(page.getByTestId("quick-structure-canvas-ready")).toHaveCount(0);
  });

  await runStep(page, "first_layer_uses_4_dropdowns_image_mode", async () => {
    await expect(page.getByTestId("composer-media-type")).toBeVisible();
    await expect(page.getByTestId("composer-primary-2")).toBeVisible();
    await expect(page.getByTestId("composer-primary-3")).toBeVisible();
    await expect(page.getByTestId("composer-primary-4")).toBeVisible();

    await expect(page.getByTestId("composer-media-type")).toHaveValue("image");
    await expect(page.getByTestId("composer-primary-2")).toHaveValue("single_subject");
    await expect(page.getByTestId("composer-primary-3")).toHaveValue("subject_highlight");
    await expect(page.getByTestId("composer-primary-4")).toHaveValue("cinematic");
    const structure2Options = await page.getByTestId("composer-primary-2").locator("option").allTextContents();
    const joined2 = structure2Options.join("|");
    expect(/单主体|Single Subject/i.test(joined2)).toBeTruthy();
    expect(/多主体关系|Multi Subject Relation/i.test(joined2)).toBeTruthy();
    expect(/环境场景|Environment Scene/i.test(joined2)).toBeTruthy();
    expect(/产品物件|Product Object/i.test(joined2)).toBeTruthy();
  });

  await runStep(page, "second_layer_only_appears_after_first_confirm", async () => {
    await dismissAccountCenterIfPresent(page);
    await page.getByTestId("result-console-brief").fill("三个人站在酒吧里，中间是主角");
    await expect(page.getByTestId("quick-secondary-layer")).toHaveCount(0);
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("quick-secondary-layer")).toBeVisible();
    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await expect(page.getByTestId("result-console-brief-secondary")).toHaveAttribute(
      "placeholder",
      /主体占比|subject scale|framing and constraints/i
    );
    await expect(page.getByTestId("quick-second-image-subject-count")).toHaveCount(0);
    await expect(page.getByTestId("quick-second-image-subject-scale")).toBeVisible();
    await expect(page.getByTestId("quick-second-image-composition-position")).toBeVisible();
    await expect(page.getByTestId("quick-second-image-background-complexity")).toBeVisible();
    await expect(page.getByTestId("quick-second-image-subject-scale").locator("select")).toHaveValue("balanced");
    await expect(page.getByTestId("quick-second-image-composition-position").locator("select")).toHaveValue("center");
    await expect(page.getByTestId("quick-second-image-background-complexity").locator("select")).toHaveValue("normal");
    await expect(page.getByTestId("quick-structure-canvas")).toHaveCount(0);
    await expect(page.getByTestId("quick-structure-canvas-ready")).toHaveCount(0);
  });

  await runStep(page, "image_second_submit_then_canvas_appears", async () => {
    await page.getByTestId("result-console-brief-secondary").fill("主角更大，背景别太乱");
    await page.getByTestId("quick-second-image-subject-scale").locator("select").selectOption("tight");
    await page.getByTestId("quick-second-image-composition-position").locator("select").selectOption("left");
    await page.getByTestId("quick-second-image-background-complexity").locator("select").selectOption("rich");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await expect(page.getByTestId("quick-prompt-panel")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/三个人站在酒吧里，中间是主角/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/主角更大，背景别太乱/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/16:9/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/rich|丰富/);
    await expect(page.getByTestId("quick-canvas-actions")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-copy")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-ratio")).toBeVisible();
  });
});

test("quick_workspace_two_layer_input_flow_video", async ({ page }) => {
  await openQuickWorkspace(page);

  await runStep(page, "first_layer_uses_4_dropdowns_video_mode", async () => {
    await page.getByTestId("composer-media-type").selectOption("video");
    await expect(page.getByTestId("composer-media-type")).toHaveValue("video");
    await expect(page.getByTestId("composer-primary-2")).toHaveValue("single_shot");
    await expect(page.getByTestId("composer-primary-3")).toHaveValue("character_action");
    await expect(page.getByTestId("composer-primary-4")).toHaveValue("cinematic");

    const structure2Options = await page.getByTestId("composer-primary-2").locator("option").allTextContents();
    const joined2 = structure2Options.join("|");
    expect(/单镜头|Single Shot/i.test(joined2)).toBeTruthy();
    expect(/多机位|Multicam/i.test(joined2)).toBeTruthy();
    expect(/连续镜头|Continuous/i.test(joined2)).toBeTruthy();
    expect(/多场景|Multi Scene/i.test(joined2)).toBeTruthy();

    const structure3Options = await page.getByTestId("composer-primary-3").locator("option").allTextContents();
    const joined3 = structure3Options.join("|");
    expect(/人物动作|Character Action/i.test(joined3)).toBeTruthy();
    expect(/关系变化|Relation Change/i.test(joined3)).toBeTruthy();
    expect(/场景推进|Scene Progression/i.test(joined3)).toBeTruthy();
    expect(/情绪氛围|Mood Atmosphere/i.test(joined3)).toBeTruthy();
  });

  await runStep(page, "video_second_layer_only_after_first_confirm", async () => {
    await dismissAccountCenterIfPresent(page);
    await page.getByTestId("result-console-brief").fill("先看到门外风雪，然后开门进入屋内");
    await expect(page.getByTestId("quick-secondary-layer")).toHaveCount(0);
    await page.getByTestId("result-console-generate").click();

    await expect(page.getByTestId("quick-secondary-layer")).toBeVisible();
    await expect(page.getByTestId("result-console-brief-secondary")).toBeVisible();
    await expect(page.getByTestId("result-console-brief-secondary")).toHaveAttribute(
      "placeholder",
      /镜头运动|camera motion|action order \+ camera change/i
    );
    await expect(page.getByTestId("quick-second-video-shot-count")).toHaveCount(0);
    await expect(page.getByTestId("quick-second-video-camera-motion")).toBeVisible();
    await expect(page.getByTestId("quick-second-video-main-scene")).toBeVisible();
    await expect(page.getByTestId("quick-second-video-continuity-focus")).toBeVisible();
    await expect(page.getByTestId("quick-second-video-camera-motion").locator("select")).toHaveValue("follow");
    await expect(page.getByTestId("quick-second-video-main-scene").locator("select")).toHaveValue("indoor");
    await expect(page.getByTestId("quick-second-video-continuity-focus").locator("select")).toHaveValue("identity");
    await expect(page.getByTestId("quick-structure-canvas")).toHaveCount(0);
    await expect(page.getByTestId("quick-structure-canvas-ready")).toHaveCount(0);
  });

  await runStep(page, "video_second_submit_then_canvas_appears", async () => {
    await page.getByTestId("result-console-brief-secondary").fill("保持第一视角，室内暖光不要变");
    await page.getByTestId("quick-second-video-camera-motion").locator("select").selectOption("follow");
    await page.getByTestId("quick-second-video-main-scene").locator("select").selectOption("outdoor");
    await page.getByTestId("quick-second-video-continuity-focus").locator("select").selectOption("lighting");
    await page.getByTestId("result-console-generate-secondary").click();

    await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
    await expect(page.getByTestId("quick-prompt-panel")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/先看到门外风雪，然后开门进入屋内/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/保持第一视角，室内暖光不要变/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/single-shot|单镜头/);
    await expect(page.getByTestId("quick-canvas-prompt-editor")).toHaveValue(/lighting consistency|光线一致/);
    await expect(page.getByTestId("quick-canvas-actions")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-copy")).toBeVisible();
    await expect(page.getByTestId("quick-canvas-ratio")).toBeVisible();
  });
});
