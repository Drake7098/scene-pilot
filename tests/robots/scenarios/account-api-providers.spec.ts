import { expect, test } from "@playwright/test";
import { ensureMockProAccount } from "../support/runtime";

async function openTopMenu(page: import("@playwright/test").Page) {
  await page.getByTestId("top-help-trigger").click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await ensureMockProAccount(page, { email: "api-pro@example.com", creditsBalance: 320 });
});

test("pro user can manage fal and runway api settings in account center", async ({ page }) => {
  await openTopMenu(page);
  await page.getByTestId("top-help-item-api").click();

  await expect(page.getByTestId("account-api-provider-fal")).toBeVisible();
  await expect(page.getByTestId("account-api-provider-runway")).toBeVisible();

  await page.getByTestId("account-api-default-provider").selectOption("runway");
  await page.getByTestId("account-api-provider-mode-fal-personal").click();
  await page.getByTestId("account-api-provider-key-fal").fill("Key test-fal");
  await page.getByTestId("account-api-provider-model-fal").fill("fal-ai/flux/schnell");

  await page.getByTestId("account-api-provider-enabled-runway").check();
  await page.getByTestId("account-api-provider-mode-runway-personal").click();
  await page.getByTestId("account-api-provider-key-runway").fill("Bearer runway-secret");
  await page.getByTestId("account-api-provider-model-runway").fill("gen4_turbo");
  await page.getByTestId("account-api-save").click();

  await page.mouse.click(10, 10);

  await openTopMenu(page);
  await page.getByTestId("top-help-item-api").click();
  await expect(page.getByTestId("account-api-default-provider")).toHaveValue("runway");
  await expect(page.getByTestId("account-api-provider-key-fal")).toHaveValue("Key test-fal");
  await expect(page.getByTestId("account-api-provider-key-runway")).toHaveValue("Bearer runway-secret");
});
