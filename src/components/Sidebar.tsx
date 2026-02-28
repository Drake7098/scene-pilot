import React, { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Project, Scene, Layer } from "../model";
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

// -------------------- Media mode marker in scene.notes --------------------
type MediaMode = "image" | "video";
const MEDIA_MARK = "media:";

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

// -------------------- Stability marker in scene.notes --------------------
type StabilityMode = "on" | "off";
const STAB_MARK = "stability:";

function parseStability(notes: string): StabilityMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(STAB_MARK));
  if (!hit) return "on"; // default ON
  const v = hit.trim().slice(STAB_MARK.length).trim().toLowerCase();
  return v === "off" ? "off" : "on";
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
  name: string;
  duration_s: string; // for input
};

export function Sidebar(props: Props) {
  const { lang, project, sceneIdx, setSceneIdx, onUpdateProject, scene, selectedLayerId, onSelectLayer, onUpdateScene } =
    props;

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
  const mediaMode = useMemo<MediaMode>(() => parseMedia(scene?.notes ?? ""), [scene?.notes]);
  const stabilityMode = useMemo<StabilityMode>(() => parseStability(scene?.notes ?? ""), [scene?.notes]);
  const stabilityOn = stabilityMode === "on";

  // ✅ NEW: add scene mini panel
  const [newScene, setNewScene] = useState<NewSceneDraft>({
    open: false,
    mode: "image",
    name: "",
    duration_s: "6"
  });

  function killFocus(e: React.FocusEvent<HTMLElement>) {
    (e.currentTarget as HTMLElement).blur();
  }

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

  // ✅ keep: can switch existing scene image/video any time
  function commitMediaMode(mode: MediaMode) {
    const nextNotes = setMedia(scene.notes ?? "", mode);
    onUpdateScene({ ...scene, notes: nextNotes });

    // ✅ tiny hint (optional, but helps user understand seconds disappear)
    // You can remove if you dislike alert.
    if (mode === "image") {
      // eslint-disable-next-line no-alert
      window.setTimeout(() => {
        window.alert(lang === "zh" ? "已切换到图片：提示词只保留 T0，分镜列表不显示秒数。" : "Switched to Image: prompt keeps T0 only; no seconds badge.");
      }, 0);
    } else {
      // eslint-disable-next-line no-alert
      window.setTimeout(() => {
        window.alert(lang === "zh" ? "已切换到视频：提示词使用 T0/T1，分镜列表显示秒数。" : "Switched to Video: prompt uses T0/T1; seconds badge is shown.");
      }, 0);
    }
  }

  function commitStabilityMode(mode: StabilityMode) {
    const nextNotes = setStability(scene.notes ?? "", mode);
    onUpdateScene({ ...scene, notes: nextNotes });
  }

  // ✅ NEW: open mini add panel (instead of creating immediately)
  function openAddScenePanel() {
    const index = scenes.length + 1;
    const suggested = lang === "zh" ? `分镜 ${index}` : `Scene ${index}`;

    setNewScene({
      open: true,
      mode: "image", // ✅ default image
      name: suggested,
      duration_s: "6"
    });
  }

  function cancelAddScenePanel() {
    setNewScene((s) => ({ ...s, open: false }));
  }

  function confirmAddScene() {
    const id = nextId("s", (x) => scenes.some((s) => s.id === x));
    const index = scenes.length + 1;

    const name = (newScene.name ?? "").trim() || (lang === "zh" ? `分镜 ${index}` : `Scene ${index}`);
    const mode: MediaMode = newScene.mode;

    // ✅ keep data stable: even image keeps duration_s in data, but UI badge won't show it
    const duration_s = mode === "video" ? Math.max(0, Math.round(Number(newScene.duration_s) || 0)) : 6;

    // ✅ IMPORTANT:
    // - camera/lighting should start as "unset" (empty strings)
    // - do NOT inherit current scene settings
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
      notes: setMedia("", mode) // ✅ explicit marker for new scenes
    };

    const next: Project = { ...project, scenes: [...scenes, newSceneObj] };
    onUpdateProject(next);
    setSceneIdx(next.scenes.length - 1);
    onSelectLayer(null);

    setNewScene((s) => ({ ...s, open: false }));
  }

  function deleteScene(idx: number) {
    if (scenes.length <= 1) return;

    const ok = window.confirm(lang === "zh" ? "确认删除这个分镜吗？（无法撤销）" : "Delete this scene? (Cannot be undone)");
    if (!ok) return;

    const nextScenes = scenes.filter((_, i) => i !== idx);
    onUpdateProject({ ...project, scenes: nextScenes });
    setSceneIdx(Math.max(0, idx - 1));
    onSelectLayer(null);
  }

  function addLayer() {
    const layers = scene.layers ?? [];
    const id = nextId("obj", (x) => layers.some((l) => l.id === x));

    const newLayer: Layer = {
      id,
      type: "character",
      shape: "rect",
      shapeDesc: "",
      look: "",
      z: layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 10,
      color: "#b7c3ff",
      opacity: 1,
      kf: [{ t: 0, x: 50, y: 50, w: 18, h: 18, rot: 0 }],
      notes: ""
    };

    onUpdateScene({ ...scene, layers: [...layers, newLayer] });
    onSelectLayer(id);
  }

  function deleteLayer(layerId: string) {
    const layers = scene.layers ?? [];
    onUpdateScene({ ...scene, layers: layers.filter((l) => l.id !== layerId) });
    if (selectedLayerId === layerId) onSelectLayer(null);
  }

  const shotOptions = useMemo(
    () => [
      { v: "", label: lang === "zh" ? "（未选择）" : "(unset)" },
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
      { v: "", label: lang === "zh" ? "（未选择）" : "(unset)" },
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
      { v: "", label: lang === "zh" ? "（未选择）" : "(unset)" },
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
      { v: "", label: lang === "zh" ? "（未选择）" : "(unset)" },
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
      { v: "", label: lang === "zh" ? "（未选择）" : "(unset)" },
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
      {/* Scenes */}
      <div style={styles.section}>
        {/* media toggle for current scene */}
        <div style={styles.mediaRow}>
          <button
            type="button"
            tabIndex={-1}
            onFocus={killFocus}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => commitMediaMode("image")}
            style={{ ...styles.mediaBtn, ...(mediaMode === "image" ? styles.mediaBtnOn : {}) }}
            title={lang === "zh" ? "图片模式：仅 T0（可随时切换）" : "Image mode: T0 only (switch anytime)"}
          >
            {lang === "zh" ? "图片" : "Image"}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onFocus={killFocus}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => commitMediaMode("video")}
            style={{ ...styles.mediaBtn, ...(mediaMode === "video" ? styles.mediaBtnOn : {}) }}
            title={lang === "zh" ? "视频模式：T0/T1（可随时切换）" : "Video mode: T0/T1 (switch anytime)"}
          >
            {lang === "zh" ? "视频" : "Video"}
          </button>
        </div>

        <div style={styles.mediaHint}>
          {lang === "zh"
            ? "提示词末尾会自动追加“机器语言坐标解释”（灰字显示，可忽略）。"
            : "A muted “machine-notes coordinate guide” will be appended at the end of the prompt (safe to ignore)."}
        </div>

        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>{tt("sidebar.scenes")}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            tabIndex={-1}
            onFocus={killFocus}
            style={styles.iconBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAddScenePanel}
            title={tt("sidebar.addScene")}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* ✅ NEW: mini add panel */}
        {newScene.open ? (
          <div style={styles.addCard}>
            <div style={styles.addRow}>
              <div style={styles.addLabel}>{lang === "zh" ? "类型" : "Type"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
                <button
                  type="button"
                  tabIndex={-1}
                  onFocus={killFocus}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, mode: "image" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "image" ? styles.mediaBtnOn : {}) }}
                >
                  {lang === "zh" ? "图片" : "Image"}
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onFocus={killFocus}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setNewScene((s) => ({ ...s, mode: "video" }))}
                  style={{ ...styles.mediaBtn, ...(newScene.mode === "video" ? styles.mediaBtnOn : {}) }}
                >
                  {lang === "zh" ? "视频" : "Video"}
                </button>
              </div>
            </div>

            <div style={styles.addRow}>
              <div style={styles.addLabel}>{lang === "zh" ? "名称" : "Name"}</div>
              <input
                value={newScene.name}
                onChange={(e) => setNewScene((s) => ({ ...s, name: e.target.value }))}
                style={styles.addInput}
                placeholder={lang === "zh" ? "例如：三位美女" : "e.g. Three women"}
              />
            </div>

            {newScene.mode === "video" ? (
              <div style={styles.addRow}>
                <div style={styles.addLabel}>{lang === "zh" ? "秒数" : "Seconds"}</div>
                <input
                  value={newScene.duration_s}
                  onChange={(e) => setNewScene((s) => ({ ...s, duration_s: e.target.value }))}
                  style={styles.addInputSmall}
                  inputMode="numeric"
                />
              </div>
            ) : null}

            <div style={styles.addActions}>
              <button
                type="button"
                tabIndex={-1}
                onFocus={killFocus}
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelAddScenePanel}
                style={styles.btnGhost}
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                type="button"
                tabIndex={-1}
                onFocus={killFocus}
                onMouseDown={(e) => e.preventDefault()}
                onClick={confirmAddScene}
                style={styles.btnPrimary}
              >
                {lang === "zh" ? "创建" : "Create"}
              </button>
            </div>
          </div>
        ) : null}

        <div style={styles.list}>
          {scenes.map((s, i) => {
            const isOn = i === safeIdx;
            const mode = parseMedia(s.notes ?? "");
            const badgeText = mode === "image" ? (lang === "zh" ? "图片" : "IMG") : fmtDuration(lang, s.duration_s);

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
                        title={lang === "zh" ? "双击改名" : "Double-click to rename"}
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
                          title={lang === "zh" ? "点击修改秒数" : "Click to edit duration"}
                        >
                          {badgeText}
                        </div>
                      )
                    ) : (
                      <div style={{ ...styles.badgeBtn, opacity: 0.78 }} title={lang === "zh" ? "图片分镜" : "Image scene"}>
                        {badgeText}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  onFocus={killFocus}
                  style={styles.iconBtnDanger}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => deleteScene(i)}
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
          <div style={styles.sectionTitle}>{lang === "zh" ? "对象" : "Objects"}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            tabIndex={-1}
            onFocus={killFocus}
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
                          title={lang === "zh" ? "双击改名" : "Double-click to rename"}
                        >
                          {l.id}
                        </div>
                      )}
                      <div style={{ width: 1 }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    onFocus={killFocus}
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
          <div style={styles.sectionTitle}>{lang === "zh" ? "生成稳定" : "Stability"}</div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            tabIndex={-1}
            onFocus={killFocus}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => commitStabilityMode(stabilityOn ? "off" : "on")}
            style={{ ...styles.mediaBtn, ...(stabilityOn ? styles.mediaBtnOn : {}) }}
            title={
              lang === "zh"
                ? "默认开启：仅在提示词末尾追加稳定规则（不改坐标/镜头/时间）"
                : "Default ON: append tail safeguards only (no coord/camera/time edits)"
            }
          >
            {lang === "zh" ? (stabilityOn ? "画面稳定：开" : "画面稳定：关") : stabilityOn ? "Stability: ON" : "Stability: OFF"}
          </button>
        </div>

        <div style={styles.mediaHint}>
          {lang === "zh"
            ? "仅在提示词末尾追加“系统稳定规则”，不修改坐标/镜头/时间/风格。"
            : "Adds only end-of-prompt safeguards; never edits coords/camera/time/style."}
        </div>
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
    overflow: "auto"
  },

  section: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    padding: 10
  },

  sectionHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontWeight: 900, fontSize: 12, opacity: 0.92 },

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
  addRow: { display: "flex", alignItems: "center", gap: 10 },
  addLabel: { width: 56, fontSize: 11, opacity: 0.75, fontWeight: 900 },
  addInput: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 800
  },
  addInputSmall: {
    width: 92,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "right"
  },
  addActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
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
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(120,180,255,0.55)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 900
  },

  badgeBtn: {
    flex: "0 0 auto",
    fontSize: 11,
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
    fontSize: 11,
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
  formLabel: { width: 78, fontSize: 11, opacity: 0.75, fontWeight: 900 },
  select: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  }
};