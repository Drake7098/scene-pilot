import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Lang } from "../../../src/i18n.js";
import type { CanvasDraft } from "../../../src/types/canvasDraft.js";
import type { StructureDraft } from "../../../src/types/structureDraft.js";
import { generateStructureDraft } from "../../../src/utils/structureDraft.js";
import { structureDraftToCanvas } from "../../../src/utils/structureDraftToCanvas.js";
import { canvasDraftToIntentPlan } from "../../../src/utils/canvasDraftToIntentPlan.js";
import { intentPlanToProProject } from "../../../src/utils/intentPlanToProject.js";
import { generatePrompts } from "../../../src/utils/prompt.js";
import { generateQuickWorkspacePromptV3 } from "../../../src/utils/quickWorkspacePromptV3.js";

type MediaType = "image" | "video";

type ResultStructureState = {
  subjectX: number;
  subjectY: number;
  subjectSize: number;
  subjectLayer: number;
  compositionFocus: "left" | "center" | "right";
};

type BenchCase = {
  id: string;
  lang: Lang;
  mediaType: MediaType;
  ratio: "16:9" | "9:16" | "1:1";
  step1: string;
  step2: string;
  structureHint?: string;
  dropdownHints: string[];
  userProvidedSeconds: boolean;
  conflictInjected: boolean;
};

type CaseScore = {
  caseId: string;
  mediaType: MediaType;
  conflictInjected: boolean;
  userProvidedSeconds: boolean;
  v2: number;
  v3: number;
  v2HasSeconds: boolean;
  v3HasSeconds: boolean;
  v2CoversStep1: boolean;
  v3CoversStep1: boolean;
  v2CoversStep2: boolean;
  v3CoversStep2: boolean;
  v3ShotCountAligned: boolean;
  v3LeaksEngineInfo: boolean;
  v3IsConcise: boolean;
  notes: string[];
};

const LANGS: Lang[] = ["zh", "en"];
const RATIOS: Array<"16:9" | "9:16" | "1:1"> = ["16:9", "9:16", "1:1"];
const IMAGE_HINTS = ["single_subject", "multi_subject", "environment", "product_object"] as const;
const VIDEO_HINTS = ["single_shot", "multicam", "continuous", "multi_scene"] as const;
const VIDEO_SHOT_COUNTS = [1, 3, 4, 5] as const;
const VIDEO_GRAMMAR = ["cut", "reverse_angle", "over_shoulder", "pov", "insert_closeup", "establishing"] as const;
const VIDEO_TRANSITIONS = ["same_space", "location_switch", "indoor_outdoor", "time_jump"] as const;

const ZH_STEP1 = [
  "三个人在地下室对峙，主角情绪压迫感最强",
  "雨夜街道上，一名女主角撑伞快步前进，画面要有电影感",
  "产品展示场景，耳机放在木桌上，重点突出材质与反光",
  "森林边缘一只狼停在前景，远处有营地火光",
  "咖啡馆里两人对话，主角在中间位置，氛围偏冷"
];
const ZH_STEP2 = [
  "先广角建立，再反打到主角特写，人物身份和光线保持一致",
  "镜头缓慢推进，避免突兀跳切，保持场景连续",
  "强调前后景层次，背景不要过于杂乱",
  "对象关系保持稳定，不要新增无关主体",
  "如果结构冲突，优先遵从我这两句描述"
];
const EN_STEP1 = [
  "Three people confront in a basement, the lead should feel dominant",
  "A woman walks fast with an umbrella on a rainy street, cinematic tone",
  "Product showcase of headphones on a wooden table, highlight material and reflection",
  "A wolf stands in the foreground near a forest edge, campfire lights far away",
  "Two people talk in a cafe, lead centered, colder mood"
];
const EN_STEP2 = [
  "Start with a wide establishing shot, then reverse-angle close-up on the lead, keep identity and lighting stable",
  "Use a slow push and avoid abrupt jump cuts, preserve scene continuity",
  "Emphasize foreground-background depth and keep background clean",
  "Keep object relationships stable and do not add unrelated subjects",
  "If structure conflicts appear, prioritize my two sentences"
];

const FORCE_SECONDS_LINES = [
  "时长约 6 秒",
  "全片 8s",
  "about 6 seconds total",
  "duration around 8s"
];

