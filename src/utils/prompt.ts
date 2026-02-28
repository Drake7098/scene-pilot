import type { Lang } from "../i18n";
import type { Project, Scene, Layer, LayerKF } from "../model";

/**
 * ScenePilot prompts generator
 * ✅ Never mention layer.color (UI doesn't expose it)
 * ✅ Unified tail block: System Auto Extensions (e.g., Stability + Exposure) + Machine Notes
 *    - All system-generated supplements go to the tail block (gray in UI via ExportPanel split)
 *    - Controlled by scene.notes marker: `stability: on|off` (default: on)
 *
 * ✅ Added: Language Reinforcement Layer (LRL) in tail-only area
 *    - Converts numeric x/y/w/h into spatial natural language
 *    - Adds anti-auto-balance / anti-recenter / anti-size-equalization constraints
 *    - Does NOT modify user structure; tail-only guidance
 */

function clamp01(v: number) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}
function n1(v: number) {
  // keep 1 decimal like most platforms
  const x = Number.isFinite(v) ? v : 0;
  return Math.round(x * 10) / 10;
}
function getKF(layer: Layer, t: 0 | 1): LayerKF {
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

/**
 * 从 scene.notes 提取 bg: 背景（你之前约定的隐藏标记）
 */
const BG_MARK = "bg:";
function parseBg(notes: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(BG_MARK));
  if (!hit) return "";
  return hit.trim().slice(BG_MARK.length).trim();
}

function joinNonEmpty(parts: (string | undefined | null)[], sep = ", ") {
  return parts.map((x) => (x ?? "").trim()).filter(Boolean).join(sep);
}

function formatLayerLine(lang: Lang, layer: Layer): string {
  const k0 = getKF(layer, 0);
  const k1 = getKF(layer, 1);

  const type = (layer.type ?? "").trim();
  const look = (layer.look ?? "").trim();
  const shapeDesc = (layer.shapeDesc ?? "").trim();
  const notes = (layer.notes ?? "").trim();

  // ⚠️ UI 已经没有层级/透明度，提示词也不要输出它们
  // const opacity = clamp01(layer.opacity);
  // const z = Number.isFinite(layer.z) ? layer.z : 0;

  if (lang === "zh") {
    return [
      `- ${layer.id}`,
      `主体(type)：${type || "（未填）"}`,
      `外观(look)：${look || "（未填）"}`,
      shapeDesc ? `形状描述：${shapeDesc}` : "",
      // ✅ removed: 层级Z/不透明度
      `起点t0：x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
      `终点t1：x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}`,
      notes ? `约束/备注：${notes}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `- ${layer.id}`,
    `Subject (type): ${type || "(empty)"}`,
    `Look: ${look || "(empty)"}`,
    shapeDesc ? `Shape description: ${shapeDesc}` : "",
    // ✅ removed: Z/Opacity
    `Start t0: x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
    `End   t1: x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}`,
    notes ? `Constraints / notes: ${notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * ✅ FIX: camera/lighting 未选择（空字符串/undefined）时，不输出默认 wide/static/sunset...
 * 以前用 `|| "wide"` 之类会导致“未知”也被强行显示成默认值。
 */
function formatScenePrompt(lang: Lang, scene: Scene, idx: number): string {
  const camera = (scene.camera ?? {}) as any;
  const lighting = (scene.lighting ?? {}) as any;

  const bg = parseBg(scene.notes ?? "");
  const duration = Number.isFinite(scene.duration_s) ? Math.round(scene.duration_s) : 0;

  // ✅ 空字符串/未填 -> 视为“未知”，不输出
  const shot = typeof camera.shot === "string" ? camera.shot.trim() : "";
  const movement = typeof camera.movement === "string" ? camera.movement.trim() : "";

  const time = typeof lighting.time === "string" ? lighting.time.trim() : "";
  const keyDir = typeof lighting.key_dir === "string" ? lighting.key_dir.trim() : "";
  const mood = typeof lighting.mood === "string" ? lighting.mood.trim() : "";

  const layerLines = (scene.layers ?? [])
    .slice()
    // NOTE: z is still used for sorting if present in data, but we do NOT output it.
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0))
    .map((l) => formatLayerLine(lang, l))
    .join("\n\n");

  if (lang === "zh") {
    const header = `# 分镜 ${idx + 1}: ${scene.name || scene.id}（${duration}秒）`;

    const cameraLine =
      shot || movement ? `摄像机：${[shot ? `景别=${shot}` : "", movement ? `运动=${movement}` : ""].filter(Boolean).join("，")}` : "";

    const lightingLine =
      time || keyDir || mood
        ? `光照：${[time ? `时间=${time}` : "", keyDir ? `主光=${keyDir}` : "", mood ? `氛围=${mood}` : ""]
            .filter(Boolean)
            .join("，")}`
        : "";

    const sceneMeta = [bg ? `背景：${bg}` : "", cameraLine, lightingLine].filter(Boolean).join("\n");

    return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
  }

  const header = `# Scene ${idx + 1}: ${scene.name || scene.id} (${duration}s)`;

  const cameraLine =
    shot || movement
      ? `Camera: ${[shot ? `shot=${shot}` : "", movement ? `movement=${movement}` : ""].filter(Boolean).join(", ")}`
      : "";

  const lightingLine =
    time || keyDir || mood
      ? `Lighting: ${[time ? `time=${time}` : "", keyDir ? `key=${keyDir}` : "", mood ? `mood=${mood}` : ""]
          .filter(Boolean)
          .join(", ")}`
      : "";

  const sceneMeta = [bg ? `Background: ${bg}` : "", cameraLine, lightingLine].filter(Boolean).join("\n");

  return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
}

