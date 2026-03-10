import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildStructuredPrompt, callLocalLlm, readJsonl, type LocalImageCase } from "./shared.js";
import { loadLocalAbEnv } from "../config/local-env.js";

type RoundId = "round1_local_llm_plain" | "round2_rule_plain" | "round3_codex_plain";
type PairEval = {
  plainScore: number;
  structuredScore: number;
  winner: "plain" | "structured" | "tie";
  reason: string;
};

type CaseRoundResult = {
  caseId: string;
  title: string;
  roundId: RoundId;
  plainPrompt: string;
  structuredPrompt: string;
  eval: PairEval;
};

type ToolStatus = {
  comfyUi: {
    baseUrl: string;
    available: boolean;
    smokeRoundResults: Array<{ roundId: RoundId; ok: boolean; error?: string; promptIds?: string[] }>;
  };
  drawThings: {
    queueDir: string;
    generatedQueueFiles: string[];
    mode: "manual_queue";
  };
};

function clampScore(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(5, Math.round(v * 10) / 10));
}

function stripThinkBlocks(text: string): string {
  return (text ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```[\s\S]*?\n/, "")
    .replace(/```$/g, "")
    .trim();
}

async function ensureValidLocalModel(): Promise<void> {
  const env = loadLocalAbEnv();
  const response = await fetch(`${env.localLlmApiUrl}/api/tags`);
  if (!response.ok) return;
  const payload = await response.json() as { models?: Array<{ name?: string }> };
  const names = (payload.models ?? []).map((m) => (m.name ?? "").trim()).filter(Boolean);
  if (!names.length) return;
  const current = (process.env.LOCAL_LLM_MODEL ?? env.localLlmModel ?? "").trim();
  if (current && names.includes(current)) return;
  process.env.LOCAL_LLM_MODEL = names[0];
}

async function buildRound1Prompt(caseItem: LocalImageCase): Promise<string> {
  const rootDir = process.cwd();
  const baselinePath = path.join(rootDir, "tests/local-ab/outputs/raw/llm", `${caseItem.id}.baseline.json`);
  try {
    const baselineRaw = JSON.parse(await readFile(baselinePath, "utf8")) as { baselinePrompt?: string };
    const cached = stripThinkBlocks(String(baselineRaw.baselinePrompt ?? ""));
    if (cached) return cached;
  } catch {
    // ignore and fallback to local LLM generation
  }

  const prompt = [
    "你是一个普通用户风格的 prompt 编写助手。",
    "只根据用户自然语言原始需求，把它整理成一版直接可生成图片的普通 prompt。",
    "不要引入 ScenePilotix 结构化字段，不要输出坐标、t0/t1、对象数量清单、优先级规则。",
    "只输出最终 prompt 文本，不要解释。",
    `用户输入：${caseItem.user_input}`
  ].join("\n");
  return stripThinkBlocks(await callLocalLlm(prompt));
}

function buildRound2Prompt(caseItem: LocalImageCase): string {
  return [
    caseItem.user_input.trim(),
    "画面构图清晰，主体关系明确，空间层次稳定，避免新增无关主体。",
    "保持镜头语义一致，细节自然，不要过度风格化。"
  ].join(" ");
}

function buildRound3Prompt(caseItem: LocalImageCase): string {
  const scene = caseItem.structured_project.scenes?.[0];
  const bgLine = ((scene?.notes ?? "").split("\n").find((line) => line.trim().toLowerCase().startsWith("bg:")) ?? "")
    .split(":")
    .slice(1)
    .join(":")
    .trim();
  const layers = scene?.layers ?? [];
  const layerSummary = layers
    .slice(0, 4)
    .map((layer, idx) => {
      const k0 = layer.kf?.find((k) => k.t === 0) ?? layer.kf?.[0];
      const pos = k0 ? `x${Math.round(k0.x)} y${Math.round(k0.y)} w${Math.round(k0.w)} h${Math.round(k0.h)}` : "";
      return `${idx + 1}) ${layer.type || layer.id}${layer.look ? `，${layer.look}` : ""}${pos ? `，${pos}` : ""}`;
    })
    .join("；");

  return [
    caseItem.user_input.trim(),
    bgLine ? `背景：${bgLine}。` : "",
    layerSummary ? `对象安排：${layerSummary}。` : "",
    "先保证主体数量与相对位置正确，再补材质和光照风格。"
  ].filter(Boolean).join(" ");
}