const ENGINE_LOCK_REL_PATH = "docs/engine-library-lock.json";
const ENGINE_FILES = [
  "src/utils/quickWorkspacePromptV3.ts",
  "src/utils/prompt.ts",
  "src/utils/promptEngine.ts",
  "src/utils/promptPipeline.ts",
  "src/utils/sceneStrategyResolver.ts",
  "src/utils/structureDraft.ts",
  "src/utils/structureDraftGenerator.ts",
  "src/utils/structureDraftRules.ts",
  "src/utils/structureDraftToCanvas.ts",
  "src/utils/promptEngines/builtin.ts",
  "src/utils/promptEngines/index.ts",
  "src/utils/promptEngines/shared.ts",
  "src/utils/promptEngines/types.ts"
].sort();

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length];
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function computeEngineLockHash(root: string): Promise<string> {
  const pairs: string[] = [];
  for (const rel of ENGINE_FILES) {
    const abs = path.join(root, rel);
    const content = await readFile(abs, "utf8");
    pairs.push(`${rel}:${sha256(content)}`);
  }
  return sha256(pairs.join("\n"));
}

async function loadAndAssertEngineLock(root: string): Promise<{ lockHash: string; lockGeneratedAt: string }> {
  const lockPath = path.join(root, ENGINE_LOCK_REL_PATH);
  const raw = await readFile(lockPath, "utf8");
  const lock = JSON.parse(raw) as { lockHash?: string; generatedAt?: string };
  const currentHash = await computeEngineLockHash(root);
  if (!lock.lockHash || lock.lockHash !== currentHash) {
    throw new Error(
      `[engine-lock] stale or missing lock: ${ENGINE_LOCK_REL_PATH}. ` +
      `expected=${currentHash} actual=${lock.lockHash ?? "missing"}. ` +
      `run: npm run engine:lock:update`
    );
  }
  return {
    lockHash: lock.lockHash,
    lockGeneratedAt: String(lock.generatedAt ?? "")
  };
}

function sanitizeLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function containsTimeUnit(text: string): boolean {
  return /\b\d+\s*(?:秒|sec|secs|second|seconds)\b|\b\d+s\b/i.test(text);
}

function extractKeywords(text: string, lang: Lang): string[] {
  const cleaned = sanitizeLine(text).toLowerCase();
  if (!cleaned) return [];
  const zhStops = new Set(["的", "了", "在", "和", "与", "并", "以及", "一个", "一种", "保持", "不要", "避免", "优先"]);
  const enStops = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "keep", "avoid", "not"]);
  const words = cleaned
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.length >= (lang === "zh" ? 1 : 3))
    .filter((x) => (lang === "zh" ? !zhStops.has(x) : !enStops.has(x)));
  return Array.from(new Set(words)).slice(0, 12);
}

function coversIntent(prompt: string, text: string, lang: Lang): boolean {
  const p = prompt.toLowerCase();
  const keys = extractKeywords(text, lang);
  if (!keys.length) return true;
  const hit = keys.filter((k) => p.includes(k)).length;
  const need = Math.max(1, Math.min(3, Math.ceil(keys.length * 0.3)));
  return hit >= need;
}

function makeCase(i: number): BenchCase {
  const lang = pick(LANGS, i);
  const mediaType: MediaType = i % 2 === 0 ? "image" : "video";
  const ratio = pick(RATIOS, i * 3 + 1);
  const baseStep1 = lang === "zh" ? pick(ZH_STEP1, i) : pick(EN_STEP1, i);
  const baseStep2 = lang === "zh" ? pick(ZH_STEP2, i * 2 + 1) : pick(EN_STEP2, i * 2 + 1);

  const injectSeconds = i % 10 === 0;
  const conflictInjected = i % 4 === 0;
  const step2 = injectSeconds ? `${baseStep2}，${pick(FORCE_SECONDS_LINES, i)}` : baseStep2;

  let structureHint: string | undefined;
  const dropdownHints: string[] = [];
  if (mediaType === "image") {
    structureHint = pick(IMAGE_HINTS, i + 1);
    dropdownHints.push(`frame:${structureHint}`);
    dropdownHints.push(`focus:${pick(["subject_highlight", "relation_expression", "environment_wrap", "product_showcase"] as const, i + 2)}`);
    if (conflictInjected) dropdownHints.push("conflict:dropdown=environment,user=single_subject");
  } else {
    structureHint = pick(VIDEO_HINTS, i + 2);
    dropdownHints.push(`shot_mode:${structureHint}`);
    dropdownHints.push(`shot_count:${pick(VIDEO_SHOT_COUNTS, i + 3)}`);
    dropdownHints.push(`shot_grammar:${pick(VIDEO_GRAMMAR, i + 4)}`);
    dropdownHints.push(`transition:${pick(VIDEO_TRANSITIONS, i + 5)}`);
    if (conflictInjected) dropdownHints.push("conflict:dropdown=multicam,user=single_shot");
  }

  return {
    id: `qw_v3_${String(i + 1).padStart(3, "0")}`,
    lang,
    mediaType,
    ratio,
    step1: sanitizeLine(baseStep1),
    step2: sanitizeLine(step2),
    structureHint,
    dropdownHints,
    userProvidedSeconds: containsTimeUnit(baseStep1) || containsTimeUnit(step2),
    conflictInjected
  };
}

