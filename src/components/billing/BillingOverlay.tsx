import React from "react";
import { createPortal } from "react-dom";
import { Check, CreditCard, Crown, UserRound, X } from "lucide-react";
import type { Lang } from "../../i18n";
import type { UserState } from "../../types/account";
import type { CreditPackConfig, ProPlanConfig } from "../../types/billing";
import { LEGAL_DOCS, legalText, type LegalDocId } from "../../content/legal";
import { PUBLIC_CONTACT_CHANNELS } from "../../config/contactChannels";

type BillingPage = "upgrade" | "credits";

type Props = {
  open: boolean;
  page: BillingPage | null;
  lang: Lang;
  user: UserState | null;
  billingEnabled: boolean;
  billingNotice: string;
  creditsBalance: number;
  creditPacks: CreditPackConfig[];
  proPlan: ProPlanConfig | null;
  billingBusy: boolean;
  billingLegalAccepted: boolean;
  onClose: () => void;
  onOpenUpgrade: () => void;
  onOpenCredits: () => void;
  onRequireAuth: () => void;
  onBillingLegalAcceptedChange: (value: boolean) => void;
  onUpgrade: () => void;
  onBuyCredits: (packId: string) => void;
  onManageBilling: () => void;
};

const t = (lang: Lang, zh: string, en: string) => lang === "zh" ? zh : en;

