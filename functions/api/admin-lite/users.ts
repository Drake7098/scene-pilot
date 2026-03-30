import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireAdminApi } from "../_shared/admin-auth";
import { supabaseAdminRequest } from "../_shared/supabase-admin";

type ProfileRow = {
  id: string;
  email: string;
  pro_status: string;
  credits_balance: number;
  created_at: string;
  updated_at: string;
};

function agoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function safeGetRows<T>(env: any, path: string): Promise<T[]> {
  const res = await supabaseAdminRequest<T[]>(env, path);
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data;
}

function normalizeFilter(raw: string) {
  const value = raw.trim();
  if (value === "pro" || value === "non_pro" || value === "credits_gt_0" || value === "new_7d") return value;
  return "all";
}

export const onRequestGet: PagesFunction = async (context) => {
  const originErr = rejectDisallowedOrigin(context.request, context.env);
  if (originErr) return originErr;

  const admin = await requireAdminApi(context);
  if (admin.error) return admin.error;

  const url = new URL(context.request.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const filter = normalizeFilter(String(url.searchParams.get("filter") || "all"));
  const page = Math.max(1, Math.round(Number(url.searchParams.get("page") || "1")));
  const pageSize = Math.max(1, Math.min(100, Math.round(Number(url.searchParams.get("pageSize") || "20"))));

  const clauses: string[] = [];
  if (filter === "pro") clauses.push("pro_status=eq.active");
  if (filter === "non_pro") clauses.push("pro_status=neq.active");
  if (filter === "credits_gt_0") clauses.push("credits_balance=gt.0");
  if (filter === "new_7d") clauses.push(`created_at=gte.${encodeURIComponent(agoIso(24 * 7))}`);
  if (q) {
    const esc = encodeURIComponent(`%${q}%`);
    clauses.push(`or=(email.ilike.${esc},id.ilike.${esc})`);
  }
  const where = clauses.length ? `&${clauses.join("&")}` : "";
  const rows = await safeGetRows<ProfileRow>(
    context.env,
    `/rest/v1/profiles?select=id,email,pro_status,credits_balance,created_at,updated_at&order=created_at.desc&limit=5000${where}`
  );

  const [loginRows, purchaseRows] = await Promise.all([
    safeGetRows<{ user_id: string; created_at: string }>(
      context.env,
      "/rest/v1/audit_logs?select=user_id,created_at&action=eq.login_success&order=created_at.desc&limit=50000"
    ),
    safeGetRows<{ user_id: string }>(context.env, "/rest/v1/template_purchases?select=user_id&limit=50000"),
  ]);

  const lastLoginByUser = new Map<string, string>();
  for (const row of loginRows) {
    const id = String(row.user_id || "");
    if (!id || lastLoginByUser.has(id)) continue;
    lastLoginByUser.set(id, String(row.created_at || ""));
  }

  const purchaseCountByUser = new Map<string, number>();
  for (const row of purchaseRows) {
    const id = String(row.user_id || "");
    if (!id) continue;
    purchaseCountByUser.set(id, Number(purchaseCountByUser.get(id) || 0) + 1);
  }

  const total = rows.length;
  const from = (page - 1) * pageSize;
  const paged = rows.slice(from, from + pageSize);
  const items = paged.map((row) => ({
    id: row.id,
    email: row.email || "",
    pro_status: row.pro_status || "inactive",
    credits_balance: Number(row.credits_balance || 0),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    last_login_at: lastLoginByUser.get(row.id) || null,
    template_purchase_count: Number(purchaseCountByUser.get(row.id) || 0),
  }));

  return json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    from: total ? from + 1 : 0,
    to: Math.min(total, from + pageSize),
  }, 200, context.request, context.env);
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);

