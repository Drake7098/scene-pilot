import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireAdminApi } from "../_shared/admin-auth";
import { supabaseAdminRequest } from "../_shared/supabase-admin";

function agoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function parseMeta(value: unknown) {
  if (!value) return {} as Record<string, unknown>;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
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

  const url = new URL(context.request.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const action = String(url.searchParams.get("action") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim();
  const userId = String(url.searchParams.get("userId") || "").trim();
  const range = String(url.searchParams.get("range") || "7d").trim();
  const limit = Math.max(1, Math.min(300, Math.round(Number(url.searchParams.get("limit") || "100"))));

  const clauses: string[] = [];
  if (action) clauses.push(`action=eq.${encodeURIComponent(action)}`);
  if (status) clauses.push(`status=eq.${encodeURIComponent(status)}`);
  if (userId) clauses.push(`user_id=eq.${encodeURIComponent(userId)}`);
  const hours = range === "30d" ? 24 * 30 : range === "7d" ? 24 * 7 : 24;
  clauses.push(`created_at=gte.${encodeURIComponent(agoIso(hours))}`);
  const where = clauses.length ? `&${clauses.join("&")}` : "";

  const rows = await safeGetRows<Record<string, unknown>>(
    context.env,
    `/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}${where}`
  );

  const items = q
    ? rows.filter((row) => {
        const rowAction = String(row.action || "").toLowerCase();
        const rowStatus = String(row.status || "").toLowerCase();
        const rowUserId = String(row.user_id || "").toLowerCase();
        const rowMeta = JSON.stringify(parseMeta(row.meta)).toLowerCase();
        return rowAction.includes(q) || rowStatus.includes(q) || rowUserId.includes(q) || rowMeta.includes(q);
      })
    : rows;

  return json({ items, total: items.length, range }, 200, context.request, context.env);
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);