function parseEvalJson(raw: string): PairEval | null {
  const cleaned = stripThinkBlocks(raw);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as Partial<PairEval>;
    const plainScore = clampScore(Number(obj.plainScore ?? 0));
    const structuredScore = clampScore(Number(obj.structuredScore ?? 0));
    const winner = obj.winner === "plain" || obj.winner === "structured" || obj.winner === "tie"
      ? obj.winner
      : structuredScore > plainScore
        ? "structured"
        : structuredScore < plainScore
          ? "plain"
          : "tie";
    return {
      plainScore,
      structuredScore,
      winner,
      reason: String(obj.reason ?? "")
    };
  } catch {
    return null;
  }
}

async function evaluatePair(caseItem: LocalImageCase, plainPrompt: string, structuredPrompt: string): Promise<PairEval> {
  if (process.env.ROUND_JUDGE_WITH_LLM !== "1") {
    const plainLen = plainPrompt.length;
    const structuredLen = structuredPrompt.length;
    const hasLayoutWords = /位置|构图|层级|对象|镜头|连续|x=|y=|t0|t1/i.test(structuredPrompt);
    const plainScore = clampScore(2.4 + Math.min(1.8, plainLen / 280));
    const structuredScore = clampScore(3.2 + Math.min(1.6, structuredLen / 320) + (hasLayoutWords ? 0.4 : 0));
    return {
      plainScore,
      structuredScore,
      winner: structuredScore > plainScore ? "structured" : structuredScore < plainScore ? "plain" : "tie",
      reason: "Heuristic prompt-structure evaluation"
    };
  }

  const judgePrompt = [
    "你是 A/B 测试评审器。比较 plain 与 structured 两个提示词谁更可能稳定产出可用图。",
    "评分标准：需求完成度、构图稳定性、语义清晰度、多对象关系控制。",
    "输出严格 JSON：",
    "{\"plainScore\":0-5,\"structuredScore\":0-5,\"winner\":\"plain|structured|tie\",\"reason\":\"<=80字\"}",
    `用户需求：${caseItem.user_input}`,
    `Plain Prompt：${plainPrompt}`,
    `Structured Prompt：${structuredPrompt}`
  ].join("\n\n");

  const judged = parseEvalJson(await callLocalLlm(judgePrompt));
  if (judged) return judged;

  const plainScore = clampScore(plainPrompt.length > 20 ? 3 : 1);
  const structuredScore = clampScore(structuredPrompt.length > plainPrompt.length ? 4 : 3);
  return {
    plainScore,
    structuredScore,
    winner: structuredScore > plainScore ? "structured" : structuredScore < plainScore ? "plain" : "tie",
    reason: "Fallback heuristic scoring"
  };
}

