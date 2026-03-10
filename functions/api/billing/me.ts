import { ensureBillingTables, ensureUserWallet, seedDefaultProducts } from "../_shared/billing-db";
import { corsOptions, json } from "../_shared/http";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const userId = new URL(context.request.url).searchParams.get("userId") || "";
    if (!userId) {
      return json({
        tier: "free",
        credits: 0,
        subscription: { status: "inactive", planId: "" },
        packs: [],
        note: "missing_user_id"
      }, 400);
    }

    if (!context.env?.DB) {
      return json({
        tier: "free",
        credits: 0,
        subscription: { status: "inactive", planId: "" },
        packs: [],
        note: "DB not configured"
      });
    }

    await ensureBillingTables(context.env.DB);
    await seedDefaultProducts(context.env.DB);
    await ensureUserWallet(context.env.DB, userId);

    const user = await context.env.DB.prepare(`
      SELECT id, tier FROM users_profile WHERE id = ? LIMIT 1
    `).bind(userId).first<{ id: string; tier: string }>();
    const wallet = await context.env.DB.prepare(`
      SELECT credit_balance FROM wallets WHERE user_id = ? LIMIT 1
    `).bind(userId).first<{ credit_balance: number }>();
    const subscription = await context.env.DB.prepare(`
      SELECT plan_code, status, current_period_start, current_period_end
      FROM subscriptions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(userId).first<{
      plan_code: string;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
    }>();
    const { results: packs } = await context.env.DB.prepare(`
      SELECT code, name, price_amount, currency, credits_amount
      FROM products
      WHERE kind = 'credit_pack' AND active = 1
      ORDER BY price_amount ASC
    `).all();

    return json({
      tier: user?.tier || "free",
      credits: wallet?.credit_balance || 0,
      subscription: {
        status: subscription?.status || "inactive",
        planId: subscription?.plan_code || "",
        periodStart: subscription?.current_period_start || null,
        periodEnd: subscription?.current_period_end || null
      },
      packs
    });
  } catch (error) {
    return json({
      error: "billing_me_error",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => corsOptions("GET, OPTIONS");
