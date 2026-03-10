import path from "node:path";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { loadLocalAbEnv } from "../config/local-env.js";
import type { Lang } from "../../../src/i18n.js";
import { sanitizeProject, type Project } from "../../../src/model.js";
import { runPromptPipeline } from "../../../src/utils/promptPipeline.js";
import type { PlatformPresetId } from "../../../src/config/platformPresets.js";
import type { PromptExportScope } from "../../../src/types/export.js";

const PLATFORM_IDS: PlatformPresetId[] = ["universal", "midjourney", "runway", "pika", "luma", "krea", "jimeng", "keling", "vidu", "hailuo", "wanx"];
const DEFAULT_SCOPE: PromptExportScope = "current_scene";
const NOISE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\s+/g, " "],
  [/性感美女/g, "年轻女性"],
  [/美女/g, "女性"],
  [/帅哥/g, "年轻男性"],
  [/性感/g, "有吸引力"],
  [/爆乳|大胸/g, "外形突出"],
  [/hot girl/gi, "young woman"],
  [/sexy woman/gi, "young woman"],
  [/sexy girl/gi, "young woman"]
];

export type LocalProject = Project;
export type StructuredPromptVariant = "full" | "compact";

export type LocalImageCase = {
  id: string;
  title: string;
  category: string;
  user_input: string;
  structured_project: LocalProject;
  structured_export_scope?: PromptExportScope;
  platform_id?: PlatformPresetId;
  reference_images: string[];
  resolution: string;
  tags: string[];
};

export type LocalVideoCaseLite = {
  id: string;
  title: string;
  category: string;
  user_input: string;
  structured_project: LocalProject;
  structured_export_scope?: PromptExportScope;
  platform_id?: PlatformPresetId;
  reference_images: string[];
  duration_sec: number;
  aspect_ratio: string;
  tags: string[];
};

export async function readJsonl<T>(filePath: string): Promise<T[]> {
  const raw = await readFile(filePath, "utf8");
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line) as T);
}

export function stripThinkBlocks(text: string): string {
  return (text ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```[\s\S]*?\n/, "")
    .replace(/```$/g, "")
    .trim();
}

function normalizeProject(project: LocalProject): Project {
  const cloned = JSON.parse(JSON.stringify(project)) as Project;
  return sanitizeProject(cloned);
}

function normalizePlatformId(input?: string): PlatformPresetId {
  return PLATFORM_IDS.includes(input as PlatformPresetId) ? (input as PlatformPresetId) : "universal";
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(line.trim());
  }
  return out;
}

function compactObjectLine(line: string): string {
  return line
    .replace(/^-\s*/, "- ")
    .replace(/；对象局部提示：/g, "，局部：")
    .replace(/。?（仅作用于[^）]+）/g, "")
    .replace(/\s+/g, " ")
    .replace(/，,/g, "，")
    .replace(/。。+/g, "。")
    .trim();
}

function collectSection(lines: string[], header: string): string[] {
  const index = lines.findIndex((line) => line.trim() === header);
  if (index < 0) return [];
  const out: string[] = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    const cur = lines[i]?.trim() ?? "";
    if (!cur) continue;
    if (
      cur === "Camera Contract:" ||
      cur === "Layout Contract (obey strictly):" ||
      cur === "T0 Frame Spec:" ||
      cur === "T1 Frame Spec:" ||
      cur === "Anti-Director Rules:" ||
      cur === "[END]"
    ) break;
    out.push(cur);
  }
  return out;
}

