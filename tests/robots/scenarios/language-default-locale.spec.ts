import { expect, test } from "@playwright/test";
import { runStep } from "../support/runtime";

async function resetLang(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("scenepilot_lang");
  });
  await page.reload();
}

test.describe("default_language_by_system_locale", () => {
  test.describe("zh locale", () => {
    test.use({ locale: "zh-CN" });

    test("defaults to chinese", async ({ page }) => {
      await resetLang(page);
      await runStep(page, "zh_locale_defaults_to_zh", async () => {
        await expect(page.locator("button").filter({ hasText: /^EN$/ })).toBeVisible();
      });
    });
  });

  test.describe("non-zh locale", () => {
    test.use({ locale: "fr-FR" });

    test("defaults to english", async ({ page }) => {
      await resetLang(page);
      await runStep(page, "non_zh_locale_defaults_to_en", async () => {
        await expect(page.locator("button").filter({ hasText: /^中文$/ })).toBeVisible();
      });
    });
  });
});
