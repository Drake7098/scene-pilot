import React, { useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, Move, RotateCw, Maximize } from "lucide-react";
import type { Scene, Layer, LayerKF } from "../model";
import { ensureKF, resolveSceneConfig } from "../model";
import { getRefBlob } from "../utils/localRefs";
import { UI_COLOR, UI_EFFECT, UI_PALETTE, UI_RADIUS, UI_SPACE, UI_TYPO } from "../uiTokens";

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type DragMode =
  | { kind: "move"; layerId: string; startX: number; startY: number; k0: LayerKF; t: 0 | 1 }
  | {
      kind: "resize";
      layerId: string;
      handle: Handle;
      startX: number;
      startY: number;
      k0: LayerKF;
      keepAspect: boolean;
      fromCenter: boolean;
      t: 0 | 1;
    }
  | null;

// ✅ 扩展画布范围：允许对象从画面外进来
const WORLD_MIN = -50;
const WORLD_MAX = 150;
const SIZE_MIN = 2;
const SIZE_MAX = 200;

// ✅ 缩放范围
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;

/** ✅ 仅用于渲染：只读不写，不会创建 keyframe */
function getKFDisplay(layer: Layer, t: 0 | 1): LayerKF {
  const kf = Array.isArray(layer.kf) ? layer.kf : [];
  const hit = kf.find((k) => k.t === t);
  if (hit) return hit;

  const base = kf.find((k) => k.t === 0) ?? kf[0];
  return (
    base ?? {
      t,
      x: 50,
      y: 50,
      w: 18,
      h: 18,
      rot: 0
    }
  );
}

