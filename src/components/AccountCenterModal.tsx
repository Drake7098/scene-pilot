import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Crown, KeyRound, LogOut, Sparkles, UserRound, Wallet, X } from "lucide-react";
import type { AccountCenterSection, ApiCredentialState, UserState } from "../types/account";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "../types/billing";
import type { Lang } from "../i18n";
import { LEGAL_DOCS, legalText, type LegalDocId } from "../content/legal";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = {
  open: boolean;
  lang: Lang;
  section: AccountCenterSection;
  user: UserState | null;
  creditsBalance: number;
  ledger: CreditLedgerEntry[];
  creditPacks: CreditPackConfig[];
  proPlan: ProPlanConfig | null;
  subscription: SubscriptionState | null;
  apiCredentials: ApiCredentialState | null;
  authBusy: boolean;
  billingBusy: boolean;
  authStep: "email" | "code";
  authEmail: string;
  authCode: string;
  lastSentCode: string;
  authLegalAccepted: boolean;
  billingLegalAccepted: boolean;
  onClose: () => void;
  onSectionChange: (section: AccountCenterSection) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthCodeChange: (value: string) => void;
  onAuthLegalAcceptedChange: (value: boolean) => void;
  onBillingLegalAcceptedChange: (value: boolean) => void;
  onSendCode: () => void;
  onVerifyCode: () => void;
  onLogout: () => void;
  onPurchasePack: (packId: string) => void;
  onUpgradePro: () => void;
  onOpenCustomerPortal: () => void;
  onSaveApiCredentials: (next: ApiCredentialState) => void;
  showSkipProEntry?: boolean;
  onSkipProEntry?: () => void;
};

