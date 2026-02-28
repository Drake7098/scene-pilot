import type { Lang } from "../i18n";
import type { Project, Scene, Layer, LayerKF } from "../model";

/**
 * ScenePilot prompts generator
 * ✅ Never mention layer.color (UI doesn't expose it)
 *
 * ✅ Tail block (always appended):
 * - System Structural Control Layer (machine notes / coordinate guide)  ✅ ALWAYS ON (no toggle)
 * - Language Reinforcement Layer (LRL)                                 ✅ ALWAYS ON (no toggle)
 * - Exposure Fix Layer (auto, heuristic)                               ✅ auto
 * - System Stability Layer                                             ✅ per-scene toggle via `stability: on|off` (default: on)
 *
 * ✅ IMPORTANT (behavior unchanged):
 * - "Stability" switch only controls the Stability layer.
 * - Coordinate machine-notes + LRL are core and always appended (no switch).
 * - Media mode (image/video) is parsed PER SCENE from `scene.notes` marker `media: image|video`.
 *   - image scene: outputs t0 only, no seconds in header
 *   - video scene: outputs t0/t1 and seconds in header
 *
 * ✅ 文案优化（极限压缩尾部注意力干扰）：
 * - 尾部所有系统层都“短句、少行、少重复”
 * - LRL 不重复坐标数字；静止对象不再写“连续移动”
 * - 避免 silhouette 语义冲突：将其解释为“轮廓清晰但仍保留细节”
 */

function clamp01(v: number) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}
function n1(v: number) {
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
 * 从 scene.notes 提取 bg: 背景（隐藏标记）
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

/* -------------------- Media Mode (per-scene) -------------------- */

type MediaMode = "image" | "video";
const MEDIA_MARK = "media:";

function parseMedia(notes: string): MediaMode {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(MEDIA_MARK));
  if (!hit) return "video"; // default: video for old scenes
  const v = hit.trim().slice(MEDIA_MARK.length).trim().toLowerCase();
  return v === "image" ? "image" : "video";
}

/* -------------------- Stability Toggle (per-scene) -------------------- */

const STAB_MARK = "stability:";

function parseStability(notes: string): "on" | "off" {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(STAB_MARK));
  if (!hit) return "on"; // default ON
  const v = hit.trim().slice(STAB_MARK.length).trim().toLowerCase();
  return v === "off" ? "off" : "on";
}

function shouldAppendStabilityForScene(scene: Scene): boolean {
  return parseStability(scene?.notes ?? "") !== "off";
}

/* -------------------- Layer / Scene formatting -------------------- */

function formatLayerLine(lang: Lang, layer: Layer, mode: MediaMode): string {
  const k0 = getKF(layer, 0);
  const k1 = getKF(layer, 1);

  const type = (layer.type ?? "").trim();
  const look = (layer.look ?? "").trim();
  const shapeDesc = (layer.shapeDesc ?? "").trim();
  const notes = (layer.notes ?? "").trim();

  // ⚠️ UI 已经没有层级/透明度，提示词也不要输出它们
  void clamp01;

  if (lang === "zh") {
    const base = [
      `- ${layer.id}`,
      `主体(type)：${type || "（未填）"}`,
      `外观(look)：${look || "（未填）"}`,
      shapeDesc ? `形状描述：${shapeDesc}` : "",
      `起点t0：x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
      mode === "video" ? `终点t1：x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}` : "",
      notes ? `约束/备注：${notes}` : ""
    ];
    return base.filter(Boolean).join("\n");
  }

  const base = [
    `- ${layer.id}`,
    `Subject (type): ${type || "(empty)"}`,
    `Look: ${look || "(empty)"}`,
    shapeDesc ? `Shape description: ${shapeDesc}` : "",
    `Start t0: x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
    mode === "video" ? `End   t1: x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}` : "",
    notes ? `Constraints / notes: ${notes}` : ""
  ];
  return base.filter(Boolean).join("\n");
}

