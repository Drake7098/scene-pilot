import path from "node:path";
import { callLocalLlm, readJsonFiles, readJsonl, buildStructuredPrompt, writeJson, type LocalImageCase } from "./shared.js";

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const baselines = await readJsonFiles<{ caseId: string; baselinePrompt: string }>(
    path.join(rootDir, "tests/local-ab/outputs/raw/llm"),
    { suffix: ".baseline.json" }
  );
  const baselineMap = new Map(baselines.map((item) => [item.caseId, item.baselinePrompt]));

  for (const caseItem of cases) {
    const baselinePrompt = baselineMap.get(caseItem.id) ?? "";
    const structuredPrompt = buildStructuredPrompt(caseItem.structured_project, {
      platformId: caseItem.platform_id ?? "universal",
      scope: caseItem.structured_export_scope ?? "current_scene",
      lang: "zh"
    });
    const helperPrompt = [
      "请作为本地 AB 评审辅助助手。",
      "任务：比较 baseline prompt 与 structured prompt，给出一段简短人工评审草稿。",
      "关注：信息完整度、结构清晰度、可执行性、构图稳定性。",
      `用户输入：${caseItem.user_input}`,
      `Baseline Prompt：${baselinePrompt}`,
      `Structured Prompt：${structuredPrompt}`
    ].join("\n\n");
    const helperText = await callLocalLlm(helperPrompt);
    await writeJson(path.join(rootDir, "tests/local-ab/outputs/raw/llm", `${caseItem.id}.judge.json`), {
      caseId: caseItem.id,
      title: caseItem.title,
      plainSource: "Drake-DS local LLM baseline",
      structuredSource: "ScenePilotix product export pipeline (runPromptPipeline)",
      helperText,
      createdAt: new Date().toISOString()
    });
  }
}

void main();