type MediaMode = "image" | "video";

/* -------------------- Machine Notes (unchanged) -------------------- */

function machineNotesImage(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（以下为机器语言，可忽略。用于让模型理解 ScenePilot 坐标与透视规则。）",
      "",
      "【坐标系 / Frame】",
      "- 画面是一个矩形帧（最终输出图像）。",
      "- 原点在左上角；X 向右增大；Y 向下增大。",
      "- ScenePilot 的 x,y,w,h 默认是“屏幕百分比(0–100)”。",
      "  - 例如：x=50 表示画面宽度的 50% 位置；y=50 表示画面高度的 50% 位置。",
      "  - w/h 是对象在画面中占据的宽/高百分比（不是世界单位）。",
      "- rot 是平面旋转角（单位：度）。",
      "",
      "【从百分比到像素 / Percent → Pixels】",
      "- 若最终渲染分辨率为 (Wpx × Hpx)：",
      "  - x_px = x/100 * Wpx",
      "  - y_px = y/100 * Hpx",
      "  - w_px = w/100 * Wpx",
      "  - h_px = h/100 * Hpx",
      "",
      "【锚点 / Anchor】",
      "- 默认把 (x,y) 视为对象“中心点”。除非用户明确说是左上角锚点。",
      "- 尽量让主体完整落在画面内；除非备注允许裁切出框。",
      "",
      "【大小与远近 / Size & Depth】",
      "- 同类物体：w/h 更大 ⇒ 更靠近镜头；w/h 更小 ⇒ 更远。",
      "- 若需要透视一致：远处更小、更雾化、细节更少；近处更清晰。",
      "",
      "【地平线与透视策略 / Horizon & Perspective】",
      "- 若场景中存在地平线（例如：海平面、城市天际线、地面平面），它代表“眼平线”。",
      "- 地平线附近的物体通常更远更小；地面平面上，越靠近画面下方通常越近（可配合更大尺寸）。",
      "- 任何透视变化必须与 x/y 位置和 w/h 大小变化一致，避免违和。",
      "",
      "【屏幕比例 / Aspect Ratio】",
      "- 若画面为 16:9 / 9:16 / 1:1 等比例，请按最终比例解释 x/y/w/h；不要把对象挤压变形。",
      "",
      "【禁止坐标泄露 / No Coordinate Leakage】",
      "- 不要把 x,y,w,h,rot 数字作为可见文字写进画面、字幕或描述中。",
      "- 这些数字只用于内部布局对齐。",
      ""
    ].join("\n");
  }

  return [
    "(Machine Notes — you can ignore. This is for aligning ScenePilot coordinates & perspective.)",
    "",
    "[Frame / Coordinate System]",
    "- The output is a rectangular frame (final image).",
    "- Origin is top-left; X increases to the right; Y increases downward.",
    "- ScenePilot x,y,w,h are screen percentages by default (0–100).",
    "  - Example: x=50 means 50% of frame width; y=50 means 50% of frame height.",
    "  - w/h are the object's on-screen width/height percentages (not world units).",
    "- rot is a 2D rotation in degrees.",
    "",
    "[Percent → Pixels]",
    "- For final render resolution (Wpx × Hpx):",
    "  - x_px = x/100 * Wpx",
    "  - y_px = y/100 * Hpx",
    "  - w_px = w/100 * Wpx",
    "  - h_px = h/100 * Hpx",
    "",
    "[Anchor]",
    "- Treat (x,y) as the object's center by default unless explicitly stated otherwise.",
    "- Keep subjects inside the frame unless notes allow cropping.",
    "",
    "[Size & Depth]",
    "- For similar objects: larger w/h ⇒ closer; smaller w/h ⇒ farther.",
    "- Keep perspective consistent: distant objects smaller, hazier, less detailed; near objects sharper.",
    "",
    "[Horizon & Perspective Heuristics]",
    "- If a horizon exists (sea line, skyline, ground plane), treat it as eye level.",
    "- Objects near the horizon tend to feel farther/smaller; on a ground plane, lower in frame often feels closer (with larger size).",
    "- Any perspective change must remain consistent with x/y placement and w/h scaling.",
    "",
    "[Aspect Ratio]",
    "- Respect the final aspect ratio (16:9, 9:16, 1:1, etc.). Do not distort objects.",
    "",
    "[No Coordinate Leakage]",
    "- Do NOT render x,y,w,h,rot numbers as visible text in the image/subtitles/descriptions.",
    "- Use them internally for layout only.",
    ""
  ].join("\n");
}