function applyVideoDropdowns(
  base: Extract<StructureDraft, { mediaType: "video" }>,
  c: BenchCase
): Extract<StructureDraft, { mediaType: "video" }> {
  const shotCountHintRaw = c.dropdownHints.find((h) => h.startsWith("shot_count:"))?.split(":")[1];
  const shotCountHint = Number(shotCountHintRaw);
  const shotCount = [1, 3, 4, 5].includes(shotCountHint) ? (shotCountHint as 1 | 3 | 4 | 5) : base.shotCount;
  const shotGrammar = c.dropdownHints.find((h) => h.startsWith("shot_grammar:"))?.split(":")[1] ?? "cut";
  const transitionHint = c.dropdownHints.find((h) => h.startsWith("transition:"))?.split(":")[1] ?? "same_space";
  const transition = (["same_space", "location_switch", "indoor_outdoor", "time_jump"].includes(transitionHint)
    ? transitionHint
    : "same_space") as "same_space" | "location_switch" | "indoor_outdoor" | "time_jump";

  const shots = Array.from({ length: shotCount }, (_, idx) => {
    const prev = base.shots[idx];
    const titleBase = prev?.title ?? (c.lang === "zh" ? `镜头 ${idx + 1}` : `Shot ${idx + 1}`);
    return {
      id: `shot_${idx + 1}`,
      index: idx + 1,
      title: `${shotGrammar} / ${titleBase}`,
      durationSec: 4,
      sceneLabel: prev?.sceneLabel ?? base.scene,
      objectIds: base.objects.map((item) => item.id),
      transitionFromPrev: (idx === 0 ? "none" : transition) as "none" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump",
      emphasis: `${base.expressionFocus} / ${shotGrammar}`
    };
  });

  return {
    ...base,
    shotCount,
    shots,
    sceneTransitions: shotCount > 1 ? transition : "none",
    continuity: Array.from(new Set([...base.continuity, `shot_grammar:${shotGrammar}`, ...c.dropdownHints]))
  };
}

function buildCanvasDraftFromCase(c: BenchCase): CanvasDraft {
  const mergedInput = `${c.step1}\n${c.step2}\n${c.dropdownHints.join("; ")}`.trim();
  const draft = generateStructureDraft({
    mediaType: c.mediaType,
    structureHint: c.structureHint,
    userInput: mergedInput,
    lang: c.lang
  });

  if (draft.mediaType === "video") {
    const videoDraft = applyVideoDropdowns(draft, c);
    videoDraft.primaryBrief = c.step1;
    videoDraft.secondaryBrief = c.step2;
    return structureDraftToCanvas(videoDraft, c.lang);
  }

  draft.primaryBrief = c.step1;
  draft.secondaryBrief = c.step2;
  draft.spatialRelations = Array.from(new Set([...draft.spatialRelations, ...c.dropdownHints]));
  return structureDraftToCanvas(draft, c.lang);
}

function v2PromptFromCanvas(lang: Lang, canvas: CanvasDraft): string {
  const intentPlan = canvasDraftToIntentPlan(canvas, lang);
  const state: ResultStructureState = {
    subjectX: 0.5,
    subjectY: 0.5,
    subjectSize: 0.26,
    subjectLayer: 4,
    compositionFocus: "center"
  };
  const project = intentPlanToProProject(intentPlan, state, lang);
  return generatePrompts(project, lang, "universal").trim();
}

function v3PromptFromCanvas(lang: Lang, ratio: "16:9" | "9:16" | "1:1", canvas: CanvasDraft): string {
  return generateQuickWorkspacePromptV3({ lang, draft: canvas, ratio }).trim();
}