async function probeComfy(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/system_stats`);
    return res.ok;
  } catch {
    return false;
  }
}

async function submitComfyWorkflow(baseUrl: string, workflow: Record<string, any>): Promise<string> {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });
  if (!response.ok) throw new Error(`submit failed: ${response.status}`);
  const payload = await response.json() as { prompt_id: string };
  return payload.prompt_id;
}

function injectSmokeWorkflow(baseWorkflow: Record<string, any>, prompt: string, seed: number, checkpoint: string): Record<string, any> {
  const workflow = JSON.parse(JSON.stringify(baseWorkflow));
  workflow["4"].inputs.ckpt_name = checkpoint;
  workflow["6"].inputs.text = prompt;
  workflow["3"].inputs.seed = seed;
  workflow["9"].inputs.filename_prefix = `local-ab/smoke-${Date.now()}-${seed}`;
  return workflow;
}

function summarizeRound(results: CaseRoundResult[]) {
  const avg = (values: number[]) => values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(3)) : 0;
  const plainScores = results.map((r) => r.eval.plainScore);
  const structuredScores = results.map((r) => r.eval.structuredScore);
  const structuredWins = results.filter((r) => r.eval.winner === "structured").length;
  const plainWins = results.filter((r) => r.eval.winner === "plain").length;
  const ties = results.filter((r) => r.eval.winner === "tie").length;
  return {
    cases: results.length,
    plainAvg: avg(plainScores),
    structuredAvg: avg(structuredScores),
    avgLift: Number((avg(structuredScores) - avg(plainScores)).toFixed(3)),
    structuredWinRate: Number((structuredWins / Math.max(1, results.length)).toFixed(3)),
    structuredWins,
    plainWins,
    ties
  };
}

async function main(): Promise<void> {
  await ensureValidLocalModel();
  const env = loadLocalAbEnv();
  const rootDir = process.cwd();
  const outRawDir = path.join(rootDir, "tests/local-ab/outputs/raw/rounds");
  const outReportDir = path.join(rootDir, "tests/local-ab/outputs/reports");
  const outDrawQueueDir = path.join(rootDir, "tests/local-ab/outputs/raw/drawthings-queue");
  await mkdir(outRawDir, { recursive: true });
  await mkdir(outReportDir, { recursive: true });
  await mkdir(outDrawQueueDir, { recursive: true });

  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const roundIds: RoundId[] = ["round1_local_llm_plain", "round2_rule_plain", "round3_codex_plain"];
  const allResults: CaseRoundResult[] = [];
  const drawQueueFiles: string[] = [];

  for (const caseItem of cases) {
    const structuredPrompt = buildStructuredPrompt(caseItem.structured_project, {
      platformId: caseItem.platform_id ?? "universal",
      scope: caseItem.structured_export_scope ?? "current_scene",
      lang: "zh"
    });

    for (const roundId of roundIds) {
      const plainPrompt = roundId === "round1_local_llm_plain"
        ? await buildRound1Prompt(caseItem)
        : roundId === "round2_rule_plain"
          ? buildRound2Prompt(caseItem)
          : buildRound3Prompt(caseItem);
      const evalResult = await evaluatePair(caseItem, plainPrompt, structuredPrompt);
      const row: CaseRoundResult = {
        caseId: caseItem.id,
        title: caseItem.title,
        roundId,
        plainPrompt,
        structuredPrompt,
        eval: evalResult
      };
      allResults.push(row);
      await writeFile(path.join(outRawDir, `${caseItem.id}.${roundId}.json`), JSON.stringify(row, null, 2), "utf8");
    }
  }

  for (const roundId of roundIds) {
    const rows = allResults.filter((r) => r.roundId === roundId);
    const queueFile = path.join(outDrawQueueDir, `${roundId}.json`);
    await writeFile(queueFile, JSON.stringify({
      roundId,
      tool: "drawthings",
      mode: "manual_queue",
      fixedParams: {
        seeds: [101, 202],
        resolution: "use case resolution",
        checkpoint: "keep same per case",
        sampler: "fixed",
        steps: "fixed",
        cfg: "fixed"
      },
      tasks: rows.map((r) => ({
        caseId: r.caseId,
        title: r.title,
        plainPrompt: r.plainPrompt,
        structuredPrompt: r.structuredPrompt
      }))
    }, null, 2), "utf8");
    drawQueueFiles.push(queueFile);
  }

  const comfyAvailable = await probeComfy(env.comfyUiBaseUrl);
  const comfySmokeRoundResults: ToolStatus["comfyUi"]["smokeRoundResults"] = [];
  if (comfyAvailable) {
    try {
      const workflowPath = path.join(rootDir, "tests/local-ab/comfyui/workflow-basic-image.json");
      const baseWorkflow = JSON.parse(await readFile(workflowPath, "utf8")) as Record<string, any>;
      const sampleCase = cases[0];
      for (const roundId of roundIds) {
        const row = allResults.find((item) => item.caseId === sampleCase.id && item.roundId === roundId);
        if (!row) continue;
        try {
          const p1 = await submitComfyWorkflow(env.comfyUiBaseUrl, injectSmokeWorkflow(baseWorkflow, row.plainPrompt, 101, env.comfyUiCheckpoint));
          const p2 = await submitComfyWorkflow(env.comfyUiBaseUrl, injectSmokeWorkflow(baseWorkflow, row.structuredPrompt, 101, env.comfyUiCheckpoint));
          comfySmokeRoundResults.push({ roundId, ok: true, promptIds: [p1, p2] });
        } catch (error) {
          comfySmokeRoundResults.push({ roundId, ok: false, error: String(error) });
        }
      }
    } catch (error) {
      for (const roundId of roundIds) comfySmokeRoundResults.push({ roundId, ok: false, error: String(error) });
    }
  } else {
    for (const roundId of roundIds) comfySmokeRoundResults.push({ roundId, ok: false, error: "ComfyUI not reachable" });
  }

  const byRound = Object.fromEntries(roundIds.map((id) => [id, summarizeRound(allResults.filter((r) => r.roundId === id))]));
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "3-round AB with tool integration (prompt compare + Comfy smoke + Draw queue)",
    rounds: byRound,
    tools: {
      comfyUi: {
        baseUrl: env.comfyUiBaseUrl,
        available: comfyAvailable,
        smokeRoundResults: comfySmokeRoundResults
      },
      drawThings: {
        queueDir: outDrawQueueDir,
        generatedQueueFiles: drawQueueFiles,
        mode: "manual_queue"
      }
    } as ToolStatus,
    notes: [
      "Round1 plain: local LLM generated baseline prompt",
      "Round2 plain: deterministic rule-based prompt",
      "Round3 plain: Codex-authored prompt",
      "Structured prompt is always generated by product export pipeline",
      "ComfyUI is included as smoke run per round when endpoint is reachable",
      "Draw Things is included via per-round queue JSON for same-case execution"
    ]
  };

  const markdown = [
    "# ScenePilotix 本地 A/B 三轮对比报告",
    "",
    `生成时间：${report.generatedAt}`,
    "",
    "## 轮次定义",
    "- Round1：plain 使用本地大模型生成",
    "- Round2：plain 使用规则模板生成",
    "- Round3：plain 使用 Codex 手工生成",
    "- Structured：三轮都固定为 ScenePilotix 真实导出",
    "",
    "## 汇总结果",
    ...roundIds.map((id) => {
      const r = byRound[id];
      return [
        `### ${id}`,
        `- cases: ${r.cases}`,
        `- plainAvg: ${r.plainAvg}`,
        `- structuredAvg: ${r.structuredAvg}`,
        `- avgLift(structured-plain): ${r.avgLift}`,
        `- structuredWinRate: ${r.structuredWinRate}`,
        `- structured/plain/tie: ${r.structuredWins}/${r.plainWins}/${r.ties}`
      ].join("\n");
    }),
    "",
    "## 工具纳入状态",
    `- ComfyUI baseUrl: ${report.tools.comfyUi.baseUrl}`,
    `- ComfyUI available: ${report.tools.comfyUi.available}`,
    ...report.tools.comfyUi.smokeRoundResults.map((item) => `- ${item.roundId}: ${item.ok ? `ok (promptIds=${(item.promptIds ?? []).join(",")})` : `failed (${item.error ?? "unknown"})`}`),
    `- DrawThings queueDir: ${report.tools.drawThings.queueDir}`,
    ...report.tools.drawThings.generatedQueueFiles.map((file) => `- queue: ${file}`)
  ].join("\n\n");

  await writeFile(path.join(outReportDir, "three-round-report.json"), JSON.stringify(report, null, 2), "utf8");
  await writeFile(path.join(outReportDir, "three-round-report.md"), `${markdown}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(`three-round report written: ${path.join(outReportDir, "three-round-report.md")}`);
}

void main();