/**
 * ✅ FIX: camera/lighting 未选择（空字符串/undefined）时，不输出默认 wide/static/sunset...
 */
function formatScenePrompt(lang: Lang, scene: Scene, idx: number): string {
  const camera = (scene.camera ?? {}) as any;
  const lighting = (scene.lighting ?? {}) as any;

  const bg = parseBg(scene.notes ?? "");
  const duration = Number.isFinite(scene.duration_s) ? Math.round(scene.duration_s) : 0;

  const mode: MediaMode = parseMedia(scene?.notes ?? "");

  const shot = typeof camera.shot === "string" ? camera.shot.trim() : "";
  const movement = typeof camera.movement === "string" ? camera.movement.trim() : "";

  const time = typeof lighting.time === "string" ? lighting.time.trim() : "";
  const keyDir = typeof lighting.key_dir === "string" ? lighting.key_dir.trim() : "";
  const mood = typeof lighting.mood === "string" ? lighting.mood.trim() : "";

  const layerLines = (scene.layers ?? [])
    .slice()
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0))
    .map((l) => formatLayerLine(lang, l, mode))
    .join("\n\n");

  if (lang === "zh") {
    const header =
      mode === "video"
        ? `# ${scene.name || scene.id}（${duration}秒）`
        : `# ${scene.name || scene.id}`;

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

  const header =
    mode === "video"
      ? `# ${scene.name || scene.id} (${duration}s)`
      : `# ${scene.name || scene.id}`;

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

/* -------------------- System Structural Control Layer (ALWAYS ON) -------------------- */
/** 极限压缩：只保留“必须知道的” */
function machineNotesImage(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（系统追加结构控制层）",
      "",
      "【坐标/锚点】x,y,w,h 为屏幕百分比(0–100)；原点左上；(x,y) 默认主体中心；rot 为度。",
      "【约束】保持主体在画面内（除非备注允许裁切）；远小近大与透视一致；禁止把数字画进画面/字幕。"
    ].join("\n");
  }

  return [
    "(System Structural Control Layer)",
    "",
    "[Coords/Anchor] x,y,w,h are frame percentages (0–100); origin top-left; (x,y)=center by default; rot in degrees.",
    "[Rules] Keep subjects in-frame unless allowed; keep perspective consistent; never render numbers as visible text."
  ].join("\n");
}

function machineNotesVideo(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（系统结构控制层）",
      "",
      "【坐标】同图片：x,y,w,h 为屏幕百分比；rot 为度；原点左上。",
      "【视频】t0→t1 覆盖整个时长；默认平滑插值；无抖动/无跳帧/不随机改位。",
      "【约束】连续性（身份不漂移、无增删对象）；禁止把数字画进画面/字幕。"
    ].join("\n");
  }

  return [
    "(System Structural Control Layer)",
    "",
    "[Coords] Same as image: frame percentages; rot degrees; origin top-left.",
    "[Video] Apply t0→t1 across duration with smooth easing; no jitter/jumps/random re-layout.",
    "[Rules] Keep identity stable; no add/remove objects unless requested; never render numbers as visible text."
  ].join("\n");
}

/* -------------------- System Stability Layer (TOGGLE ONLY THIS) -------------------- */
/** 极限压缩：避免与 machine-notes 重复太多 */
function stabilityBlock(lang: Lang, mode: MediaMode): string {
  if (lang === "zh") {
    const lines: string[] = [
      "【系统稳定层】仅提成功率：不改坐标/镜头/时间/风格；禁止坐标数字可视化；透视一致。"
    ];
    if (mode === "video") {
      lines.push("【视频补充】身份不漂移；无增删对象；无无意义抖动。");
    }
    return lines.join("\n");
  }

  const lines: string[] = [
    "[Stability Layer] Success booster only: do not change coords/camera/time/style; no visible coordinate text; keep perspective consistent."
  ];
  if (mode === "video") {
    lines.push("[Video] Keep identity stable; do not add/remove objects; no jitter.");
  }
  return lines.join("\n");
}

