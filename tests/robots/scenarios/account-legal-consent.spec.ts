import { expect, test } from "@playwright/test";
import { ensureMockProAccount } from "../support/runtime";

async function ensureAccountCenterOpen(page: import("@playwright/test").Page) {
  if (await page.getByTestId("account-auth-panel").count()) return;
  if (await page.getByRole("button", { name: /购买点数|Buy Credits/i }).count()) return;
  const accountItem = page.getByTestId("top-help-item-account");
  for (let i = 0; i < 4; i += 1) {
    await page.getByTestId("top-help-trigger").click({ force: true });
    if (await accountItem.count()) {
      await accountItem.click();
      return;
    }
    await page.keyboard.press("Escape");
  }
  await expect(accountItem).toBeVisible();
  await accountItem.click();
}

test("account_auth_and_billing_require_legal_consent", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sp_workspace_entry_guide_done_v1", "1");
    localStorage.setItem("sp_workspace_mode", "results");
  });
  await page.goto("/app");
  const guideSkip = page.getByTestId("workspace-entry-guide-skip");
  if (await guideSkip.count()) {
    await guideSkip.click();
  }

  await ensureAccountCenterOpen(page);

  const sendButton = page.getByTestId("account-auth-send-code");
  await expect(sendButton).toBeDisabled();
  await expect(page.getByTestId("account-legal-open-terms")).toHaveAttribute("href", "/terms");
  await expect(page.getByTestId("account-legal-open-privacy")).toHaveAttribute("href", "/privacy");

  await page.getByPlaceholder(/Username or Email|邮箱/i).fill("legal-check@example.com");
  await page.getByPlaceholder(/Password|密码/i).fill("RobotPass123!");
  await expect(sendButton).toBeDisabled();
  await page.getByTestId("account-auth-legal-consent").check();
  await expect(sendButton).toBeEnabled();
  await ensureMockProAccount(page, { email: "legal-check@example.com", creditsBalance: 0 });
  await ensureAccountCenterOpen(page);

  const buyCreditsButton = page.getByRole("button", { name: /购买点数|Buy Credits/i }).first();
  if (await buyCreditsButton.count()) {
    await buyCreditsButton.click();
  } else {
    await page.getByRole("button", { name: /^点数$|^Credits$/i }).first().click();
  }

  const packButton = page.getByTestId("account-credit-pack-credit_100");
  await expect(packButton).toBeVisible();
  await expect(packButton).toBeDisabled();
  await page.getByTestId("account-billing-legal-consent").check();
  await expect(packButton).toBeEnabled();
});
