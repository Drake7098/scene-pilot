import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectPromptIssues } from "./prompt-issue-detector.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const distRoot = path.resolve(repoRoot, "tests/local-ab/dist/src");

const args = process.argv.slice(2);
const workspaceArg = (args[0] || "pro").toLowerCase();
const countArg = Number(args[1]);
const totalCount = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : 120;
const workspaceModes = workspaceArg === "all" ? ["pro", "quick"] : [workspaceArg === "quick" ? "quick" : "pro"];
const outRoot = path.resolve(repoRoot, "artifacts/pro-workbench/round1-audit");

async function loadModule(relPath) {
  return import(path.join(distRoot, relPath));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function round(value, digits = 2) {
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function sample(array, index) {
  return array[index % array.length];
}

function sanitizeName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "") || "case";
}

function buildCounts(total) {
  const cleanImageCount = Math.round(total * 0.3);
  const cleanVideoCount = Math.round(total * 0.4);
  const dirtyCount = total - cleanImageCount - cleanVideoCount;
  return { cleanImageCount, cleanVideoCount, dirtyCount };
}

const DIRTY_TERMS = [/美女/g, /性感/g, /炸裂/g, /绝美/g, /巨好看/g, /拉满/g];
const CONFLICT_PATTERNS = [
  {
    code: "static_vs_rush",
    patterns: [/全程站着别动|静止|保持原位|stays stable|static composition/i, /冲向镜头|快速靠近镜头|rush(?:es)? to camera|moves closer to camera/i],
    message: "静止与冲向镜头冲突未被消解"
  },
  {
    code: "wide_vs_macro",
    patterns: [/大场景远景|wide environment|far scene/i, /近景|macro|close shot|产品大一些/i],
    message: "大场景与近景主体冲突未被消解"
  },
  {
    code: "image_vs_camera_motion",
    patterns: [/镜头推近|push-?in|camera push|运镜/i, /(^|\n)Layout:|(^|\n)Subjects:|(^|\n)Lighting:/i],
    message: "图片 prompt 仍残留镜头运动冲突"
  }
];

const imageTemplates = [
  {
    title: "室内人像单主体",
    raw: "室内人像，主体居中，背景干净，1:1，一个美女",
    normalized: "室内单主体写实人像，人物居中，背景简洁，避免过度性感化。",
    shotNote: "写实室内人像，主体居中，背景压简。",
    keywords: ["室内", "主体", "背景"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "年轻女性，深色上衣，写实自然",
        notes: "保持主体居中，中景，前景，人物清晰",
        prompt: "人物大一些，背景干净",
        k0: { x: 50, y: 53, w: 26, h: 40 },
        k1: { x: 50, y: 53, w: 26, h: 40 }
      }
    ]
  },
  {
    title: "赛博女主海报",
    raw: "赛博风女主，靠左站位，霓虹光，16:9",
    normalized: "赛博风单主体海报，人物偏左，霓虹环境光，横幅构图。",
    shotNote: "海报感单主体，霓虹侧光，人物偏左。",
    keywords: ["赛博", "霓虹", "人物"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "短发女性，赛博风夹克，霓虹边缘光",
        notes: "左侧站位，中景，前景，海报感",
        prompt: "人物稍大，背景压简",
        k0: { x: 34, y: 55, w: 24, h: 36 },
        k1: { x: 34, y: 55, w: 24, h: 36 }
      }
    ]
  },
  {
    title: "产品静物近景",
    raw: "产品静物，近景，背景极简，1:1",
    normalized: "产品静物近景，背景极简，以主体清晰和构图稳定优先。",
    shotNote: "产品静物近景，构图稳定，背景极简。",
    keywords: ["产品", "近景", "背景"],
    layers: [
      {
        id: "产品",
        type: "主体",
        look: "玻璃瓶护肤品，极简质感",
        notes: "居中近景，保留台面留白，不新增物体",
        prompt: "产品大一些，品牌感，极简背景",
        k0: { x: 50, y: 55, w: 22, h: 28 },
        k1: { x: 50, y: 55, w: 22, h: 28 }
      }
    ]
  },
  {
    title: "街头双主体深度",
    raw: "街头夜景，双主体，前后景分离，16:9",
    normalized: "街头夜景双主体，前后景层次明确，保持人物数量和相对位置。",
    shotNote: "双主体前后层次，街头夜景，关系紧张。",
    keywords: ["街头", "双主体", "前后景"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "男性，黑色夹克",
        notes: "前景偏右，情绪紧张",
        prompt: "前景更清晰",
        k0: { x: 62, y: 58, w: 20, h: 30 },
        k1: { x: 62, y: 58, w: 20, h: 30 }
      },
      {
        id: "主体2",
        type: "主体",
        look: "女性，浅色风衣",
        notes: "中景偏左，保持与主体1分离",
        prompt: "人物关系紧张",
        k0: { x: 34, y: 54, w: 16, h: 26 },
        k1: { x: 34, y: 54, w: 16, h: 26 }
      }
    ]
  }
];

