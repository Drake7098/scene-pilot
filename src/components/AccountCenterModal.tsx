import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CreditCard, Crown, KeyRound, LogOut, Sparkles, UserRound, Wallet, X } from "lucide-react";
import type { AccountCenterSection, ApiCredentialState, ApiProviderId, ApiProviderMode, UserState } from "../types/account";
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
  const [apiDraft, setApiDraft] = useState<ApiCredentialState>(() => normalizeApiCredentials(apiCredentials));
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocId | null>(null);

  useEffect(() => {
    setApiDraft(normalizeApiCredentials(apiCredentials));
  }, [apiCredentials, open, section]);

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
                <div style={styles.blockTitle}>{t(lang, "生成接口", "Generation APIs")}</div>
                <div style={styles.muted}>
                  {t(
                    lang,
                    "在这里管理 fal 和 Runway。平台模式使用 ScenePilot credits，自带 API 适合 Pro 用户接入自己的 key。",
                    "Manage fal and Runway here. Platform mode uses ScenePilot credits, while personal API mode lets Pro users connect their own keys."
                  )}
                </div>
                <div style={styles.apiDefaultCard}>
                  <div>
                    <div style={styles.packTitle}>{t(lang, "默认提供商", "Default provider")}</div>
                    <div style={styles.apiMeta}>{t(lang, "决定 Pro 工作台优先使用哪个生成接口。", "Controls which provider Pro uses first.")}</div>
                  </div>
                  <select
                    value={apiDraft.defaultProvider}
                    onChange={(e) => setApiDraft((current) => ({ ...current, defaultProvider: e.target.value as ApiProviderId }))}
                    style={styles.input}
                    data-testid="account-api-default-provider"
                  >
                    <option value="fal">fal</option>
                    <option value="runway">Runway</option>
                  </select>
                </div>
                <div style={styles.providerGrid}>
                  {renderProviderCard({
                    lang,
                    providerId: "fal",
                    title: "fal",
                    subtitle: t(lang, "适合平台默认图像/视频生成", "Best for platform default image and video generation"),
                    docsMeta: "queue.fal.run / fal.run",
                    draft: apiDraft,
                    setDraft: setApiDraft
                  })}
                  {renderProviderCard({
                    lang,
                    providerId: "runway",
                    title: "Runway",
                    subtitle: t(lang, "适合高质量专业视频生成", "Best for high-end professional video generation"),
                    docsMeta: "api.dev.runwayml.com",
                    draft: apiDraft,
                    setDraft: setApiDraft
                  })}
                </div>
                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={() => {
                      const stamp = new Date().toISOString();
                      onSaveApiCredentials({
                        ...apiDraft,
                        updatedAt: stamp,
                        fal: { ...apiDraft.fal, updatedAt: stamp },
                        runway: { ...apiDraft.runway, updatedAt: stamp }
                      });
                    }}
                    data-testid="account-api-save"
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

function normalizeApiCredentials(input: ApiCredentialState | null): ApiCredentialState {
  return input ?? {
    defaultProvider: "fal",
    fal: {
      enabled: true,
      mode: "platform",
      apiKey: "",
      baseUrl: "https://queue.fal.run",
      preferredModel: "fal-ai/flux/dev",
      updatedAt: null
    },
    runway: {
      enabled: false,
      mode: "platform",
      apiKey: "",
      baseUrl: "https://api.dev.runwayml.com",
      preferredModel: "gen4_turbo",
      updatedAt: null
    },
    updatedAt: null
  };
}

function updateProviderDraft(
  draft: ApiCredentialState,
  providerId: ApiProviderId,
  patch: Partial<ApiCredentialState[ApiProviderId]>
): ApiCredentialState {
  return {
    ...draft,
    [providerId]: {
      ...draft[providerId],
      ...patch
    }
  };
}

function providerModeLabel(lang: Lang, mode: ApiProviderMode) {
  return mode === "platform" ? t(lang, "平台模式", "Platform mode") : t(lang, "我的 API", "My API");
}

