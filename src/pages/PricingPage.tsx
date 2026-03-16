import { useEffect, useState, type CSSProperties } from "react";
import type { Lang } from "../i18n";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";
import {
  PRICING_FINAL_CREDIT_PACKS,
  PRO_PLAN,
  launchCheckout,
  isBillingEnabled,
} from "../services/billingService";
import { getWalletState } from "../services/creditService";
import { getCurrentUser } from "../services/authService";
import type { CreditPackConfig } from "../types/billing";
import type { UserState } from "../types/account";

const APP_SIGNIN_HREF = "/app?signin=1";
const APP_HREF = "/app";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function TierCard({
  title,
  subtitle,
  bullets,
  note,
  ctaLabel,
  ctaHref,
  ctaPrimary,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  note?: string;
  ctaLabel: string;
  ctaHref: string;
  ctaPrimary?: boolean;
}) {
  const isExternal = ctaHref.startsWith("mailto:");
  return (
    <article style={tierCard}>
      <h3 style={tierTitle}>{title}</h3>
      <p style={tierSubtitle}>{subtitle}</p>
      <ul style={tierBullets}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {note ? <p style={tierNote}>{note}</p> : null}
      <a
        href={ctaHref}
        style={{ ...tierCta, ...(ctaPrimary ? tierCtaPrimary : tierCtaGhost) }}
      >
        {ctaLabel}
      </a>
    </article>
  );
}

function CreditPackCard({
  pack,
  ctaLabel,
  onBuy,
  isLoggedIn,
  creditsLabel,
}: {
  pack: CreditPackConfig;
  ctaLabel: string;
  onBuy: () => void;
  isLoggedIn: boolean;
  creditsLabel: string;
}) {
  return (
    <article style={creditRechargeCard}>
      <div style={creditCardPrice}>${pack.usdPrice}</div>
      <div style={creditCardLabel}>{pack.credits} {creditsLabel}</div>
      {isLoggedIn ? (
        <button type="button" style={creditCtaBtn} onClick={onBuy}>
          {ctaLabel}
        </button>
      ) : (
        <a href={APP_SIGNIN_HREF} style={creditCtaBtn}>
          {ctaLabel}
        </a>
      )}
    </article>
  );
}

function BalanceDisplay({
  balance,
  lang,
}: {
  balance: number | null;
  lang: Lang;
}) {
  if (balance === null) return null;
  return (
    <div style={balanceWrap}>
      <span style={balanceLabel}>{t(lang, "余额", "Balance")}</span>
      <span style={balanceValue}>{balance} {t(lang, "积分", "Credits")}</span>
    </div>
  );
}

function getFreeBullets(lang: Lang): string[] {
  return lang === "zh"
    ? [
        "免费模板",
        "完整 Pro 工作台",
        "编辑结构、对象、镜头与光影",
        "查看与复制提示词",
        "导出提示词与参考包",
      ]
    : [
        "Free templates",
        "Full Pro workspace access",
        "Edit structure, objects, camera & lighting",
        "View and copy prompts",
        "Export prompt and reference packs",
      ];
}

function getProBullets(lang: Lang): string[] {
  return lang === "zh"
    ? [
        "高级模板层（Pro + 积分模板）",
        "隐藏镜头语言包",
        "导演包",
        "连续镜头 / 多镜包",
        "接入自有 fal / Runway API",
        "每月 700 积分",
      ]
    : [
        "Advanced template layer (Pro + Credits templates)",
        "Hidden camera language packs",
        "Director packs",
        "Continuity / multi-shot packs",
        "Connect your own fal / Runway API",
        "700 monthly Credits included",
      ];
}

function getEnterpriseBullets(lang: Lang): string[] {
  return lang === "zh"
    ? ["定制模板库", "品牌与流程定制", "团队协作", "专属支持"]
    : [
        "Custom template libraries",
        "Brand and workflow customization",
        "Team collaboration",
        "Dedicated support",
      ];
}

