import { getAdminDashboardStats } from "../../lib/server/adminQueries";
import { AdminGuardError, requireAdmin } from "../../lib/server/adminGuard";
import { getServerRuntimeEnvFromProcess } from "../../lib/server/supabaseAdmin";

const styles = {
  page: {
    minHeight: "100%",
    background: "#0b1018",
    color: "#e5e7eb",
    padding: "24px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  } as const,
  wrap: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  header: { display: "flex", alignItems: "baseline", justifyContent: "space-between" },
  title: { margin: 0, fontSize: "28px", fontWeight: 700 },
  sub: { margin: 0, color: "#9ca3af", fontSize: "13px" },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
  },
  card: {
    border: "1px solid #293042",
    borderRadius: "10px",
    padding: "12px",
    background: "#121826",
  },
  cardLabel: { fontSize: "12px", color: "#93a0b8" },
  cardValue: { fontSize: "26px", fontWeight: 700, marginTop: "6px" },
  section: {
    border: "1px solid #293042",
    borderRadius: "10px",
    background: "#121826",
    padding: "14px",
  },
  sectionTitle: { margin: "0 0 12px", fontSize: "15px", fontWeight: 700 },
  list: { display: "grid", gap: "8px" },
  item: {
    border: "1px solid #2c3347",
    borderRadius: "8px",
    padding: "10px",
    background: "#0f1420",
  },
  row: { display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px" },
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

export default async function AdminLiteHomePage() {
  const runtime = getServerRuntimeEnvFromProcess();
  try {
    await requireAdmin({ runtime, accessToken: getAccessToken() });
  } catch (error) {
    const e = error as AdminGuardError;
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <h1 style={styles.title}>Admin Lite</h1>
          <p style={styles.sub}>403 - {e?.message || "admin_forbidden"}</p>
        </div>
      </main>
    );
  }

  const stats = await getAdminDashboardStats(runtime);

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <h1 style={styles.title}>Admin Lite</h1>
          <p style={styles.sub}>/admin-lite · Read-only dashboard</p>
        </header>

        <section style={styles.cards}>
          <div style={styles.card}><div style={styles.cardLabel}>Total users</div><div style={styles.cardValue}>{stats.totalUsers}</div></div>
          <div style={styles.card}><div style={styles.cardLabel}>Active PRO users</div><div style={styles.cardValue}>{stats.activeProUsers}</div></div>
          <div style={styles.card}><div style={styles.cardLabel}>Today signups</div><div style={styles.cardValue}>{stats.todaySignups}</div></div>
          <div style={styles.card}><div style={styles.cardLabel}>Today login success</div><div style={styles.cardValue}>{stats.todayLoginSuccess}</div></div>
          <div style={styles.card}><div style={styles.cardLabel}>Today template purchases</div><div style={styles.cardValue}>{stats.todayTemplatePurchases}</div></div>
          <div style={styles.card}><div style={styles.cardLabel}>Today credit spend</div><div style={styles.cardValue}>{stats.todayCreditSpend}</div></div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent errors (20)</h2>
          <div style={styles.list}>
            {stats.recentErrors.length === 0 ? (
              <div style={styles.item}>No failed audit logs in latest query.</div>
            ) : (
              stats.recentErrors.map((row) => (
                <article key={row.id} style={styles.item}>
                  <div style={styles.row}>
                    <span>{row.action}</span>
                    <span>{row.status}</span>
                  </div>
                  <div style={styles.row}>
                    <span>User: {row.userId || "-"}</span>
                    <span>{row.createdAt}</span>
                  </div>
                  <details>
                    <summary>meta</summary>
                    <pre style={styles.code}>{JSON.stringify(row.meta, null, 2)}</pre>
                  </details>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