const videoTemplates = [
  {
    title: "双人争执顿悟",
    raw: "两个人在房间里吵起来，一个男的要爆发，左边一个美女一直解释",
    normalized: "室内双人对峙，男性情绪升级，女性在左侧解释，保持双人相对位置。",
    shotNote: "男人意识到真相，女人在解释。",
    keywords: ["房间", "男性", "女性"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "年轻男性，深色外套",
        notes: "情绪突然要爆发，保持中间中部，中景，前景",
        prompt: "快要吵起来",
        k0: { x: 52, y: 54, w: 20, h: 32 },
        k1: { x: 52, y: 54, w: 20, h: 32 }
      },
      {
        id: "主体2",
        type: "主体",
        look: "年轻女性，浅色上衣",
        notes: "左中中部，中景，前景，一直在解释",
        prompt: "保持自然写实，不要过度性感化",
        k0: { x: 28, y: 55, w: 18, h: 30 },
        k1: { x: 36, y: 61, w: 18, h: 30 }
      }
    ]
  },
  {
    title: "风雪进屋单镜头",
    raw: "先看到门外风雪，然后主角推门进入屋内",
    normalized: "单镜头跟随角色从风雪环境进入温暖室内，保持人物身份和光线逻辑。",
    shotNote: "先外后内，镜头跟随，暖光稳定。",
    keywords: ["风雪", "屋内", "暖光"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "年轻男性，深色大衣",
        notes: "主体清晰可识别，镜头跟随进入室内",
        prompt: "先外后内，暖光不要跳",
        k0: { x: 46, y: 52, w: 18, h: 30 },
        k1: { x: 52, y: 56, w: 22, h: 34 }
      }
    ]
  },
  {
    title: "走廊连续镜头",
    raw: "一个女孩在学校走廊里快步前进，镜头持续跟着她",
    normalized: "连续镜头跟随女孩穿过走廊，节奏推进，人物身份保持稳定。",
    shotNote: "连续跟拍，节奏推进，人物身份稳定。",
    keywords: ["走廊", "女孩", "连续"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "短发女性，校服外套",
        notes: "主体中景跟拍，动作连贯",
        prompt: "不要切镜，人物身份稳定",
        k0: { x: 42, y: 56, w: 18, h: 30 },
        k1: { x: 58, y: 56, w: 18, h: 30 }
      }
    ]
  },
  {
    title: "多场景时间跳切",
    raw: "女孩站在海边从白天等到黄昏，情绪逐渐平静",
    normalized: "多场景或时间跳切，人物身份保持一致，重点体现情绪与光线变化。",
    shotNote: "海边白天到黄昏，情绪平缓过渡。",
    keywords: ["海边", "黄昏", "情绪"],
    layers: [
      {
        id: "主体1",
        type: "主体",
        look: "年轻女性，浅色风衣",
        notes: "人物主体稳定，情绪逐渐平静",
        prompt: "时间变化明显但人物一致",
        k0: { x: 50, y: 56, w: 18, h: 31 },
        k1: { x: 50, y: 56, w: 18, h: 31 }
      }
    ]
  }
];