export function Stage({
  scene,
  selectedLayerId,
  onSelectLayer,
  onUpdateScene,
  editT,
  className
}: {
  scene: Scene;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (scene: Scene) => void;
  editT: 0 | 1;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragMode>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [backgroundRefUrl, setBackgroundRefUrl] = useState("");
  const backgroundRefId = scene.backgroundRef?.id;

  // ✅ 画布缩放：缩小看画外，放大精修
  const [zoom, setZoom] = useState<number>(1);

  const mediaMode = useMemo<"image" | "video">(() => resolveSceneConfig(scene).mediaMode, [scene]);
  const isImageMode = mediaMode === "image";

  const layersSorted = useMemo(() => (scene.layers ?? []).slice().sort((a, b) => a.z - b.z), [scene.layers]);

  useEffect(() => {
    let dead = false;
    const revokeList: string[] = [];
    async function loadThumbs() {
      const entries: Array<[string, string]> = [];
      for (const l of scene.layers ?? []) {
        const ref = l.localRefs?.[0];
        if (!ref) continue;
        const blob = await getRefBlob(ref.id);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        revokeList.push(url);
        entries.push([l.id, url]);
      }
      if (dead) return;
      setThumbUrls(Object.fromEntries(entries));
    }
    void loadThumbs();
    return () => {
      dead = true;
      revokeList.forEach((u) => URL.revokeObjectURL(u));
      setThumbUrls({});
    };
  }, [scene.layers]);

  useEffect(() => {
    let dead = false;
    let revoke = "";
    void (async () => {
      if (!backgroundRefId) {
        if (!dead) setBackgroundRefUrl("");
        return;
      }
      const blob = await getRefBlob(backgroundRefId);
      if (dead || !blob) return;
      const url = URL.createObjectURL(blob);
      revoke = url;
      setBackgroundRefUrl(url);
    })();
    return () => {
      dead = true;
      if (revoke) URL.revokeObjectURL(revoke);
      queueMicrotask(() => {
        if (!dead) return;
        setBackgroundRefUrl("");
      });
    };
  }, [backgroundRefId]);

  function getRect() {
    const el = wrapRef.current;
    return el ? el.getBoundingClientRect() : null;
  }

  /** ✅ 只有交互提交时才写入：clone -> ensureKF -> patch */
  function updateLayerKF(layerId: string, t: 0 | 1, patch: Partial<LayerKF>) {
    // ✅ 图片模式：锁死 t1（数据保留，但不允许编辑/写入）
    if (isImageMode && t === 1) return;

    const next = JSON.parse(JSON.stringify(scene)) as Scene;
    const l = next.layers.find((x) => x.id === layerId);
    if (!l) return;
    if (!Array.isArray(l.kf)) l.kf = [];

    const k = ensureKF(l, t);
    Object.assign(k, patch);
    l.kf = l.kf.slice().sort((a, b) => a.t - b.t);
    onUpdateScene(next);
  }

  function onPointerDownLayer(e: React.PointerEvent, layer: Layer) {
    e.stopPropagation();
    onSelectLayer(layer.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = getRect();
    if (!rect) return;

    // ✅ 关键：
    // - 未选中对象永远用 t=0 显示/编辑
    // - 选中对象：视频模式跟随 editT；图片模式强制 t=0（锁死 t1）
    const tForLayer: 0 | 1 = layer.id === selectedLayerId ? (isImageMode ? 0 : editT) : 0;

    const k0 = getKFDisplay(layer, tForLayer);
    setDrag({
      kind: "move",
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      k0: { ...k0 },
      t: tForLayer
    });
  }

  function onPointerDownHandle(e: React.PointerEvent, layer: Layer, handle: Handle) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelectLayer(layer.id);

    const rect = getRect();
    if (!rect) return;

    const tForLayer: 0 | 1 = layer.id === selectedLayerId ? (isImageMode ? 0 : editT) : 0;

    const k0 = getKFDisplay(layer, tForLayer);
    setDrag({
      kind: "resize",
      layerId: layer.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      k0: { ...k0 },
      keepAspect: e.shiftKey,
      fromCenter: e.altKey || e.metaKey,
      t: tForLayer
    });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const rect = getRect();
    if (!rect) return;

    // ✅ 重要：拖拽位移要除以 zoom，不然缩放后手感会飘
    const dx = ((e.clientX - drag.startX) / rect.width) * 100 * (1 / zoom);
    const dy = ((e.clientY - drag.startY) / rect.height) * 100 * (1 / zoom);

    if (drag.kind === "move") {
      updateLayerKF(drag.layerId, drag.t, {
        x: clamp(drag.k0.x + dx, WORLD_MIN, WORLD_MAX),
        y: clamp(drag.k0.y + dy, WORLD_MIN, WORLD_MAX)
      });
      return;
    }

    const base = drag.k0;
    const h = drag.handle;

    let dw = 0,
      dh = 0;
    if (h.includes("e")) dw += dx;
    if (h.includes("w")) dw -= dx;
    if (h.includes("s")) dh += dy;
    if (h.includes("n")) dh -= dy;

    let nw = base.w + (drag.fromCenter ? dw * 2 : dw);
    let nh = base.h + (drag.fromCenter ? dh * 2 : dh);

    const isVerticalOnly = h === "n" || h === "s";
    const isHoriOnly = h === "e" || h === "w";

    if (drag.keepAspect) {
      const aspect = safeAspect(base.w, base.h);
      const absDw = Math.abs(nw - base.w);
      const absDh = Math.abs(nh - base.h);
      if (absDw >= absDh) nh = nw / aspect;
      else nw = nh * aspect;
    } else {
      if (isVerticalOnly) nw = base.w;
      if (isHoriOnly) nh = base.h;
    }

    nw = clamp(nw, SIZE_MIN, SIZE_MAX);
    nh = clamp(nh, SIZE_MIN, SIZE_MAX);

    let nx = base.x;
    let ny = base.y;

    if (!drag.fromCenter) {
      const wDelta = nw - base.w;
      const hDelta = nh - base.h;

      if (h.includes("w")) nx = base.x - wDelta / 2;
      if (h.includes("e")) nx = base.x + wDelta / 2;
      if (h.includes("n")) ny = base.y - hDelta / 2;
      if (h.includes("s")) ny = base.y + hDelta / 2;

      nx = clamp(nx, WORLD_MIN, WORLD_MAX);
      ny = clamp(ny, WORLD_MIN, WORLD_MAX);
    }

    updateLayerKF(drag.layerId, drag.t, { x: nx, y: ny, w: nw, h: nh });
  }

  function endDrag() {
    setDrag(null);
  }

  // ✅ 轨迹线：只画“选中对象”且“确实存在 t=1 keyframe”的情况
  // ✅ 图片模式：不画轨迹（即使历史上有 t1，也只是“数据保留”）
  const sel = useMemo(
    () => (scene.layers ?? []).find((l) => l.id === selectedLayerId) ?? null,
    [scene.layers, selectedLayerId]
  );

  const hasExplicitT1 = useMemo(() => {
    if (!sel) return false;
    const kf = Array.isArray(sel.kf) ? sel.kf : [];
    return kf.some((k) => k.t === 1);
  }, [sel]);

  const selK0 = sel ? getKFDisplay(sel, 0) : null;
  const selK1 = sel ? getKFDisplay(sel, 1) : null;

  /**
   * ✅ 关键修复（方案1）：
   * - 不再用 React onWheel + preventDefault（会落入 passive 造成报错）
   * - 用原生 wheel listener 且 passive:false
   * - 只在 “捏合缩放/ctrlKey” 时拦截并缩放
   * - 普通双指滚动：不拦截，让页面滚动（你说页面要滚动）
   */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      // Trackpad pinch 在 Chrome 通常表现为 ctrlKey=true 的 wheel
      // 只有这种情况才接管缩放，避免双指滚动时阻止页面滚动 & 避免报错
      if (!e.ctrlKey) return;

      e.preventDefault();

      const delta = e.deltaY;
      const factor = delta > 0 ? 0.92 : 1.08;
      setZoom((z) => clamp(z * factor, ZOOM_MIN, ZOOM_MAX));
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative as any, { passive: false } as any);
  }, []);

  const isPro = className?.includes("pro");
  return (
    <div className={className} style={{ ...styles.outer, ...(isPro ? styles.outerPro : {}) }}>
      <div
        ref={wrapRef}
        style={styles.stage}
        onPointerDown={() => onSelectLayer(null)}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Figma-style toolbar overlay (Pro) */}
        {isPro && (
          <div style={styles.canvasToolbar}>
            {[
              { icon: MousePointer2, active: true, title: "Select" },
              { icon: Move, active: false, title: "Move" },
              { icon: RotateCw, active: false, title: "Rotate" },
              { icon: Maximize, active: false, title: "Scale" }
            ].map((tool, i) => (
              <button
                key={i}
                type="button"
                className={`pro-canvas-tool-btn ${tool.active ? "active" : ""}`}
                title={tool.title}
              >
                <tool.icon size={16} />
              </button>
            ))}
          </div>
        )}
        {/* ✅ world：所有元素都放在 world 中，统一 scale */}
        <div style={{ ...styles.world, transform: `translate(-50%, -50%) scale(${zoom})` }}>
          {backgroundRefUrl ? (
            <div
              style={{
                ...styles.backgroundRefLayer,
                backgroundImage: `url(${backgroundRefUrl})`
              }}
            />
          ) : null}
          {/* ✅ 中间画面框：0~100 是“图片/视频实际画面” */}
          <div style={styles.frame} />

          {!isImageMode && sel && selK0 && selK1 && hasExplicitT1 && (
            <svg style={styles.pathSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id="sp_arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(120,180,255,0.75)" />
                </marker>
              </defs>

              <line
                x1={selK0.x}
                y1={selK0.y}
                x2={selK1.x}
                y2={selK1.y}
                stroke="rgba(120,180,255,0.55)"
                strokeWidth="0.6"
                strokeDasharray="1.2 1.2"
                markerEnd="url(#sp_arrow)"
              />
              <circle cx={selK0.x} cy={selK0.y} r="0.9" fill="rgba(120,180,255,0.92)" />
              <circle cx={selK1.x} cy={selK1.y} r="0.9" fill="rgba(255,255,255,0.85)" />
              <text x={selK0.x + 1.2} y={selK0.y - 1} fontSize="2.4" fill="rgba(120,180,255,0.95)" fontWeight="700">
                t0
              </text>
              <text x={selK1.x + 1.2} y={selK1.y - 1} fontSize="2.4" fill="rgba(255,255,255,0.9)" fontWeight="700">
                t1
              </text>
            </svg>
          )}

          {layersSorted.map((layer) => {
            const isSelected = layer.id === selectedLayerId;

            // ✅ 关键：
            // - 非选中：永远 t0
            // - 选中：视频跟随 editT；图片强制 t0（锁死 t1）
            const tForRender: 0 | 1 = isSelected ? (isImageMode ? 0 : editT) : 0;

            const k = getKFDisplay(layer, tForRender);
            const left = k.x - k.w / 2;
            const top = k.y - k.h / 2;
            const accent = pickLayerAccent(layer.id);
            const thumb = thumbUrls[layer.id] ?? "";

            return (
              <div
                key={layer.id}
                style={{
                  ...styles.obj,
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${k.w}%`,
                  height: `${k.h}%`,
                  zIndex: isSelected ? 3 : 1,
                  transform: `rotate(${k.rot || 0}deg)`,
                  opacity: clamp01(layer.opacity),
                  filter: isSelected ? "none" : "saturate(0.86)",
                  background:
                    layer.shape === "ring"
                      ? "transparent"
                      : `linear-gradient(160deg, ${withAlpha(accent, isSelected ? 0.22 : 0.12)}, rgba(8,10,18,0.08))`,
                  border:
                    layer.shape === "ring"
                      ? `3px solid ${accent}`
                      : isSelected
                        ? `2px solid ${withAlpha(accent, 0.98)}`
                        : `1px solid ${withAlpha(accent, 0.56)}`,
                  outline: isSelected ? `1px solid ${withAlpha(accent, 0.42)}` : "none",
                  boxShadow: isSelected
                    ? `0 0 0 1px ${withAlpha(accent, 0.34)} inset, 0 12px 26px ${withAlpha(accent, 0.28)}`
                    : `0 0 0 1px ${withAlpha(accent, 0.18)} inset`
                }}
                onPointerDown={(e) => onPointerDownLayer(e, layer)}
              >
                <div style={styles.label} title={layer.id}>
                  <span style={styles.labelTitle}>{layer.id}</span>
                </div>
                {thumb ? <img src={thumb} alt={layer.id} style={styles.thumbImg} /> : null}

                {isSelected && (
                  <>
                    <HandleDot pos="nw" onPointerDown={(e) => onPointerDownHandle(e, layer, "nw")} />
                    <HandleDot pos="n" onPointerDown={(e) => onPointerDownHandle(e, layer, "n")} />
                    <HandleDot pos="ne" onPointerDown={(e) => onPointerDownHandle(e, layer, "ne")} />
                    <HandleDot pos="w" onPointerDown={(e) => onPointerDownHandle(e, layer, "w")} />
                    <HandleDot pos="e" onPointerDown={(e) => onPointerDownHandle(e, layer, "e")} />
                    <HandleDot pos="sw" onPointerDown={(e) => onPointerDownHandle(e, layer, "sw")} />
                    <HandleDot pos="s" onPointerDown={(e) => onPointerDownHandle(e, layer, "s")} />
                    <HandleDot pos="se" onPointerDown={(e) => onPointerDownHandle(e, layer, "se")} />
                  </>
                )}
              </div>
            );
          })}

          {!layersSorted.length ? (
            <div style={styles.emptyGuide}>
              <div style={styles.emptyGuideTitle}>
                当前分镜还没有对象 / No Objects Yet
              </div>
              <div style={styles.emptyGuideText}>
                点击左侧“添加对象”开始编辑 / Click Add Object to Start
              </div>
            </div>
          ) : null}
        </div>

        {/* ✅ Figma-style viewport info (bottom-left) */}
        <div className="spx-pro-viewport-info" style={styles.zoomHint}>
          Layout | {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}

function HandleDot({
  pos,
  onPointerDown
}: {
  pos: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const style: React.CSSProperties = { ...styles.handle, ...(posStyle[pos] || {}) };
  return <div style={style} onPointerDown={onPointerDown} />;
}

const posStyle: Record<string, React.CSSProperties> = {
  nw: { left: -6, top: -6, cursor: "nwse-resize" },
  n: { left: "50%", top: -6, transform: "translateX(-50%)", cursor: "ns-resize" },
  ne: { right: -6, top: -6, cursor: "nesw-resize" },
  w: { left: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" },
  e: { right: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" },
  sw: { left: -6, bottom: -6, cursor: "nesw-resize" },
  s: { left: "50%", bottom: -6, transform: "translateX(-50%)", cursor: "ns-resize" },
  se: { right: -6, bottom: -6, cursor: "nwse-resize" }
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function hashText(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}
function pickLayerAccent(layerId: string): string {
  const palette = ["#5cb6ff", "#39d39f", "#ffb453", "#ff7a8a", "#9f86ff", "#4dd0e1", "#ffd166"];
  const idx = hashText(layerId || "obj") % palette.length;
  return palette[idx];
}
function withAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((x) => x + x).join("") : n.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function safeAspect(w: number, h: number) {
  return Math.max(0.001, w) / Math.max(0.001, h);
}

const styles: Record<string, React.CSSProperties> = {
  outer: { flex: 1, padding: `0 ${UI_SPACE.sm}px 0`, display: "flex", minHeight: 0 },
  outerPro: { padding: 0 },
  stage: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    borderRadius: 0,
    border: "none",
    background: "#1f2125",
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    backgroundPosition: "center center",
    boxShadow: "none",
    overflow: "hidden"
  },

  // ✅ world：所有绘制都在里面，统一缩放
  world: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    height: "100%",
    transformOrigin: "50% 50%"
  },

  // ✅ 画面框：代表 0~100 的实际输出画面
  frame: {
    position: "absolute",
    inset: 0,
    borderRadius: UI_RADIUS.panel,
    border: "none",
    boxShadow: "none",
    pointerEvents: "none"
  },
  backgroundRefLayer: {
    position: "absolute",
    inset: 0,
    borderRadius: 18,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "center center",
    opacity: 0.2,
    filter: "blur(2px) saturate(0.82)",
    pointerEvents: "none"
  },

  pathSvg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  },

  obj: {
    position: "absolute",
    borderRadius: 14,
    overflow: "hidden",
    transition: "filter 140ms ease, box-shadow 160ms ease, border-color 160ms ease, outline-color 160ms ease"
  },

  label: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "calc(100% - 16px)",
    padding: "3px 7px",
    fontSize: UI_TYPO.size11,
    fontWeight: 900,
    borderRadius: UI_RADIUS.control,
    background: "rgba(3,6,12,0.62)",
    border: `1px solid ${UI_PALETTE.border.default}`,
    color: UI_PALETTE.text.primary,
    pointerEvents: "none",
    whiteSpace: "nowrap"
  },
  labelTitle: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  labelType: {
    fontSize: 10,
    opacity: 0.76,
    whiteSpace: "nowrap"
  },
  labelTag: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 900,
    borderRadius: UI_RADIUS.chip,
    padding: "1px 6px",
    border: "1px solid rgba(255,255,255,0.30)",
    background: "rgba(255,255,255,0.14)"
  },
  metaLine: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 34,
    fontSize: 10,
    lineHeight: 1.25,
    color: "rgba(255,255,255,0.84)",
    textShadow: "0 1px 2px rgba(0,0,0,0.35)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  helperLine: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    fontSize: 10,
    lineHeight: 1.25,
    color: "rgba(255,255,255,0.88)",
    background: "rgba(0,0,0,0.44)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: UI_RADIUS.control,
    padding: "4px 6px",
    pointerEvents: "none",
    whiteSpace: "normal"
  },
  thumbImg: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 38,
    width: "calc(100% - 16px)",
    maxHeight: 52,
    objectFit: "cover",
    borderRadius: UI_RADIUS.control,
    border: "1px solid rgba(255,255,255,0.18)",
    pointerEvents: "none"
  },

  handle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: UI_RADIUS.control,
    background: "rgba(126,190,255,0.98)",
    border: "2px solid rgba(8,14,30,0.82)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.24)"
  },

  canvasToolbar: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    background: "#24262b",
    border: "1px solid #3a3f46",
    borderRadius: 6,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    overflow: "hidden"
  },
  zoomHint: {
    position: "absolute",
    left: 16,
    bottom: 16,
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid #3a3f46",
    background: "rgba(36, 38, 43, 0.8)",
    backdropFilter: "blur(6px)",
    fontSize: 10,
    fontFamily: "ui-monospace, SFMono-Regular, monospace",
    color: "#9ca3af",
    lineHeight: 1.2,
    pointerEvents: "none",
    userSelect: "none"
  },
  emptyGuide: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    minWidth: 240,
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: "rgba(10,15,26,0.92)",
    padding: "12px 14px",
    textAlign: "center",
    boxShadow: UI_EFFECT.panelShadow
  },
  emptyGuideTitle: {
    fontSize: UI_TYPO.size13,
    fontWeight: 900,
    color: UI_PALETTE.text.primary
  },
  emptyGuideText: {
    marginTop: 6,
    fontSize: UI_TYPO.size12,
    color: UI_PALETTE.text.secondary
  }
};
