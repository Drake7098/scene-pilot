import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getApiAuthHeaders } from "../services/authService";

type DashboardData = {
  totalUsers: number;
  activeProUsers: number;
  todaySignups: number;
  todayLoginSuccess: number;
  todayTemplatePurchases: number;
  todayCreditSpend: number;
  recentErrors: Array<{
    id: string;
    action: string;
    status: string;
    userId: string | null;
    createdAt: string;
    meta: Record<string, unknown>;
  }>;
};

type UsersData = {
  items: Array<{
    id: string;
    email: string;
    pro_status: string;
    credits_balance: number;
    created_at: string;
    last_login_at: string | null;
    template_purchase_count: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

type UserDetailData = {
  profile: Record<string, unknown> | null;
  recentLedger: Record<string, unknown>[];
  recentTemplatePurchases: Record<string, unknown>[];
  recentBillingEvents: Record<string, unknown>[];
  recentAuditLogs: Record<string, unknown>[];
  loginSummary: { successCount: number; failedCount: number; lastLoginAt: string | null };
};

type LogsData = {
  items: Record<string, unknown>[];
  total: number;
  range: string;
};

type WhoAmI = {
  ok: boolean;
  error: string;
  email: string;
  userId: string;
  isAdmin: boolean;
};

const shell: CSSProperties = {
  minHeight: "100%",
  background: "#0b1018",
  color: "#e5e7eb",
  padding: "24px",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};
const wrap: CSSProperties = { maxWidth: 1280, margin: "0 auto", display: "grid", gap: 14 };
const title: CSSProperties = { margin: 0, fontSize: 28, fontWeight: 700 };
const sub: CSSProperties = { margin: 0, color: "#9ca3af", fontSize: 13 };
const cardWrap: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 };
const card: CSSProperties = { border: "1px solid #293042", borderRadius: 10, background: "#121826", padding: 12 };
const code: CSSProperties = {
  marginTop: 8,
  border: "1px solid #2a3144",
  borderRadius: 8,
  background: "#0b1018",
  padding: 8,
  whiteSpace: "pre-wrap",
  overflowX: "auto",
  fontSize: 11,
};
const tableWrap: CSSProperties = { border: "1px solid #293042", borderRadius: 10, background: "#121826", overflow: "auto" };
const table: CSSProperties = { width: "100%", minWidth: 1000, borderCollapse: "collapse" };
const th: CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #263046", color: "#94a3b8", fontSize: 12 };
const td: CSSProperties = { padding: 10, borderBottom: "1px solid #1f2738", fontSize: 12, verticalAlign: "top", whiteSpace: "nowrap" };
const banner: CSSProperties = { border: "1px solid #2f3950", borderRadius: 10, background: "#101726", padding: 12, fontSize: 12 };

function parsePath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const detailMatch = path.match(/^\/admin-lite\/users\/([^/]+)$/);
  if (detailMatch) return { mode: "user-detail" as const, userId: decodeURIComponent(detailMatch[1]) };
  if (path === "/admin-lite/users") return { mode: "users" as const, userId: "" };
  if (path === "/admin-lite/logs") return { mode: "logs" as const, userId: "" };
  return { mode: "dashboard" as const, userId: "" };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function apiGet<T>(path: string): Promise<T> {
  const headers = await getApiAuthHeaders();
  const res = await fetch(path, { headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String((payload as Record<string, unknown>).error || "request_failed"));
  }
  return payload as T;
}

async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const headers = await getApiAuthHeaders();
  const res = await fetch(path, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String((payload as Record<string, unknown>).error || "request_failed"));
  }
  return payload as T;
}

function prettyError(code: string) {
  if (code === "missing_access_token") return "未检测到登录会话，请先登录同一站点域名。";
  if (code === "invalid_access_token") return "登录态失效，请重新登录。";
  if (code === "admin_forbidden") return "当前账号不在管理员白名单。";
  if (code === "admin_emails_not_configured") return "服务端未配置 ADMIN_EMAILS。";
  return code || "unknown_error";
}