function makeLayer(def) {
  return {
    id: def.id,
    type: def.type,
    shape: "rect",
    shapeDesc: "",
    look: def.look,
    z: 10,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, ...def.k0, rot: def.k0.rot ?? 0 },
      { t: 1, ...def.k1, rot: def.k1.rot ?? 0 }
    ],
    notes: def.notes,
    externalPrompt: def.prompt,
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function makeScene(def, workspace, mediaMode, flags) {
  return {
    id: def.caseId,
    name: def.title,
    duration_s: mediaMode === "image" ? 3 : 4,
    cameraPreset: "",
    shotNote: def.shotNote,
    camera: {
      shot: mediaMode === "image" ? "medium" : "medium_close",
      movement: mediaMode === "image" ? "static" : "push_in",
      keyframes: [
        { t: 0, x: 50, y: 50, zoom: 1, rot: 0 },
        { t: 1, x: 50, y: 50, zoom: mediaMode === "image" ? 1 : 1.04, rot: 0 }
      ]
    },
    lighting: {
      time: "day",
      key_dir: "window side light",
      mood: "cinematic natural light"
    },
    layers: def.layers.map(makeLayer),
    notes: [
      `media: ${mediaMode}`,
      `genmode: ${workspace}`,
      "@compiler:v2",
      "@scene_tier:small_plaza",
      "@v2_mode:strict",
      ...(flags.isDirty ? ["case:dirty"] : []),
      ...(flags.isConflict ? ["case:conflict"] : [])
    ].join("\n"),
    config: {
      mediaMode,
      compiler: "v2",
      sceneTier: "small_plaza",
      v2Mode: "strict",
      stability: "standard"
    }
  };
}

function applyDirtyAndConflict(base, mediaMode, index, dirtyQuota, conflictQuota) {
  const isDirty = index < dirtyQuota;
  const isConflict = index < conflictQuota;
  let raw = base.raw;
  let normalized = base.normalized;
  const tags = [];

  if (isDirty) {
    const dirtySuffix = mediaMode === "image"
      ? sample(["，一个美女", "，要绝美一点", "，质感拉满", "，更炸裂一点"], index)
      : sample(["，左边一个美女一直解释", "，要电影感拉满", "，情绪炸裂一点"], index);
    raw = `${raw}${dirtySuffix}`;
    tags.push("dirty_input");
  }

  if (isConflict) {
    const conflictText = mediaMode === "image"
      ? sample([
          "，同时要大场景远景感，还要镜头推近",
          "，背景要极简但又要信息特别满",
          "，人物别动但要有明显运动感"
        ], index)
      : sample([
          "，人物全程站着别动，但又要快速冲向镜头",
          "，不要切镜，但同时要多个反打",
          "，时间跳切明显，但又要完全连续不断"
        ], index);
    raw = `${raw}${conflictText}`;
    tags.push("conflict_input");
  }

  return {
    userInputRaw: raw,
    userIntentNormalized: normalized,
    tags,
    isDirty,
    isConflict
  };
}