function machineNotesVideo(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（以下为机器语言，可忽略。用于让模型理解 ScenePilot 视频坐标、关键帧与运动规则。）",
      "",
      "【坐标系 / Frame】",
      "- 与图片一致：原点左上；X→右；Y→下。",
      "- ScenePilot 的 x,y,w,h 默认是屏幕百分比(0–100)；rot 为度。",
      "",
      "【关键帧 / Keyframes】",
      "- 每个对象提供起点 t0 与终点 t1：",
      "  - t0 表示该分镜开始时的布局；t1 表示该分镜结束时的布局。",
      "- 分镜时长为 duration 秒：请把 t0→t1 的变化分摊到整个时长，保持连续。",
      "",
      "【运动插值 / Interpolation】",
      "- 默认使用平滑插值（ease-in-out），除非备注要求匀速或突然变化。",
      "- 轨迹应连贯，不要抖动、不跳帧、不随机改位置。",
      "",
      "【移动轨迹 / Motion Path】",
      "- 位置变化：对象中心从 (x0,y0) 平滑移动到 (x1,y1)。",
      "- 旋转变化：rot0→rot1 平滑过渡（避免忽快忽慢）。",
      "",
      "【运动中大小变化 = 远近变化 / Scale Change as Depth】",
      "- w/h 变大：理解为对象走近镜头/靠近镜头（或镜头推近该主体）。",
      "- w/h 变小：理解为对象远离镜头/走远（或镜头拉远）。",
      "- 若同时移动位置与改变大小：请按透视一致性处理（例如地面平面上走向地平线通常会变小）。",
      "",
      "【从百分比到像素 / Percent → Pixels】",
      "- 若最终渲染分辨率为 (Wpx × Hpx)：",
      "  - x_px = x/100 * Wpx, y_px = y/100 * Hpx, w_px = w/100 * Wpx, h_px = h/100 * Hpx",
      "",
      "【镜头 vs 物体 / Camera vs Object】",
      "- 若 scene.camera.movement 指定镜头运动，则优先视为镜头运动；否则默认镜头静止、物体运动。",
      "- 不要加手持抖动、变焦乱跳等未要求的镜头语言。",
      "",
      "【连续性 / Continuity】",
      "- 同一对象在全程保持一致身份：外观、材质、颜色、细节不要随机漂移。",
      "- 除非备注要求，否则不要新增/删除对象、不要重排构图。",
      "",
      "【禁止坐标泄露 / No Coordinate Leakage】",
      "- 不要把 x,y,w,h,rot 数字作为可见文字写进画面、字幕或描述中。",
      "- 这些数字只用于内部布局与运动对齐。",
      ""
    ].join("\n");
  }

  return [
    "(Machine Notes — you can ignore. This is for aligning ScenePilot video coordinates, keyframes, and motion.)",
    "",
    "[Frame / Coordinate System]",
    "- Same as image: origin top-left; X→right; Y→down.",
    "- ScenePilot x,y,w,h are screen percentages by default (0–100); rot is degrees.",
    "",
    "[Keyframes]",
    "- Each object provides t0 (start) and t1 (end):",
    "  - t0 = layout at the beginning of the scene; t1 = layout at the end of the scene.",
    "- Scene duration is `duration` seconds: distribute changes smoothly across the whole duration.",
    "",
    "[Interpolation]",
    "- Default to smooth cinematic easing (ease-in-out) unless notes demand linear/step.",
    "- Motion must be continuous: no jitter, no jumping, no random re-positioning.",
    "",
    "[Motion Path]",
    "- Position: move the object center from (x0,y0) to (x1,y1) smoothly.",
    "- Rotation: interpolate rot0→rot1 smoothly (avoid sudden speed changes).",
    "",
    "[Scale Change as Depth]",
    "- Increasing w/h: interpret as moving toward camera (or camera pushing in on the subject).",
    "- Decreasing w/h: interpret as moving away (or camera pulling back).",
    "- If position + scale both change: keep them perspective-consistent (e.g., moving toward the horizon often shrinks on a ground plane).",
    "",
    "[Percent → Pixels]",
    "- For final render resolution (Wpx × Hpx):",
    "  - x_px = x/100 * Wpx, y_px = y/100 * Hpx, w_px = w/100 * Wpx, h_px = h/100 * Hpx",
    "",
    "[Camera vs Object Motion]",
    "- If scene.camera.movement defines camera motion, treat it as camera behavior; otherwise assume camera is static and objects move.",
    "- Do NOT add handheld shake or random zoom unless requested.",
    "",
    "[Continuity]",
    "- Keep each object's identity stable across frames: appearance, materials, details should not drift.",
    "- Do not add/remove/re-layout objects unless explicitly required.",
    "",
    "[No Coordinate Leakage]",
    "- Do NOT render x,y,w,h,rot numbers as visible on-screen text/subtitles/stickers.",
    "- Use them internally for layout and motion only.",
    ""
  ].join("\n");
}

