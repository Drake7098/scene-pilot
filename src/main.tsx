import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import PricingPage from "./pages/PricingPage";

const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
const isPricingRoute = pathname === "/pricing" || pathname === "/pricing-test";
const RootComponent = isPricingRoute ? PricingPage : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
