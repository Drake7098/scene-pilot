import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import LegalPolicyPage from "./pages/LegalPolicyPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import ProductIntroPage from "./pages/ProductIntroPage";
import UserManagementPage from "./pages/UserManagementPage";
import AuthEntryPage from "./pages/AuthEntryPage";
import { getCurrentUser } from "./services/authService";

const pathnameRaw = typeof window !== "undefined" ? window.location.pathname : "/";
const pathname = pathnameRaw.length > 1 ? pathnameRaw.replace(/\/+$/, "") : pathnameRaw;
const isLandingRoute = pathname === "/";
const isProductIntroRoute = pathname === "/product-intro" || pathname === "/product";
const isAppRoute = pathname === "/app";
const isAuthEntryRoute = pathname === "/login" || pathname === "/signin" || pathname === "/register" || pathname === "/signup";
const isPricingRoute = pathname === "/pricing" || pathname === "/pricing-test";
const isUserManagementRoute = pathname === "/account" || pathname === "/user-management";
const isTermsRoute = pathname === "/terms";
const isPrivacyRoute = pathname === "/privacy";
const isBillingTermsRoute = pathname === "/billing-terms" || pathname === "/billing";
const isRefundPolicyRoute = pathname === "/refund-policy" || pathname === "/refund";

function canBypassAppAuthGate() {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const signin = String(url.searchParams.get("signin") || "").trim().toLowerCase();
  return ["1", "true", "yes"].includes(signin);
}

function appAuthRedirectUrl() {
  if (typeof window === "undefined") return "/signin";
  const target = "/app";
  return `/signin?redirect=${encodeURIComponent(target)}`;
}

function AppAuthGate() {
  const [status, setStatus] = useState<"checking" | "allowed" | "redirecting">(
    canBypassAppAuthGate() ? "allowed" : "checking"
  );

  useEffect(() => {
    if (status !== "checking") return;
    let alive = true;
    void getCurrentUser()
      .then((user) => {
        if (!alive) return;
        setStatus(user ? "allowed" : "redirecting");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("redirecting");
      });
    return () => {
      alive = false;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "redirecting") return;
    if (typeof window === "undefined") return;
    const next = appAuthRedirectUrl();
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) window.location.replace(next);
  }, [status]);

  if (status === "allowed") return <App />;
  return (
    <div style={{ minHeight: "100%", display: "grid", placeItems: "center", background: "#070b12", color: "var(--spx-text-2)", fontSize: 14 }}>
      {status === "redirecting" ? "Redirecting..." : "Checking sign in..."}
    </div>
  );
}

function resolveRootComponent() {
  if (isLandingRoute) return <LandingPage />;
  if (isProductIntroRoute) return <ProductIntroPage />;
  if (isAppRoute) return <AppAuthGate />;
  if (isAuthEntryRoute) return <AuthEntryPage />;
  if (isPricingRoute) return <PricingPage />;
  if (isUserManagementRoute) return <UserManagementPage />;
  if (isTermsRoute) return <LegalPolicyPage docId="terms" />;
  if (isPrivacyRoute) return <LegalPolicyPage docId="privacy" />;
  if (isBillingTermsRoute) return <LegalPolicyPage docId="billing" />;
  if (isRefundPolicyRoute) return <LegalPolicyPage docId="refund" />;
  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {resolveRootComponent()}
  </React.StrictMode>
);