/* -------------------- System Auto Extensions (tail-only) -------------------- */

const STAB_MARK = "stability:";

function parseStability(notes: string): "on" | "off" {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(STAB_MARK));
  if (!hit) return "on"; // ✅ default ON
  const v = hit.trim().slice(STAB_MARK.length).trim().toLowerCase();
  return v === "off" ? "off" : "on";
}

/** 当前导出通常只有一个 scene，但这里写稳：只要存在 off 就不追加 */
function shouldAppendStability(project: Project): boolean {
  const scenes = project?.scenes ?? [];
  for (const s of scenes) {
    if (parseStability(s?.notes ?? "") === "off") return false;
  }
  return true;
}

function stabilityBlock(lang: Lang, mode: MediaMode): string {
  if (lang === "zh") {
    const lines: string[] = [
      "【系统稳定层 / System Stability Layer】",
      "- 仅用于提高生成成功率：不修改任何坐标/镜头/时间/风格设定。",
      "- 禁止坐标泄露：不要把 x,y,w,h,rot 数字作为可见文字写进画面/字幕/贴纸。",
      "- 透视一致性：同类物体 w/h 更大表示更近；保持远小近大与雾化/清晰逻辑一致。"
    ];
    if (mode === "video") {
      lines.push("- 视频连续性：同一对象在全程保持一致身份（外观/材质/细节不要漂移）；不新增/删除对象，除非备注要求。");
    }
    return lines.join("\n");
  }

  const lines: string[] = [
    "[System Stability Layer]",
    "- Safety only (success-rate booster). Do NOT change any coords/camera/time/style.",
    "- No coordinate leakage: never render x,y,w,h,rot as visible on-screen text/subtitles/stickers.",
    "- Perspective consistency: larger w/h implies closer for similar objects; keep depth cues consistent."
  ];
  if (mode === "video") {
    lines.push("- Video continuity: keep object identity stable across frames; do not add/remove objects unless requested.");
  }
  return lines.join("\n");
}

