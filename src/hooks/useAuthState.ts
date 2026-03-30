import { useState, useCallback, useEffect } from "react";
import type { Lang } from "../i18n";
import type { UserState, AccountCenterSection, ApiCredentialState } from "../types/account";
import type { CreditLedgerEntry, SubscriptionState } from "../types/billing";
import {
  getCurrentUser,
  isGoogleSignInEnabled,
  logout,
  sendCode,
  signInWithPassword,
  signInWithGoogle,
  verifyCode,
} from "../services/authService";
import { getBillingSnapshot } from "../services/billingService";
import { getCreditLedger, getWalletState } from "../services/creditService";
import { getApiCredentials, setApiCredentials } from "../services/mockAccountStore";
import { recordLegalConsent, syncPendingLegalConsents } from "../services/legalConsentService";

const AUTH_EMAIL_DRAFT_KEY = "sp_auth_email_draft_v1";
const AUTH_LEGAL_CONSENT_KEY = "sp_auth_legal_consent_v1";
const BILLING_LEGAL_CONSENT_KEY = "sp_billing_legal_consent_v1";
const API_PROVIDER_IDS = [
  "fal",
  "replicate",
  "runway",
  "pika",
  "luma",
  "stability",
  "fal_control",
  "replicate_control",
  "comfyui",
  "drawthings",
  "custom_api",
] as const;