export function AccountCenterModal(props: Props) {
  const {
    open,
    lang,
    section,
    user,
    creditsBalance,
    ledger,
    creditPacks,
    proPlan,
    subscription,
    apiCredentials,
    authBusy,
    billingBusy,
    authStep,
    authEmail,
    authCode,
    lastSentCode,
    authLegalAccepted,
    billingLegalAccepted,
    onClose,
    onSectionChange,
    onAuthEmailChange,
    onAuthCodeChange,
    onAuthLegalAcceptedChange,
    onBillingLegalAcceptedChange,
    onSendCode,
    onVerifyCode,
    onLogout,
    onPurchasePack,
    onUpgradePro,
    onOpenCustomerPortal,
    onSaveApiCredentials,
    showSkipProEntry,
    onSkipProEntry
  } = props;
  const [apiKeyDraft, setApiKeyDraft] = useState(apiCredentials?.openaiApiKey ?? "");
  const [apiEnabled, setApiEnabled] = useState(apiCredentials?.enabled ?? false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocId | null>(null);

  const title = useMemo(() => {
    if (!user) return t(lang, "登录 / 注册", "Sign In");
    if (section === "credits") return t(lang, "点数与充值", "Credits");
    if (section === "pro") return "Pro";
    if (section === "api") return t(lang, "自带 API", "Bring Your Own API");
    return t(lang, "我的账户", "My Account");
  }, [lang, section, user]);
  const authConsentHint = t(
    lang,
    "继续即表示你已阅读并同意《用户协议》与《隐私说明》。",
    "To continue, you must agree to the Terms of Service and Privacy Notice."
  );
  const billingConsentHint = t(
    lang,
    "支付前请确认：首购订阅 7 天可退；单独购买的点数整包未使用可退；当地强制性消费者权利优先。",
    "Before payment: first-time subscriptions are refundable within 7 days; separately purchased credits are refundable if the purchased pack remains unused; mandatory local consumer rights prevail."
  );
  const legalDoc = activeLegalDoc ? LEGAL_DOCS[activeLegalDoc] : null;

  if (!open) return null;

  return createPortal(
    <div style={styles.mask} onMouseDown={onClose} role="presentation">
      <div
        style={styles.modal}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={styles.head}>
          <div>
            <div style={styles.eyebrow}>{t(lang, "账户中心", "Account Center")}</div>
            <div style={styles.title}>{title}</div>
          </div>
          <button type="button" style={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.tabs}>
          <button type="button" style={{ ...styles.tab, ...(section === "overview" ? styles.tabOn : null) }} onClick={() => onSectionChange("overview")}>
            <UserRound size={14} />{t(lang, "账户", "Account")}
          </button>
          <button type="button" style={{ ...styles.tab, ...(section === "credits" ? styles.tabOn : null) }} onClick={() => onSectionChange("credits")}>
            <Wallet size={14} />{t(lang, "点数", "Credits")}
          </button>
          <button type="button" style={{ ...styles.tab, ...(section === "pro" ? styles.tabOn : null) }} onClick={() => onSectionChange("pro")}>
            <Crown size={14} />Pro
          </button>
          {user?.tier === "pro" ? (
            <button type="button" style={{ ...styles.tab, ...(section === "api" ? styles.tabOn : null) }} onClick={() => onSectionChange("api")}>
              <KeyRound size={14} />API
            </button>
          ) : null}
        </div>

        {!user ? (
          <div style={styles.panel}>
            <div style={styles.blockTitle}>{t(lang, "邮箱验证码登录", "Email Code Sign In")}</div>
            <div style={styles.muted}>{t(lang, "输入邮箱后发送验证码，验证成功即注册并登录。", "Enter your email, receive a code, and sign in instantly.")}</div>
            <div style={styles.formRow}>
              <input
                value={authEmail}
                onChange={(e) => onAuthEmailChange(e.target.value)}
                placeholder={t(lang, "邮箱地址", "Email")}
                style={styles.input}
              />
            </div>
            {authStep === "code" ? (
              <div style={styles.formRow}>
                <input
                  value={authCode}
                  onChange={(e) => onAuthCodeChange(e.target.value)}
                  placeholder={t(lang, "6 位验证码", "6-digit code")}
                  style={styles.input}
                />
              </div>
            ) : null}
            {lastSentCode ? (
              <div style={styles.devHint}>{t(lang, "开发验证码：", "Dev code: ")}{lastSentCode}</div>
            ) : null}
            <div style={styles.legalCard}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={authLegalAccepted}
                  onChange={(e) => onAuthLegalAcceptedChange(e.target.checked)}
                  data-testid="account-auth-legal-consent"
                />
                <span>{authConsentHint}</span>
              </label>
              <div style={styles.legalLinks}>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("terms")} data-testid="account-legal-open-terms">
                  {legalText(lang, LEGAL_DOCS.terms.title)}
                </button>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("privacy")} data-testid="account-legal-open-privacy">
                  {legalText(lang, LEGAL_DOCS.privacy.title)}
                </button>
              </div>
            </div>
            <div style={styles.actions}>
              {authStep === "email" ? (
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={onSendCode}
                  disabled={authBusy || !authLegalAccepted}
                  data-testid="account-auth-send-code"
                >
                  {authBusy ? t(lang, "发送中…", "Sending…") : t(lang, "发送验证码", "Send Code")}
                </button>
              ) : (
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={onVerifyCode}
                  disabled={authBusy || !authLegalAccepted}
                  data-testid="account-auth-verify"
                >
                  {authBusy ? t(lang, "验证中…", "Verifying…") : t(lang, "验证并登录", "Verify & Sign In")}
                </button>
              )}
              {showSkipProEntry && onSkipProEntry ? (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={onSkipProEntry}
                  data-testid="account-auth-skip-pro"
                >
                  {t(lang, "跳过，先进入 Pro", "Skip for now, enter Pro")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {user ? (
          <div style={styles.panelStack}>
            {(section === "overview" || section === "credits" || section === "pro") ? (
              <div style={styles.summaryCard}>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>{t(lang, "邮箱", "Email")}</span>
                  <span style={styles.summaryValue}>{user.email}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>{t(lang, "层级", "Tier")}</span>
                  <span style={styles.summaryValue}>{user.tier.toUpperCase()}</span>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>{t(lang, "点数余额", "Credits")}</span>
                  <span style={styles.summaryValue}>{creditsBalance}</span>
                </div>
              </div>
            ) : null}

            {section === "overview" ? (
              <div style={styles.panel}>
                <div style={styles.blockTitle}>{t(lang, "账户操作", "Account Actions")}</div>
                <div style={styles.actions}>
                  <button type="button" style={styles.secondaryBtn} onClick={() => onSectionChange("credits")}>
                    <CreditCard size={14} />{t(lang, "购买点数", "Buy Credits")}
                  </button>
                  {user.tier !== "pro" ? (
                    <button type="button" style={styles.primaryBtn} onClick={billingLegalAccepted ? onUpgradePro : () => onSectionChange("pro")} disabled={billingBusy}>
                      <Sparkles size={14} />{t(lang, "升级 Pro", "Upgrade to Pro")}
                    </button>
                  ) : null}
                  {subscription?.status === "active" ? (
                    <button type="button" style={styles.secondaryBtn} onClick={onOpenCustomerPortal} disabled={billingBusy}>
                      {t(lang, "管理订阅", "Manage Subscription")}
                    </button>
                  ) : null}
                  <button type="button" style={styles.ghostBtn} onClick={onLogout}>
                    <LogOut size={14} />{t(lang, "退出登录", "Log Out")}
                  </button>
                </div>
              </div>
            ) : null}

            {section === "credits" ? (
              <div style={styles.panel}>
                <div style={styles.blockTitle}>{t(lang, "充值点数", "Credit Packs")}</div>
                <div style={styles.legalCard}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={billingLegalAccepted}
                      onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                      data-testid="account-billing-legal-consent"
                    />
                    <span>{billingConsentHint}</span>
                  </label>
                  <div style={styles.legalLinks}>
                    <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("billing")} data-testid="account-legal-open-billing">
                      {legalText(lang, LEGAL_DOCS.billing.title)}
                    </button>
                    <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("refund")} data-testid="account-legal-open-refund">
                      {legalText(lang, LEGAL_DOCS.refund.title)}
                    </button>
                  </div>
                </div>
                <div style={styles.packGrid}>
                  {creditPacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      style={styles.packCard}
                      onClick={() => onPurchasePack(pack.id)}
                      disabled={billingBusy || !billingLegalAccepted}
                      data-testid={`account-credit-pack-${pack.id}`}
                    >
                      <div style={styles.packTitle}>{pack.name}</div>
                      <div style={styles.packMeta}>{pack.usdPrice} USD</div>
                    </button>
                  ))}
                </div>
                <div style={styles.blockTitle}>{t(lang, "最近流水", "Recent Ledger")}</div>
                <div style={styles.ledgerList}>
                  {ledger.slice(0, 8).map((item) => (
                    <div key={item.id} style={styles.ledgerRow}>
                      <span>{ledgerLabel(lang, item.kind)}</span>
                      <span>{item.credits > 0 ? `+${item.credits}` : item.credits}</span>
                    </div>
                  ))}
                  {ledger.length === 0 ? <div style={styles.emptyText}>{t(lang, "还没有点数流水", "No credit history yet.")}</div> : null}
                </div>
              </div>
            ) : null}

            {section === "pro" ? (
              <div style={styles.panel}>
                <div style={styles.blockTitle}>Pro</div>
                <div style={styles.muted}>
                  {proPlan
                    ? t(lang, `Pro 月费 ${proPlan.monthlyUsdPrice} 美元，含 ${proPlan.monthlyCredits} 点和结构控制台、自带 API。`, `Pro is ${proPlan.monthlyUsdPrice} USD/month with ${proPlan.monthlyCredits} credits, the advanced structure console, and bring-your-own API.`)
                    : t(lang, "Pro 方案暂不可用。", "Pro plan is not available.")}
                </div>
                <div style={styles.legalCard}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={billingLegalAccepted}
                      onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                      data-testid="account-pro-legal-consent"
                    />
                    <span>{billingConsentHint}</span>
                  </label>
                  <div style={styles.legalLinks}>
                    <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("billing")}>
                      {legalText(lang, LEGAL_DOCS.billing.title)}
                    </button>
                    <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("refund")}>
                      {legalText(lang, LEGAL_DOCS.refund.title)}
                    </button>
                  </div>
                </div>
                {user.tier !== "pro" ? (
                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      onClick={onUpgradePro}
                      disabled={billingBusy || !proPlan || !billingLegalAccepted}
                      data-testid="account-pro-upgrade"
                    >
                      <Crown size={14} />{t(lang, "开通 Pro", "Start Pro")}
                    </button>
                  </div>
                ) : (
                  <div style={styles.muted}>{t(lang, "当前已开通 Pro。", "Pro is active on this account.")}</div>
                )}
              </div>
            ) : null}

            {section === "api" && user.tier === "pro" ? (
              <div style={styles.panel}>
                <div style={styles.blockTitle}>{t(lang, "自带 API", "Bring Your Own API")}</div>
                <input
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder={t(lang, "输入 OpenAI API Key", "Enter OpenAI API Key")}
                  style={styles.input}
                />
                <label style={styles.checkboxRow}>
                  <input type="checkbox" checked={apiEnabled} onChange={(e) => setApiEnabled(e.target.checked)} />
                  <span>{t(lang, "启用自带 API", "Enable bring-your-own API")}</span>
                </label>
                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={() => onSaveApiCredentials({ openaiApiKey: apiKeyDraft, enabled: apiEnabled, updatedAt: new Date().toISOString() })}
                  >
                    {t(lang, "保存", "Save")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {legalDoc ? (
          <div style={styles.legalModalMask} onMouseDown={() => setActiveLegalDoc(null)} data-testid="account-legal-modal-mask" role="presentation">
            <div
              style={styles.legalModal}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              data-testid="account-legal-modal"
            >
              <div style={styles.legalModalHead}>
                <div>
                  <div style={styles.eyebrow}>{legalText(lang, legalDoc.title)}</div>
                  <div style={styles.legalMeta}>{`${legalDoc.version} · ${legalDoc.updatedAt}`}</div>
                </div>
                <button type="button" style={styles.iconBtn} onClick={() => setActiveLegalDoc(null)}>
                  <X size={16} />
                </button>
              </div>
              <div style={styles.legalSummary}>{legalText(lang, legalDoc.summary)}</div>
              <div style={styles.legalDocBody}>
                {legalDoc.sections.map((item) => (
                  <section key={legalText(lang, item.heading)} style={styles.legalSection}>
                    <div style={styles.legalSectionTitle}>{legalText(lang, item.heading)}</div>
                    {item.body.map((paragraph) => (
                      <p key={legalText(lang, paragraph)} style={styles.legalParagraph}>
                        {legalText(lang, paragraph)}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

function ledgerLabel(lang: Lang, kind: CreditLedgerEntry["kind"]) {
  const map: Record<CreditLedgerEntry["kind"], string> = {
    purchase: t(lang, "充值", "Purchase"),
    grant: t(lang, "赠送", "Grant"),
    reserve: t(lang, "预扣", "Reserve"),
    finalize: t(lang, "确认扣除", "Finalize"),
    rollback: t(lang, "回滚", "Rollback")
  };
  return map[kind];
}

const styles: Record<string, React.CSSProperties> = {
  mask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.52)",
    backdropFilter: "blur(14px)",
    display: "grid",
    placeItems: "center",
    zIndex: 90,
    padding: 16
  },
  modal: {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "min(86vh, 920px)",
    overflowY: "auto",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(12,14,20,0.97), rgba(9,10,16,0.94))",
    boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
    padding: 20,
    color: "#f7f7fb"
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.46)",
    marginBottom: 4
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.03em"
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#f7f7fb",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18
  },
  tab: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#dfe3f4",
    height: 34,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer"
  },
  tabOn: {
    background: "rgba(255,255,255,0.1)",
    color: "#ffffff"
  },
  panelStack: {
    display: "grid",
    gap: 14
  },
  panel: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
    display: "grid",
    gap: 12
  },
  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 10
  },
  summaryItem: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 14,
    display: "grid",
    gap: 4
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.54)"
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 650
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 700
  },
  muted: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.72)"
  },
  formRow: {
    display: "grid"
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f7f7fb",
    padding: "0 14px",
    fontSize: 14,
    outline: "none"
  },
  devHint: {
    fontSize: 12,
    color: "#aab3ff"
  },
  legalCard: {
    marginTop: 2,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 12,
    display: "grid",
    gap: 10
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10
  },
  primaryBtn: {
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#f7f7fb",
    color: "#090b10",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 650
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#f7f7fb",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 600
  },
  ghostBtn: {
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#f7f7fb",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer"
  },
  packGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10
  },
  packCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f7f7fb",
    padding: 14,
    textAlign: "left",
    cursor: "pointer"
  },
  packTitle: {
    fontSize: 15,
    fontWeight: 650,
    marginBottom: 4
  },
  packMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)"
  },
  ledgerList: {
    display: "grid",
    gap: 8
  },
  ledgerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    padding: "10px 12px",
    fontSize: 13
  },
  emptyText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.52)"
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(247,247,251,0.9)"
  },
  legalLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  legalLinkBtn: {
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#f7f7fb",
    padding: "0 12px",
    fontSize: 12,
    cursor: "pointer"
  },
  legalModalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.42)",
    backdropFilter: "blur(10px)",
    display: "grid",
    placeItems: "center",
    zIndex: 110,
    padding: 16
  },
  legalModal: {
    width: "min(780px, calc(100vw - 32px))",
    maxHeight: "min(84vh, 900px)",
    overflow: "hidden",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(11,13,18,0.98), rgba(8,10,16,0.97))",
    boxShadow: "0 28px 80px rgba(0,0,0,0.42)",
    display: "grid",
    gridTemplateRows: "auto auto minmax(0,1fr)"
  },
  legalModalHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 18px 0"
  },
  legalMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.56)"
  },
  legalSummary: {
    padding: "12px 18px 0",
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.82)"
  },
  legalDocBody: {
    overflowY: "auto",
    padding: 18,
    display: "grid",
    gap: 16
  },
  legalSection: {
    display: "grid",
    gap: 8
  },
  legalSectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff"
  },
  legalParagraph: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)"
  }
};