/* -------------------- Exposure Fix Layer (tail-only) -------------------- */

function shouldAppendExposureFix(project: Project): boolean {
  const scenes = project?.scenes ?? [];
  for (const s of scenes) {
    const bg = parseBg(s?.notes ?? "").toLowerCase();
    const lighting: any = (s as any).lighting ?? {};
    const time = String(lighting.time ?? "").toLowerCase();
    const mood = String(lighting.mood ?? "").toLowerCase();

    const layers = (s.layers ?? []) as Layer[];
    const textBag = [
      bg,
      time,
      mood,
      ...layers.map((l) => `${l.look ?? ""} ${l.notes ?? ""} ${l.shapeDesc ?? ""}`.toLowerCase())
    ].join(" ");

    const hasInterior = /hotel|suite|room|interior|apartment|indoors|室内|酒店|套房|房间/.test(textBag);
    const hasWindow = /window|窗|落地窗|窗外|city view|skyline/.test(textBag);
    const riskyTime = /sunset|dusk|night|blue_hour|evening|黄昏|日落|夜/.test(textBag) || /sunset|night|blue_hour/.test(time);
    const silhouetteCue = /silhouette|剪影/.test(textBag);
    const dramaticCue = /dramatic lighting|high contrast|noir|cinematic/.test(textBag);

    if ((hasInterior && hasWindow && (riskyTime || dramaticCue)) || silhouetteCue) return true;
  }
  return false;
}

function exposureFixBlock(lang: Lang): string {
  if (lang === "zh") {
    return [
      "【曝光/室内可读性修正层 / Exposure Fix Layer】",
      "- 目标：避免室内主体“死黑/黑屏”，保持窗外与室内同时可读（HDR-like）。",
      "- 室内人物必须可见细节：抬高暗部、避免压死黑位（no crushed shadows）。",
      "- 允许打开室内灯光：暖色台灯/顶灯/壁灯；允许柔和补光（soft fill/bounce）。",
      "- 保留电影感但降低极端对比：不要把人物做成纯黑剪影（除非明确要求剪影风格）。",
      "- 窗外高光不过曝：保留窗外景深与层次，同时保留人物肤色与衣物纹理。"
    ].join("\n");
  }

  return [
    "[Exposure Fix Layer]",
    "- Goal: avoid crushed blacks / near-black frames; keep interior subjects readable while preserving the window view (HDR-like).",
    "- Lift shadows; no crushed blacks. Subjects must retain visible midtones and detail.",
    "- Allow practical lights (lamps/ceiling lights) and soft fill/bounce light.",
    "- Keep cinematic mood but avoid pure silhouette unless explicitly requested.",
    "- Protect highlights: avoid blown-out windows while keeping subject texture."
  ].join("\n");
}

/* -------------------- Language Reinforcement Layer (tail-only) -------------------- */

/**
 * Map x/y/w/h into natural language regions and scale hints.
 * This is a soft-to-strong constraint layer for diffusion/video models (not a renderer).
 * Tail-only. Does NOT modify the user's structure.
 */

