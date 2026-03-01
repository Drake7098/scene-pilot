export type Mode = "static" | "storyboard";

export type Shape = "circle" | "rect" | "ring" | "arrow";

export type LayerKF = {
  t: 0 | 1;
  x: number; // 0..100 (center)
  y: number; // 0..100 (center)
  w: number; // 0..100
  h: number; // 0..100
  rot: number; // degrees
};

export type Layer = {
  id: string;

  // 自由文本：可中英文
  type: string;

  // 仅用于画布渲染（不在 UI 暴露编辑）
  shape: Shape;

  // 形状/外观描述（可选）
  shapeDesc?: string;

  // ✅ 作为“背景/外观描述”的主要字段（替代颜色输入）
  look: string;

  z: number;

  // 仅画布渲染用（固定默认）
  color: string;

  opacity: number;
  kf: LayerKF[];
  notes: string;
  externalPrompt: string;
  referenceLinks: string;
  localRefs?: LocalRefMeta[];
  referencePolicy?: "optional" | "required";
};

export type LocalRefType = "identity" | "appearance" | "style";

export type LocalRefMeta = {
  id: string;
  type: LocalRefType;
  name: string;
  mime: string;
  size: number;
  updatedAt: number;
};

export type Camera = {
  shot: string; // wide/medium/close/custom
  movement: string; // static/pan_left/custom
  keyframes: { t: 0 | 1; x: number; y: number; zoom: number; rot: number }[];
};

export type Lighting = { time: string; key_dir: string; mood: string };

export type Scene = {
  id: string;
  name: string;
  duration_s: number;
  camera: Camera;
  lighting: Lighting;
  layers: Layer[];
  notes: string;
};

export type Project = {
  project: { mode: Mode };
  scenes: Scene[];
};

// ---------- helpers (internal) ----------
function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function ensureArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

/**
 * ✅ 关键点：不要让 UI / Stage 遇到 undefined 的 kf[0] / 找不到 t=0 / t=1
 * 这个函数会“就地补齐” layer.kf 的 t=0 或 t=1。
 */
export function ensureKF(layer: Layer, t: 0 | 1): LayerKF {
  const kfs = ensureArray<LayerKF>(layer.kf, []);
  layer.kf = kfs;

  const found = layer.kf.find((k) => k.t === t);
  if (found) return found;

  const base =
    layer.kf.find((k) => k.t === 0) ??
    layer.kf[0] ?? { t: 0 as const, x: 50, y: 50, w: 20, h: 20, rot: 0 };

  const created: LayerKF = { ...base, t };
  layer.kf.push(created);
  layer.kf.sort((a, b) => a.t - b.t);
  return created;
}

/**
 * ✅ 用于“从 storage 读出来”的项目做一次清洗：
 * - 补齐 scene.camera.keyframes 的 t=0/1
 * - 补齐每个 layer 的 t=0/1
 * - clamp 数值避免 NaN/越界导致画布爆掉
 *
 * 不改变数据结构，只保证字段健壮。
 */
export function sanitizeProject(p: Project): Project {
  // 尽量不假设 p 一定干净：但也不在这里做复杂 schema 校验
  const scenes = ensureArray<Scene>((p as any)?.scenes, []);

  for (const s of scenes) {
    s.duration_s = clamp((s as any).duration_s ?? 6, 1, 600);

    // camera
    if (!s.camera) {
      s.camera = {
        shot: "wide",
        movement: "static",
        keyframes: [
          { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
        ]
      };
    }
    s.camera.keyframes = ensureArray(s.camera.keyframes, []);
    const c0 = s.camera.keyframes.find((k) => k.t === 0) ?? { t: 0 as const, x: 0, y: 0, zoom: 1, rot: 0 };
    const c1 = s.camera.keyframes.find((k) => k.t === 1) ?? { ...c0, t: 1 as const };
    // 去重并排序
    s.camera.keyframes = [c0, c1].map((k) => ({
      ...k,
      x: clamp(k.x, -10000, 10000),
      y: clamp(k.y, -10000, 10000),
      zoom: clamp(k.zoom, 0.01, 100),
      rot: clamp(k.rot, -3600, 3600)
    }));

    // lighting
    if (!s.lighting) s.lighting = { time: "sunset", key_dir: "top_right", mood: "cinematic" };

    // layers
    s.layers = ensureArray<Layer>((s as any).layers, []);
    for (const l of s.layers) {
      l.opacity = clamp((l as any).opacity ?? 1, 0, 1);
      l.z = clamp((l as any).z ?? 0, -9999, 9999);
      l.look = (l as any).look ?? "";
      l.color = (l as any).color ?? "#b7c3ff";
      l.notes = (l as any).notes ?? "";
      l.externalPrompt = (l as any).externalPrompt ?? "";
      l.referenceLinks = (l as any).referenceLinks ?? "";
      l.localRefs = Array.isArray((l as any).localRefs) ? (l as any).localRefs : [];
      l.referencePolicy = (l as any).referencePolicy === "required" ? "required" : "optional";
      l.type = (l as any).type ?? "";
      l.shape = ((l as any).shape ?? "rect") as Shape;

      l.kf = ensureArray<LayerKF>((l as any).kf, []);
      const k0 = ensureKF(l, 0);
      const k1 = ensureKF(l, 1);

      // clamp kf 数值
      for (const k of [k0, k1]) {
        k.x = clamp(k.x, 0, 100);
        k.y = clamp(k.y, 0, 100);
        k.w = clamp(k.w, 0, 100);
        k.h = clamp(k.h, 0, 100);
        k.rot = clamp(k.rot, -3600, 3600);
      }
    }

    s.notes = (s as any).notes ?? "";
    s.name = (s as any).name ?? "Scene";
    s.id = (s as any).id ?? `s_${Math.random().toString(16).slice(2)}`;
  }

  // project meta
  if (!p.project) p.project = { mode: "storyboard" };
  p.project.mode = (p.project.mode ?? "storyboard") as Mode;

  p.scenes = scenes;
  return p;
}

export function defaultProject(): Project {
  const p: Project = {
    project: { mode: "storyboard" },
    scenes: [
      {
        id: "s1",
        name: "Scene 1",
        duration_s: 6,
        camera: {
          shot: "wide",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "sunset", key_dir: "top_right", mood: "cinematic" },
        layers: [
          {
            id: "obj_station",
            type: "station",
            shape: "ring",
            shapeDesc: "ring station, modular",
            look: "metallic, detailed panels, cinematic",
            z: 30,
            color: "#b7c3ff",
            opacity: 0.95,
            kf: [
              { t: 0, x: 58, y: 55, w: 26, h: 18, rot: 12 },
              { t: 1, x: 58, y: 55, w: 26, h: 18, rot: 12 }
            ],
            notes: "",
            externalPrompt: "",
            referenceLinks: "",
            localRefs: [],
            referencePolicy: "optional"
          }
        ],
        notes: ""
      }
    ]
  };

  return sanitizeProject(p);
}