export default function AdminLitePage() {
  const [pathState, setPathState] = useState(() => parsePath());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<UsersData | null>(null);
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [logs, setLogs] = useState<LogsData | null>(null);
  const [whoami, setWhoami] = useState<WhoAmI | null>(null);
  const [detailReloadTick, setDetailReloadTick] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [creditAmountInput, setCreditAmountInput] = useState("100");
  const [creditNoteInput, setCreditNoteInput] = useState("");
  const [proStatusInput, setProStatusInput] = useState("active");
  const [proNoteInput, setProNoteInput] = useState("");
  const [deleteTemplateIdInput, setDeleteTemplateIdInput] = useState("");

  const search = useMemo(() => new URLSearchParams(window.location.search), [pathState.mode]);

  useEffect(() => {
    const onPop = () => setPathState(parsePath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      setWhoami({ ok: false, error: "invalid_access_token", email: "", userId: "", isAdmin: false });
      setError("invalid_access_token");
      setLoading(false);
    }
    window.addEventListener("sp:session_expired", handleSessionExpired as EventListener);
    return () => window.removeEventListener("sp:session_expired", handleSessionExpired as EventListener);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet<WhoAmI>("/api/admin-lite/whoami");
        if (alive) setWhoami(data);
      } catch (err) {
        if (alive) {
          const code = err instanceof Error ? err.message : String(err);
          setWhoami({ ok: false, error: code, email: "", userId: "", isAdmin: false });
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        if (pathState.mode === "dashboard") {
          const data = await apiGet<DashboardData>("/api/admin-lite/stats");
          if (alive) setDashboard(data);
        } else if (pathState.mode === "users") {
          const q = search.get("q") || "";
          const filter = search.get("filter") || "all";
          const page = search.get("page") || "1";
          const pageSize = search.get("pageSize") || "20";
          const data = await apiGet<UsersData>(`/api/admin-lite/users?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}&page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`);
          if (alive) setUsers(data);
        } else if (pathState.mode === "user-detail") {
          const data = await apiGet<UserDetailData>(`/api/admin-lite/user-detail?userId=${encodeURIComponent(pathState.userId)}`);
          if (alive) setDetail(data);
        } else {
          const q = search.get("q") || "";
          const action = search.get("action") || "";
          const status = search.get("status") || "";
          const userId = search.get("userId") || "";
          const range = search.get("range") || "7d";
          const data = await apiGet<LogsData>(`/api/admin-lite/logs?q=${encodeURIComponent(q)}&action=${encodeURIComponent(action)}&status=${encodeURIComponent(status)}&userId=${encodeURIComponent(userId)}&range=${encodeURIComponent(range)}&limit=100`);
          if (alive) setLogs(data);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [pathState.mode, pathState.userId, search, detailReloadTick]);

  const reloadDetail = () => setDetailReloadTick((x) => x + 1);

  async function submitAddCredits(delta: number) {
    if (pathState.mode !== "user-detail") return;
    setActionBusy(true);
    setActionMsg("");
    setActionErr("");
    try {
      const amount = Number.isFinite(delta) ? Math.trunc(delta) : 0;
      if (!amount) throw new Error("invalid_amount");
      const resp = await apiPost<{ balance?: number; ok?: boolean }>("/api/admin-lite/add-credits", {
        userId: pathState.userId,
        amount,
        note: creditNoteInput.trim() || undefined,
      });
      setActionMsg(`credits 已更新，当前余额 ${String(resp.balance ?? "-")}`);
      reloadDetail();
    } catch (err) {
      setActionErr(prettyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setActionBusy(false);
    }
  }

  async function submitSetProStatus() {
    if (pathState.mode !== "user-detail") return;
    setActionBusy(true);
    setActionMsg("");
    setActionErr("");
    try {
      await apiPost<{ ok?: boolean }>("/api/admin-lite/set-pro-status", {
        userId: pathState.userId,
        proStatus: proStatusInput,
        note: proNoteInput.trim() || undefined,
      });
      setActionMsg(`PRO 状态已更新为 ${proStatusInput}`);
      reloadDetail();
    } catch (err) {
      setActionErr(prettyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setActionBusy(false);
    }
  }

  async function submitDeleteTemplatePurchase() {
    if (pathState.mode !== "user-detail") return;
    const templateId = deleteTemplateIdInput.trim();
    if (!templateId) {
      setActionErr("请输入 templateId");
      return;
    }
    const ok = window.confirm(`确认删除模板购买记录？\nuserId: ${pathState.userId}\ntemplateId: ${templateId}`);
    if (!ok) return;
    setActionBusy(true);
    setActionMsg("");
    setActionErr("");
    try {
      await apiPost<{ ok?: boolean; deleted?: boolean }>("/api/admin-lite/delete-template-purchase", {
        userId: pathState.userId,
        templateId,
      });
      setActionMsg(`模板购买记录已删除：${templateId}`);
      setDeleteTemplateIdInput("");
      reloadDetail();
    } catch (err) {
      setActionErr(prettyError(err instanceof Error ? err.message : String(err)));
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return <main style={shell}><div style={wrap}><h1 style={title}>Admin Lite</h1><p style={sub}>Loading...</p></div></main>;
  }
  if (error) {
    return (
      <main style={shell}>
        <div style={wrap}>
          <h1 style={title}>Admin Lite</h1>
          <section style={banner}>
            <div>Auth: {whoami?.ok ? "OK" : "Failed"}</div>
            <div>Email: {whoami?.email || "-"}</div>
            <div>Whitelist: {whoami?.isAdmin ? "Matched" : "Not matched"}</div>
            <div>Reason: {prettyError(whoami?.error || error)}</div>
          </section>
          <p style={sub}>Error: {prettyError(error)}</p>
        </div>
      </main>
    );
  }

  if (pathState.mode === "dashboard" && dashboard) {
    const recentErrors = asArray<DashboardData["recentErrors"][number]>(dashboard.recentErrors);
    return (
      <main style={shell}>
        <div style={wrap}>
          <h1 style={title}>Admin Lite</h1>
          <p style={sub}>/admin-lite</p>
          <section style={banner}>
            <div>Auth: {whoami?.ok ? "OK" : "Failed"}</div>
            <div>Email: {whoami?.email || "-"}</div>
            <div>Whitelist: {whoami?.isAdmin ? "Matched" : "Not matched"}</div>
            <div>Reason: {prettyError(whoami?.error || "") || "-"}</div>
          </section>
          <section style={cardWrap}>
            <div style={card}><div>Total users</div><div>{dashboard.totalUsers}</div></div>
            <div style={card}><div>Active PRO users</div><div>{dashboard.activeProUsers}</div></div>
            <div style={card}><div>Today signups</div><div>{dashboard.todaySignups}</div></div>
            <div style={card}><div>Today login success</div><div>{dashboard.todayLoginSuccess}</div></div>
            <div style={card}><div>Today template purchases</div><div>{dashboard.todayTemplatePurchases}</div></div>
            <div style={card}><div>Today credit spend</div><div>{dashboard.todayCreditSpend}</div></div>
          </section>
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>action</th><th style={th}>status</th><th style={th}>user_id</th><th style={th}>created_at</th><th style={th}>meta</th></tr></thead>
              <tbody>
                {recentErrors.length === 0 ? (
                  <tr><td style={td} colSpan={5}>暂无异常日志；如果上方全是 0，通常表示业务表还没有数据。</td></tr>
                ) : recentErrors.map((row) => (
                  <tr key={row.id}>
                    <td style={td}>{row.action}</td>
                    <td style={td}>{row.status}</td>
                    <td style={td}>{row.userId || "-"}</td>
                    <td style={td}>{row.createdAt}</td>
                    <td style={td}><details><summary>meta</summary><pre style={code}>{JSON.stringify(row.meta || {}, null, 2)}</pre></details></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    );
  }

  if (pathState.mode === "users" && users) {
    const items = asArray<UsersData["items"][number]>(users.items);
    return (
      <main style={shell}>
        <div style={wrap}>
          <h1 style={title}>Admin Lite Users</h1>
          <p style={sub}>/admin-lite/users · total {Number(users.total || 0)}</p>
          {items.length === 0 ? <section style={banner}>当前筛选下没有用户数据。</section> : null}
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>email</th><th style={th}>user_id</th><th style={th}>pro_status</th><th style={th}>credits_balance</th><th style={th}>created_at</th><th style={th}>last_login_at</th><th style={th}>template_purchase_count</th><th style={th}>action</th></tr></thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td style={td} colSpan={8}>No users matched.</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>{item.email || "-"}</td>
                    <td style={td}>{item.id}</td>
                    <td style={td}>{item.pro_status}</td>
                    <td style={td}>{item.credits_balance}</td>
                    <td style={td}>{item.created_at}</td>
                    <td style={td}>{item.last_login_at || "-"}</td>
                    <td style={td}>{item.template_purchase_count}</td>
                    <td style={td}><a href={`/admin-lite/users/${encodeURIComponent(item.id)}`} style={{ color: "#f59e0b" }}>View</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    );
  }

  if (pathState.mode === "user-detail" && detail) {
    const recentLedger = asArray<Record<string, unknown>>(detail.recentLedger);
    const recentTemplatePurchases = asArray<Record<string, unknown>>(detail.recentTemplatePurchases);
    const recentBillingEvents = asArray<Record<string, unknown>>(detail.recentBillingEvents);
    const recentAuditLogs = asArray<Record<string, unknown>>(detail.recentAuditLogs);
    return (
      <main style={shell}>
        <div style={wrap}>
          <h1 style={title}>Admin Lite User Detail</h1>
          <p style={sub}>/admin-lite/users/{pathState.userId}</p>
          <section style={card}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Manual Actions</div>
              {actionMsg ? <div style={{ color: "#22c55e", fontSize: 12 }}>{actionMsg}</div> : null}
              {actionErr ? <div style={{ color: "#f87171", fontSize: 12 }}>{actionErr}</div> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontSize: 12 }}>credits amount</label>
                <input
                  value={creditAmountInput}
                  onChange={(e) => setCreditAmountInput(e.target.value)}
                  inputMode="numeric"
                  style={{ background: "#0b1018", color: "#e5e7eb", border: "1px solid #293042", borderRadius: 6, padding: "6px 8px", width: 120 }}
                />
                <input
                  value={creditNoteInput}
                  onChange={(e) => setCreditNoteInput(e.target.value)}
                  placeholder="note"
                  style={{ background: "#0b1018", color: "#e5e7eb", border: "1px solid #293042", borderRadius: 6, padding: "6px 8px", width: 280 }}
                />
                <button
                  disabled={actionBusy}
                  onClick={() => {
                    const n = Math.trunc(Number(creditAmountInput || "0"));
                    if (!Number.isFinite(n) || n <= 0) {
                      setActionErr("credits amount 必须是正整数");
                      return;
                    }
                    void submitAddCredits(n);
                  }}
                  style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}
                >
                  Add Credits
                </button>
                <button
                  disabled={actionBusy}
                  onClick={() => {
                    const n = Math.trunc(Number(creditAmountInput || "0"));
                    if (!Number.isFinite(n) || n <= 0) {
                      setActionErr("credits amount 必须是正整数");
                      return;
                    }
                    const ok = window.confirm(`确认扣减 credits ${n}？`);
                    if (!ok) return;
                    void submitAddCredits(-n);
                  }}
                  style={{ background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}
                >
                  Subtract Credits
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontSize: 12 }}>pro status</label>
                <select
                  value={proStatusInput}
                  onChange={(e) => setProStatusInput(e.target.value)}
                  style={{ background: "#0b1018", color: "#e5e7eb", border: "1px solid #293042", borderRadius: 6, padding: "6px 8px" }}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="cancel_at_period_end">cancel_at_period_end</option>
                </select>
                <input
                  value={proNoteInput}
                  onChange={(e) => setProNoteInput(e.target.value)}
                  placeholder="note"
                  style={{ background: "#0b1018", color: "#e5e7eb", border: "1px solid #293042", borderRadius: 6, padding: "6px 8px", width: 280 }}
                />
                <button
                  disabled={actionBusy}
                  onClick={() => {
                    const ok = window.confirm(`确认将 PRO 状态改为 ${proStatusInput}？`);
                    if (!ok) return;
                    void submitSetProStatus();
                  }}
                  style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}
                >
                  Set PRO Status
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontSize: 12 }}>templateId</label>
                <input
                  value={deleteTemplateIdInput}
                  onChange={(e) => setDeleteTemplateIdInput(e.target.value)}
                  placeholder="template_xxx"
                  style={{ background: "#0b1018", color: "#e5e7eb", border: "1px solid #293042", borderRadius: 6, padding: "6px 8px", width: 320 }}
                />
                <button
                  disabled={actionBusy}
                  onClick={() => void submitDeleteTemplatePurchase()}
                  style={{ background: "#be123c", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}
                >
                  Delete Template Purchase
                </button>
              </div>
            </div>
          </section>
          {!detail.profile ? <section style={banner}>未找到该用户的 profile 记录。</section> : null}
          <section style={card}><pre style={code}>{JSON.stringify(detail.profile || {}, null, 2)}</pre></section>
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>created_at</th><th style={th}>event_type</th><th style={th}>amount</th><th style={th}>balance_after</th><th style={th}>source</th><th style={th}>reference_id</th></tr></thead>
              <tbody>{recentLedger.map((row, idx) => (<tr key={`l-${idx}`}><td style={td}>{String(row.created_at || "-")}</td><td style={td}>{String(row.event_type || "-")}</td><td style={td}>{String(row.amount || "-")}</td><td style={td}>{String(row.balance_after || "-")}</td><td style={td}>{String(row.source || "-")}</td><td style={td}>{String(row.reference_id || "-")}</td></tr>))}</tbody>
            </table>
          </section>
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>template_id</th><th style={th}>credit_cost</th><th style={th}>unlock_source</th><th style={th}>created_at</th></tr></thead>
              <tbody>{recentTemplatePurchases.map((row, idx) => (<tr key={`t-${idx}`}><td style={td}>{String(row.template_id || "-")}</td><td style={td}>{String(row.credit_cost || "-")}</td><td style={td}>{String(row.unlock_source || "-")}</td><td style={td}>{String(row.created_at || "-")}</td></tr>))}</tbody>
            </table>
          </section>
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>event_type</th><th style={th}>resource_id</th><th style={th}>processed</th><th style={th}>created_at</th><th style={th}>payload</th></tr></thead>
              <tbody>{recentBillingEvents.map((row, idx) => (<tr key={`b-${idx}`}><td style={td}>{String(row.event_type || "-")}</td><td style={td}>{String(row.resource_id || "-")}</td><td style={td}>{String(row.processed || "-")}</td><td style={td}>{String(row.created_at || "-")}</td><td style={td}><details><summary>payload</summary><pre style={code}>{JSON.stringify(row.payload || {}, null, 2)}</pre></details></td></tr>))}</tbody>
            </table>
          </section>
          <section style={tableWrap}>
            <table style={table}>
              <thead><tr><th style={th}>created_at</th><th style={th}>action</th><th style={th}>status</th><th style={th}>meta</th></tr></thead>
              <tbody>{recentAuditLogs.map((row, idx) => (<tr key={`a-${idx}`}><td style={td}>{String(row.created_at || "-")}</td><td style={td}>{String(row.action || "-")}</td><td style={td}>{String(row.status || "-")}</td><td style={td}><details><summary>meta</summary><pre style={code}>{JSON.stringify(row.meta || {}, null, 2)}</pre></details></td></tr>))}</tbody>
            </table>
          </section>
        </div>
      </main>
    );
  }

  const logItems = asArray<Record<string, unknown>>(logs?.items);
  return (
    <main style={shell}>
      <div style={wrap}>
        <h1 style={title}>Admin Lite Logs</h1>
        <p style={sub}>/admin-lite/logs · total {Number(logs?.total || 0)}</p>
        {logItems.length === 0 ? <section style={banner}>当前范围内没有日志。</section> : null}
        <section style={tableWrap}>
          <table style={table}>
            <thead><tr><th style={th}>created_at</th><th style={th}>action</th><th style={th}>status</th><th style={th}>user_id</th><th style={th}>meta</th></tr></thead>
            <tbody>{logItems.map((row, idx) => (<tr key={`g-${idx}`}><td style={td}>{String(row.created_at || "-")}</td><td style={td}>{String(row.action || "-")}</td><td style={td}>{String(row.status || "-")}</td><td style={td}>{String(row.user_id || "-")}</td><td style={td}><details><summary>meta</summary><pre style={code}>{JSON.stringify(row.meta || {}, null, 2)}</pre></details></td></tr>))}</tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