function evaluate(c: BenchCase, canvas: CanvasDraft, v2: string, v3: string): CaseScore {
  const v2HasSeconds = /\b\d+\s*(?:秒|sec|secs|second|seconds)\b|\b\d+s\b/i.test(v2);
  const v3HasSeconds = /\b\d+\s*(?:秒|sec|secs|second|seconds)\b|\b\d+s\b/i.test(v3);
  const v2CoversStep1 = coversIntent(v2, c.step1, c.lang);
  const v3CoversStep1 = coversIntent(v3, c.step1, c.lang);
  const v2CoversStep2 = coversIntent(v2, c.step2, c.lang);
  const v3CoversStep2 = coversIntent(v3, c.step2, c.lang);
  const v3LeaksEngineInfo = /用户原始输入|结构抽取|执行规则|最高优先级|次优先级|补充约束|final model prompt|structured draft|execution rules/i.test(v3);
  const v3IsConcise = v3.length >= 80 && v3.length <= 1200 && !/\n\s*-\s*/.test(v3);
  const v3ShotCountAligned = canvas.mediaType === "video"
    ? (() => {
        const p = v3.toLowerCase();
        if (canvas.shotCount === 1) return /单镜头|single-shot|single shot/.test(p);
        const markers = [`${canvas.shotCount}镜头`, `${canvas.shotCount} shots`, `shot count ${canvas.shotCount}`];
        return markers.some((m) => p.includes(m.toLowerCase()));
      })()
    : true;

  let v2Score = 100;
  let v3Score = 100;
  const notes: string[] = [];

  if (!c.userProvidedSeconds && v2HasSeconds) {
    v2Score -= 20;
    notes.push("V2 injected seconds without user duration.");
  }
  if (!c.userProvidedSeconds && v3HasSeconds) {
    v3Score -= 20;
    notes.push("V3 still contains artificial seconds.");
  }
  if (!v2CoversStep1 || !v2CoversStep2) v2Score -= 20;
  if (!v3CoversStep1 || !v3CoversStep2) {
    v3Score -= 30;
    notes.push("V3 does not preserve user two-step intent.");
  }
  if (v3LeaksEngineInfo) {
    v3Score -= 30;
    notes.push("V3 leaks internal engine text.");
  }
  if (!v3IsConcise) {
    v3Score -= 20;
    notes.push("V3 is not concise/professional one-block prompt.");
  }
  if (!v3ShotCountAligned) {
    v3Score -= 20;
    notes.push("V3 shot count does not align with structure.");
  }
  if (v3.length < 80 || v3.length > 1800) v3Score -= 10;
  if (v2.length < 120 || v2.length > 12000) v2Score -= 10;

  v2Score = Math.max(0, v2Score);
  v3Score = Math.max(0, v3Score);

  return {
    caseId: c.id,
    mediaType: c.mediaType,
    conflictInjected: c.conflictInjected,
    userProvidedSeconds: c.userProvidedSeconds,
    v2: v2Score,
    v3: v3Score,
    v2HasSeconds,
    v3HasSeconds,
    v2CoversStep1,
    v3CoversStep1,
    v2CoversStep2,
    v3CoversStep2,
    v3ShotCountAligned,
    v3LeaksEngineInfo,
    v3IsConcise,
    notes
  };
}

