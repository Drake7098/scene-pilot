import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as { userId?: string };
    if (!body.userId) return json({ error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;
    if (!context.env?.DB) return json({ error: "db_not_configured" }, 500, context.request, context.env);
    await ensureBillingTables(context.env.DB);

    const subscription = await context.env.DB.prepare(`
      SELECT provider_subscription_id FROM subscriptions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(body.userId).first<{ provider_subscription_id: string | null }>();

    return json({
      url: `${new URL(context.request.url).origin}/billing/manage?user=${encodeURIComponent(body.userId)}${subscription?.provider_subscription_id ? `&subscription=${encodeURIComponent(subscription.provider_subscription_id)}` : ""}`
    }, 200, context.request, context.env);
  } catch {
    return json({ error: "customer_portal_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return corsOptions("POST, OPTIONS", context.request, context.env);
};
