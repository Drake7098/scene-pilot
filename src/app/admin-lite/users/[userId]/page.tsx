import { AdminGuardError, requireAdmin } from "../../../../lib/server/adminGuard";
import { getUserAdminDetail } from "../../../../lib/server/adminQueries";
import { getServerRuntimeEnvFromProcess } from "../../../../lib/server/supabaseAdmin";

const styles = {
  page: { minHeight: "100%", background: "#0b1018", color: "#e5e7eb", padding: "24px" },
  wrap: { maxWidth: "1280px", margin: "0 auto", display: "grid", gap: "14px" },
  title: { margin: 0, fontSize: "28px", fontWeight: 700 },
  sub: { margin: 0, color: "#9ca3af", fontSize: "13px" },
  section: {
    border: "1px solid #293042",
    borderRadius: "10px",
    background: "#121826",
    padding: "12px",
  },
  sectionTitle: { margin: "0 0 10px", fontSize: "15px", fontWeight: 700 },
  kvGrid: { display: "grid", gridTemplateColumns: "240px 1fr", gap: "6px 12px", fontSize: "12px" },
  key: { color: "#94a3b8" },
  val: { color: "#e5e7eb", wordBreak: "break-all" as const },
  tableWrap: {
    border: "1px solid #293042",
    borderRadius: "10px",
    background: "#121826",
    overflow: "auto" as const,
  },
  table: { width: "100%", borderCollapse: "collapse" as const, minWidth: "980px" },
  th: {
    textAlign: "left" as const,
    padding: "10px",
    borderBottom: "1px solid #263046",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #1f2738",
    fontSize: "12px",
    verticalAlign: "top" as const,
    whiteSpace: "nowrap" as const,
  },
  code: {
    marginTop: "8px",
    borderRadius: "8px",
    border: "1px solid #2a3144",
    padding: "8px",
    background: "#0b1018",
    whiteSpace: "pre-wrap" as const,
    overflowX: "auto" as const,
    fontSize: "11px",
    lineHeight: 1.45,
  },
};

function getAccessToken() {
  const g = globalThis as unknown as { __ADMIN_ACCESS_TOKEN__?: string };
  return String(g.__ADMIN_ACCESS_TOKEN__ || "").trim();
}

function normalizeParam(value: string) {
  return decodeURIComponent(String(value || "")).trim();
}

