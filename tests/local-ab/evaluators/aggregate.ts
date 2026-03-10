import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ImageScoreRecord, LocalAbSummary, LocalTool, PromptMode } from "./schema.js";

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

export async function readScoreRecords(scoredDir: string): Promise<ImageScoreRecord[]> {
  try {
    const files = (await readdir(scoredDir)).filter((item) => item.endsWith(".json"));
    const rows: ImageScoreRecord[] = [];
    for (const file of files) {
      const raw = await readFile(path.join(scoredDir, file), "utf8");
      rows.push(JSON.parse(raw) as ImageScoreRecord);
    }
    return rows;
  } catch {
    return [];
  }
}

export function aggregateLocalScores(scores: ImageScoreRecord[]): LocalAbSummary {
  const promptModes: Record<PromptMode, { usable: number; total: number; values: number[] }> = {
    plain: { usable: 0, total: 0, values: [] },
    structured: { usable: 0, total: 0, values: [] }
  };
  const tools: Record<LocalTool, { usable: number; total: number; values: number[] }> = {
    drawthings: { usable: 0, total: 0, values: [] },
    comfyui: { usable: 0, total: 0, values: [] }
  };
  const caseMap = new Map<string, ImageScoreRecord[]>();

  for (const score of scores) {
    promptModes[score.promptMode].total += 1;
    promptModes[score.promptMode].values.push(score.usabilityScore);
    if (score.isUsable || score.usabilityScore >= 4) promptModes[score.promptMode].usable += 1;

    tools[score.tool].total += 1;
    tools[score.tool].values.push(score.usabilityScore);
    if (score.isUsable || score.usabilityScore >= 4) tools[score.tool].usable += 1;

    const bucket = caseMap.get(score.caseId) ?? [];
    bucket.push(score);
    caseMap.set(score.caseId, bucket);
  }

  const categoryBuckets = new Map<string, { plain: number[]; structured: number[] }>();
  for (const [caseId, rows] of caseMap.entries()) {
    const category = caseId.split("_")[0] ?? "misc";
    const bucket = categoryBuckets.get(category) ?? { plain: [], structured: [] };
    for (const row of rows) bucket[row.promptMode].push(row.usabilityScore);
    categoryBuckets.set(category, bucket);
  }

  const caseLift = [...caseMap.entries()].map(([caseId, rows]) => {
    const plain = rows.filter((row) => row.promptMode === "plain").map((row) => row.usabilityScore);
    const structured = rows.filter((row) => row.promptMode === "structured").map((row) => row.usabilityScore);
    return { caseId, lift: Number((avg(structured) - avg(plain)).toFixed(3)) };
  }).sort((a, b) => b.lift - a.lift);

  return {
    totals: {
      scoredImages: scores.length,
      drawThingsRuns: scores.filter((row) => row.tool === "drawthings").length,
      comfyUiRuns: scores.filter((row) => row.tool === "comfyui").length
    },
    promptModes: {
      plain: {
        usableRate: promptModes.plain.total ? Number((promptModes.plain.usable / promptModes.plain.total).toFixed(3)) : 0,
        averageUsability: avg(promptModes.plain.values)
      },
      structured: {
        usableRate: promptModes.structured.total ? Number((promptModes.structured.usable / promptModes.structured.total).toFixed(3)) : 0,
        averageUsability: avg(promptModes.structured.values)
      }
    },
    tools: {
      drawthings: {
        usableRate: tools.drawthings.total ? Number((tools.drawthings.usable / tools.drawthings.total).toFixed(3)) : 0,
        averageUsability: avg(tools.drawthings.values)
      },
      comfyui: {
        usableRate: tools.comfyui.total ? Number((tools.comfyui.usable / tools.comfyui.total).toFixed(3)) : 0,
        averageUsability: avg(tools.comfyui.values)
      }
    },
    categories: Object.fromEntries([...categoryBuckets.entries()].map(([category, bucket]) => {
      const plainUsableRate = bucket.plain.length ? bucket.plain.filter((value) => value >= 4).length / bucket.plain.length : 0;
      const structuredUsableRate = bucket.structured.length ? bucket.structured.filter((value) => value >= 4).length / bucket.structured.length : 0;
      return [category, {
        plainUsableRate: Number(plainUsableRate.toFixed(3)),
        structuredUsableRate: Number(structuredUsableRate.toFixed(3)),
        lift: Number((structuredUsableRate - plainUsableRate).toFixed(3))
      }];
    })),
    topLiftCases: caseLift.filter((item) => item.lift > 0).slice(0, 5).map((item) => item.caseId),
    unstableCases: caseLift.filter((item) => item.lift <= 0).slice(0, 5).map((item) => item.caseId)
  };
}