/* -------------------- Exposure Fix Layer (auto) -------------------- */
/** 文案略压缩，但保留意图 */
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
      "【曝光修正层】室内+窗景：主体暗部要可读（不压死黑）；允许补光/室内灯；窗外不过曝；除非明确要求，不做纯剪影。"
    ].join("\n");
  }

  return [
    "[Exposure Fix] Interior+window: keep subjects readable (no crushed blacks); allow fill/practical lights; protect window highlights; avoid pure silhouette unless requested."
  ].join("\n");
}

/* -------------------- Language Reinforcement Layer (ALWAYS ON) -------------------- */
/** 极限压缩：不再输出任何坐标数字；对象静止时不写“连续移动” */

function bucketX(x: number) {
  const v = n1(x);
  if (v <= 10) return { key: "hard-left", en: "hard-left", zh: "贴左边缘" };
  if (v <= 22) return { key: "left-edge", en: "left edge", zh: "左边缘区" };
  if (v <= 35) return { key: "left-third", en: "left third", zh: "左三分区" };
  if (v <= 45) return { key: "slightly-left", en: "slightly left", zh: "略左" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-right", en: "slightly right", zh: "略右" };
  if (v <= 78) return { key: "right-third", en: "right third", zh: "右三分区" };
  if (v <= 90) return { key: "right-edge", en: "right edge", zh: "右边缘区" };
  return { key: "hard-right", en: "hard-right", zh: "贴右边缘" };
}

function bucketY(y: number) {
  const v = n1(y);
  if (v <= 10) return { key: "top-edge", en: "top edge", zh: "贴上边缘" };
  if (v <= 22) return { key: "upper-area", en: "upper", zh: "上部" };
  if (v <= 35) return { key: "upper-third", en: "upper third", zh: "上三分区" };
  if (v <= 45) return { key: "slightly-up", en: "slightly up", zh: "略上" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-down", en: "slightly down", zh: "略下" };
  if (v <= 78) return { key: "lower-third", en: "lower third", zh: "下三分区" };
  if (v <= 90) return { key: "near-bottom", en: "near bottom", zh: "靠下" };
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
  return lang === "zh" ? `${tagZh}` : `${tagEn}`;
}

function marginHint(x: number, y: number, lang: Lang) {
  const xx = n1(x);
  const yy = n1(y);
  const parts: string[] = [];
  if (lang === "zh") {
    if (xx < 15) parts.push("靠左别出框");
    if (xx > 85) parts.push("靠右别出框");
    if (yy < 15) parts.push("靠上别出框");
    if (yy > 85) parts.push("靠下别出框");
    return parts.length ? `边距：${parts.join("；")}` : "";
  }
  if (xx < 15) parts.push("close-left, stay in-frame");
  if (xx > 85) parts.push("close-right, stay in-frame");
  if (yy < 15) parts.push("close-top, stay in-frame");
  if (yy > 85) parts.push("close-bottom, stay in-frame");
  return parts.length ? `Margins: ${parts.join("; ")}` : "";
}

function anchorHintFromNotes(notes: string, lang: Lang) {
  const bag = (notes ?? "").toLowerCase();
  const hasLie = /lie|lying|reclining|laying|躺|卧|斜躺/.test(bag);
  const hasSit = /sit|seated|sitting|坐|坐着|坐在/.test(bag);
  const hasChair = /chair|stool|armchair|椅|座椅/.test(bag);
  const hasFloor = /floor|ground|on the floor|地上|坐地|席地/.test(bag);

  if (lang === "zh") {
    if (hasLie) return "锚点：躺姿对齐躯干中心（别自动挪位）";
    if (hasSit && hasChair) return "锚点：坐姿对齐座面接触点（别自动居中）";
    if (hasSit && hasFloor) return "锚点：坐地对齐着地点（保持下部）";
    if (hasSit) return "锚点：坐姿重心稳定（别自动居中）";
    return "锚点：默认中心锚点（别自动重排）";
  }

  if (hasLie) return "Anchor: reclining; align torso center (no auto-shift).";
  if (hasSit && hasChair) return "Anchor: seated; align seat contact (no auto-center).";
  if (hasSit && hasFloor) return "Anchor: seated on floor; keep lower region.";
  if (hasSit) return "Anchor: seated; keep COM stable (no auto-center).";
  return "Anchor: center anchor (no auto re-layout).";
}

function silhouetteGuard(look: string, notes: string, lang: Lang) {
  const bag = `${look ?? ""} ${notes ?? ""}`.toLowerCase();
  const explicitSilhouette = /silhouette only|outline-only|纯剪影|只要剪影|仅剪影|轮廓化/.test(bag);
  const hasSilhouetteCue = /silhouette|outline-only|剪影|轮廓/.test(bag);

  if (explicitSilhouette) return "";

  if (hasSilhouetteCue) {
    return lang === "zh"
      ? "可见性：silhouette 解释为“轮廓清晰但保留细节”，不要纯黑剪影（除非明确要求）。"
      : "Visibility: interpret silhouette as clean readable contour with visible detail, not pure black silhouette unless requested.";
  }

  return "";
}

function buildLRLForScene(lang: Lang, mode: MediaMode, scene: Scene): string {
  const layers = (scene.layers ?? []) as Layer[];
  if (!layers.length) return "";

  const title =
    lang === "zh"
      ? `— 当前分镜：${scene.name || scene.id}`
      : `— Current scene: ${scene.name || scene.id}`;

  const global =
    lang === "zh"
      ? ["Global：", "- 不要自动居中/平衡构图；不要自动等比拉齐大小；保持相对位置与边距。"].join("\n")
      : ["Global:", "- No auto-center/auto-balance; no size equalization; respect relative layout and margins."].join("\n");

  const perObj: string[] = [];

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

    const xB = bucketX(use.a.x);
    const yB = bucketY(use.a.y);

    // t0==t1 ? 静止
    const noMotion =
      mode === "video" &&
      n1(use.a.x) === n1(use.b.x) &&
      n1(use.a.y) === n1(use.b.y) &&
      n1(use.a.w) === n1(use.b.w) &&
      n1(use.a.h) === n1(use.b.h) &&
      n1(use.a.rot) === n1(use.b.rot);

    if (lang === "zh") {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? `（${type}）` : ""}：`);
      lines.push(`- 区域：${xB.zh} + ${yB.zh}`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- 尺寸：${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        if (noMotion) {
          lines.push("- 运动：t0 与 t1 一致，保持静止（别加抖动/位移/缩放/旋转）。");
        } else {
          const xB1 = bucketX(use.b.x);
          const yB1 = bucketY(use.b.y);
          lines.push(`- 终点：${xB1.zh} + ${yB1.zh}；平滑到位（无跳帧/无抖动）。`);
          lines.push(`- 终点尺寸：${sizeLabel(use.b.w, use.b.h, lang)}（别为了构图拉齐）。`);
        }
      }

      if (notes) lines.push(`- 备注优先：${notes}`);
      perObj.push(lines.join("\n"));
    } else {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? ` (${type})` : ""}:`);
      lines.push(`- Region: ${xB.en} + ${yB.en}`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- Size: ${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        if (noMotion) {
          lines.push("- Motion: t0==t1, keep static (no jitter/shift/scale/rotate).");
        } else {
          const xB1 = bucketX(use.b.x);
          const yB1 = bucketY(use.b.y);
          lines.push(`- End: ${xB1.en} + ${yB1.en}; smooth motion (no jumps/jitter).`);
          lines.push(`- End size: ${sizeLabel(use.b.w, use.b.h, lang)} (no size equalization).`);
        }
      }

      if (notes) lines.push(`- Notes priority: ${notes}`);
      perObj.push(lines.join("\n"));
    }
  }

  return [title, global, perObj.join("\n")].filter(Boolean).join("\n");
}

