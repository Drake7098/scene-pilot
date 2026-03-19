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
              {t(lang, "解锁完整创作能力", "Unlock full creative control")}
            </h1>
            <p style={subtitle}>
              {t(
                lang,
                "免费开始，Pro 解锁专业工作流，积分驱动 AI 生成",
                "Start free. Unlock pro workflow. Credits power AI generation."
              )}
            </p>
          </header>

          {/* 区块2：Free vs Pro 对比卡片 */}
          <section style={section}>
            <div style={compareGrid}>
              <article style={card}>
                <div style={tierTitle}>{t(lang, "免费", "Free")}</div>
                <div style={cardPrice}>$0</div>
                <div style={cardLabel}>{t(lang, "基础场景搭建工具", "Scene structure tools")}</div>
                <ul style={featureList}>
                  <li>{t(lang, "✓ 场景结构编辑器", "✓ Scene structure editor")}</li>
                  <li>{t(lang, "✓ 对象布局与坐标系", "✓ Object placement & layout")}</li>
                  <li>{t(lang, "✓ 提示词导出（永久免费）", "✓ Prompt export (always free)")}</li>
                  <li>{t(lang, "✓ 免费模版", "✓ Free templates")}</li>
                </ul>
                <ul style={limitList}>
                  <li>{t(lang, "· 最多 3 个项目", "· Up to 3 projects")}</li>
                  <li>{t(lang, "· 不含 AI 生成", "· No AI generation")}</li>
                </ul>
              </article>

              <article style={{ ...card, ...cardPro }}>
                <div style={badge}>{t(lang, "推荐", "Recommended")}</div>
                <div style={tierTitle}>⬡ Pro</div>
                <div style={cardPrice}>
                  $12 <span style={priceMeta}>{t(lang, "/ 月", "/ mo")}</span>
                </div>
                <div style={cardLabel}>
                  {t(
                    lang,
                    "含 700 积分/月，AI 生成按积分计费",
                    "Includes 700 credits/month · AI uses credits"
                  )}
                </div>
                <ul style={featureList}>
                  <li>{t(lang, "✓ 完整场景编辑器（含专业字段）", "✓ Full scene editor with pro fields")}</li>
                  <li>{t(lang, "✓ 无限项目", "✓ Unlimited projects")}</li>
                  <li>{t(lang, "✓ 参考图上传", "✓ Reference image upload")}</li>
                  <li>{t(lang, "✓ 多分镜连续调度", "✓ Multi-scene continuity workflow")}</li>
                  <li>{t(lang, "✓ 专业镜头语言 & 导演风格包", "✓ Pro camera language & director packs")}</li>
                  <li>{t(lang, "✓ 每月赠送 700 AI 积分", "✓ 700 AI credits every month")}</li>
                  <li>{t(lang, "✓ 付费模版无限使用", "✓ Unlimited paid templates")}</li>
                </ul>
                <button
                  type="button"
                  style={btnPrimary}
                  onClick={() => window.open(WHOP_PRO_URL, "_blank")}
                >
                  {t(lang, "订阅 Pro", "Subscribe to Pro")}
                </button>
              </article>
            </div>
          </section>

          {/* 区块3：积分包 */}
          <section style={section}>
            <h2 style={sectionTitle}>{t(lang, "购买积分", "Buy Credits")}</h2>
            <p style={sectionSub}>
              {t(
                lang,
                "提示词导出永久免费。积分用于 AI 生成和付费模版。",
                "Prompt export is always free. Credits are used for AI generation and paid templates."
              )}
            </p>
            <div style={creditsGrid}>
              {CREDIT_PACKS.map((pack) => (
                <article key={pack.url} style={card}>
                  <div style={cardPrice}>${pack.usd}</div>
                  <div style={cardLabel}>{pack.credits} {t(lang, "积分", "Credits")}</div>
                  <button
                    type="button"
                    style={btnSecondary}
                    onClick={() => window.open(pack.url, "_blank")}
                  >
                    {t(lang, "购买", "Buy")}
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* 区块4：积分用量参考 */}
          <section style={section}>
            <h2 style={sectionTitle}>{t(lang, "积分用量", "Credit usage")}</h2>
            <div style={usageTable}>
              <div style={usageRow}>
                <span>{t(lang, "标准图片生成 / Standard image", "Standard image / 标准图片生成")}</span>
                <strong>{t(lang, "1 积分", "1 credit")}</strong>
              </div>
              <div style={usageRow}>
                <span>{t(lang, "高清图片生成 / HD image", "HD image / 高清图片生成")}</span>
                <strong>{t(lang, "3 积分", "3 credits")}</strong>
              </div>
              <div style={usageRow}>
                <span>{t(lang, "视频生成 / Video", "Video / 视频生成")}</span>
                <strong>{t(lang, "20 积分", "20 credits")}</strong>
              </div>
              <div style={usageRow}>
                <span>{t(lang, "付费模版 / Paid template", "Paid template / 付费模版")}</span>
                <strong>{t(lang, "1–3 积分（按模版）", "1–3 credits (per template)")}</strong>
              </div>
            </div>
          </section>

          {/* 区块5：底部说明 */}
          <footer style={footerWrap}>
            <p style={footnote}>
              {t(
                lang,
                "提示词导出永久免费，不消耗积分。Pro 积分每月自动补充，不使用不累积。结算由 Paddle 处理。",
                "Prompt export is always free. Pro credits refresh monthly and do not roll over. Checkout by Paddle."
              )}
            </p>
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
const subtitle: CSSProperties = {
  margin: "10px 0 0",
  color: C.muted,
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: 780,
};

const section: CSSProperties = { marginBottom: 40, paddingTop: 24 };
const sectionTitle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 18,
  fontWeight: 700,
  color: C.text,
};
const sectionSub: CSSProperties = {
  margin: "0 0 16px",
  color: C.muted,
  fontSize: 14,
  lineHeight: 1.65,
};

const compareGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const creditsGrid: CSSProperties = {
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
const cardPro: CSSProperties = {
  border: `1px solid ${C.accent}`,
  boxShadow: "none",
};
const badge: CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 11,
  fontWeight: 700,
  color: "#1f2125",
  background: C.accent,
  borderRadius: 999,
  padding: "3px 10px",
};
const tierTitle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: C.text,
};

const cardPrice: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: C.text,
};
const priceMeta: CSSProperties = {
  fontSize: 15,
  color: C.muted,
  fontWeight: 600,
};

const cardLabel: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: C.muted,
  lineHeight: 1.5,
};
const featureList: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: C.text,
  fontSize: 14,
  lineHeight: 1.5,
};
const limitList: CSSProperties = {
  listStyle: "none",
  margin: "4px 0 0",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  color: C.muted,
  fontSize: 13,
  lineHeight: 1.5,
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
const btnSecondary: CSSProperties = {
  ...btnPrimary,
  background: C.card,
  color: C.accent,
};

const usageTable: CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  overflow: "hidden",
};
const usageRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderBottom: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 14,
};

const footerWrap: CSSProperties = {
  marginTop: 48,
  paddingTop: 24,
  borderTop: `1px solid ${C.border}`,
  textAlign: "center",
};
const footnote: CSSProperties = {
  margin: "0 0 10px",
  color: C.muted,
  fontSize: 12,
  lineHeight: 1.65,
};

const footerLink: CSSProperties = {
  color: C.muted,
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 500,
};
