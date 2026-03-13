import { ensureBillingTables, ensureUserWallet, seedDefaultProducts } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";

type SupabaseProfile = { id: string; tier: string };
type SupabaseWallet = { credit_balance: number };
type SupabaseSubscription = {
  plan_code: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
};
type SupabasePack = {
  code: string;
  name: string;
  price_amount: number;
  currency: string;
  credits_amount: number | null;
};

function firstRow<T>(value: T[] | null | undefined) {
  if (!Array.isArray(value)) return null;
  return value[0] ?? null;
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const userId = new URL(context.request.url).searchParams.get("userId") || "";
    const authErr = await requireApiAuth(context, { claimedUserId: userId || undefined });
    if (authErr) return authErr;
    if (!userId) {
      return json({
        tier: "free",
        credits: 0,
        subscription: { status: "inactive", planId: "" },
        packs: [],
        note: "missing_user_id"
      }, 400, context.request, context.env);
    }

    if (hasSupabaseAdmin(context.env)) {
      const encodedUserId = encodeURIComponent(userId);
      const [profileRes, walletRes, subscriptionRes, packsRes] = await Promise.all([
        supabaseAdminRequest<SupabaseProfile[]>(
          context.env,
          `/rest/v1/users_profile?id=eq.${encodedUserId}&select=id,tier&limit=1`
        ),
        supabaseAdminRequest<SupabaseWallet[]>(
          context.env,
          `/rest/v1/wallets?user_id=eq.${encodedUserId}&select=credit_balance&limit=1`
        ),
        supabaseAdminRequest<SupabaseSubscription[]>(
          context.env,
          `/rest/v1/subscriptions?user_id=eq.${encodedUserId}&select=plan_code,status,current_period_start,current_period_end&order=updated_at.desc&limit=1`
        ),
        supabaseAdminRequest<SupabasePack[]>(
          context.env,
          "/rest/v1/products?kind=eq.credit_pack&active=is.true&select=code,name,price_amount,currency,credits_amount&order=price_amount.asc"
        )
      ]);

      if (!profileRes.ok && profileRes.errorCode !== "pgrst116") {
        return json({
          error: "billing_me_error",
          message: profileRes.errorMessage || profileRes.errorCode
        }, 500, context.request, context.env);
      }
      if (!walletRes.ok && walletRes.errorCode !== "pgrst116") {
        return json({
          error: "billing_me_error",
          message: walletRes.errorMessage || walletRes.errorCode
        }, 500, context.request, context.env);
      }
      if (!subscriptionRes.ok && subscriptionRes.errorCode !== "pgrst116") {
        return json({
          error: "billing_me_error",
          message: subscriptionRes.errorMessage || subscriptionRes.errorCode
        }, 500, context.request, context.env);
      }
      if (!packsRes.ok) {
        return json({
          error: "billing_me_error",
          message: packsRes.errorMessage || packsRes.errorCode
        }, 500, context.request, context.env);
      }

      const profile = firstRow(profileRes.data);
      const wallet = firstRow(walletRes.data);
      const subscription = firstRow(subscriptionRes.data);
      const packs = Array.isArray(packsRes.data) ? packsRes.data : [];

      return json({
        tier: profile?.tier || "free",
        credits: Number(wallet?.credit_balance || 0),
        subscription: {
          status: subscription?.status || "inactive",
          planId: subscription?.plan_code || "",
          periodStart: subscription?.current_period_start || null,
          periodEnd: subscription?.current_period_end || null
        },
        packs
      }, 200, context.request, context.env);
    }

    if (!context.env?.DB) {
      return json({
        tier: "free",
        credits: 0,
        subscription: { status: "inactive", planId: "" },
        packs: [],
        note: "DB not configured"
      }, 200, context.request, context.env);
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
    }, 200, context.request, context.env);
  } catch (error) {
    return json({
      error: "billing_me_error",
      message: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("GET, OPTIONS", context.request, context.env);
