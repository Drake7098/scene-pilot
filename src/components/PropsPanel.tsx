import React, { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Scene, Layer, LayerKF } from "../model";
import { ensureKF } from "../model";

type Props = {
  lang: Lang;
  scene: Scene;
  selectedLayerId: string | null;
  onUpdateScene: (s: Scene) => void;
  onRenameLayer: (oldId: string, newId: string) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
};

const BG_MARK = "bg:";

// ✅ 与 Stage.tsx 的扩展画布保持一致
const WORLD_MIN = -50;
const WORLD_MAX = 150;
const SIZE_MIN = 2;
const SIZE_MAX = 200;

function parseBg(notes: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(BG_MARK));
  if (!hit) return "";
  return hit.trim().slice(BG_MARK.length).trim();
}

function setBg(notes: string, bg: string): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(BG_MARK));
  const nextBg = bg.trim();
  if (nextBg.length) return [`${BG_MARK} ${nextBg}`, ...rest].join("\n");
  return rest.join("\n");
}

function isComposing(e: any) {
  return !!e?.nativeEvent?.isComposing;
}

function killFocus(e: React.FocusEvent<HTMLElement>) {
  (e.currentTarget as HTMLElement).blur();
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
function fmt1(v: number) {
  return Number.isFinite(v) ? String(round1(v).toFixed(1)) : "0.0";
}
function toNum1(s: string, fallback: number) {
  const n = Number(s);
  if (!Number.isFinite(n)) return fallback;
  return round1(n);
}

// ✅ 渲染用：只读不写（不创建 keyframe）
function getKFDisplay(layer: Layer, t: 0 | 1): LayerKF {
  const hit = layer.kf?.find((k) => k.t === t);
  if (hit) return hit;
  const base = layer.kf?.find((k) => k.t === 0) ?? layer.kf?.[0];
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

// ---------- Notes helpers ----------
function splitLines(notes: string): string[] {
  return (notes ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinLines(lines: string[]): string {
  return lines.join("\n");
}
function hasLine(lines: string[], line: string) {
  const norm = line.trim().toLowerCase();
  return lines.some((x) => x.trim().toLowerCase() === norm);
}
function addLine(lines: string[], line: string) {
  const v = line.trim();
  if (!v) return lines;
  if (hasLine(lines, v)) return lines;
  return [...lines, v];
}
function removeLine(lines: string[], line: string) {
  const norm = line.trim().toLowerCase();
  return lines.filter((x) => x.trim().toLowerCase() !== norm);
}

// ---------- UI helpers ----------
const CUSTOM = "__custom__";
const NOTES_PASTE = "__paste__";

function isCelestialHint(layerId: string) {
  const id = (layerId ?? "").toLowerCase();
  return id.includes("earth") || id.includes("moon") || id.includes("地球") || id.includes("月球");
}

// ---------- Type-aware presets (核心改动：避免冲突/歧义) ----------
type TypeKey =
  | ""
  | "station"
  | "spacecraft"
  | "planet"
  | "satellite"
  | "character"
  | "text"
  | "environment"
  | "custom";

function normalizeType(v: string): TypeKey {
  const x = (v ?? "").trim().toLowerCase();
  if (!x) return "";
  if (x === "station") return "station";
  if (x === "spacecraft") return "spacecraft";
  if (x === "planet") return "planet";
  if (x === "satellite") return "satellite";
  if (x === "character") return "character";
  if (x === "text") return "text";
  if (x === "environment") return "environment";
  return "custom";
}

function buildLookPresets(lang: Lang, typeKey: TypeKey) {
  const zh = lang === "zh";
  const base = [
    { value: "", label: zh ? "（未填）" : "(empty)" },
    // ✅ “极简”保留，但去掉 silhouette/outline-only 词，避免剪影误读
    { value: "minimal, clean design, readable form, keep internal details visible", label: zh ? "极简干净 / 结构可读（非剪影）" : "Minimal / readable form (not silhouette)" }
  ];

  const sciFiMetal = [
    { value: "metallic, detailed panels, cinematic", label: zh ? "金属细节 / 电影感" : "Metallic detail / cinematic" },
    { value: "photorealistic, hard sci-fi, high detail", label: zh ? "写实硬科幻 / 高细节" : "Photoreal hard-SF / high detail" },
    { value: "cyberpunk, neon accents, gritty", label: zh ? "赛博朋克 / 霓虹点缀" : "Cyberpunk / neon accents" },
    { value: "dark, mysterious, powerful", label: zh ? "暗黑神秘 / 强大感" : "Dark / mysterious / powerful" }
  ];

  const celestial = [
    { value: "photorealistic, atmospheric scattering, limb glow, high dynamic range", label: zh ? "写实天体 / 边缘辉光 HDR" : "Photoreal celestial / limb glow HDR" },
    { value: "cold tone, crisp terminator line, subtle haze", label: zh ? "冷色调 / 明确明暗交界" : "Cold tone / crisp terminator" }
  ];

  const character = [
    { value: "photorealistic, natural skin, detailed face, realistic proportions", label: zh ? "写实人物 / 自然皮肤" : "Photoreal character / natural skin" },
    { value: "cinematic portrait lighting, shallow depth of field, detailed eyes", label: zh ? "电影肖像光 / 浅景深" : "Cinematic portrait / shallow DOF" },
    { value: "stylized but grounded, clean design, consistent features", label: zh ? "风格化但可信 / 特征一致" : "Stylized but grounded / consistent features" }
  ];

  const env = [
    { value: "cinematic, volumetric light, rich atmosphere, film still", label: zh ? "电影感 / 体积光氛围" : "Cinematic / volumetric atmosphere" },
    { value: "documentary, natural light, realistic texture", label: zh ? "纪实自然光 / 真实纹理" : "Documentary natural / realistic texture" }
  ];

  const text = [
    { value: "clean typography, high legibility, minimal styling", label: zh ? "清晰排版 / 高可读" : "Clean typography / high legibility" }
  ];

  let typed: { value: string; label: string }[] = [];
  if (typeKey === "station" || typeKey === "spacecraft") typed = sciFiMetal;
  else if (typeKey === "planet" || typeKey === "satellite") typed = celestial;
  else if (typeKey === "character") typed = character;
  else if (typeKey === "environment") typed = env;
  else if (typeKey === "text") typed = text;
  else typed = [...sciFiMetal, ...celestial, ...character, ...env];

  return [
    ...base,
    ...typed,
    { value: CUSTOM, label: zh ? "自定义…" : "Custom…" }
  ];
}

function buildShapePresets(lang: Lang, typeKey: TypeKey) {
  const zh = lang === "zh";
  const base = [{ value: "", label: zh ? "（可不填）" : "(optional)" }];

  // ✅ 去掉 silhouette 词：shape 只描述几何/结构，不描述“轮廓化/剪影化”
  const stationShip = [
    { value: "ring station, modular segments, visible spokes", label: zh ? "环形空间站（模块化/辐条）" : "Ring station (modular / spokes)" },
    { value: "cylindrical habitat, layered decks, docking ports", label: zh ? "圆柱居住舱（分层甲板）" : "Cylindrical habitat (layered decks)" },
    { value: "long spacecraft hull, greebles, engine cluster", label: zh ? "长船体（细节结构/引擎组）" : "Long hull (greebles / engines)" }
  ];

  const celestial = [
    { value: "spherical planet, cloud layers, terminator line", label: zh ? "球形行星（云层/明暗界线）" : "Spherical planet (clouds / terminator)" },
    { value: "crescent moon, cratered surface, rough regolith", label: zh ? "弯月（陨石坑/粗糙月壤）" : "Crescent moon (cratered)" },
    { value: "partial limb in frame, curvature visible", label: zh ? "画面边缘弧面（只露一部分）" : "Partial limb in frame (curvature)" }
  ];

  const character = [
    { value: "humanoid full body, clear proportions, visible face", label: zh ? "人形全身（比例清晰/可见面部）" : "Humanoid full body (face visible)" },
    { value: "half body, shoulders and head, clear expression", label: zh ? "半身（肩部以上/表情清晰）" : "Half body (shoulders & head)" },
    { value: "creature anatomy, readable limbs, non-human traits", label: zh ? "生物体态（肢体清晰/非人特征）" : "Creature anatomy (readable limbs)" }
  ];

  const env = [
    { value: "industrial corridor, pipes, panels, depth layers", label: zh ? "工业走廊（管线/层次深度）" : "Industrial corridor (pipes / depth)" },
    { value: "rocky terrain, scattered debris, strong scale cues", label: zh ? "岩地/碎石（尺度线索）" : "Rocky terrain (scale cues)" }
  ];

  const text = [
    { value: "centered title block, safe margins, clean layout", label: zh ? "标题区块（安全边距/居中）" : "Title block (safe margins)" }
  ];

  let typed: { value: string; label: string }[] = [];
  if (typeKey === "station" || typeKey === "spacecraft") typed = stationShip;
  else if (typeKey === "planet" || typeKey === "satellite") typed = celestial;
  else if (typeKey === "character") typed = character;
  else if (typeKey === "environment") typed = env;
  else if (typeKey === "text") typed = text;
  else typed = [...stationShip, ...celestial, ...character, ...env];

  return [
    ...base,
    ...typed,
    { value: CUSTOM, label: zh ? "自定义…" : "Custom…" }
  ];
}

// ---------- “信息量开关”作为 notes 的高级选项（避免 look/shape 歧义） ----------
const VIS_PRESETS = [
  {
    key: "keep_details",
    line: "keep internal details visible, avoid silhouette, avoid pure outline",
    zh: "保留内部细节（避免剪影/纯轮廓）"
  },
  {
    key: "reduce_clutter",
    line: "simplify secondary details, keep main forms readable",
    zh: "减少杂乱细节（保留主体可读）"
  },
  {
    key: "silhouette_only",
    line: "silhouette only, outline-only, no internal details",
    zh: "⚠️ 仅剪影/轮廓（强烈不建议）"
  }
];

export function PropsPanel(props: Props) {
  const { lang, scene, selectedLayerId, onUpdateScene, onRenameLayer, editT, setEditT } = props;
  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);

  const layers = scene.layers ?? [];
  const layer = useMemo(() => layers.find((l) => l.id === selectedLayerId) ?? null, [layers, selectedLayerId]);

  // ✅ 新增：当前正在编辑的坐标字段（避免拖动时抢输入/覆盖草稿）
  const [activeKfField, setActiveKfField] = useState<string | null>(null);

  function patchLayer(patch: Partial<Layer>) {
    if (!layer) return;
    const nextLayers = (scene.layers ?? []).map((l) => (l.id === layer.id ? { ...l, ...patch } : l));
    onUpdateScene({ ...scene, layers: nextLayers });
  }

  // -------------------- BG preset + custom --------------------
  const bgValue = useMemo(() => parseBg(scene.notes ?? ""), [scene.notes]);

  const bgPresets = useMemo(
    () => [
      { value: "", label: lang === "zh" ? "（无）" : "(none)" },
      { value: "deep space, starfield", label: lang === "zh" ? "深空星海" : "Deep space starfield" },
      { value: "earth in frame, limb glow", label: lang === "zh" ? "地球边缘辉光" : "Earth limb glow" },
      { value: "moon distant, cold tone", label: lang === "zh" ? "远月冷色调" : "Distant moon, cold tone" },
      { value: "nebula, volumetric haze", label: lang === "zh" ? "星云体积雾" : "Nebula haze" },
      { value: "industrial interior, metallic", label: lang === "zh" ? "工业舱内金属" : "Industrial interior" },
      { value: CUSTOM, label: lang === "zh" ? "自定义…" : "Custom…" }
    ],
    [lang]
  );

  const [bgMode, setBgMode] = useState<string>(() => {
    if (!bgValue) return "";
    const inPreset = bgPresets.some((p) => p.value === bgValue);
    return inPreset ? bgValue : CUSTOM;
  });
  const [bgDraft, setBgDraft] = useState<string>(() => bgValue);

  React.useEffect(() => {
    const v = parseBg(scene.notes ?? "");
    const inPreset = bgPresets.some((p) => p.value === v);
    setBgMode(v ? (inPreset ? v : CUSTOM) : "");
    setBgDraft(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  function commitBg(nextBg: string) {
    const nextNotes = setBg(scene.notes ?? "", nextBg);
    onUpdateScene({ ...scene, notes: nextNotes });
  }

  // -------------------- layer id rename --------------------
  const [idEditing, setIdEditing] = useState(false);
  const [idDraft, setIdDraft] = useState("");

  React.useEffect(() => {
    setIdEditing(false);
    setIdDraft(layer?.id ?? "");
  }, [layer?.id]);

  function commitId() {
    if (!layer) return;
    const nextId = idDraft.trim();
    if (!nextId || nextId === layer.id) {
      setIdEditing(false);
      setIdDraft(layer.id);
      return;
    }
    const exists = (scene.layers ?? []).some((l) => l.id === nextId);
    if (exists) return;

    const nextLayers = (scene.layers ?? []).map((l) => (l.id === layer.id ? { ...l, id: nextId } : l));
    onUpdateScene({ ...scene, layers: nextLayers });
    onRenameLayer(layer.id, nextId);
    setIdEditing(false);
  }

  // -------------------- Type / Look / ShapeDesc: preset + custom --------------------
  const typePresets = useMemo(
    () => [
      { value: "station", label: lang === "zh" ? "空间站 / 基地" : "Station / Base" },
      { value: "spacecraft", label: lang === "zh" ? "飞船 / 舰艇" : "Spacecraft / Ship" },
      { value: "planet", label: lang === "zh" ? "行星" : "Planet" },
      { value: "satellite", label: lang === "zh" ? "卫星 / 月球" : "Satellite / Moon" },
      { value: "character", label: lang === "zh" ? "人物 / 生物" : "Character" },
      { value: "text", label: lang === "zh" ? "文字 / 标题" : "Text / Title" },
      { value: "environment", label: lang === "zh" ? "环境 / 场景元素" : "Environment element" },
      { value: CUSTOM, label: lang === "zh" ? "自定义…" : "Custom…" }
    ],
    [lang]
  );

  const typeKey = useMemo(() => normalizeType(layer?.type ?? ""), [layer?.type]);

  const lookPresets = useMemo(() => buildLookPresets(lang, typeKey), [lang, typeKey]);
  const shapePresets = useMemo(() => buildShapePresets(lang, typeKey), [lang, typeKey]);

  // mode + draft sync with selection changes
  const [typeMode, setTypeMode] = useState<string>("");
  const [typeDraft, setTypeDraft] = useState<string>("");

  const [lookMode, setLookMode] = useState<string>("");
  const [lookDraft, setLookDraft] = useState<string>("");

  const [shapeMode, setShapeMode] = useState<string>("");
  const [shapeDraft, setShapeDraft] = useState<string>("");

  React.useEffect(() => {
    if (!layer) return;

    const tv = (layer.type ?? "").trim();
    const lv = (layer.look ?? "").trim();
    const sv = (layer.shapeDesc ?? "").trim();

    const tIn = typePresets.some((p) => p.value === tv);
    setTypeMode(tv ? (tIn ? tv : CUSTOM) : "");
    setTypeDraft(tv);

    // look / shape 预设会随 typeKey 变化，所以这里用“当前 lookPresets / shapePresets”判断
    const lIn = lookPresets.some((p) => p.value === lv);
    setLookMode(lv ? (lIn ? lv : CUSTOM) : "");
    setLookDraft(lv);

    const sIn = shapePresets.some((p) => p.value === sv);
    setShapeMode(sv ? (sIn ? sv : CUSTOM) : "");
    setShapeDraft(sv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.id, scene.id, typeKey, lang]);

  function commitType(v: string) {
    patchLayer({ type: v.trim() });
  }
  function commitLook(v: string) {
    patchLayer({ look: v.trim() });
  }
  function commitShapeDesc(v: string) {
    patchLayer({ shapeDesc: v.trim() });
  }

  // -------------------- Notes elements --------------------
  type NotesMode = "" | "custom" | "paste";
  const [notesMode, setNotesMode] = useState<NotesMode>("");
  const [notesPick, setNotesPick] = useState<string>("");
  const [customNote, setCustomNote] = useState("");
  const [pasteBlock, setPasteBlock] = useState("");

  const notePresets = useMemo(() => {
    return [
      { key: "high_detail", line: "high detail, intricate textures", zh: "高细节、丰富纹理" },
      { key: "cinematic", line: "cinematic, film still, dramatic lighting", zh: "电影感、剧照质感、戏剧光" },
      { key: "sharp", line: "sharp focus, crisp edges", zh: "清晰锐利、焦点明确" },
      { key: "no_text", line: "no text, no watermark, no logo", zh: "无文字、无水印、无Logo" },
      { key: "clean_bg", line: "clean background, uncluttered", zh: "背景干净、不杂乱" },
      { key: "style_consistent", line: "consistent style across shots", zh: "风格一致（分镜统一）" }
    ];
  }, []);

  const currentNoteLines = useMemo(() => splitLines(layer?.notes ?? ""), [layer?.notes]);

  function togglePresetLine(line: string, on: boolean) {
    if (!layer) return;
    const lines = splitLines(layer.notes ?? "");
    const nextLines = on ? addLine(lines, line) : removeLine(lines, line);
    patchLayer({ notes: joinLines(nextLines) });
  }

  function applyCustomLine(line: string) {
    if (!layer) return;
    const v = line.trim();
    if (!v) return;
    const lines = splitLines(layer.notes ?? "");
    const nextLines = addLine(lines, v);
    patchLayer({ notes: joinLines(nextLines) });
  }

  function applyPasteBlock(block: string) {
    if (!layer) return;
    const raw = (block ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!raw.length) return;
    let lines = splitLines(layer.notes ?? "");
    for (const l of raw) lines = addLine(lines, l);
    patchLayer({ notes: joinLines(lines) });
  }

  // -------------------- Composition (t0/t1) --------------------
  const k0 = useMemo(() => (layer ? getKFDisplay(layer, 0) : null), [layer]);
  const k1 = useMemo(() => (layer ? getKFDisplay(layer, 1) : null), [layer]);

  const [draft0, setDraft0] = useState<Record<string, string>>({});
  const [draft1, setDraft1] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!layer || !k0 || !k1) {
      setDraft0({});
      setDraft1({});
      return;
    }
    if (activeKfField != null) return;

    setDraft0({ x: fmt1(k0.x), y: fmt1(k0.y), w: fmt1(k0.w), h: fmt1(k0.h), rot: fmt1(k0.rot || 0) });
    setDraft1({ x: fmt1(k1.x), y: fmt1(k1.y), w: fmt1(k1.w), h: fmt1(k1.h), rot: fmt1(k1.rot || 0) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layer?.id,
    scene.id,
    k0?.x,
    k0?.y,
    k0?.w,
    k0?.h,
    k0?.rot,
    k1?.x,
    k1?.y,
    k1?.w,
    k1?.h,
    k1?.rot,
    activeKfField
  ]);

  function patchKF(tVal: 0 | 1, patch: Partial<LayerKF>) {
    if (!layer) return;
    const next: Scene = JSON.parse(JSON.stringify(scene));
    const l = next.layers.find((x) => x.id === layer.id);
    if (!l) return;
    const k = ensureKF(l, tVal);
    Object.assign(k, patch);
    l.kf = l.kf.slice().sort((a, b) => a.t - b.t);
    onUpdateScene(next);
  }

  function commitKFField(tVal: 0 | 1, key: keyof LayerKF, valStr: string) {
    if (!layer) return;
    const base = tVal === 0 ? k0 : k1;
    if (!base) return;

    const fallback = (base as any)[key] ?? 0;
    let v = toNum1(valStr, fallback);

    if (key === "x" || key === "y") v = clamp(v, WORLD_MIN, WORLD_MAX);
    if (key === "w" || key === "h") v = clamp(v, SIZE_MIN, SIZE_MAX);
    if (key === "rot") v = clamp(v, -360, 360);

    patchKF(tVal, { [key]: v } as any);

    const next = fmt1(v);
    if (tVal === 0) setDraft0((d) => ({ ...d, [key]: next }));
    else setDraft1((d) => ({ ...d, [key]: next }));
  }

  // -------------------- Conflict warnings (软提示) --------------------
  const conflictHints = useMemo(() => {
    const hints: string[] = [];
    if (!layer) return hints;

    const tv = normalizeType(layer.type ?? "");
    const sv = (layer.shapeDesc ?? "").toLowerCase();
    const lv = (layer.look ?? "").toLowerCase();

    // 1) 天体 id 却设成 character
    if (isCelestialHint(layer.id) && tv === "character") {
      hints.push(lang === "zh" ? "⚠ 看起来是天体（地球/月球），建议 type 用 planet 或 satellite。" : "⚠ Looks like a celestial body; consider type = planet or satellite.");
    }

    // 2) character 却选了明显的 ship/station 形态
    if (tv === "character" && (sv.includes("hull") || sv.includes("ring station") || sv.includes("docking"))) {
      hints.push(lang === "zh" ? "⚠ 人物类型不建议选飞船/空间站形态（shape）。" : "⚠ Character type should not use ship/station shape.");
    }

    // 3) planet/satellite 却选 humanoid
    if ((tv === "planet" || tv === "satellite") && (sv.includes("humanoid") || sv.includes("body") || sv.includes("face"))) {
      hints.push(lang === "zh" ? "⚠ 天体类型不建议选人物体态（shape）。" : "⚠ Celestial type should not use humanoid shape.");
    }

    // 4) 仍然出现 silhouette 字样（来自自定义输入）
    if (lv.includes("silhouette") || sv.includes("silhouette") || lv.includes("outline-only") || sv.includes("outline-only")) {
      hints.push(lang === "zh" ? "⚠ 你输入了 silhouette/outline-only，模型可能直接画成剪影。" : "⚠ silhouette/outline-only may produce a pure silhouette.");
    }

    return hints;
  }, [layer, lang]);

  return (
    <div style={styles.wrap}>
      {/* Scene Background */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>{lang === "zh" ? "分镜背景" : "Scene Background"}</div>

        <div style={styles.row}>
          <div style={styles.label}>{lang === "zh" ? "预设" : "Preset"}</div>
          <select
            value={bgMode}
            onChange={(e) => {
              const v = e.target.value;
              setBgMode(v);

              if (v === CUSTOM) {
                const cur = parseBg(scene.notes ?? "");
                setBgDraft(cur);
                return;
              }

              const presetValue = v === "" ? "" : v;
              setBgDraft(presetValue);
              commitBg(presetValue);
            }}
            style={styles.select}
          >
            {bgPresets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {bgMode === CUSTOM && (
          <div style={styles.row}>
            <div style={styles.label}>{lang === "zh" ? "自定义" : "Custom"}</div>
            <input
              value={bgDraft}
              onChange={(e) => setBgDraft(e.target.value)}
              onKeyDown={(e) => {
                if (isComposing(e)) return;
                if (e.key === "Enter") commitBg(bgDraft);
                if (e.key === "Escape") setBgDraft(parseBg(scene.notes ?? ""));
              }}
              onBlur={() => commitBg(bgDraft)}
              placeholder={lang === "zh" ? "输入背景描述（中英文都可以）" : "Describe the background..."}
              style={styles.input}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Object Properties */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>{tt("props.title")}</div>

        {!layer ? (
          <div style={styles.miniHint}>{tt("props.noSelection")}</div>
        ) : (
          <>
            <div style={styles.row}>
              <div style={styles.label}>{tt("props.id")}</div>
              {idEditing ? (
                <input
                  autoFocus
                  value={idDraft}
                  onChange={(e) => setIdDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (isComposing(e)) return;
                    if (e.key === "Enter") commitId();
                    if (e.key === "Escape") {
                      setIdEditing(false);
                      setIdDraft(layer.id);
                    }
                  }}
                  onBlur={commitId}
                  style={styles.input}
                  autoComplete="off"
                  spellCheck={false}
                />
              ) : (
                <div
                  style={styles.clickablePill}
                  title={lang === "zh" ? "点击改名" : "Click to rename"}
                  onClick={() => {
                    setIdEditing(true);
                    setIdDraft(layer.id);
                  }}
                >
                  {layer.id}
                </div>
              )}
            </div>

            {/* Type */}
            <div style={styles.row}>
              <div style={styles.label}>{tt("props.type")}</div>
              <select
                value={typeMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setTypeMode(v);

                  if (v === CUSTOM) {
                    setTypeDraft((layer.type ?? "").trim());
                    return;
                  }

                  setTypeDraft(v);
                  commitType(v);
                }}
                style={styles.select}
              >
                <option value="">{lang === "zh" ? "（未填）" : "(empty)"}</option>
                {typePresets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {typeMode === CUSTOM && (
              <div style={styles.row}>
                <div style={styles.label}>{lang === "zh" ? "自定义" : "Custom"}</div>
                <input
                  value={typeDraft}
                  onChange={(e) => setTypeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (isComposing(e)) return;
                    if (e.key === "Enter") commitType(typeDraft);
                    if (e.key === "Escape") setTypeDraft(layer.type ?? "");
                  }}
                  onBlur={() => commitType(typeDraft)}
                  placeholder={lang === "zh" ? "例如：planet / satellite / station…" : "e.g. planet / satellite / station…"}
                  style={styles.input}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Look */}
            <div style={styles.row}>
              <div style={styles.label}>{lang === "zh" ? "外观（风格/材质）" : "Look (style/material)"}</div>
              <select
                value={lookMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setLookMode(v);

                  if (v === CUSTOM) {
                    setLookDraft((layer.look ?? "").trim());
                    return;
                  }

                  setLookDraft(v);
                  commitLook(v);
                }}
                style={styles.select}
              >
                {lookPresets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {lookMode === CUSTOM && (
              <div style={styles.row}>
                <div style={styles.label}>{lang === "zh" ? "自定义" : "Custom"}</div>
                <input
                  value={lookDraft}
                  onChange={(e) => setLookDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (isComposing(e)) return;
                    if (e.key === "Enter") commitLook(lookDraft);
                    if (e.key === "Escape") setLookDraft(layer.look ?? "");
                  }}
                  onBlur={() => commitLook(lookDraft)}
                  placeholder={lang === "zh" ? "材质/风格/氛围…" : "material / style / mood…"}
                  style={styles.input}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            {/* ShapeDesc */}
            <div style={styles.row}>
              <div style={styles.label}>{lang === "zh" ? "形态（几何/结构）" : "Form (geometry/structure)"}</div>
              <select
                value={shapeMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setShapeMode(v);

                  if (v === CUSTOM) {
                    setShapeDraft((layer.shapeDesc ?? "").trim());
                    return;
                  }

                  setShapeDraft(v);
                  commitShapeDesc(v);
                }}
                style={styles.select}
              >
                {shapePresets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {shapeMode === CUSTOM && (
              <div style={styles.row}>
                <div style={styles.label}>{lang === "zh" ? "自定义" : "Custom"}</div>
                <input
                  value={shapeDraft}
                  onChange={(e) => setShapeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (isComposing(e)) return;
                    if (e.key === "Enter") commitShapeDesc(shapeDraft);
                    if (e.key === "Escape") setShapeDraft(layer.shapeDesc ?? "");
                  }}
                  onBlur={() => commitShapeDesc(shapeDraft)}
                  placeholder={lang === "zh" ? "只写几何结构：环形/球形/长船体…" : "geometry only: ring/sphere/long hull…"}
                  style={styles.input}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Advanced: visibility/detail toggles -> notes */}
            <div style={styles.notesHeadRow}>
              <div style={styles.label}>{lang === "zh" ? "信息量" : "Visibility"}</div>
              <div style={{ flex: 1 }} />
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  (e.target as HTMLSelectElement).value = "";
                  if (!v) return;
                  const exists = hasLine(currentNoteLines, v);
                  togglePresetLine(v, !exists);
                }}
                style={styles.select}
                title={lang === "zh" ? "控制“是否剪影/是否保留细节”" : "Control silhouette/details"}
              >
                <option value="">{lang === "zh" ? "选择…" : "Pick…"}</option>
                {VIS_PRESETS.map((p) => {
                  const checked = hasLine(currentNoteLines, p.line);
                  const label = lang === "zh" ? p.zh : p.line;
                  return (
                    <option key={p.key} value={p.line}>
                      {checked ? "✓ " : ""}
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {conflictHints.length > 0 && (
              <div style={styles.warnHint}>
                {conflictHints.map((x, i) => (
                  <div key={i}>{x}</div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div style={styles.notesHeadRow}>
              <div style={styles.label}>{tt("props.notes")}</div>
              <div style={{ flex: 1 }} />

              <select
                value={notesPick}
                onChange={(e) => {
                  const v = e.target.value;
                  setNotesPick("");
                  if (!v) return;

                  if (v === CUSTOM) {
                    setNotesMode("custom");
                    setCustomNote("");
                    return;
                  }
                  if (v === NOTES_PASTE) {
                    setNotesMode("paste");
                    setPasteBlock("");
                    return;
                  }

                  const exists = hasLine(currentNoteLines, v);
                  togglePresetLine(v, !exists);
                }}
                style={styles.select}
                title={lang === "zh" ? "选择要素：点击即添加/移除" : "Pick an element: click to toggle"}
              >
                <option value="">{lang === "zh" ? "选择要素…" : "Pick elements…"}</option>

                {notePresets.map((p) => {
                  const checked = hasLine(currentNoteLines, p.line);
                  const label = lang === "zh" ? p.zh : p.line;
                  return (
                    <option key={p.key} value={p.line}>
                      {checked ? "✓ " : ""}
                      {label}
                    </option>
                  );
                })}

                <option disabled value="__sep__">
                  ──────────
                </option>
                <option value={CUSTOM}>{lang === "zh" ? "自定义…" : "Custom…"}</option>
                <option value={NOTES_PASTE}>{lang === "zh" ? "粘贴多行…" : "Paste multi-lines…"}</option>
              </select>
            </div>

            {notesMode === "custom" && (
              <div style={styles.notesMenu}>
                <div style={styles.notesMenuTitle}>{lang === "zh" ? "自定义要素" : "Custom element"}</div>

                <div style={styles.row}>
                  <div style={styles.smallLabel}>{lang === "zh" ? "内容" : "Line"}</div>
                  <input
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (isComposing(e)) return;
                      if (e.key === "Enter") {
                        applyCustomLine(customNote);
                        setCustomNote("");
                      }
                      if (e.key === "Escape") {
                        setNotesMode("");
                        setCustomNote("");
                      }
                    }}
                    placeholder={lang === "zh" ? "回车添加一条…" : "Press Enter to add…"}
                    style={styles.smallInput}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    style={styles.smallBtn}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyCustomLine(customNote);
                      setCustomNote("");
                    }}
                  >
                    {lang === "zh" ? "添加" : "Add"}
                  </button>
                  <button
                    type="button"
                    style={styles.smallBtnGhost}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNotesMode("");
                      setCustomNote("");
                    }}
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </div>
            )}

            {notesMode === "paste" && (
              <div style={styles.notesMenu}>
                <div style={styles.notesMenuTitle}>{lang === "zh" ? "粘贴多行要素" : "Paste multi-lines"}</div>

                <div style={styles.rowTop}>
                  <div style={styles.smallLabel}>{lang === "zh" ? "粘贴" : "Paste"}</div>
                  <textarea
                    value={pasteBlock}
                    onChange={(e) => setPasteBlock(e.target.value)}
                    placeholder={lang === "zh" ? "每行一条；应用后会写入备注" : "One per line; Apply will append into notes"}
                    style={styles.pasteArea}
                    spellCheck={false}
                  />
                </div>

                <div style={styles.menuBtns}>
                  <button
                    type="button"
                    style={styles.smallBtn}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyPasteBlock(pasteBlock);
                      setPasteBlock("");
                    }}
                  >
                    {lang === "zh" ? "应用" : "Apply"}
                  </button>
                  <button
                    type="button"
                    style={styles.smallBtnGhost}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNotesMode("");
                      setPasteBlock("");
                    }}
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </div>
            )}

            <div style={styles.rowTop}>
              <div style={{ width: 82 }} />
              <textarea
                value={layer.notes ?? ""}
                onChange={(e) => patchLayer({ notes: e.target.value })}
                placeholder={
                  lang === "zh"
                    ? "不要什么 / 必须有什么 / 动作 / 情绪 / 限制…（可在上方下拉“要素”里点选）"
                    : "constraints / actions / mood / must-have / avoid... (use elements dropdown above)"
                }
                style={styles.textarea}
                spellCheck={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Composition + Trajectory buttons */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>{lang === "zh" ? "构图（起点/终点）" : "Composition (Start / End)"}</div>

        {!layer || !k0 || !k1 ? (
          <div style={styles.miniHint}>{lang === "zh" ? "先选择一个对象" : "Select an object first"}</div>
        ) : (
          <>
            <div style={styles.row}>
              <div style={styles.label}>{lang === "zh" ? "轨迹" : "Path"}</div>
              <div style={styles.btnRow}>
                <button
                  type="button"
                  tabIndex={-1}
                  onFocus={killFocus}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ ...styles.pillBtn, ...(editT === 0 ? styles.pillBtnOn : {}) }}
                  onClick={() => setEditT(0)}
                >
                  {lang === "zh" ? "编辑起点" : "Edit Start"}
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onFocus={killFocus}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ ...styles.pillBtn, ...(editT === 1 ? styles.pillBtnOn : {}) }}
                  onClick={() => setEditT(1)}
                >
                  {lang === "zh" ? "编辑终点" : "Edit End"}
                </button>
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.subCard}>
                <div style={styles.subTitle}>{lang === "zh" ? "起点 t=0" : "Start t=0"}</div>
                <KRow tVal={0} label="x" v={draft0.x ?? fmt1(k0.x)} onCh={(v) => setDraft0((d) => ({ ...d, x: v }))} onCm={(v) => commitKFField(0, "x", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={0} label="y" v={draft0.y ?? fmt1(k0.y)} onCh={(v) => setDraft0((d) => ({ ...d, y: v }))} onCm={(v) => commitKFField(0, "y", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={0} label="w" v={draft0.w ?? fmt1(k0.w)} onCh={(v) => setDraft0((d) => ({ ...d, w: v }))} onCm={(v) => commitKFField(0, "w", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={0} label="h" v={draft0.h ?? fmt1(k0.h)} onCh={(v) => setDraft0((d) => ({ ...d, h: v }))} onCm={(v) => commitKFField(0, "h", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={0} label="rot" v={draft0.rot ?? fmt1(k0.rot || 0)} onCh={(v) => setDraft0((d) => ({ ...d, rot: v }))} onCm={(v) => commitKFField(0, "rot", v)} setActiveKfField={setActiveKfField} />
              </div>

              <div style={styles.subCard}>
                <div style={styles.subTitle}>{lang === "zh" ? "终点 t=1" : "End t=1"}</div>
                <KRow tVal={1} label="x" v={draft1.x ?? fmt1(k1.x)} onCh={(v) => setDraft1((d) => ({ ...d, x: v }))} onCm={(v) => commitKFField(1, "x", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={1} label="y" v={draft1.y ?? fmt1(k1.y)} onCh={(v) => setDraft1((d) => ({ ...d, y: v }))} onCm={(v) => commitKFField(1, "y", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={1} label="w" v={draft1.w ?? fmt1(k1.w)} onCh={(v) => setDraft1((d) => ({ ...d, w: v }))} onCm={(v) => commitKFField(1, "w", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={1} label="h" v={draft1.h ?? fmt1(k1.h)} onCh={(v) => setDraft1((d) => ({ ...d, h: v }))} onCm={(v) => commitKFField(1, "h", v)} setActiveKfField={setActiveKfField} />
                <KRow tVal={1} label="rot" v={draft1.rot ?? fmt1(k1.rot || 0)} onCh={(v) => setDraft1((d) => ({ ...d, rot: v }))} onCm={(v) => commitKFField(1, "rot", v)} setActiveKfField={setActiveKfField} />
              </div>
            </div>

            <div style={styles.miniHint}>
              {lang === "zh"
                ? "提示：点“编辑起点/终点”后，去画布拖拽/缩放就是在改对应关键帧；数值保留 1 位小数。"
                : "Tip: after choosing Edit Start/End, dragging/resizing on stage edits that keyframe; values are 1-decimal."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KRow({
  tVal,
  label,
  v,
  onCh,
  onCm,
  setActiveKfField
}: {
  tVal: 0 | 1;
  label: "x" | "y" | "w" | "h" | "rot";
  v: string;
  onCh: (v: string) => void;
  onCm: (v: string) => void;
  setActiveKfField: (k: string | null) => void;
}) {
  return (
    <div style={styles.kfRow}>
      <div style={styles.kfLabel}>{label}</div>
      <input
        value={v}
        onChange={(e) => onCh(e.target.value)}
        onFocus={() => setActiveKfField(`${tVal}:${label}`)}
        onKeyDown={(e) => {
          if (isComposing(e)) return;
          if (e.key === "Enter") onCm((e.target as HTMLInputElement).value);
          if (e.key === "Escape") (e.target as HTMLInputElement).blur();
        }}
        onBlur={(e) => {
          setActiveKfField(null);
          onCm(e.target.value);
        }}
        style={styles.kfInput}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 360,
    minWidth: 320,
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.12)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
    overflow: "auto"
  },

  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    padding: 10
  },

  cardTitle: { fontWeight: 900, fontSize: 12, opacity: 0.92, marginBottom: 8 },

  row: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  rowTop: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 },

  label: { width: 82, fontSize: 11, opacity: 0.75, fontWeight: 900 },

  select: {
    flex: 1,
    maxWidth: 220,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  },

  input: {
    flex: 1,
    maxWidth: 220,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  },

  clickablePill: {
    flex: 1,
    maxWidth: 220,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    userSelect: "none"
  },

  warnHint: {
    marginTop: -2,
    marginBottom: 8,
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 1.35
  },

  textarea: {
    flex: 1,
    minHeight: 88,
    resize: "vertical",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.35
  },

  miniHint: { fontSize: 11, opacity: 0.65, lineHeight: 1.4, marginTop: 4 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  subCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    background: "rgba(0,0,0,0.16)",
    padding: 10
  },

  subTitle: { fontWeight: 900, fontSize: 12, opacity: 0.92, marginBottom: 8 },

  kfRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  kfLabel: { width: 36, fontSize: 11, opacity: 0.75, fontWeight: 900 },

  kfInput: {
    width: 96,
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  },

  btnRow: { display: "flex", gap: 8, alignItems: "center" },

  pillBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.18)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    userSelect: "none",
    outline: "none",
    boxShadow: "none"
  },
  pillBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
  },

  // ---- notes panel ----
  notesHeadRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 8 },

  notesMenu: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    marginBottom: 10
  },
  notesMenuTitle: { fontWeight: 900, fontSize: 12, opacity: 0.92, marginBottom: 8 },

  smallLabel: { width: 54, fontSize: 11, opacity: 0.75, fontWeight: 900 },

  smallInput: {
    flex: 1,
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  },

  smallBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(120,180,255,0.35)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  smallBtnGhost: {
    height: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },

  pasteArea: {
    flex: 1,
    minHeight: 68,
    resize: "vertical",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.35
  },

  menuBtns: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }
};