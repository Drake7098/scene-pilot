import fs from "node:fs";
import path from "node:path";

const inputDir = path.resolve(process.argv[2] || "tests/robots/artifacts/prompt-eval/simulated");
const rulesPath = path.resolve("tests/robots/config/prompt-eval-rules.json");
const outDir = path.resolve(process.argv[3] || "tests/robots/artifacts/prompt-eval");

const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".txt")).sort();

function normalize(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function applySynonyms(text, pairs = []) {
  let out = text;
  for (const [a, b] of pairs) {
    const canon = a.toLowerCase();
    const left = b.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(left, "gi"), canon);
  }
  return out;
}

function toRegExp(ruleItem) {
  if (ruleItem.type === "regex") return new RegExp(ruleItem.value, "i");
  const escaped = String(ruleItem.value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}

function ngrams(words, n = 3) {
  const out = [];
  for (let i = 0; i + n <= words.length; i += 1) out.push(words.slice(i, i + n).join(" "));
  return out;
}

function repeatLineRatio(lines) {
  if (!lines.length) return 0;
  const m = new Map();
  for (const l of lines) m.set(l, (m.get(l) || 0) + 1);
  let repeated = 0;
  for (const [, c] of m) if (c > 1) repeated += c;
  return repeated / lines.length;
}

function repeatNgramRatio(text) {
  const words = normalize(text).split(" ").filter(Boolean);
  const grams = ngrams(words, 3);
  if (!grams.length) return 0;
  const m = new Map();
  for (const g of grams) m.set(g, (m.get(g) || 0) + 1);
  let repeated = 0;
  for (const [, c] of m) if (c > 1) repeated += c;
  return repeated / grams.length;
}

function extractSceneTier(text) {
  const m = text.match(/@scene_tier:([a-z_]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function isAllStableCase(text) {
  return /保持静止构图|保持原位|static composition|stable layout/i.test(text);
}

function ruleApplies(ruleItem, text, sceneTier) {
  if (ruleItem.when === "all_stable" && !isAllStableCase(text)) return false;
  if (ruleItem.when_scene_tier && sceneTier !== String(ruleItem.when_scene_tier).toLowerCase()) return false;
  return true;
}

function conflictRate(text, pairs) {
  const t = normalize(text);
  let hits = 0;
  const matched = [];
  for (const [a, b] of pairs) {
    const ra = new RegExp(a, "i");
    const rb = new RegExp(b, "i");
    if (ra.test(t) && rb.test(t)) {
      hits += 1;
      matched.push([a, b]);
    }
  }
  return { rate: pairs.length ? hits / pairs.length : 0, matched };
}

function parseUserActions(text) {
  const m = text.match(/user_actions:\s*(.+)/i);
  if (!m) return [];
  return String(m[1])
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

function actionConflictCheck(text, userActions) {
  if (!userActions.length) return [];
  const t = normalize(text);
  const hit = [];

  const hasSit = userActions.some((a) => /坐/.test(a));
  const hasRun = userActions.some((a) => /跑|快走|慢走|挪|移动/.test(a));
  const hasEat = userActions.some((a) => /吃|进食|喝/.test(a));

  if (hasSit && /全程站立|保持站立|站着不动|stand still/i.test(t)) {
    hit.push("user_sit_vs_output_stand");
  }
  if (hasRun && /保持静止构图|保持原位|static composition|stays stable layout/i.test(t)) {
    hit.push("user_move_vs_output_static");
  }
  if (hasEat && /不做进食动作|禁止进食|双手空置|no eating/i.test(t)) {
    hit.push("user_eat_vs_output_no_eat");
  }

  return hit;
}

const cases = [];
for (const file of files) {
  const full = path.join(inputDir, file);
  const rawText = fs.readFileSync(full, "utf8");
  const text = applySynonyms(rawText, rules.synonym_whitelist || []);
  const lines = text.split(/\r?\n/).map((l) => normalize(l)).filter(Boolean);
  const sceneTier = extractSceneTier(text);
  const userActions = parseUserActions(text);

  const missingRequired = [];
  for (const item of rules.required || []) {
    if (!ruleApplies(item, text, sceneTier)) continue;
    const re = toRegExp(item);
    if (!re.test(text)) missingRequired.push(item.value);
  }

  const forbiddenHits = [];
  for (const item of rules.forbidden || []) {
    if (!ruleApplies(item, text, sceneTier)) continue;
    const re = toRegExp(item);
    if (re.test(text)) forbiddenHits.push(item.value);
  }

  const charCount = text.length;
  const lineRepeat = repeatLineRatio(lines);
  const gramRepeat = repeatNgramRatio(text);
  const conflict = conflictRate(text, rules.conflict_pairs || []);
  const actionConflicts = actionConflictCheck(text, userActions);

  let effectiveness = 100;
  if (missingRequired.length) effectiveness -= 12 * missingRequired.length;
  if (forbiddenHits.length) effectiveness -= 10 * forbiddenHits.length;
  if (charCount < rules.min_chars || charCount > rules.max_chars) effectiveness -= 15;
  if (lineRepeat > rules.max_repeat_line_ratio) effectiveness -= 10;
  if (gramRepeat > rules.max_repeat_ngram_ratio) effectiveness -= 10;
  if (conflict.rate > rules.target_conflict_rate) effectiveness -= 20;
  if (actionConflicts.length) effectiveness -= 15;
  effectiveness = Math.max(0, effectiveness);

  cases.push({
    file,
    sceneTier,
    charCount,
    missingRequired,
    forbiddenHits,
    repeatLineRatio: Number(lineRepeat.toFixed(4)),
    repeatNgramRatio: Number(gramRepeat.toFixed(4)),
    conflictRate: Number(conflict.rate.toFixed(4)),
    conflictPairsMatched: conflict.matched,
    userActions,
    actionConflicts,
    effectiveness
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  inputDir,
  totals: {
    files: cases.length,
    avgEffectiveness: Number((cases.reduce((a, c) => a + c.effectiveness, 0) / Math.max(1, cases.length)).toFixed(2)),
    avgRepeatLineRatio: Number((cases.reduce((a, c) => a + c.repeatLineRatio, 0) / Math.max(1, cases.length)).toFixed(4)),
    avgRepeatNgramRatio: Number((cases.reduce((a, c) => a + c.repeatNgramRatio, 0) / Math.max(1, cases.length)).toFixed(4)),
    avgConflictRate: Number((cases.reduce((a, c) => a + c.conflictRate, 0) / Math.max(1, cases.length)).toFixed(4)),
    conflictPairCases: cases.filter((c) => c.conflictRate > 0).length,
    actionConflictCases: cases.filter((c) => c.actionConflicts.length > 0).length,
    requiredMissingCases: cases.filter((c) => c.missingRequired.length > 0).length,
    forbiddenHitCases: cases.filter((c) => c.forbiddenHits.length > 0).length,
    correctionRate: 0,
    structuralConsistencyRate: 0,
    requiredPassRate: 0,
    forbiddenCleanRate: 0
  },
  cases
};

summary.totals.correctionRate = Number((((summary.totals.files - summary.totals.actionConflictCases) / Math.max(1, summary.totals.files)) * 100).toFixed(2));
summary.totals.structuralConsistencyRate = Number((((summary.totals.files - summary.totals.conflictPairCases) / Math.max(1, summary.totals.files)) * 100).toFixed(2));
summary.totals.requiredPassRate = Number((((summary.totals.files - summary.totals.requiredMissingCases) / Math.max(1, summary.totals.files)) * 100).toFixed(2));
summary.totals.forbiddenCleanRate = Number((((summary.totals.files - summary.totals.forbiddenHitCases) / Math.max(1, summary.totals.files)) * 100).toFixed(2));

const jsonPath = path.join(outDir, "prompt-quality-report.json");
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);

const md = [
  "# Prompt Quality Report",
  "",
  `- Generated: ${summary.generatedAt}`,
  `- Input: ${summary.inputDir}`,
  `- Files: ${summary.totals.files}`,
  `- Avg effectiveness: ${summary.totals.avgEffectiveness}`,
  `- Avg repeat(line): ${summary.totals.avgRepeatLineRatio}`,
  `- Avg repeat(3-gram): ${summary.totals.avgRepeatNgramRatio}`,
  `- Avg conflict: ${summary.totals.avgConflictRate}`,
  `- Conflict-pair cases: ${summary.totals.conflictPairCases}`,
  `- Action-conflict cases: ${summary.totals.actionConflictCases}`,
  `- Missing-required cases: ${summary.totals.requiredMissingCases}`,
  `- Forbidden-hit cases: ${summary.totals.forbiddenHitCases}`,
  `- correctionRate: ${summary.totals.correctionRate}%`,
  `- structuralConsistencyRate: ${summary.totals.structuralConsistencyRate}%`,
  `- requiredPassRate: ${summary.totals.requiredPassRate}%`,
  `- forbiddenCleanRate: ${summary.totals.forbiddenCleanRate}%`,
  "",
  "## Cases",
  "| file | tier | score | conflict | action conflicts | missing required | forbidden hits |",
  "|---|---|---:|---:|---|---|---|",
  ...cases.map((c) => `| ${c.file} | ${c.sceneTier || "-"} | ${c.effectiveness} | ${c.conflictRate} | ${c.actionConflicts.join("; ") || "-"} | ${c.missingRequired.join("; ") || "-"} | ${c.forbiddenHits.join("; ") || "-"} |`)
].join("\n");

const mdPath = path.join(outDir, "prompt-quality-report.md");
fs.writeFileSync(mdPath, `${md}\n`);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
