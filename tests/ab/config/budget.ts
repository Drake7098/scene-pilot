import type { TaskType } from "./endpoints.js";

export type BudgetConfig = {
  totalBudgetUsd: number;
  firstPassBudgetUsd: number;
  imageBudgetUsd: number;
  videoBudgetUsd: number;
  maxTaskCostUsd: number;
};

export type BudgetState = {
  totalSpentUsd: number;
  imageSpentUsd: number;
  videoSpentUsd: number;
  skipped: string[];
};

export const DEFAULT_BUDGET: BudgetConfig = {
  totalBudgetUsd: 30,
  firstPassBudgetUsd: 15,
  imageBudgetUsd: 20,
  videoBudgetUsd: 10,
  maxTaskCostUsd: 0.8
};

export function createBudgetState(): BudgetState {
  return {
    totalSpentUsd: 0,
    imageSpentUsd: 0,
    videoSpentUsd: 0,
    skipped: []
  };
}

export function canRunWithinBudget(state: BudgetState, config: BudgetConfig, taskType: TaskType, estimatedCostUsd: number): { ok: boolean; reason?: string } {
  if (estimatedCostUsd > config.maxTaskCostUsd) {
    return { ok: false, reason: `estimated cost ${estimatedCostUsd.toFixed(3)} exceeds maxTaskCostUsd ${config.maxTaskCostUsd.toFixed(3)}` };
  }
  if (state.totalSpentUsd + estimatedCostUsd > config.totalBudgetUsd) {
    return { ok: false, reason: `total budget exceeded (${config.totalBudgetUsd.toFixed(2)} USD)` };
  }
  if (state.totalSpentUsd + estimatedCostUsd > config.firstPassBudgetUsd) {
    return { ok: false, reason: `first pass budget exceeded (${config.firstPassBudgetUsd.toFixed(2)} USD)` };
  }
  if (taskType === "image" && state.imageSpentUsd + estimatedCostUsd > config.imageBudgetUsd) {
    return { ok: false, reason: `image budget exceeded (${config.imageBudgetUsd.toFixed(2)} USD)` };
  }
  if (taskType === "video" && state.videoSpentUsd + estimatedCostUsd > config.videoBudgetUsd) {
    return { ok: false, reason: `video budget exceeded (${config.videoBudgetUsd.toFixed(2)} USD)` };
  }
  return { ok: true };
}

export function recordBudgetSpend(state: BudgetState, taskType: TaskType, spentUsd: number): BudgetState {
  state.totalSpentUsd += spentUsd;
  if (taskType === "image") state.imageSpentUsd += spentUsd;
  if (taskType === "video") state.videoSpentUsd += spentUsd;
  return state;
}