function bucketX(x: number) {
  const v = n1(x);
  if (v <= 10) return { key: "hard-left", en: "hard-left edge", zh: "贴左边缘" };
  if (v <= 22) return { key: "left-edge", en: "left edge area", zh: "左侧边缘区" };
  if (v <= 35) return { key: "left-third", en: "left third", zh: "左三分区" };
  if (v <= 45) return { key: "slightly-left", en: "slightly left of center", zh: "略左于中心" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-right", en: "slightly right of center", zh: "略右于中心" };
  if (v <= 78) return { key: "right-third", en: "right third", zh: "右三分区" };
  if (v <= 90) return { key: "right-edge", en: "right edge area", zh: "右侧边缘区" };
  return { key: "hard-right", en: "hard-right edge", zh: "贴右边缘" };
}

function bucketY(y: number) {
  const v = n1(y);
  if (v <= 10) return { key: "top-edge", en: "top edge", zh: "贴上边缘" };
  if (v <= 22) return { key: "upper-area", en: "upper area", zh: "上部区域" };
  if (v <= 35) return { key: "upper-third", en: "upper third", zh: "上三分区" };
  if (v <= 45) return { key: "slightly-up", en: "slightly above center", zh: "略上于中心" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-down", en: "slightly below center", zh: "略下于中心" };
  if (v <= 78) return { key: "lower-third", en: "lower third", zh: "下三分区" };
  if (v <= 90) return { key: "near-bottom", en: "near bottom", zh: "靠近下方" };
  return { key: "bottom-edge", en: "bottom edge", zh: "贴下边缘" };
}

function sizeLabel(w: number, h: number, lang: Lang) {
  const ww = n1(w);
  const hh = n1(h);
  const s = Math.max(ww, hh);
  let tagEn = "medium";
  let tagZh = "中等";
  if (s < 12) (tagEn = "small"), (tagZh = "偏小");
  else if (s < 18) (tagEn = "medium-small"), (tagZh = "中小");
  else if (s < 26) (tagEn = "medium"), (tagZh = "中等");
  else if (s < 34) (tagEn = "medium-large"), (tagZh = "中大");
  else if (s < 50) (tagEn = "large"), (tagZh = "偏大");
  else (tagEn = "very large"), (tagZh = "很大");
  return lang === "zh"
    ? `尺寸：${tagZh}（约占画面宽 ${ww}% / 高 ${hh}%）`
    : `Size: ${tagEn} (occupies ~${ww}% frame width / ~${hh}% frame height)`;
}

function marginHint(x: number, y: number, lang: Lang) {
  const xx = n1(x);
  const yy = n1(y);
  const parts: string[] = [];
  if (lang === "zh") {
    if (xx < 15) parts.push("左侧留白小（靠左但不要出框）");
    if (xx > 85) parts.push("右侧留白小（靠右但不要出框）");
    if (yy < 15) parts.push("上方留白小（靠上但不要出框）");
    if (yy > 85) parts.push("下方留白小（靠下但不要出框）");
    return parts.length ? `边距：${parts.join("；")}` : "";
  }
  if (xx < 15) parts.push("small left margin (close to left border, stay in-frame)");
  if (xx > 85) parts.push("small right margin (close to right border, stay in-frame)");
  if (yy < 15) parts.push("small top margin (close to top border, stay in-frame)");
  if (yy > 85) parts.push("small bottom margin (close to bottom border, stay in-frame)");
  return parts.length ? `Margins: ${parts.join("; ")}` : "";
}

function anchorHintFromNotes(notes: string, lang: Lang) {
  const bag = (notes ?? "").toLowerCase();
  const hasLie = /lie|lying|reclining|laying|躺|卧|斜躺/.test(bag);
  const hasSit = /sit|seated|sitting|坐|坐着|坐在/.test(bag);
  const hasChair = /chair|stool|armchair|椅|座椅/.test(bag);
  const hasFloor = /floor|ground|on the floor|地上|坐地|席地/.test(bag);

  if (lang === "zh") {
    if (hasLie) return "锚点：躺姿以躯干中心对齐（不要因为沙发/地面接触自动改位置）";
    if (hasSit && hasChair) return "锚点：坐姿以臀部/座面接触点对齐（不要自动重新居中）";
    if (hasSit && hasFloor) return "锚点：坐地以臀部着地点对齐（保持在画面下部区域）";
    if (hasSit) return "锚点：坐姿保持重心稳定（不要自动移动到中心）";
    return "锚点：默认以主体中心点对齐（不要自动重新布局）";
  }

  if (hasLie) return "Anchor: reclining pose; align using torso center (do not shift due to sofa/floor contact).";
  if (hasSit && hasChair) return "Anchor: seated on chair; align using hips/seat contact point (do not auto-center).";
  if (hasSit && hasFloor) return "Anchor: seated on floor; align using hips grounded point (keep in lower frame region).";
  if (hasSit) return "Anchor: seated posture; keep center-of-mass stable (do not auto-move to center).";
  return "Anchor: treat (x,y) as subject center (do not auto re-layout).";
}

function silhouetteGuard(look: string, notes: string, lang: Lang) {
  const bag = `${look ?? ""} ${notes ?? ""}`.toLowerCase();
  const explicitSilhouette = /silhouette only|outline-only|纯剪影|只要剪影|仅剪影|轮廓化/.test(bag);
  const hasSilhouetteCue = /silhouette|outline-only|剪影|轮廓/.test(bag);

  // 如果用户明确要求剪影，就不反向纠偏
  if (explicitSilhouette) return "";

  // 出现过 silhouette/轮廓 等词，就给一条强提醒，避免模型变成纯黑剪影
  if (hasSilhouetteCue) {
    return lang === "zh"
      ? "可见性：不要生成纯剪影/纯轮廓；必须保留人物面部与衣物/皮肤细节（除非备注明确要求剪影）。"
      : "Visibility: do NOT render pure silhouette/outline-only; keep facial/clothing/skin details visible unless explicitly requested.";
  }

  return "";
}

function buildLRLForScene(lang: Lang, mode: MediaMode, scene: Scene, idx: number): string {
  const layers = (scene.layers ?? []) as Layer[];
  if (!layers.length) return "";

  const title =
    lang === "zh"
      ? `【语言强化层 / Language Reinforcement Layer】— 分镜 ${idx + 1}: ${scene.name || scene.id}`
      : `[Language Reinforcement Layer] — Scene ${idx + 1}: ${scene.name || scene.id}`;

  const global =
    lang === "zh"
      ? [
          "Global：",
          "- 不要自动居中主体；不要自动平衡构图（不要为了“好看”而重排）。",
          "- 严格遵守相对位置与边距；各对象保持在其指定区域。",
          "- 不要把人物大小强行拉齐（不要 size equalization）；保持给定 w/h 的相对比例。",
          "- 除非备注允许，否则保持主体完整在画面内（避免无理由裁切）。"
        ].join("\n")
      : [
          "Global:",
          "- Do NOT re-center subjects; do NOT auto-balance the composition (do not rearrange for aesthetics).",
          "- Respect relative positions and margins; keep each subject in its designated region.",
          "- Do NOT equalize character sizes; keep the specified relative w/h scale ratios.",
          "- Keep subjects fully in-frame unless notes explicitly allow cropping."
        ].join("\n");

  const perObj: string[] = [];

  // 仍按 z 排序（但不输出 z）
  const sorted = layers
    .slice()
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0));

  for (const layer of sorted) {
    const k0 = getKF(layer, 0);
    const k1 = getKF(layer, 1);

    const use = mode === "video" ? { a: k0, b: k1 } : { a: k0, b: k0 };
    const type = (layer.type ?? "").trim();
    const look = (layer.look ?? "").trim();
    const notes = (layer.notes ?? "").trim();

    // 只用“更听得懂”的区域语言 + 比例语言
    const xB = bucketX(use.a.x);
    const yB = bucketY(use.a.y);

    if (lang === "zh") {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? `（${type}）` : ""}：`);
      lines.push(`- 区域：${xB.zh} + ${yB.zh}（x≈${n1(use.a.x)}%，y≈${n1(use.a.y)}%）`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- ${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        const xB1 = bucketX(use.b.x);
        const yB1 = bucketY(use.b.y);
        lines.push(
          `- 终点区域：${xB1.zh} + ${yB1.zh}（x≈${n1(use.b.x)}%，y≈${n1(use.b.y)}%）；保持 t0→t1 连续移动，不跳帧不抖动。`
        );
        lines.push(`- 终点尺寸：约占画面宽 ${n1(use.b.w)}% / 高 ${n1(use.b.h)}%（不要为了构图把大小拉齐）。`);
      }

      // 对用户备注做“保留语义”强调（不改变内容，只提醒模型优先级）
      if (notes) lines.push(`- 备注优先：${notes}`);

      perObj.push(lines.join("\n"));
    } else {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? ` (${type})` : ""}:`);
      lines.push(`- Region: ${xB.en} + ${yB.en} (x≈${n1(use.a.x)}%, y≈${n1(use.a.y)}%)`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- ${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        const xB1 = bucketX(use.b.x);
        const yB1 = bucketY(use.b.y);
        lines.push(
          `- End region: ${xB1.en} + ${yB1.en} (x≈${n1(use.b.x)}%, y≈${n1(use.b.y)}%); keep continuous motion from t0→t1 (no jitter/no jumps).`
        );
        lines.push(`- End size: ~${n1(use.b.w)}% width / ~${n1(use.b.h)}% height (do not equalize sizes for composition).`);
      }

      if (notes) lines.push(`- Notes priority: ${notes}`);

      perObj.push(lines.join("\n"));
    }
  }

  return [title, global, perObj.join("\n")].filter(Boolean).join("\n");
}

