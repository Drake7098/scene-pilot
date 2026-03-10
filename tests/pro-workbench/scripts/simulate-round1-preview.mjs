import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const countArg = Number(args[0]);
const count = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : 12;
const outDir = path.resolve(args[1] || "artifacts/pro-workbench/round1-preview");
const PLATFORM_IDS = ["universal", "midjourney", "runway", "pika", "luma", "krea", "jimeng", "keling", "vidu", "hailuo", "wanx"];

function mulberry32(seed) {
  let value = seed;
  return () => {
    value |= 0;
    value = value + 0x6d2b79f5 | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}

function normalizeUserIntentText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/性感美女/g, "年轻女性")
    .replace(/美女/g, "女性")
    .replace(/帅哥/g, "年轻男性")
    .replace(/性感/g, "有吸引力")
    .trim();
}

function dedupeLines(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const normalized = String(line ?? "").replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function compactObjectLine(line) {
  return String(line ?? "")
    .replace(/^-\s*/, "- ")
    .replace(/；对象局部提示：/g, "，局部：")
    .replace(/。?（仅作用于[^）]+）/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function collectSection(lines, header) {
  const index = lines.findIndex((line) => line.trim() === header);
  if (index < 0) return [];
  const out = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    const cur = String(lines[i] ?? "").trim();
    if (!cur) continue;
    if (
      cur === "Camera Contract:" ||
      cur === "Layout Contract (obey strictly):" ||
      cur === "T0 Frame Spec:" ||
      cur === "T1 Frame Spec:" ||
      cur === "Anti-Director Rules:" ||
      cur === "[END]"
    ) break;
    out.push(cur);
  }
  return out;
}

function buildCompactStructuredPrompt(fullPrompt) {
  const lines = String(fullPrompt ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const sceneLine = lines.find((line) => line.startsWith("Scene:")) ?? "";
  const cameraLines = collectSection(lines, "Camera Contract:")
    .filter((line) => line.startsWith("-"))
    .filter((line) => !/时长|duration|t0|t1/i.test(line))
    .slice(0, 3);
  const layoutLines = collectSection(lines, "Layout Contract (obey strictly):")
    .filter((line) => line.startsWith("-"))
    .filter((line) => !/阈值|density|密度/i.test(line))
    .slice(0, 3);
  const t0Lines = collectSection(lines, "T0 Frame Spec:")
    .filter((line) => line.startsWith("-"))
    .slice(0, 4)
    .map(compactObjectLine);
  const t1Lines = collectSection(lines, "T1 Frame Spec:")
    .filter((line) => line.startsWith("-"))
    .slice(0, 4);

  const sceneMatch = sceneLine.match(/^Scene:\s*(.+?)\.\s*Style:\s*(.+)$/);
  const sceneText = sceneMatch ? sceneMatch[1].trim() : sceneLine.replace(/^Scene:\s*/, "").trim();
  const styleText = sceneMatch ? sceneMatch[2].trim() : "";

  return dedupeLines([
    sceneText ? `Scene: ${sceneText}` : "",
    styleText ? `Style: ${styleText}` : "",
    cameraLines.length ? "Camera:" : "",
    ...cameraLines,
    layoutLines.length ? "Layout:" : "",
    ...layoutLines,
    t0Lines.length ? "Subjects:" : "",
    ...t0Lines,
    t1Lines.length ? "Motion:" : "",
    ...t1Lines,
    "Negative:",
    "- 不新增主体，不重排站位，不自动居中，不切镜。"
  ]).join("\n");
}

const indoorBackgrounds = [
  "酒店房间，暖灰墙面，床头灯和窗帘",
  "办公室会议室，玻璃墙和柔和顶灯",
  "现代公寓客厅，落地窗和木质家具",
  "夜晚餐厅包厢，桌灯和深色墙面"
];
const outdoorBackgrounds = [
  "城市街头，远处霓虹和路灯",
  "空旷街道，背景简洁，远处建筑压低存在感",
  "海边步道，风大，远景开阔",
  "工业园区外侧，冷色金属结构"
];
const subjectPool = [
  { type: "年轻女性", look: "黑色风衣", role: "主角" },
  { type: "年轻男性", look: "灰色夹克", role: "主角" },
  { type: "中年男性", look: "深色衬衫", role: "解释者" },
  { type: "年轻女性", look: "米色连衣裙", role: "对手" },
  { type: "产品经理", look: "简洁商务装", role: "演示者" },
  { type: "侦探", look: "米色风衣", role: "调查者" }
];
const propPool = [
  { type: "产品屏", look: "发光 UI 屏", notes: "保留信息区，不要漂浮" },
  { type: "机械臂", look: "金属质感", notes: "后景辅助对象，不能抢主角" },
  { type: "木桌", look: "浅木桌面", notes: "中景锚点，不要漂浮" },
  { type: "窗户与灯光", look: "大窗和暖灯", notes: "后景可见但不喧宾夺主" }
];
const cameraWords = [
  "单机位，不切镜，保持构图一致",
  "轻微心理逼近，但不要大幅推拉",
  "跟随主体轻微平移，不跳切",
  "静止构图，强调前中后层次"
];
const userIntentBits = [
  "构图要稳",
  "主体别跑丢",
  "别新增无关人物",
  "空间层次要清楚",
  "不要把画面搞成海报摆拍",
  "要像真实镜头抓到的瞬间"
];
const conflictBits = [
  "既要镜头完全静止，又要明显心理逼近",
  "不要切镜，但希望同时看到两个房间完全不同角度",
  "主体保持原位，但又要求快速冲到门外",
  "不要新增人物，但背景里最好再有几个路人加强氛围"
];

function buildLayer(id, item, x, y, w, h, notes = "", externalPrompt = "", t1 = null) {
  const kf0 = { t: 0, x, y, w, h, rot: 0 };
  const kf1 = t1 ? { t: 1, ...t1, rot: t1.rot ?? 0 } : { ...kf0, t: 1 };
  return {
    id,
    type: item.type,
    shape: "rect",
    shapeDesc: item.role ? `${item.role}，姿态自然` : `${item.type}，轮廓清楚`,
    look: item.look,
    z: id.startsWith("主体1") ? 10 : id.startsWith("主体2") ? 20 : 30,
    color: "#b7c3ff",
    opacity: 1,
    kf: [kf0, kf1],
    notes,
    externalPrompt,
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function buildProject(rand, preset, idx) {
  const mediaMode = rand() > 0.58 ? "video" : "image";
  const shotPlan = mediaMode === "video" ? pick(rand, ["single", "continuous", "multicam"]) : "single";
  const sceneTier = pick(rand, ["indoor", "small_plaza", "open_space"]);
  const bg = sceneTier === "indoor" ? pick(rand, indoorBackgrounds) : pick(rand, outdoorBackgrounds);
  const styleMood = pick(rand, ["cinematic", "tense", "clean", "soft", "commercial"]);
  const duration = mediaMode === "video" ? pick(rand, [3, 4, 5, 6, 8]) : 1;
  const mainA = pick(rand, subjectPool);
  const mainB = pick(rand, subjectPool.filter((item) => item.look !== mainA.look));
  const support = pick(rand, propPool);
  const multiObject = rand() > 0.42;
  const conflictMode = rand() > 0.76 ? pick(rand, ["camera", "motion", "count"]) : "none";

  const layers = [
    buildLayer(
      "主体1",
      mainA,
      48,
      56,
      24,
      36,
      mediaMode === "video" ? "主体情绪升级，保持身份连续。" : "主体保持可识别。",
      mediaMode === "video" ? "动作先服从结构，再补局部表演。" : "不要过度摆拍。",
      mediaMode === "video" ? { x: conflictMode === "motion" ? 48 : 56, y: 58, w: 26, h: 38 } : null
    )
  ];

  if (multiObject) {
    layers.push(
      buildLayer(
        "主体2",
        mainB,
        26,
        54,
        20,
        32,
        "与主体1保持关系，不要抢主角。",
        "前后景关系清楚。",
        mediaMode === "video" ? { x: 30, y: 60, w: 18, h: 30 } : null
      )
    );
    layers.push(
      buildLayer(
        "主体3",
        support,
        70,
        42,
        18,
        20,
        support.notes,
        "只作用于材质和局部，不改变对象数量。",
        null
      )
    );
  }

  const userInputRawParts = [
    `${mainA.look}的${mainA.type}${mediaMode === "video" ? "在镜头里有明显情绪变化" : "作为主要主体"}`,
    multiObject ? `旁边还有${mainB.type}，关系要清楚` : "画面主体要稳定",
    sceneTier === "indoor" ? "室内场景，层次不要乱" : "空间要拉开，别压平",
    pick(rand, userIntentBits)
  ];
  if (multiObject && rand() > 0.5) userInputRawParts.push(`${support.type}要保留，但不能抢戏`);
  if (conflictMode !== "none") userInputRawParts.push(pick(rand, conflictBits));
  if (rand() > 0.82) userInputRawParts.push("有个美女在解释，主角快要爆发");

  const sceneNotes = [
    `media: ${mediaMode}`,
    "@compiler: v2",
    `@scene_tier: ${sceneTier}`,
    "@v2_mode: strict",
    "stability: standard",
    `bg: ${bg}`
  ].join("\n");

  const shotNote = conflictMode === "camera"
    ? "镜头理论上保持静止，但用户额外要求心理逼近。"
    : conflictMode === "motion"
      ? "主体结构上位移很小，但用户额外要求快速冲刺。"
      : multiObject
        ? "保持双主体和辅助对象的层次关系。"
        : "保持单主体清晰可识别。";

  const scene = {
    id: `S${String(idx + 1).padStart(2, "0")}`,
    name: mediaMode === "video" ? `分镜 ${idx + 1}` : "主画面",
    duration_s: duration,
    cameraPreset: shotPlan === "continuous" ? "follow" : shotPlan === "multicam" ? "reverse" : "",
    shotNote,
    entryDir: mediaMode === "video" ? pick(rand, ["W", "E", "N"]) : undefined,
    exitDir: mediaMode === "video" ? pick(rand, ["E", "S", "W"]) : undefined,
    camera: {
      shot: pick(rand, ["wide", "medium", "close"]),
      movement: mediaMode === "video" ? pick(rand, ["static", "follow", "push_in"]) : "static",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: conflictMode === "camera" ? 0 : pick(rand, [0, 6, 10]), y: 0, zoom: conflictMode === "camera" ? 1.1 : pick(rand, [1, 1.03, 1.08]), rot: 0 }
      ]
    },
    lighting: {
      time: pick(rand, ["day", "night", "indoor", "sunset"]),
      key_dir: pick(rand, ["left", "right", "top_right", "back"]),
      mood: styleMood
    },
    layers,
    config: { mediaMode, compiler: "v2", sceneTier, v2Mode: "strict", stability: "standard" },
    notes: sceneNotes
  };

  return {
    userInputRaw: userInputRawParts.join("，"),
    userIntentNormalized: normalizeUserIntentText(userInputRawParts.join("，")),
    project: {
      project: { mode: "storyboard", mediaType: mediaMode, shotPlan },
      scenes: [scene]
    },
    conflictMode
  };
}

function scorePrompt(prompt) {
  const lines = String(prompt ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const repeated = lines.length - new Set(lines).size;
  const hasProtocol = /平台执行协议|硬约束|优先级/.test(prompt);
  const hasSubjects = /主体1|Subjects:/.test(prompt);
  const hasMotion = /T1 Frame Spec|Motion:|向右|向左|moves/i.test(prompt);
  const hasCameraConflict = /不自动推拉镜头/.test(prompt) && /心理逼近|push/i.test(prompt);
  let score = 100;
  if (prompt.length > 1400) score -= 18;
  else if (prompt.length > 900) score -= 10;
  if (repeated > 1) score -= repeated * 6;
  if (!hasSubjects) score -= 18;
  if (!hasMotion) score -= 8;
  if (hasCameraConflict) score -= 15;
  if (hasProtocol && prompt.length > 700) score -= 8;
  return Math.max(0, score);
}

async function main() {
  const { buildStructuredPrompt } = await import("../../../tests/local-ab/dist/tests/local-ab/llm/shared.js");

  fs.mkdirSync(outDir, { recursive: true });
  const rand = mulberry32(20260311);
  const presets = PLATFORM_IDS.filter((item) => item !== "universal");
  const samples = [];

  for (let i = 0; i < count; i += 1) {
    const platformId = pick(rand, presets);
    const draft = buildProject(rand, { id: platformId }, i);
    const scope = draft.project.project.shotPlan === "continuous" ? "continuous_sequence" : "current_scene";
    const promptFull = buildStructuredPrompt(draft.project, { platformId, scope, lang: "zh", variant: "full" });
    const promptCompact = buildStructuredPrompt(draft.project, { platformId, scope, lang: "zh", variant: "compact" });
    samples.push({
      id: `pro_round1_preview_${String(i + 1).padStart(3, "0")}`,
      simulator: "session_llm_template_mix",
      platformId,
      mediaType: draft.project.project.mediaType,
      shotPlan: draft.project.project.shotPlan,
      userInputRaw: draft.userInputRaw,
      userIntentNormalized: draft.userIntentNormalized,
      conflictMode: draft.conflictMode,
      promptFull,
      promptCompact,
      scoreFull: scorePrompt(promptFull),
      scoreCompact: scorePrompt(promptCompact)
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    count: samples.length,
    avgFullScore: Number((samples.reduce((sum, item) => sum + item.scoreFull, 0) / Math.max(1, samples.length)).toFixed(2)),
    avgCompactScore: Number((samples.reduce((sum, item) => sum + item.scoreCompact, 0) / Math.max(1, samples.length)).toFixed(2)),
    conflictCases: samples.filter((item) => item.conflictMode !== "none").length
  };

  fs.writeFileSync(path.join(outDir, "round1-preview.json"), `${JSON.stringify({ summary, samples }, null, 2)}\n`, "utf8");

  const md = [
    "# Pro Workbench Round 1 Preview",
    "",
    `- generatedAt: ${summary.generatedAt}`,
    `- samples: ${summary.count}`,
    `- avgFullScore: ${summary.avgFullScore}`,
    `- avgCompactScore: ${summary.avgCompactScore}`,
    `- conflictCases: ${summary.conflictCases}`,
    "",
    "## Sample Prompts",
    ...samples.slice(0, 6).flatMap((item) => [
      `### ${item.id}`,
      `- platform: ${item.platformId}`,
      `- mediaType: ${item.mediaType}`,
      `- shotPlan: ${item.shotPlan}`,
      `- conflictMode: ${item.conflictMode}`,
      `- scoreFull: ${item.scoreFull}`,
      `- scoreCompact: ${item.scoreCompact}`,
      `- userInputRaw: ${item.userInputRaw}`,
      `- userIntentNormalized: ${item.userIntentNormalized}`,
      "",
      "#### Prompt Full",
      "```text",
      item.promptFull,
      "```",
      "",
      "#### Prompt Compact",
      "```text",
      item.promptCompact,
      "```",
      ""
    ])
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "round1-preview.md"), `${md}\n`, "utf8");

  console.log(`Wrote ${path.join(outDir, "round1-preview.json")}`);
  console.log(`Wrote ${path.join(outDir, "round1-preview.md")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