export function useAuthState(lang: Lang) {
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [accountCredits, setAccountCredits] = useState(0);
  const [accountLedger, setAccountLedger] = useState<CreditLedgerEntry[]>([]);
  const [accountSubscription, setAccountSubscription] = useState<SubscriptionState | null>(null);
  const [accountApiCredentials, setAccountApiCredentials] = useState<ApiCredentialState | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "code">("email");
  const [authEmail, setAuthEmail] = useState(() => {
    try { return localStorage.getItem(AUTH_EMAIL_DRAFT_KEY) || ""; } catch { return ""; }
  });
  const [authPassword, setAuthPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [lastSentCode, setLastSentCode] = useState("");
  const [authLegalAccepted, setAuthLegalAccepted] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTH_LEGAL_CONSENT_KEY) === "1"; } catch { return false; }
  });
  const [billingLegalAccepted, setBillingLegalAccepted] = useState<boolean>(() => {
    try { return localStorage.getItem(BILLING_LEGAL_CONSENT_KEY) === "1"; } catch { return false; }
  });

  const googleSignInEnabled = isGoogleSignInEnabled();

  // 持久化 authEmail
  useEffect(() => {
    try {
      if (authEmail.trim()) localStorage.setItem(AUTH_EMAIL_DRAFT_KEY, authEmail.trim());
      else localStorage.removeItem(AUTH_EMAIL_DRAFT_KEY);
    } catch { /* ignore */ }
  }, [authEmail]);

  useEffect(() => {
    try { localStorage.setItem(AUTH_LEGAL_CONSENT_KEY, authLegalAccepted ? "1" : "0"); }
    catch { /* ignore */ }
  }, [authLegalAccepted]);

  useEffect(() => {
    try { localStorage.setItem(BILLING_LEGAL_CONSENT_KEY, billingLegalAccepted ? "1" : "0"); }
    catch { /* ignore */ }
  }, [billingLegalAccepted]);

  useEffect(() => {
    if (!accountUser?.id) return;
    void syncPendingLegalConsents(accountUser.id);
  }, [accountUser?.id]);

  useEffect(() => {
    function handleSessionExpired() {
      setAccountUser(null);
      setAccountCredits(0);
      setAccountLedger([]);
      setAccountSubscription(null);
      setAccountApiCredentials(null);
      setAuthStep("email");
      setAuthPassword("");
      setAuthCode("");
      setLastSentCode("");
      setAuthHint(lang === "zh" ? "登录态已失效，请重新登录。" : "Session expired. Please sign in again.");
    }
    window.addEventListener("sp:session_expired", handleSessionExpired as EventListener);
    return () => window.removeEventListener("sp:session_expired", handleSessionExpired as EventListener);
  }, [lang]);

  const refreshAccountState = useCallback(async () => {
    const user = await getCurrentUser();
    setAccountUser(user);
    if (!user) {
      setAccountCredits(0);
      setAccountLedger([]);
      setAccountSubscription(null);
      setAccountApiCredentials(null);
      return;
    }
    const [wallet, ledger, billingSnapshot] = await Promise.all([
      getWalletState(user.id),
      getCreditLedger(user.id),
      getBillingSnapshot(user.id),
    ]);
    setAccountCredits(wallet.creditsBalance);
    setAccountLedger(ledger);
    setAccountSubscription(billingSnapshot.subscription);
    setAccountApiCredentials(getApiCredentials(user.id));
  }, []);

  function authErrorText(error: unknown): string {
    const code = String(error instanceof Error ? error.message : error || "").trim().toLowerCase();
    if (code.includes("invalid_email")) return lang === "zh" ? "邮箱格式无效。" : "Invalid email format.";
    if (code.includes("missing_challenge")) return lang === "zh" ? "请先发送验证码。" : "Send code first.";
    if (code.includes("code_expired")) return lang === "zh" ? "验证码已过期，请重新发送。" : "Code expired. Request a new one.";
    if (code.includes("code_invalid")) return lang === "zh" ? "验证码错误，请重试。" : "Invalid code. Try again.";
    if (code.includes("too_many_requests")) return lang === "zh" ? "请求过于频繁，请稍后再试。" : "Too many requests. Please try again later.";
    if (code.includes("auth_redirect_started")) return "";
    if (code.includes("supabase_not_configured")) return lang === "zh" ? "登录服务未配置完成。" : "Auth service is not configured.";
    if (code.includes("invalid_grant") || code.includes("otp_expired")) return lang === "zh" ? "验证码错误或已过期，请重新发送。" : "Code is invalid or expired. Request a new one.";
    if (code.includes("supabase_network_error")) return lang === "zh" ? "登录网络异常，请稍后重试。" : "Auth network error. Please try again.";
    if (code.includes("auth_backend_unavailable")) return lang === "zh" ? "登录服务暂不可用，请稍后重试。" : "Auth service is unavailable right now. Please retry.";
    if (code.includes("password_too_short")) return lang === "zh" ? "密码至少 6 位。" : "Password must be at least 6 characters.";
    if (code.includes("invalid_login_credentials")) return lang === "zh" ? "邮箱或密码错误。" : "Invalid email or password.";
    if (code.includes("email_not_confirmed")) return lang === "zh" ? "邮箱未验证，请先完成邮箱验证。" : "Email is not confirmed yet.";
    if (code.includes("user_already_registered")) return lang === "zh" ? "账号已存在，请直接登录。" : "Account already exists. Please sign in.";
    if (code.includes("code_locked")) return lang === "zh" ? "验证码尝试次数过多，请重新发送。" : "Too many invalid attempts. Request a new code.";
    if (code.includes("google_not_configured") || code.includes("google_client_id_missing")) return lang === "zh" ? "Google 登录未配置完成。" : "Google sign-in is not configured.";
    if (code.includes("google_prompt_")) return lang === "zh" ? "Google 登录窗口未完成，请重试。" : "Google prompt was not completed. Please retry.";
    if (code.includes("google_verify")) return lang === "zh" ? "Google 身份校验失败，请重试。" : "Google verification failed. Please retry.";
    return lang === "zh" ? "登录失败，请重试。" : "Sign-in failed. Please retry.";
  }

  async function handleSendAuthCode() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const result = await sendCode(authEmail);
      setLastSentCode(result.devCode);
      setAuthStep("code");
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleVerifyAuthCode() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await verifyCode(authEmail, authCode);
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      setAuthHint("");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang,
      });
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await signInWithGoogle();
      setAuthPassword("");
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang,
      });
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handlePasswordSignIn() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthHint("");
    try {
      const authResult = await signInWithPassword(authEmail, authPassword);
      setAuthPassword("");
      setAuthCode("");
      setLastSentCode("");
      setAuthStep("email");
      await refreshAccountState();
      void recordLegalConsent({
        userId: authResult.user.id,
        context: "auth_signup_signin",
        docs: ["terms", "privacy"],
        source: "account_center_auth",
        locale: lang,
      });
    } catch (error) {
      setAuthHint(authErrorText(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    setAuthStep("email");
    setAuthPassword("");
    setAuthCode("");
    setAuthHint("");
    setLastSentCode("");
    await refreshAccountState();
  }

  function handleSaveApiCredentials(next: ApiCredentialState) {
    if (!accountUser) return;
    const now = new Date().toISOString();
    const current = getApiCredentials(accountUser.id);
    const nextWithStatus = API_PROVIDER_IDS.reduce((acc, providerId) => {
      const nextConfig = next[providerId];
      const currentConfig = current[providerId];
      const effectiveApiKey =
        nextConfig.mode === "personal"
          ? (nextConfig.enabled
              ? (nextConfig.apiKey?.trim() ? nextConfig.apiKey : currentConfig.apiKey)
              : "")
          : "";
      acc[providerId] = {
        ...nextConfig,
        apiKey: effectiveApiKey,
        status: nextConfig.mode === "personal" && nextConfig.enabled
          ? (effectiveApiKey ? "connected" : "invalid_key")
          : null,
        lastCheckedAt: nextConfig.mode === "personal" && nextConfig.enabled ? now : null,
        updatedAt: now,
      };
      return acc;
    }, { ...next } as ApiCredentialState);
    const withStatus: ApiCredentialState = {
      ...nextWithStatus,
      updatedAt: now,
    };
    setApiCredentials(accountUser.id, withStatus);
    setAccountApiCredentials(withStatus);
  }

  return {
    accountUser,
    accountCredits,
    accountLedger,
    accountSubscription,
    accountApiCredentials,
    authBusy,
    billingBusy, setBillingBusy,
    authStep, setAuthStep,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authCode, setAuthCode,
    authHint, setAuthHint,
    lastSentCode,
    authLegalAccepted, setAuthLegalAccepted,
    billingLegalAccepted, setBillingLegalAccepted,
    googleSignInEnabled,
    refreshAccountState,
    handleSendAuthCode,
    handleVerifyAuthCode,
    handleGoogleSignIn,
    handlePasswordSignIn,
    handleLogout,
    handleSaveApiCredentials,
  };
}
