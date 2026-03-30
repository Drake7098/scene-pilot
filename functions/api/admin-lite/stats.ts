import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireAdminApi } from "../_shared/admin-auth";
import { supabaseAdminRequest } from "../_shared/supabase-admin";

function dayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function parseMeta(value: unknown) {
  if (!value) return {} as Record<string, unknown>;
  if (typeof value === "object") return value as Record<string, unknown>;
  try { return JSON.parse(String(value)) as Record<string, unknown>; } catch { return {}; }
}

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

  const today = dayStartIso();

  const [users, activePros, todayUsers, todayLogins, todayPurchases, spendRows, recentErrors] = await Promise.all([
    safeGetRows<{ id: string }>(context.env, "/rest/v1/profiles?select=id&limit=50000"),
    safeGetRows<{ id: string }>(context.env, "/rest/v1/profiles?select=id&pro_status=eq.active&limit=50000"),
    safeGetRows<{ id: string }>(context.env, `/rest/v1/profiles?select=id&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    safeGetRows<{ id: string }>(context.env, `/rest/v1/audit_logs?select=id&action=eq.login_success&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    safeGetRows<{ id: string }>(context.env, `/rest/v1/template_purchases?select=id&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    safeGetRows<{ amount: number }>(context.env, `/rest/v1/credit_ledger?select=amount&event_type=eq.credit_spend&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    safeGetRows<{ id: string; action: string; status: string; user_id: string | null; created_at: string; meta: unknown }>(
      context.env,
      "/rest/v1/audit_logs?select=id,action,status,user_id,created_at,meta&status=eq.failed&order=created_at.desc&limit=20"
    ),
  ]);

  const todayCreditSpend = spendRows.reduce((sum, row) => {
    const n = Number(row.amount || 0);
    return n < 0 ? sum + Math.abs(n) : sum;
  }, 0);

  return json({
    totalUsers: users.length,
    activeProUsers: activePros.length,
    todaySignups: todayUsers.length,
    todayLoginSuccess: todayLogins.length,
    todayTemplatePurchases: todayPurchases.length,
    todayCreditSpend,
    recentErrors: recentErrors.map((row) => ({
      id: row.id,
      action: row.action,
      status: row.status,
      userId: row.user_id,
      createdAt: row.created_at,
      meta: parseMeta(row.meta),
    })),
  }, 200, context.request, context.env);
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);
