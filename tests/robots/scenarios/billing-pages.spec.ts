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
  await page.mouse.click(10, 10);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.Paddle = {
      Environment: { set: () => undefined },
      Initialize: () => undefined,
      Checkout: {
        open: (payload: Record<string, unknown>) => {
          window.__SCENEPILOT_LAST_PADDLE_CHECKOUT__ = payload;
        }
      }
    };
  });
  await page.goto("/");
});

test("upgrade_page_and_credits_page_open_from_top_menu", async ({ page }) => {
  await openTopMenu(page);
  await page.getByTestId("top-help-item-upgrade").click();
  await expect(page.getByTestId("billing-upgrade-page")).toBeVisible();
  await expect(page.getByText("Upgrade your scene workflow")).toBeVisible();
  await expect(page.getByTestId("upgrade-card-free")).toContainText("No AI generation");
  await expect(page.getByTestId("upgrade-card-pro")).toContainText("$12");
  await expect(page.getByTestId("upgrade-credits-note")).toContainText("AI image and video generation uses credits.");

  await page.getByTestId("billing-tab-credits").click();
  await expect(page.getByTestId("billing-credits-page")).toBeVisible();
  await expect(page.getByTestId("credits-card-credit_100")).toContainText("100 credits");
  await expect(page.getByTestId("credits-card-credit_500")).toContainText("$12");
  await expect(page.getByTestId("credits-card-credit_2000")).toContainText("$40");
  await expect(page.getByText("Credits are non-refundable once used.")).toBeVisible();
});

test("upgrade_page_exposes_local_test_controls", async ({ page }) => {
  await openTopMenu(page);
  await page.getByTestId("top-help-item-upgrade").click();
  await expect(page.getByTestId("billing-local-test-card")).toBeVisible();
  await expect(page.getByTestId("billing-local-provider-select")).toBeVisible();
  await expect(page.getByTestId("billing-local-probe")).toBeVisible();
  await expect(page.getByTestId("billing-local-generate")).toBeVisible();

  await page.getByTestId("billing-local-provider-select").selectOption("drawthings");
  await page.getByTestId("billing-local-generate").click();
  await expect(page.getByTestId("billing-local-hint")).toContainText(/请先输入|Please enter/i);
});

test("upgrade_triggers_paddle_checkout", async ({ page }) => {
  const checkoutBodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/paddle/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    checkoutBodies.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "paddle",
        mock: false,
        kind: body.kind,
        productId: body.productId,
        items: [{ priceId: `price_${body.productId}`, quantity: 1 }],
        customer: body.userEmail ? { email: body.userEmail } : undefined,
        customData: {
          userId: body.userId,
          productId: body.productId,
          kind: body.kind
        }
      })
    });
  });

  await signIn(page, "paddle-user@example.com");
  await page.reload();

  await openTopMenu(page);
  await page.getByTestId("top-help-item-upgrade").click();
  await page.getByTestId("billing-legal-consent").check();
  await page.getByTestId("upgrade-pro-cta").click();
  await expect.poll(async () => {
    return String(checkoutBodies.at(-1)?.productId ?? "");
  }).toBe("pro_monthly");
});

test("credits_buy_triggers_paddle_checkout", async ({ page }) => {
  const checkoutBodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/paddle/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    checkoutBodies.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "paddle",
        mock: false,
        kind: body.kind,
        productId: body.productId,
        items: [{ priceId: `price_${body.productId}`, quantity: 1 }],
        customer: body.userEmail ? { email: body.userEmail } : undefined,
        customData: {
          userId: body.userId,
          productId: body.productId,
          kind: body.kind
        }
      })
    });
  });

  await signIn(page, "paddle-credit-user@example.com");
  await openTopMenu(page);
  await page.getByTestId("top-help-item-account").click();
  await page.getByRole("button", { name: /购买点数|Buy Credits/i }).click();
  const billingConsent = page.getByTestId("account-billing-legal-consent");
  if (!(await billingConsent.isChecked())) {
    await billingConsent.check();
  }
  await page.getByTestId("account-credit-pack-credit_500").click();
  await expect.poll(async () => {
    return String(checkoutBodies.at(-1)?.productId ?? "");
  }).toBe("credit_500");
});

test("free_generation_is_hidden_and_pro_without_credits_is_blocked", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "results");
  });
  await page.reload();

  await page.getByTestId("result-console-brief").fill("三个人站在酒吧里，中间是主角");
  await page.getByTestId("result-console-generate").click();
  await page.getByTestId("result-console-brief-secondary").fill("主角更大，背景干净");
  await page.getByTestId("result-console-generate-secondary").click();
  await expect(page.getByTestId("quick-canvas-upgrade")).toBeVisible();
  await expect(page.getByTestId("quick-canvas-generate")).toHaveCount(0);

  await signIn(page, "pro-zero@example.com");
  await page.evaluate(() => {
    const raw = localStorage.getItem("scenepilot_mock_account_store_v1");
    if (!raw) return;
    const store = JSON.parse(raw);
    const userId = store.session?.userId;
    if (!userId) return;
    store.users[userId] = {
      ...store.users[userId],
      tier: "pro",
      proConsoleEnabled: true,
      bringYourOwnApiEnabled: true,
      creditsBalance: 0
    };
    store.wallets[userId] = { creditsBalance: 0, currency: "credits" };
    store.subscriptions[userId] = {
      userId,
      planId: "pro_monthly",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      lastCreditGrantAt: new Date().toISOString(),
      provider: "mock",
      customerPortalUrl: "/mock/paddle/customer-portal"
    };
    localStorage.setItem("scenepilot_mock_account_store_v1", JSON.stringify(store));
  });
  await page.reload();
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "results");
  });
  await page.reload();

  await page.getByTestId("result-console-brief").fill("一个人站在雨夜街头");
  await page.getByTestId("result-console-generate").click();
  await page.getByTestId("result-console-brief-secondary").fill("人物居中，背景简洁");
  await page.getByTestId("result-console-generate-secondary").click();
  await expect(page.getByTestId("quick-canvas-generate")).toBeVisible();
  await page.getByTestId("quick-canvas-generate").click();
  await expect(page.getByTestId("insufficient-credits-modal")).toBeVisible();
  await expect(page.getByTestId("billing-credits-page")).toBeVisible();
});