function languageReinforcementBlock(lang: Lang, project: Project): string {
  const scenes = project?.scenes ?? [];
  const blocks: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const mode = parseMedia(scenes[i]?.notes ?? "");
    const b = buildLRLForScene(lang, mode, scenes[i]);
    if (b.trim()) blocks.push(b.trim());
  }
  if (!blocks.length) return "";

  if (lang === "zh") {
    return [
      "【语言强化层】把布局转成更“听得懂”的空间语言；不重复输出坐标数字；禁止自动居中/平衡/拉齐。",
      ...blocks
    ].join("\n");
  }

  return [
    "[LRL] Spatial enforcement for layout; no coordinate-number repetition; no auto-center/balance/size equalization.",
    ...blocks
  ].join("\n");
}

/**
 * ✅ Unified tail block (single tail for the exported project)
 * - Marker must stay as first line so ExportPanel can gray-split it.
 * - Machine notes + LRL are ALWAYS appended.
 * - Stability is per-scene: only appended if current (exported) scene has stability != off.
 */
function appendUnifiedTail(prompt: string, lang: Lang, project: Project): string {
  const scenes = project?.scenes ?? [];
  const anyVideo = scenes.some((s) => parseMedia(s?.notes ?? "") === "video");
  const mode: MediaMode = anyVideo ? "video" : "image";

  const machine = mode === "video" ? machineNotesVideo(lang) : machineNotesImage(lang);

  const parts: string[] = [];
  const machineLines = machine.split("\n");
  const marker = (machineLines[0] ?? "").trim();
  const machineBody = machineLines.slice(1).join("\n").trimEnd();

  parts.push(marker);

  // ✅ Stability: per-scene (ExportPanel usually exports 1 scene)
  const shouldStab =
    scenes.length <= 1 ? (scenes[0] ? shouldAppendStabilityForScene(scenes[0]) : true) : scenes.some((s) => shouldAppendStabilityForScene(s));

  if (shouldStab) {
    parts.push("", stabilityBlock(lang, mode));
  }

  if (shouldAppendExposureFix(project)) {
    parts.push("", exposureFixBlock(lang));
  }

  // ✅ LRL always ON (no switch)
  const lrl = languageReinforcementBlock(lang, project);
  if (lrl.trim()) {
    parts.push("", lrl.trim());
  }

  // ✅ Machine notes always ON (no switch)
  if (machineBody) {
    parts.push("", machineBody);
  }

  return [prompt.trimEnd(), "", parts.join("\n").trimEnd()].join("\n");
}

