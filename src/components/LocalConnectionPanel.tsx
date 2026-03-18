import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import type { Lang } from "../i18n";
import {
  loadLocalProviderConfig,
  saveLocalProviderConfig,
  type LocalProviderConfig,
} from "../utils/localProviderConfig";
import type { LocalProviderStatus } from "../utils/localGeneration";

type Props = {
  lang: Lang;
  comfyStatus: LocalProviderStatus;
  drawStatus: LocalProviderStatus;
  onRefresh: () => Promise<void>;
};

const ec = {
  border:    "var(--pro-border, #2e3138)",
  text:      "var(--pro-text-primary, #e5e7eb)",
  muted:     "var(--pro-text-muted, #9ca3af)",
  bg:        "var(--pro-surface, #24262b)",
  accent:    "#f59e0b",
  green:     "#22c55e",
  red:       "#ef4444",
};

function StatusDot({ status }: { status: LocalProviderStatus }) {
  if (status.state === "checking") {
    return <Loader2 size={13} style={{ color: ec.accent, animation: "spin 1s linear infinite" }} />;
  }
  if (status.state === "ready") {
    return <CheckCircle size={13} style={{ color: ec.green }} />;
  }
  return <XCircle size={13} style={{ color: ec.muted }} />;
}

function statusText(status: LocalProviderStatus, lang: Lang): string {
  if (status.state === "checking") return lang === "zh" ? "检测中..." : "Checking...";
  if (status.state === "ready") {
    const url = status.baseUrl ? ` · ${status.baseUrl}` : "";
    const ckpt = status.checkpoint ? ` · ${status.checkpoint}` : "";
    return lang === "zh" ? `已连通${url}${ckpt}` : `Connected${url}${ckpt}`;
  }
  return lang === "zh" ? "未检测到，请确认软件已启动并开启 API" : "Not found. Make sure the app is running with API enabled.";
}

export function LocalConnectionPanel({ lang, comfyStatus, drawStatus, onRefresh }: Props) {
  const [cfg, setCfg] = useState<Required<LocalProviderConfig>>(loadLocalProviderConfig);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = useCallback(() => {
    setSaving(true);
    saveLocalProviderConfig(cfg);
    setTimeout(() => setSaving(false), 600);
  }, [cfg]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const field = (label: string, value: string | number, onChange: (v: string) => void, placeholder?: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: ec.muted, minWidth: 64 }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={handleSave}
        placeholder={placeholder}
        style={{
          flex: 1, fontSize: 11, padding: "4px 8px",
          background: "transparent", border: `1px solid ${ec.border}`,
          borderRadius: 6, color: ec.text, outline: "none",
        }}
      />
    </div>
  );

  const card = (
    title: string,
    status: LocalProviderStatus,
    url: string,
    onUrl: (v: string) => void,
    urlPlaceholder: string,
    extraFields: React.ReactNode,
    helpText: string,
  ) => (
    <div style={{
      flex: 1, padding: "14px 16px", borderRadius: 10,
      border: `1px solid ${status.state === "ready" ? ec.green + "55" : ec.border}`,
      background: ec.bg, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <StatusDot status={status} />
        <span style={{ fontSize: 13, fontWeight: 600, color: ec.text }}>{title}</span>
      </div>
      <div style={{ fontSize: 11, color: status.state === "ready" ? ec.green : ec.muted, marginBottom: 10, lineHeight: 1.5 }}>
        {statusText(status, lang)}
      </div>
      {field(lang === "zh" ? "地址" : "URL", url, onUrl, urlPlaceholder)}
      {extraFields}
      <div style={{ fontSize: 10, color: ec.muted, marginTop: 8, lineHeight: 1.5 }}>{helpText}</div>
    </div>
  );

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: ec.muted }}>
          {lang === "zh"
            ? "连接本地 ComfyUI 或 Draw Things，生成不消耗 Credits"
            : "Connect local ComfyUI or Draw Things. No credits consumed."}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, padding: "5px 10px",
            border: `1px solid ${ec.border}`, borderRadius: 6,
            background: "transparent", color: ec.muted, cursor: "pointer",
          }}
        >
          <RefreshCw size={11} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
          {lang === "zh" ? "重新检测" : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {card(
          "ComfyUI",
          comfyStatus,
          cfg.comfyUrl,
          v => setCfg(c => ({ ...c, comfyUrl: v })),
          "http://127.0.0.1:8188",
          <>
            {field("Steps", cfg.comfySteps, v => setCfg(c => ({ ...c, comfySteps: Number(v) || 8 })))}
            {field("CFG", cfg.comfyCfg, v => setCfg(c => ({ ...c, comfyCfg: parseFloat(v) || 3.5 })))}
          </>,
          lang === "zh"
            ? "需在 ComfyUI 启动时加 --enable-cors-header 参数"
            : "Start ComfyUI with --enable-cors-header flag",
        )}
        {card(
          "Draw Things",
          drawStatus,
          cfg.drawUrl,
          v => setCfg(c => ({ ...c, drawUrl: v })),
          "http://127.0.0.1:7888",
          <>
            {field("Steps", cfg.drawSteps, v => setCfg(c => ({ ...c, drawSteps: Number(v) || 20 })))}
            {field(lang === "zh" ? "引导" : "Guidance", cfg.drawGuidance, v => setCfg(c => ({ ...c, drawGuidance: parseFloat(v) || 7.5 })))}
          </>,
          lang === "zh"
            ? "需在 Draw Things 设置中开启「API 服务」"
            : "Enable API Service in Draw Things settings",
        )}
      </div>

      {saving && (
        <div style={{ fontSize: 11, color: ec.accent, marginTop: 8 }}>
          {lang === "zh" ? "已保存" : "Saved"}
        </div>
      )}
    </div>
  );
}