function getFaqItems(lang: Lang): { q: string; a: string }[] {
  return lang === "zh"
    ? [
        {
          q: "为什么在这里付费，而不是在其他平台生成？",
          a: "ScenePilot 提供可在多平台复用的结构化提示词与场景控制。你为高级模板和可选托管生成付费；提示词与结构免费。也可接入自有 API，仅为模板付费。",
        },
        {
          q: "可以使用自己的 API 吗？",
          a: "可以。Pro 支持接入自有 fal 或 Runway API。通过自有 API 生成不消耗积分；仅模板会消耗积分。",
        },
        {
          q: "Pro 包含什么？",
          a: "Pro 解锁高级模板层（Pro + 积分模板）、隐藏镜头语言包、导演包、连续/多镜包，以及接入自有 API。每月含 700 积分。",
        },
        {
          q: "提示词会消耗积分吗？",
          a: "不会。提示词与结构免费。仅模板与托管生成消耗积分。",
        },
        {
          q: "积分会结转吗？",
          a: "账单周期内未使用的积分不结转。请在周期内使用，或购买积分包获得更长有效期的余额。",
        },
      ]
    : [
        {
          q: "Why pay here if I can generate on other platforms?",
          a: "ScenePilot gives you structured prompts and scene control that work across platforms. You pay for advanced templates and optional hosted generation; prompts and structure are free. You can also connect your own API and only pay for templates.",
        },
        {
          q: "Can I use my own API?",
          a: "Yes. Pro lets you connect your own fal or Runway API. Generation through your API does not consume Credits; only templates consume Credits.",
        },
        {
          q: "What does Pro unlock?",
          a: "Pro unlocks the advanced template layer (Pro + Credits templates), hidden camera language packs, director packs, continuity and multi-shot packs, and the ability to connect your own API. It also includes 700 Credits per month.",
        },
        {
          q: "Do prompts cost Credits?",
          a: "No. Prompts and structure are free. Only templates and hosted generation consume Credits.",
        },
        {
          q: "Do unused Credits roll over?",
          a: "Unused Credits do not roll over at the end of the billing period. Use them within the period or purchase Credit Packs for balance that does not expire the same way.",
        },
      ];
}

