import { AdminGuardError, requireAdmin } from "../../../lib/server/adminGuard";
import { getRecentLogs } from "../../../lib/server/adminQueries";
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
  chip: {
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
  table: { width: "100%", borderCollapse: "collapse" as const, minWidth: "1080px" },
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

type SearchValue = string | string[] | undefined;

function pickFirst(value: SearchValue) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function AdminLiteLogsPage(input: {
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
          <h1 style={styles.title}>Admin Lite · Logs</h1>
          <p style={styles.sub}>403 - {e?.message || "admin_forbidden"}</p>
        </div>
      </main>
    );
  }

  const sp = input?.searchParams || {};
  const q = pickFirst(sp.q).trim();
  const action = pickFirst(sp.action).trim();
  const status = pickFirst(sp.status).trim();
  const userId = pickFirst(sp.userId).trim();
  const range = (pickFirst(sp.range).trim() as "24h" | "7d" | "30d") || "7d";

  const data = await getRecentLogs(runtime, {
    q,
    action,
    status,
    userId,
    range,
    limit: 100,
  });

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Admin Lite · Logs</h1>
        <p style={styles.sub}>/admin-lite/logs · recent audit logs</p>

        <section style={styles.filters}>
          <div style={styles.chip}>q={q || "(empty)"}</div>
          <div style={styles.chip}>action={action || "(all)"}</div>
          <div style={styles.chip}>status={status || "(all)"}</div>
          <div style={styles.chip}>userId={userId || "(all)"}</div>
          <div style={styles.chip}>range={range}</div>
          <div style={styles.chip}>total={data.total}</div>
        </section>

        <section style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>created_at</th>
                <th style={styles.th}>action</th>
                <th style={styles.th}>status</th>
                <th style={styles.th}>user_id</th>
                <th style={styles.th}>meta</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={5}>No logs for current filter.</td>
                </tr>
              ) : (
                data.items.map((row, idx) => (
                  <tr key={`${String(row.id || "log")}-${idx}`}>
                    <td style={styles.td}>{String(row.created_at || "-")}</td>
                    <td style={styles.td}>{String(row.action || "-")}</td>
                    <td style={styles.td}>{String(row.status || "-")}</td>
                    <td style={styles.td}>{String(row.user_id || "-")}</td>
                    <td style={styles.td}>
                      <details>
                        <summary>meta</summary>
                        <pre style={styles.code}>{JSON.stringify(row.meta || {}, null, 2)}</pre>
                      </details>
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
