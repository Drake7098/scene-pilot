import type { CSSProperties } from "react";
import { CREDIT_PACKS, HOSTED_ACTIONS, PRO_PLAN } from "../services/billingService";

const SURFACE: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "42px 20px 56px"
};

const cardBase: CSSProperties = {
  border: "1px solid var(--spx-border)",
  borderRadius: 16,
  background: "linear-gradient(180deg, rgba(18,24,38,0.92), rgba(12,17,28,0.94))",
  boxShadow: "var(--spx-shadow-panel)"
};

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100%", color: "var(--spx-text-1)" }}>
      <div style={SURFACE}>
        <header style={{ marginBottom: 26 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--spx-border)",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              color: "var(--spx-text-2)",
              background: "rgba(255,255,255,0.04)"
            }}
          >
            ScenePilotix Pricing
          </div>
          <h1 style={{ margin: "14px 0 8px", fontSize: 34, lineHeight: 1.15, letterSpacing: 0.2 }}>Plans & Credits</h1>
          <p style={{ margin: 0, color: "var(--spx-text-2)", fontSize: 15 }}>
            Public pricing page for checkout review and payment integration testing.
          </p>
        </header>

        <section style={{ ...cardBase, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--spx-text-3)" }}>Subscription</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Pro Monthly</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>${PRO_PLAN.monthlyUsdPrice}</div>
              <div style={{ color: "var(--spx-text-2)", fontSize: 13 }}>/ month</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Badge text={`${PRO_PLAN.monthlyCredits} credits included monthly`} />
            <Badge text="Pro workspace unlocked" />
            <Badge text="BYO API mode available" />
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="/" style={primaryCta}>
              Upgrade to Pro
            </a>
          </div>
        </section>

        <section style={{ ...cardBase, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--spx-text-3)" }}>Credit Packs</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 12 }}>
            {CREDIT_PACKS.filter((item) => item.enabled).map((pack) => (
              <article key={pack.id} style={{ ...miniCard }}>
                <div style={{ fontSize: 14, color: "var(--spx-text-2)" }}>{pack.credits} credits</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>${pack.usdPrice}</div>
                <div style={{ marginTop: 10 }}>
                  <a href="/" style={secondaryCta}>Buy Credits</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...cardBase, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--spx-text-3)" }}>Generation Credit Cost</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 12 }}>
            {HOSTED_ACTIONS.filter((item) => item.enabled).map((item) => (
              <article key={item.id} style={miniCard}>
                <div style={{ fontSize: 12, color: "var(--spx-text-3)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {item.mediaType}
                </div>
                <div style={{ fontSize: 18, fontWeight: 650, marginTop: 3 }}>{item.qualityTier}</div>
                <div style={{ marginTop: 8, color: "var(--spx-text-2)" }}>{item.creditsCost} credits / output</div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...cardBase, padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--spx-text-3)" }}>Billing Notes</div>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--spx-text-2)", lineHeight: 1.6 }}>
            <li>Pro is auto-renewing until canceled.</li>
            <li>First-time Pro subscription supports a 7-day refund window.</li>
            <li>Purchased credit packs are refundable when the purchased pack remains fully unused.</li>
            <li>Applicable local consumer protection laws prevail.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        border: "1px solid var(--spx-border)",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        color: "var(--spx-text-2)",
        background: "rgba(255,255,255,0.03)"
      }}
    >
      {text}
    </span>
  );
}

const miniCard: CSSProperties = {
  border: "1px solid var(--spx-border-soft)",
  borderRadius: 14,
  background: "rgba(255,255,255,0.025)",
  padding: 14
};

const primaryCta: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 140,
  padding: "10px 14px",
  borderRadius: 12,
  textDecoration: "none",
  border: "1px solid rgba(123, 181, 255, 0.84)",
  background: "linear-gradient(180deg, rgba(84,144,232,0.48), rgba(40,97,172,0.62))",
  color: "#f2f7ff",
  fontWeight: 650
};

const secondaryCta: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 112,
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  border: "1px solid var(--spx-border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--spx-text-1)",
  fontWeight: 600
};
