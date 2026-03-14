import type { CSSProperties } from "react";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";
import { CREDIT_PACKS, HOSTED_ACTIONS, PRO_PLAN } from "../services/billingService";
import PublicFooter from "../components/PublicFooter";

const APP_SIGNIN_HREF = "/app?signin=1";

type PlanSpec = {
  id: "free" | "pro" | "pro_plus";
  label: string;
  tag?: string;
  price: string;
  period: string;
  summary: string;
  bullets: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const planSpecs: PlanSpec[] = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    period: "/ month",
    summary: "For first direction checks in workspace.",
    bullets: [
      "Workspace access",
      "Structured scene prompt drafting",
      "Scene structure and camera language editing",
      "No hosted AI generation"
    ],
    cta: "Get Started",
    href: APP_SIGNIN_HREF
  },
  {
    id: "pro",
    label: "Pro",
    tag: "Most Used",
    price: `$${PRO_PLAN.monthlyUsdPrice}`,
    period: "/ month",
    summary: "For stable production with platform-hosted generation.",
    bullets: [
      "Everything in Free",
      "Pro Workspace and multi-scene workflow",
      `${PRO_PLAN.monthlyCredits} monthly credits included`,
      "Use ScenePilotix hosted generation"
    ],
    cta: "Enter Pro",
    href: APP_SIGNIN_HREF,
    featured: true
  },
  {
    id: "pro_plus",
    label: "Pro+",
    tag: "BYO API",
    price: "Custom",
    period: "(price later)",
    summary: "For teams that need own API routing and higher control.",
    bullets: [
      "Everything in Pro",
      "Bring your own API keys (fal / runway)",
      "Provider-level routing and account isolation",
      "Business support channel"
    ],
    cta: "Contact Sales",
    href: `mailto:${PUBLIC_CONTACT_CHANNELS.business}`
  }
];

function usageLabel(media: string, tier: string) {
  const mediaText = media === "image" ? "Image" : "Video";
  const tierMap: Record<string, string> = {
    standard: "Standard",
    hd: "HD",
    video: "Standard"
  };
  return `${mediaText} · ${tierMap[tier] || tier}`;
}

export default function PricingPage() {
  const packs = CREDIT_PACKS.filter((item) => item.enabled);
  const costs = HOSTED_ACTIONS.filter((item) => item.enabled);

  return (
    <div style={page}>
      <div style={surface}>
        <header style={hero}>
          <div style={topBar}>
            <a href="/" style={closeBtn} aria-label="Close and back to home">Close</a>
          </div>
          <div style={eyebrow}>ScenePilotix Pricing</div>
          <h1 style={title}>Predictable plans for structured scene generation</h1>
          <p style={subtitle}>
            We turn scene structure, camera language, and director packs into more controllable prompts.
          </p>
        </header>

        <section style={plansGrid}>
          {planSpecs.map((plan) => (
            <article
              key={plan.id}
              style={{ ...planCard, ...(plan.featured ? planCardFeatured : null) }}
              data-testid={`pricing-plan-${plan.id}`}
            >
              <div style={planTop}>
                <div style={planLabel}>{plan.label}</div>
                {plan.tag ? <span style={planTag}>{plan.tag}</span> : null}
              </div>
              <div style={priceLine}>
                <span style={priceValue}>{plan.price}</span>
                <span style={pricePeriod}>{plan.period}</span>
              </div>
              <p style={planSummary}>{plan.summary}</p>
              <ul style={bulletList}>
                {plan.bullets.map((line) => (
                  <li key={line} style={bulletItem}>{line}</li>
                ))}
              </ul>
              <a href={plan.href} style={{ ...cta, ...(plan.featured ? ctaPrimary : ctaGhost) }}>
                {plan.cta}
              </a>
            </article>
          ))}
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Credit packs and deduction baseline (adjustable later)</h2>
          <div style={metricsGrid}>
            <div>
              <div style={metricLabel}>Credit packs</div>
              <div style={lineStack}>
                {packs.map((pack) => (
                  <div key={pack.id} style={metricLine}>
                    <span>{pack.credits} credits</span>
                    <span>${pack.usdPrice} one-time</span>
                  </div>
                ))}
              </div>
              <div style={metricHint}>Note: `$3` is a one-time credit pack, not the Pro subscription.</div>
            </div>
            <div>
              <div style={metricLabel}>Generation usage</div>
              <div style={lineStack}>
                {costs.map((item) => (
                  <div key={item.id} style={metricLine}>
                    <span>{usageLabel(item.mediaType, item.qualityTier)}</span>
                    <span>{item.creditsCost} credits</span>
                  </div>
                ))}
              </div>
              <div style={metricHint}>Prompt export: free for first 7 days after registration, then 2 credits each.</div>
            </div>
          </div>
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Billing and legal</h2>
          <div style={legalText}>
            Checkout and tax handling are processed by Paddle. Pro is auto-renewing until canceled.
            First-time Pro subscription supports a 7-day refund window. Used credits are non-refundable.
          </div>
          <div style={legalLinks}>
            <a href="/terms" style={textLink}>Terms</a>
            <a href="/privacy" style={textLink}>Privacy</a>
            <a href="/billing-terms" style={textLink}>Billing Terms</a>
            <a href="/refund-policy" style={textLink}>Refund Policy</a>
          </div>
          <div style={contactRow}>
            Support: {PUBLIC_CONTACT_CHANNELS.support} | Business: {PUBLIC_CONTACT_CHANNELS.business}
          </div>
        </section>

        <PublicFooter compact />
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  color: "var(--spx-text-1)",
  background: "radial-gradient(860px 460px at 12% -16%, rgba(83,146,226,0.18), transparent 62%), #070b12"
};

const surface: CSSProperties = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "32px 20px 52px"
};

