import { useEffect, useMemo } from "react";

function normalizeRedirect(raw: string | null): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (typeof window === "undefined") return "";
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin !== window.location.origin) return "";
    const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!target.startsWith("/") || target.startsWith("/app")) return "";
    return target;
  } catch {
    return "";
  }
}

export default function AuthEntryPage() {
  const target = useMemo(() => {
    if (typeof window === "undefined") return "/app?signin=1";
    const current = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set("signin", "1");
    const redirect = normalizeRedirect(current.searchParams.get("redirect"));
    if (redirect) params.set("redirect", redirect);
    return `/app?${params.toString()}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.location.replace(target);
  }, [target]);

  return (
    <div style={{
      minHeight: "100%",
      display: "grid",
      placeItems: "center",
      background: "var(--spx-bg-app)",
      color: "var(--spx-text-2)",
      fontSize: 14
    }}
    >
      Redirecting...
    </div>
  );
}
