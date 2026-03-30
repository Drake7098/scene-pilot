import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireAdminApi } from "../_shared/admin-auth";
import { supabaseAdminRequest } from "../_shared/supabase-admin";

async function safeGetRows<T>(env: any, path: string): Promise<T[]> {
  const res = await supabaseAdminRequest<T[]>(env, path);
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data;
}

export const onRequestGet: PagesFunction = async (context) => {
  const originErr = rejectDisallowedOrigin(context.request, context.env);
  if (originErr) return originErr;

  const admin = await requireAdminApi(context);
  if (admin.error) return admin.error;

  const url = new URL(context.request.url);
  const userId = String(url.searchParams.get("userId") || "").trim();
  if (!userId) {
    return json({ error: "missing_user_id" }, 400, context.request, context.env);
  }

  const encodedUserId = encodeURIComponent(userId);
  const [profileRows, recentLedger, recentTemplatePurchases, recentAuditLogs, loginSuccessRows, loginFailedRows] =
    await Promise.all([
      safeGetRows<Record<string, unknown>>(context.env, `/rest/v1/profiles?select=*&id=eq.${encodedUserId}&limit=1`),
      safeGetRows<Record<string, unknown>>(context.env, `/rest/v1/credit_ledger?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
      safeGetRows<Record<string, unknown>>(context.env, `/rest/v1/template_purchases?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
      safeGetRows<Record<string, unknown>>(context.env, `/rest/v1/audit_logs?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
      safeGetRows<{ created_at: string }>(
        context.env,
        `/rest/v1/audit_logs?select=created_at&user_id=eq.${encodedUserId}&action=eq.login_success&order=created_at.desc&limit=500`
      ),
      safeGetRows<{ created_at: string }>(
        context.env,
        `/rest/v1/audit_logs?select=created_at&user_id=eq.${encodedUserId}&action=eq.login_failed&order=created_at.desc&limit=500`
      ),
    ]);

  const profile = profileRows[0] || null;
  const email = profile ? String(profile.email || "").trim().toLowerCase() : "";
  const recentBillingEvents = email
    ? await safeGetRows<Record<string, unknown>>(
        context.env,
        `/rest/v1/billing_events?select=*&or=(user_email.eq.${encodeURIComponent(email)},user_external_id.eq.${encodedUserId})&order=created_at.desc&limit=20`
      )
    : await safeGetRows<Record<string, unknown>>(
        context.env,
        `/rest/v1/billing_events?select=*&user_external_id=eq.${encodedUserId}&order=created_at.desc&limit=20`
      );

  return json({
    profile,
    recentLedger,
    recentTemplatePurchases,
    recentBillingEvents,
    recentAuditLogs,
    loginSummary: {
      successCount: loginSuccessRows.length,
      failedCount: loginFailedRows.length,
      lastLoginAt: loginSuccessRows[0]?.created_at || null,
    },
  }, 200, context.request, context.env);
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);

