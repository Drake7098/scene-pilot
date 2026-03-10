import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_BUDGET, canRunWithinBudget, createBudgetState, recordBudgetSpend, type BudgetConfig, type BudgetState } from "../config/budget.js";
import type { EndpointConfig, TaskType } from "../config/endpoints.js";
import { FalAdapter } from "../providers/fal.js";
import { ReplicateAdapter } from "../providers/replicate.js";
import type { ProviderAdapter, RunInput, RunOutput } from "../providers/base.js";

export type AbCase = {
  id: string;
  type: TaskType;
  category: string;
  title: string;
  user_input: string;
  plain_prompt: string;
  structured_prompt: string;
  reference_images: string[];
  resolution?: string;
  duration_sec?: number;
  aspect_ratio?: string;
  tags: string[];
};

const providers: Record<string, ProviderAdapter> = {
  replicate: new ReplicateAdapter(),
  fal: new FalAdapter()
};

export async function readJsonlCases(filePath: string): Promise<AbCase[]> {
  const raw = await readFile(filePath, "utf8");
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line) as AbCase);
}

export async function loadExistingRuns(dir: string): Promise<RunOutput[]> {
  try {
    const files = (await readdir(dir)).filter((item) => item.endsWith(".json"));
    const runs: RunOutput[] = [];
    for (const file of files) {
      const raw = await readFile(path.join(dir, file), "utf8");
      runs.push(JSON.parse(raw) as RunOutput);
    }
    return runs;
  } catch {
    return [];
  }
}

export function createRunnerContext(rootDir: string, budget: BudgetConfig = DEFAULT_BUDGET): { budget: BudgetConfig; state: BudgetState; rootDir: string } {
  return { budget, state: createBudgetState(), rootDir };
}

export async function runTaskMatrix(params: {
  rootDir: string;
  taskType: TaskType;
  cases: AbCase[];
  endpoints: EndpointConfig[];
  budget?: BudgetConfig;
}): Promise<RunOutput[]> {
  const context = createRunnerContext(params.rootDir, params.budget ?? DEFAULT_BUDGET);
  const outputRootDir = path.join(params.rootDir, "tests/ab/outputs");
  const runs: RunOutput[] = [];

  for (const caseItem of params.cases) {
    for (const endpoint of params.endpoints) {
      for (const promptMode of ["plain", "structured"] as const) {
        const prompt = promptMode === "plain" ? caseItem.plain_prompt : caseItem.structured_prompt;
        const estimatedCostUsd = endpoint.estimateCostUsd({
          resolution: caseItem.resolution,
          durationSec: caseItem.duration_sec,
          aspectRatio: caseItem.aspect_ratio
        });
        const budgetDecision = canRunWithinBudget(context.state, context.budget, params.taskType, estimatedCostUsd);
        if (!budgetDecision.ok) {
          context.state.skipped.push(`${caseItem.id}/${endpoint.id}/${promptMode}: ${budgetDecision.reason}`);
          continue;
        }

        const provider = providers[endpoint.provider];
        const input: RunInput = {
          taskId: caseItem.id,
          taskType: params.taskType,
          provider: endpoint.provider,
          endpoint: endpoint.endpoint,
          promptMode,
          prompt,
          title: caseItem.title,
          resolution: caseItem.resolution,
          durationSec: caseItem.duration_sec,
          aspectRatio: caseItem.aspect_ratio,
          referenceImages: caseItem.reference_images,
          outputRootDir,
          estimatedCostUsd,
          defaultInput: endpoint.defaultInput
        };

        const run = await provider.run(input);
        runs.push(run);
        recordBudgetSpend(context.state, params.taskType, run.costUsdEstimate);
        const rawDir = path.join(outputRootDir, "raw", params.taskType === "image" ? "images" : "videos");
        const fileName = `${caseItem.id}__${endpoint.id}__${promptMode}.json`;
        await writeFile(path.join(rawDir, fileName), JSON.stringify(run, null, 2), "utf8");
      }
    }
  }

  await writeFile(path.join(outputRootDir, "reports", `${params.taskType}-budget-state.json`), JSON.stringify(context.state, null, 2), "utf8");
  return runs;
}
