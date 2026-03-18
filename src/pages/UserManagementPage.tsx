import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { CheckCircle2, Copy, CreditCard, ExternalLink, KeyRound, LogOut, ShieldCheck, UserRound, Wallet } from "lucide-react";
import type { Lang } from "../i18n";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
import type { UserSession, UserState } from "../types/account";
import type { ApiCredentialState } from "../types/account";
import type { CreditLedgerEntry, SubscriptionState, WalletState } from "../types/billing";
import { HOSTED_ACTIONS, PRICING_FINAL_CREDIT_PACKS, getBillingSnapshot, launchCheckout, openCustomerPortal, PRO_PLAN } from "../services/billingService";
import { getCreditLedger, getWalletState } from "../services/creditService";
import { getCurrentSession, getCurrentUser, logout } from "../services/authService";
import { recordLegalConsent } from "../services/legalConsentService";
import { getApiCredentials } from "../services/mockAccountStore";
import { PUBLIC_CONTACT_CHANNELS, SYSTEM_NOTIFICATION_MAILBOX } from "../config/contactChannels";
import { BILLING_ENABLED, BILLING_LIVE_BLOCKED } from "../config/billingFlags";

type PageSnapshot = {
  user: UserState | null;
  session: UserSession | null;
  wallet: WalletState;
  ledger: CreditLedgerEntry[];
  subscription: SubscriptionState | null;
  apiCredentials: ApiCredentialState | null;
};
const ACCOUNT_SIGN_IN_HREF = "/signin?redirect=%2Faccount";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTier(lang: Lang, tier: UserState["tier"] | null | undefined) {
  if (tier === "pro") return "Pro";
  if (tier === "member") return t(lang, "会员", "Member");
  return "Free";
}

function formatSubscriptionStatus(lang: Lang, status: SubscriptionState["status"] | null | undefined) {
  if (status === "active") return t(lang, "有效", "Active");
  if (status === "past_due") return t(lang, "待处理", "Past due");
  return t(lang, "未开通", "Inactive");
}

function ledgerLabel(lang: Lang, kind: CreditLedgerEntry["kind"]) {
  const labels: Record<CreditLedgerEntry["kind"], string> = {
    purchase: t(lang, "充值", "Purchase"),
    grant: t(lang, "赠送", "Grant"),
    reserve: t(lang, "预扣", "Reserve"),
    finalize: t(lang, "确认扣费", "Finalize"),
    rollback: t(lang, "回滚", "Rollback")
  };
  return labels[kind];
}

function maskSecret(secret: string) {
  const value = String(secret || "").trim();
  if (!value) return "-";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

async function loadSnapshot(): Promise<PageSnapshot> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      session: null,
      wallet: { creditsBalance: 0, currency: "credits" },
      ledger: [],
      subscription: null,
      apiCredentials: null
    };
  }
  const [session, wallet, ledger, apiCredentials, billingSnapshot] = await Promise.all([
    getCurrentSession(),
    getWalletState(user.id),
    getCreditLedger(user.id),
    Promise.resolve(getApiCredentials(user.id)),
    getBillingSnapshot(user.id)
  ]);
  return {
    user,
    session,
    wallet,
    ledger,
    subscription: billingSnapshot.subscription ?? null,
    apiCredentials
  };
}

