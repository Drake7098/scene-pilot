import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Project, Scene, Layer } from "../model";
import { UI_FONT, UI_OPACITY, UI_SIZE } from "../uiTokens";
import { Plus, Minus } from "lucide-react";

type Props = {
  lang: Lang;
  project: Project;
  sceneIdx: number;
  setSceneIdx: (i: number) => void;
  onUpdateProject: (p: Project) => void;

  scene: Scene;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
};

function isComposing(e: any) {
  return !!e?.nativeEvent?.isComposing;
}
function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}
function nextId(prefix: string, exists: (id: string) => boolean) {
  for (let i = 1; i < 9999; i++) {
    const id = `${prefix}${i}`;
    if (!exists(id)) return id;
  }
  return `${prefix}${Math.floor(Math.random() * 9999)}`;
}
function fmtDuration(lang: Lang, s: number) {
  const n = Math.max(0, Math.round(Number(s) || 0));
  return lang === "zh" ? `${n}秒` : `${n}s`;
}

function kf0(layer: Layer) {
  return (layer.kf ?? []).find((k) => k.t === 0) ?? layer.kf?.[0] ?? { x: 50, y: 50, w: 24, h: 24 };
}

function suggestSpawnKf(layers: Layer[]) {
  const w = 24;
  const h = 24;
  let best = { x: 50, y: 50, w, h };
  for (let i = 0; i < 24; i++) {
    const x = 50 + (Math.random() * 30 - 15);
    const y = 50 + (Math.random() * 20 - 10);
    const candidate = { x: Math.max(18, Math.min(82, x)), y: Math.max(18, Math.min(82, y)), w, h };
    const minDist = (layers ?? []).reduce((m, l) => {
      const k = kf0(l);
      const d = Math.hypot(k.x - candidate.x, k.y - candidate.y);
      return Math.min(m, d);
    }, 9999);
    if (minDist > 14) return candidate;
    if (minDist > 8) best = candidate;
  }
  return best;
}

// ✅ NEW: pick next default scene name by scanning existing names
function nextSceneDefaultName(lang: Lang, scenes: Scene[]) {
  const zh = lang === "zh";
  const prefix = zh ? "分镜 " : "Scene ";
  const re = zh ? /^分镜\s*(\d+)\s*$/ : /^scene\s*(\d+)\s*$/i;

  const used = new Set<number>();
  for (const s of scenes) {
    const name = (s?.name ?? "").trim();
    const m = name.match(re);
    if (m) used.add(Number(m[1]));
  }

  for (let i = 1; i < 9999; i++) {
    if (!used.has(i)) return `${prefix}${i}`;
  }

  return `${prefix}${scenes.length + 1}`;
}

// -------------------- Media mode marker in scene.notes --------------------
type MediaMode = "image" | "video";
const MEDIA_MARK = "media:";
type GenMode = "quick" | "pro";
const GEN_MARK = "genmode:";

function parseMedia(notes: string): MediaMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(MEDIA_MARK));
  if (!hit) return "video"; // existing scenes without marker -> treat as video
  const v = hit.trim().slice(MEDIA_MARK.length).trim().toLowerCase();
  return v === "image" ? "image" : "video";
}

function setMedia(notes: string, mode: MediaMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(MEDIA_MARK));
  return [`${MEDIA_MARK} ${mode}`, ...rest].join("\n");
}

function parseGenMode(notes: string): GenMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(GEN_MARK));
  if (!hit) return "quick";
  const v = hit.trim().slice(GEN_MARK.length).trim().toLowerCase();
  return v === "pro" ? "pro" : "quick";
}

function setGenMode(notes: string, mode: GenMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(GEN_MARK));
  return [`${GEN_MARK} ${mode}`, ...rest].join("\n");
}

// -------------------- Stability marker in scene.notes --------------------
type StabilityMode = "off" | "standard" | "strict";
type FloatingHintTone = "info" | "danger";
const STAB_MARK = "stability:";