function buildCompactStructuredPrompt(fullPrompt: string): string {
  const lines = (fullPrompt ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sceneLine = lines.find((line) => line.startsWith("Scene:")) ?? "";
  const cameraLines = collectSection(lines, "Camera Contract:")
    .filter((line) => line.startsWith("-"))
    .filter((line) => !/时长|duration|t0|t1/i.test(line))
    .slice(0, 3);
  const layoutLines = collectSection(lines, "Layout Contract (obey strictly):")
    .filter((line) => line.startsWith("-"))
    .filter((line) => !/阈值|density|密度/i.test(line))
    .slice(0, 3);
  const t0Lines = collectSection(lines, "T0 Frame Spec:")
    .filter((line) => line.startsWith("-"))
    .slice(0, 3)
    .map(compactObjectLine);
  const t1Lines = collectSection(lines, "T1 Frame Spec:")
    .filter((line) => line.startsWith("-"))
    .slice(0, 3)
    .map((line) => line.replace(/^-\s*/, "- ").replace(/\s+/g, " ").trim());

  const sceneMatch = sceneLine.match(/^Scene:\s*(.+?)\.\s*Style:\s*(.+)$/);
  const sceneText = sceneMatch ? sceneMatch[1].trim() : sceneLine.replace(/^Scene:\s*/, "").trim();
  const styleText = sceneMatch ? sceneMatch[2].trim() : "";

  const compactLines = dedupeLines([
    sceneText ? `Scene: ${sceneText}` : "",
    styleText ? `Style: ${styleText}` : "",
    cameraLines.length ? "Camera:" : "",
    ...cameraLines,
    layoutLines.length ? "Layout:" : "",
    ...layoutLines,
    t0Lines.length ? "Subjects:" : "",
    ...t0Lines,
    t1Lines.length ? "Motion:" : "",
    ...t1Lines,
    "Negative:",
    "- 不新增/删除主体，不重排站位，不自动居中/对称，不切镜头。"
  ]);
  return compactLines.join("\n").trimEnd();
}

export function normalizeUserIntentText(text: string): string {
  let next = (text ?? "").trim();
  for (const [pattern, value] of NOISE_REPLACEMENTS) {
    next = next.replace(pattern, value);
  }
  return next.trim();
}

export function buildStructuredPrompt(project: LocalProject, options?: {
  platformId?: PlatformPresetId;
  scope?: PromptExportScope;
  lang?: Lang;
  variant?: StructuredPromptVariant;
}): string {
  const normalized = normalizeProject(project);
  const scenes = normalized.scenes ?? [];
  if (!scenes.length) return "";

  const scope = options?.scope ?? DEFAULT_SCOPE;
  const exportScenes = scope === "continuous_sequence" && normalized.project.shotPlan === "continuous"
    ? scenes
    : [scenes[0]];
  const exportProject: Project = { ...normalized, scenes: exportScenes };

  const output = runPromptPipeline({
    project: exportProject,
    lang: options?.lang ?? "zh",
    platformId: normalizePlatformId(options?.platformId),
    scope
  });
  const finalPrompt = output.finalCopyPrompt.trimEnd();
  return options?.variant === "compact" ? buildCompactStructuredPrompt(finalPrompt) : finalPrompt;
}

export async function callLocalLlm(prompt: string): Promise<string> {
  const env = loadLocalAbEnv();
  const timeoutMs = Number(process.env.LOCAL_LLM_TIMEOUT_MS ?? "600000");
  const response = await fetch(`${env.localLlmApiUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.localLlmModel,
      prompt,
      stream: false,
      options: { temperature: 0.4 }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`Local LLM request failed: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json() as { response?: string };
  return (payload.response ?? "").trim();
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readJsonFiles<T>(dirPath: string, options?: { suffix?: string }): Promise<T[]> {
  try {
    const suffix = options?.suffix;
    const files = (await readdir(dirPath))
      .filter((item) => item.endsWith(".json"))
      .filter((item) => !suffix || item.endsWith(suffix))
      .sort((a, b) => a.localeCompare(b));
    const rows: T[] = [];
    for (const file of files) {
      rows.push(JSON.parse(await readFile(path.join(dirPath, file), "utf8")) as T);
    }
    return rows;
  } catch {
    return [];
  }
}