export function BillingOverlay(props: Props) {
  const {
    open, page, lang, user, billingEnabled, billingNotice,
    creditsBalance, creditPacks, proPlan, billingBusy,
    billingLegalAccepted, onClose, onOpenUpgrade, onOpenCredits,
    onRequireAuth, onBillingLegalAcceptedChange,
    onUpgrade, onBuyCredits, onManageBilling
  } = props;

  const [activeLegalDoc, setActiveLegalDoc] = React.useState<LegalDocId | null>(null);
  const legalDoc = activeLegalDoc ? LEGAL_DOCS[activeLegalDoc] : null;

  const isPro = user?.tier === "pro";
  const monthlyPrice = proPlan?.monthlyUsdPrice ?? 12;
  const monthlyCredits = proPlan?.monthlyCredits ?? 700;

  if (!open || !page) return null;

  const LegalFooter = () => (
    <div style={s.legalCard}>
      <label style={s.checkboxRow}>
        <input
          type="checkbox"
          checked={billingLegalAccepted}
          onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
          data-testid="billing-legal-consent"
        />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
          {t(lang,
            "继续即表示同意《付费条款》《退款政策》《服务协议》《隐私说明》。支付服务商与商户信息以下单页展示为准。",
            "By continuing you agree to the Billing Terms, Refund Policy, Terms of Service, and Privacy Notice. Payment provider and merchant details are governed by the checkout page."
          )}
        </span>
      </label>
      <div style={s.legalLinks}>
        {(["billing", "refund"] as LegalDocId[]).map(id => (
          <button key={id} type="button" style={s.legalLinkBtn} onClick={() => setActiveLegalDoc(id)}>
            {legalText("en", LEGAL_DOCS[id].title)}
          </button>
        ))}
        {[{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }].map(l => (
          <a key={l.href} href={l.href} style={s.legalLinkBtn as React.CSSProperties}>{l.label}</a>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
        {t(lang, "支持：", "Support: ")}{PUBLIC_CONTACT_CHANNELS.support}
      </div>
    </div>
  );

  return createPortal(
    <div style={s.mask} onMouseDown={onClose} role="presentation">
      <div style={s.sheet} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}>

        {/* Header */}
        <div style={s.head}>
          <div>
            <div style={s.eyebrow}>
              {t(lang, "会员与积分", "Plans & Credits")}
            </div>
            <div style={s.title}>
              {page === "upgrade"
                ? t(lang, "解锁完整创作能力", "Unlock full creative control")
                : t(lang, "购买 AI 积分", "Buy AI credits")}
            </div>
          </div>
          <div style={s.headActions}>
            <button type="button" style={{ ...s.tab, ...(page === "upgrade" ? s.tabOn : {}) }} onClick={onOpenUpgrade}>
              {t(lang, "会员方案", "Plans")}
            </button>
            <button type="button" style={{ ...s.tab, ...(page === "credits" ? s.tabOn : {}) }} onClick={onOpenCredits}>
              {t(lang, "购买积分", "Credits")}
            </button>
            {isPro && (
              <button type="button" style={s.tab} onClick={onManageBilling} disabled={!billingEnabled || billingBusy}>
                {t(lang, "管理订阅", "Manage")}
              </button>
            )}
            <button type="button" style={s.iconBtn} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {billingNotice && (
          <div style={s.noticeBanner}>{billingNotice}</div>
        )}

        {/* Upgrade page */}
        {page === "upgrade" && (
          <section style={s.content}>
            <div style={s.priceGrid}>

              {/* Free card */}
              <article style={s.priceCard}>
                <div style={s.priceTier}>{t(lang, "免费", "Free")}</div>
                <div style={s.priceValue}>$0</div>
                <div style={s.priceMeta}>{t(lang, "基础场景搭建工具", "Scene structure tools")}</div>
                <div style={s.divider} />
                <ul style={s.list}>
                  <li>{t(lang, "场景结构编辑器", "Scene structure editor")}</li>
                  <li>{t(lang, "对象布局与坐标系", "Object placement & layout")}</li>
                  <li>{t(lang, "提示词导出（永久免费）", "Prompt export (always free)")}</li>
                  <li>{t(lang, "免费模版", "Free templates")}</li>
                </ul>
                <div style={s.divider} />
                <ul style={{ ...s.list, color: "rgba(255,255,255,0.45)" }}>
                  <li>{t(lang, "最多 3 个项目", "Up to 3 projects")}</li>
                  <li>{t(lang, "不含执行能力", "No execution features")}</li>
                </ul>
              </article>

              {/* Pro card */}
              <article style={{ ...s.priceCard, ...s.priceCardOn }}>
                <div style={s.priceBadge}>{t(lang, "推荐", "Recommended")}</div>
                <div style={s.priceTier}><Crown size={16} style={{ color: "#f59e0b" }} /> Pro</div>
                <div style={s.priceValue}>
                  ${monthlyPrice}
                  <span style={s.pricePer}>{t(lang, " / 月", " / mo")}</span>
                </div>
                <div style={s.priceMeta}>
                  {t(lang, `含 ${monthlyCredits} 积分 / 月，用于模板与高级功能`, `Includes ${monthlyCredits} credits / month for templates and advanced features`)}
                </div>
                <div style={s.divider} />
                <ul style={s.list}>
                  <li>{t(lang, "完整场景编辑器（含专业字段）", "Full scene editor with pro fields")}</li>
                  <li>{t(lang, "无限项目", "Unlimited projects")}</li>
                  <li>{t(lang, "参考图上传", "Reference image upload")}</li>
                  <li>{t(lang, "多分镜连续调度", "Multi-scene continuity workflow")}</li>
                  <li>{t(lang, "本地生成接入（Draw Things / ComfyUI）", "Local generation connectors (Draw Things / ComfyUI)")}</li>
                  <li>{t(lang, "专业镜头语言 & 导演风格包", "Pro camera language & director packs")}</li>
                  <li>{t(lang, `每月赠送 ${monthlyCredits} AI 积分`, `${monthlyCredits} AI credits every month`)}</li>
                  <li>{t(lang, "付费模版无限使用", "Unlimited paid templates")}</li>
                </ul>
                <div style={s.divider} />
                {!user ? (
                  <button type="button" style={s.ghostBtn} onClick={onRequireAuth}>
                    <UserRound size={14} />
                    {t(lang, "登录后升级", "Sign in to upgrade")}
                  </button>
                ) : isPro ? (
                  <button type="button" style={{ ...s.primaryBtn, opacity: 0.5, cursor: "default" }} disabled>
                    {t(lang, "当前方案", "Current plan")}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={s.primaryBtn}
                    onClick={onUpgrade}
                    disabled={!billingEnabled || billingBusy || !billingLegalAccepted}
                  >
                    {t(lang, "升级到 Pro", "Upgrade to Pro")}
                  </button>
                )}
              </article>
            </div>

            <div style={s.noteCard}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                {t(lang,
                  "· 提示词导出永久免费，不消耗积分。\n· 平台不代你支付第三方 API 或本地生成成本。\n· Pro 会员每月自动补充积分，不使用不累积。",
                  "· Prompt export is always free — no credits needed.\n· The platform does not pay third-party API or local-generation costs for you.\n· Pro credits refresh monthly and do not roll over."
                ).split("\n").map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>

            <LegalFooter />
          </section>
        )}

        {/* Credits page */}
        {page === "credits" && (
          <section style={s.content}>
            <div style={s.balanceCard}>
              <div style={s.balanceLabel}>{t(lang, "当前积分余额", "Credits balance")}</div>
              <div style={s.balanceValue}>{creditsBalance.toLocaleString()}</div>
            </div>

            <div style={s.priceGrid}>
              {creditPacks.map((pack) => (
                <article key={pack.id} style={s.priceCard}>
                  <div style={s.priceTier}><CreditCard size={15} /> {pack.credits.toLocaleString()} {t(lang, "积分", "credits")}</div>
                  <div style={s.priceValue}>${pack.usdPrice}</div>
                  <div style={s.priceMeta}>{t(lang, "一次性购买", "One-time purchase")}</div>
                  <div style={s.divider} />
                  {!user ? (
                    <button type="button" style={s.ghostBtn} onClick={onRequireAuth}>
                      <UserRound size={14} />
                      {t(lang, "登录后购买", "Sign in to buy")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={s.primaryBtn}
                      onClick={() => onBuyCredits(pack.id)}
                      disabled={!billingEnabled || billingBusy || !billingLegalAccepted}
                    >
                      {t(lang, "购买", "Buy")}
                    </button>
                  )}
                </article>
              ))}
            </div>

            <div style={s.noteCard}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                {t(lang, "积分用量参考", "Credit usage")}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  [t(lang, "高级模版", "Advanced templates"), t(lang, "按模版显示", "Shown per template")],
                  [t(lang, "工作流附加能力", "Workflow add-ons"), t(lang, "按功能显示", "Shown per feature")],
                  [t(lang, "未来站内能力", "Future in-product features"), t(lang, "按功能显示", "Shown per feature")],
                  [t(lang, "第三方 API / 本地生成", "Third-party API / local generation"), t(lang, "不由平台计费", "Not billed by the platform")],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                    <span>{label}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <LegalFooter />
          </section>
        )}

        {/* Legal doc modal */}
        {legalDoc && (
          <div style={s.legalModalMask} onMouseDown={() => setActiveLegalDoc(null)} role="presentation">
            <div style={s.legalModal} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}>
              <div style={s.legalModalHead}>
                <div>
                  <div style={s.eyebrow}>{legalText("en", legalDoc.title)}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                    {`${legalDoc.version} · ${legalDoc.updatedAt}`}
                  </div>
                </div>
                <button type="button" style={s.iconBtn} onClick={() => setActiveLegalDoc(null)}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: "12px 18px 0", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                {legalText("en", legalDoc.summary)}
              </div>
              <div style={{ overflowY: "auto", padding: 18, display: "grid", gap: 16 }}>
                {legalDoc.sections.map((item) => (
                  <section key={legalText("en", item.heading)}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{legalText("en", item.heading)}</div>
                    {item.body.map((p) => (
                      <p key={legalText("en", p)} style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                        {legalText("en", p)}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const s: Record<string, React.CSSProperties> = {
  mask: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(16px)",
    zIndex: 120, padding: 20,
    display: "grid", placeItems: "center"
  },
  sheet: {
    width: "min(900px, calc(100vw - 40px))",
    maxHeight: "min(90vh, 900px)",
    overflowY: "auto",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(10,11,16,0.98), rgba(8,9,14,0.97))",
    boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
    color: "#f5f7fb",
    padding: 24,
    display: "grid", gap: 20
  },
  head: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 16
  },
  eyebrow: {
    fontSize: 11, letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)", marginBottom: 6
  },
  title: {
    fontSize: 32, lineHeight: 1.08,
    fontWeight: 760, letterSpacing: "-0.04em"
  },
  headActions: {
    display: "flex", alignItems: "center",
    gap: 8, flexShrink: 0
  },
  tab: {
    height: 32, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.8)",
    padding: "0 14px", cursor: "pointer",
    fontSize: 13, whiteSpace: "nowrap" as const
  },
  tabOn: { background: "rgba(255,255,255,0.14)", color: "#f5f7fb" },
  iconBtn: {
    width: 32, height: 32, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#f5f7fb", display: "grid",
    placeItems: "center", cursor: "pointer"
  },
  noticeBanner: {
    borderRadius: 12,
    border: "1px solid rgba(255,200,160,0.25)",
    background: "rgba(255,160,90,0.1)",
    color: "rgba(255,235,216,0.9)",
    padding: "10px 14px", fontSize: 13, lineHeight: 1.5
  },
  content: { display: "grid", gap: 16 },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14
  },
  priceCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 20, display: "grid", gap: 10,
    alignContent: "start"
  },
  priceCardOn: {
    background: "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
    border: "1px solid rgba(255,255,255,0.14)"
  },
  priceBadge: {
    display: "inline-flex", alignItems: "center",
    width: "fit-content", height: 24,
    padding: "0 10px", borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    fontSize: 11, letterSpacing: "0.04em"
  },
  priceTier: {
    display: "inline-flex", alignItems: "center",
    gap: 7, fontSize: 18, fontWeight: 700
  },
  priceValue: {
    fontSize: 36, fontWeight: 760,
    letterSpacing: "-0.05em", lineHeight: 1
  },
  pricePer: {
    fontSize: 16, fontWeight: 500,
    color: "rgba(255,255,255,0.5)"
  },
  priceMeta: {
    fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.07)",
    margin: "2px 0"
  },
  list: {
    margin: 0, paddingLeft: 16,
    display: "grid", gap: 7,
    fontSize: 13, lineHeight: 1.5,
    color: "rgba(255,255,255,0.85)"
  },
  primaryBtn: {
    height: 40, borderRadius: 999,
    border: "none",
    background: "#f5f7fb", color: "#090b10",
    fontWeight: 700, cursor: "pointer",
    fontSize: 14, marginTop: 4
  },
  ghostBtn: {
    height: 40, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "transparent", color: "#f5f7fb",
    fontWeight: 600, cursor: "pointer",
    fontSize: 13, display: "inline-flex",
    alignItems: "center", gap: 8,
    justifyContent: "center", marginTop: 4
  },
  noteCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    padding: 16
  },
  balanceCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
    padding: 20, display: "grid", gap: 6
  },
  balanceLabel: {
    fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)"
  },
  balanceValue: {
    fontSize: 36, fontWeight: 760,
    letterSpacing: "-0.04em"
  },
  legalCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    padding: 16, display: "grid", gap: 10
  },
  checkboxRow: {
    display: "flex", alignItems: "flex-start",
    gap: 10, cursor: "pointer"
  },
  legalLinks: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  legalLinkBtn: {
    height: 28, borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.7)",
    padding: "0 11px", cursor: "pointer",
    fontSize: 12, textDecoration: "none",
    display: "inline-flex", alignItems: "center"
  },
  legalModalMask: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    display: "grid", placeItems: "center", padding: 16
  },
  legalModal: {
    width: "min(720px, calc(100vw - 32px))",
    maxHeight: "min(84vh, 860px)",
    overflow: "hidden", borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(11,13,18,0.99), rgba(8,10,16,0.98))",
    display: "grid",
    gridTemplateRows: "auto auto minmax(0,1fr)"
  },
  legalModalHead: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16, padding: "18px 18px 0"
  },
};
