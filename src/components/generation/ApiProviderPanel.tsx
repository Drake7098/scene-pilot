/**
 * ApiProviderPanel — API接入配置
 * 外部（fal / Runway）+ 本地（ComfyUI / Draw Things）合一页面
 * 只包含API相关内容，无其他噪音
 */
import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";
import type { Lang } from "../../i18n";
import type { ApiCredentialState, ApiProviderId } from "../../types/account";
import type { LocalProviderStatus } from "../../utils/localGeneration";
import { loadLocalProviderConfig, saveLocalProviderConfig, type LocalProviderConfig } from "../../utils/localProviderConfig";

const C = {
  bg:     "#1a1c20",
  panel:  "#24262b",
  border: "#3a3f46",
  text:   "#e5e7eb",
  muted:  "#9ca3af",
  dim:    "#6b7280",
  accent: "#f59e0b",
  green:  "#22c55e",
  red:    "#f87171",
};

const t = (lang: Lang, zh: string, en: string) => lang === "zh" ? zh : en;

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.dim,
      textTransform: "uppercase" as const, letterSpacing: "0.08em",
      marginBottom: 8, marginTop: 4,
    }}>
      {label}
    </div>
  );
}

// ── Field input ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, mono, type = "text", hint, action }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; type?: string; hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type={type}
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, fontSize: 12, padding: "7px 10px",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${C.border}`,
            borderRadius: 0, color: C.text, outline: "none",
            fontFamily: mono ? "monospace" : "inherit",
          }}
        />
        {action}
      </div>
      {hint && <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ── Status dot ─────────────────────────────────────────────────────────────
function StatusDot({ ok, checking }: { ok?: boolean; checking?: boolean }) {
  if (checking) return <Loader2 size={12} style={{ color: C.accent, animation: "spin 1s linear infinite", flexShrink: 0 }} />;
  if (ok === true)  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0, display: "inline-block" }} />;
  if (ok === false) return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0, display: "inline-block" }} />;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.border, flexShrink: 0, display: "inline-block" }} />;
}

// ── External provider card (fal / Runway) ──────────────────────────────────
const PROVIDERS = {
  fal: {
    name: "fal",
    desc: (lang: Lang) => t(lang, "图像 + 视频（Flux / Wan / LoRA）", "Image + Video (Flux / Wan / LoRA)"),
    keyPlaceholder: "fal_key_...",
    docsUrl: "https://fal.ai/dashboard/keys",
  },
  runway: {
    name: "Runway",
    desc: (lang: Lang) => t(lang, "高质量视频生成（Gen3 / Gen4）", "High-quality video (Gen3 / Gen4)"),
    keyPlaceholder: "rw-...",
    docsUrl: "https://app.runwayml.com/settings/api-keys",
  },
} as const;

function ExternalProviderCard({ lang, id, cred, onChange, isDefault, onSetDefault }: {
  lang: Lang;
  id: "fal" | "runway";
  cred: ApiCredentialState["fal"] | ApiCredentialState["runway"];
  onChange: (patch: Partial<ApiCredentialState["fal"]>) => void;
  isDefault: boolean;
  onSetDefault: () => void;
}) {
  const info = PROVIDERS[id];
  const [showKey, setShowKey] = useState(false);

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      paddingBottom: 16,
      opacity: cred.enabled ? 1 : 0.55,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <input
          type="checkbox"
          checked={cred.enabled}
          onChange={e => onChange({ enabled: e.target.checked })}
          style={{ accentColor: C.accent, cursor: "pointer", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{info.name}</span>
            {isDefault && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                color: C.accent, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              }}>默认</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{info.desc(lang)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isDefault && cred.enabled && (
            <button type="button" onClick={onSetDefault} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 5,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, cursor: "pointer",
            }}>{t(lang, "设默认", "Default")}</button>
          )}
          <a href={info.docsUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: C.dim, display: "flex", alignItems: "center" }}>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Key field — only show when enabled */}
      {cred.enabled && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Field
            label="API Key"
            value={cred.apiKey}
            onChange={v => onChange({ apiKey: v })}
            placeholder={cred.apiKey ? t(lang, "留空保留现有 Key", "Leave blank to keep") : info.keyPlaceholder}
            mono type={showKey ? "text" : "password"}
            action={
              <button type="button" onClick={() => setShowKey(s => !s)} style={{
                padding: "0 10px", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.muted, fontSize: 11, cursor: "pointer",
              }}>
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

// ── Local provider card (ComfyUI / Draw Things) ────────────────────────────
function LocalProviderCard({ lang, title, status, url, onUrl, urlPlaceholder, steps, onSteps, extra, helpText }: {
  lang: Lang; title: string; status: LocalProviderStatus;
  url: string; onUrl: (v: string) => void; urlPlaceholder: string;
  steps: number; onSteps: (v: number) => void;
  extra?: React.ReactNode; helpText: string;
}) {
  const isReady = status.state === "ready";
  const isChecking = status.state === "checking";

  return (
    <div style={{
      borderLeft: `2px solid ${isReady ? C.green : C.border}`,
      paddingLeft: 12, paddingBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <StatusDot ok={isReady ? true : status.state === "idle" ? undefined : false} checking={isChecking} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</span>
        <span style={{
          fontSize: 10, color: isReady ? C.green : C.dim,
          marginLeft: "auto",
        }}>
          {isChecking ? t(lang, "检测中…", "Checking…") :
           isReady ? t(lang, "已就绪", "Ready") :
           (status.state !== "ready" && status.state !== "checking" && status.state !== "idle") ? t(lang, "连接失败", "Failed") :
           t(lang, "未连接", "Not connected")}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Field label="URL" value={url} onChange={onUrl} placeholder={urlPlaceholder} mono />
        <Field
          label="Steps"
          value={String(steps)}
          onChange={v => onSteps(Number(v) || steps)}
          placeholder="20"
        />
        {extra}
        <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>{helpText}</div>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
type Props = {
  lang: Lang;
  apiCredentials: ApiCredentialState | null;
  onSave: (next: ApiCredentialState) => void;
  hasProAccess: boolean;
  onUpgradePro: () => void;
  comfyStatus?: LocalProviderStatus;
  drawStatus?: LocalProviderStatus;
  onRefreshLocal?: () => Promise<void>;
};

export function ApiProviderPanel({ lang, apiCredentials, onSave, hasProAccess, onUpgradePro, comfyStatus, drawStatus, onRefreshLocal }: Props) {
  const idleStatus: LocalProviderStatus = { provider: "comfyui", state: "idle" };

  const defaultCreds: ApiCredentialState = {
    defaultProvider: "fal", updatedAt: null,
    fal:    { enabled: true,  mode: "personal", apiKey: "", baseUrl: "https://queue.fal.run",       preferredModel: "fal-ai/flux/dev", updatedAt: null },
    replicate: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.replicate.com", preferredModel: "", updatedAt: null },
    runway: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.dev.runwayml.com", preferredModel: "gen3a_turbo",    updatedAt: null },
    pika: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.pika.art", preferredModel: "", updatedAt: null },
    luma: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.lumalabs.ai", preferredModel: "", updatedAt: null },
    stability: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.stability.ai", preferredModel: "", updatedAt: null },
    fal_control: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://queue.fal.run", preferredModel: "", updatedAt: null },
    replicate_control: { enabled: false, mode: "personal", apiKey: "", baseUrl: "https://api.replicate.com", preferredModel: "", updatedAt: null },
    comfyui: { enabled: false, mode: "personal", apiKey: "", baseUrl: "http://127.0.0.1:8188", preferredModel: "", updatedAt: null },
    drawthings: { enabled: false, mode: "personal", apiKey: "", baseUrl: "http://127.0.0.1:7888", preferredModel: "", updatedAt: null },
    custom_api: { enabled: false, mode: "personal", apiKey: "", baseUrl: "", preferredModel: "", updatedAt: null },
  };

  const [draft, setDraft] = useState<ApiCredentialState>(() => apiCredentials ?? defaultCreds);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Local config
  const [localCfg, setLocalCfg] = useState<LocalProviderConfig>(() => loadLocalProviderConfig());
  useEffect(() => { saveLocalProviderConfig(localCfg); }, [localCfg]);

  const updateCred = (id: ApiProviderId, patch: Partial<ApiCredentialState[ApiProviderId]>) => {
    setDraft(d => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  function handleSave() {
    const stamp = new Date().toISOString();
    const next: ApiCredentialState = {
      ...draft, updatedAt: stamp,
      fal:    { ...draft.fal,    updatedAt: stamp },
      runway: { ...draft.runway, updatedAt: stamp },
    };
    onSave(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try { await onRefreshLocal?.(); } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  }

  // Non-Pro gate
  if (!hasProAccess) {
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {t(lang, "API 接入（Pro 功能）", "API Access (Pro feature)")}
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
            {t(lang,
              "配置 fal / Runway 自己的 API Key，生成不消耗积分。同时支持接入本地 ComfyUI 或 Draw Things。",
              "Connect your own fal / Runway API keys — generation won't consume credits. Also supports local ComfyUI or Draw Things."
            )}
          </div>
          <button type="button" onClick={onUpgradePro} style={{
            padding: "9px 20px", borderRadius: 6, background: C.accent,
            border: "none", color: "#111", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {t(lang, "升级 Pro", "Upgrade to Pro")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0" }}>

      {/* ── External APIs ─────────────────────────────────────── */}
      <div>
        <SectionLabel label={t(lang, "云端 API", "Cloud APIs")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["fal", "runway"] as const).map(id => (
            <ExternalProviderCard
              key={id} lang={lang} id={id}
              cred={draft[id]}
              onChange={patch => updateCred(id, patch)}
              isDefault={draft.defaultProvider === id}
              onSetDefault={() => setDraft(d => ({ ...d, defaultProvider: id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={handleSave} style={{
            padding: "9px 22px", borderRadius: 6, background: C.accent,
            border: "none", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            {t(lang, "保存", "Save")}
          </button>
          {saved && (
            <span style={{ fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={13} />{t(lang, "已保存", "Saved")}
            </span>
          )}
        </div>
      </div>

      {/* ── Local ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionLabel label={t(lang, "本地生成", "Local Generation")} />
          <button type="button" onClick={handleRefresh} disabled={refreshing} style={{
            display: "flex", alignItems: "center", gap: 4, fontSize: 11,
            padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6,
            background: "transparent", color: C.muted, cursor: "pointer",
          }}>
            <RefreshCw size={11} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
            {t(lang, "重新检测", "Refresh")}
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.dim, marginBottom: 10, lineHeight: 1.6 }}>
          {t(lang, "连接本地运行的 ComfyUI 或 Draw Things，生成不消耗积分。", "Connect locally running ComfyUI or Draw Things — no credits consumed.")}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <LocalProviderCard
              lang={lang} title="ComfyUI"
              status={comfyStatus ?? idleStatus}
              url={localCfg.comfyUrl ?? ""} onUrl={v => setLocalCfg(c => ({ ...c, comfyUrl: v }))}
              urlPlaceholder="http://127.0.0.1:8188"
              steps={localCfg.comfySteps ?? 20} onSteps={v => setLocalCfg(c => ({ ...c, comfySteps: v }))}
              extra={
                <Field label="CFG" value={String(localCfg.comfyCfg ?? 3.5)}
                  onChange={v => setLocalCfg(c => ({ ...c, comfyCfg: parseFloat(v) || 3.5 }))}
                  placeholder="3.5" />
              }
              helpText={t(lang, "启动时加 --enable-cors-header 参数", "Start with --enable-cors-header flag")}
            />
          </div>
          <div style={{ flex: 1 }}>
            <LocalProviderCard
              lang={lang} title="Draw Things"
              status={drawStatus ?? { provider: "drawthings", state: "idle" }}
              url={localCfg.drawUrl ?? ""} onUrl={v => setLocalCfg(c => ({ ...c, drawUrl: v }))}
              urlPlaceholder="http://127.0.0.1:7888"
              steps={localCfg.drawSteps ?? 20} onSteps={v => setLocalCfg(c => ({ ...c, drawSteps: v }))}
              extra={
                <Field label={t(lang, "引导强度", "Guidance")} value={String(localCfg.drawGuidance ?? 7.5)}
                  onChange={v => setLocalCfg(c => ({ ...c, drawGuidance: parseFloat(v) || 7.5 }))}
                  placeholder="7.5" />
              }
              helpText={t(lang, "在 Draw Things 设置中开启「API 服务」", "Enable API Service in Draw Things settings")}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
