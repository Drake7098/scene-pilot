import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Summary = {
  parserMode: string;
  overallScore: number;
  fieldMetrics: Array<{ field: string; accuracy: number }>;
  topFailures: Array<{ key: string; count: number }>;
};

const MODES = ["baseline", "round1", "round2", "round3"] as const;

function loadSummary(mode: string): Summary {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `artifacts/intent-benchmark/${mode}/summary.json`), "utf-8")
  ) as Summary;
}

function main() {
  const rows = MODES.map((mode) => loadSummary(mode));
  const lines: string[] = [];
  lines.push("# Intent Benchmark Rounds");
  lines.push("");
  lines.push("| Mode | Overall Score | Delta |");
  lines.push("|---|---:|---:|");
  for (let i = 0; i < rows.length; i += 1) {
    const curr = rows[i];
    const prev = rows[i - 1];
    const delta = prev ? curr.overallScore - prev.overallScore : 0;
    lines.push(`| ${curr.parserMode} | ${curr.overallScore.toFixed(2)} | ${delta >= 0 ? "+" : ""}${delta.toFixed(2)} |`);
  }
  lines.push("");
  lines.push("## Highest Frequency Failure Signatures (Latest)");
  for (const item of rows[rows.length - 1].topFailures.slice(0, 10)) {
    lines.push(`- ${item.key}: ${item.count}`);
  }
  lines.push("");
  lines.push("## Key Field Trends");
  const tracked = ["mediaType", "goal", "subjectCount", "framing", "backgroundDensity", "ratio", "location"];
  for (const field of tracked) {
    const cells = rows.map((row) => {
      const hit = row.fieldMetrics.find((metric) => metric.field === field);
      return `${row.parserMode}:${((hit?.accuracy ?? 0) * 100).toFixed(2)}%`;
    });
    lines.push(`- ${field}: ${cells.join(" -> ")}`);
  }

  writeFileSync(resolve(process.cwd(), "artifacts/intent-benchmark/rounds-report.md"), `${lines.join("\n")}\n`, "utf-8");
  writeFileSync(resolve(process.cwd(), "artifacts/intent-benchmark/rounds-report.json"), JSON.stringify(rows, null, 2), "utf-8");
  console.log("round report generated");
}

main();