/**
 * ✅ generatePrompts(project, lang)
 * - Media mode is per-scene (scene.notes marker).
 */
export function generatePrompts(project: Project, lang: Lang): string {
  const scenes = project?.scenes ?? [];

  if (!scenes.length) {
    return lang === "zh" ? "（无分镜）" : "(no scenes)";
  }

  const out: string[] = [];
  const anyVideo = scenes.some((s) => parseMedia(s?.notes ?? "") === "video");

  if (lang === "zh") {
    out.push(
      [
        `你将根据以下分镜结构生成${anyVideo ? "视频" : "图像"}画面。`,
        "要求：严格遵守已填写的 type / look / 形状描述 / 起点终点坐标与尺寸 / 备注约束；未填写字段可由模型补全，但不得改变结构与坐标。"
      ].join("\n")
    );
  } else {
    out.push(
      [
        `Generate ${anyVideo ? "video" : "image"} visuals following the storyboard below.`,
        "Strictly follow provided type/look/shape/start-end layout/constraints. Empty fields may be completed by the model, but layout and coordinates must not be altered."
      ].join("\n")
    );
  }

  scenes.forEach((s, i) => {
    void i;
    out.push(formatScenePrompt(lang, s, 0));
  });

  const prompt = out.join("\n\n---\n\n");
  return appendUnifiedTail(prompt, lang, project);
}