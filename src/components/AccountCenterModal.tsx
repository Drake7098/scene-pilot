import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Crown, KeyRound, UserRound, Wallet, X } from "lucide-react";
import type { AccountCenterSection, ApiCredentialState, ApiProviderId, CloudApiProviderId, UserState } from "../types/account";
import { getProAccessState } from "../utils/entitlement";
import type { CreditLedgerEntry, CreditPackConfig, ProPlanConfig, SubscriptionState } from "../types/billing";
import type { Lang } from "../i18n";
import { LEGAL_DOCS, legalText, type LegalDocId } from "../content/legal";
import { PUBLIC_CONTACT_CHANNELS, SYSTEM_NOTIFICATION_MAILBOX } from "../config/contactChannels";
import { loadLocalProviderConfig, saveLocalProviderConfig } from "../utils/localProviderConfig";
import { acknowledgePolicy, hasPolicyAck, logPolicyAction } from "../services/policyAckService";


function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type IntegrationStatus = "connected" | "disconnected" | "pro_required";
type IntegrationItem = {
  id: ApiProviderId;
  label: string;
  tagsZh: string[];
  tagsEn: string[];
  kind: "cloud" | "local";
  availability?: "active" | "coming_soon";
};

const CAPABILITY_EXPLAINERS = [
  { id: "general", titleZh: "通用生成", titleEn: "General Generation", descZh: "一套 API 覆盖大量模型", descEn: "One API covers many models" },
  { id: "video", titleZh: "视频生成", titleEn: "Video Generation", descZh: "文生视频 / 图生视频", descEn: "Text-to-video and image-to-video" },
  { id: "image", titleZh: "图像生成", titleEn: "Image Generation", descZh: "高质量图片生成", descEn: "High-quality image generation" },
  { id: "control", titleZh: "控制类", titleEn: "Control", descZh: "参考图 / 控制图 / 一致性", descEn: "Reference, control, and consistency" },
  { id: "local", titleZh: "本地", titleEn: "Local", descZh: "本机执行，高自由度", descEn: "Run locally with high flexibility" },
  { id: "custom", titleZh: "自定义", titleEn: "Custom", descZh: "私有或第三方网关", descEn: "Private or third-party gateways" },
] as const;

const CLOUD_ITEMS: IntegrationItem[] = [
  { id: "fal", label: "Fal", tagsZh: ["通用", "图像", "控制"], tagsEn: ["General", "Image", "Control"], kind: "cloud" },
  { id: "replicate", label: "Replicate", tagsZh: ["通用", "图像", "控制"], tagsEn: ["General", "Image", "Control"], kind: "cloud" },
  { id: "runway", label: "Runway", tagsZh: ["视频"], tagsEn: ["Video"], kind: "cloud" },
  { id: "stability", label: "Stability", tagsZh: ["图像"], tagsEn: ["Image"], kind: "cloud" },
  { id: "luma", label: "Luma", tagsZh: ["视频"], tagsEn: ["Video"], kind: "cloud", availability: "coming_soon" },
  { id: "pika", label: "Pika", tagsZh: ["视频"], tagsEn: ["Video"], kind: "cloud", availability: "coming_soon" },
];

const LOCAL_ITEMS: IntegrationItem[] = [
  { id: "comfyui", label: "ComfyUI", tagsZh: ["本地", "控制"], tagsEn: ["Local", "Control"], kind: "local" },
  { id: "drawthings", label: "Draw Things", tagsZh: ["本地"], tagsEn: ["Local"], kind: "local" },
];