function buildRecommendationLines(issueCounts, workspace) {
  const recommendations = [];
  const push = (condition, line) => {
    if (condition) recommendations.push(line);
  };

  push(issueCounts.image_camera_language_leak > 0, "图片引擎继续收紧镜头词过滤，禁止 camera / motion / transition 语义泄漏进 IM 引擎。");
  push(issueCounts.image_temporal_language_leak > 0, "图片引擎继续清理 T1 / duration / transition 语言，只保留 layout + subjects + negative。");
  push(issueCounts.video_missing_camera_section > 0, "视频引擎补强 Camera 段的稳定注入，确保每条 VI prompt 都明确 shot / angle / movement。");
  push(issueCounts.video_missing_motion_section > 0, "视频引擎补强 Motion 段，至少明确 action beat 或 continuity logic。");
  push(issueCounts.prompt_too_long > 0, `${workspace === "quick" ? "Quick" : "Pro"} 引擎继续压缩协议层，避免重复约束压过执行层。`);
  push(issueCounts.engine_length_over_budget > 0, `${workspace === "quick" ? "Quick" : "Pro"} 引擎需要按媒体和工作台设置字数预算，避免视频 prompt 过长。`);
  push(issueCounts.repeated_constraint_lines > 0, "导出阶段去重同义或同句约束，避免“4 秒内完成变化”“保持静止构图”等语句重复出现。");
  push(issueCounts.video_progression_flattened > 0, "视频引擎不要把时间跳切/多场景意图压扁成静止说明，需显式保留 progression / transition。");
  push(issueCounts.video_camera_conflict > 0, "视频镜头规则避免一边禁止推拉、一边又要求 follow / psychological push-in，这类导演语义要先归一。");
  push(issueCounts.dirty_term_leak > 0, "输入归一化层继续清洗“美女/性感/炸裂”等用户词，只保留能稳定服务结构的描述。");
  push(issueCounts.conflict_unresolved > 0, "冲突收敛层继续前移，把“静止 vs 冲向镜头”“大场景 vs 近景产品”等矛盾改写成单一可执行意图。");

  if (!recommendations.length) {
    recommendations.push("当前轮次未出现高频结构问题，可以进入更大样本量和结果侧验证。");
  }
  return recommendations;
}

function countIssue(issueCounts, code) {
  issueCounts[code] = (issueCounts[code] ?? 0) + 1;
}

function normalizeLine(line) {
  return String(line || "").trim().replace(/\s+/g, " ");
}

function duplicateLineEvidence(prompt) {
  const counts = new Map();
  for (const line of String(prompt || "").split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([line]) => line);
}