const hero: CSSProperties = {
  marginBottom: 20
};

const topBar: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 8
};

const closeBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 88,
  minHeight: 34,
  borderRadius: 999,
  textDecoration: "none",
  color: "var(--spx-text-2)",
  background: "rgba(255,255,255,0.05)",
  fontSize: 13,
  fontWeight: 600
};

const eyebrow: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const title: CSSProperties = {
  margin: "10px 0 10px",
  fontSize: "clamp(30px, 5.2vw, 52px)",
  lineHeight: 1.08,
  letterSpacing: "-0.03em"
};

const subtitle: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: 16,
  lineHeight: 1.58,
  maxWidth: 880
};

const plansGrid: CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  marginBottom: 18
};

const planCard: CSSProperties = {
  background: "linear-gradient(180deg, rgba(13,18,30,0.92), rgba(10,14,24,0.94))",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 10
};

const planCardFeatured: CSSProperties = {
  background: "linear-gradient(180deg, rgba(29,46,77,0.84), rgba(13,22,39,0.95))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.26)"
};

const planTop: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
};

const planLabel: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.01em"
};

const planTag: CSSProperties = {
  fontSize: 12,
  color: "#dce9ff",
  background: "rgba(255,255,255,0.15)",
  borderRadius: 999,
  padding: "4px 10px",
  fontWeight: 600
};

const priceLine: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8
};

const priceValue: CSSProperties = {
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 750,
  letterSpacing: "-0.02em"
};

const pricePeriod: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 14
};

const planSummary: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: 14,
  lineHeight: 1.6
};

const bulletList: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "var(--spx-text-2)",
  fontSize: 13.5,
  lineHeight: 1.58,
  minHeight: 132
};

const bulletItem: CSSProperties = {
  marginBottom: 4
};

const cta: CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  padding: "0 16px",
  fontWeight: 650,
  fontSize: 14
};

const ctaPrimary: CSSProperties = {
  color: "#f4f8ff",
  background: "linear-gradient(180deg, rgba(84,145,232,0.7), rgba(40,97,172,0.72))"
};

const ctaGhost: CSSProperties = {
  color: "var(--spx-text-1)",
  background: "rgba(255,255,255,0.08)"
};

const section: CSSProperties = {
  marginBottom: 16,
  paddingTop: 12
};

const sectionTitle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 20,
  letterSpacing: "-0.01em"
};

const metricsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12
};

const metricLabel: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 8
};

const lineStack: CSSProperties = {
  display: "grid",
  gap: 6
};

const metricLine: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  minHeight: 32,
  borderRadius: 10,
  padding: "0 10px",
  background: "rgba(255,255,255,0.045)",
  color: "var(--spx-text-2)",
  fontSize: 13.5
};

const metricHint: CSSProperties = {
  marginTop: 8,
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  lineHeight: 1.6
};

const legalText: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 13.5,
  lineHeight: 1.62,
  marginBottom: 8
};

const legalLinks: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 8
};

const textLink: CSSProperties = {
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600
};

const contactRow: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 12.5
};