export default function PricingPage() {
  const [lang, setLang] = useLocalLang();
  const [user, setUser] = useState<UserState | null>(null);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let alive = true;
    void getCurrentUser()
      .then((u) => {
        if (!alive) return;
        setUser(u);
      })
      .catch(() => {
        if (!alive) return;
        setUser(null);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCreditsBalance(null);
      return;
    }
    let alive = true;
    void getWalletState(user.id)
      .then((wallet) => {
        if (!alive) return;
        setCreditsBalance(wallet.creditsBalance);
      })
      .catch(() => {
        if (!alive) return;
        setCreditsBalance(null);
      });
    return () => { alive = false; };
  }, [user?.id]);

  const handleBuyCredit = async (pack: CreditPackConfig) => {
    if (!user?.id || buying || !isBillingEnabled()) return;
    setBuying(true);
    try {
      const { completedUser } = await launchCheckout({
        userId: user.id,
        kind: "credits",
        productId: pack.id,
        userEmail: user.email ?? undefined,
      });
      if (completedUser) {
        const wallet = await getWalletState(user.id);
        setCreditsBalance(wallet.creditsBalance);
      }
    } finally {
      setBuying(false);
    }
  };

  const creditPacks = PRICING_FINAL_CREDIT_PACKS.filter((p) => p.enabled);
  const isLoggedIn = Boolean(user?.id);

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
            {t(lang, "结构化创作，简单定价", "Simple pricing for structured creation")}
          </h1>
        </header>

        {/* Plans */}
        <section style={section}>
          <h2 style={sectionTitle}>{t(lang, "方案", "Plans")}</h2>
          <div style={tiersGrid}>
            <TierCard
              title={t(lang, "免费", "Free")}
              subtitle={t(lang, "零成本入门", "Get started with no cost")}
              bullets={getFreeBullets(lang)}
              ctaLabel={t(lang, "免费开始", "Start Free")}
              ctaHref={APP_SIGNIN_HREF}
            />
            <TierCard
              title="Pro"
              subtitle={
                lang === "zh"
                  ? `$${PRO_PLAN.monthlyUsdPrice} / 月 · 含 ${PRO_PLAN.monthlyCredits} 积分`
                  : `$${PRO_PLAN.monthlyUsdPrice} / month · ${PRO_PLAN.monthlyCredits} Credits included`
              }
              bullets={getProBullets(lang)}
              ctaLabel={t(lang, "升级 Pro", "Upgrade to Pro")}
              ctaHref={isLoggedIn ? "/account?section=pro" : APP_SIGNIN_HREF}
              ctaPrimary
            />
            <TierCard
              title={t(lang, "企业 / 定制", "Enterprise / Custom")}
              subtitle={t(lang, "面向团队与品牌", "For teams and brands")}
              bullets={getEnterpriseBullets(lang)}
              note={t(
                lang,
                "定制模板、工作流与支持请联系我们。",
                "Contact us for custom templates, workflows, and support."
              )}
              ctaLabel={t(lang, "联系我们", "Contact us")}
              ctaHref={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`}
            />
          </div>
        </section>

        {/* Credit Packs */}
        <section style={section}>
          <h2 style={sectionTitle}>{t(lang, "积分包", "Credit Packs")}</h2>
          {isLoggedIn && <BalanceDisplay balance={creditsBalance} lang={lang} />}
          <div style={creditsRechargeGrid}>
            {creditPacks[0] && (
              <CreditPackCard
                pack={creditPacks[0]}
                ctaLabel={
                  lang === "zh"
                    ? `购买 ${creditPacks[0].credits} 积分`
                    : `Buy ${creditPacks[0].credits} Credits`
                }
                onBuy={() => handleBuyCredit(creditPacks[0])}
                isLoggedIn={isLoggedIn}
                creditsLabel={t(lang, "积分", "Credits")}
              />
            )}
            {creditPacks[1] && (
              <CreditPackCard
                pack={creditPacks[1]}
                ctaLabel={
                  lang === "zh"
                    ? `购买 ${creditPacks[1].credits} 积分`
                    : `Buy ${creditPacks[1].credits} Credits`
                }
                onBuy={() => handleBuyCredit(creditPacks[1])}
                isLoggedIn={isLoggedIn}
                creditsLabel={t(lang, "积分", "Credits")}
              />
            )}
            {creditPacks[2] && (
              <CreditPackCard
                pack={creditPacks[2]}
                ctaLabel={
                  lang === "zh"
                    ? `购买 ${creditPacks[2].credits} 积分`
                    : `Buy ${creditPacks[2].credits} Credits`
                }
                onBuy={() => handleBuyCredit(creditPacks[2])}
                isLoggedIn={isLoggedIn}
                creditsLabel={t(lang, "积分", "Credits")}
              />
            )}
          </div>
        </section>

        {/* How Credits Work */}
        <section style={section}>
          <h2 style={sectionTitle}>{t(lang, "积分说明", "How Credits Work")}</h2>
          <ul style={howCreditsList}>
            <li>{t(lang, "提示词免费。", "Prompts are free.")}</li>
            <li>{t(lang, "结构免费。", "Structure is free.")}</li>
            <li>
              {t(
                lang,
                "仅模板与托管生成消耗积分。",
                "Only templates and hosted generation consume Credits."
              )}
            </li>
            <li>
              {t(
                lang,
                "使用自有 API 不消耗生成积分（应用模板时仍会消耗积分）。",
                "Using your own API does not consume generation Credits (templates still consume Credits when you apply them)."
              )}
            </li>
            <li>
              {t(
                lang,
                "换算参考：标准图 3 Credits/张（约 1 Credits = 1/3 张）；高清图 5 Credits/张（约 1 Credits = 1/5 张）。",
                "Conversion reference: Standard image is 3 Credits (≈ 1 Credit = 1/3 image); HD image is 5 Credits (≈ 1 Credit = 1/5 image)."
              )}
            </li>
          </ul>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, opacity: 0.72 }}>
              {t(lang, "消耗参考", "Credits reference")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 12 }}>
              <span style={{ opacity: 0.6 }}>{t(lang, "标准图像生成", "Standard image")}</span>
              <span style={{ fontWeight: 700 }}>3 Credits / {t(lang, "张", "image")}</span>
              <span style={{ opacity: 0.6 }}>{t(lang, "高质量图像生成", "HD image")}</span>
              <span style={{ fontWeight: 700 }}>5 Credits / {t(lang, "张", "image")}</span>
              <span style={{ opacity: 0.6 }}>{t(lang, "标准视频生成", "Standard video")}</span>
              <span style={{ fontWeight: 700 }}>5 Credits / {t(lang, "条", "clip")}</span>
              <span style={{ opacity: 0.6 }}>{t(lang, "高质量视频生成", "HD video")}</span>
              <span style={{ fontWeight: 700 }}>12 Credits / {t(lang, "条", "clip")}</span>
              <span style={{ opacity: 0.6 }}>{t(lang, "免费模板", "Free template")}</span>
              <span style={{ fontWeight: 700 }}>0 Credits</span>
              <span style={{ opacity: 0.6 }}>{t(lang, "付费模板（按复杂度）", "Paid template")}</span>
              <span style={{ fontWeight: 700 }}>1 – 20 Credits</span>
            </div>
          </div>
        </section>

        {/* Template Access Levels */}
        <section style={section}>
          <h2 style={sectionTitle}>
            {t(lang, "模板访问层级", "Template Access Levels")}
          </h2>
          <div style={templateTiers}>
            <div style={templateTierCard}>
              <h4 style={templateTierTitle}>
                {t(lang, "免费模板", "Free Templates")}
              </h4>
              <p style={templateTierDesc}>
                {t(lang, "免费 · 0 积分", "Free · 0 Credits")}
              </p>
            </div>
            <div style={templateTierCard}>
              <h4 style={templateTierTitle}>
                {t(lang, "积分模板", "Credits Templates")}
              </h4>
              <p style={templateTierDesc}>
                {t(
                  lang,
                  "所有用户可用 · 按模板层级 1 或 2 积分",
                  "Available to all users · 1 or 2 Credits depending on template tier"
                )}
              </p>
            </div>
            <div style={templateTierCard}>
              <h4 style={templateTierTitle}>
                {t(lang, "Pro + 积分模板", "Pro + Credits Templates")}
              </h4>
              <p style={templateTierDesc}>
                {t(
                  lang,
                  "需 Pro · 2 或 3 积分 · 高级镜头语言、导演包、连续包、高级运动包",
                  "Requires Pro · 2 or 3 Credits · Advanced camera language, director packs, continuity packs, advanced motion packs"
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Hosted vs Your Own API */}
        <section style={section}>
          <h2 style={sectionTitle}>
            {t(lang, "托管生成 vs 自有 API", "Hosted vs Your Own API")}
          </h2>
          <div style={hostedByoGrid}>
            <div style={hostedByoCard}>
              <h4 style={hostedByoTitle}>
                {t(lang, "托管生成", "Hosted generation")}
              </h4>
              <p style={hostedByoText}>
                {t(
                  lang,
                  "最省心、全集成。消耗积分：标准图 3、高清图 5、快剪视频 5/秒、高清视频 12/秒。",
                  "Easiest, fully integrated. Consumes Credits: Standard Image 3, High Quality Image 5, Fast Video 5/sec, High Quality Video 12/sec."
                )}
              </p>
            </div>
            <div style={hostedByoCard}>
              <h4 style={hostedByoTitle}>
                {t(lang, "自有 API", "Your own API")}
              </h4>
              <p style={hostedByoText}>
                {t(
                  lang,
                  "Pro 功能。接入 fal 或 Runway；生成不消耗积分。应用模板时仍消耗积分。",
                  "Pro feature. Connect fal or Runway; generation does not consume Credits. Templates still consume Credits when you apply them."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Hosted generation pricing detail */}
        <section style={section}>
          <h2 style={sectionTitle}>
            {t(lang, "托管生成价格", "Hosted Generation Pricing")}
          </h2>
          <div style={usageGrid}>
            <div style={usageRow}>
              <span>{t(lang, "标准图", "Standard Image")}</span>
              <span>3 {t(lang, "积分", "Credits")}</span>
            </div>
            <div style={usageRow}>
              <span>{t(lang, "高清图", "High Quality Image")}</span>
              <span>5 {t(lang, "积分", "Credits")}</span>
            </div>
            <div style={usageRow}>
              <span>{t(lang, "快剪视频", "Fast Video")}</span>
              <span>5 {t(lang, "积分", "Credits")} / {t(lang, "秒", "second")}</span>
            </div>
            <div style={usageRow}>
              <span>{t(lang, "高清视频", "High Quality Video")}</span>
              <span>12 {t(lang, "积分", "Credits")} / {t(lang, "秒", "second")}</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={section}>
          <h2 style={sectionTitle}>{t(lang, "常见问题", "FAQ")}</h2>
          <div style={faqList}>
            {getFaqItems(lang).map((item) => (
              <div key={item.q} style={faqItem}>
                <div style={faqQ}>{item.q}</div>
                <div style={faqA}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={bottomCtaSection}>
          <p style={bottomCtaText}>
            {t(
              lang,
              "结构化创作，而非试错。免费开始，需要高级模板与托管生成时再升级。",
              "Structured creation, not trial and error. Start free, upgrade when you need advanced templates and hosted generation."
            )}
          </p>
          <a href={APP_SIGNIN_HREF} style={bottomCtaBtn}>
            {t(lang, "免费开始", "Start Free")}
          </a>
        </section>
        </StandalonePageChrome>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  color: "var(--spx-text-1)",
  background: "radial-gradient(860px 460px at 12% -16%, rgba(83,146,226,0.18), transparent 62%), var(--spx-bg-app)",
};

const surface: CSSProperties = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "32px 20px 52px",
};

const hero: CSSProperties = {
  marginBottom: 40,
};

const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4.5vw, 44px)",
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
};

const section: CSSProperties = {
  marginBottom: 40,
  paddingTop: 24,
};

const sectionTitle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

const balanceWrap: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
  padding: "10px 16px",
  background: "var(--spx-surface-2)",
  borderRadius: 12,
};

const balanceLabel: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 13,
};

const balanceValue: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const tiersGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const tierCard: CSSProperties = {
  background: "var(--spx-surface-1)",
  borderRadius: 18,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const tierTitle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
};

const tierSubtitle: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: 14,
  lineHeight: 1.5,
};

const tierBullets: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "var(--spx-text-2)",
  fontSize: 13.5,
  lineHeight: 1.7,
  flex: 1,
};

const tierNote: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  lineHeight: 1.55,
};

const tierCta: CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  padding: "0 20px",
  fontWeight: 650,
  fontSize: 14,
  marginTop: 8,
};

const tierCtaPrimary: CSSProperties = {
  color: "#1a1208",
  background: "#f59e0b"
};

const tierCtaGhost: CSSProperties = {
  color: "var(--spx-text-1)",
  background: "var(--spx-surface-2)",
};

const creditsRechargeGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 20,
  marginTop: 20,
};

const creditRechargeCard: CSSProperties = {
  background: "var(--spx-surface-1)",
  borderRadius: 16,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const creditCardPrice: CSSProperties = {
  fontSize: 32,
  fontWeight: 750,
  letterSpacing: "-0.02em",
};

const creditCardLabel: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "var(--spx-text-2)",
};

const creditCtaBtn: CSSProperties = {
  minHeight: 42,
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  padding: "0 16px",
  fontWeight: 650,
  fontSize: 14,
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-1)",
  border: "none",
  cursor: "pointer",
  marginTop: 4,
};

const howCreditsList: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: "var(--spx-text-2)",
  fontSize: 15,
  lineHeight: 1.8,
};

const templateTiers: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const templateTierCard: CSSProperties = {
  padding: "16px 18px",
  background: "var(--spx-surface-1)",
  borderRadius: 12,
};

const templateTierTitle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: 15,
  fontWeight: 700,
};

const templateTierDesc: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "var(--spx-text-2)",
  lineHeight: 1.55,
};

const hostedByoGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const hostedByoCard: CSSProperties = {
  padding: "18px 20px",
  background: "var(--spx-surface-1)",
  borderRadius: 12,
};

const hostedByoTitle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 700,
};

const hostedByoText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "var(--spx-text-2)",
  lineHeight: 1.6,
};

const usageGrid: CSSProperties = {
  display: "grid",
  gap: 10,
};

const usageRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  background: "var(--spx-surface-1)",
  borderRadius: 10,
  color: "var(--spx-text-2)",
  fontSize: 14,
};

const faqList: CSSProperties = {
  display: "grid",
  gap: 14,
};

const faqItem: CSSProperties = {
  padding: "14px 16px",
  background: "var(--spx-surface-1)",
  borderRadius: 12,
};

const faqQ: CSSProperties = {
  fontWeight: 640,
  fontSize: 14,
  marginBottom: 8,
};

const faqA: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 13.5,
  lineHeight: 1.6,
};

const bottomCtaSection: CSSProperties = {
  marginTop: 48,
  paddingTop: 32,
  borderTop: "1px solid var(--spx-border)",
  textAlign: "center",
};

const bottomCtaText: CSSProperties = {
  margin: "0 0 20px",
  color: "var(--spx-text-2)",
  fontSize: 16,
  lineHeight: 1.65,
};

const bottomCtaBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 28px",
  borderRadius: 12,
  background: "#f59e0b",
  color: "#1a1208",
  textDecoration: "none",
  fontSize: 15,
  fontWeight: 650,
};
