import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, CreditCard, Crown, KeyRound, Cpu, LogOut, Sparkles, UserRound, Wallet, X } from "lucide-react";
import { ApiProviderPanel } from "./generation/ApiProviderPanel";
import type { AccountCenterSection, ApiCredentialState, ApiProviderId, ApiProviderMode, ProviderConnectionStatus, UserState } from "../types/account";
import { getProAccessState } from "../utils/entitlement";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "../types/billing";
import type { Lang } from "../i18n";
import { LEGAL_DOCS, legalText, type LegalDocId } from "../content/legal";
import { PUBLIC_CONTACT_CHANNELS, SYSTEM_NOTIFICATION_MAILBOX } from "../config/contactChannels";


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
  billingEnabled: boolean;
  billingNotice: string;
  authStep: "email" | "code";
  authEmail: string;
  authPassword: string;
  authCode: string;
  authHint: string;
  lastSentCode: string;
  googleSignInEnabled: boolean;
  authLegalAccepted: boolean;
  billingLegalAccepted: boolean;
  localComfyStatus?: any;
  localDrawStatus?: any;
  onRefreshLocalProviders?: () => Promise<void>;
  onClose: () => void;
  onSectionChange: (section: AccountCenterSection) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthCodeChange: (value: string) => void;
  onAuthLegalAcceptedChange: (value: boolean) => void;
  onBillingLegalAcceptedChange: (value: boolean) => void;
  onGoogleSignIn: () => void;
  onPasswordSignIn: () => void;
  onSendCode: () => void;
  onVerifyCode: () => void;
  onBackToEmail?: () => void;
  onLogout: () => void;
  onPurchasePack: (packId: string) => void;
  onUpgradePro: () => void;
  onOpenCustomerPortal: () => void;
  onSaveApiCredentials: (next: ApiCredentialState) => void;
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
    billingEnabled,
    billingNotice,
    authStep,
    authEmail,
    authPassword,
    authCode,
    authHint,
    lastSentCode,
    googleSignInEnabled,
    authLegalAccepted,
    billingLegalAccepted,
    localComfyStatus,
    localDrawStatus,
    onRefreshLocalProviders,
    onClose,
    onSectionChange,
    onAuthEmailChange,
    onAuthPasswordChange,
    onAuthCodeChange,
    onAuthLegalAcceptedChange,
    onBillingLegalAcceptedChange,
    onGoogleSignIn,
    onPasswordSignIn,
    onSendCode,
    onVerifyCode,
    onBackToEmail,
    onLogout,
    onPurchasePack,
    onUpgradePro,
    onOpenCustomerPortal,
    onSaveApiCredentials
  } = props;
  const [apiDraft, setApiDraft] = useState<ApiCredentialState>(() => normalizeApiCredentialsForForm(apiCredentials));
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocId | null>(null);
  const [consentShake, setConsentShake] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const consentRef = useRef<HTMLDivElement | null>(null);

  function shakeConsent() {
    setConsentShake(true);
    setTimeout(() => setConsentShake(false), 650);
    consentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const shakeKeyframes = `@keyframes spx-shake {
    0%,100%{transform:translateX(0)}
    15%{transform:translateX(-7px)}
    35%{transform:translateX(7px)}
    55%{transform:translateX(-5px)}
    75%{transform:translateX(4px)}
    90%{transform:translateX(-2px)}
  }`;

  useEffect(() => {
    setApiDraft(normalizeApiCredentialsForForm(apiCredentials));
  }, [apiCredentials, open, section]);

  const title = useMemo(() => {
    if (!user) return t(lang, "注册 / 登录", "Sign Up / Sign In");
    if (section === "credits") return t(lang, "点数与充值", "Credits");
    if (section === "pro") return "Pro";
    if (section === "api") return t(lang, "API 接入", "API Access");
    if (section === "local") return t(lang, "本地连接", "Local Connection");
    return t(lang, "我的账户", "My Account");
  }, [lang, section, user]);
  const authConsentLine1 = t(
    lang,
    "我已经同意服务协议和隐私协议",
    "I have read and agree to the Terms of Service and Privacy Notice"
  );
  const authConsentLine2 = t(
    lang,
    "并同意按协议处理账户和数据",
    "including account and data processing described there"
  );
  const billingConsentHint = t(
    lang,
    "我已阅读并同意《付费条款》《退款政策》《用户协议》《隐私说明》，并理解支付与税费由 Paddle 处理；当地强制性消费者权利优先。",
    "I have read and agree to the Billing Terms, Refund Policy, Terms of Service, and Privacy Notice, and understand checkout and taxes are processed by Paddle; mandatory local consumer rights prevail."
  );
  const contactHint = t(
    lang,
    `客服：${PUBLIC_CONTACT_CHANNELS.support} ｜ 商务：${PUBLIC_CONTACT_CHANNELS.business} ｜ 系统通知：${SYSTEM_NOTIFICATION_MAILBOX}（不接收回复）`,
    `Support: ${PUBLIC_CONTACT_CHANNELS.support} | Business: ${PUBLIC_CONTACT_CHANNELS.business} | Notifications: ${SYSTEM_NOTIFICATION_MAILBOX} (no reply)`
  );
  const legalDoc = activeLegalDoc ? LEGAL_DOCS[activeLegalDoc] : null;
  const hasProAccess = getProAccessState(user).hasPro;

  if (!open) return null;

  return createPortal(
    <div style={styles.mask} onMouseDown={onClose} role="presentation">
      <style>{shakeKeyframes}</style>
      <div
        style={{ ...styles.modal, ...(!user ? styles.modalAuth : null) }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.head, ...(!user ? styles.headAuth : null) }}>
          {user ? (
            <div>
              <div style={styles.eyebrow}>{t(lang, "账户中心", "Account Center")}</div>
              <div style={styles.title}>{title}</div>
            </div>
          ) : <div style={styles.headAuthSpacer} />}
          <button
            type="button"
            style={{ ...styles.iconBtn, ...(!user ? styles.iconBtnAuth : null) }}
            onClick={onClose}
            data-testid="account-center-close"
          >
            <X size={16} />
          </button>
        </div>

        {user ? (
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
            <button type="button" style={{ ...styles.tab, ...(section === "api" ? styles.tabOn : null) }} onClick={() => onSectionChange("api")}>
              <KeyRound size={14} />{t(lang, "API 接入", "API")}
            </button>

          </div>
        ) : null}

        {!user ? (
          <div style={styles.authPanel} data-testid="account-auth-panel">

            {/* ── 标题 ── */}
            <div style={styles.authHero}>
              <div style={styles.authHeroTitle}>
                {authStep === "code"
                  ? t(lang, "请查收验证码", "Check your email")
                  : t(lang, "欢迎使用 ScenePilotix", "Welcome to ScenePilotix")}
              </div>
              <div style={styles.authHeroSub}>
                {authStep === "code"
                  ? t(lang, `验证码已发送至 ${authEmail}`, `We sent a code to ${authEmail}`)
                  : t(lang, "输入邮箱，我们会发送验证码", "Enter your email — we will send a code")}
              </div>
            </div>

            {/* ── 服务不可用提示 ── */}
            {!googleSignInEnabled ? (
              <div style={styles.authEnvHint} data-testid="account-auth-env-hint">
                {lang === "zh" ? "登录失败，请重试。" : "Login failed. Please try again."}
              </div>
            ) : null}

            {/* ── 第一步：输入邮箱 ── */}
            {authStep === "email" ? (
              <>
                <input
                  value={authEmail}
                  onChange={(e) => onAuthEmailChange(e.target.value)}
                  placeholder={t(lang, "你的邮箱", "Your email address")}
                  style={styles.authInput}
                  autoComplete="email"
                  type="email"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!authLegalAccepted) {
                        shakeConsent();
                        return;
                      }
                      onSendCode();
                    }
                  }}
                />
                <button
                  type="button"
                  style={styles.authPrimaryBtn}
                  onClick={() => {
                    if (!authLegalAccepted) {
                      shakeConsent();
                      return;
                    }
                    onSendCode();
                  }}
                  disabled={authBusy}
                  data-testid="account-auth-send-code"
                >
                  {authBusy ? t(lang, "发送中…", "Sending…") : t(lang, "发送验证码", "Send code")}
                </button>

                {/* OR + Google */}
                <div style={styles.authOrRow} aria-hidden="true">
                  <span style={styles.authOrLine} />
                  <span style={styles.authOrText}>OR</span>
                  <span style={styles.authOrLine} />
                </div>
                <button
                  type="button"
                  style={styles.authGoogleBtn}
                  onClick={() => {
                    if (!authLegalAccepted) {
                      shakeConsent();
                      return;
                    }
                    onGoogleSignIn();
                  }}
                  disabled={authBusy || !googleSignInEnabled}
                  title={!googleSignInEnabled ? (lang === "zh" ? "认证服务未配置" : "Auth not configured") : undefined}
                  data-testid="account-auth-google"
                >
                  <span style={styles.authGoogleGlyph}>G</span>
                  <span>{authBusy ? t(lang, "登录中…", "Signing in…") : t(lang, "使用 Google 登录", "Log in with Google")}</span>
                </button>
              </>
            ) : (
              /* ── 第二步：输入验证码 ── */
              <>
                <input
                  value={authCode}
                  onChange={(e) => onAuthCodeChange(e.target.value)}
                  placeholder={t(lang, "验证码", "code")}
                  style={{ ...styles.authInput, textAlign: "center", letterSpacing: "0.25em", fontSize: 22, fontWeight: 700 }}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={8}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && authCode.trim().length >= 4) onVerifyCode(); }}
                />
                {lastSentCode ? (
                  <div style={{ textAlign: "center", fontSize: 11, color: "rgba(20,26,38,0.35)" }}>
                    {t(lang, `开发码：${lastSentCode}`, `Dev: ${lastSentCode}`)}
                  </div>
                ) : null}
                <button
                  type="button"
                  style={styles.authPrimaryBtn}
                  onClick={onVerifyCode}
                  disabled={authBusy || authCode.trim().length < 4}
                  data-testid="account-auth-verify-code"
                >
                  {authBusy ? t(lang, "验证中…", "Verifying…") : t(lang, "登录", "Sign in")}
                </button>
                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    style={styles.authSecondaryLink}
                    onClick={onSendCode}
                    disabled={authBusy}
                  >
                    {t(lang, "重新发送验证码", "Resend code")}
                  </button>
                  <span style={{ color: "rgba(20,26,38,0.25)", margin: "0 10px" }}>·</span>
                  <button
                    type="button"
                    style={styles.authSecondaryLink}
                    onClick={() => {
                      onAuthCodeChange("");
                      onBackToEmail?.();
                    }}
                    disabled={authBusy}
                  >
                    {t(lang, "更换邮箱", "Change email")}
                  </button>
                </div>
              </>
            )}

            {/* ── 错误提示 ── */}
            {authHint ? <div style={styles.authHint}>{authHint}</div> : null}

            {/* ── 协议：底部小字，点按钮未勾则抖动 ── */}
            <div
              ref={consentRef}
              style={{
                ...styles.authConsentBlock,
                ...(lang === "zh" ? styles.authConsentBlockZh : null),
                ...(consentShake ? { animation: "spx-shake 0.65s ease", outline: "2px solid rgba(239,68,68,0.55)", outlineOffset: 4, borderRadius: 8 } : null)
              }}
            >
              <label style={{ ...styles.authCheckboxRow, ...(lang === "zh" ? styles.authCheckboxRowZh : null) }}>
                <input
                  type="checkbox"
                  style={{ ...styles.authCheckboxInput, ...(authLegalAccepted ? styles.authCheckboxInputOn : null) }}
                  checked={authLegalAccepted}
                  onChange={(e) => onAuthLegalAcceptedChange(e.target.checked)}
                  data-testid="account-auth-legal-consent"
                />
                <span style={styles.authConsentText}>
                  <span style={styles.authConsentLine}>{authConsentLine1}</span>
                  <span style={styles.authConsentLine}>{authConsentLine2}</span>
                </span>
              </label>
              <div style={styles.authLegalInline}>
                <a href="/privacy" style={styles.authLegalRouteLink} data-testid="account-legal-open-privacy">
                  {t(lang, "隐私协议", "Privacy")}
                </a>
                <span style={styles.authLegalDot}>·</span>
                <a href="/terms" style={styles.authLegalRouteLink} data-testid="account-legal-open-terms">
                  {t(lang, "服务协议", "Terms")}
                </a>
              </div>
            </div>

          </div>
        ) : null}

        {user ? (
          <div style={styles.panelStack}>
            {section === "overview" ? (
              <div style={styles.panel}>
                {/* User info card */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px", borderRadius: 6,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: "#f59e0b22", border: "2px solid #f59e0b44",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <UserRound size={20} style={{ color: "#f59e0b" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: hasProAccess ? "rgba(245,158,11,0.15)" : "rgba(156,163,175,0.15)",
                        color: hasProAccess ? "#f59e0b" : "#9ca3af",
                        border: `1px solid ${hasProAccess ? "rgba(245,158,11,0.3)" : "rgba(156,163,175,0.3)"}`,
                      }}>
                        {hasProAccess ? "PRO" : "FREE"}
                      </span>
                      <span>{creditsBalance} {t(lang, "积分", "credits")}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button type="button" onClick={() => onSectionChange("credits")} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 14px", borderRadius: 4, cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb",
                    fontSize: 13, textAlign: "left" as const,
                  }}>
                    <CreditCard size={15} style={{ color: "#9ca3af", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{t(lang, "充值积分", "Buy Credits")}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{t(lang, "当前余额", "Balance")}: {creditsBalance}</div>
                    </div>
                    <span style={{ color: "#6b7280", fontSize: 16 }}>›</span>
                  </button>

                  {!hasProAccess && (
                    <button type="button" onClick={() => onSectionChange("pro")} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 14px", borderRadius: 4, cursor: "pointer",
                      border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", color: "#e5e7eb",
                      fontSize: 13, textAlign: "left" as const,
                    }}>
                      <Crown size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: "#f59e0b" }}>{t(lang, "升级 Pro", "Upgrade to Pro")}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{t(lang, "解锁 API 接入、本地生成", "Unlock API access & local generation")}</div>
                      </div>
                      <span style={{ color: "#f59e0b", fontSize: 16 }}>›</span>
                    </button>
                  )}

                  {subscription?.status === "active" && (
                    <button type="button" onClick={onOpenCustomerPortal} disabled={!billingEnabled || billingBusy} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 14px", borderRadius: 4, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e5e7eb",
                      fontSize: 13, textAlign: "left" as const,
                    }}>
                      <CreditCard size={15} style={{ color: "#9ca3af", flexShrink: 0 }} />
                      <span>{t(lang, "管理订阅", "Manage Subscription")}</span>
                    </button>
                  )}
                </div>

                {billingNotice && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 12, lineHeight: 1.5 }}>{billingNotice}</div>
                )}

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <button type="button" onClick={onLogout} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                    border: "none", background: "transparent", color: "#f87171",
                    fontSize: 12,
                  }}>
                    <LogOut size={13} />
                    {t(lang, "退出登录", "Log Out")}
                  </button>
                </div>
              </div>
            ) : null}

            {section === "credits" ? (
              <div style={styles.panel}>
                {/* Current balance */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 6,
                  background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                  marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>{t(lang, "当前积分", "Current Balance")}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b" }}>{creditsBalance.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", textAlign: "right", lineHeight: 1.6 }}>
                    <div>{t(lang, "图片生成 3 积分", "Image gen 3 credits")}</div>
                    <div>{t(lang, "视频生成 5 积分", "Video gen 5 credits")}</div>
                    <div>{t(lang, "提示词导出免费", "Prompt export free")}</div>
                  </div>
                </div>

                {/* Credit packs */}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb", marginBottom: 10 }}>
                  {t(lang, "购买积分", "Buy Credits")}
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {creditPacks.map((pack) => {
                    const perCredit = (pack.usdPrice / pack.credits * 100).toFixed(1);
                    const isBest = pack.id === "pack_15";
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => setSelectedPackId(pack.id === selectedPackId ? null : pack.id)}
                        disabled={!billingEnabled || billingBusy || !billingLegalAccepted}
                        data-testid={`account-credit-pack-${pack.id}`}
                        style={{
                          flex: 1, padding: "14px 10px", borderRadius: 6, cursor: "pointer",
                          border: selectedPackId === pack.id ? "2px solid #f59e0b" : isBest ? "1px solid rgba(245,158,11,0.3)" : "1px solid #3a3f46",
                          background: selectedPackId === pack.id ? "rgba(245,158,11,0.1)" : isBest ? "rgba(245,158,11,0.03)" : "#24262b",
                          color: "#e5e7eb", textAlign: "center", position: "relative",
                          transition: "border-color 0.1s",
                          opacity: (!billingEnabled || billingBusy) ? 0.5 : 1,
                        }}
                      >
                        {isBest && (
                          <div style={{
                            position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                            background: "#f59e0b", color: "#111", fontSize: 9, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 6,
                          }}>{t(lang, "最划算", "Best Value")}</div>
                        )}
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b", marginBottom: 2 }}>
                          {pack.credits}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                          {t(lang, "积分", "credits")}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb" }}>
                          ${pack.usdPrice}
                        </div>
                        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                          ≈ ¢{perCredit} / credit
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Confirm button */}
                {selectedPackId && (
                  <button
                    type="button"
                    disabled={!billingEnabled || billingBusy}
                    onClick={() => {
                      if (!billingLegalAccepted) {
                        setConsentShake(true);
                        setTimeout(() => setConsentShake(false), 700);
                        consentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        return;
                      }
                      onPurchasePack(selectedPackId);
                    }}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 4,
                      border: "none",
                      background: billingLegalAccepted ? "#f59e0b" : "#3a3f46",
                      color: billingLegalAccepted ? "#111" : "#9ca3af",
                      fontSize: 13, fontWeight: 700,
                      cursor: (!billingEnabled || billingBusy) ? "not-allowed" : "pointer",
                      marginBottom: 8,
                    }}
                  >
                    {billingBusy ? t(lang, "处理中…", "Processing…") : (() => {
                      const p = creditPacks.find(pk => pk.id === selectedPackId);
                      return p ? t(lang, `购买 ${p.credits} 积分 — $${p.usdPrice}`, `Buy ${p.credits} credits — $${p.usdPrice}`) : t(lang, "确认购买", "Confirm");
                    })()}
                  </button>
                )}

                {/* Legal consent — compact */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={billingLegalAccepted}
                    onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#f59e0b", flexShrink: 0 }}
                    data-testid="account-billing-legal-consent"
                  />
                  <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                    {t(lang, "我已阅读并同意", "I agree to the")}{" "}
                    <button type="button" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}
                      onClick={() => setActiveLegalDoc("billing")}>{t(lang, "付款条款", "Billing Terms")}</button>
                    {" "}{t(lang, "和", "and")}{" "}
                    <button type="button" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}
                      onClick={() => setActiveLegalDoc("refund")}>{t(lang, "退款政策", "Refund Policy")}</button>
                  </span>
                </div>

                {/* Recent ledger — collapsed */}
                {ledger.length > 0 && (
                  <details style={{ cursor: "pointer" }}>
                    <summary style={{ fontSize: 11, color: "#6b7280", userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 10 }}>▸</span>
                      {t(lang, "最近流水", "Recent transactions")}
                    </summary>
                    <div style={styles.ledgerList}>
                      {ledger.slice(0, 6).map((item) => (
                        <div key={item.id} style={styles.ledgerRow}>
                          <span>{ledgerLabel(lang, item.kind)}</span>
                          <span style={{ color: item.credits > 0 ? "#22c55e" : "#f87171" }}>
                            {item.credits > 0 ? `+${item.credits}` : item.credits}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ) : null}

            {section === "pro" ? (
              <div style={styles.panel}>
                {user.tier === "pro" ? (
                  /* Already Pro */
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "14px 16px", borderRadius: 6,
                      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                      marginBottom: 16,
                    }}>
                      <Crown size={22} style={{ color: "#f59e0b", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{t(lang, "Pro 已激活", "Pro Active")}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {t(lang, `每月 ${proPlan?.monthlyCredits ?? 700} 积分 · API 接入 · 本地连接`, `${proPlan?.monthlyCredits ?? 700} credits/mo · API access · Local`)}
                        </div>
                      </div>
                    </div>
                    {subscription?.status === "active" && (
                      <button type="button" style={styles.secondaryBtn} onClick={onOpenCustomerPortal}
                        disabled={!billingEnabled || billingBusy}>
                        {t(lang, "管理订阅", "Manage Subscription")}
                      </button>
                    )}
                  </div>
                ) : (
                  /* Upgrade to Pro */
                  <div>
                    {/* Hero card */}
                    <div style={{
                      padding: "16px 0", marginBottom: 16,
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <Crown size={20} style={{ color: "#f59e0b" }} />
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>Pro</div>
                        <div style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 400 }}>
                          ${proPlan?.monthlyUsdPrice ?? 12}{t(lang, " / 月", "/mo")}
                        </div>
                      </div>
                      {/* Benefits list */}
                      {[
                        [t(lang, "每月积分补充", "Monthly credit refill"), t(lang, "每月随套餐配额", "Included with plan")],
                        [t(lang, "接入自己的 API Key", "Bring your own API key"), t(lang, "fal / Runway — 不消耗积分", "fal / Runway — no credits used")],
                        [t(lang, "本地生成", "Local generation"), t(lang, "ComfyUI / Draw Things 接入", "ComfyUI / Draw Things")],
                        [t(lang, "专业模版全解锁", "All pro templates"), t(lang, "商业大片级别模版", "Commercial-grade templates")],
                      ].map(([title, sub], i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                          <span style={{ color: "#f59e0b", fontSize: 14, marginTop: 1 }}>✓</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>{title}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Legal consent */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
                      <input type="checkbox" checked={billingLegalAccepted}
                        onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                        style={{ marginTop: 2, accentColor: "#f59e0b", flexShrink: 0 }}
                        data-testid="account-pro-legal-consent"
                      />
                      <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                        {t(lang, "我已阅读并同意", "I agree to the")}{" "}
                        <button type="button" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}
                          onClick={() => setActiveLegalDoc("billing")}>{t(lang, "付款条款", "Billing Terms")}</button>
                        {" "}{t(lang, "和", "and")}{" "}
                        <button type="button" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}
                          onClick={() => setActiveLegalDoc("refund")}>{t(lang, "退款政策", "Refund Policy")}</button>
                      </span>
                    </div>

                    <button type="button" style={{
                        ...styles.primaryBtn,
                        background: billingLegalAccepted ? "#f59e0b" : "#3a3f46",
                        color: billingLegalAccepted ? "#111" : "#9ca3af",
                        cursor: (!billingEnabled || billingBusy || !proPlan || !billingLegalAccepted) ? "not-allowed" : "pointer",
                      }} onClick={() => {
                        if (!billingLegalAccepted) {
                          setConsentShake(true);
                          setTimeout(() => setConsentShake(false), 700);
                          return;
                        }
                        onUpgradePro();
                      }}
                      disabled={!billingEnabled || billingBusy || !proPlan}
                      data-testid="account-pro-upgrade">
                      <Crown size={14} />{t(lang, "开通 Pro", "Start Pro")} — ${proPlan?.monthlyUsdPrice ?? 12}{t(lang, "/月", "/mo")}
                    </button>
                    {!billingLegalAccepted && (
                      <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>
                        {t(lang, "请先勾选同意服务条款", "Please agree to the terms first")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {section === "api" ? (
              <div style={styles.panel}>
                <ApiProviderPanel
                  lang={lang}
                  apiCredentials={apiCredentials}
                  onSave={onSaveApiCredentials}
                  hasProAccess={hasProAccess}
                  onUpgradePro={onUpgradePro}
                  comfyStatus={localComfyStatus ?? { provider: "comfyui", state: "idle" }}
                  drawStatus={localDrawStatus ?? { provider: "drawthings", state: "idle" }}
                  onRefreshLocal={onRefreshLocalProviders ?? (() => Promise.resolve())}
                />
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

function maskSecret(secret: string): string {
  if (!secret || secret.length === 0) return "";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}

/** Normalize for storage/display; keeps full structure. */
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

/** For form draft: never put raw key in state; keys cleared so UI never displays plaintext. */
function normalizeApiCredentialsForForm(input: ApiCredentialState | null): ApiCredentialState {
  const base = normalizeApiCredentials(input);
  return {
    ...base,
    fal: { ...base.fal, apiKey: "" },
    runway: { ...base.runway, apiKey: "" }
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

function providerStatusLabel(lang: Lang, status: ProviderConnectionStatus | null | undefined): string {
  if (!status) return "";
  const map: Record<ProviderConnectionStatus, string> = {
    connected: lang === "zh" ? "已连接" : "Connected",
    invalid_key: lang === "zh" ? "Key 无效" : "Invalid key",
    quota_issue: lang === "zh" ? "配额问题" : "Quota issue",
    model_access_issue: lang === "zh" ? "模型权限问题" : "Model access issue",
    network_error: lang === "zh" ? "网络错误" : "Network error"
  };
  return map[status];
}

function renderProviderCard(input: {
  lang: Lang;
  providerId: ApiProviderId;
  title: string;
  subtitle: string;
  docsMeta: string;
  draft: ApiCredentialState;
  setDraft: React.Dispatch<React.SetStateAction<ApiCredentialState>>;
  savedCredentials: ApiCredentialState | null;
}) {
  const { lang, providerId, title, subtitle, docsMeta, draft, setDraft, savedCredentials } = input;
  const provider = draft[providerId];
  const saved = savedCredentials?.[providerId];
  const savedHasKey = Boolean(saved?.apiKey?.trim());
  const status = saved?.status ?? provider.status;
  const lastCheckedAt = saved?.lastCheckedAt ?? provider.lastCheckedAt;
  const isError = status && status !== "connected";

  return (
    <article style={styles.providerCard} data-testid={`account-api-provider-${providerId}`}>
      <div style={styles.providerHead}>
        <div>
          <div style={styles.providerTitleRow}>
            <div style={styles.packTitle}>{title}</div>
            {draft.defaultProvider === providerId ? (
              <span style={styles.defaultBadge}><CheckCircle2 size={12} />{t(lang, "默认", "Default")}</span>
            ) : null}
            {status === "connected" ? (
              <span style={styles.connectedBadge}><CheckCircle2 size={12} />{providerStatusLabel(lang, status)}</span>
            ) : isError ? (
              <span style={styles.errorBadge}><AlertCircle size={12} />{providerStatusLabel(lang, status)}</span>
            ) : null}
          </div>
          <div style={styles.apiMeta}>{subtitle}</div>
          <div style={styles.providerMeta}>{docsMeta}</div>
          {lastCheckedAt && status ? (
            <div style={styles.lastChecked}>
              {t(lang, "检查于", "Checked")} {new Date(lastCheckedAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US", { dateStyle: "short", timeStyle: "short" })}
            </div>
          ) : null}
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

      {isError && provider.mode === "personal" ? (
        <div style={styles.errorActions}>
          <span style={styles.errorDetail}>{t(lang, "请检查 key 或重试", "Check key or try again")}</span>
          <span style={styles.errorHint}>{t(lang, "保存后将重新检查连接", "Connection is rechecked on save.")}</span>
        </div>
      ) : null}

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
            type="password"
            autoComplete="off"
            value={provider.apiKey}
            onChange={(e) => setDraft((current) => updateProviderDraft(current, providerId, { apiKey: e.target.value }))}
            placeholder={savedHasKey ? "••••••••••••" : (providerId === "fal" ? "Key ..." : "Bearer token")}
            style={styles.input}
            data-testid={`account-api-provider-key-${providerId}`}
          />
          {savedHasKey && !provider.apiKey ? (
            <span style={styles.fieldHint}>{t(lang, "留空则保留当前 key", "Leave blank to keep current key")}</span>
          ) : null}
        </label>
      ) : (
        <div style={styles.apiHint} data-testid={`account-api-provider-platform-${providerId}`}>
          {t(
            lang,
            "平台模式使用 ScenePilot Credits 和服务端代理，无需填写 key。",
            "Platform mode uses ScenePilot Credits and server-side proxy; no key needed."
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
    background: "rgba(7,10,16,0.42)",
    backdropFilter: "blur(10px)",
    display: "grid",
    placeItems: "center",
    zIndex: 9000,
    padding: 16
  },
  modal: {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "min(86vh, 920px)",
    overflowY: "auto",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#16181d",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    padding: 20,
    color: "#f7f7fb"
  },
  modalAuth: {
    width: "min(560px, calc(100vw - 28px))",
    background: "linear-gradient(180deg, #f7f8fb 0%, #f2f4f9 100%)",
    border: "1px solid rgba(18,22,32,0.1)",
    color: "#161b27",
    boxShadow: "0 16px 48px rgba(5,10,20,0.28)"
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18
  },
  headAuth: {
    marginBottom: 2
  },
  headAuthSpacer: {
    width: 1,
    height: 1
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 4
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.01em"
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
  iconBtnAuth: {
    border: "1px solid rgba(18,22,32,0.16)",
    background: "rgba(255,255,255,0.74)",
    color: "#1a2233"
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    marginBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tab: {
    borderRadius: 0,
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    color: "#9ca3af",
    height: 36,
    padding: "0 14px",
    marginBottom: -1,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "color 120ms, border-color 120ms",
  },
  tabOn: {
    borderBottom: "2px solid #f59e0b",
    color: "#f7f7fb",
    fontWeight: 600,
  },
  panelStack: {
    display: "grid",
    gap: 14
  },
  panel: {
    borderRadius: 0,
    border: "none",
    background: "transparent",
    padding: "4px 0",
    display: "grid",
    gap: 12
  },
  authPanel: {
    borderRadius: 20,
    border: "1px solid rgba(18,22,32,0.1)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.44))",
    padding: "6px 14px 10px",
    display: "grid",
    gap: 12
  },
  authHero: {
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
    gap: 8,
    marginTop: 4
  },
  authHeroTitle: {
    fontSize: 44,
    lineHeight: 1.03,
    fontWeight: 800,
    letterSpacing: "-0.042em",
    color: "#151a26"
  },
  authHeroSub: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "rgba(20,26,38,0.72)"
  },
  authHeroLink: {
    border: "none",
    padding: 0,
    background: "transparent",
    color: "#2f5fbf",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer"
  },
  authInput: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    height: 50,
    borderRadius: 6,
    border: "1px solid rgba(20,24,32,0.15)",
    background: "rgba(255,255,255,0.76)",
    color: "#121622",
    padding: "0 16px",
    fontSize: 15,
    outline: "none"
  },
  authPrimaryBtn: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    height: 52,
    borderRadius: 999,
    border: "1px solid #0f1625",
    background: "#0f1625",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer"
  },
  authSecondaryLink: {
    border: "none",
    padding: 0,
    background: "transparent",
    color: "#2f5fbf",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  authOrRow: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 10,
    marginTop: 0
  },
  authOrLine: {
    height: 1,
    background: "rgba(20,24,32,0.16)"
  },
  authOrText: {
    fontSize: 13,
    color: "rgba(20,24,32,0.72)",
    letterSpacing: "0.03em"
  },
  authGoogleBtn: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    height: 50,
    borderRadius: 999,
    border: "1px solid rgba(25,48,89,0.55)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(236,242,255,0.98))",
    color: "#2a2e39",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    fontWeight: 680,
    fontSize: 14,
    boxShadow: "0 0 0 1px rgba(16,35,71,0.22), 0 12px 26px rgba(16,35,71,0.14)"
  },
  authGoogleGlyph: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#ffffff",
    border: "1px solid rgba(20,24,32,0.16)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4285F4",
    fontWeight: 800,
    fontSize: 13
  },
  authSkipBtn: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    marginTop: 4,
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    color: "rgba(20,24,32,0.56)",
    fontSize: 12,
    fontWeight: 560,
    cursor: "pointer"
  },
  authLegalInline: {
    display: "inline-flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 12,
    color: "rgba(15,17,23,0.6)",
    marginTop: 0
  },
  authConsentBlock: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    display: "grid",
    gap: 8
  },
  authEnvHint: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    padding: "10px 14px",
    borderRadius: 6,
    background: "rgba(255,180,80,0.12)",
    border: "1px solid rgba(255,180,80,0.35)",
    color: "rgba(40,28,10,0.9)",
    fontSize: 12,
    lineHeight: 1.5
  },
  authConsentBlockZh: {
    alignItems: "center",
    textAlign: "center"
  },
  authCheckboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 11.5,
    lineHeight: 1.45,
    color: "rgba(17,23,35,0.78)"
  },
  authCheckboxRowZh: {
    justifyContent: "center"
  },
  authCheckboxInput: {
    marginTop: 1,
    appearance: "none",
    width: 14,
    height: 14,
    borderRadius: 4,
    border: "1px solid #0f1523",
    background: "#ffffff",
    outline: "none",
    cursor: "pointer",
    flex: "0 0 auto"
  },
  authCheckboxInputOn: {
    borderColor: "#1a2336",
    backgroundColor: "#1a2336",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 6.4 5 8.4 9 3.8' fill='none' stroke='%23ffffff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    backgroundSize: "11px 11px",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  },
  authLegalDot: {
    color: "rgba(15,17,23,0.38)"
  },
  authConsentText: {
    display: "grid",
    gap: 1
  },
  authConsentLine: {
    display: "block"
  },
  authLegalRouteLink: {
    fontSize: 11,
    fontWeight: 600,
    textDecoration: "none",
    color: "rgba(15,17,23,0.62)"
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
  connectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.15)",
    color: "#86efac",
    fontSize: 11,
    fontWeight: 600
  },
  errorBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    fontSize: 11,
    fontWeight: 600
  },
  lastChecked: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4
  },
  errorActions: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "8px 10px",
    borderRadius: 4,
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)"
  },
  errorDetail: {
    fontSize: 12,
    color: "#fca5a5"
  },
  errorHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)"
  },
  fieldHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)"
  },
  upgradeCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)"
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
    borderRadius: 6,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)"
  },
  summaryCard: {
    /* removed nested card style */
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
    borderRadius: 6,
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
  authHint: {
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    fontSize: 11,
    lineHeight: 1.5,
    color: "rgba(30,36,48,0.86)",
    borderRadius: 12,
    padding: "8px 10px",
    border: "1px solid rgba(20,24,32,0.14)",
    background: "rgba(255,255,255,0.64)"
  },
  legalCard: {
    marginTop: 2,
    borderRadius: 6,
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
    fontWeight: 600,
    textDecoration: "none"
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
    borderRadius: 6,
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
  legalRouteLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  legalRouteLink: {
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(247,247,251,0.9)",
    padding: "0 12px",
    fontSize: 12,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    fontWeight: 600
  },
  legalContact: {
    color: "rgba(198,206,227,0.88)",
    fontSize: 12.5,
    lineHeight: 1.5
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
    zIndex: 9100,
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
