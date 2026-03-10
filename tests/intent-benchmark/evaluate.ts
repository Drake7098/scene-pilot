import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { briefToIntentPlanWithMode, type BriefParserMode } from "../../src/utils/briefParser.js";
import type { BenchmarkCase, EvalSummary, FieldMetric } from "./types.js";

type FieldDef = {
  key: string;
  weight: number;
  getExpected: (item: BenchmarkCase) => string | number;
  getActual: (item: BenchmarkCase, mode: BriefParserMode) => string | number;
};

const FIELDS: FieldDef[] = [
  { key: "mediaType", weight: 0.18, getExpected: (item) => item.expected.mediaType, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).mediaType },
  { key: "goal", weight: 0.16, getExpected: (item) => item.expected.goal, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).goal },
  { key: "subjectCount", weight: 0.15, getExpected: (item) => item.expected.subjectCount, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).subjects.length },
  { key: "framing", weight: 0.14, getExpected: (item) => item.expected.framing, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).camera.framing ?? "center" },
  { key: "backgroundDensity", weight: 0.12, getExpected: (item) => item.expected.backgroundDensity, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).scene.backgroundDensity ?? "normal" },
  { key: "ratio", weight: 0.08, getExpected: (item) => item.expected.ratio, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).ratio },
  { key: "location", weight: 0.06, getExpected: (item) => item.expected.location, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).scene.location ?? "generic scene" },
  { key: "style.genre", weight: 0.05, getExpected: (item) => item.expected.style.genre, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).style.genre ?? "" },
  { key: "style.lighting", weight: 0.04, getExpected: (item) => item.expected.style.lighting, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).style.lighting ?? "" },
  { key: "scene.timeOfDay", weight: 0.02, getExpected: (item) => item.expected.scene.timeOfDay, getActual: (item, mode) => briefToIntentPlanWithMode(item.brief, item.lang, mode).scene.timeOfDay ?? "unknown" }
];

type EvalFailure = {
  id: string;
  split: string;
  brief: string;
  expected: Record<string, string | number>;
  actual: Record<string, string | number>;
  mismatch: string[];
  signature: string;
};

function readDataset(datasetPath: string): BenchmarkCase[] {
  return readFileSync(datasetPath, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BenchmarkCase);
}

function toMetric(correct: number, total: number) {
  if (!total) return 0;
  return correct / total;
}

function evaluate(dataset: BenchmarkCase[], mode: BriefParserMode, datasetPath: string): { summary: EvalSummary; failures: EvalFailure[] } {
  const fieldCorrect: Record<string, number> = {};
  const fieldTotal: Record<string, number> = {};
  const weightedParts: Array<{ key: string; score: number; weight: number }> = [];
  const confusion: Record<string, Record<string, number>> = {};
  const failures: EvalFailure[] = [];
  const splitStats: Record<string, { weighted: number; count: number }> = {};

  for (const item of dataset) {
    const expected: Record<string, string | number> = {};
    const actual: Record<string, string | number> = {};
    const mismatch: string[] = [];
    let caseWeighted = 0;
    let caseTotalWeight = 0;

    for (const field of FIELDS) {
      const exp = field.getExpected(item);
      const act = field.getActual(item, mode);
      expected[field.key] = exp;
      actual[field.key] = act;
      fieldTotal[field.key] = (fieldTotal[field.key] ?? 0) + 1;
      const isCorrect = exp === act;
      if (isCorrect) fieldCorrect[field.key] = (fieldCorrect[field.key] ?? 0) + 1;
      caseWeighted += (isCorrect ? 1 : 0) * field.weight;
      caseTotalWeight += field.weight;
      if (!isCorrect) mismatch.push(field.key);
      const cKey = `${String(exp)} -> ${String(act)}`;
      confusion[field.key] = confusion[field.key] ?? {};
      confusion[field.key][cKey] = (confusion[field.key][cKey] ?? 0) + 1;
    }

    const caseScore = caseTotalWeight ? caseWeighted / caseTotalWeight : 0;
    const split = splitStats[item.split] ?? { weighted: 0, count: 0 };
    split.weighted += caseScore;
    split.count += 1;
    splitStats[item.split] = split;

    if (mismatch.length) {
      const signature = mismatch.sort().join("|");
      failures.push({
        id: item.id,
        split: item.split,
        brief: item.brief,
        expected,
        actual,
        mismatch,
        signature
      });
    }
  }

  const fieldMetrics: FieldMetric[] = FIELDS.map((field) => ({
    field: field.key,
    weight: field.weight,
    accuracy: toMetric(fieldCorrect[field.key] ?? 0, fieldTotal[field.key] ?? 0),
    correct: fieldCorrect[field.key] ?? 0,
    total: fieldTotal[field.key] ?? 0
  }));
  for (const metric of fieldMetrics) {
    weightedParts.push({
      key: metric.field,
      score: metric.accuracy,
      weight: metric.weight
    });
  }
  const weightedAccuracy = weightedParts.reduce((sum, item) => sum + item.score * item.weight, 0);

  const signatureMap: Record<string, number> = {};
  for (const failure of failures) {
    signatureMap[failure.signature] = (signatureMap[failure.signature] ?? 0) + 1;
  }
  const topFailures = Object.entries(signatureMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => ({ key, count }));

  const splitScores = Object.fromEntries(
    Object.entries(splitStats).map(([split, stats]) => [split, stats.count ? stats.weighted / stats.count : 0])
  );

  return {
    summary: {
      parserMode: mode,
      datasetPath,
      totalCases: dataset.length,
      overallScore: weightedAccuracy * 100,
      weightedAccuracy,
      fieldMetrics,
      topFailures,
      confusion,
      splitScores
    },
    failures
  };
}

