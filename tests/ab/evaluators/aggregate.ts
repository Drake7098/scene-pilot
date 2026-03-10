import type { RunOutput } from "../providers/base.js";
import type { ScoreRecord } from "./schema.js";
import { average, isScoreUsable } from "./score.js";

export type AggregatedSummary = {
  totals: {
    rawRuns: number;
    scoredRuns: number;
    totalCostUsdEstimate: number;
    imageRuns: number;
    videoRuns: number;
  };
  promptModes: Record<"plain" | "structured", {
    runs: number;
    scoredRuns: number;
    usableRate: number;
    averageUsabilityScore: number;
  }>;
  taskTypes: Record<"image" | "video", {
    plainUsableRate: number;
    structuredUsableRate: number;
    lift: number;
  }>;
  providers: Record<string, {
    runs: number;
    usableRate: number;
    averageUsabilityScore: number;
  }>;
  topImprovementCases: string[];
  noLiftCases: string[];
  failedRuns: string[];
};

export function aggregateResults(rawRuns: RunOutput[], scores: ScoreRecord[]): AggregatedSummary {
  const scoreKey = (score: ScoreRecord) => `${score.taskId}::${score.provider}::${score.endpoint}::${score.promptMode}`;
  const scoreMap = new Map(scores.map((score) => [scoreKey(score), score]));

  const byPromptMode = {
    plain: { runs: 0, scoredRuns: 0, usableCount: 0, usabilityScores: [] as number[] },
    structured: { runs: 0, scoredRuns: 0, usableCount: 0, usabilityScores: [] as number[] }
  };
  const providerBuckets = new Map<string, { runs: number; usableCount: number; usabilityScores: number[] }>();
  const taskModeBuckets = new Map<string, { usableCount: number; total: number }>();
  const failedRuns: string[] = [];

  for (const run of rawRuns) {
    byPromptMode[run.promptMode].runs += 1;
    const key = `${run.taskId}::${run.provider}::${run.endpoint}::${run.promptMode}`;
    const score = scoreMap.get(key);
    if (!providerBuckets.has(run.provider)) providerBuckets.set(run.provider, { runs: 0, usableCount: 0, usabilityScores: [] });
    const providerBucket = providerBuckets.get(run.provider)!;
    providerBucket.runs += 1;

    const taskModeKey = `${run.taskType}::${run.promptMode}`;
    const taskBucket = taskModeBuckets.get(taskModeKey) ?? { usableCount: 0, total: 0 };
    taskBucket.total += 1;
    taskModeBuckets.set(taskModeKey, taskBucket);

    if (!run.success) failedRuns.push(`${run.taskId}/${run.provider}/${run.endpoint}/${run.promptMode}`);
    if (!score) continue;

    byPromptMode[run.promptMode].scoredRuns += 1;
    byPromptMode[run.promptMode].usabilityScores.push(score.usabilityScore);
    providerBucket.usabilityScores.push(score.usabilityScore);

    if (isScoreUsable(score)) {
      byPromptMode[run.promptMode].usableCount += 1;
      providerBucket.usableCount += 1;
      taskBucket.usableCount += 1;
    }
  }

  const groupedByTask = new Map<string, ScoreRecord[]>();
  for (const score of scores) {
    const bucket = groupedByTask.get(score.taskId) ?? [];
    bucket.push(score);
    groupedByTask.set(score.taskId, bucket);
  }

  const taskDiffs = [...groupedByTask.entries()].map(([taskId, list]) => {
    const plain = list.filter((item) => item.promptMode === "plain");
    const structured = list.filter((item) => item.promptMode === "structured");
    const plainAvg = average(plain.map((item) => item.usabilityScore));
    const structuredAvg = average(structured.map((item) => item.usabilityScore));
    return { taskId, diff: Number((structuredAvg - plainAvg).toFixed(3)) };
  }).sort((a, b) => b.diff - a.diff);

  const taskLift = (taskType: "image" | "video") => {
    const plain = taskModeBuckets.get(`${taskType}::plain`) ?? { usableCount: 0, total: 0 };
    const structured = taskModeBuckets.get(`${taskType}::structured`) ?? { usableCount: 0, total: 0 };
    const plainRate = plain.total ? plain.usableCount / plain.total : 0;
    const structuredRate = structured.total ? structured.usableCount / structured.total : 0;
    return {
      plainUsableRate: Number(plainRate.toFixed(3)),
      structuredUsableRate: Number(structuredRate.toFixed(3)),
      lift: Number((structuredRate - plainRate).toFixed(3))
    };
  };

  return {
    totals: {
      rawRuns: rawRuns.length,
      scoredRuns: scores.length,
      totalCostUsdEstimate: Number(rawRuns.reduce((sum, item) => sum + item.costUsdEstimate, 0).toFixed(3)),
      imageRuns: rawRuns.filter((item) => item.taskType === "image").length,
      videoRuns: rawRuns.filter((item) => item.taskType === "video").length
    },
    promptModes: {
      plain: {
        runs: byPromptMode.plain.runs,
        scoredRuns: byPromptMode.plain.scoredRuns,
        usableRate: byPromptMode.plain.scoredRuns ? Number((byPromptMode.plain.usableCount / byPromptMode.plain.scoredRuns).toFixed(3)) : 0,
        averageUsabilityScore: average(byPromptMode.plain.usabilityScores)
      },
      structured: {
        runs: byPromptMode.structured.runs,
        scoredRuns: byPromptMode.structured.scoredRuns,
        usableRate: byPromptMode.structured.scoredRuns ? Number((byPromptMode.structured.usableCount / byPromptMode.structured.scoredRuns).toFixed(3)) : 0,
        averageUsabilityScore: average(byPromptMode.structured.usabilityScores)
      }
    },
    taskTypes: {
      image: taskLift("image"),
      video: taskLift("video")
    },
    providers: Object.fromEntries([...providerBuckets.entries()].map(([provider, bucket]) => [provider, {
      runs: bucket.runs,
      usableRate: bucket.usabilityScores.length ? Number((bucket.usableCount / bucket.usabilityScores.length).toFixed(3)) : 0,
      averageUsabilityScore: average(bucket.usabilityScores)
    }])),
    topImprovementCases: taskDiffs.filter((item) => item.diff > 0).slice(0, 3).map((item) => item.taskId),
    noLiftCases: taskDiffs.filter((item) => item.diff <= 0).slice(0, 3).map((item) => item.taskId),
    failedRuns
  };
}
