function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

function text(data, status = 200) {
  return new Response(String(data), {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

function parseAdminEmails(raw) {
  return new Set(
    String(raw || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function supabaseBaseUrl(env) {
  return String(env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
}

function supabaseServiceKey(env) {
  return String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || "").trim();
}

async function supabaseAdminRequest(env, path, init = {}) {
  const base = supabaseBaseUrl(env);
  const key = supabaseServiceKey(env);
  if (!base || !key) return { ok: false, status: 500, data: null, error: "supabase_not_configured" };
  try {
    const res = await fetch(`${base}${path}`, {
      method: init.method || "GET",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        ...(init.headers || {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: String(payload?.error || payload?.message || "supabase_error") };
    }
    return { ok: true, status: res.status, data: payload, error: "" };
  } catch (err) {
    return { ok: false, status: 500, data: null, error: String(err instanceof Error ? err.message : err) };
  }
}

function parseBearer(request) {
  const raw = String(request.headers.get("authorization") || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

async function verifyTokenUser(env, token) {
  const base = supabaseBaseUrl(env);
  const key = supabaseServiceKey(env);
  if (!base || !key || !token) return null;
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const user = await res.json().catch(() => null);
    if (!user?.id || !user?.email) return null;
    return { id: String(user.id), email: String(user.email).toLowerCase() };
  } catch {
    return null;
  }
}

async function requireAdmin(request, env) {
  const admins = parseAdminEmails(env.ADMIN_EMAILS);
  if (!admins.size) return { ok: false, response: json({ error: "admin_emails_not_configured" }, 500) };
  const token = parseBearer(request);
  if (!token) return { ok: false, response: json({ error: "missing_access_token" }, 401) };
  const user = await verifyTokenUser(env, token);
  if (!user) return { ok: false, response: json({ error: "invalid_access_token" }, 401) };
  if (!admins.has(user.email)) return { ok: false, response: json({ error: "admin_forbidden" }, 403) };
  return { ok: true, user };
}

async function inspectAdmin(request, env) {
  const admins = parseAdminEmails(env.ADMIN_EMAILS);
  const token = parseBearer(request);
  if (!admins.size) {
    return { ok: false, status: 500, error: "admin_emails_not_configured", email: "", isAdmin: false };
  }
  if (!token) {
    return { ok: false, status: 401, error: "missing_access_token", email: "", isAdmin: false };
  }
  const user = await verifyTokenUser(env, token);
  if (!user) {
    return { ok: false, status: 401, error: "invalid_access_token", email: "", isAdmin: false };
  }
  const isAdmin = admins.has(user.email);
  if (!isAdmin) {
    return { ok: false, status: 403, error: "admin_forbidden", email: user.email, isAdmin: false, userId: user.id };
  }
  return { ok: true, status: 200, error: "", email: user.email, userId: user.id, isAdmin: true };
}

function dayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function agoIso(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function asRows(value) {
  return Array.isArray(value) ? value : [];
}

async function handleAdminStats(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const today = dayStartIso();
  const [users, activePros, todayUsers, todayLogins, todayPurchases, spendRows, recentErrors] = await Promise.all([
    supabaseAdminRequest(env, "/rest/v1/profiles?select=id&limit=50000"),
    supabaseAdminRequest(env, "/rest/v1/profiles?select=id&pro_status=eq.active&limit=50000"),
    supabaseAdminRequest(env, `/rest/v1/profiles?select=id&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    supabaseAdminRequest(env, `/rest/v1/audit_logs?select=id&action=eq.login_success&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    supabaseAdminRequest(env, `/rest/v1/template_purchases?select=id&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    supabaseAdminRequest(env, `/rest/v1/credit_ledger?select=amount&event_type=eq.credit_spend&created_at=gte.${encodeURIComponent(today)}&limit=50000`),
    supabaseAdminRequest(env, "/rest/v1/audit_logs?select=id,action,status,user_id,created_at,meta&status=eq.failed&order=created_at.desc&limit=20"),
  ]);

  const spend = asRows(spendRows.data).reduce((sum, row) => {
    const n = Number(row?.amount || 0);
    return n < 0 ? sum + Math.abs(n) : sum;
  }, 0);

  return json({
    totalUsers: asRows(users.data).length,
    activeProUsers: asRows(activePros.data).length,
    todaySignups: asRows(todayUsers.data).length,
    todayLoginSuccess: asRows(todayLogins.data).length,
    todayTemplatePurchases: asRows(todayPurchases.data).length,
    todayCreditSpend: spend,
    recentErrors: asRows(recentErrors.data).map((row) => ({
      id: row.id,
      action: row.action,
      status: row.status,
      userId: row.user_id || null,
      createdAt: row.created_at,
      meta: row.meta && typeof row.meta === "object" ? row.meta : {},
    })),
  });
}

async function handleAdminUsers(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const filter = String(url.searchParams.get("filter") || "all").trim();
  const page = Math.max(1, Math.round(Number(url.searchParams.get("page") || "1")));
  const pageSize = Math.max(1, Math.min(100, Math.round(Number(url.searchParams.get("pageSize") || "20"))));

  const clauses = [];
  if (filter === "pro") clauses.push("pro_status=eq.active");
  if (filter === "non_pro") clauses.push("pro_status=neq.active");
  if (filter === "credits_gt_0") clauses.push("credits_balance=gt.0");
  if (filter === "new_7d") clauses.push(`created_at=gte.${encodeURIComponent(agoIso(24 * 7))}`);
  if (q) {
    const esc = encodeURIComponent(`%${q}%`);
    clauses.push(`or=(email.ilike.${esc},id.ilike.${esc})`);
  }
  const where = clauses.length ? `&${clauses.join("&")}` : "";

  const [profilesRes, loginRowsRes, purchaseRowsRes] = await Promise.all([
    supabaseAdminRequest(env, `/rest/v1/profiles?select=id,email,pro_status,credits_balance,created_at,updated_at&order=created_at.desc&limit=5000${where}`),
    supabaseAdminRequest(env, "/rest/v1/audit_logs?select=user_id,created_at&action=eq.login_success&order=created_at.desc&limit=50000"),
    supabaseAdminRequest(env, "/rest/v1/template_purchases?select=user_id&limit=50000"),
  ]);

  const profiles = asRows(profilesRes.data);
  const loginRows = asRows(loginRowsRes.data);
  const purchaseRows = asRows(purchaseRowsRes.data);

  const lastLoginByUser = new Map();
  for (const row of loginRows) {
    const userId = String(row?.user_id || "");
    if (!userId || lastLoginByUser.has(userId)) continue;
    lastLoginByUser.set(userId, String(row?.created_at || ""));
  }

  const purchaseCountByUser = new Map();
  for (const row of purchaseRows) {
    const userId = String(row?.user_id || "");
    if (!userId) continue;
    purchaseCountByUser.set(userId, Number(purchaseCountByUser.get(userId) || 0) + 1);
  }

  const total = profiles.length;
  const from = (page - 1) * pageSize;
  const items = profiles.slice(from, from + pageSize).map((row) => ({
    id: String(row.id || ""),
    email: String(row.email || ""),
    pro_status: String(row.pro_status || "inactive"),
    credits_balance: Number(row.credits_balance || 0),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
    last_login_at: lastLoginByUser.get(String(row.id || "")) || null,
    template_purchase_count: Number(purchaseCountByUser.get(String(row.id || "")) || 0),
  }));

  return json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    from: total ? from + 1 : 0,
    to: Math.min(total, from + pageSize),
  });
}

async function handleAdminUserDetail(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("userId") || "").trim();
  if (!userId) return json({ error: "missing_user_id" }, 400);
  const encodedUserId = encodeURIComponent(userId);

  const [profileRes, ledgerRes, purchasesRes, logsRes, loginSuccessRes, loginFailedRes] = await Promise.all([
    supabaseAdminRequest(env, `/rest/v1/profiles?select=*&id=eq.${encodedUserId}&limit=1`),
    supabaseAdminRequest(env, `/rest/v1/credit_ledger?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
    supabaseAdminRequest(env, `/rest/v1/template_purchases?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
    supabaseAdminRequest(env, `/rest/v1/audit_logs?select=*&user_id=eq.${encodedUserId}&order=created_at.desc&limit=20`),
    supabaseAdminRequest(env, `/rest/v1/audit_logs?select=created_at&user_id=eq.${encodedUserId}&action=eq.login_success&order=created_at.desc&limit=500`),
    supabaseAdminRequest(env, `/rest/v1/audit_logs?select=created_at&user_id=eq.${encodedUserId}&action=eq.login_failed&order=created_at.desc&limit=500`),
  ]);

  const profile = asRows(profileRes.data)[0] || null;
  const email = profile ? String(profile.email || "").trim().toLowerCase() : "";
  const billingRes = email
    ? await supabaseAdminRequest(
        env,
        `/rest/v1/billing_events?select=*&or=(user_email.eq.${encodeURIComponent(email)},user_external_id.eq.${encodedUserId})&order=created_at.desc&limit=20`
      )
    : await supabaseAdminRequest(env, `/rest/v1/billing_events?select=*&user_external_id=eq.${encodedUserId}&order=created_at.desc&limit=20`);

  return json({
    profile,
    recentLedger: asRows(ledgerRes.data),
    recentTemplatePurchases: asRows(purchasesRes.data),
    recentBillingEvents: asRows(billingRes.data),
    recentAuditLogs: asRows(logsRes.data),
    loginSummary: {
      successCount: asRows(loginSuccessRes.data).length,
      failedCount: asRows(loginFailedRes.data).length,
      lastLoginAt: asRows(loginSuccessRes.data)[0]?.created_at || null,
    },
  });
}

async function handleAdminLogs(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const action = String(url.searchParams.get("action") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim();
  const userId = String(url.searchParams.get("userId") || "").trim();
  const range = String(url.searchParams.get("range") || "7d").trim();
  const limit = Math.max(1, Math.min(300, Math.round(Number(url.searchParams.get("limit") || "100"))));

  const clauses = [];
  if (action) clauses.push(`action=eq.${encodeURIComponent(action)}`);
  if (status) clauses.push(`status=eq.${encodeURIComponent(status)}`);
  if (userId) clauses.push(`user_id=eq.${encodeURIComponent(userId)}`);
  const hours = range === "30d" ? 24 * 30 : range === "7d" ? 24 * 7 : 24;
  clauses.push(`created_at=gte.${encodeURIComponent(agoIso(hours))}`);
  const where = clauses.length ? `&${clauses.join("&")}` : "";

  const rowsRes = await supabaseAdminRequest(
    env,
    `/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}${where}`
  );
  const rows = asRows(rowsRes.data);

  const items = q
    ? rows.filter((row) => {
        const s1 = String(row.action || "").toLowerCase();
        const s2 = String(row.status || "").toLowerCase();
        const s3 = String(row.user_id || "").toLowerCase();
        const s4 = JSON.stringify(row.meta || {}).toLowerCase();
        return s1.includes(q) || s2.includes(q) || s3.includes(q) || s4.includes(q);
      })
    : rows;

  return json({ items, total: items.length, range });
}

async function handleAdminWhoAmI(request, env) {
  const inspected = await inspectAdmin(request, env);
  return json({
    ok: inspected.ok,
    error: inspected.error || "",
    email: inspected.email || "",
    userId: inspected.userId || "",
    isAdmin: Boolean(inspected.isAdmin),
  }, inspected.status || 200);
}

async function handleWhopWebhook(request, env) {
  if (request.method === "GET") return text("Method Not Allowed", 405);
  if (request.method !== "POST") return text("Method Not Allowed", 405);

  const body = await request.text();
  const sig = request.headers.get("whop-signature") || "";

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(env.WHOP_WEBHOOK_SECRET || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expectedHex !== sig) return text("Unauthorized", 401);

  try {
    const event = JSON.parse(body);
    const action = event.action;
    const userEmail = event.data?.user?.email;
    const planId = event.data?.plan?.id;

    const CREDIT_MAP = {
      plan_S9Y9sX4nIH7M2: 150,
      plan_LsyYESGY0fqI9: 420,
      plan_00vbsXkjSR9jA: 800,
    };

    if (action === "membership_activated" && userEmail && CREDIT_MAP[planId]) {
      const base = supabaseBaseUrl(env);
      const key2 = supabaseServiceKey(env);
      await fetch(`${base}/rest/v1/rpc/add_user_credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key2,
          Authorization: `Bearer ${key2}`,
        },
        body: JSON.stringify({
          user_email: userEmail,
          amount: CREDIT_MAP[planId],
        }),
      });
    }
    return text("ok", 200);
  } catch (err) {
    return text(`Internal Server Error: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "content-type,authorization,x-sp-user-id",
            "access-control-max-age": "86400",
          },
        });
      }

      if (url.pathname === "/api/webhooks/whop") return handleWhopWebhook(request, env);
      if (url.pathname === "/api/admin-lite/stats" && request.method === "GET") return handleAdminStats(request, env);
      if (url.pathname === "/api/admin-lite/whoami" && request.method === "GET") return handleAdminWhoAmI(request, env);
      if (url.pathname === "/api/admin-lite/users" && request.method === "GET") return handleAdminUsers(request, env);
      if (url.pathname === "/api/admin-lite/user-detail" && request.method === "GET") return handleAdminUserDetail(request, env);
      if (url.pathname === "/api/admin-lite/logs" && request.method === "GET") return handleAdminLogs(request, env);

      if (!env.ASSETS) return text("ASSETS binding unavailable", 500);
      const res = await env.ASSETS.fetch(request);
      if (res.status === 404) {
        const assetUrl = new URL("/index.html", request.url);
        const indexRes = await env.ASSETS.fetch(new Request(assetUrl.toString()));
        return new Response(indexRes.body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=UTF-8" },
        });
      }
      return res;
    } catch (err) {
      return text(`Internal Server Error: ${err instanceof Error ? err.message : String(err)}`, 500);
    }
  },
};