function parseStability(notes: string): StabilityMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(STAB_MARK));
  if (!hit) return "standard"; // default
  const v = hit.trim().slice(STAB_MARK.length).trim().toLowerCase();
  // backward compatibility: historical "on" maps to "standard"
  if (v === "on") return "standard";
  if (v === "strict") return "strict";
  if (v === "off") return "off";
  return "standard";
}

function setStability(notes: string, mode: StabilityMode): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(STAB_MARK));
  return [`${STAB_MARK} ${mode}`, ...rest].join("\n");
}

// -------------------- New Scene Draft UI --------------------
type NewSceneDraft = {
  open: boolean;
  mode: MediaMode;
  genMode: GenMode;
  name: string;
  duration_s: string; // for input
};

export function Sidebar(props: Props) {
  const {
    lang,
    project,
    sceneIdx,
    setSceneIdx,
    onUpdateProject,
    scene,
    selectedLayerId,
    onSelectLayer,
    onUpdateScene
  } = props;

  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);
  const scenes = project.scenes ?? [];
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [sceneNameDraft, setSceneNameDraft] = useState("");

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [layerIdDraft, setLayerIdDraft] = useState("");

  const [editingDurSceneId, setEditingDurSceneId] = useState<string | null>(null);
  const [durDraft, setDurDraft] = useState<string>("");

  // per-scene markers (current scene)
  const sceneNotes = scene?.notes ?? "";
  const mediaMode = useMemo<MediaMode>(() => parseMedia(sceneNotes), [sceneNotes]);
  const stabilityMode = useMemo<StabilityMode>(() => parseStability(sceneNotes), [sceneNotes]);
  // ✅ NEW: add scene mini panel
  const [newScene, setNewScene] = useState<NewSceneDraft>({
    open: false,
    mode: "image",
    genMode: "quick",
    name: "",
    duration_s: "6"
  });
  const [showGenHint, setShowGenHint] = useState(false);

  // ✅ 替代 alert/confirm：轻量 toast + 自定义确认框
  const [toastText, setToastText] = useState<string>("");
  const toastTimerRef = useRef<number | null>(null);
  const [floatingHint, setFloatingHint] = useState<{ text: string; top: number; left: number; tone: FloatingHintTone } | null>(null);
  const floatingHintTimerRef = useRef<number | null>(null);
  const deleteHintAnchorRef = useRef<HTMLElement | null>(null);

  const [confirmDelIdx, setConfirmDelIdx] = useState<number | null>(null);

  function showToast(text: string) {
    setToastText(text);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(""), 1400);
  }

  function showFloatingHint(text: string, anchorEl: HTMLElement | null, tone: FloatingHintTone = "info") {
    if (!anchorEl) {
      showToast(text);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    setFloatingHint({
      text,
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
      tone
    });
    if (floatingHintTimerRef.current != null) window.clearTimeout(floatingHintTimerRef.current);
    floatingHintTimerRef.current = window.setTimeout(() => setFloatingHint(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
      if (floatingHintTimerRef.current != null) window.clearTimeout(floatingHintTimerRef.current);
    };
  }, []);

  function commitSceneName(sid: string) {
    const name = sceneNameDraft.trim();
    if (!name) {
      setEditingSceneId(null);
      return;
    }
    onUpdateProject({
      ...project,
      scenes: scenes.map((s) => (s.id === sid ? { ...s, name } : s))
    });
    setEditingSceneId(null);
  }

  function commitSceneDuration(sid: string) {
    const raw = Number(durDraft);
    const duration_s = Math.max(0, Math.round(Number.isFinite(raw) ? raw : 0));
    onUpdateProject({
      ...project,
      scenes: scenes.map((s) => (s.id === sid ? { ...s, duration_s } : s))
    });
    setEditingDurSceneId(null);
  }

  function commitLayerId(oldId: string) {
    const nextIdVal = layerIdDraft.trim();
    if (!nextIdVal || nextIdVal === oldId) {
      setEditingLayerId(null);
      return;
    }
    const exists = (scene.layers ?? []).some((l) => l.id === nextIdVal);
    if (exists) return;

    const nextLayers = (scene.layers ?? []).map((l) => (l.id === oldId ? { ...l, id: nextIdVal } : l));
    onUpdateScene({ ...scene, layers: nextLayers });
    if (selectedLayerId === oldId) onSelectLayer(nextIdVal);
    setEditingLayerId(null);
  }

  // ✅ 媒体切换提示：悬浮在控件旁，不占位
  function commitMediaMode(mode: MediaMode, anchorEl: HTMLElement | null) {
    if (mode === mediaMode) return; // ✅ already in this mode, no-op (no toast)

    const nextNotes = setMedia(scene.notes ?? "", mode);
    onUpdateScene({ ...scene, notes: nextNotes });

    if (mode === "image") {
      showFloatingHint(tt("sidebar.switchToImage"), anchorEl, "info");
    } else {
      showFloatingHint(tt("sidebar.switchToVideo"), anchorEl, "info");
    }
  }

  function commitStabilityMode(mode: StabilityMode) {
    const nextNotes = setStability(scene.notes ?? "", mode);
    onUpdateScene({ ...scene, notes: nextNotes });
    showToast(
      mode === "strict"
        ? tt("sidebar.constraintToastStrict")
        : mode === "standard"
          ? tt("sidebar.constraintToastStandard")
          : tt("sidebar.constraintToastOff")
    );
  }

  // ✅ NEW: open mini add panel (instead of creating immediately)
  function openAddScenePanel() {
    const suggested = nextSceneDefaultName(lang, scenes);

    setNewScene({
      open: true,
      mode: "image", // ✅ default image
      genMode: "quick",
      name: suggested,
      duration_s: "6"
    });
    setShowGenHint(false);
  }

  function cancelAddScenePanel() {
    setNewScene((s) => ({ ...s, open: false }));
    setShowGenHint(false);
  }

  function confirmAddScene() {
    const id = nextId("s", (x) => scenes.some((s) => s.id === x));

    const fallbackName = nextSceneDefaultName(lang, scenes);
    const name = (newScene.name ?? "").trim() || fallbackName;
    const mode: MediaMode = newScene.mode;
    const genMode: GenMode = newScene.genMode;

    // ✅ keep data stable: even image keeps duration_s in data, but UI badge won't show it
    const duration_s = mode === "video" ? Math.max(0, Math.round(Number(newScene.duration_s) || 0)) : 6;

    const newSceneObj: Scene = {
      id,
      name,
      duration_s,
      camera: {
        shot: "",
        movement: "",
        keyframes: [
          { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
        ]
      } as any,
      lighting: { time: "", key_dir: "", mood: "" } as any,
      layers: [],
      notes: setGenMode(setMedia("", mode), genMode) // ✅ explicit markers for new scenes
    };

    const next: Project = { ...project, scenes: [...scenes, newSceneObj] };
    onUpdateProject(next);
    setSceneIdx(next.scenes.length - 1);
    onSelectLayer(null);

    setNewScene((s) => ({ ...s, open: false }));
    setShowGenHint(false);
    showToast(tt("sidebar.sceneCreated"));
  }

  // ✅ 修复：删除分镜不用 window.confirm（同样是怪弹窗）
  function requestDeleteScene(idx: number, anchorEl: HTMLElement | null) {
    if (scenes.length <= 1) return;
    deleteHintAnchorRef.current = anchorEl;
    setConfirmDelIdx(idx);
  }
  function doDeleteScene(idx: number) {
    if (scenes.length <= 1) return;
    const nextScenes = scenes.filter((_, i) => i !== idx);
    onUpdateProject({ ...project, scenes: nextScenes });
    setSceneIdx(Math.max(0, idx - 1));
    onSelectLayer(null);
    setConfirmDelIdx(null);
    showFloatingHint(tt("sidebar.sceneDeleted"), deleteHintAnchorRef.current, "danger");
  }

  function addLayer() {
    const layers = scene.layers ?? [];
    const id = nextId("obj", (x) => layers.some((l) => l.id === x));
    const spawn = suggestSpawnKf(layers);

    // ✅ 优化：新增对象默认“未填写”，避免给模型不必要的先验（比如默认 character）
    const newLayer: Layer = {
      id,
      type: "", // ✅ was "character"
      shape: "rect",
      shapeDesc: "",
      look: "",
      z: layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 10,
      color: "#b7c3ff",
      opacity: 1,
      kf: [{ t: 0, x: spawn.x, y: spawn.y, w: spawn.w, h: spawn.h, rot: 0 }],
      notes: "",
      externalPrompt: "",
      referenceLinks: "",
      localRefs: [],
      referencePolicy: "optional"
    };

    onUpdateScene({ ...scene, layers: [...layers, newLayer] });
    onSelectLayer(id);

    // 可选提示：新对象已创建（不想要就删）
    // showToast(lang === "zh" ? "已添加对象" : "Object added");
  }

  function deleteLayer(layerId: string) {
    const layers = scene.layers ?? [];
    onUpdateScene({ ...scene, layers: layers.filter((l) => l.id !== layerId) });
    if (selectedLayerId === layerId) onSelectLayer(null);
    showToast(tt("sidebar.objectDeleted"));
  }

  const shotOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "wide", label: tt("opt.wide") },
      { v: "medium", label: tt("opt.medium") },
      { v: "close", label: tt("opt.close") },
      { v: "extreme_close", label: tt("opt.extreme_close") },
      { v: "over_shoulder", label: tt("opt.over_shoulder") },
      { v: "dutch_angle", label: tt("opt.dutch_angle") }
    ],
    [tt, lang]
  );
  const moveOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "static", label: tt("opt.static") },
      { v: "slow_push_in", label: tt("opt.slow_push_in") },
      { v: "slow_pull_out", label: tt("opt.slow_pull_out") },
      { v: "pan_left", label: tt("opt.pan_left") },
      { v: "pan_right", label: tt("opt.pan_right") },
      { v: "tilt_up", label: tt("opt.tilt_up") },
      { v: "tilt_down", label: tt("opt.tilt_down") },
      { v: "handheld", label: tt("opt.handheld") },
      { v: "orbit", label: tt("opt.orbit") }
    ],
    [tt, lang]
  );
  const timeOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "day", label: tt("opt.day") },
      { v: "dawn", label: tt("opt.dawn") },
      { v: "sunset", label: tt("opt.sunset") },
      { v: "golden_hour", label: tt("opt.golden_hour") },
      { v: "blue_hour", label: tt("opt.blue_hour") },
      { v: "night", label: tt("opt.night") }
    ],
    [tt, lang]
  );
  const dirOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "top_left", label: tt("opt.top_left") },
      { v: "top_right", label: tt("opt.top_right") },
      { v: "bottom_left", label: tt("opt.bottom_left") },
      { v: "bottom_right", label: tt("opt.bottom_right") },
      { v: "backlight", label: tt("opt.backlight") },
      { v: "rim_light", label: tt("opt.rim_light") }
    ],
    [tt, lang]
  );
  const moodOptions = useMemo(
    () => [
      { v: "", label: tt("sidebar.unset") },
      { v: "cinematic", label: tt("opt.cinematic") },
      { v: "mysterious", label: tt("opt.mysterious") },
      { v: "bright", label: tt("opt.bright") },
      { v: "dark", label: tt("opt.dark") },
      { v: "noir", label: tt("opt.noir") },
      { v: "warm", label: tt("opt.warm") },
      { v: "cold", label: tt("opt.cold") }
    ],
    [tt, lang]
  );

  return (
    <div style={styles.wrap}>
      {/* ✅ toast */}
      {toastText ? <div style={styles.toast}>{toastText}</div> : null}
      {floatingHint ? (
        <div
          style={{
            ...styles.floatingHint,
            ...(floatingHint.tone === "danger" ? styles.floatingHintDanger : styles.floatingHintInfo),
            top: floatingHint.top,
            left: floatingHint.left
          }}
        >
          {floatingHint.text}
        </div>
      ) : null}

      {/* ✅ confirm modal (for delete scene) */}
      {confirmDelIdx != null ? (
        <div
          style={styles.modalMask}
          role="presentation"
          onMouseDown={() => setConfirmDelIdx(null)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{tt("sidebar.deleteScene")}</div>
            <div style={styles.modalText}>
              {tt("sidebar.deleteConfirm")}
            </div>
            <div style={styles.modalBtns}>
              <button type="button" style={styles.btnGhost} onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmDelIdx(null)}>
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                style={styles.btnDanger}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => doDeleteScene(confirmDelIdx)}
              >
                {tt("sidebar.delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ create scene modal */}
      {newScene.open ? (
        <div
          style={styles.modalMask}
          role="presentation"
          onMouseDown={() => cancelAddScenePanel()}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{tt("sidebar.createScene")}</div>

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.type")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, mode: "image" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "image" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.image")}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, mode: "video" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "video" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.video")}
                </button>
              </div>
            </div>

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.mode")}</div>
              <div style={styles.genModeRow}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, genMode: "quick" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.genMode === "quick" ? styles.mediaBtnOn : {}) }}
                >
                  {tt("sidebar.quick")}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, genMode: "pro" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.genMode === "pro" ? styles.mediaBtnOn : {}) }}
                >
                  PRO
                </button>
                <button
                  type="button"
                  style={styles.qBtn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowGenHint((v) => !v)}
                  title={tt("sidebar.showModeDiff")}
                >
                  ?
                </button>
              </div>
            </div>
            {showGenHint ? (
              <div style={styles.genHintFloat}>
                {tt("sidebar.modeDiffHint")}
              </div>
            ) : null}

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{tt("sidebar.name")}</div>
              <input
                value={newScene.name}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setNewScene((s) => ({ ...s, name: e.target.value }))}
                maxLength={40}
                style={styles.addInput}
                placeholder={tt("sidebar.namePlaceholder")}
              />
            </div>

            <div style={{ ...styles.addRow, visibility: newScene.mode === "video" ? "visible" : "hidden" }}>
              <div style={styles.addLabel}>{tt("sidebar.seconds")}</div>
              <input
                value={newScene.duration_s}
                onChange={(e) => setNewScene((s) => ({ ...s, duration_s: e.target.value }))}
                style={styles.addInputSmall}
                inputMode="numeric"
                disabled={newScene.mode !== "video"}
              />
            </div>

            <div style={styles.modalBtns}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelAddScenePanel}
                style={styles.btnGhost}
              >
                {tt("sidebar.cancel")}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={confirmAddScene}
                style={styles.btnPrimary}
              >
                {tt("sidebar.create")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Scenes */}
      <div style={styles.section}>
        {/* media toggle for current scene */}
        <div style={styles.mediaRow}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => commitMediaMode("image", e.currentTarget as HTMLElement)}
            style={{ ...styles.mediaBtn, ...(mediaMode === "image" ? styles.mediaBtnOn : {}) }}
            title={tt("sidebar.imageModeHint")}
          >
            {tt("sidebar.image")}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => commitMediaMode("video", e.currentTarget as HTMLElement)}
            style={{ ...styles.mediaBtn, ...(mediaMode === "video" ? styles.mediaBtnOn : {}) }}
            title={tt("sidebar.videoModeHint")}
          >
            {tt("sidebar.video")}
          </button>
        </div>

        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.scenes")}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={styles.iconBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAddScenePanel}
            title={tt("sidebar.addScene")}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={styles.list}>
          {scenes.map((s, i) => {
            const isOn = i === safeIdx;
            const mode = parseMedia(s.notes ?? "");
            const genMode = parseGenMode(s.notes ?? "");
            const badgeText = mode === "image" ? tt("sidebar.image") : fmtDuration(lang, s.duration_s);

            return (
              <div key={s.id} style={styles.itemRowWrap}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.rowBtn, ...(isOn ? styles.rowBtnOn : {}) }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSceneIdx(i);
                    onSelectLayer(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSceneIdx(i);
                      onSelectLayer(null);
                    }
                  }}
                >
                  <div style={styles.rowInner}>
                    {editingSceneId === s.id ? (
                      <input
                        autoFocus
                        value={sceneNameDraft}
                        onChange={(e) => setSceneNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (isComposing(e)) return;
                          if (e.key === "Enter") commitSceneName(s.id);
                          if (e.key === "Escape") setEditingSceneId(null);
                        }}
                        onBlur={() => commitSceneName(s.id)}
                        style={styles.renameInput}
                      />
                    ) : (
                      <div
                        style={styles.renameText}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingSceneId(s.id);
                          setSceneNameDraft(s.name ?? "");
                        }}
                        title={tt("sidebar.renameHint")}
                      >
                        {s.name ?? s.id}
                      </div>
                    )}

                    {/* ✅ badge: image shows IMG/图片; video shows seconds (editable) */}
                    {mode === "video" ? (
                      editingDurSceneId === s.id ? (
                        <input
                          autoFocus
                          value={durDraft}
                          onChange={(e) => setDurDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (isComposing(e)) return;
                            if (e.key === "Enter") commitSceneDuration(s.id);
                            if (e.key === "Escape") setEditingDurSceneId(null);
                          }}
                          onBlur={() => commitSceneDuration(s.id)}
                          style={styles.durInput}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          style={styles.badgeBtn}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingDurSceneId(s.id);
                            setDurDraft(String(Math.max(0, Math.round(Number(s.duration_s) || 0))));
                          }}
                          title={tt("sidebar.editDuration")}
                        >
                          {badgeText}
                        </div>
                      )
                    ) : (
                      <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={tt("sidebar.imageScene")}>
                        {badgeText}
                      </div>
                    )}
                    <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={tt("sidebar.generationMode")}>
                      {genMode === "pro" ? "PRO" : tt("sidebar.quick")}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.iconBtnDanger}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => requestDeleteScene(i, e.currentTarget as HTMLElement)}
                  title={tt("sidebar.deleteScene")}
                  disabled={scenes.length <= 1}
                >
                  <Minus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objects */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.layers")}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={styles.iconBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={addLayer}
            title={tt("sidebar.addLayer")}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={styles.list}>
          {(scene.layers ?? [])
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((l) => {
              const isOn = l.id === selectedLayerId;

              return (
                <div key={l.id} style={styles.itemRowWrap}>
                  <div
                    role="button"
                    tabIndex={0}
                    style={{ ...styles.rowBtn, ...(isOn ? styles.rowBtnOn : {}) }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectLayer(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelectLayer(l.id);
                    }}
                  >
                    <div style={styles.rowInner}>
                      {editingLayerId === l.id ? (
                        <input
                          autoFocus
                          value={layerIdDraft}
                          onChange={(e) => setLayerIdDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (isComposing(e)) return;
                            if (e.key === "Enter") commitLayerId(l.id);
                            if (e.key === "Escape") setEditingLayerId(null);
                          }}
                          onBlur={() => commitLayerId(l.id)}
                          style={styles.renameInput}
                        />
                      ) : (
                        <div
                          style={styles.renameText}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingLayerId(l.id);
                            setLayerIdDraft(l.id);
                          }}
                          title={tt("sidebar.renameHint")}
                        >
                          {l.id}
                        </div>
                      )}
                      <div style={{ width: 1 }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    style={styles.iconBtnDanger}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => deleteLayer(l.id)}
                    title={tt("sidebar.deleteLayer")}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              );
            })}
        </div>

      </div>

      {/* Stability */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.constraintTitle")}</div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("sidebar.constraintField")}</div>
          <select value={stabilityMode} onChange={(e) => commitStabilityMode(e.target.value as StabilityMode)} style={styles.select}>
            <option value="off">{tt("sidebar.constraintOff")}</option>
            <option value="standard">{tt("sidebar.constraintStandard")}</option>
            <option value="strict">{tt("sidebar.constraintStrict")}</option>
          </select>
        </div>

        <div style={styles.mediaHint}>{tt("sidebar.constraintHint")}</div>
      </div>

      {/* Camera + Lighting */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>{tt("camera.title")}</div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("camera.shot")}</div>
          <select
            style={styles.select}
            value={(scene.camera?.shot ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, camera: { ...scene.camera, shot: e.target.value } as any })}
          >
            {shotOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("camera.movement")}</div>
          <select
            style={styles.select}
            value={(scene.camera?.movement ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, camera: { ...scene.camera, movement: e.target.value } as any })}
          >
            {moveOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 8 }} />

        <div style={styles.sectionTitle}>{tt("lighting.title")}</div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.time")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.time ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, time: e.target.value } as any })}
          >
            {timeOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.keyDir")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.key_dir ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, key_dir: e.target.value } as any })}
          >
            {dirOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formLabel}>{tt("lighting.mood")}</div>
          <select
            style={styles.select}
            value={(scene.lighting?.mood ?? "").toString()}
            onChange={(e) => onUpdateScene({ ...scene, lighting: { ...scene.lighting, mood: e.target.value } as any })}
          >
            {moodOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 320,
    minWidth: 280,
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.12)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
    overflow: "auto",
    position: "relative"
  },

  section: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    padding: 10
  },

  sectionHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontWeight: 900, fontSize: UI_FONT.section, opacity: UI_OPACITY.title },

  mediaRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8
  },
  mediaHint: {
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.55,
    fontWeight: 800,
    padding: "0 2px 10px 2px"
  },
  profileHint: {
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.68,
    fontWeight: 800,
    padding: "0 2px 6px 2px"
  },

  mediaBtn: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.18)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    userSelect: "none",
    outline: "none",
    boxShadow: "none",
    padding: "0 10px"
  },
  mediaBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },

  // ✅ New scene card
  addCard: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  addRow: { display: "flex", alignItems: "center", gap: 12, minHeight: 40 },
  addLabel: {
    width: UI_SIZE.labelWSidebar,
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.3
  },
  addInput: {
    flex: 1,
    width: "100%",
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 800
  },
  addInputSmall: {
    width: 92,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 800,
    textAlign: "right"
  },
  addActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 },
  genModeRow: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, flex: 1, alignItems: "center" },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none"
  },
  genHintFloat: {
    fontSize: 11,
    lineHeight: 1.35,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(0,0,0,0.18)",
    padding: "8px 10px",
    opacity: 0.78,
    marginTop: 0
  },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },
  btnPrimary: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },
  btnDanger: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none"
  },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  itemRowWrap: { display: "flex", gap: 8, alignItems: "stretch" },

  rowBtn: {
    flex: 1,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.18)",
    color: "inherit",
    cursor: "pointer",
    padding: "8px 10px",
    userSelect: "none",
    outline: "none",
    boxShadow: "none"
  },

  rowBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },

  rowInner: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },

  renameText: {
    flex: 1,
    minWidth: 0,
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "2px 6px",
    borderRadius: 8,
    opacity: 0.92
  },

  renameInput: {
    flex: 1,
    height: UI_SIZE.compactH,
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 900
  },

  badgeBtn: {
    flex: "0 0 auto",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.85,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    userSelect: "none",
    outline: "none",
    boxShadow: "none"
  },

  durInput: {
    width: 64,
    height: 26,
    borderRadius: 999,
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    textAlign: "right"
  },

  iconBtn: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    outline: "none",
    boxShadow: "none"
  },
  iconBtnDanger: {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    opacity: 0.95,
    outline: "none",
    boxShadow: "none"
  },

  formRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  formLabel: {
    width: UI_SIZE.labelWSidebar,
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.3
  },
  select: {
    flex: 1,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body
  },

  // ✅ toast（左下角）
  toast: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    marginBottom: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.92)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.92
  },
  floatingHint: {
    position: "fixed",
    zIndex: 120,
    transform: "translateX(-50%)",
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    fontSize: 12,
    fontWeight: 900,
    pointerEvents: "none",
    backdropFilter: "blur(4px)"
  },
  floatingHintInfo: {
    background: "rgba(15,20,35,0.94)",
    color: "rgba(255,255,255,0.95)"
  },
  floatingHintDanger: {
    background: "rgba(55,20,20,0.95)",
    border: "1px solid rgba(255,120,120,0.45)",
    color: "rgba(255,235,235,0.96)"
  },

  // ✅ confirm modal
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 420,
    maxWidth: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 0, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },
  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 2 }
};
