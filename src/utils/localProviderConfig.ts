// 本地 API 配置：localStorage 存储 + URL 读取
// 新增文件：src/utils/localProviderConfig.ts

const KEYS = {
  comfyUrl:     "sp_local_comfy_url",
  comfySteps:   "sp_local_comfy_steps",
  comfyCfg:     "sp_local_comfy_cfg",
  drawUrl:      "sp_local_draw_url",
  drawSteps:    "sp_local_draw_steps",
  drawGuidance: "sp_local_draw_guidance",
} as const;

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// URL 列表（用户配置优先，否则用默认）
export function getComfyUiBaseUrls(): string[] {
  const saved = safeGet(KEYS.comfyUrl);
  return saved ? [saved] : ["http://127.0.0.1:8188", "http://localhost:8188"];
}

export function getDrawThingsBaseUrls(): string[] {
  const saved = safeGet(KEYS.drawUrl);
  return saved ? [saved] : ["http://127.0.0.1:7888", "http://localhost:7888"];
}

// 参数读取
export function getComfySteps(): number {
  return parseInt(safeGet(KEYS.comfySteps) ?? "", 10) || 8;
}
export function getComfyCfg(): number {
  return parseFloat(safeGet(KEYS.comfyCfg) ?? "") || 3.5;
}
export function getDrawSteps(): number {
  return parseInt(safeGet(KEYS.drawSteps) ?? "", 10) || 20;
}
export function getDrawGuidance(): number {
  return parseFloat(safeGet(KEYS.drawGuidance) ?? "") || 7.5;
}

// 保存配置
export type LocalProviderConfig = {
  comfyUrl?: string;
  comfySteps?: number;
  comfyCfg?: number;
  drawUrl?: string;
  drawSteps?: number;
  drawGuidance?: number;
};

export function saveLocalProviderConfig(cfg: LocalProviderConfig) {
  if (cfg.comfyUrl !== undefined) {
    cfg.comfyUrl ? safeSet(KEYS.comfyUrl, cfg.comfyUrl) : safeRemove(KEYS.comfyUrl);
  }
  if (cfg.comfySteps !== undefined) safeSet(KEYS.comfySteps, String(cfg.comfySteps));
  if (cfg.comfyCfg   !== undefined) safeSet(KEYS.comfyCfg,   String(cfg.comfyCfg));
  if (cfg.drawUrl    !== undefined) {
    cfg.drawUrl ? safeSet(KEYS.drawUrl, cfg.drawUrl) : safeRemove(KEYS.drawUrl);
  }
  if (cfg.drawSteps    !== undefined) safeSet(KEYS.drawSteps,    String(cfg.drawSteps));
  if (cfg.drawGuidance !== undefined) safeSet(KEYS.drawGuidance, String(cfg.drawGuidance));
}

export function loadLocalProviderConfig(): Required<LocalProviderConfig> {
  return {
    comfyUrl:     safeGet(KEYS.comfyUrl)     ?? "",
    comfySteps:   getComfySteps(),
    comfyCfg:     getComfyCfg(),
    drawUrl:      safeGet(KEYS.drawUrl)      ?? "",
    drawSteps:    getDrawSteps(),
    drawGuidance: getDrawGuidance(),
  };
}

// aspectRatio → resolution 映射
const AR_TO_RESOLUTION: Record<string, string> = {
  "16:9": "1024x576",
  "9:16": "576x1024",
  "1:1":  "768x768",
  "4:3":  "896x672",
  "21:9": "1152x496",
};

export function aspectRatioToResolution(
  aspectRatio: string | undefined,
  mediaMode: "image" | "video"
): string {
  const base = AR_TO_RESOLUTION[aspectRatio ?? "16:9"] ?? "1024x576";
  if (mediaMode !== "video") return base;
  // 视频模式分辨率减半（保持比例，降低推理成本）
  const [w, h] = base.split("x").map(Number);
  return `${Math.round(w / 2)}x${Math.round(h / 2)}`;
}
