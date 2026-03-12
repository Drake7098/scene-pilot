import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import LegalPolicyPage from "./pages/LegalPolicyPage";
import PricingPage from "./pages/PricingPage";

const pathnameRaw = typeof window !== "undefined" ? window.location.pathname : "/";
const pathname = pathnameRaw.length > 1 ? pathnameRaw.replace(/\/+$/, "") : pathnameRaw;
const isPricingRoute = pathname === "/pricing" || pathname === "/pricing-test";
const isTermsRoute = pathname === "/terms";
const isPrivacyRoute = pathname === "/privacy";

function resolveRootComponent() {
  if (isPricingRoute) return <PricingPage />;
  if (isTermsRoute) return <LegalPolicyPage docId="terms" />;
  if (isPrivacyRoute) return <LegalPolicyPage docId="privacy" />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {resolveRootComponent()}
  </React.StrictMode>
);