export default function UserManagementPage() {
  const [lang, setLang] = useLocalLang();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"" | "pro" | "credits" | "portal" | "logout" | "copy">("");
  const [billingConsent, setBillingConsent] = useState(false);
  const [hint, setHint] = useState("");
  const [snapshot, setSnapshot] = useState<PageSnapshot>({
    user: null,
    session: null,
    wallet: { creditsBalance: 0, currency: "credits" },
    ledger: [],
    subscription: null,
    apiCredentials: null
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadSnapshot();
      setSnapshot(next);
      setHint("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { user, session, wallet, ledger, apiCredentials } = snapshot;
  const creditPacks = useMemo(
    () => PRICING_FINAL_CREDIT_PACKS.filter((item) => item.enabled),
    []
  );
  const creditCosts = useMemo(() => HOSTED_ACTIONS.filter((item) => item.enabled), []);
  const billingRuntimeEnabled = BILLING_ENABLED && !BILLING_LIVE_BLOCKED;
  const proActive = user?.tier === "pro";
  const authProviderText = session?.provider
    ? session.provider === "google"
      ? "Google"
      : session.provider === "password"
        ? t(lang, "邮箱+密码", "Email + Password")
        : t(lang, "邮箱验证码", "Email OTP")
    : "-";

  async function handleUpgradePro() {
    if (!user) return;
    if (!billingRuntimeEnabled) {
      setHint(t(lang, "支付通道暂未开启。", "Billing is temporarily unavailable."));
      return;
    }
    if (!billingConsent) {
      setHint(t(lang, "请先勾选付费条款确认。", "Confirm billing terms before checkout."));
      return;
    }
    void recordLegalConsent({
      userId: user.id,
      context: "account_checkout",
      docs: ["billing", "refund"],
      source: "user_management_upgrade",
      locale: lang
    });
    setBusy("pro");
    setHint("");
    try {
      await launchCheckout({
        userId: user.id,
        userEmail: user.email,
        kind: "pro",
        productId: PRO_PLAN.id
      });
      await refresh();
      setHint(t(lang, "Pro 开通流程已触发。", "Pro checkout has been triggered."));
    } catch (error) {
      setHint(t(lang, "Pro 开通失败，请稍后重试。", "Failed to start Pro checkout."));
      console.error(error);
    } finally {
      setBusy("");
    }
  }

  async function handleBuyCredits(packId: string) {
    if (!user) return;
    if (!billingRuntimeEnabled) {
      setHint(t(lang, "支付通道暂未开启。", "Billing is temporarily unavailable."));
      return;
    }
    if (!billingConsent) {
      setHint(t(lang, "请先勾选付费条款确认。", "Confirm billing terms before checkout."));
      return;
    }
    void recordLegalConsent({
      userId: user.id,
      context: "account_checkout",
      docs: ["billing", "refund"],
      source: "user_management_credits",
      locale: lang
    });
    setBusy("credits");
    setHint("");
    try {
      await launchCheckout({
        userId: user.id,
        userEmail: user.email,
        kind: "credits",
        productId: packId
      });
      await refresh();
      setHint(t(lang, "点数购买流程已触发。", "Credits checkout has been triggered."));
    } catch (error) {
      setHint(t(lang, "点数购买失败，请稍后重试。", "Failed to start credits checkout."));
      console.error(error);
    } finally {
      setBusy("");
    }
  }

  async function handleManageBilling() {
    if (!user) return;
    if (!billingRuntimeEnabled) {
      setHint(t(lang, "支付通道暂未开启。", "Billing is temporarily unavailable."));
      return;
    }
    setBusy("portal");
    setHint("");
    try {
      const portal = await openCustomerPortal(user.id);
      if (portal?.url) {
        window.open(portal.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setHint(t(lang, "账单中心打开失败。", "Failed to open billing portal."));
      console.error(error);
    } finally {
      setBusy("");
    }
  }

  async function handleLogout() {
    setBusy("logout");
    setHint("");
    try {
      await logout();
      await refresh();
      setHint(t(lang, "已退出登录。", "Signed out."));
    } catch (error) {
      setHint(t(lang, "退出失败，请重试。", "Failed to sign out."));
      console.error(error);
    } finally {
      setBusy("");
    }
  }

  async function handleCopyUserId() {
    if (!user?.id) return;
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(user.id);
      setHint(t(lang, "用户 ID 已复制。", "User ID copied."));
    } catch {
      setHint(t(lang, "复制失败。", "Copy failed."));
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div style={page} data-testid="user-management-page">
        <div style={shell}>
          <StandalonePageChrome
            lang={lang}
            setLang={setLang}
            extraLinks={[{ href: "/pricing", labelZh: "会员价格", labelEn: "Pricing" }]}
          >
            <div style={loadingCard}>{t(lang, "正在加载用户信息…", "Loading account data...")}</div>
          </StandalonePageChrome>
        </div>
      </div>
    );
  }

  return (
    <div style={page} data-testid="user-management-page">
      <div style={shell}>
        <StandalonePageChrome
          lang={lang}
          setLang={setLang}
          extraLinks={[{ href: "/pricing", labelZh: "会员价格", labelEn: "Pricing" }]}
          showFooter
        >
        <header style={header}>
          <div style={eyebrow}>{t(lang, "用户管理", "User Management")}</div>
          <h1 style={title}>{t(lang, "账户与订阅中心", "Account & Subscription Center")}</h1>
          <div style={subTitle}>
            {t(
              lang,
              "按行业标准管理身份、订阅、点数和 API 权限。",
              "Manage identity, subscription, credits, and API access with an industry-standard layout."
            )}
          </div>
        </header>

        {!user ? (
          <section style={card} data-testid="user-management-empty">
            <div style={cardTitle}>{t(lang, "未登录", "Not signed in")}</div>
            <div style={mutedText}>{t(lang, "请先登录后查看用户资料、订阅和点数。", "Sign in to manage profile, subscription, and credits.")}</div>
            <div style={buttonRow}>
              <a href={ACCOUNT_SIGN_IN_HREF} style={signInLink} data-testid="user-management-sign-in">
                <span style={signInAvatarDot}><UserRound size={14} /></span>
                <span>{t(lang, "去登录", "Sign in")}</span>
              </a>
              <a href="/app" style={secondaryLink}>{t(lang, "打开工作台", "Open workspace")}</a>
            </div>
          </section>
        ) : (
          <>
            <section style={grid2}>
              <article style={card} data-testid="user-management-profile">
                <div style={cardHead}>
                  <div style={cardTitle}><UserRound size={15} />{t(lang, "资料", "Profile")}</div>
                  <button type="button" style={tinyBtn} onClick={() => void handleCopyUserId()} disabled={busy === "copy"}>
                    <Copy size={13} />{t(lang, "复制 ID", "Copy ID")}
                  </button>
                </div>
                <div style={infoList}>
                  <div style={infoRow}><span>{t(lang, "邮箱", "Email")}</span><strong>{user.email}</strong></div>
                  <div style={infoRow}><span>User ID</span><strong data-testid="user-management-user-id">{user.id}</strong></div>
                  <div style={infoRow}><span>{t(lang, "层级", "Tier")}</span><strong data-testid="user-management-tier">{formatTier(lang, user.tier)}</strong></div>
                  <div style={infoRow}><span>{t(lang, "注册时间", "Created")}</span><strong>{formatDateTime(user.createdAt)}</strong></div>
                  <div style={infoRow}><span>{t(lang, "更新时间", "Updated")}</span><strong>{formatDateTime(user.updatedAt)}</strong></div>
                </div>
              </article>

              <article style={card} data-testid="user-management-security">
                <div style={cardTitle}><ShieldCheck size={15} />{t(lang, "安全", "Security")}</div>
                <div style={infoList}>
                  <div style={infoRow}><span>{t(lang, "登录方式", "Sign-in method")}</span><strong>{authProviderText}</strong></div>
                  <div style={infoRow}><span>{t(lang, "当前会话", "Session start")}</span><strong>{formatDateTime(session?.createdAt)}</strong></div>
                  <div style={infoRow}><span>{t(lang, "账户状态", "Account status")}</span><strong>{t(lang, "正常", "Active")}</strong></div>
                </div>
              </article>
            </section>

            <section style={grid2}>
              <article style={card} data-testid="user-management-subscription">
                <div style={cardHead}>
                  <div style={cardTitle}><CreditCard size={15} />{t(lang, "订阅与账单", "Subscription & Billing")}</div>
                  <button type="button" style={tinyBtn} onClick={() => void handleManageBilling()} disabled={!billingRuntimeEnabled || busy === "portal"}>
                    <ExternalLink size={13} />{t(lang, "管理账单", "Manage Billing")}
                  </button>
                </div>
                <div style={infoList}>
                  <div style={infoRow}><span>{t(lang, "当前方案", "Plan")}</span><strong>{proActive ? "Pro" : "Free"}</strong></div>
                  <div style={infoRow}><span>{t(lang, "订阅状态", "Subscription status")}</span><strong>{formatSubscriptionStatus(lang, snapshot.subscription?.status)}</strong></div>
                  <div style={infoRow}><span>{t(lang, "月赠点数", "Monthly credits")}</span><strong>{PRO_PLAN.monthlyCredits}</strong></div>
                </div>
                {!billingRuntimeEnabled ? (
                  <div style={mutedText}>{t(lang, "支付通道暂未开启。", "Billing is temporarily unavailable.")}</div>
                ) : null}
                {!proActive ? (
                  <div style={buttonRow}>
                    <button type="button" style={primaryBtn} onClick={() => void handleUpgradePro()} disabled={!billingRuntimeEnabled || busy === "pro"} data-testid="user-management-upgrade">
                      {busy === "pro" ? t(lang, "处理中…", "Processing...") : t(lang, "升级 Pro", "Upgrade Pro")}
                    </button>
                  </div>
                ) : null}
              </article>

              <article style={card} data-testid="user-management-credits">
                <div style={cardTitle}><Wallet size={15} />{t(lang, "点数", "Credits")}</div>
                <div style={creditBalance} data-testid="user-management-credits-balance">{wallet.creditsBalance}</div>
                <div style={mutedText}>{t(lang, "图片和视频生成都会扣点。", "Image and video generation consume credits.")}</div>
                <div style={packRow}>
                  {creditPacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      style={miniBtn}
                      onClick={() => void handleBuyCredits(pack.id)}
                      disabled={!billingRuntimeEnabled || busy === "credits"}
                      data-testid={`user-management-buy-${pack.id}`}
                    >
                      {pack.credits} / ${pack.usdPrice}
                    </button>
                  ))}
                </div>
              </article>
            </section>

            <section style={grid2}>
              <article style={card} data-testid="user-management-api">
                <div style={cardTitle}><KeyRound size={15} />API</div>
                <div style={infoList}>
                  <div style={infoRow}><span>{t(lang, "默认提供商", "Default provider")}</span><strong>{apiCredentials?.defaultProvider || "fal"}</strong></div>
                  <div style={infoRow}><span>fal</span><strong>{apiCredentials?.fal.mode === "personal" ? maskSecret(apiCredentials.fal.apiKey) : t(lang, "平台模式", "Platform mode")}</strong></div>
                  <div style={infoRow}><span>Runway</span><strong>{apiCredentials?.runway.mode === "personal" ? maskSecret(apiCredentials.runway.apiKey) : t(lang, "平台模式", "Platform mode")}</strong></div>
                </div>
                <div style={mutedText}>{t(lang, "详细配置在 App 的账号中心中编辑。", "Detailed API configuration is managed in Account Center inside the app.")}</div>
              </article>

              <article style={card} data-testid="user-management-usage">
                <div style={cardTitle}>{t(lang, "用量与规则", "Usage & Rules")}</div>
                <div style={usageList}>
                  {creditCosts.map((item) => (
                    <div key={item.id} style={usageRow}>
                      <span>{`${item.mediaType} · ${item.qualityTier}`}</span>
                      <strong>{`${item.creditsCost} credits`}</strong>
                    </div>
                  ))}
                </div>
                <div style={mutedText}>{t(lang, "提示词导出免费；点数用于生成与付费模板。", "Prompt export is free; credits for generation and paid templates.")}</div>
              </article>
            </section>

            <section style={card} data-testid="user-management-ledger">
              <div style={cardTitle}>{t(lang, "最近点数流水", "Recent credit ledger")}</div>
              <div style={ledgerList}>
                {ledger.slice(0, 10).map((item) => (
                  <div key={item.id} style={ledgerRow}>
                    <span>{ledgerLabel(lang, item.kind)}</span>
                    <strong style={{ color: item.credits >= 0 ? "#6de8b5" : "var(--spx-text-1)" }}>
                      {item.credits > 0 ? `+${item.credits}` : item.credits}
                    </strong>
                    <span style={ledgerTime}>{formatDateTime(item.createdAt)}</span>
                  </div>
                ))}
                {ledger.length === 0 ? (
                  <div style={mutedText}>{t(lang, "暂无流水。", "No ledger entries yet.")}</div>
                ) : null}
              </div>
            </section>

            <section style={card}>
              <label style={consentRow}>
                <input type="checkbox" checked={billingConsent} onChange={(e) => setBillingConsent(e.target.checked)} />
                <span>{t(lang, "我已阅读并同意付费条款和退款政策。", "I have read and agree to Billing Terms and Refund Policy.")}</span>
              </label>
              <div style={linkRow}>
                <a href="/billing-terms" style={tagLink}>Billing Terms</a>
                <a href="/refund-policy" style={tagLink}>Refund Policy</a>
                <a href="/terms" style={tagLink}>Terms</a>
                <a href="/privacy" style={tagLink}>Privacy</a>
              </div>
              <div style={mutedText}>
                {`Support: ${PUBLIC_CONTACT_CHANNELS.support} · Business: ${PUBLIC_CONTACT_CHANNELS.business} · ${SYSTEM_NOTIFICATION_MAILBOX}`}
              </div>
              <div style={buttonRow}>
                <button type="button" style={dangerBtn} onClick={() => void handleLogout()} disabled={busy === "logout"} data-testid="user-management-logout">
                  <LogOut size={14} />
                  {busy === "logout" ? t(lang, "退出中…", "Signing out...") : t(lang, "退出登录", "Sign Out")}
                </button>
                <a href="/app" style={secondaryLink}>{t(lang, "回到工作台", "Back to Workspace")}</a>
              </div>
            </section>
          </>
        )}

        {hint ? (
          <div style={hintBar} data-testid="user-management-hint">
            <CheckCircle2 size={14} />
            <span>{hint}</span>
          </div>
        ) : null}
        </StandalonePageChrome>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  background: "radial-gradient(circle at 14% -6%, rgba(82,148,236,0.2), transparent 36%), var(--spx-bg-app)",
  color: "var(--spx-text-1)"
};

const shell: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "28px 20px 56px"
};

const ghostLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid var(--spx-border)",
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
  background: "var(--spx-surface-2)"
};

const header: CSSProperties = {
  marginBottom: 18
};

const eyebrow: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--spx-text-3)"
};