function topConfusion(conf: Record<string, number>, limit = 10) {
  return Object.entries(conf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function renderReport(summary: EvalSummary, failures: EvalFailure[]) {
  const lines: string[] = [];
  lines.push(`# Intent Benchmark Report (${summary.parserMode})`);
  lines.push("");
  lines.push(`- Total cases: ${summary.totalCases}`);
  lines.push(`- Overall weighted score: ${(summary.overallScore).toFixed(2)}`);
  lines.push("");
  lines.push("## Field Accuracy");
  for (const metric of summary.fieldMetrics) {
    lines.push(`- ${metric.field}: ${(metric.accuracy * 100).toFixed(2)}% (weight ${metric.weight})`);
  }
  lines.push("");
  lines.push("## Split Scores");
  for (const [split, score] of Object.entries(summary.splitScores)) {
    lines.push(`- ${split}: ${(Number(score) * 100).toFixed(2)}%`);
  }
  lines.push("");
  lines.push("## Top Failure Signatures");
  for (const item of summary.topFailures.slice(0, 10)) {
    lines.push(`- ${item.key}: ${item.count}`);
  }
  lines.push("");
  lines.push("## Top Confusion");
  for (const field of ["mediaType", "goal", "subjectCount", "framing", "backgroundDensity"]) {
    lines.push(`### ${field}`);
    const conf = summary.confusion[field] ?? {};
    for (const row of topConfusion(conf, 8)) {
      lines.push(`- ${row.key}: ${row.count}`);
    }
    lines.push("");
  }
  lines.push("## Typical Failures");
  for (const item of failures.slice(0, 20)) {
    lines.push(`- [${item.id}] split=${item.split} mismatch=${item.mismatch.join(", ")}`);
    lines.push(`  - brief: ${item.brief}`);
  }
  return lines.join("\n");
}

function main() {
  const mode = (process.argv[2] as BriefParserMode | undefined) ?? "round3";
  const datasetPath = resolve(process.cwd(), "artifacts/intent-benchmark/dataset.jsonl");
  const outDir = resolve(process.cwd(), `artifacts/intent-benchmark/${mode}`);
  mkdirSync(outDir, { recursive: true });
  const dataset = readDataset(datasetPath);
  const { summary, failures } = evaluate(dataset, mode, datasetPath);
  writeFileSync(resolve(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf-8");
  writeFileSync(resolve(outDir, "failures.json"), JSON.stringify(failures.slice(0, 1000), null, 2), "utf-8");
  writeFileSync(resolve(outDir, "report.md"), renderReport(summary, failures), "utf-8");
  console.log(`${mode}: ${(summary.overallScore).toFixed(2)}`);
}

main();