function DataTable(props: {
  title: string;
  columns: string[];
  rows: Record<string, unknown>[];
  renderDetailsKey?: string;
}) {
  const { title, columns, rows, renderDetailsKey } = props;
  return (
    <section style={styles.tableWrap}>
      <table style={styles.table}>
        <caption style={{ textAlign: "left", padding: "10px", color: "#e5e7eb", fontWeight: 700 }}>{title}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={styles.th}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan={columns.length}>No data</td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={`${title}-${idx}`}>
                {columns.map((col) => {
                  const raw = row[col];
                  const value = raw == null ? "-" : String(raw);
                  if (renderDetailsKey && col === renderDetailsKey) {
                    return (
                      <td key={`${idx}-${col}`} style={styles.td}>
                        <details>
                          <summary>view</summary>
                          <pre style={styles.code}>{JSON.stringify(raw ?? {}, null, 2)}</pre>
                        </details>
                      </td>
                    );
                  }
                  return <td key={`${idx}-${col}`} style={styles.td}>{value}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default async function AdminLiteUserDetailPage(input: { params?: { userId?: string } }) {
  const runtime = getServerRuntimeEnvFromProcess();
  try {
    await requireAdmin({ runtime, accessToken: getAccessToken() });
  } catch (error) {
    const e = error as AdminGuardError;
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <h1 style={styles.title}>Admin Lite · User Detail</h1>
          <p style={styles.sub}>403 - {e?.message || "admin_forbidden"}</p>
        </div>
      </main>
    );
  }

  const userId = normalizeParam(input?.params?.userId || "");
  const detail = await getUserAdminDetail(runtime, userId);
  const profile = (detail.profile || {}) as Record<string, unknown>;

  const ledger = detail.recentLedger.slice(0, 20).map((row) => ({
    created_at: row.created_at,
    event_type: row.event_type,
    amount: row.amount,
    balance_after: row.balance_after,
    source: row.source,
    reference_type: row.reference_type,
    reference_id: row.reference_id,
    note: row.note,
    idempotency_key: row.idempotency_key,
  }));

  const purchases = detail.recentTemplatePurchases.slice(0, 20).map((row) => ({
    template_id: row.template_id,
    credit_cost: row.credit_cost,
    unlock_source: row.unlock_source,
    idempotency_key: row.idempotency_key,
    created_at: row.created_at,
  }));

  const billings = detail.recentBillingEvents.slice(0, 20).map((row) => ({
    provider: row.provider,
    event_id: row.event_id,
    event_type: row.event_type,
    resource_id: row.resource_id,
    user_email: row.user_email,
    processed: row.processed,
    processed_at: row.processed_at,
    created_at: row.created_at,
    payload: row.payload,
  }));

  const logs = detail.recentAuditLogs.slice(0, 20).map((row) => ({
    created_at: row.created_at,
    action: row.action,
    status: row.status,
    meta: row.meta,
  }));

  const creditAddTotal = detail.recentLedger.reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    return amount > 0 ? sum + amount : sum;
  }, 0);

  const creditSpendTotal = detail.recentLedger.reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    return amount < 0 ? sum + Math.abs(amount) : sum;
  }, 0);

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Admin Lite · User Detail</h1>
        <p style={styles.sub}>/admin-lite/users/{userId}</p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>A. 基础信息</h2>
          <div style={styles.kvGrid}>
            <div style={styles.key}>id</div><div style={styles.val}>{String(profile.id || userId || "-")}</div>
            <div style={styles.key}>email</div><div style={styles.val}>{String(profile.email || "-")}</div>
            <div style={styles.key}>created_at</div><div style={styles.val}>{String(profile.created_at || "-")}</div>
            <div style={styles.key}>updated_at</div><div style={styles.val}>{String(profile.updated_at || "-")}</div>
            <div style={styles.key}>最近登录时间</div><div style={styles.val}>{detail.loginSummary.lastLoginAt || "-"}</div>
            <div style={styles.key}>登录成功次数</div><div style={styles.val}>{detail.loginSummary.successCount}</div>
            <div style={styles.key}>登录失败次数</div><div style={styles.val}>{detail.loginSummary.failedCount}</div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>B. PRO 信息</h2>
          <div style={styles.kvGrid}>
            <div style={styles.key}>pro_status</div><div style={styles.val}>{String(profile.pro_status || "inactive")}</div>
            <div style={styles.key}>pro_source</div><div style={styles.val}>{String(profile.pro_source || "-")}</div>
            <div style={styles.key}>pro_whop_membership_id</div><div style={styles.val}>{String(profile.pro_whop_membership_id || "-")}</div>
            <div style={styles.key}>pro_plan_code</div><div style={styles.val}>{String(profile.pro_plan_code || "-")}</div>
            <div style={styles.key}>pro_activated_at</div><div style={styles.val}>{String(profile.pro_activated_at || "-")}</div>
            <div style={styles.key}>pro_deactivated_at</div><div style={styles.val}>{String(profile.pro_deactivated_at || "-")}</div>
            <div style={styles.key}>pro_current_period_end</div><div style={styles.val}>{String(profile.pro_current_period_end || "-")}</div>
            <div style={styles.key}>pro_cancel_at_period_end</div><div style={styles.val}>{String(profile.pro_cancel_at_period_end || false)}</div>
            <div style={styles.key}>pro_bonus_granted</div><div style={styles.val}>{String(profile.pro_bonus_granted || false)}</div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>C. Credits 信息</h2>
          <div style={styles.kvGrid}>
            <div style={styles.key}>当前余额</div><div style={styles.val}>{String(profile.credits_balance || 0)}</div>
            <div style={styles.key}>最近流水累计赠送(窗口)</div><div style={styles.val}>{creditAddTotal}</div>
            <div style={styles.key}>最近流水累计消费(窗口)</div><div style={styles.val}>{creditSpendTotal}</div>
          </div>
        </section>

        <DataTable
          title="最近 20 条 credit_ledger"
          columns={[
            "created_at",
            "event_type",
            "amount",
            "balance_after",
            "source",
            "reference_type",
            "reference_id",
            "note",
            "idempotency_key",
          ]}
          rows={ledger}
        />

        <DataTable
          title="最近 20 条 template_purchases"
          columns={["template_id", "credit_cost", "unlock_source", "idempotency_key", "created_at"]}
          rows={purchases}
        />

        <DataTable
          title="最近 20 条 billing_events"
          columns={[
            "provider",
            "event_id",
            "event_type",
            "resource_id",
            "user_email",
            "processed",
            "processed_at",
            "created_at",
            "payload",
          ]}
          rows={billings}
          renderDetailsKey="payload"
        />

        <DataTable
          title="最近 20 条 audit_logs"
          columns={["created_at", "action", "status", "meta"]}
          rows={logs}
          renderDetailsKey="meta"
        />
      </div>
    </main>
  );
}