const title: CSSProperties = {
  margin: "8px 0 8px",
  fontSize: "clamp(28px, 3.6vw, 40px)",
  lineHeight: 1.15,
  letterSpacing: "-0.02em"
};

const subTitle: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 14.5,
  lineHeight: 1.6
};

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  marginBottom: 12
};

const card: CSSProperties = {
  border: "1px solid var(--spx-border)",
  borderRadius: 16,
  background: "var(--spx-surface-1)",
  boxShadow: "var(--spx-shadow-panel)",
  padding: 16,
  display: "grid",
  gap: 10,
  marginBottom: 12
};

const loadingCard: CSSProperties = {
  ...card,
  minHeight: 120,
  placeContent: "center",
  color: "var(--spx-text-2)"
};

const cardHead: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
};

const cardTitle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 15,
  fontWeight: 700
};

const tinyBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 30,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid var(--spx-border)",
  color: "var(--spx-text-2)",
  background: "var(--spx-surface-2)",
  cursor: "pointer",
  fontSize: 12.5,
  fontWeight: 600
};

const infoList: CSSProperties = {
  display: "grid",
  gap: 8
};

const infoRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 13.5,
  color: "var(--spx-text-2)"
};

const mutedText: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 13,
  lineHeight: 1.6
};

const buttonRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8
};

