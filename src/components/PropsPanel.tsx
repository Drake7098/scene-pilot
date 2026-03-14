import React, { useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { useFieldState } from "../hooks/useFieldState";
import { FIELD_KEYS } from "../rules/fieldKeys";
import { t } from "../i18n";
import type { Project, Scene, Layer, LayerKF, LocalRefMeta, LocalRefType, SceneRefMeta } from "../model";
import { ensureKF } from "../model";
import { deleteRefBlob, getRefBlob, putRefBlob } from "../utils/localRefs";
import { detectSceneConflicts } from "../utils/conflictRules";
import { UI_COLOR, UI_CONTROL, UI_EFFECT, UI_FONT, UI_INFO, UI_OPACITY, UI_PALETTE, UI_PANEL, UI_RADIUS, UI_SIZE, UI_STATUS, UI_TYPO } from "../uiTokens";
import { ProCollapseSection } from "./pro-ui/ProCollapseSection";
import { useProCollapseSections } from "../hooks/useProCollapseSections";

type Props = {
  lang: Lang;
  scene: Scene;
  selectedLayerId: string | null;
  onUpdateScene: (s: Scene) => void;
  onRenameLayer: (oldId: string, newId: string) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
  /** Optional slot rendered at bottom of panel (e.g. generate button) */
  bottomSlot?: React.ReactNode;
  project?: Project | null;
  onUpdateProject?: (p: Project) => void;
  /** For Platform Mode - platform and export strategy */
  platformId?: string;
  onPlatformChange?: (id: string) => void;
  exportMode?: "prompt_only" | "package";
  onExportModeChange?: (m: "prompt_only" | "package") => void;
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

function localRefOrder(t: LocalRefType) {
  if (t === "identity") return 0;
  if (t === "appearance") return 1;
  return 2;
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
      value: "heavy contrast surfaces, dense structure separation, visible industrial detail",
      label: zh ? "高对比结构分离（保留工业细节）" : "High-contrast structure separation"
    }
  ];

  const celestial = [
    {
      value: "photoreal celestial body, clear atmospheric banding, large-scale planetary texture",
      label: zh ? "写实天体（大气层与地表纹理）" : "Photoreal celestial (atmosphere / surface texture)"
    },
    {
      value: "crisp terminator boundary, controlled surface contrast, subtle orbital haze",
      label: zh ? "明暗界线清晰（轨道薄雾）" : "Crisp terminator boundary"
    }
  ];

  const character = [
    {
      value: "photoreal character, natural skin texture, realistic anatomy and proportions",
      label: zh ? "写实人物（自然皮肤/真实比例）" : "Photoreal character (natural skin / real proportions)"
    },
    {
      value: "detailed eyes, strong facial micro details, portrait-oriented subject finish",
      label: zh ? "肖像细节（眼部与面部微细节）" : "Portrait detail (eyes / facial micro detail)"
    },
    {
      value: "stylized realism, clean design language, consistent identity features",
      label: zh ? "风格化写实（人设特征一致）" : "Stylized realism (consistent identity features)"
    }
  ];

  const env = [
    {
      value: "cinematic environment, layered atmosphere, film-still structure",
      label: zh ? "电影环境（层次与气氛结构）" : "Cinematic environment (layered structure)"
    },
    {
      value: "documentary environment, realistic materials, physically plausible textures",
      label: zh ? "纪实环境（真实材质）" : "Documentary environment (real materials)"
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

export function PropsPanel(props: Props) {
  const { lang, scene, selectedLayerId, onUpdateScene, onRenameLayer, editT, setEditT, bottomSlot, project, onUpdateProject, platformId, onPlatformChange, exportMode, onExportModeChange } = props;
  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);

  const mediaMode: MediaMode = useMemo(() => parseMediaModeFromNotes(scene?.notes), [scene?.notes]);
  const isImageMode = mediaMode === "image";
  const t1Field = useFieldState(FIELD_KEYS.OBJECT_T1);
  const t1Visible = t1Field.visible;
  const t1Enabled = t1Field.enabled;

  // ✅ 图片模式强制回到 t0（避免“图片模式却在编辑终点”的矛盾状态）
  const backgroundRefId = scene.backgroundRef?.id;

  React.useEffect(() => {
    if (!t1Enabled && editT === 1) setEditT(0);
  }, [t1Enabled, editT, setEditT]);

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
      { value: "plain white seamless backdrop", label: lang === "zh" ? "白底棚拍" : "White seamless studio backdrop" },
      { value: "plain black seamless backdrop", label: lang === "zh" ? "黑底棚拍" : "Black seamless studio backdrop" },
      { value: "neutral gray studio backdrop", label: lang === "zh" ? "灰底棚拍" : "Gray studio backdrop" },
      { value: "modern indoor living room", label: lang === "zh" ? "现代客厅" : "Modern living room" },
      { value: "minimal office interior, tidy desk area", label: lang === "zh" ? "简洁办公室" : "Minimal office interior" },
      { value: "city street, wet pavement, dense storefront signs", label: lang === "zh" ? "城市街道（湿地面/招牌）" : "City street (wet pavement / storefront signs)" },
      { value: "urban rooftop skyline", label: lang === "zh" ? "城市天台（天际线）" : "Urban rooftop skyline" },
      { value: "industrial interior, metallic structures, depth layers", label: lang === "zh" ? "工业舱内（金属结构）" : "Industrial interior (metal structures)" },
      { value: "clean futuristic corridor", label: lang === "zh" ? "未来科幻走廊" : "Futuristic corridor" },
      { value: "forest clearing, natural haze", label: lang === "zh" ? "森林空地（自然薄雾）" : "Forest clearing (natural haze)" },
      { value: "mountain valley, distant peaks, crisp atmosphere", label: lang === "zh" ? "山谷远山（空气通透）" : "Mountain valley (distant peaks)" },
      { value: "desert dunes", label: lang === "zh" ? "沙漠沙丘" : "Desert dunes" },
      { value: "coastal beach, open sky, soft sea haze", label: lang === "zh" ? "海岸沙滩（开阔天空）" : "Coastal beach (open sky)" },
      { value: "snow field landscape", label: lang === "zh" ? "雪地场景" : "Snow field landscape" },
      { value: "deep space, dense starfield", label: lang === "zh" ? "深空（密集星场）" : "Deep space (dense starfield)" },
      { value: "earth limb in frame", label: lang === "zh" ? "地球弧面" : "Earth limb" },
      { value: "distant moon", label: lang === "zh" ? "远月背景" : "Distant moon" },
      { value: "nebula clouds, cosmic haze", label: lang === "zh" ? "星云背景（宇宙雾）" : "Nebula background (cosmic haze)" },
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
  const [localRefToast, setLocalRefToast] = useState<string>("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRefHelp, setShowRefHelp] = useState(false);
  const [localRefThumb, setLocalRefThumb] = useState<string>("");
  const [bgRefThumb, setBgRefThumb] = useState<string>("");
  const [bgRefToast, setBgRefToast] = useState<string>("");
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
    queueMicrotask(() => {
      localSyncPauseRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer?.id, scene.id, typeKey, lang]);

  React.useEffect(() => {
    if (!localRefToast) return;
    const timer = window.setTimeout(() => setLocalRefToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [localRefToast]);
  React.useEffect(() => {
    if (!bgRefToast) return;
    const timer = window.setTimeout(() => setBgRefToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [bgRefToast]);

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
  }

  const localRefs = useMemo<LocalRefMeta[]>(() => {
    return (layer?.localRefs ?? []).slice().sort((a, b) => {
      const d = localRefOrder(a.type) - localRefOrder(b.type);
      if (d !== 0) return d;
      return a.updatedAt - b.updatedAt;
    });
  }, [layer?.localRefs]);
  React.useEffect(() => {
    let revoked = "";
    let dead = false;
    const first = localRefs[0];
    if (!first) {
      setLocalRefThumb("");
      return;
    }
    void getRefBlob(first.id).then((blob) => {
      if (dead || !blob) return;
      const url = URL.createObjectURL(blob);
      revoked = url;
      setLocalRefThumb(url);
    });
    return () => {
      dead = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [localRefs]);

  React.useEffect(() => {
    let revoked = "";
    let dead = false;
    if (!backgroundRefId) {
      setBgRefThumb("");
      return;
    }
    void getRefBlob(backgroundRefId).then((blob) => {
      if (dead || !blob) return;
      const url = URL.createObjectURL(blob);
      revoked = url;
      setBgRefThumb(url);
    });
    return () => {
      dead = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [backgroundRefId]);

  async function setSceneBackgroundRef(files: FileList | null) {
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      setBgRefToast(lang === "zh" ? "未选择有效图片。" : "No valid image selected.");
      return;
    }

    const file = picked[0];
    const nextRef: SceneRefMeta = {
      id: `bgref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      mime: file.type,
      size: file.size,
      updatedAt: Date.now()
    };
    await putRefBlob(nextRef.id, file);

    const prev = scene.backgroundRef;
    if (prev?.id) {
      try {
        await deleteRefBlob(prev.id);
      } catch {
        // no-op
      }
    }
    onUpdateScene({ ...scene, backgroundRef: nextRef });
    setBgRefToast(lang === "zh" ? "已更新分镜背景参考图。" : "Shot background reference updated.");
  }

  async function removeSceneBackgroundRef() {
    const prev = scene.backgroundRef;
    if (!prev?.id) return;
    try {
      await deleteRefBlob(prev.id);
    } catch {
      // no-op
    }
    onUpdateScene({ ...scene, backgroundRef: undefined });
    setBgRefToast(lang === "zh" ? "已移除分镜背景参考图。" : "Shot background reference removed.");
  }

  async function addLocalRefs(type: LocalRefType, files: FileList | null) {
    if (!layer || !files?.length) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      setLocalRefToast(lang === "zh" ? "未选择有效图片。" : "No valid images selected.");
      return;
    }
    const current = layer.localRefs ?? [];
    if (current.length >= 1) {
      setLocalRefToast(lang === "zh" ? "每个对象只保留 1 张参考图。" : "One reference image per object.");
      return;
    }
    const using = picked.slice(0, 1);
    const created: LocalRefMeta[] = [];
    for (const f of using) {
      const id = `lref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      await putRefBlob(id, f);
      created.push({
        id,
        type,
        name: f.name,
        mime: f.type,
        size: f.size,
        updatedAt: Date.now()
      });
    }
    patchLayer({ localRefs: [...current, ...created] });
    setLocalRefToast(
      lang === "zh"
        ? `已添加 ${created.length} 张本地参考图（仅本地保存）。`
        : `Added ${created.length} local refs (stored locally only).`
    );
  }

  async function removeLocalRef(meta: LocalRefMeta) {
    if (!layer) return;
    try {
      await deleteRefBlob(meta.id);
    } catch {
      // no-op: missing blob still allows metadata cleanup
    }
    const next = (layer.localRefs ?? []).filter((x) => x.id !== meta.id);
    patchLayer({ localRefs: next });
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
      { key: "sharp", line: "sharp focus, crisp edges", zh: "清晰锐利、焦点明确" },
      { key: "material_readable", line: "readable materials, clear surface details", zh: "材质可读、表面细节清楚" },
      { key: "clear_action", line: "clear action silhouette, readable body language", zh: "动作清楚、身体语言可读" },
      { key: "no_text", line: "no text, no watermark, no logo", zh: "无文字、无水印、无Logo" },
      { key: "identity_consistent", line: "keep this object identity consistent", zh: "保持该对象身份一致" },
      { key: "local_only", line: "object-local only, do not override camera or overall composition", zh: "仅作用于该对象，不改镜头和整体构图" }
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
    if (!t1Enabled && tVal === 1) return; // rules: t1 locked
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
    if (!t1Enabled && tVal === 1) return; // rules: t1 locked
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

  const promptConflicts = useMemo(() => detectSceneConflicts(scene, lang), [scene, lang]);
  const layerPromptConflicts = useMemo(() => {
    if (!layer) return promptConflicts.filter((c) => c.scope === "scene");
    return promptConflicts.filter((c) => c.layerId === layer.id || c.scope === "scene");
  }, [promptConflicts, layer]);
  const notesHasConflict = layerPromptConflicts.some((c) => c.field === "notes" || c.field === "scene");
  const externalHasConflict = layerPromptConflicts.some((c) => c.field === "externalPrompt");

  const [propsCollapsed, toggleProps] = useProCollapseSections(
    "props",
    ["scene_background", "object_properties", "composition"],
    ["object_properties", "composition"]
  );

  return (
    <div className="pro-props-panel" style={{ ...styles.wrap, ...styles.wrapPro }}>
      <div style={styles.scrollArea}>
      {/* Scene Background */}
      <ProCollapseSection
        title={lang === "zh" ? "分镜背景" : "Scene Background"}
        collapsed={propsCollapsed.has("scene_background")}
        onToggle={() => toggleProps("scene_background")}
      >
      <div style={styles.card}>
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

        <div style={styles.localRefCard}>
          <div style={styles.localRefHead}>
            <div style={styles.localRefTitle}>{lang === "zh" ? "分镜背景参考图" : "Shot Background Ref"}</div>
            <div style={styles.localRefActions}>
              <label className="pro-btn-ghost" style={styles.localRefImportBtn}>
                {lang === "zh" ? "导入背景图片" : "Import Background Image"}
                <input
                  type="file"
                  accept="image/*"
                  multiple={false}
                  style={styles.hiddenInput}
                  onChange={async (e) => {
                    await setSceneBackgroundRef(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <div style={styles.localRefList}>
            {scene.backgroundRef ? (
              <div style={styles.localRefItem}>
                {bgRefThumb ? <img src={bgRefThumb} alt={scene.backgroundRef.name} style={styles.bgRefThumb} /> : null}
                <div style={styles.localRefText}>{scene.backgroundRef.name}</div>
                <button
                  type="button"
                  className="pro-btn-ghost"
                  style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void removeSceneBackgroundRef()}
                >
                  {lang === "zh" ? "移除" : "Remove"}
                </button>
              </div>
            ) : null}
          </div>
          {bgRefToast ? <div style={styles.toastHint}>{bgRefToast}</div> : null}
        </div>
      </div>
      </ProCollapseSection>

      {/* Object Properties */}
      <ProCollapseSection
        title={lang === "zh" ? "对象属性" : tt("props.title")}
        collapsed={propsCollapsed.has("object_properties")}
        onToggle={() => toggleProps("object_properties")}
      >
      <div style={styles.card}>
        {!layer ? (
          <div style={styles.miniHint}>
            {(layers ?? []).length === 0
              ? (lang === "zh" ? "当前分镜还没有对象，请先点击“添加对象”开始编辑。" : "No objects yet. Click Add Object to start.")
              : tt("props.noSelection")}
          </div>
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
              <div style={styles.label}>{lang === "zh" ? "外观" : "Look"}</div>
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
              <div style={styles.label}>{lang === "zh" ? "形态" : "Form"}</div>
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

            <div style={styles.rowTop}>
              <div style={{ ...styles.label, ...styles.labelTop }}>{tt("props.localPromptTitle")}</div>
              <textarea
                value={externalDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  setExternalDraft(v);
                  commitExternalPrompt(v);
                }}
                onBlur={() => {
                  commitExternalPrompt(externalDraft);
                  if (externalHasConflict) setShowConflictModal(true);
                }}
                placeholder={
                  tt("props.localPromptPlaceholder")
                }
                style={{ ...styles.objectPromptArea, ...(externalHasConflict ? styles.conflictField : {}) }}
                spellCheck={false}
              />
            </div>
            <div style={styles.localRefCard}>
              <div style={styles.localRefHead}>
                <div style={styles.localRefTitle}>
                  {lang === "zh" ? "对象参考图" : "Object Refs"}
                </div>
                <div style={styles.localRefActions}>
                  <label className="pro-btn-ghost" style={styles.localRefImportBtn}>
                    {lang === "zh" ? "导入对象图片" : "Import Object Image"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple={false}
                      style={styles.hiddenInput}
                      onChange={async (e) => {
                        await addLocalRefs("identity" as LocalRefType, e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                <button
                  type="button"
                  style={styles.qBtn}
                  onMouseEnter={() => setShowRefHelp(true)}
                  onMouseLeave={() => setShowRefHelp(false)}
                  onFocus={() => setShowRefHelp(true)}
                  onBlur={() => setShowRefHelp(false)}
                >
                  ?
                </button>
                </div>
              </div>
              {showRefHelp ? (
                <div style={styles.helpFloat}>
                  {lang === "zh"
                    ? "用法：每个对象导入 1 张本地图。导出时会自动按对象顺序整理配图文件。"
                    : "Usage: import 1 local image per object. Export arranges files in object order."}
                </div>
              ) : null}
              <div style={styles.localRefList}>
                {localRefs[0] ? (
                  <div style={styles.localRefItem}>
                    {localRefThumb ? <img src={localRefThumb} alt={localRefs[0].name} style={styles.localRefThumb} /> : null}
                    <div style={styles.localRefText}>{localRefs[0].name}</div>
                    <button
                      type="button"
                      className="pro-btn-ghost"
                      style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void removeLocalRef(localRefs[0])}
                    >
                      {lang === "zh" ? "移除" : "Remove"}
                    </button>
                  </div>
                ) : null}
              </div>
              {localRefToast ? <div style={styles.toastHint}>{localRefToast}</div> : null}
            </div>
            {conflictHints.length > 0 && (
              <div style={styles.warnHint}>
                {conflictHints.map((x, i) => (
                  <div key={i}>{x}</div>
                ))}
              </div>
            )}
            {layerPromptConflicts.length > 0 ? (
              <div style={styles.warnHint}>
                <div style={styles.warnHead}>
                  <span>{lang === "zh" ? `检测到冲突 ${layerPromptConflicts.length} 处` : `${layerPromptConflicts.length} conflict(s) detected`}</span>
                  <button
                    type="button"
                    className="pro-btn-ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowConflictModal(true)}
                  >
                    {lang === "zh" ? "查看冲突" : "View"}
                  </button>
                </div>
              </div>
            ) : null}

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
                    className="pro-btn"
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
                    className="pro-btn-ghost"
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
                    className="pro-btn"
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
                    className="pro-btn-ghost"
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
              <div style={styles.labelSpacer} />
              <textarea
                value={layer.notes ?? ""}
                onChange={(e) => patchLayer({ notes: e.target.value })}
                onBlur={() => {
                  if (notesHasConflict) setShowConflictModal(true);
                }}
                placeholder={
                  lang === "zh"
                    ? "不要什么 / 必须有什么 / 动作 / 情绪 / 限制…（可在上方下拉“要素”里点选）"
                    : "constraints / actions / mood / must-have / avoid... (use elements dropdown above)"
                }
                style={{ ...styles.textarea, ...(notesHasConflict ? styles.conflictField : {}) }}
                spellCheck={false}
              />
            </div>
          </>
        )}
      </div>

      {showConflictModal ? (
        <div style={styles.modalMask} onMouseDown={() => setShowConflictModal(false)} role="presentation">
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{lang === "zh" ? "冲突列表" : "Conflict List"}</div>
            <div style={styles.modalText}>
              {lang === "zh"
                ? "以下冲突建议你手动修改。系统会在导出阶段做保护性修正，但不会改写你的原始输入。"
                : "Please adjust these conflicts manually. Export adds protective constraints but does not rewrite your raw input."}
            </div>
            <div style={styles.conflictList}>
              {layerPromptConflicts.map((c) => (
                <div key={c.id} style={{ ...styles.conflictItem, ...(c.severity === "high" ? styles.conflictItemHigh : {}) }}>
                  <div style={styles.conflictTitle}>
                    {c.title}
                    {c.layerId ? ` · ${c.layerId}` : ""}
                  </div>
                  <div style={styles.conflictDetail}>{c.detail}</div>
                </div>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button className="pro-btn-ghost" type="button" onClick={() => setShowConflictModal(false)}>
                {lang === "zh" ? "我去修改" : "Back to Edit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      </ProCollapseSection>

      {/* Composition + Trajectory buttons */}
      <ProCollapseSection
        title={lang === "zh" ? "对象构图" : "Composition"}
        collapsed={propsCollapsed.has("composition")}
        onToggle={() => toggleProps("composition")}
      >
      <div style={styles.card}>
        {!layer || !k0 || !k1 ? (
          <div style={styles.miniHint}>{lang === "zh" ? "先选择一个对象" : "Select an object first"}</div>
        ) : (
          <>
            <div style={styles.row}>
              <div style={styles.label}>{lang === "zh" ? "轨迹" : "Path"}</div>
              <div style={styles.pathBtnRow}>
                <button
                  type="button"
                  className={editT === 0 ? "pro-btn" : "pro-btn-ghost"}
                  style={{ ...styles.pathBtn, ...(editT === 0 ? {} : { minWidth: 74 }) }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setEditT(0)}
                >
                  {lang === "zh" ? "编辑起点" : "Start"}
                </button>

                {t1Visible ? (
                <button
                  type="button"
                  className={editT === 1 && t1Enabled ? "pro-btn" : "pro-btn-ghost"}
                  style={{
                    ...styles.pathBtn,
                    ...(editT === 1 && t1Enabled ? {} : { minWidth: 74 }),
                    ...(!t1Enabled ? styles.pillBtnDisabled : {})
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!t1Enabled}
                  title={t1Field.reason ?? (t1Enabled ? "" : (lang === "zh" ? "图片模式：终点 t1 已锁定" : "Image mode: End t1 locked"))}
                  onClick={() => {
                    if (!t1Enabled) return;
                    setEditT(1);
                  }}
                >
                  {lang === "zh" ? "编辑终点" : "End"}
                </button>
                ) : null}
              </div>
            </div>

            {!t1Enabled && t1Visible ? (
              <div style={styles.lockHint}>
                {t1Field.reason ?? (lang === "zh" ? "图片模式：终点 t=1 已锁定（切换到视频可继续编辑）" : "Image mode: End t=1 is locked.")}
              </div>
            ) : null}

            <div style={styles.kfGrid}>
              <div style={styles.subCard}>
                <div style={styles.subTitle}>{lang === "zh" ? "起点 t=0" : "Start"}</div>
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

              {t1Visible ? (
              <div style={{ ...styles.subCard, ...(!t1Enabled ? styles.subCardDisabled : {}) }}>
                <div style={styles.subTitle}>{lang === "zh" ? "终点 t=1" : "End"}</div>
                <KRow
                  tVal={1}
                  label="x"
                  v={draft1.x ?? fmt1(k1.x)}
                  onCh={(v) => setDraft1((d) => ({ ...d, x: v }))}
                  onCm={(v) => commitKFField(1, "x", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={!t1Enabled}
                />
                <KRow
                  tVal={1}
                  label="y"
                  v={draft1.y ?? fmt1(k1.y)}
                  onCh={(v) => setDraft1((d) => ({ ...d, y: v }))}
                  onCm={(v) => commitKFField(1, "y", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={!t1Enabled}
                />
                <KRow
                  tVal={1}
                  label="w"
                  v={draft1.w ?? fmt1(k1.w)}
                  onCh={(v) => setDraft1((d) => ({ ...d, w: v }))}
                  onCm={(v) => commitKFField(1, "w", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={!t1Enabled}
                />
                <KRow
                  tVal={1}
                  label="h"
                  v={draft1.h ?? fmt1(k1.h)}
                  onCh={(v) => setDraft1((d) => ({ ...d, h: v }))}
                  onCm={(v) => commitKFField(1, "h", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={!t1Enabled}
                />
                <KRow
                  tVal={1}
                  label="rot"
                  v={draft1.rot ?? fmt1(k1.rot || 0)}
                  onCh={(v) => setDraft1((d) => ({ ...d, rot: v }))}
                  onCm={(v) => commitKFField(1, "rot", v)}
                  setActiveKfField={setActiveKfField}
                  disabled={!t1Enabled}
                />
              </div>
              ) : null}
            </div>

          </>
        )}
      </div>
      </ProCollapseSection>
      </div>
      {bottomSlot ? (
        <div style={styles.bottomSlot}>{bottomSlot}</div>
      ) : null}
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
    width: "clamp(270px, 26vw, 374px)",
    minWidth: 270,
    minHeight: 0,
    borderLeft: "none",
    background: "var(--pro-bg-panel)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    boxShadow: "none"
  },
  wrapPro: {
    background: "var(--pro-bg-panel)"
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    padding: 12
  },
  bottomSlot: {
    flexShrink: 0,
    padding: 12,
    paddingTop: 12,
    borderTop: "1px solid var(--pro-border)"
  },

  card: {
    border: "none",
    borderRadius: 0,
    background: "transparent",
    padding: "0 0 12px",
    boxShadow: "none"
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    minWidth: 0,
    width: "100%",
    minHeight: "var(--pro-row-height)",
    flexWrap: "nowrap"
  },
  rowTop: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12, minWidth: 0 },

  label: {
    width: 72,
    minWidth: 72,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    fontSize: "var(--pro-font-2xs)",
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "var(--pro-text-muted)"
  },
  labelSpacer: { width: 72, minWidth: 72, flexShrink: 0 },
  labelTop: {
    minHeight: 0,
    alignItems: "flex-start",
    paddingTop: 6
  },

  select: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
    height: "var(--pro-control-height)",
    borderRadius: 8,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    outline: "none",
    padding: "0 28px 0 8px",
    fontSize: "var(--pro-font-xs)",
    fontWeight: 500,
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, rgba(220,232,255,0.78) 50%), linear-gradient(135deg, rgba(220,232,255,0.78) 50%, transparent 50%), linear-gradient(to right, transparent, transparent)",
    backgroundPosition: "calc(100% - 18px) calc(50% - 1px), calc(100% - 12px) calc(50% - 1px), 100% 0",
    backgroundSize: "6px 6px, 6px 6px, 2.2em 2.2em",
    backgroundRepeat: "no-repeat"
  },

  input: {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
    height: "var(--pro-control-height)",
    borderRadius: 8,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    outline: "none",
    padding: "0 8px",
    fontSize: "var(--pro-font-xs)"
  },

  clickablePill: {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "100%",
    height: "var(--pro-control-height)",
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    cursor: "pointer",
    userSelect: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },

  warnHint: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.35,
    borderLeft: "2px solid var(--pro-accent)",
    paddingLeft: 8,
    color: "var(--pro-text-muted)"
  },
  warnHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  conflictField: {
    border: `1px solid ${UI_PALETTE.border.danger}`,
    boxShadow: "0 0 0 1px rgba(255,124,124,0.26) inset"
  },
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
    width: "min(640px, calc(100vw - 48px))",
    maxHeight: "calc(100vh - 48px)",
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: `${UI_PANEL.rightGlow}, rgba(12,17,27,0.96)`,
    boxShadow: UI_EFFECT.floatShadow,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflow: "auto",
    backdropFilter: "blur(18px)"
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { fontSize: UI_TYPO.size12, lineHeight: 1.45, opacity: 0.84, color: UI_PALETTE.text.secondary },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  modalBtnGhost: {
    padding: "7px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: UI_CONTROL.shadow.soft
  },
  conflictList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 280,
    overflow: "auto"
  },
  conflictItem: {
    border: "1px solid rgba(244,193,114,0.5)",
    borderRadius: UI_RADIUS.control,
    background: "rgba(244,193,114,0.12)",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  conflictItemHigh: {
    border: `1px solid ${UI_PALETTE.border.danger}`,
    background: "rgba(255,124,124,0.14)"
  },
  conflictTitle: { fontSize: 12, fontWeight: 900, opacity: 0.95 },
  conflictDetail: { fontSize: 12, lineHeight: 1.4, opacity: 0.86 },

  textarea: {
    flex: 1,
    minHeight: 88,
    resize: "vertical",
    borderRadius: 8,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    outline: "none",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.35
  },

  objectPromptArea: {
    flex: 1,
    minHeight: 86,
    resize: "vertical",
    borderRadius: 8,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    outline: "none",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.35
  },

  miniHint: {
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    color: "var(--pro-text-muted)",
    lineHeight: 1.2,
    marginTop: 4,
    maxHeight: "var(--pro-info-height)",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  toastHint: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.2,
    maxHeight: "var(--pro-info-height)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    border: "1px solid var(--pro-border)",
    borderRadius: 6,
    background: "var(--pro-bg-panel)",
    padding: "4px 8px",
    color: "var(--pro-text-primary)"
  },
  localTemplateWrap: {
    marginTop: 8,
    border: "none",
    borderRadius: UI_RADIUS.control,
    background: "transparent",
    padding: 8
  },
  localTemplateTitle: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.82,
    marginBottom: 12
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8
  },
  localRefCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 0,
    position: "relative",
    border: "none",
    borderRadius: 0,
    background: "transparent",
    padding: "6px 0",
    marginBottom: 8,
    boxShadow: "none"
  },
  localRefHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: "var(--pro-row-height)",
    flexWrap: "wrap"
  },
  localRefActions: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  localRefImportBtn: {
    minWidth: 130,
    padding: "6px 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    textAlign: "center",
    border: "1px solid var(--pro-border)",
    borderRadius: 6,
    fontSize: "var(--pro-font-xs)"
  },
  localRefTitle: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "var(--pro-font-2xs)",
    fontWeight: 600,
    color: "var(--pro-text-primary)",
    lineHeight: 1
  },
  qBtn: {
    width: 24,
    height: 24,
    borderRadius: 999,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  helpFloat: {
    position: "absolute",
    right: 8,
    top: 34,
    zIndex: 20,
    maxWidth: 280,
    padding: "8px 10px",
    borderRadius: 10,
    border: `1px solid ${UI_INFO.border.default}`,
    background: UI_INFO.surface.elevated,
    fontSize: 11,
    lineHeight: 1.4,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  localRefPolicy: {
    marginLeft: "auto",
    height: 28,
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontSize: 12,
    padding: "0 28px 0 8px"
  },
  localRefBtns: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12
  },
  localRefList: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  localRefItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
    border: "none",
    borderRadius: 10,
    padding: "6px 8px",
    background: "rgba(255,255,255,0.02)"
  },
  localRefText: {
    fontSize: 12,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  localRefThumb: {
    width: 48,
    height: 48,
    objectFit: "cover",
    borderRadius: 8,
    border: "none",
    flexShrink: 0
  },
  /** 分镜背景参考图：16:9 标准比例 */
  bgRefThumb: {
    width: 80,
    height: 45,
    objectFit: "cover",
    borderRadius: 8,
    border: "none",
    flexShrink: 0,
    aspectRatio: "16/9"
  },
  hiddenInput: {
    display: "none"
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  kfGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },

  subCard: {
    minWidth: 0,
    border: "none",
    borderRadius: 0,
    background: "transparent",
    padding: 10,
    boxShadow: "none"
  },
  subCardDisabled: {
    opacity: 0.55
  },

  subTitle: { fontWeight: 600, fontSize: "var(--pro-font-2xs)", color: "var(--pro-text-primary)", marginBottom: 12 },

  kfRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  kfLabel: {
    width: 30,
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.3
  },
  kfLabelDisabled: { opacity: 0.55 },

  kfInput: {
    width: 70,
    height: UI_SIZE.compactH,
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body
  },
  kfInputDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },

  btnRow: { display: "flex", gap: 8, alignItems: "center" },
  pathBtnRow: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  pathBtn: { padding: "0 8px", minWidth: 74 },

  pillBtn: {
    height: UI_SIZE.compactH,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    userSelect: "none",
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  pillBtnOn: {
    border: `1px solid ${UI_CONTROL.border.active}`,
    background: UI_CONTROL.bg.accent,
    boxShadow: UI_CONTROL.shadow.hover
  },
  pillBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed"
  },

  lockHint: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    lineHeight: 1.2,
    color: "var(--pro-text-muted)"
  },

  // ---- notes panel ----
  notesHeadRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 12 },

  notesMenu: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 8,
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    marginBottom: 12
  },
  notesMenuTitle: { fontWeight: 900, fontSize: UI_FONT.section, opacity: UI_OPACITY.title, marginBottom: 12 },

  smallLabel: {
    width: 72,
    minWidth: 72,
    flexShrink: 0,
    fontSize: UI_FONT.body,
    opacity: UI_OPACITY.label,
    fontWeight: 900,
    lineHeight: 1.3
  },

  smallInput: {
    flex: 1,
    height: UI_SIZE.compactH,
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: UI_FONT.body
  },

  smallBtn: {
    height: UI_SIZE.compactH,
    padding: "0 10px",
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(120,180,255,0.35)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900
  },
  smallBtnGhost: {
    height: UI_SIZE.compactH,
    padding: "0 10px",
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 900
  },

  pasteArea: {
    flex: 1,
    minHeight: 68,
    resize: "vertical",
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "8px 10px",
    fontSize: UI_FONT.body,
    lineHeight: 1.35
  },

  menuBtns: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }
};