function languageReinforcementBlock(lang: Lang, mode: MediaMode, project: Project): string {
  const scenes = project?.scenes ?? [];
  const blocks: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const b = buildLRLForScene(lang, mode, scenes[i], i);
    if (b.trim()) blocks.push(b.trim());
  }
  if (!blocks.length) return "";

  // 统一标题（可让用户一眼知道是系统尾部干涉）
  if (lang === "zh") {
    return [
      "【语言强化层 / Language Reinforcement Layer】",
      "- 目的：把 x/y/w/h 转成模型更容易遵守的空间语言；提高“坐标服从度”。",
      "- 原则：不改用户结构，只做尾部强制干涉；禁止自动居中/自动平衡/自动等比缩放。",
      "",
      ...blocks
    ].join("\n");
  }

  return [
    "[Language Reinforcement Layer]",
    "- Purpose: translate x/y/w/h into spatial natural language for better compliance.",
    "- Rule: tail-only enforcement; do not change user structure; no re-center / no auto-balance / no size equalization.",
    "",
    ...blocks
  ].join("\n");
}

/**
 * ✅ Unified tail block:
 * - starts with a "Machine Notes" marker so ExportPanel can gray it
 * - contains: (optional) Stability + (optional) ExposureFix + (LRL) + Machine Notes
 */
