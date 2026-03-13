import { expect, test } from "@playwright/test";

async function openTopMenu(page: import("@playwright/test").Page) {
  await page.getByTestId("top-help-trigger").click();
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await openTopMenu(page);
  await page.getByTestId("top-help-item-account").click();
  await page.getByPlaceholder(/邮箱地址|Email/i).fill(email);
  await page.getByTestId("account-auth-legal-consent").check();
  await page.getByTestId("account-auth-send-code").click();
  const devCodeText = await page.locator("text=/开发验证码：|Dev code:/").textContent();
  const code = devCodeText?.match(/(\d{6})/)?.[1] ?? "";
  await page.getByPlaceholder(/6 位验证码|6-digit code/i).fill(code);
  await page.getByTestId("account-auth-verify").click();
  await page.mouse.click(12, 12);
}

async function openQuickWorkspace(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "results");
  });
  await page.reload();
}

async function ensureQuickCanvasReady(page: import("@playwright/test").Page) {
  await page.getByTestId("result-console-brief").fill("一个人站在雨夜街头");
  await page.getByTestId("result-console-generate").click();
  await page.getByTestId("result-console-brief-secondary").fill("人物居中，背景简洁");
  await page.getByTestId("result-console-generate-secondary").click();
  await expect(page.getByTestId("quick-structure-canvas-ready")).toBeVisible();
  await expect(page.getByTestId("quick-canvas-copy")).toBeVisible();
}

async function setAccountAgeAndCredits(page: import("@playwright/test").Page, daysAgo: number, credits: number) {
  await page.evaluate(({ daysAgo, credits }) => {
    const raw = localStorage.getItem("scenepilot_mock_account_store_v1");
    if (!raw) return;
    const store = JSON.parse(raw);
    const userId = store.session?.userId;
    if (!userId || !store.users?.[userId]) return;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    store.users[userId] = {
      ...store.users[userId],
      createdAt,
      creditsBalance: credits,
      updatedAt: new Date().toISOString()
    };
    store.wallets[userId] = {
      ...(store.wallets[userId] ?? { currency: "credits" }),
      creditsBalance: credits,
      currency: "credits"
    };
    localStorage.setItem("scenepilot_mock_account_store_v1", JSON.stringify(store));
  }, { daysAgo, credits });
}

async function getCurrentCredits(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("scenepilot_mock_account_store_v1");
    if (!raw) return 0;
    const store = JSON.parse(raw);
    const userId = store.session?.userId;
    if (!userId) return 0;
    return Number(store.wallets?.[userId]?.creditsBalance ?? 0);
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => undefined
      }
    });
  });
  await openQuickWorkspace(page);
});

test("prompt export is free during first 7 days", async ({ page }) => {
  await signIn(page, `trial-export-${Date.now()}@example.com`);
  await openQuickWorkspace(page);
  await ensureQuickCanvasReady(page);

  await page.getByTestId("quick-canvas-copy").click();
  await expect(page.getByTestId("quick-canvas-copy")).toContainText(/已复制|Copied/i);
  await expect(await getCurrentCredits(page)).toBe(0);
});

test("prompt export after trial blocks when credits are insufficient", async ({ page }) => {
  await signIn(page, `expired-export-zero-${Date.now()}@example.com`);
  await setAccountAgeAndCredits(page, 10, 0);
  await openQuickWorkspace(page);
  await ensureQuickCanvasReady(page);

  await page.getByTestId("quick-canvas-copy").click();
  await expect(page.getByTestId("insufficient-credits-modal")).toBeVisible();
  await expect(page.getByTestId("billing-credits-page")).toBeVisible();
  await expect(await getCurrentCredits(page)).toBe(0);
});

test("prompt export after trial deducts 2 credits", async ({ page }) => {
  await signIn(page, `expired-export-paid-${Date.now()}@example.com`);
  await setAccountAgeAndCredits(page, 10, 5);
  await openQuickWorkspace(page);
  await ensureQuickCanvasReady(page);

  await page.getByTestId("quick-canvas-copy").click();
  await expect(page.getByTestId("quick-canvas-copy")).toContainText(/已复制|Copied/i);
  await expect(await getCurrentCredits(page)).toBe(3);
});