const primaryBtn: CSSProperties = {
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid rgba(123,181,255,0.84)",
  background: "linear-gradient(180deg, rgba(84,144,232,0.5), rgba(40,97,172,0.62))",
  color: "var(--spx-text-1)",
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer"
};

const dangerBtn: CSSProperties = {
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,126,126,0.5)",
  background: "rgba(95,20,20,0.38)",
  color: "#ffe4e4",
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6
};

const primaryLink: CSSProperties = {
  ...primaryBtn,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none"
};

const signInAvatarDot: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(145deg, rgba(108,168,245,0.82), rgba(84,203,169,0.78))",
  color: "var(--spx-text-1)"
};

const signInLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  border: "none",
  background: "transparent",
  color: "var(--spx-text-1)",
  fontSize: 14,
  fontWeight: 720,
  cursor: "pointer",
  minHeight: 36
};

const secondaryLink: CSSProperties = {
  minHeight: 34,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid var(--spx-border)",
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-1)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 620,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};

const creditBalance: CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "var(--spx-text-1)"
};

const packRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8
};

const miniBtn: CSSProperties = {
  minHeight: 34,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid var(--spx-border)",
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-1)",
  fontSize: 12.5,
  fontWeight: 620,
  cursor: "pointer"
};

const usageList: CSSProperties = {
  display: "grid",
  gap: 6
};

const usageRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 13,
  color: "var(--spx-text-2)"
};

const ledgerList: CSSProperties = {
  display: "grid",
  gap: 6
};

const ledgerRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(130px, 1fr) auto auto",
  gap: 10,
  alignItems: "center",
  fontSize: 13,
  color: "var(--spx-text-2)"
};

const ledgerTime: CSSProperties = {
  fontSize: 12,
  color: "var(--spx-text-3)"
};

const consentRow: CSSProperties = {
  display: "inline-flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 12.5,
  color: "var(--spx-text-2)",
  lineHeight: 1.55
};

const linkRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
};

const tagLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid var(--spx-border)",
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-1)",
  textDecoration: "none",
  fontSize: 12.5,
  fontWeight: 600
};

const hintBar: CSSProperties = {
  position: "sticky",
  bottom: 16,
  marginTop: 6,
  borderRadius: 12,
  border: "1px solid rgba(130,205,164,0.36)",
  background: "rgba(14,38,26,0.84)",
  color: "#d7ffe9",
  padding: "10px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600
};
