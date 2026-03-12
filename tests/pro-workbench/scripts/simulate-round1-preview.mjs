import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectPromptIssues } from "./prompt-issue-detector.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const distRoot = path.resolve(repoRoot, "tests/local-ab/dist/src");

async function loadModule(relPath) {
  return import(path.join(distRoot, relPath));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function makeLayer(id, type, look, notes, externalPrompt, k0, k1) {
  return {
    id,
    type,
    shape: "rect",
    shapeDesc: "",
    look,
    z: 10,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, ...k0, rot: k0.rot ?? 0 },
      { t: 1, ...k1, rot: k1.rot ?? 0 }
    ],
    notes,
    externalPrompt,
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function makeScene(def) {
  const notes = [
    `media: ${def.mediaMode}`,
    `genmode: ${def.workspace}`,
    "@compiler: v2",
    "@scene_tier: small_plaza",
    "@v2_mode: strict",
    "stability: standard",
    ...(def.extraNotes ?? [])
  ].join("\n");

  return {
    id: def.id,
    name: def.title,
    duration_s: def.duration,
    cameraPreset: "",
    shotNote: def.shotNote,
    camera: {
      shot: def.mediaMode === "image" ? "medium" : "medium_close",
      movement: def.mediaMode === "image" ? "static" : "push_in",
      keyframes: [
        { t: 0, x: 50, y: 50, zoom: 1, rot: 0 },
        { t: 1, x: 50, y: 50, zoom: def.mediaMode === "image" ? 1 : 1.06, rot: 0 }
      ]
    },
    lighting: {
      time: "day",
      key_dir: "window side light",
      mood: "cinematic natural light"
    },
    layers: def.layers,
    notes,
    config: {
      mediaMode: def.mediaMode,
      compiler: "v2",
      sceneTier: "small_plaza",
      v2Mode: "strict",
      stability: "standard"
    }
  };
}

function buildCases() {
  return [
    {
      id: "pro_round1_preview_001",
      workspace: "pro",
      mediaMode: "image",
      title: "室内人像单主体",
      duration: 3,
      shotNote: "写实室内人像，主体居中，背景压简。",
      userInputRaw: "室内人像，主体居中，背景干净，1:1，一个美女",
      userIntentNormalized: "室内单主体写实人像，人物居中，背景简洁，避免过度性感化。",
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "年轻女性，深色上衣，写实自然",
          "保持主体居中，中景，前景，人物清晰",
          "人物大一些，背景干净",
          { x: 50, y: 53, w: 26, h: 40 },
          { x: 50, y: 53, w: 26, h: 40 }
        )
      ]
    },
    {
      id: "pro_round1_preview_002",
      workspace: "pro",
      mediaMode: "video",
      title: "双人争执顿悟",
      duration: 3,
      shotNote: "男人意识到真相，女人在解释。",
      userInputRaw: "两个人在房间里吵起来，一个男的要爆发，左边一个美女一直解释",
      userIntentNormalized: "室内双人对峙，男性情绪升级，女性在左侧解释，保持双人相对位置。",
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "年轻男性，深色外套",
          "情绪突然要爆发，保持中间中部，中景，前景",
          "快要吵起来",
          { x: 52, y: 54, w: 20, h: 32 },
          { x: 52, y: 54, w: 20, h: 32 }
        ),
        makeLayer(
          "主体2",
          "主体",
          "年轻女性，浅色上衣",
          "左中中部，中景，前景，一直在解释",
          "保持自然写实，不要过度性感化",
          { x: 28, y: 55, w: 18, h: 30 },
          { x: 36, y: 61, w: 18, h: 30 }
        )
      ]
    },
    {
      id: "pro_round1_preview_003",
      workspace: "pro",
      mediaMode: "image",
      title: "产品静物冲突样本",
      duration: 3,
      shotNote: "测试冲突输入收敛能力。",
      userInputRaw: "产品静物，近景，背景极简，1:1，同时要大场景远景感，还要镜头推近",
      userIntentNormalized: "产品静物近景，背景极简，以主体清晰和构图稳定优先，压制冲突镜头词。",
      extraNotes: ["conflict: wide_scene_vs_macro", "conflict: image_vs_camera_motion"],
      layers: [
        makeLayer(
          "产品",
          "主体",
          "玻璃瓶护肤品，极简质感",
          "居中近景，保留台面留白，不新增物体",
          "产品大一些，品牌感，极简背景",
          { x: 50, y: 55, w: 22, h: 28 },
          { x: 50, y: 55, w: 22, h: 28 }
        )
      ]
    },
    {
      id: "pro_round1_preview_004",
      workspace: "quick",
      mediaMode: "image",
      title: "赛博女主海报",
      duration: 3,
      shotNote: "快工作台图片测试。",
      userInputRaw: "赛博风女主，靠左站位，霓虹光，16:9",
      userIntentNormalized: "赛博风单主体海报，人物偏左，霓虹环境光，横幅构图。",
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "短发女性，赛博风夹克，霓虹边缘光",
          "左侧站位，中景，前景，海报感",
          "人物稍大，背景压简",
          { x: 34, y: 55, w: 24, h: 36 },
          { x: 34, y: 55, w: 24, h: 36 }
        )
      ]
    },
    {
      id: "pro_round1_preview_005",
      workspace: "quick",
      mediaMode: "video",
      title: "街头夜景双主体",
      duration: 4,
      shotNote: "双主体前后景分离。",
      userInputRaw: "街头夜景，双主体，前后景分离，16:9",
      userIntentNormalized: "街头夜景双主体，前后景层次明确，保持人物数量和相对位置。",
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "男性，黑色夹克",
          "前景偏右，情绪紧张",
          "前景更清晰",
          { x: 62, y: 58, w: 20, h: 30 },
          { x: 64, y: 58, w: 20, h: 30 }
        ),
        makeLayer(
          "主体2",
          "主体",
          "女性，浅色风衣",
          "中景偏左，保持与主体1分离",
          "人物关系紧张",
          { x: 34, y: 54, w: 16, h: 26 },
          { x: 37, y: 55, w: 16, h: 26 }
        )
      ]
    },
    {
      id: "pro_round1_preview_006",
      workspace: "quick",
      mediaMode: "video",
      title: "海报感竖版人物",
      duration: 4,
      shotNote: "人物大一些，背景压简。",
      userInputRaw: "海报感构图，人物大一些，背景压简，9:16",
      userIntentNormalized: "竖版海报式单主体，人物占比更大，背景简洁，结构优先。",
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "年轻女性，黑色长风衣",
          "前景大主体，构图稳定",
          "人物更大，背景更干净",
          { x: 50, y: 57, w: 28, h: 44 },
          { x: 50, y: 56, w: 29, h: 45 }
        )
      ]
    },
    {
      id: "pro_round1_preview_007",
      workspace: "pro",
      mediaMode: "video",
      title: "有冲突的连续镜头",
      duration: 5,
      shotNote: "同时注入动作和静止冲突。",
      userInputRaw: "人物全程站着别动，但又要快速冲向镜头，连续镜头，别切",
      userIntentNormalized: "连续镜头单主体，优先保留对象身份和空间关系，显式处理动作冲突。",
      extraNotes: ["conflict: static_vs_rush_to_camera"],
      layers: [
        makeLayer(
          "主体1",
          "主体",
          "年轻男性，衬衫",
          "保持主体清晰，不要漂移",
          "先站住，再轻微靠近镜头",
          { x: 50, y: 54, w: 20, h: 32 },
          { x: 52, y: 54, w: 22, h: 34 }
        )
      ]
    },
    {
      id: "pro_round1_preview_008",
      workspace: "pro",
      mediaMode: "image",
      title: "多对象室内层次",
      duration: 3,
      shotNote: "多对象图片结构测试。",
      userInputRaw: "室内复杂层次，多对象构图，桌上有书和杯子，人物坐在后面",
      userIntentNormalized: "室内多对象构图，前景桌面物件，后方人物，层次清楚。",
      layers: [
        makeLayer("物件1", "道具", "一本打开的书", "前景左侧桌面", "", { x: 32, y: 70, w: 14, h: 10 }, { x: 32, y: 70, w: 14, h: 10 }),
        makeLayer("物件2", "道具", "白色陶瓷杯", "前景右侧桌面", "", { x: 58, y: 69, w: 10, h: 12 }, { x: 58, y: 69, w: 10, h: 12 }),
        makeLayer("主体1", "主体", "年轻女性，坐姿", "后方中景，保持可识别", "人物不要太小", { x: 50, y: 48, w: 18, h: 28 }, { x: 50, y: 48, w: 18, h: 28 })
      ]
    }
  ];
}

