import { expect, test } from "@playwright/test";

test("user management page shows sign-in state for guests", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("scenepilot_mock_account_store_v1");
  });
  await page.goto("/account");
  await expect(page.getByTestId("user-management-page")).toBeVisible();
  await expect(page.getByTestId("user-management-empty")).toBeVisible();
  await expect(page.getByTestId("user-management-sign-in")).toBeVisible();
});

test("user management page shows account details and can sign out", async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const userId = "user_test_account";
    const store = {
      users: {
        [userId]: {
          id: userId,
          email: "manager@example.com",
          displayName: "Manager",
          avatarUrl: null,
          tier: "pro",
          creditsBalance: 320,
          proConsoleEnabled: true,
          bringYourOwnApiEnabled: true,
          createdAt: now,
          updatedAt: now
        }
      },
      wallets: {
        [userId]: { creditsBalance: 320, currency: "credits" }
      },
      ledgers: {
        [userId]: [
          {
            id: "ledger_1",
            userId,
            kind: "purchase",
            credits: 100,
            status: "done",
            relatedAction: "purchase",
            createdAt: now
          }
        ]
      },
      apiCredentials: {
        [userId]: {
          defaultProvider: "fal",
          fal: {
            enabled: true,
            mode: "platform",
            apiKey: "",
            baseUrl: "https://queue.fal.run",
            preferredModel: "fal-ai/flux/dev",
            updatedAt: now
          },
          runway: {
            enabled: true,
            mode: "platform",
            apiKey: "",
            baseUrl: "https://api.dev.runwayml.com",
            preferredModel: "gen4_turbo",
            updatedAt: now
          },
          updatedAt: now
        }
      },
      subscriptions: {
        [userId]: {
          userId,
          planId: "pro_monthly",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: now,
          lastCreditGrantAt: now,
          provider: "mock",
          customerPortalUrl: "/mock/paddle/customer-portal"
        }
      },
      challenges: {},
      session: {
        token: "session_test_account",
        userId,
        email: "manager@example.com",
        provider: "password",
        providerSubject: null,
        createdAt: now
      }
    };
    localStorage.setItem("scenepilot_mock_account_store_v1", JSON.stringify(store));
  });

  await page.goto("/account");
  await expect(page.getByTestId("user-management-profile")).toBeVisible();
  await expect(page.getByTestId("user-management-tier")).toContainText("Pro");
  await expect(page.getByTestId("user-management-credits-balance")).toContainText("320");
  await expect(page.getByTestId("user-management-ledger")).toBeVisible();

  await page.getByTestId("user-management-logout").click();
  await expect(page.getByTestId("user-management-empty")).toBeVisible();
});
