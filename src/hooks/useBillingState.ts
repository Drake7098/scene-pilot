import { useState, useMemo } from "react";
import type { Lang } from "../i18n";
import type { UserState } from "../types/account";
import {
  PRICING_FINAL_CREDIT_PACKS,
  PRO_PLAN,
  launchCheckout,
  openCustomerPortal,
} from "../services/billingService";
import { recordLegalConsent } from "../services/legalConsentService";
import { BILLING_ENABLED, BILLING_LIVE_BLOCKED } from "../config/billingFlags";
import { canOpenCustomerPortal } from "../utils/entitlement";

export function useBillingState(
  lang: Lang,
  accountUser: UserState | null,
  refreshAccountState: () => Promise<void>,
  openAccountCenter: (section: string) => void
) {
  const [billingPage, setBillingPage] = useState<"upgrade" | "credits" | null>(null);
  const [billingLocalHint, setBillingLocalHint] = useState("");
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false);
  const [insufficientCreditsMessage, setInsufficientCreditsMessage] = useState("");
  const [templateCreditsInsufficientOpen, setTemplateCreditsInsufficientOpen] = useState(false);
  const [templateCreditsNeeded, setTemplateCreditsNeeded] = useState(0);
  const [templateCreditsHave, setTemplateCreditsHave] = useState(0);
  const [templateCreditsName, setTemplateCreditsName] = useState("");

  const creditPacks = PRICING_FINAL_CREDIT_PACKS;
  const proPlan = PRO_PLAN;
  const billingRuntimeEnabled = BILLING_ENABLED && !BILLING_LIVE_BLOCKED;

  const billingNotice = useMemo(() => {
    if (!BILLING_ENABLED) return lang === "zh" ? "支付通道即将上线，暂不可购买或开通。" : "Billing is coming soon. Purchases are temporarily unavailable.";
    if (BILLING_LIVE_BLOCKED) return lang === "zh" ? "当前环境已启用支付保护：禁止 live 扣费，请使用 sandbox。" : "Live billing is blocked in this environment. Use sandbox billing only.";
    return "";
  }, [lang]);

  function openBillingPage(page: "upgrade" | "credits") {
    setBillingPage(page);
    if (page === "upgrade") setBillingLocalHint("");
  }

  function closeBillingPage() { setBillingPage(null); }

  function openNotEnoughCredits(message: string) {
    setInsufficientCreditsMessage(message);
    setInsufficientCreditsOpen(true);
  }

  async function handlePurchaseCredits(packId: string, billingBusy: boolean, setBillingBusy: (v: boolean) => void, billingLegalAccepted: boolean) {
    if (!accountUser || billingBusy) { openAccountCenter("auth"); return; }
    if (!billingRuntimeEnabled || !billingLegalAccepted) { openBillingPage("credits"); return; }
    void recordLegalConsent({
      userId: accountUser.id,
      context: "billing_credits",
      docs: ["billing", "refund", "terms", "privacy"],
      source: "billing_overlay_credits",
      locale: lang,
    });
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "credits", productId: packId });
      await refreshAccountState();
      setBillingPage("credits");
    } catch {
      openBillingPage("credits");
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleUpgradePro(billingBusy: boolean, setBillingBusy: (v: boolean) => void, billingLegalAccepted: boolean) {
    if (!accountUser || billingBusy) { openAccountCenter("auth"); return; }
    if (!billingRuntimeEnabled || !billingLegalAccepted) { openBillingPage("upgrade"); return; }
    void recordLegalConsent({
      userId: accountUser.id,
      context: "billing_upgrade",
      docs: ["billing", "refund", "terms", "privacy"],
      source: "billing_overlay_upgrade",
      locale: lang,
    });
    setBillingBusy(true);
    try {
      await launchCheckout({ userId: accountUser.id, userEmail: accountUser.email, kind: "pro", productId: PRO_PLAN.id });
      await refreshAccountState();
      setBillingPage("upgrade");
    } catch {
      openBillingPage("upgrade");
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleOpenCustomerPortal(billingBusy: boolean, setBillingBusy: (v: boolean) => void) {
    if (!accountUser) { openAccountCenter("auth"); return; }
    if (!canOpenCustomerPortal(accountUser) || !billingRuntimeEnabled) { openBillingPage("upgrade"); return; }
    setBillingBusy(true);
    try {
      const portal = await openCustomerPortal(accountUser.id);
      window.open(portal.url, "_blank", "noopener,noreferrer");
    } catch {
      openBillingPage("upgrade");
    } finally {
      setBillingBusy(false);
    }
  }

  return {
    billingPage,
    billingLocalHint, setBillingLocalHint,
    insufficientCreditsOpen, setInsufficientCreditsOpen,
    insufficientCreditsMessage,
    templateCreditsInsufficientOpen, setTemplateCreditsInsufficientOpen,
    templateCreditsNeeded, setTemplateCreditsNeeded,
    templateCreditsHave, setTemplateCreditsHave,
    templateCreditsName, setTemplateCreditsName,
    billingRuntimeEnabled,
    billingNotice,
    creditPacks,
    proPlan,
    openBillingPage,
    closeBillingPage,
    openNotEnoughCredits,
    handlePurchaseCredits,
    handleUpgradePro,
    handleOpenCustomerPortal,
  };
}
