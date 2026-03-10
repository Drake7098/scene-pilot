import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json } from "../_shared/http";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as { userId?: string };
    if (!body.userId) return json({ error: "missing_user_id" }, 400);
    if (!context.env?.DB) return json({ error: "db_not_configured" }, 500);
    await ensureBillingTables(context.env.DB);

    const subscription = await context.env.DB.prepare(`
      SELECT provider_subscription_id FROM subscriptions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(body.userId).first<{ provider_subscription_id: string | null }>();

    return json({
      url: `${new URL(context.request.url).origin}/billing/manage?user=${encodeURIComponent(body.userId)}${subscription?.provider_subscription_id ? `&subscription=${encodeURIComponent(subscription.provider_subscription_id)}` : ""}`
    });
  } catch {
    return json({ error: "customer_portal_error" }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return corsOptions("POST, OPTIONS");
};
