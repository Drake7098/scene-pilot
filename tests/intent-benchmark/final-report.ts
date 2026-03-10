import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Summary = {
  parserMode: string;
  overallScore: number;
  fieldMetrics: Array<{ field: string; accuracy: number }>;
  topFailures: Array<{ key: string; count: number }>;
};

function loadSummary(mode: string): Summary {
  return JSON.parse(readFileSync(resolve(process.cwd(), `artifacts/intent-benchmark/${mode}/summary.json`), "utf-8")) as Summary;
}

function main() {
  const baseline = loadSummary("baseline");
  const round1 = loadSummary("round1");
  const round2 = loadSummary("round2");
  const round3 = loadSummary("round3");
  const sampleRows = JSON.parse(readFileSync(resolve(process.cwd(), "artifacts/intent-benchmark/image-samples/index.json"), "utf-8")) as Array<Record<string, string>>;
  const sampleOk = sampleRows.filter((row) => !!row.round3Image).length;
  const sampleFail = sampleRows.length - sampleOk;

  const lines: string[] = [];
  lines.push("# Intent Benchmark Final Report");
  lines.push("");
  lines.push("## Score Summary");
  lines.push(`- baseline: ${baseline.overallScore.toFixed(2)}`);
  lines.push(`- round1: ${round1.overallScore.toFixed(2)} (delta ${(round1.overallScore - baseline.overallScore).toFixed(2)})`);
  lines.push(`- round2: ${round2.overallScore.toFixed(2)} (delta ${(round2.overallScore - round1.overallScore).toFixed(2)})`);
  lines.push(`- round3: ${round3.overallScore.toFixed(2)} (delta ${(round3.overallScore - round2.overallScore).toFixed(2)})`);
  lines.push("");
  lines.push("## Final Top Failures");
  for (const item of round3.topFailures.slice(0, 10)) {
    lines.push(`- ${item.key}: ${item.count}`);
  }
  lines.push("");
  lines.push("## Field Accuracies (Round3)");
  for (const field of round3.fieldMetrics) {
    lines.push(`- ${field.field}: ${(field.accuracy * 100).toFixed(2)}%`);
  }
  lines.push("");
  lines.push("## Local Image Sampling");
  lines.push(`- total samples: ${sampleRows.length}`);
  lines.push(`- successful generations: ${sampleOk}`);
  lines.push(`- failed generations: ${sampleFail}`);
  lines.push(`- index: ${resolve(process.cwd(), "artifacts/intent-benchmark/image-samples/index.json")}`);
  lines.push("");
  lines.push("## Next Focus");
  lines.push("- Improve style genre and lighting extraction under mixed-language noisy briefs.");
  lines.push("- Add stronger noun phrase extraction to reduce subject over-segmentation.");
  lines.push("- Add explicit negation handling for adversarial mediaType phrases.");

  writeFileSync(resolve(process.cwd(), "artifacts/intent-benchmark/final-report.md"), `${lines.join("\n")}\n`, "utf-8");
  console.log("final report generated");
}

main();