async function main() {
  const [{ sanitizeProject }, { buildPromptForScene }, { getPlatformPreset }] = await Promise.all([
    loadModule("model.js"),
    loadModule("utils/promptEngine.js"),
    loadModule("config/platformPresets.js")
  ]);

  const counts = buildCounts(totalCount);
  const preset = getPlatformPreset("universal");

  for (const workspace of workspaceModes) {
    const cases = [];
    const issueCounts = {};
    const mediaCounts = { image: 0, video: 0 };

    const dirtyQuota = counts.dirtyCount;
    const conflictQuota = Math.max(1, Math.round(totalCount * 0.15));
    let sequence = 0;

    const casePlan = [
      ...Array.from({ length: counts.cleanImageCount }, () => ({ mediaMode: "image", bucket: "clean_image" })),
      ...Array.from({ length: counts.cleanVideoCount }, () => ({ mediaMode: "video", bucket: "clean_video" })),
      ...Array.from({ length: counts.dirtyCount }, (_, idx) => ({
        mediaMode: idx % 2 === 0 ? "image" : "video",
        bucket: "dirty_conflict"
      }))
    ].slice(0, totalCount);

    for (const plan of casePlan) {
      const { mediaMode, bucket } = plan;
      const template = mediaMode === "image" ? sample(imageTemplates, sequence) : sample(videoTemplates, sequence);
      const caseId = `${workspace}_round1_${mediaMode}_${String(sequence + 1).padStart(4, "0")}`;
      const dirtyIndex = bucket === "dirty_conflict" ? sequence : totalCount;
      const flags = applyDirtyAndConflict(template, mediaMode, dirtyIndex, dirtyQuota, conflictQuota);
      const def = {
        ...template,
        caseId
      };
      const scene = makeScene(def, workspace, mediaMode, flags);
      const project = sanitizeProject({
        project: { mode: "storyboard", mediaType: mediaMode, shotPlan: mediaMode === "image" ? "single" : "continuous" },
        scenes: [scene]
      });
      const output = buildPromptForScene({
        project,
        scene: project.scenes[0],
        lang: "zh",
        platformId: "universal",
        profile: preset.baseProfile,
        workspace
      });

      const prompt = output.finalCopyPrompt.trim();
      const detector = detectPromptIssues({
        prompt,
        mediaMode,
        workspace,
        engineId: output.metadata.engineId
      });
      const duplicateLines = duplicateLineEvidence(prompt);
      const dirtyLeak = flags.isDirty && DIRTY_TERMS.some((re) => re.test(prompt));
      const conflictUnresolved = flags.isConflict && CONFLICT_PATTERNS.some((item) => item.patterns.every((re) => re.test(prompt)));
      const matchedKeywords = template.keywords.filter((keyword) => prompt.includes(keyword));
      const overBudget = mediaMode === "image"
        ? prompt.length > (workspace === "pro" ? 340 : 260)
        : prompt.length > (workspace === "pro" ? 430 : 320);
      const flattenedProgression = mediaMode === "video"
        && /时间跳切|多场景|time jump|scene switch/i.test(prompt)
        && /保持静止构图|结束保持原位|distance and scale stable/i.test(prompt);
      const cameraConflict = mediaMode === "video"
        && /不自动推拉镜头/i.test(prompt)
        && /跟随|follow|心理逼近|push-?in/i.test(prompt);
      const qualityScore = Math.max(
        0,
        detector.score
          - (dirtyLeak ? 12 : 0)
          - (conflictUnresolved ? 12 : 0)
          - (duplicateLines.length ? 10 : 0)
          - (overBudget ? 8 : 0)
          - (flattenedProgression ? 12 : 0)
          - (cameraConflict ? 10 : 0)
          - (matchedKeywords.length < 2 ? 8 : 0)
      );

      for (const issue of detector.issues) countIssue(issueCounts, issue.code);
      if (duplicateLines.length) countIssue(issueCounts, "repeated_constraint_lines");
      if (overBudget) countIssue(issueCounts, "engine_length_over_budget");
      if (flattenedProgression) countIssue(issueCounts, "video_progression_flattened");
      if (cameraConflict) countIssue(issueCounts, "video_camera_conflict");
      if (dirtyLeak) countIssue(issueCounts, "dirty_term_leak");
      if (conflictUnresolved) countIssue(issueCounts, "conflict_unresolved");

      mediaCounts[mediaMode] += 1;
      cases.push({
        id: caseId,
        workspace,
        mediaMode,
        engineId: output.metadata.engineId,
        title: template.title,
        userInputRaw: flags.userInputRaw,
        userIntentNormalized: flags.userIntentNormalized,
        bucket,
        tags: flags.tags,
        promptLength: prompt.length,
        matchedKeywords,
        enginePasses: output.metadata.enginePasses ?? [],
        score: qualityScore,
        detectorScore: detector.score,
        dirtyLeak,
        conflictUnresolved,
        issues: [
          ...detector.issues,
          ...(duplicateLines.length ? [{ code: "repeated_constraint_lines", severity: "medium", message: "同一句或同义约束在 prompt 中重复出现", evidence: duplicateLines.slice(0, 4) }] : []),
          ...(overBudget ? [{ code: "engine_length_over_budget", severity: "medium", message: "当前引擎下 prompt 超出建议长度预算", evidence: [String(prompt.length)] }] : []),
          ...(flattenedProgression ? [{ code: "video_progression_flattened", severity: "high", message: "视频的时间跳切/多场景意图被压成静止描述", evidence: matchedKeywords }] : []),
          ...(cameraConflict ? [{ code: "video_camera_conflict", severity: "medium", message: "视频镜头规则内部冲突", evidence: matchedKeywords }] : []),
          ...(dirtyLeak ? [{ code: "dirty_term_leak", severity: "high", message: "用户脏词直接泄漏到最终 prompt", evidence: matchedKeywords }] : []),
          ...(conflictUnresolved ? [{ code: "conflict_unresolved", severity: "high", message: "冲突输入仍以冲突形式留在最终 prompt", evidence: matchedKeywords }] : [])
        ],
        prompt
      });
      sequence += 1;
    }

    const engineSummaries = Object.values(cases.reduce((acc, item) => {
      const current = acc[item.engineId] ?? { engineId: item.engineId, count: 0, avgScore: 0, avgPromptLength: 0, issueCount: 0 };
      current.count += 1;
      current.avgScore += item.score;
      current.avgPromptLength += item.promptLength;
      current.issueCount += item.issues.length;
      acc[item.engineId] = current;
      return acc;
    }, {})).map((entry) => ({
      ...entry,
      avgScore: round(entry.avgScore / entry.count),
      avgPromptLength: round(entry.avgPromptLength / entry.count),
      avgIssueCount: round(entry.issueCount / entry.count)
    })).sort((a, b) => b.avgScore - a.avgScore);

    const summary = {
      generatedAt: new Date().toISOString(),
      workspace,
      totalCount,
      distribution: {
        cleanImageCases: counts.cleanImageCount,
        cleanVideoCases: counts.cleanVideoCount,
        dirtyConflictCases: counts.dirtyCount,
        actualImageCases: mediaCounts.image,
        actualVideoCases: mediaCounts.video,
        cleanImageRatio: round((counts.cleanImageCount / totalCount) * 100),
        cleanVideoRatio: round((counts.cleanVideoCount / totalCount) * 100),
        dirtyConflictRatio: round((counts.dirtyCount / totalCount) * 100)
      },
      averages: {
        score: round(cases.reduce((sum, item) => sum + item.score, 0) / Math.max(1, cases.length)),
        promptLength: round(cases.reduce((sum, item) => sum + item.promptLength, 0) / Math.max(1, cases.length))
      },
      engines: engineSummaries,
      issueCounts: Object.entries(issueCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      topFailures: cases
        .filter((item) => item.issues.length > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 12)
        .map((item) => ({
          id: item.id,
          engineId: item.engineId,
          mediaMode: item.mediaMode,
          score: item.score,
          issueCodes: item.issues.map((issue) => issue.code)
        })),
      recommendations: buildRecommendationLines(issueCounts, workspace)
    };

    const workspaceOutDir = path.join(outRoot, workspace);
    ensureDir(workspaceOutDir);

    fs.writeFileSync(path.join(workspaceOutDir, "cases.json"), `${JSON.stringify(cases, null, 2)}\n`);
    fs.writeFileSync(path.join(workspaceOutDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    fs.writeFileSync(
      path.join(workspaceOutDir, "summary.md"),
      [
        `# Round 1 Prompt Audit (${workspace})`,
        "",
        `- Generated: ${summary.generatedAt}`,
        `- Total cases: ${summary.totalCount}`,
        `- Clean Image / Clean Video / Dirty-Conflict: ${summary.distribution.cleanImageRatio}% / ${summary.distribution.cleanVideoRatio}% / ${summary.distribution.dirtyConflictRatio}%`,
        `- Actual media mix: image ${summary.distribution.actualImageCases}, video ${summary.distribution.actualVideoCases}`,
        `- Average score: ${summary.averages.score}`,
        `- Average prompt length: ${summary.averages.promptLength}`,
        "",
        "## Engine Summary",
        "| engine | count | avg score | avg prompt length | avg issues |",
        "|---|---:|---:|---:|---:|",
        ...summary.engines.map((item) => `| ${item.engineId} | ${item.count} | ${item.avgScore} | ${item.avgPromptLength} | ${item.avgIssueCount} |`),
        "",
        "## Top Issues",
        "| issue code | count |",
        "|---|---:|",
        ...summary.issueCounts.map((item) => `| ${item.code} | ${item.count} |`),
        "",
        "## Recommendations",
        ...summary.recommendations.map((line) => `- ${line}`),
        "",
        "## Lowest Score Cases",
        "| id | engine | media | score | issue codes |",
        "|---|---|---|---:|---|",
        ...summary.topFailures.map((item) => `| ${item.id} | ${item.engineId} | ${item.mediaMode} | ${item.score} | ${item.issueCodes.join(", ")} |`)
      ].join("\n") + "\n"
    );
  }
}

await main();
