import { type CSSProperties } from "react";
import type { Lang } from "../i18n";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";

const APP_HREF = "/app";

const WHOP_CREDIT_URLS: Record<string, string> = {
  "plan_S9Y9sX4nIH7M2": "https://whop.com/checkout/plan_S9Y9sX4nIH7M2",
  "plan_LsyYESGY0fqI9": "https://whop.com/checkout/plan_LsyYESGY0fqI9",
  "plan_00vbsXkjSR9jA": "https://whop.com/checkout/plan_00vbsXkjSR9jA",
};
const WHOP_PRO_URL = "https://whop.com/checkout/plan_BD8J6nLOGIk1t";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

const C = { bg: "#1f2125", card: "#24262b", border: "#3a3f46", text: "#e5e7eb", muted: "#9ca3af", accent: "#f59e0b" };

const CREDIT_PACKS = [
  { usd: 3, credits: 150, url: WHOP_CREDIT_URLS["plan_S9Y9sX4nIH7M2"] },
  { usd: 8, credits: 420, url: WHOP_CREDIT_URLS["plan_LsyYESGY0fqI9"] },
  { usd: 15, credits: 800, url: WHOP_CREDIT_URLS["plan_00vbsXkjSR9jA"] },
];

export default function PricingPage() {
  const [lang, setLang] = useLocalLang();

  return (
    <div style={page}>
      <div style={surface}>
        <StandalonePageChrome
          lang={lang}
          setLang={setLang}
          backHref={APP_HREF}
          showFooter
        >
          <header style={hero}>
            <h1 style={title}>
              {t(lang, "定价", "Pricing")}
            </h1>
          </header>

          {/* 区块1：积分包 */}
          <section style={section}>
            <h2 style={sectionTitle}>{t(lang, "积分包", "Credits")}</h2>
            <div style={cardsGrid}>
              {CREDIT_PACKS.map((pack) => (
                <article key={pack.url} style={card}>
                  <div style={cardPrice}>${pack.usd}</div>
                  <div style={cardLabel}>{pack.credits} {t(lang, "积分", "Credits")}</div>
                  <button
                    type="button"
                    style={btnPrimary}
                    onClick={() => window.open(pack.url, "_blank")}
                  >
                    {t(lang, "购买", "Buy")}
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* 区块2：Pro 订阅 */}
          <section style={section}>
            <h2 style={sectionTitle}>{t(lang, "Pro 订阅", "Pro Subscription")}</h2>
            <article style={card}>
              <div style={cardPrice}>$12</div>
              <div style={cardLabel}>/ {t(lang, "月", "month")} · ScenePilotix Pro</div>
              <button
                type="button"
                style={btnPrimary}
                onClick={() => window.open(WHOP_PRO_URL, "_blank")}
              >
                {t(lang, "订阅 Pro", "Subscribe to Pro")}
              </button>
            </article>
          </section>

          {/* 底部联系方式 */}
          <footer style={footerWrap}>
            <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={footerLink}>
              {t(lang, "联系我们", "Contact us")}
            </a>
          </footer>
        </StandalonePageChrome>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  background: C.bg,
  color: C.text,
};

const surface: CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "32px 20px 52px",
};

const hero: CSSProperties = { marginBottom: 32 };
const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 4vw, 36px)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const section: CSSProperties = { marginBottom: 40, paddingTop: 24 };
const sectionTitle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 18,
  fontWeight: 700,
  color: C.text,
};

const cardsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 20,
};

const card: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const cardPrice: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: C.text,
};

const cardLabel: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: C.muted,
};

const btnPrimary: CSSProperties = {
  minHeight: 44,
  borderRadius: 10,
  border: `1px solid ${C.accent}`,
  background: C.accent,
  color: "#1f2125",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
};

const footerWrap: CSSProperties = {
  marginTop: 48,
  paddingTop: 24,
  borderTop: `1px solid ${C.border}`,
  textAlign: "center",
};

const footerLink: CSSProperties = {
  color: C.muted,
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 500,
};
