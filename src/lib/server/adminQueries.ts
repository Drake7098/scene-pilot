import { type AdminRuntimeEnv, supabaseAdminRequest } from "./supabaseAdmin";

export type AdminErrorLog = {
  id: string;
  action: string;
  status: string;
  userId: string | null;
  createdAt: string;
  meta: Record<string, unknown>;
};

export type AdminDashboardStats = {
  totalUsers: number;
  activeProUsers: number;
  todaySignups: number;
  todayLoginSuccess: number;
  todayTemplatePurchases: number;
  todayCreditSpend: number;
  recentErrors: AdminErrorLog[];
};

export type AdminUserListItem = {
  id: string;
  email: string;
  pro_status: string;
  credits_balance: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  template_purchase_count: number;
};

export type AdminUserDetail = {
  profile: Record<string, unknown> | null;
  recentLedger: Record<string, unknown>[];
  recentTemplatePurchases: Record<string, unknown>[];
  recentBillingEvents: Record<string, unknown>[];
  recentAuditLogs: Record<string, unknown>[];
  loginSummary: {
    successCount: number;
    failedCount: number;
    lastLoginAt: string | null;
  };
};

export type LogsQuery = {
  q?: string;
  action?: string;
  status?: string;
  userId?: string;
  range?: "24h" | "7d" | "30d";
  limit?: number;
};

function dayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function agoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function parseJsonMeta(value: unknown) {
  if (!value) return {} as Record<string, unknown>;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function parseContentRangeTotal(headers?: Headers) {
  const raw = headers?.get("content-range") || "";
  const idx = raw.lastIndexOf("/");
  if (idx < 0) return 0;
  const total = Number(raw.slice(idx + 1));
  return Number.isFinite(total) ? total : 0;
}

async function countRows(runtime: AdminRuntimeEnv, tablePath: string) {
  const res = await supabaseAdminRequest<null>(runtime, tablePath, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!res.ok) return 0;
  return parseContentRangeTotal(res.headers);
}

async function selectRows<T>(runtime: AdminRuntimeEnv, path: string) {
  const res = await supabaseAdminRequest<T[]>(runtime, path);
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data;
}

export async function getAdminDashboardStats(runtime: AdminRuntimeEnv): Promise<AdminDashboardStats> {
  const today = dayStartIso();
  const [
    totalUsers,
    activeProUsers,
    todaySignups,
    todayLoginSuccess,
    todayTemplatePurchases,
    spendRows,
    errorRows,
  ] = await Promise.all([
    countRows(runtime, "/rest/v1/profiles?select=id"),
    countRows(runtime, "/rest/v1/profiles?select=id&pro_status=eq.active"),
    countRows(runtime, `/rest/v1/profiles?select=id&created_at=gte.${encodeURIComponent(today)}`),
    countRows(runtime, `/rest/v1/audit_logs?select=id&action=eq.login_success&created_at=gte.${encodeURIComponent(today)}`),
    countRows(runtime, `/rest/v1/template_purchases?select=id&created_at=gte.${encodeURIComponent(today)}`),
    selectRows<{ amount: number }>(
      runtime,
      `/rest/v1/credit_ledger?select=amount&created_at=gte.${encodeURIComponent(today)}&event_type=eq.credit_spend&limit=5000`
    ),
    selectRows<{ id: string; action: string; status: string; user_id: string | null; created_at: string; meta: unknown }>(
      runtime,
      "/rest/v1/audit_logs?select=id,action,status,user_id,created_at,meta&status=eq.failed&order=created_at.desc&limit=20"
    ),
  ]);

  const todayCreditSpend = spendRows.reduce((sum, row) => {
    const n = Number(row.amount || 0);
    return n < 0 ? sum + Math.abs(n) : sum;
  }, 0);

  const recentErrors: AdminErrorLog[] = errorRows.map((row) => ({
    id: String(row.id || ""),
    action: String(row.action || ""),
    status: String(row.status || ""),
    userId: row.user_id ? String(row.user_id) : null,
    createdAt: String(row.created_at || ""),
    meta: parseJsonMeta(row.meta),
  }));

  return {
    totalUsers,
    activeProUsers,
    todaySignups,
    todayLoginSuccess,
    todayTemplatePurchases,
    todayCreditSpend,
    recentErrors,
  };
}

export async function searchUsers(
  runtime: AdminRuntimeEnv,
  params: {
    q?: string;
    filter?: "all" | "pro" | "non_pro" | "credits_gt_0" | "new_7d";
    page?: number;
    pageSize?: number;
  }
) {
  const q = String(params.q || "").trim().toLowerCase();
  const filter = params.filter || "all";
  const page = Math.max(1, Math.round(Number(params.page || 1)));
  const pageSize = Math.max(1, Math.min(100, Math.round(Number(params.pageSize || 20))));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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
  const listPath = `/rest/v1/profiles?select=id,email,pro_status,credits_balance,created_at,updated_at&order=created_at.desc&offset=${from}&limit=${pageSize}${where}`;
  const countPath = `/rest/v1/profiles?select=id${where}`;

  const [rows, total, loginRows, purchaseRows] = await Promise.all([
    selectRows<Record<string, unknown>>(runtime, listPath),
    countRows(runtime, countPath),
    selectRows<{ user_id: string; created_at: string }>(runtime, "/rest/v1/audit_logs?select=user_id,created_at&action=eq.login_success&order=created_at.desc&limit=5000"),
    selectRows<{ user_id: string }>(runtime, "/rest/v1/template_purchases?select=user_id&limit=5000"),
  ]);

  const lastLoginByUser = new Map<string, string>();
  for (const row of loginRows) {
    const userId = String(row.user_id || "");
    if (!userId || lastLoginByUser.has(userId)) continue;
    lastLoginByUser.set(userId, String(row.created_at || ""));
  }

  const purchaseCountByUser = new Map<string, number>();
  for (const row of purchaseRows) {
    const userId = String(row.user_id || "");
    if (!userId) continue;
    purchaseCountByUser.set(userId, Number(purchaseCountByUser.get(userId) || 0) + 1);
  }

  const items: AdminUserListItem[] = rows.map((row) => {
    const id = String(row.id || "");
    return {
      id,
      email: String(row.email || ""),
      pro_status: String(row.pro_status || "inactive"),
      credits_balance: Number(row.credits_balance || 0),
      created_at: String(row.created_at || ""),
      updated_at: String(row.updated_at || ""),
      last_login_at: lastLoginByUser.get(id) || null,
      template_purchase_count: Number(purchaseCountByUser.get(id) || 0),
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    from: total ? from + 1 : 0,
    to: Math.min(total, to + 1),
  };
}

export async function getUserAdminDetail(runtime: AdminRuntimeEnv, userId: string): Promise<AdminUserDetail> {
  const id = String(userId || "").trim();
  if (!id) {
    return {
      profile: null,
      recentLedger: [],
      recentTemplatePurchases: [],
      recentBillingEvents: [],
      recentAuditLogs: [],
      loginSummary: { successCount: 0, failedCount: 0, lastLoginAt: null },
    };
  }

  const [profileRows, ledger, purchases, logs] = await Promise.all([
    selectRows<Record<string, unknown>>(runtime, `/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=* &limit=1`.replace("* ", "*")),
    selectRows<Record<string, unknown>>(runtime, `/rest/v1/credit_ledger?user_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=20`),
    selectRows<Record<string, unknown>>(runtime, `/rest/v1/template_purchases?user_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=20`),
    selectRows<Record<string, unknown>>(runtime, `/rest/v1/audit_logs?user_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=20`),
  ]);

  const profile = profileRows[0] || null;
  const email = profile ? String((profile as Record<string, unknown>).email || "").trim().toLowerCase() : "";

  const billingEvents = email
    ? await selectRows<Record<string, unknown>>(
        runtime,
        `/rest/v1/billing_events?or=(user_email.eq.${encodeURIComponent(email)},user_external_id.eq.${encodeURIComponent(id)})&select=*&order=created_at.desc&limit=20`
      )
    : await selectRows<Record<string, unknown>>(
        runtime,
        `/rest/v1/billing_events?user_external_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=20`
      );

  const [loginSuccessRows, loginFailedRows] = await Promise.all([
    selectRows<{ created_at: string }>(
      runtime,
      `/rest/v1/audit_logs?user_id=eq.${encodeURIComponent(id)}&action=eq.login_success&select=created_at&order=created_at.desc&limit=500`
    ),
    selectRows<{ created_at: string }>(
      runtime,
      `/rest/v1/audit_logs?user_id=eq.${encodeURIComponent(id)}&action=eq.login_failed&select=created_at&order=created_at.desc&limit=500`
    ),
  ]);

  return {
    profile,
    recentLedger: ledger,
    recentTemplatePurchases: purchases,
    recentBillingEvents: billingEvents,
    recentAuditLogs: logs,
    loginSummary: {
      successCount: loginSuccessRows.length,
      failedCount: loginFailedRows.length,
      lastLoginAt: loginSuccessRows[0]?.created_at || null,
    },
  };
}

export async function getRecentLogs(runtime: AdminRuntimeEnv, params: LogsQuery) {
  const limit = Math.max(1, Math.min(300, Math.round(Number(params.limit || 100))));
  const clauses: string[] = [];

  if (params.action) clauses.push(`action=eq.${encodeURIComponent(params.action)}`);
  if (params.status) clauses.push(`status=eq.${encodeURIComponent(params.status)}`);
  if (params.userId) clauses.push(`user_id=eq.${encodeURIComponent(params.userId)}`);

  const range = params.range || "24h";
  const hours = range === "7d" ? 24 * 7 : range === "30d" ? 24 * 30 : 24;
  clauses.push(`created_at=gte.${encodeURIComponent(agoIso(hours))}`);

  const where = clauses.length ? `&${clauses.join("&")}` : "";
  const rows = await selectRows<Record<string, unknown>>(
    runtime,
    `/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}${where}`
  );

  const q = String(params.q || "").trim().toLowerCase();
  const filtered = q
    ? rows.filter((row) => {
        const action = String(row.action || "").toLowerCase();
        const status = String(row.status || "").toLowerCase();
        const userId = String(row.user_id || "").toLowerCase();
        const meta = JSON.stringify(parseJsonMeta(row.meta)).toLowerCase();
        return action.includes(q) || status.includes(q) || userId.includes(q) || meta.includes(q);
      })
    : rows;

  return {
    items: filtered,
    total: filtered.length,
    range,
  };
}
