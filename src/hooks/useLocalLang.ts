/**
 * Standalone-page language state: persisted in localStorage (scenepilot_lang).
 * Use for pricing, legal, account, product intro, etc. Keeps lang in sync across these pages.
 */

import { useEffect, useState } from "react";
import type { Lang } from "../i18n";

export function useLocalLang(): [Lang, (next: Lang) => void] {
  const detect = (): Lang => {
    if (typeof window === "undefined") return "en";
    try {
      const cached = window.localStorage.getItem("scenepilot_lang");
      if (cached === "zh" || cached === "en") return cached;
    } catch {
      // ignore
    }
    const nav = (typeof navigator !== "undefined" ? navigator.language : "") || "";
    return nav.toLowerCase().startsWith("zh") ? "zh" : "en";
  };
  const [lang, setLang] = useState<Lang>(detect);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("scenepilot_lang", lang);
    } catch {
      // ignore
    }
  }, [lang]);
  return [lang, setLang];
}