function renderProviderCard(input: {
  lang: Lang;
  providerId: ApiProviderId;
  title: string;
  subtitle: string;
  docsMeta: string;
  draft: ApiCredentialState;
  setDraft: React.Dispatch<React.SetStateAction<ApiCredentialState>>;
}) {
  const { lang, providerId, title, subtitle, docsMeta, draft, setDraft } = input;
  const provider = draft[providerId];
  return (
    <article style={styles.providerCard} data-testid={`account-api-provider-${providerId}`}>
      <div style={styles.providerHead}>
        <div>
          <div style={styles.providerTitleRow}>
            <div style={styles.packTitle}>{title}</div>
            {draft.defaultProvider === providerId ? (
              <span style={styles.defaultBadge}><CheckCircle2 size={12} />{t(lang, "默认", "Default")}</span>
            ) : null}
          </div>
          <div style={styles.apiMeta}>{subtitle}</div>
          <div style={styles.providerMeta}>{docsMeta}</div>
        </div>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) => setDraft((current) => updateProviderDraft(current, providerId, { enabled: e.target.checked }))}
            data-testid={`account-api-provider-enabled-${providerId}`}
          />
          <span>{t(lang, "启用", "Enabled")}</span>
        </label>
      </div>

      <div style={styles.modeRow}>
        {(["platform", "personal"] as ApiProviderMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            style={{ ...styles.modeBtn, ...(provider.mode === mode ? styles.modeBtnOn : null) }}
            onClick={() => setDraft((current) => updateProviderDraft(current, providerId, { mode }))}
            data-testid={`account-api-provider-mode-${providerId}-${mode}`}
          >
            {providerModeLabel(lang, mode)}
          </button>
        ))}
      </div>

      <div style={styles.apiFieldGrid}>
        <label style={styles.fieldStack}>
          <span style={styles.fieldLabel}>API Base</span>
          <input
            value={provider.baseUrl}
            onChange={(e) => setDraft((current) => updateProviderDraft(current, providerId, { baseUrl: e.target.value }))}
            placeholder={providerId === "fal" ? "https://queue.fal.run" : "https://api.dev.runwayml.com"}
            style={styles.input}
            data-testid={`account-api-provider-base-${providerId}`}
          />
        </label>
        <label style={styles.fieldStack}>
          <span style={styles.fieldLabel}>{t(lang, "默认模型", "Preferred model")}</span>
          <input
            value={provider.preferredModel}
            onChange={(e) => setDraft((current) => updateProviderDraft(current, providerId, { preferredModel: e.target.value }))}
            placeholder={providerId === "fal" ? "fal-ai/flux/dev" : "gen4_turbo"}
            style={styles.input}
            data-testid={`account-api-provider-model-${providerId}`}
          />
        </label>
      </div>

      {provider.mode === "personal" ? (
        <label style={styles.fieldStack}>
          <span style={styles.fieldLabel}>API Key</span>
          <input
            value={provider.apiKey}
            onChange={(e) => setDraft((current) => updateProviderDraft(current, providerId, { apiKey: e.target.value }))}
            placeholder={providerId === "fal" ? "Key ..." : "Bearer token"}
            style={styles.input}
            data-testid={`account-api-provider-key-${providerId}`}
          />
        </label>
      ) : (
        <div style={styles.apiHint} data-testid={`account-api-provider-platform-${providerId}`}>
          {t(
            lang,
            "平台模式下使用 ScenePilot credits 和服务端代理，不需要在这里填 key。",
            "Platform mode uses ScenePilot credits and server-side proxying, so no key is needed here."
          )}
        </div>
      )}
    </article>
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
  apiDefaultCard: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)"
  },
  providerGrid: {
    display: "grid",
    gap: 12
  },
  providerCard: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)"
  },
  providerHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  providerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  providerMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.52)",
    marginTop: 4
  },
  defaultBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(63,130,255,0.34)",
    background: "rgba(63,130,255,0.14)",
    color: "#c9dcff",
    fontSize: 11,
    fontWeight: 700
  },
  modeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  modeBtn: {
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#dfe3f4",
    padding: "0 12px",
    cursor: "pointer"
  },
  modeBtnOn: {
    background: "rgba(63,130,255,0.18)",
    border: "1px solid rgba(63,130,255,0.36)",
    color: "#ffffff"
  },
  apiFieldGrid: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  fieldStack: {
    display: "grid",
    gap: 6
  },
  fieldLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
    fontWeight: 700
  },
  apiMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.66)",
    lineHeight: 1.45
  },
  apiHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.5,
    borderRadius: 14,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)"
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
