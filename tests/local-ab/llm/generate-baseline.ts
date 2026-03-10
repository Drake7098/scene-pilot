import path from "node:path";
import { buildStructuredPrompt, readJsonl, callLocalLlm, normalizeUserIntentText, stripThinkBlocks, writeJson, type LocalImageCase } from "./shared.js";

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const caseLimit = Number(process.env.LOCAL_AB_CASE_LIMIT ?? `${cases.length}`);
  for (const caseItem of cases.slice(0, Math.min(caseLimit, cases.length))) {
    const userInputRaw = caseItem.user_input;
    const userIntentNormalized = normalizeUserIntentText(userInputRaw);
    const prompt = [
      "你是一个普通用户风格的 prompt 编写助手。",
      "只根据用户自然语言原始需求，把它整理成一版直接可生成图片的普通 prompt。",
      "不要引入 ScenePilotix 结构化字段，不要输出坐标、t0/t1、对象数量清单、优先级规则。",
      "保持自然语言、直接、可生成。",
      `用户输入：${userIntentNormalized}`
    ].join("\n");
    const baselinePrompt = stripThinkBlocks(await callLocalLlm(prompt));
    const structuredPrompt = buildStructuredPrompt(caseItem.structured_project, {
      platformId: caseItem.platform_id ?? "universal",
      scope: caseItem.structured_export_scope ?? "current_scene",
      lang: "zh"
    });
    const structuredPromptCompact = buildStructuredPrompt(caseItem.structured_project, {
      platformId: caseItem.platform_id ?? "universal",
      scope: caseItem.structured_export_scope ?? "current_scene",
      lang: "zh",
      variant: "compact"
    });
    await writeJson(path.join(rootDir, "tests/local-ab/outputs/raw/llm", `${caseItem.id}.baseline.json`), {
      caseId: caseItem.id,
      title: caseItem.title,
      userInput: userInputRaw,
      userInputRaw,
      userIntentNormalized,
      baselinePrompt,
      generatedPrompt: baselinePrompt,
      promptSource: "plain_baseline_llm",
      createdAt: new Date().toISOString()
    });
    await writeJson(path.join(rootDir, "tests/local-ab/outputs/raw/prompts", `${caseItem.id}.json`), {
      caseId: caseItem.id,
      title: caseItem.title,
      category: caseItem.category,
      toolchain: {
        plain: "Drake-DS local LLM",
        structured: "ScenePilotix product export pipeline (runPromptPipeline)"
      },
      userInput: userInputRaw,
      userInputRaw,
      userIntentNormalized,
      platformId: caseItem.platform_id ?? "universal",
      exportScope: caseItem.structured_export_scope ?? "current_scene",
      baselinePrompt,
      structuredPrompt,
      structuredPromptCompact,
      prompts: {
        plain: {
          promptSource: "plain_baseline_llm",
          generatedPrompt: baselinePrompt
        },
        structuredFull: {
          promptSource: "structured_full_export",
          generatedPrompt: structuredPrompt
        },
        structuredCompact: {
          promptSource: "structured_compact_export",
          generatedPrompt: structuredPromptCompact
        }
      },
      createdAt: new Date().toISOString()
    });
  }
}

void main();