async function main() {
  const { buildPromptForScene } = await loadModule("utils/promptEngine.js");
  const { sanitizeProject } = await loadModule("model.js");

  const outDir = path.resolve(repoRoot, "artifacts/pro-workbench/round1-preview");
  ensureDir(outDir);

  const cases = buildCases();
  const outputs = cases.map((def) => {
    const scene = makeScene(def);
    const project = sanitizeProject({ project: { mode: "storyboard", mediaType: def.mediaMode, shotPlan: def.mediaMode === "image" ? "single" : "continuous" }, scenes: [scene] });
    const result = buildPromptForScene({
      project,
      scene: project.scenes[0],
      lang: "zh",
      platformId: "universal"
    });

    const prompt = result.finalCopyPrompt.trim();
    const detection = detectPromptIssues({
      prompt,
      mediaMode: def.mediaMode,
      workspace: def.workspace,
      engineId: result.metadata.engineId
    });

    return {
      id: def.id,
      title: def.title,
      workspace: def.workspace,
      mediaMode: def.mediaMode,
      engineId: result.metadata.engineId,
      userInputRaw: def.userInputRaw,
      userIntentNormalized: def.userIntentNormalized,
      prompt,
      promptLength: prompt.length,
      score: detection.score,
      issues: detection.issues,
      enginePasses: result.metadata.enginePasses,
      strippedVideoScaffoldForImage: result.metadata.strippedVideoScaffoldForImage
    };
  });

  const summary = {
    sampleCount: outputs.length,
    imageRatio: `${pct(outputs.filter((item) => item.mediaMode === "image").length, outputs.length)}%`,
    videoRatio: `${pct(outputs.filter((item) => item.mediaMode === "video").length, outputs.length)}%`,
    avgScore: Math.round(outputs.reduce((sum, item) => sum + item.score, 0) / outputs.length * 100) / 100,
    imageWithCameraLeak: outputs.filter((item) => item.issues.some((issue) => issue.code === "image_camera_heading_leak" || issue.code === "image_camera_language_leak")).map((item) => item.id),
    imageWithMotionLeak: outputs.filter((item) => item.issues.some((issue) => issue.code === "image_temporal_language_leak")).map((item) => item.id),
    issueTotals: outputs.reduce((acc, item) => {
      for (const issue of item.issues) acc[issue.code] = (acc[issue.code] || 0) + 1;
      return acc;
    }, {})
  };

  const md = [
    "# Pro Workbench Round 1 Preview",
    "",
    `- Samples: ${summary.sampleCount}`,
    `- Images: ${summary.imageRatio}`,
    `- Videos: ${summary.videoRatio}`,
    `- Avg score: ${summary.avgScore}`,
    `- Image camera leak cases: ${summary.imageWithCameraLeak.join(", ") || "none"}`,
    `- Image motion leak cases: ${summary.imageWithMotionLeak.join(", ") || "none"}`,
    "",
    ...outputs.flatMap((item) => [
      `## ${item.id}`,
      "",
      `- Title: ${item.title}`,
      `- Workspace: ${item.workspace}`,
      `- Media: ${item.mediaMode}`,
      `- Engine: ${item.engineId}`,
      `- Score: ${item.score}`,
      `- Engine passes: ${item.enginePasses.join(", ") || "-"}`,
      `- Stripped image video scaffold: ${item.strippedVideoScaffoldForImage}`,
      `- Issues: ${item.issues.length ? item.issues.map((issue) => `${issue.code}(${issue.severity})`).join(", ") : "none"}`,
      "",
      "### userInputRaw",
      "",
      item.userInputRaw,
      "",
      "### userIntentNormalized",
      "",
      item.userIntentNormalized,
      "",
      "### generatedPrompt",
      "",
      "```text",
      item.prompt,
      "```",
      "",
      "### promptIssues",
      "",
      ...(item.issues.length
        ? item.issues.flatMap((issue) => [
            `- ${issue.code} [${issue.severity}] ${issue.message}`,
            ...issue.evidence.map((line) => `  - ${line}`)
          ])
        : ["- none"]),
      ""
    ])
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "round1-preview.json"), `${JSON.stringify({ summary, outputs }, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "round1-preview.md"), `${md}\n`);
  console.log(`Wrote preview to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