async function main() {
  const countArg = Number(process.argv[2]);
  const count = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : 200;
  const outTag = process.argv[3] || `quick-v3-benchmark-${count}`;

  const root = process.cwd();
  const engineLock = await loadAndAssertEngineLock(root);
  const outDir = path.join(root, "tests/local-ab/outputs", outTag);
  await mkdir(outDir, { recursive: true });

  const cases = Array.from({ length: count }, (_, i) => makeCase(i));
  const results: Array<CaseScore & { v2Prompt: string; v3Prompt: string; step1: string; step2: string; ratio: string }> = [];

  for (const c of cases) {
    const canvas = buildCanvasDraftFromCase(c);
    const v2Prompt = v2PromptFromCanvas(c.lang, canvas);
    const v3Prompt = v3PromptFromCanvas(c.lang, c.ratio, canvas);
    const score = evaluate(c, canvas, v2Prompt, v3Prompt);
    results.push({
      ...score,
      v2Prompt,
      v3Prompt,
      step1: c.step1,
      step2: c.step2,
      ratio: c.ratio
    });
  }

  const avg = (arr: number[]) => Number((arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)).toFixed(2));
  const v2Avg = avg(results.map((r) => r.v2));
  const v3Avg = avg(results.map((r) => r.v3));
  const v2SecondsCases = results.filter((r) => !r.userProvidedSeconds && r.v2HasSeconds).length;
  const v3SecondsCases = results.filter((r) => !r.userProvidedSeconds && r.v3HasSeconds).length;
  const v3IntentPass = results.filter((r) => r.v3CoversStep1 && r.v3CoversStep2).length;
  const v3ShotAligned = results.filter((r) => r.v3ShotCountAligned).length;
  const v3NoLeak = results.filter((r) => !r.v3LeaksEngineInfo).length;
  const v3Concise = results.filter((r) => r.v3IsConcise).length;
  const gains = results.map((r) => r.v3 - r.v2);

  const summary = {
    generatedAt: new Date().toISOString(),
    tracking: {
      workspace: "quick",
      mediaMode: "mixed",
      engineId: "IM v5 + VI V5",
      engineLockHash: engineLock.lockHash,
      engineLockGeneratedAt: engineLock.lockGeneratedAt
    },
    totalCases: results.length,
    averages: {
      v2: v2Avg,
      v3: v3Avg,
      delta: Number((v3Avg - v2Avg).toFixed(2))
    },
    quality: {
      v2SecondsInjectionCases: v2SecondsCases,
      v3SecondsInjectionCases: v3SecondsCases,
      v3IntentCoverageRate: Number(((v3IntentPass / results.length) * 100).toFixed(2)),
      v3ShotCountAlignmentRate: Number(((v3ShotAligned / results.length) * 100).toFixed(2)),
      v3NoEngineLeakRate: Number(((v3NoLeak / results.length) * 100).toFixed(2)),
      v3ConciseRate: Number(((v3Concise / results.length) * 100).toFixed(2))
    },
    gains: {
      improvedCases: gains.filter((v) => v > 0).length,
      tiedCases: gains.filter((v) => v === 0).length,
      regressedCases: gains.filter((v) => v < 0).length
    }
  };

  const passGate =
    summary.quality.v3SecondsInjectionCases === 0 &&
    summary.quality.v3IntentCoverageRate >= 95 &&
    summary.quality.v3ShotCountAlignmentRate >= 95 &&
    summary.quality.v3NoEngineLeakRate >= 99 &&
    summary.quality.v3ConciseRate >= 95;

  const jsonOut = path.join(outDir, "quick-v3-benchmark.json");
  await writeFile(jsonOut, `${JSON.stringify({ summary, passGate, results }, null, 2)}\n`, "utf8");

  const worst = [...results].sort((a, b) => a.v3 - b.v3).slice(0, 12);
  const md = [
    `# Quick Workspace Prompt V3 Benchmark (${count} cases)`,
    "",
    `- Generated: ${summary.generatedAt}`,
    `- Workspace: ${summary.tracking.workspace}`,
    `- Media Mode: ${summary.tracking.mediaMode}`,
    `- Engine ID: ${summary.tracking.engineId}`,
    `- Engine Lock Hash: ${summary.tracking.engineLockHash}`,
    `- Cases: ${summary.totalCases}`,
    `- Avg Score V2: ${summary.averages.v2}`,
    `- Avg Score V3: ${summary.averages.v3}`,
    `- Avg Delta (V3-V2): ${summary.averages.delta}`,
    `- V2 seconds injection cases (user did not provide duration): ${summary.quality.v2SecondsInjectionCases}`,
    `- V3 seconds injection cases (user did not provide duration): ${summary.quality.v3SecondsInjectionCases}`,
    `- V3 intent coverage rate: ${summary.quality.v3IntentCoverageRate}%`,
    `- V3 shot-count alignment rate: ${summary.quality.v3ShotCountAlignmentRate}%`,
    `- V3 no-engine-leak rate: ${summary.quality.v3NoEngineLeakRate}%`,
    `- V3 concise-output rate: ${summary.quality.v3ConciseRate}%`,
    `- Improved/Tied/Regressed: ${summary.gains.improvedCases}/${summary.gains.tiedCases}/${summary.gains.regressedCases}`,
    `- Design Gate: ${passGate ? "PASS" : "FAIL"}`,
    "",
    "## Lowest V3 Cases",
    "| case | media | v2 | v3 | notes |",
    "|---|---|---:|---:|---|",
    ...worst.map((item) => `| ${item.caseId} | ${item.mediaType} | ${item.v2} | ${item.v3} | ${(item.notes.join("; ") || "-").replace(/\|/g, "/")} |`)
  ].join("\n");

  const mdOut = path.join(outDir, "quick-v3-benchmark.md");
  await writeFile(mdOut, `${md}\n`, "utf8");

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  if (!passGate) process.exitCode = 2;
}

void main();
