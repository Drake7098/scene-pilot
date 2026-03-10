import { expect, test } from "@playwright/test";

test("account_auth_and_billing_require_legal_consent", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("top-help-trigger").click();
  await page.getByTestId("top-help-item-account").click();

  const sendButton = page.getByTestId("account-auth-send-code");
  await expect(sendButton).toBeDisabled();

  await page.getByTestId("account-legal-open-terms").click();
  await expect(page.getByTestId("account-legal-modal")).toBeVisible();
  await page.getByTestId("account-legal-modal-mask").click({ position: { x: 8, y: 8 } });
  await expect(page.getByTestId("account-legal-modal")).toHaveCount(0);

  await page.getByPlaceholder(/邮箱地址|Email/i).fill("legal-check@example.com");
  await page.getByTestId("account-auth-legal-consent").check();
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  const devCodeText = await page.locator("text=/开发验证码：|Dev code:/").textContent();
  const codeMatch = devCodeText?.match(/(\d{6})/);
  expect(codeMatch?.[1]).toBeTruthy();
  await page.getByPlaceholder(/6 位验证码|6-digit code/i).fill(codeMatch?.[1] ?? "");
  await page.getByTestId("account-auth-verify").click();

  await page.getByRole("button", { name: /购买点数|Buy Credits/i }).click();

  const packButton = page.getByTestId("account-credit-pack-credit_100");
  await expect(packButton).toBeDisabled();
  await page.getByTestId("account-billing-legal-consent").check();
  await expect(packButton).toBeEnabled();
});
