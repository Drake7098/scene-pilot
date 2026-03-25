/**
 * GenerationSourceBar
 *
 * Shown in ProWorkspaceShell above the Generate button.
 * Lets the user pick: Platform (credits) | My API | Local
 *
 * Visibility rules:
 *   - "Platform" always shown if user is logged in
 *   - "My API" shown only if canUseByo=true and at least one provider is configured
 *   - "Local" shown only if comfyReady or drawReady
 *   - If only one option available → hide the bar entirely (no choice to make)
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { LocalProviderStatus } from "../../../utils/localGeneration";
import type { ApiCredentialState } from "../../../types/account";
import { Cpu, Cloud, Zap } from "lucide-react";

const C = {
  bg:     "#1f2125",
  panel:  "#24262b",
  border: "#3a3f46",
  text:   "#e5e7eb",
  muted:  "#9ca3af",
  accent: "#f59e0b",
};

export type GenerationSource = "hosted" | "byo" | "local_comfy" | "local_draw";

type Option = {
  id: GenerationSource;
  label: (lang: Lang) => string;
  sublabel: (lang: Lang) => string;
  icon: React.ReactNode;
};

function tl(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = {
  lang: Lang;
  source: GenerationSource;
  onChange: (s: GenerationSource) => void;
  canUseByo: boolean;
  byoCredentials: ApiCredentialState | null;
  comfyStatus: LocalProviderStatus;
  drawStatus: LocalProviderStatus;
  mediaMode: "image" | "video";
  creditCost: number;
  credits: number;
};

export function GenerationSourceBar({
  lang, source, onChange,
  canUseByo, byoCredentials,
  comfyStatus, drawStatus,
  mediaMode, creditCost, credits,
}: Props) {
  const comfyReady = comfyStatus.state === "ready";
  const drawReady  = drawStatus.state === "ready";

  const byoEnabled = canUseByo && byoCredentials != null &&
    (byoCredentials.fal?.enabled || byoCredentials.runway?.enabled);

  const options: Option[] = [];

  // Always include hosted
  options.push({
    id: "hosted",
    label: (l) => tl(l, "平台生成", "Platform"),
    sublabel: (l) => tl(l, `${creditCost} Credits`, `${creditCost} Credits`),
    icon: <Cloud size={13} />,
  });

  // BYO only if pro + configured
  if (byoEnabled) {
    const providerName = byoCredentials!.defaultProvider === "runway" ? "Runway" : "fal";
    options.push({
      id: "byo",
      label: (l) => tl(l, "我的 API", "My API"),
      sublabel: (_) => providerName,
      icon: <Zap size={13} />,
    });
  }

  // Local options
  if (comfyReady) {
    options.push({
      id: "local_comfy",
      label: (l) => tl(l, "本地 ComfyUI", "Local ComfyUI"),
      sublabel: (l) => tl(l, "免费", "Free"),
      icon: <Cpu size={13} />,
    });
  }
  if (drawReady && mediaMode === "image") {
    options.push({
      id: "local_draw",
      label: (l) => tl(l, "本地 Draw Things", "Local Draw Things"),
      sublabel: (l) => tl(l, "免费", "Free"),
      icon: <Cpu size={13} />,
    });
  }

  // Only one option → don't show bar
  if (options.length <= 1) return null;

  // Ensure selected source is valid
  const validIds = options.map(o => o.id);
  const activeSource = validIds.includes(source) ? source : "hosted";

  const insufficientCredits = activeSource === "hosted" && credits < creditCost;

  return (
    <div style={{
      display: "flex", gap: 4,
      padding: "6px 8px",
      borderBottom: `1px solid ${C.border}`,
      background: C.panel,
      flexShrink: 0,
    }}>
      {options.map(opt => {
        const active = activeSource === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 2,
              padding: "6px 8px", borderRadius: 5,
              border: `1px solid ${active ? C.accent : "transparent"}`,
              background: active ? "rgba(245,158,11,0.08)" : "transparent",
              color: active ? C.accent : C.muted,
              cursor: "pointer",
              transition: "all 0.1s",
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {opt.icon}
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>
                {opt.label(lang)}
              </span>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 500,
              color: (active && opt.id === "hosted" && insufficientCredits) ? "#f87171" : "inherit",
              opacity: 0.7,
            }}>
              {opt.sublabel(lang)}
              {active && opt.id === "hosted" && insufficientCredits
                ? ` · ${tl(lang, "不足", "low")}`
                : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Maps GenerationSource → ProGenerationSource used by App.tsx
 * "local_*" variants are treated as "byo" in the legacy system
 */
export function sourceToLegacy(s: GenerationSource): "hosted" | "byo" {
  if (s === "hosted") return "hosted";
  return "byo";
}