function appendUnifiedTail(prompt: string, lang: Lang, mode: MediaMode, project: Project): string {
  const machine = mode === "video" ? machineNotesVideo(lang) : machineNotesImage(lang);

  const parts: string[] = [];
  const machineLines = machine.split("\n");
  const marker = (machineLines[0] ?? "").trim();
  const machineBody = machineLines.slice(1).join("\n").trimEnd();

  parts.push(marker);

  if (shouldAppendStability(project)) {
    parts.push("", stabilityBlock(lang, mode));
  }
  if (shouldAppendExposureFix(project)) {
    parts.push("", exposureFixBlock(lang));
  }

  // ✅ NEW: Language Reinforcement Layer (tail-only)
  const lrl = languageReinforcementBlock(lang, mode, project);
  if (lrl.trim()) {
    parts.push("", lrl.trim());
  }

  if (machineBody) {
    parts.push("", machineBody);
  }

  return [prompt.trimEnd(), "", parts.join("\n").trimEnd()].join("\n");
}

export function generatePrompts(project: Project, lang: Lang, mode: MediaMode = "image"): string {
  const scenes = project?.scenes ?? [];

  if (!scenes.length) {
    return lang === "zh" ? "（无分镜）" : "(no scenes)";
  }

  const out: string[] = [];

  if (lang === "zh") {
    out.push(
      [
        "你将根据以下分镜结构生成图像/视频画面。",
        "要求：严格遵守每个对象的 type / look / 形状描述 / 起点终点坐标与尺寸 / 备注约束。"
      ].join("\n")
    );
  } else {
    out.push(
      [
        "Generate visuals following the storyboard below.",
        "Follow each object's type / look / shape description / start-end layout / constraints."
      ].join("\n")
    );
  }

  scenes.forEach((s, i) => {
    out.push(formatScenePrompt(lang, s, i));
  });

  const prompt = out.join("\n\n---\n\n");
  return appendUnifiedTail(prompt, lang, mode, project);
}