const CUSTOM_ITEMS: IntegrationItem[] = [
  { id: "custom_api", label: "Custom API", tagsZh: ["自定义"], tagsEn: ["Custom"], kind: "cloud", availability: "coming_soon" },
];

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
  onGoGenerateSettings?: () => void;
  onGoTemplateStart?: () => void;
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
    onSaveApiCredentials,
    onGoGenerateSettings,
    onGoTemplateStart
  } = props;
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocId | null>(null);
  const [consentShake, setConsentShake] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<ApiProviderId | null>(null);
  const [connectionDraftValue, setConnectionDraftValue] = useState("");
  const [connectionDraftBaseUrl, setConnectionDraftBaseUrl] = useState("");
  const [connectionTestedOk, setConnectionTestedOk] = useState(false);
  const [connectionHint, setConnectionHint] = useState("");
  const [lastConnectedLabel, setLastConnectedLabel] = useState("");
  const [integrationRiskChecks, setIntegrationRiskChecks] = useState<[boolean, boolean, boolean]>([false, false, false]);
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
    if (!creditPacks.length) return;
    const maxPack = [...creditPacks].sort((a, b) => b.credits - a.credits)[0];
    if (!selectedPackId) setSelectedPackId(maxPack?.id ?? null);
  }, [creditPacks, selectedPackId]);

  const title = useMemo(() => {
    if (!user) return t(lang, "注册 / 登录", "Sign Up / Sign In");
    if (section === "credits") return t(lang, "Credits", "Credits");
    if (section === "pro") return "Pro";
    if (section === "api" || section === "local") return t(lang, "API Keys", "API Keys");
    return t(lang, "Account", "Account");
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
  const localConfig = useMemo(() => loadLocalProviderConfig(), [connectionModalOpen]);
  const allIntegrationItems = useMemo(() => [...CLOUD_ITEMS, ...LOCAL_ITEMS, ...CUSTOM_ITEMS], []);
  const editingItem = editingProviderId ? allIntegrationItems.find((item) => item.id === editingProviderId) ?? null : null;
  const integrationPolicyAccepted = editingItem
    ? hasPolicyAck(user?.id ?? null, editingItem.kind === "local" ? "local_workflow" : "byo_api")
    : false;

  function cloudStatus(id: CloudApiProviderId): IntegrationStatus {
    if (!hasProAccess) return "pro_required";
    return apiCredentials?.[id]?.enabled ? "connected" : "disconnected";
  }

  function localStatus(id: "comfyui" | "drawthings"): IntegrationStatus {
    if (!hasProAccess) return "pro_required";
    if (id === "comfyui") return localComfyStatus?.state === "ready" ? "connected" : "disconnected";
    return localDrawStatus?.state === "ready" ? "connected" : "disconnected";
  }

  function cloudStatusLabel(id: CloudApiProviderId) {
    if (!hasProAccess) return { code: "pro_required", label: t(lang, "Pro 限定", "Pro Required"), color: "#9ca3af" };
    const current = apiCredentials?.[id];
    if (current?.status && current.status !== "connected") {
      return { code: "error", label: t(lang, "错误", "Error"), color: "#ef4444" };
    }
    if (current?.enabled) return { code: "connected", label: t(lang, "已连接", "Connected"), color: "#22c55e" };
    return { code: "disconnected", label: t(lang, "未连接", "Disconnected"), color: "#9ca3af" };
  }

  function localStatusLabel(id: "comfyui" | "drawthings") {
    if (!hasProAccess) return { code: "pro_required", label: t(lang, "Pro 限定", "Pro Required"), color: "#9ca3af" };
    const state = id === "comfyui" ? localComfyStatus?.state : localDrawStatus?.state;
    if (state === "error") return { code: "error", label: t(lang, "错误", "Error"), color: "#ef4444" };
    if (state === "ready") return { code: "connected", label: t(lang, "已连接", "Connected"), color: "#22c55e" };
    return { code: "disconnected", label: t(lang, "未连接", "Disconnected"), color: "#9ca3af" };
  }

  function openConnectionModal(item: IntegrationItem) {
    if (!hasProAccess) {
      onUpgradePro();
      return;
    }
    setEditingProviderId(item.id);
    setConnectionTestedOk(false);
    setConnectionHint("");
    setLastConnectedLabel("");
    if (item.kind === "local") {
      setConnectionDraftValue(item.id === "comfyui" ? localConfig.comfyUrl : localConfig.drawUrl);
      setConnectionDraftBaseUrl("");
    } else {
      const current = normalizeApiCredentials(apiCredentials)[item.id];
      setConnectionDraftValue("");
      setConnectionDraftBaseUrl(current.baseUrl || "");
    }
    const acknowledged = hasPolicyAck(user?.id ?? null, item.kind === "local" ? "local_workflow" : "byo_api");
    setIntegrationRiskChecks(acknowledged ? [true, true, true] : [false, false, false]);
    setConnectionModalOpen(true);
  }

  async function handleTestConnection() {
    if (!editingItem) return;
    const primaryValue = connectionDraftValue.trim();
    const baseUrlValue = connectionDraftBaseUrl.trim();
    if (editingItem.kind === "local") {
      if (!primaryValue) {
        setConnectionTestedOk(false);
        setConnectionHint(t(lang, "请输入本地地址", "Enter the local URL"));
        return;
      }
      const nextCfg = { ...localConfig };
      if (editingItem.id === "comfyui") nextCfg.comfyUrl = primaryValue;
      if (editingItem.id === "drawthings") nextCfg.drawUrl = primaryValue;
      saveLocalProviderConfig(nextCfg);
      await onRefreshLocalProviders?.();
      const connected = editingItem.id === "comfyui" ? localComfyStatus?.state === "ready" : localDrawStatus?.state === "ready";
      if (connected) {
        setConnectionTestedOk(true);
        setConnectionHint(t(lang, "测试成功，可保存", "Connection looks good. You can save now."));
      } else {
        setConnectionTestedOk(false);
        setConnectionHint(t(lang, "当前未检测到服务，请检查地址与本地服务状态", "Service was not detected. Check the URL and local runtime."));
      }
      return;
    }
    const currentConfig = normalizeApiCredentials(apiCredentials)[editingItem.id];
    if (!primaryValue && currentConfig.enabled) {
      setConnectionTestedOk(true);
      setConnectionHint(t(lang, "保留现有 Key，可直接保存", "Keeping the current key. You can save now."));
      return;
    }
    if (!primaryValue) {
      setConnectionTestedOk(false);
      setConnectionHint(t(lang, "请输入 API Key", "Enter an API key"));
      return;
    }
    if (editingItem.id === "custom_api" && !baseUrlValue) {
      setConnectionTestedOk(false);
      setConnectionHint(t(lang, "Custom API 还需要 Base URL", "Custom API also needs a base URL"));
      return;
    }
    setConnectionTestedOk(true);
    setConnectionHint(t(lang, "已通过本地校验，可保存。实际可用性仍取决于第三方平台。", "Local validation passed. Actual availability still depends on the third-party platform."));
  }

  function handleSaveConnection() {
    if (!editingItem) return;
    if (!connectionTestedOk) {
      setConnectionHint(t(lang, "请先测试连接", "Test the connection first"));
      return;
    }
    if (!integrationPolicyAccepted && integrationRiskChecks.some((item) => !item)) {
      setConnectionHint(t(lang, "请先确认接入风险提示。", "Please confirm the integration disclosures first."));
      return;
    }
    if (editingItem.kind === "local") {
      const nextCfg = { ...localConfig };
      const value = connectionDraftValue.trim();
      if (editingItem.id === "comfyui") nextCfg.comfyUrl = value;
      if (editingItem.id === "drawthings") nextCfg.drawUrl = value;
      saveLocalProviderConfig(nextCfg);
      void onRefreshLocalProviders?.();
      if (!integrationPolicyAccepted) {
        acknowledgePolicy(user?.id ?? null, "local_workflow");
        logPolicyAction(user?.id ?? null, "enable_local_workflow", "local_workflow");
      }
      setLastConnectedLabel(editingItem.label);
      setConnectionModalOpen(false);
      return;
    }
    const next = normalizeApiCredentials(apiCredentials);
    const current = next[editingItem.id];
    onSaveApiCredentials({
      ...next,
      [editingItem.id]: {
        ...current,
        enabled: true,
        mode: "personal",
        apiKey: connectionDraftValue.trim() || current.apiKey,
        baseUrl: connectionDraftBaseUrl.trim() || current.baseUrl,
        status: "connected",
      },
    });
    if (!integrationPolicyAccepted) {
      acknowledgePolicy(user?.id ?? null, "byo_api");
      logPolicyAction(user?.id ?? null, "save_api_key", "byo_api");
    }
    setLastConnectedLabel(editingItem.label);
    setConnectionModalOpen(false);
  }

  function handleDeleteConnection(item: IntegrationItem) {
    if (!hasProAccess) {
      onUpgradePro();
      return;
    }
    if (item.kind === "local") {
      const nextCfg = { ...localConfig };
      if (item.id === "comfyui") nextCfg.comfyUrl = "";
      if (item.id === "drawthings") nextCfg.drawUrl = "";
      saveLocalProviderConfig(nextCfg);
      void onRefreshLocalProviders?.();
      return;
    }
    const next = normalizeApiCredentials(apiCredentials);
    onSaveApiCredentials({
      ...next,
      [item.id]: {
        ...next[item.id],
        enabled: false,
        apiKey: "",
        status: null,
      },
    });
  }

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
              <UserRound size={14} />{t(lang, "Account", "Account")}
            </button>
            <button type="button" style={{ ...styles.tab, ...(section === "credits" ? styles.tabOn : null) }} onClick={() => onSectionChange("credits")}>
              <Wallet size={14} />{t(lang, "Credits", "Credits")}
            </button>
            <button type="button" style={{ ...styles.tab, ...(section === "pro" ? styles.tabOn : null) }} onClick={() => onSectionChange("pro")}>
              <Crown size={14} />Pro
            </button>
            <button type="button" style={{ ...styles.tab, ...(section === "api" ? styles.tabOn : null) }} onClick={() => onSectionChange("api")}>
              <KeyRound size={14} />{t(lang, "API Keys", "API Keys")}
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
                <div style={styles.sectionHeading}>{t(lang, "账户状态", "Account Status")}</div>
                <div style={styles.sectionDesc}>{t(lang, "查看当前账户、登录方式和方案。", "Review your account, sign-in method, and plan.")}</div>
                <div style={{ display: "grid", gap: 0, borderTop: "1px solid #3a3f46", borderBottom: "1px solid #3a3f46" }}>
                  {[
                    [t(lang, "用户名", "Username"), user.displayName || user.email.split("@")[0]],
                    [t(lang, "邮箱", "Email"), user.email],
                    [t(lang, "当前方案", "Current Plan"), hasProAccess ? "Pro" : "Free"],
                    [t(lang, "登录方式", "Sign-in"), t(lang, "账户登录", "Account sign-in")],
                  ].map(([k, v], idx) => (
                    <div key={String(k)} style={{ display: "grid", gridTemplateColumns: "160px 1fr", padding: "12px 0", borderBottom: idx === 3 ? "none" : "1px solid #3a3f46" }}>
                      <div style={{ fontSize: 13, color: "#9ca3af" }}>{k}</div>
                      <div style={{ fontSize: 14, color: "#e5e7eb", textAlign: "right", fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 8 }}>
                  <button type="button" style={styles.secondaryBtn} onClick={onOpenCustomerPortal}>
                    <CreditCard size={14} />{t(lang, "管理账单", "Manage Billing")}
                  </button>
                  <button type="button" style={styles.primaryBtn} onClick={onUpgradePro}>
                    <Crown size={14} />{t(lang, "Upgrade to Pro", "Upgrade to Pro")}
                  </button>
                </div>
              </div>
            ) : null}

            {section === "credits" ? (
              <div style={styles.panel}>
                <div style={styles.sectionHeading}>{t(lang, "Credits 余额", "Credits Balance")}</div>
                <div style={styles.sectionDesc}>
                  {t(lang, "Credits 用于模板、高级功能和未来站内能力；这里不再承接官方生成。", "Credits stay available for templates, advanced features, and future in-product capabilities. They no longer represent hosted generation.")}
                </div>
                <div style={{ marginBottom: 10, fontSize: 13, color: "#9ca3af" }}>{t(lang, "Credits Balance", "Credits Balance")}</div>
                <div style={{ fontSize: 34, fontWeight: 760, color: "#e5e7eb", marginBottom: 16, lineHeight: 1 }}>{creditsBalance.toLocaleString()}</div>
                <div style={{ borderTop: "1px solid #3a3f46", borderBottom: "1px solid #3a3f46" }}>
                  {[
                    { id: "pack_3", credits: 150, usdPrice: 3 },
                    { id: "pack_8", credits: 420, usdPrice: 8 },
                    { id: "pack_15", credits: 800, usdPrice: 15 },
                  ].map((pack, idx) => (
                    <label key={pack.id} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: idx === 2 ? "none" : "1px solid #3a3f46", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="credit_pack"
                        checked={selectedPackId === pack.id}
                        onChange={() => setSelectedPackId(pack.id)}
                        style={{ accentColor: "#f59e0b" }}
                      />
                      <span style={{ fontSize: 14, color: "#e5e7eb" }}>{pack.credits} Credits</span>
                      <span style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 700 }}>${pack.usdPrice}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    disabled={!billingEnabled || billingBusy || !selectedPackId}
                    onClick={() => selectedPackId && onPurchasePack(selectedPackId)}
                  >
                    <CreditCard size={14} />
                    {t(lang, "Buy Credits", "Buy Credits")}
                  </button>
                </div>
              </div>
            ) : null}

            {section === "pro" ? (
              <div style={styles.panel}>
                <div style={styles.sectionHeading}>Pro Plan</div>
                <div style={styles.sectionDesc}>
                  {t(lang, "Pro 面向高频创作和专业交付，重点解锁 API、本地执行和更完整模板能力。", "Pro is built for professional workflows with API access, local execution, and richer templates.")}
                </div>
                <div style={{ borderTop: "1px solid #3a3f46", borderBottom: "1px solid #3a3f46" }}>
                  {[
                    t(lang, "使用自己的 API", "Use your own API"),
                    t(lang, "本地生成（ComfyUI / Draw Things）", "Local generation (ComfyUI / Draw Things)"),
                    t(lang, "高级模板", "Advanced templates"),
                    t(lang, "更完整的创作能力", "Full creation workflow"),
                  ].map((item, idx) => (
                    <div key={item} style={{ padding: "12px 0", borderBottom: idx === 3 ? "none" : "1px solid #3a3f46", fontSize: 14, color: "#e5e7eb" }}>
                      {`✔ ${item}`}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: "#9ca3af" }}>{t(lang, "每月赠送 280 Credits", "Includes 280 Credits monthly")}</div>
                <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: "#e5e7eb" }}>$12 / {t(lang, "月", "month")}</div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button type="button" style={styles.primaryBtn} onClick={onUpgradePro}>
                    <Crown size={14} />{t(lang, "升级到 Pro", "Upgrade to Pro")}
                  </button>
                </div>
              </div>
            ) : null}

            {section === "api" || section === "local" ? (
              <div style={styles.panel}>
                <div style={styles.sectionHeading}>{t(lang, "接入管理", "Integration Management")}</div>
                <div style={styles.sectionDesc}>
                  {t(lang, "按能力管理 API 与本地引擎连接。所有接入能力都属于 Pro；工作台只会暴露已真正接通的执行项。", "Manage APIs and local engines by capability. All integrations are Pro features, and the workspace only exposes execution paths that are actually wired up.")}
                </div>
                <div style={styles.apiPageStack}>
                  <div style={styles.apiSectionBlock}>
                    <div style={styles.integrationGroupTitle}>{t(lang, "能力说明", "Capability Guide")}</div>
                    <div style={styles.capabilityGrid}>
                      {CAPABILITY_EXPLAINERS.map((item, idx) => (
                        <div key={item.id} style={{ ...styles.capabilityItem, ...(idx > 1 ? styles.capabilityItemCollapsed : null) }}>
                          <div style={styles.capabilityTitle}>{lang === "zh" ? item.titleZh : item.titleEn}</div>
                          <div style={styles.capabilityDesc}>{lang === "zh" ? item.descZh : item.descEn}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.apiSectionBlock}>
                    <div style={styles.integrationGroupTitle}>Cloud API</div>
                    <div style={styles.integrationList}>
                      {CLOUD_ITEMS.map((item, idx) => {
                        const status = cloudStatusLabel(item.id as CloudApiProviderId);
                        const hasConnection = status.code === "connected";
                        const isComingSoon = item.availability === "coming_soon";
                        return (
                          <div key={item.id} style={{ ...styles.providerRow, ...(idx === CLOUD_ITEMS.length - 1 ? styles.providerRowLast : null) }}>
                            <div style={styles.providerInfo}>
                              <div style={styles.providerNameRow}>
                                <span style={styles.providerName}>{item.label}</span>
                                {isComingSoon ? <span style={styles.comingSoonTag}>{t(lang, "即将支持", "Coming soon")}</span> : null}
                              </div>
                              <div style={styles.providerTagRow}>
                                {(lang === "zh" ? item.tagsZh : item.tagsEn).map((tag) => (
                                  <span key={tag} style={styles.providerTag}>{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</div>
                            <div style={styles.providerActions}>
                              <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => openConnectionModal(item)}>
                                {!hasProAccess ? t(lang, "升级 Pro", "Upgrade Pro") : hasConnection ? t(lang, "编辑", "Edit") : t(lang, "连接", "Connect")}
                              </button>
                              {hasProAccess && hasConnection ? (
                                <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => handleDeleteConnection(item)}>
                                  {t(lang, "删除", "Delete")}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.apiSectionBlock}>
                    <div style={styles.integrationGroupTitle}>Local</div>
                    <div style={styles.integrationList}>
                      {LOCAL_ITEMS.map((item, idx) => {
                        const status = localStatusLabel(item.id as "comfyui" | "drawthings");
                        const hasConnection = status.code === "connected";
                        return (
                          <div key={item.id} style={{ ...styles.providerRow, ...(idx === LOCAL_ITEMS.length - 1 ? styles.providerRowLast : null) }}>
                            <div style={styles.providerInfo}>
                              <div style={styles.providerName}>{item.label}</div>
                              <div style={styles.providerTagRow}>
                                {(lang === "zh" ? item.tagsZh : item.tagsEn).map((tag) => (
                                  <span key={tag} style={styles.providerTag}>{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</div>
                            <div style={styles.providerActions}>
                              <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => openConnectionModal(item)}>
                                {!hasProAccess ? t(lang, "升级 Pro", "Upgrade Pro") : hasConnection ? t(lang, "编辑", "Edit") : t(lang, "连接", "Connect")}
                              </button>
                              {hasProAccess && hasConnection ? (
                                <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => handleDeleteConnection(item)}>
                                  {t(lang, "删除", "Delete")}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.apiSectionBlock}>
                    <div style={styles.integrationGroupTitle}>Custom API</div>
                    <div style={styles.integrationList}>
                      {CUSTOM_ITEMS.map((item) => {
                        const status = cloudStatusLabel(item.id as CloudApiProviderId);
                        const hasConnection = status.code === "connected";
                        const isComingSoon = item.availability === "coming_soon";
                        return (
                          <div key={item.id} style={{ ...styles.providerRow, ...styles.providerRowLast }}>
                            <div style={styles.providerInfo}>
                              <div style={styles.providerNameRow}>
                                <span style={styles.providerName}>{item.label}</span>
                                {isComingSoon ? <span style={styles.comingSoonTag}>{t(lang, "即将支持", "Coming soon")}</span> : null}
                              </div>
                              <div style={styles.providerTagRow}>
                                {(lang === "zh" ? item.tagsZh : item.tagsEn).map((tag) => (
                                  <span key={tag} style={styles.providerTag}>{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</div>
                            <div style={styles.providerActions}>
                              <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => openConnectionModal(item)}>
                                {!hasProAccess ? t(lang, "升级 Pro", "Upgrade Pro") : hasConnection ? t(lang, "编辑", "Edit") : t(lang, "连接", "Connect")}
                              </button>
                              {hasProAccess && hasConnection ? (
                                <button type="button" style={{ ...styles.secondaryBtn, minWidth: 82, justifyContent: "center" }} onClick={() => handleDeleteConnection(item)}>
                                  {t(lang, "删除", "Delete")}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {lastConnectedLabel ? (
                    <div style={styles.connectionSuccessBanner}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb" }}>
                          {t(lang, `${lastConnectedLabel} 已连接`, `${lastConnectedLabel} connected`)}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          {t(lang, "下一步可以去执行面板选择方式，或回到模板开始创作。", "Next, go to the execution panel or jump back to templates to start creating.")}
                        </div>
                      </div>
                      <div style={styles.providerActions}>
                        <button type="button" style={styles.secondaryBtn} onClick={() => onGoGenerateSettings?.()}>
                          {t(lang, "去执行", "Go to Execution")}
                        </button>
                        <button type="button" style={styles.primaryBtn} onClick={() => onGoTemplateStart?.()}>
                          {t(lang, "去模板开始创作", "Go to Templates")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}


          </div>
        ) : null}

        {connectionModalOpen && editingItem ? (
          <div style={styles.legalModalMask} onMouseDown={() => setConnectionModalOpen(false)} role="presentation">
            <div
              style={styles.connectionModal}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div style={styles.legalModalHead}>
                <div>
                  <div style={styles.eyebrow}>{t(lang, "接入配置", "Integration Setup")}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb" }}>{editingItem.label}</div>
                </div>
                <button type="button" style={styles.iconBtn} onClick={() => setConnectionModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div style={styles.sectionDesc}>
                {editingItem.kind === "local"
                  ? t(lang, "输入本地服务地址，测试连接后保存。", "Enter the local service URL, test it, then save.")
                  : t(lang, "输入 API Key，测试连接后保存。密钥不会以明文展示。", "Enter the API key, test it, then save. Keys are not displayed in plain text.")}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={styles.integrationField}>
                  <span style={styles.integrationFieldLabel}>
                    {editingItem.kind === "local" ? "URL" : "API Key"}
                  </span>
                  <input
                    value={connectionDraftValue}
                    onChange={(e) => {
                      setConnectionDraftValue(e.target.value);
                      setConnectionTestedOk(false);
                    }}
                    placeholder={editingItem.kind === "local" ? "http://127.0.0.1:8188" : "sk-..."}
                    type={editingItem.kind === "local" ? "url" : "password"}
                    style={styles.integrationInput}
                  />
                </label>
                {editingItem.id === "custom_api" ? (
                  <label style={styles.integrationField}>
                    <span style={styles.integrationFieldLabel}>Base URL</span>
                    <input
                      value={connectionDraftBaseUrl}
                      onChange={(e) => {
                        setConnectionDraftBaseUrl(e.target.value);
                        setConnectionTestedOk(false);
                      }}
                      placeholder="https://api.example.com"
                      style={styles.integrationInput}
                    />
                  </label>
                ) : null}
                {connectionHint ? (
                  <div style={{ fontSize: 12, color: connectionTestedOk ? "#22c55e" : "#f59e0b" }}>{connectionHint}</div>
                ) : null}
                {!integrationPolicyAccepted ? (
                  <div style={styles.integrationRiskCard}>
                    {(editingItem.kind === "local"
                      ? [
                          t(lang, "本地环境安全与网络暴露风险由我承担", "I am responsible for local security and exposed-network risk"),
                          t(lang, "节点、插件、模型、脚本来源合法性由我承担", "I am responsible for the legality of nodes, plugins, models, and scripts"),
                          t(lang, "平台不保证本地兼容性和生成结果", "The platform does not guarantee local compatibility or output results")
                        ]
                      : [
                          t(lang, "我有权合法使用该 API Key", "I am authorized to use this API key"),
                          t(lang, "第三方费用、税费、账单、封号和争议由我承担", "Third-party fees, taxes, billing, suspension, and disputes are my responsibility"),
                          t(lang, "我将遵守相关第三方服务条款与政策", "I will comply with the applicable third-party terms and policies")
                        ]).map((label, idx) => (
                      <label key={label} style={styles.integrationRiskRow}>
                        <input
                          type="checkbox"
                          checked={integrationRiskChecks[idx]}
                          onChange={(e) => {
                            const next = [...integrationRiskChecks] as [boolean, boolean, boolean];
                            next[idx] = e.target.checked;
                            setIntegrationRiskChecks(next);
                            if (e.target.checked) setConnectionHint("");
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                    <div style={styles.integrationRiskLinks}>
                      <a href="/integrations-terms" style={styles.integrationRiskLink}>{t(lang, "接入条款", "Integration Terms")}</a>
                      <a href="/acceptable-use" style={styles.integrationRiskLink}>{t(lang, "使用政策", "Acceptable Use")}</a>
                      <a href="/privacy" style={styles.integrationRiskLink}>{t(lang, "隐私说明", "Privacy")}</a>
                    </div>
                  </div>
                ) : null}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" style={styles.secondaryBtn} onClick={handleTestConnection}>
                  {t(lang, "测试连接", "Test Connection")}
                </button>
                <button type="button" style={styles.primaryBtn} onClick={handleSaveConnection}>
                  {t(lang, "保存", "Save")}
                </button>
              </div>
            </div>
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
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://queue.fal.run",
      preferredModel: "fal-ai/flux/dev",
      updatedAt: null
    },
    replicate: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.replicate.com",
      preferredModel: "black-forest-labs/flux-1.1-pro",
      updatedAt: null
    },
    runway: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.dev.runwayml.com",
      preferredModel: "gen4_turbo",
      updatedAt: null
    },
    pika: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.pika.art",
      preferredModel: "pika-2.2",
      updatedAt: null
    },
    luma: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.lumalabs.ai",
      preferredModel: "ray-2",
      updatedAt: null
    },
    stability: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.stability.ai",
      preferredModel: "stable-image-ultra",
      updatedAt: null
    },
    fal_control: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://queue.fal.run",
      preferredModel: "fal-ai/flux-controlnet",
      updatedAt: null
    },
    replicate_control: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "https://api.replicate.com",
      preferredModel: "black-forest-labs/flux-depth-pro",
      updatedAt: null
    },
    comfyui: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "http://127.0.0.1:8188",
      preferredModel: "wan2.2",
      updatedAt: null
    },
    drawthings: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "http://127.0.0.1:7888",
      preferredModel: "drawthings-local",
      updatedAt: null
    },
    custom_api: {
      enabled: false,
      mode: "personal",
      apiKey: "",
      baseUrl: "",
      preferredModel: "",
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
    replicate: { ...base.replicate, apiKey: "" },
    runway: { ...base.runway, apiKey: "" },
    pika: { ...base.pika, apiKey: "" },
    luma: { ...base.luma, apiKey: "" },
    stability: { ...base.stability, apiKey: "" },
    fal_control: { ...base.fal_control, apiKey: "" },
    replicate_control: { ...base.replicate_control, apiKey: "" },
    comfyui: { ...base.comfyui, apiKey: "" },
    drawthings: { ...base.drawthings, apiKey: "" },
    custom_api: { ...base.custom_api, apiKey: "" }
  };
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
    background: "#1f2125",
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
    fontSize: 22,
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
    fontSize: 14,
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
  apiPageStack: {
    display: "grid",
    gap: 16
  },
  apiSectionBlock: {
    display: "grid",
    gap: 8
  },
  panel: {
    borderRadius: 0,
    border: "none",
    background: "transparent",
    padding: "4px 0",
    display: "grid",
    gap: 12
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: 700,
    color: "#e5e7eb"
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#9ca3af"
  },
  integrationGroupTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#9ca3af",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: 8
  },
  capabilityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10
  },
  capabilityItem: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.02)",
    display: "grid",
    gap: 4
  },
  capabilityItemCollapsed: {
    opacity: 0.82
  },
  capabilityTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e5e7eb"
  },
  capabilityDesc: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 1.4
  },
  integrationList: {
    borderTop: "1px solid #3a3f46",
    borderBottom: "1px solid #3a3f46"
  },
  providerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px 200px",
    alignItems: "center",
    gap: 10,
    padding: "14px 0",
    borderBottom: "1px solid #3a3f46"
  },
  providerRowLast: {
    borderBottom: "none"
  },
  providerInfo: {
    display: "grid",
    gap: 6
  },
  providerNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  providerName: {
    fontSize: 14,
    color: "#e5e7eb",
    fontWeight: 700
  },
  providerTagRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap"
  },
  providerTag: {
    fontSize: 11,
    lineHeight: 1,
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: "4px 8px",
    background: "rgba(255,255,255,0.02)"
  },
  providerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap"
  },
  comingSoonTag: {
    fontSize: 10,
    fontWeight: 700,
    color: "#f59e0b",
    border: "1px solid rgba(245,158,11,0.35)",
    borderRadius: 999,
    padding: "3px 7px",
    background: "rgba(245,158,11,0.08)"
  },
  connectionSuccessBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.28)",
    background: "rgba(34,197,94,0.08)"
  },
  integrationField: {
    display: "grid",
    gap: 6
  },
  integrationFieldLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: 600
  },
  integrationInput: {
    height: 40,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#24262b",
    color: "#e5e7eb",
    padding: "0 12px",
    fontSize: 14,
    outline: "none"
  },
  integrationRiskCard: {
    display: "grid",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(245,158,11,0.18)",
    background: "rgba(245,158,11,0.06)"
  },
  integrationRiskRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 12,
    color: "#e5e7eb",
    lineHeight: 1.5
  },
  integrationRiskLinks: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  integrationRiskLink: {
    fontSize: 12,
    color: "#f59e0b",
    textDecoration: "underline"
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
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#f59e0b",
    color: "#1a1000",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#f7f7fb",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
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
  connectionModal: {
    width: "min(520px, calc(100vw - 32px))",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(11,13,18,0.98), rgba(8,10,16,0.97))",
    boxShadow: "0 28px 80px rgba(0,0,0,0.42)",
    display: "grid",
    gap: 16,
    padding: 18,
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
