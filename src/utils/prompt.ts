import type { Lang } from "../i18n";
import type { Project, Scene, Layer, LayerKF } from "../model";

/**
 * ScenePilot prompts generator
 * ✅ Never mention layer.color (UI doesn't expose it)
 * ✅ Append "machine language" coordinate guide at the very end (image/video switch)
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

function formatScenePrompt(lang: Lang, scene: Scene, idx: number): string {
  const camera = scene.camera ?? ({} as any);
  const lighting = scene.lighting ?? ({} as any);

  const bg = parseBg(scene.notes ?? "");
  const duration = Number.isFinite(scene.duration_s) ? Math.round(scene.duration_s) : 0;

  const layerLines = (scene.layers ?? [])
    .slice()
    // NOTE: z is still used for sorting if present in data, but we do NOT output it.
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0))
    .map((l) => formatLayerLine(lang, l))
    .join("\n\n");

  if (lang === "zh") {
    const header = `# 分镜 ${idx + 1}: ${scene.name || scene.id}（${duration}秒）`;
    const sceneMeta = [
      bg ? `背景：${bg}` : "",
      `摄像机：景别=${camera.shot || "wide"}，运动=${camera.movement || "static"}`,
      `光照：时间=${lighting.time || "sunset"}，主光=${lighting.key_dir || "top_right"}，氛围=${lighting.mood || "cinematic"}`
    ]
      .filter(Boolean)
      .join("\n");

    return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
  }

  const header = `# Scene ${idx + 1}: ${scene.name || scene.id} (${duration}s)`;
  const sceneMeta = [
    bg ? `Background: ${bg}` : "",
    `Camera: shot=${camera.shot || "wide"}, movement=${camera.movement || "static"}`,
    `Lighting: time=${lighting.time || "sunset"}, key=${lighting.key_dir || "top_right"}, mood=${lighting.mood || "cinematic"}`
  ]
    .filter(Boolean)
    .join("\n");

  return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
}

type MediaMode = "image" | "video";

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
    "- Do NOT render x,y,w,h,rot numbers as visible text in subtitles/on-screen text/descriptions.",
    "- Use them internally for layout and motion only.",
    ""
  ].join("\n");
}

function appendMachineNotes(prompt: string, lang: Lang, mode: MediaMode): string {
  const notes = mode === "video" ? machineNotesVideo(lang) : machineNotesImage(lang);
  return [prompt.trimEnd(), "", notes.trimEnd()].join("\n");
}

export function generatePrompts(project: Project, lang: Lang, mode: MediaMode = "image"): string {
  const scenes = project?.scenes ?? [];

  if (!scenes.length) {
    return lang === "zh" ? "（无分镜）" : "(no scenes)";
  }

  const out: string[] = [];

  // 可选：在开头给一个统一的“全局约束”
  if (lang === "zh") {
    out.push(
      [
        "你将根据以下分镜结构生成图像/视频画面。",
        "要求：严格遵守每个对象的 type / look / 形状描述 / 起点终点坐标与尺寸 / 备注约束。",
        "注意：不要引用任何颜色字段（color 不在 UI 中）。"
      ].join("\n")
    );
  } else {
    out.push(
      [
        "Generate visuals following the storyboard below.",
        "Follow each object's type / look / shape description / start-end layout / constraints.",
        "Note: Do NOT mention any hidden color field (color is not exposed in UI)."
      ].join("\n")
    );
  }

  scenes.forEach((s, i) => {
    out.push(formatScenePrompt(lang, s, i));
  });

  const prompt = out.join("\n\n---\n\n");
  return appendMachineNotes(prompt, lang, mode);
}