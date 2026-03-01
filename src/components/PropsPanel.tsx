import React, { useMemo, useRef, useState } from "react";
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

type MediaMode = "image" | "video";
function parseMediaModeFromNotes(notes: string | undefined | null): MediaMode {
  const lines = (notes ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const keys = ["media:", "mode:", "type:"];
  for (const l of lines) {
    for (const k of keys) {
      if (l.startsWith(k)) {
        const v = l.slice(k.length).trim();
        if (v.startsWith("image") || v.startsWith("img") || v.includes("图片")) return "image";
        if (v.startsWith("video") || v.startsWith("vid") || v.includes("视频")) return "video";
      }
    }
  }
  // 默认：视频（兼容旧数据）
  return "video";
}

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
const GLOBAL_SCOPE_PATTERNS: Array<{ re: RegExp; tag: string }> = [
  { re: /\b(camera|lens|shot|framing|composition|global)\b/i, tag: "camera/global" },
  { re: /\b(add|insert|extra|new)\s+(person|people|character|object|subject)s?\b/i, tag: "add-object" },
  { re: /\b(all objects|all subjects|entire scene|whole scene|full frame)\b/i, tag: "whole-scene" },
  { re: /\b(style of all|global style|unified style|overall style)\b/i, tag: "global-style" },
  { re: /(镜头|全局|整幅|全画面|全场景|新增人物|新增对象|统一风格)/, tag: "全局词" }
];

function isCelestialHint(layerId: string) {
  const id = (layerId ?? "").toLowerCase();
  return id.includes("earth") || id.includes("moon") || id.includes("地球") || id.includes("月球");
}

function detectGlobalScopeTags(text: string): string[] {
  const s = (text ?? "").trim();
  if (!s) return [];
  const hit = new Set<string>();
  for (const rule of GLOBAL_SCOPE_PATTERNS) {
    if (rule.re.test(s)) hit.add(rule.tag);
  }
  return Array.from(hit);
}

function extractTaggedValue(text: string, keys: string[]): string {
  const lines = (text ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const line of lines) {
    for (const k of keys) {
      const re = new RegExp(`^${k}\\s*[:：]\\s*(.+)$`, "i");
      const m = line.match(re);
      if (m?.[1]) return m[1].trim();
    }
  }
  return "";
}

function replaceTaggedLines(base: string, nextTaggedLines: string[]): string {
  const lines = (base ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const drop = /^(material|材质|local_action|action|局部动作|local_avoid|avoid|局部禁令)\s*[:：]/i;
  const kept = lines.filter((l) => !drop.test(l));
  const next = [...kept, ...nextTaggedLines].filter(Boolean);
  return next.join("\n");
}

function buildTemplateTaggedLines(
  lang: Lang,
  localMaterial: string,
  localAction: string,
  localAvoid: string
): string[] {
  const lines: string[] = [];
  if (localMaterial.trim()) lines.push(lang === "zh" ? `材质: ${localMaterial.trim()}` : `Material: ${localMaterial.trim()}`);
  if (localAction.trim()) lines.push(lang === "zh" ? `局部动作: ${localAction.trim()}` : `Local_Action: ${localAction.trim()}`);
  if (localAvoid.trim()) lines.push(lang === "zh" ? `局部禁令: ${localAvoid.trim()}` : `Local_Avoid: ${localAvoid.trim()}`);
  return lines;
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
    {
      value: "minimal, clean design, readable form, keep internal details visible",
      label: zh ? "极简干净 / 结构可读（非剪影）" : "Minimal / readable form (not silhouette)"
    }
  ];

  const sciFiMetal = [
    {
      value: "metallic materials, brushed panels, industrial wear, realistic reflections",
      label: zh ? "金属工业质感（拉丝面板/真实反射）" : "Metal-industrial (brushed panels / realistic reflections)"
    },
    {
      value: "photoreal hard sci-fi, physically based materials, dense micro details",
      label: zh ? "写实硬科幻（PBR 材质/微细节）" : "Photoreal hard-SF (PBR materials / micro detail)"
    },
    {
      value: "cyberpunk style, neon accents, wet surfaces, gritty texture",
      label: zh ? "赛博霓虹（潮湿表面/粗粝纹理）" : "Cyberpunk neon (wet surfaces / gritty texture)"
    },
    {
      value: "low-key dramatic lighting, deep contrast, powerful mood, visible details",
      label: zh ? "低调戏剧光（高反差但保留细节）" : "Low-key dramatic (high contrast with detail)"
    }
  ];

  const celestial = [
    {
      value: "photoreal celestial body, atmospheric scattering, limb glow, high dynamic range",
      label: zh ? "写实天体（大气散射/边缘辉光）" : "Photoreal celestial (scattering / limb glow)"
    },
    {
      value: "cold color temperature, crisp terminator boundary, subtle space haze",
      label: zh ? "冷色天体（清晰明暗界线）" : "Cold celestial (crisp terminator boundary)"
    }
  ];

  const character = [
    {
      value: "photoreal character, natural skin texture, realistic anatomy and proportions",
      label: zh ? "写实人物（自然皮肤/真实比例）" : "Photoreal character (natural skin / real proportions)"
    },
    {
      value: "cinematic portrait lighting, shallow depth of field, detailed eyes and facial micro details",
      label: zh ? "电影肖像（浅景深/面部微细节）" : "Cinematic portrait (shallow DOF / facial micro detail)"
    },
    {
      value: "stylized realism, clean design language, consistent identity features",
      label: zh ? "风格化写实（人设特征一致）" : "Stylized realism (consistent identity features)"
    }
  ];

  const env = [
    {
      value: "cinematic environment, volumetric lighting, layered atmosphere, film-still style",
      label: zh ? "电影环境（体积光/层次氛围）" : "Cinematic environment (volumetric / layered atmosphere)"
    },
    {
      value: "documentary natural lighting, realistic materials, physically plausible textures",
      label: zh ? "纪实环境（自然光/真实材质）" : "Documentary environment (natural light / real materials)"
    }
  ];

  const text = [
    {
      value: "clean typography, strong hierarchy, high legibility, minimal decoration",
      label: zh ? "文字排版（层级清晰/高可读）" : "Typography (clear hierarchy / high legibility)"
    }
  ];

  let typed: { value: string; label: string }[] = [];
  if (typeKey === "station" || typeKey === "spacecraft") typed = sciFiMetal;
  else if (typeKey === "planet" || typeKey === "satellite") typed = celestial;
  else if (typeKey === "character") typed = character;
  else if (typeKey === "environment") typed = env;
  else if (typeKey === "text") typed = text;
  else typed = [...sciFiMetal, ...celestial, ...character, ...env];

  return [...base, ...typed, { value: CUSTOM, label: zh ? "自定义…" : "Custom…" }];
}

function buildShapePresets(lang: Lang, typeKey: TypeKey) {
  const zh = lang === "zh";
  const base = [{ value: "", label: zh ? "（可不填）" : "(optional)" }];

  // ✅ 去掉 silhouette 词：shape 只描述几何/结构，不描述“轮廓化/剪影化”
  const stationShip = [
    {
      value: "ring station geometry, modular segments, clear spoke structure",
      label: zh ? "环形结构（模块分段/辐条清晰）" : "Ring structure (modular segments / clear spokes)"
    },
    {
      value: "cylindrical habitat shape, layered decks, visible docking interfaces",
      label: zh ? "圆柱结构（分层甲板/对接口）" : "Cylindrical structure (layered decks / docking ports)"
    },
    {
      value: "elongated spacecraft hull silhouette, surface greebles, rear engine cluster",
      label: zh ? "长船体轮廓（表面细节/尾部引擎组）" : "Long-hull silhouette (surface greebles / rear engines)"
    }
  ];

  const celestial = [
    {
      value: "spherical body shape, cloud bands, visible terminator boundary",
      label: zh ? "球体天体（云层带/明暗边界）" : "Spherical body (cloud bands / terminator boundary)"
    },
    {
      value: "crescent body silhouette, cratered surface, rough regolith texture",
      label: zh ? "弯月轮廓（陨坑表面/粗糙纹理）" : "Crescent body (cratered surface / rough texture)"
    },
    {
      value: "partial planetary limb in frame, strong curvature cue",
      label: zh ? "局部弧面入镜（强曲率线索）" : "Partial limb in frame (strong curvature cue)"
    }
  ];

  const character = [
    {
      value: "humanoid full-body framing, clear body proportions, visible face region",
      label: zh ? "人形全身构图（比例明确/面部可见）" : "Humanoid full-body framing (clear proportions)"
    },
    {
      value: "half-body framing, shoulders and head emphasized, readable expression",
      label: zh ? "半身构图（肩颈到头部/表情可读）" : "Half-body framing (shoulders + head)"
    },
    {
      value: "creature body plan, readable limbs and joints, non-human morphology",
      label: zh ? "生物体型（肢体关节清晰/非人形）" : "Creature anatomy (readable limbs / non-human)"
    }
  ];

  const env = [
    {
      value: "industrial corridor structure, pipe networks, panel modules, depth layering",
      label: zh ? "工业走廊结构（管网/面板模块/纵深）" : "Industrial corridor (pipe network / panel modules)"
    },
    {
      value: "rocky terrain shape, scattered debris clusters, strong scale reference cues",
      label: zh ? "岩地结构（碎石簇/尺度参照）" : "Rocky terrain (debris clusters / scale cues)"
    }
  ];

  const text = [
    {
      value: "title block layout, centered alignment, safe margins, clean composition",
      label: zh ? "标题版式（居中对齐/安全边距）" : "Title layout (centered / safe margins)"
    }
  ];

  let typed: { value: string; label: string }[] = [];
  if (typeKey === "station" || typeKey === "spacecraft") typed = stationShip;
  else if (typeKey === "planet" || typeKey === "satellite") typed = celestial;
  else if (typeKey === "character") typed = character;
  else if (typeKey === "environment") typed = env;
  else if (typeKey === "text") typed = text;
  else typed = [...stationShip, ...celestial, ...character, ...env];

  return [...base, ...typed, { value: CUSTOM, label: zh ? "自定义…" : "Custom…" }];
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

  const mediaMode: MediaMode = useMemo(() => parseMediaModeFromNotes(scene?.notes), [scene?.notes]);
  const isImageMode = mediaMode === "image";

  // ✅ 图片模式强制回到 t0（避免“图片模式却在编辑终点”的矛盾状态）
  React.useEffect(() => {
    if (!isImageMode) return;
    if (editT === 1) setEditT(0);
  }, [isImageMode, editT, setEditT]);

  const layers = useMemo(() => scene.layers ?? [], [scene.layers]);
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
      // common/high-frequency first
      { value: "plain white seamless backdrop, studio soft light", label: lang === "zh" ? "白底棚拍（柔光无缝背景）" : "White seamless studio backdrop" },
      { value: "plain black seamless backdrop, controlled rim light", label: lang === "zh" ? "黑底棚拍（轮廓光）" : "Black seamless studio backdrop" },
      { value: "neutral gray studio backdrop, balanced soft lighting", label: lang === "zh" ? "灰底棚拍（均匀柔光）" : "Gray studio backdrop" },
      { value: "modern indoor living room, natural window light", label: lang === "zh" ? "现代客厅（自然窗光）" : "Modern living room (natural window light)" },
      { value: "minimal office interior, clean daylight, tidy desk area", label: lang === "zh" ? "简洁办公室（日光）" : "Minimal office interior (daylight)" },
      { value: "city street at night, neon signs, wet pavement reflections", label: lang === "zh" ? "夜晚城市街道（霓虹反射）" : "City street at night (neon reflections)" },
      { value: "urban rooftop skyline at dusk, cinematic atmosphere", label: lang === "zh" ? "黄昏城市天台（天际线）" : "Urban rooftop skyline at dusk" },
      { value: "industrial interior, metallic structures, depth layers", label: lang === "zh" ? "工业舱内（金属结构）" : "Industrial interior (metal structures)" },
      { value: "clean futuristic corridor, sci-fi lighting accents", label: lang === "zh" ? "未来科幻走廊（冷色灯带）" : "Futuristic corridor (sci-fi accents)" },
      { value: "forest clearing, soft volumetric sunlight, natural haze", label: lang === "zh" ? "森林空地（体积阳光）" : "Forest clearing (volumetric sunlight)" },
      { value: "mountain valley, distant peaks, crisp atmosphere", label: lang === "zh" ? "山谷远山（空气通透）" : "Mountain valley (distant peaks)" },
      { value: "desert dunes, warm tone, long shadows", label: lang === "zh" ? "沙漠沙丘（暖色长阴影）" : "Desert dunes (warm long shadows)" },
      { value: "coastal beach, open sky, soft sea haze", label: lang === "zh" ? "海岸沙滩（开阔天空）" : "Coastal beach (open sky)" },
      { value: "snow field landscape, high albedo, cold atmosphere", label: lang === "zh" ? "雪地场景（冷色高反照）" : "Snow field landscape (cold high albedo)" },
      { value: "deep space, dense starfield", label: lang === "zh" ? "深空（密集星场）" : "Deep space (dense starfield)" },
      { value: "earth limb in frame, atmospheric glow", label: lang === "zh" ? "地球弧面（大气辉光）" : "Earth limb (atmospheric glow)" },
      { value: "distant moon, cold tone", label: lang === "zh" ? "远月背景（冷色调）" : "Distant moon (cold tone)" },
      { value: "nebula clouds, volumetric cosmic haze", label: lang === "zh" ? "星云背景（体积雾）" : "Nebula background (volumetric haze)" },
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
    { value: "station", label: lang === "zh" ? "空间站（大型人造结构）" : "Station (large artificial structure)" },
    { value: "spacecraft", label: lang === "zh" ? "飞船（可移动载具）" : "Spacecraft (mobile vehicle)" },
    { value: "planet", label: lang === "zh" ? "行星（自然天体）" : "Planet (natural celestial body)" },
    { value: "satellite", label: lang === "zh" ? "卫星（月球/人造卫星）" : "Satellite (moon / artificial satellite)" },
    { value: "character", label: lang === "zh" ? "人物（人形主体）" : "Character (humanoid subject)" },
    { value: "text", label: lang === "zh" ? "文字（排版元素）" : "Text (typography element)" },
    { value: "environment", label: lang === "zh" ? "环境（场景主体）" : "Environment (scene-level subject)" },
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
  const [externalDraft, setExternalDraft] = useState<string>("");
  const [refsDraft, setRefsDraft] = useState<string>("");
  const [localPromptToast, setLocalPromptToast] = useState<string>("");
  const [localMaterial, setLocalMaterial] = useState<string>("");
  const [localAction, setLocalAction] = useState<string>("");
  const [localAvoid, setLocalAvoid] = useState<string>("");
  const localSyncPauseRef = useRef(false);

  React.useEffect(() => {
    if (!layer) return;
    localSyncPauseRef.current = true;

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
    const localPrompt = layer.externalPrompt ?? "";
    setExternalDraft(localPrompt);
    setRefsDraft(layer.referenceLinks ?? "");
    setLocalMaterial(extractTaggedValue(localPrompt, ["material", "材质"]));
    setLocalAction(extractTaggedValue(localPrompt, ["local_action", "action", "局部动作"]));
    setLocalAvoid(extractTaggedValue(localPrompt, ["local_avoid", "avoid", "局部禁令"]));
    queueMicrotask(() => {
      localSyncPauseRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.id, scene.id, typeKey, lang]);

  React.useEffect(() => {
    if (!localPromptToast) return;
    const timer = window.setTimeout(() => setLocalPromptToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [localPromptToast]);

  function commitType(v: string) {
    patchLayer({ type: v.trim() });
  }
  function commitLook(v: string) {
    patchLayer({ look: v.trim() });
  }
  function commitShapeDesc(v: string) {
    patchLayer({ shapeDesc: v.trim() });
  }
  function commitExternalPrompt(v: string) {
    patchLayer({ externalPrompt: v });
    const tags = detectGlobalScopeTags(v);
    if (!tags.length) return;
    setLocalPromptToast(tt("props.localPromptGlobalHint").replace("{tags}", tags.join(", ")));
  }
  React.useEffect(() => {
    if (!layer) return;
    if (localSyncPauseRef.current) return;
    const tagged = buildTemplateTaggedLines(lang, localMaterial, localAction, localAvoid);
    const next = replaceTaggedLines(externalDraft, tagged);
    if (next === externalDraft) return;
    setExternalDraft(next);
    commitExternalPrompt(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMaterial, localAction, localAvoid, lang, layer?.id]);

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
    if (isImageMode && tVal === 1) return; // ✅ 图片模式锁死 t1（数据保留，但不允许改）
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
    if (isImageMode && tVal === 1) return; // ✅ 图片模式锁死 t1
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
            <div style={styles.miniHint}>
              {lang === "zh"
                ? "外观：描述材质、光学质感和风格，不负责几何轮廓。"
                : "Look: define material/optical style, not geometric silhouette."}
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
            <div style={styles.miniHint}>
              {lang === "zh"
                ? "形态：描述轮廓、比例和结构，不负责材质风格。"
                : "Form: define silhouette/proportions/structure, not material style."}
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

            <div style={styles.notesHeadRow}>
              <div style={styles.label}>{tt("props.localPromptTitle")}</div>
            </div>
            <div style={styles.rowTop}>
              <div style={{ width: 82 }} />
              <textarea
                value={externalDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  setExternalDraft(v);
                  commitExternalPrompt(v);
                }}
                onBlur={() => commitExternalPrompt(externalDraft)}
                placeholder={
                  tt("props.localPromptPlaceholder")
                }
                style={styles.objectPromptArea}
                spellCheck={false}
              />
            </div>
            <div style={styles.miniHint}>
              {tt("props.localPromptHint")}
            </div>
            <div style={styles.miniHint}>
              {lang === "zh"
                ? "插图实用：若目标平台支持参考图，先插 1-3 张身份/材质图，再粘贴这里的局部约束，成功率更高。"
                : "Ref tip: if the target platform supports image references, add 1-3 identity/material refs first, then paste local constraints here."}
            </div>
            <div style={styles.localTemplateWrap}>
              <div style={styles.localTemplateTitle}>
                {tt("props.localTemplateTitle")}
              </div>
              <div style={styles.templateGrid}>
                <input
                  value={localMaterial}
                  onChange={(e) => setLocalMaterial(e.target.value)}
                  placeholder={tt("props.localMaterialPlaceholder")}
                  style={styles.smallInput}
                  autoComplete="off"
                  spellCheck={false}
                />
                <input
                  value={localAction}
                  onChange={(e) => setLocalAction(e.target.value)}
                  placeholder={tt("props.localActionPlaceholder")}
                  style={styles.smallInput}
                  autoComplete="off"
                  spellCheck={false}
                />
                <input
                  value={localAvoid}
                  onChange={(e) => setLocalAvoid(e.target.value)}
                  placeholder={tt("props.localAvoidPlaceholder")}
                  style={styles.smallInput}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div style={styles.menuBtns}>
                <button
                  type="button"
                  style={styles.smallBtnGhost}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setLocalMaterial("");
                    setLocalAction("");
                    setLocalAvoid("");
                  }}
                >
                  {tt("props.localTemplateClear")}
                </button>
              </div>
            </div>
            <div style={styles.notesHeadRow}>
              <div style={styles.label}>{lang === "zh" ? "参考插图链接" : "Reference Image Links"}</div>
            </div>
            <div style={styles.rowTop}>
              <div style={{ width: 82 }} />
              <textarea
                value={refsDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  setRefsDraft(v);
                  patchLayer({ referenceLinks: v });
                }}
                onBlur={() => patchLayer({ referenceLinks: refsDraft })}
                placeholder={
                  lang === "zh"
                    ? "每行一个图链接（Quick 导出每对象最多 2 条，Pro 最多 6 条）"
                    : "One link per line (Quick export uses up to 2 refs per object, Pro up to 6)."
                }
                style={styles.objectPromptArea}
                spellCheck={false}
              />
            </div>
            {localPromptToast ? <div style={styles.toastHint}>{localPromptToast}</div> : null}

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
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ ...styles.pillBtn, ...(editT === 0 ? styles.pillBtnOn : {}) }}
                  onClick={() => setEditT(0)}
                >
                  {lang === "zh" ? "编辑起点" : "Edit Start"}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isImageMode}
                  title={
                    isImageMode
                      ? lang === "zh"
                        ? "图片模式：终点 t1 已锁定（切换到视频可编辑）"
                        : "Image mode: End keyframe t1 is locked (switch to Video to edit)"
                      : ""
                  }
                  style={{
                    ...styles.pillBtn,
                    ...(editT === 1 ? styles.pillBtnOn : {}),
                    ...(isImageMode ? styles.pillBtnDisabled : {})
                  }}
                  onClick={() => {
                    if (isImageMode) return;
                    setEditT(1);
                  }}
                >
                  {lang === "zh" ? "编辑终点" : "Edit End"}
                </button>
              </div>
            </div>

            {isImageMode ? (
              <div style={styles.lockHint}>
                {lang === "zh"
                  ? "图片模式：终点 t=1 已锁定（数据保留，切换到视频可继续编辑）"
                  : "Image mode: End t=1 is locked (data preserved; switch to Video to edit)."}
              </div>
            ) : null}

            <div style={styles.grid2}>
              <div style={styles.subCard}>
                <div style={styles.subTitle}>{lang === "zh" ? "起点 t=0" : "Start t=0"}</div>
                <KRow
                  tVal={0}
                  label="x"
                  v={draft0.x ?? fmt1(k0.x)}
                  onCh={(v) => setDraft0((d) => ({ ...d, x: v }))}
                  onCm={(v) => commitKFField(0, "x", v)}
                  setActiveKfField={setActiveKfField}
                />
                <KRow
                  tVal={0}
                  label="y"
                  v={draft0.y ?? fmt1(k0.y)}
                  onCh={(v) => setDraft0((d) => ({ ...d, y: v }))}
                  onCm={(v) => commitKFField(0, "y", v)}
                  setActiveKfField={setActiveKfField}
                />
                <KRow
                  tVal={0}
                  label="w"
                  v={draft0.w ?? fmt1(k0.w)}
                  onCh={(v) => setDraft0((d) => ({ ...d, w: v }))}
                  onCm={(v) => commitKFField(0, "w", v)}
                  setActiveKfField={setActiveKfField}
                />
                <KRow
                  tVal={0}
                  label="h"
                  v={draft0.h ?? fmt1(k0.h)}
                  onCh={(v) => setDraft0((d) => ({ ...d, h: v }))}
                  onCm={(v) => commitKFField(0, "h", v)}
                  setActiveKfField={setActiveKfField}
                />
                <KRow
                  tVal={0}
                  label="rot"
                  v={draft0.rot ?? fmt1(k0.rot || 0)}
                  onCh={(v) => setDraft0((d) => ({ ...d, rot: v }))}
                  onCm={(v) => commitKFField(0, "rot", v)}
                  setActiveKfField={setActiveKfField}
                />
              </div>

              <div style={{ ...styles.subCard, ...(isImageMode ? styles.subCardDisabled : {}) }}>
                <div style={styles.subTitle}>{lang === "zh" ? "终点 t=1" : "End t=1"}</div>
                <KRow
                  tVal={1}
                  label="x"
                  v={draft1.x ?? fmt1(k1.x)}
                  onCh={(v) => setDraft1((d) => ({ ...d, x: v }))}
                  onCm={(v) => commitKFField(1, "x", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={isImageMode}
                />
                <KRow
                  tVal={1}
                  label="y"
                  v={draft1.y ?? fmt1(k1.y)}
                  onCh={(v) => setDraft1((d) => ({ ...d, y: v }))}
                  onCm={(v) => commitKFField(1, "y", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={isImageMode}
                />
                <KRow
                  tVal={1}
                  label="w"
                  v={draft1.w ?? fmt1(k1.w)}
                  onCh={(v) => setDraft1((d) => ({ ...d, w: v }))}
                  onCm={(v) => commitKFField(1, "w", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={isImageMode}
                />
                <KRow
                  tVal={1}
                  label="h"
                  v={draft1.h ?? fmt1(k1.h)}
                  onCh={(v) => setDraft1((d) => ({ ...d, h: v }))}
                  onCm={(v) => commitKFField(1, "h", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={isImageMode}
                />
                <KRow
                  tVal={1}
                  label="rot"
                  v={draft1.rot ?? fmt1(k1.rot || 0)}
                  onCh={(v) => setDraft1((d) => ({ ...d, rot: v }))}
                  onCm={(v) => commitKFField(1, "rot", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={isImageMode}
                />
              </div>
            </div>

            <div style={styles.miniHint}>
              {lang === "zh"
                ? `提示：点“编辑起点/终点”后，去画布拖拽/缩放就是在改对应关键帧；数值保留 1 位小数。${
                    isImageMode ? "（图片模式只编辑起点 t=0）" : ""
                  }`
                : `Tip: after choosing Edit Start/End, dragging/resizing on stage edits that keyframe; values are 1-decimal.${
                    isImageMode ? " (Image mode edits Start t=0 only.)" : ""
                  }`}
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
  setActiveKfField,
  disabled
}: {
  tVal: 0 | 1;
  label: "x" | "y" | "w" | "h" | "rot";
  v: string;
  onCh: (v: string) => void;
  onCm: (v: string) => void;
  setActiveKfField: (k: string | null) => void;
  disabled?: boolean;
}) {
  const dis = !!disabled;
  return (
    <div style={styles.kfRow}>
      <div style={{ ...styles.kfLabel, ...(dis ? styles.kfLabelDisabled : {}) }}>{label}</div>
      <input
        value={v}
        onChange={(e) => onCh(e.target.value)}
        onFocus={() => {
          if (dis) return;
          setActiveKfField(`${tVal}:${label}`);
        }}
        onKeyDown={(e) => {
          if (dis) return;
          if (isComposing(e)) return;
          if (e.key === "Enter") onCm((e.target as HTMLInputElement).value);
          if (e.key === "Escape") (e.target as HTMLInputElement).blur();
        }}
        onBlur={(e) => {
          if (dis) return;
          setActiveKfField(null);
          onCm(e.target.value);
        }}
        style={{ ...styles.kfInput, ...(dis ? styles.kfInputDisabled : {}) }}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        disabled={dis}
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

  row: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, minWidth: 0 },

  label: {
    width: 108,
    flexShrink: 0,
    fontSize: 11,
    opacity: 0.75,
    fontWeight: 900,
    lineHeight: 1.25,
    wordBreak: "break-word",
    overflowWrap: "anywhere"
  },

  select: {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
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
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
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
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
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

  objectPromptArea: {
    flex: 1,
    minHeight: 86,
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
  toastHint: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.72,
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    padding: "6px 8px"
  },
  localTemplateWrap: {
    marginTop: 8,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    background: "rgba(0,0,0,0.14)",
    padding: 8
  },
  localTemplateTitle: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.82,
    marginBottom: 8
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  subCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    background: "rgba(0,0,0,0.16)",
    padding: 10
  },
  subCardDisabled: {
    opacity: 0.55
  },

  subTitle: { fontWeight: 900, fontSize: 12, opacity: 0.92, marginBottom: 8 },

  kfRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  kfLabel: { width: 36, fontSize: 11, opacity: 0.75, fontWeight: 900 },
  kfLabelDisabled: { opacity: 0.55 },

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
  kfInputDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
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
  pillBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed"
  },

  lockHint: {
    marginTop: -2,
    marginBottom: 8,
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 1.35
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
