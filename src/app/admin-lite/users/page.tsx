import { AdminGuardError, requireAdmin } from "../../../lib/server/adminGuard";
import { searchUsers } from "../../../lib/server/adminQueries";
import { getServerRuntimeEnvFromProcess } from "../../../lib/server/supabaseAdmin";

const styles = {
  page: { minHeight: "100%", background: "#0b1018", color: "#e5e7eb", padding: "24px" },
  wrap: { maxWidth: "1280px", margin: "0 auto", display: "grid", gap: "14px" },
  title: { margin: 0, fontSize: "28px", fontWeight: 700 },
  sub: { margin: 0, color: "#9ca3af", fontSize: "13px" },
  filters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    border: "1px solid #293042",
    borderRadius: "10px",
    background: "#121826",
    padding: "12px",
  },
  code: {
    background: "#0f1420",
    border: "1px solid #2a3144",
    color: "#d1d5db",
    borderRadius: "8px",
    padding: "6px 8px",
    fontSize: "12px",
  },
  tableWrap: {
    border: "1px solid #293042",
    borderRadius: "10px",
    background: "#121826",
    overflow: "auto" as const,
  },
  table: { width: "100%", borderCollapse: "collapse" as const, minWidth: "1100px" },
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
  action: {
    color: "#f59e0b",
    textDecoration: "none",
    border: "1px solid #5a4520",
    borderRadius: "6px",
    padding: "4px 8px",
  },
};

function getAccessToken() {
  const g = globalThis as unknown as { __ADMIN_ACCESS_TOKEN__?: string };
  return String(g.__ADMIN_ACCESS_TOKEN__ || "").trim();
}

type SearchValue = string | string[] | undefined;

function pickFirst(value: SearchValue) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function AdminLiteUsersPage(input: {
  searchParams?: Record<string, SearchValue>;
}) {
  const runtime = getServerRuntimeEnvFromProcess();
  try {
    await requireAdmin({ runtime, accessToken: getAccessToken() });
  } catch (error) {
    const e = error as AdminGuardError;
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <h1 style={styles.title}>Admin Lite · Users</h1>
          <p style={styles.sub}>403 - {e?.message || "admin_forbidden"}</p>
        </div>
      </main>
    );
  }

  const sp = input?.searchParams || {};
  const q = pickFirst(sp.q).trim();
  const filter = (pickFirst(sp.filter).trim() as "all" | "pro" | "non_pro" | "credits_gt_0" | "new_7d") || "all";
  const page = Number(pickFirst(sp.page) || "1");
  const pageSize = Number(pickFirst(sp.pageSize) || "20");

  const result = await searchUsers(runtime, { q, filter, page, pageSize });

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Admin Lite · Users</h1>
        <p style={styles.sub}>/admin-lite/users · Search by email or user id</p>

        <section style={styles.filters}>
          <div style={styles.code}>q={q || "(empty)"}</div>
          <div style={styles.code}>filter={filter}</div>
          <div style={styles.code}>page={result.page}</div>
          <div style={styles.code}>pageSize={result.pageSize}</div>
          <div style={styles.code}>total={result.total}</div>
        </section>

        <section style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>email</th>
                <th style={styles.th}>user id</th>
                <th style={styles.th}>pro_status</th>
                <th style={styles.th}>credits_balance</th>
                <th style={styles.th}>created_at</th>
                <th style={styles.th}>last_login_at</th>
                <th style={styles.th}>template_purchase_count</th>
                <th style={styles.th}>action</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr><td style={styles.td} colSpan={8}>No users matched current query.</td></tr>
              ) : (
                result.items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.email || "-"}</td>
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.pro_status}</td>
                    <td style={styles.td}>{item.credits_balance}</td>
                    <td style={styles.td}>{item.created_at}</td>
                    <td style={styles.td}>{item.last_login_at || "-"}</td>
                    <td style={styles.td}>{item.template_purchase_count}</td>
                    <td style={styles.td}>
                      <a style={styles.action} href={`/admin-lite/users/${encodeURIComponent(item.id)}`}>View</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
