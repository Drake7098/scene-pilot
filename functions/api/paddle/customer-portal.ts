import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";
import { isBillingEnabled, isLiveBillingBlocked } from "../_shared/billing-feature";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!isBillingEnabled(context.env)) {
      return json({ error: "billing_disabled" }, 503, context.request, context.env);
    }
    if (isLiveBillingBlocked(context.env)) {
      return json({ error: "billing_live_blocked" }, 503, context.request, context.env);
    }
    const body = await context.request.json() as { userId?: string };
    if (!body.userId) return json({ error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;

    if (hasSupabaseAdmin(context.env)) {
      const subRes = await supabaseAdminRequest<Array<{ provider_subscription_id: string | null }>>(
        context.env,
        `/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(body.userId)}&select=provider_subscription_id&order=updated_at.desc&limit=1`
      );
      if (!subRes.ok) {
        return json({ error: subRes.errorCode || "subscription_lookup_failed" }, 500, context.request, context.env);
      }
      const subscriptionId = Array.isArray(subRes.data) ? (subRes.data[0]?.provider_subscription_id || "") : "";
      return json({
        url: `${new URL(context.request.url).origin}/billing/manage?user=${encodeURIComponent(body.userId)}${subscriptionId ? `&subscription=${encodeURIComponent(subscriptionId)}` : ""}`
      }, 200, context.request, context.env);
    }

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
