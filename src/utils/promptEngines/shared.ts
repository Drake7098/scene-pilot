import type { Lang } from "../../i18n";
import { getPlatformCapability, type PlatformProfile } from "../../config/platformCapabilities";
import type { PlatformPresetId } from "../../config/platformPresets";
import type { PlatformAdaptInput, PlatformAdaptResult } from "./types";

export type PlatformPatch = {
  density?: "default" | "compact";
  keepStructuredBlocks?: boolean;
  compressTail?: boolean;
  budgetFactor?: number;
  refsHintMode?: "default" | "strict" | "minimal";
};

const PATCHES: Partial<Record<PlatformPresetId, PlatformPatch>> = {
  pika: { density: "compact", keepStructuredBlocks: false, compressTail: true, budgetFactor: 0.84, refsHintMode: "minimal" },
  luma: { density: "compact", keepStructuredBlocks: true, compressTail: true, budgetFactor: 0.86, refsHintMode: "minimal" },
  vidu: { density: "default", keepStructuredBlocks: true, compressTail: false, budgetFactor: 0.92, refsHintMode: "default" },
  hailuo: { density: "compact", keepStructuredBlocks: true, compressTail: true, budgetFactor: 0.88, refsHintMode: "strict" },
  keling: { density: "compact", keepStructuredBlocks: false, compressTail: true, budgetFactor: 0.82, refsHintMode: "strict" },
  wanx: { density: "default", keepStructuredBlocks: true, compressTail: false, budgetFactor: 0.94, refsHintMode: "default" }
};

export function resolvePlatformPatch(platformId?: PlatformPresetId): PlatformPatch {
  return platformId ? (PATCHES[platformId] ?? {}) : {};
}

export function patchNames(platformId?: PlatformPresetId, patch?: PlatformPatch): string[] {
  if (!platformId || !patch) return [];
  const out: string[] = [];
  if (patch.density === "compact") out.push("compact_density");
  if (patch.keepStructuredBlocks) out.push("keep_structured_blocks");
  if (patch.compressTail) out.push("compress_machine_tail");
  if (patch.budgetFactor && patch.budgetFactor < 1) out.push("budget_factor_trim");
  if (patch.refsHintMode && patch.refsHintMode !== "default") out.push(`refs_${patch.refsHintMode}`);
  if (!out.length) out.push(`${platformId}_patch`);
  return out;
}

function normalizeSpaces(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function isSystemTailMarker(line: string): boolean {
  const t = (line ?? "").trim();
  if (!t) return false;
  const low = t.toLowerCase();
  if (low.includes("system structural control layer")) return true;
  if (line.includes("系统结构控制层") || line.includes("系统追加结构控制层")) return true;
  if (/system.*structural.*control.*layer/i.test(t)) return true;
  if (/系统.*结构.*控制层/.test(t)) return true;
  return false;
}

function isSystemTailSignal(line: string): boolean {
  const t = (line ?? "").trim();
  if (!t) return false;
  const low = t.toLowerCase();
  if (/^【系统稳定层/.test(t)) return true;
  if (/^\[stability layer/i.test(t)) return true;
  if (/^【语言强化层】/.test(t)) return true;
  if (/^\[lrl\]/i.test(t)) return true;
  if (/^【坐标/.test(t)) return true;
  if (/^\[coords/i.test(t)) return true;
  if (t.includes("坐标数字仅作内部控制")) return true;
  if (low.includes("control metadata")) return true;
  return false;
}

export function dedupeLines(input: string): string {
  const lines = input.split("\n");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = normalizeSpaces(line);
    if (!key) {
      out.push("");
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function dropConflictLines(lines: string[]): string[] {
  const joined = lines.join("\n").toLowerCase();
  const hasNoText = /no text|no subtitles/.test(joined);
  const hasNoOverlay = /no overlays/.test(joined);
  const hasNoCenter = /no auto-centering|不自动居中/.test(joined);
  const hasStatic = /当前 t0=t1|keep composition static|保持静止构图/.test(joined);

  return lines.filter((line) => {
    const low = line.toLowerCase();
    if (hasNoText && /add text overlay/.test(low)) return false;
    if (hasNoOverlay && /ui overlay/.test(low)) return false;
    if (hasNoCenter && /center the hero subject/.test(low)) return false;
    if (hasStatic && /complete t0->t1 transition|apply t0→t1 transition across the full/.test(low)) return false;
    return true;
  });
}

function priorityScore(line: string): number {
  const t = normalizeSpaces(line).toLowerCase();
  if (!t) return 0;
  if (isSystemTailMarker(line)) return 97;
  if (isSystemTailSignal(line)) return 91;
  if (/^\[v2 scenepilot compile\]|^scene:|^#\s/.test(t)) return 100;
  if (/layout contract|t0 frame spec|t1 frame spec|anti-director rules|camera contract/.test(t)) return 95;
  if (/hard constraints|priority:|no text|no overlays|no numbers|object count|identity/.test(t)) return 90;
  if (/reference links|subject|look|start t0|end\s+t1/.test(t)) return 85;
  if (/platform execution contract|output policy|conflict policy/.test(t)) return 60;
  return 40;
}

export function trimToBudget(input: string, maxChars: number): { text: string; trimmed: boolean } {
  if (input.length <= maxChars) return { text: input, trimmed: false };
  const lines = input.split("\n");
  const indexed = lines.map((line, idx) => ({ line, idx, score: priorityScore(line) }));
  const kept = new Set<number>();

  let size = 0;
  for (const row of [...indexed].sort((a, b) => b.score - a.score || a.idx - b.idx)) {
    const next = row.line.length + 1;
    if (size + next > maxChars) continue;
    kept.add(row.idx);
    size += next;
  }

  const out = lines.filter((_, idx) => kept.has(idx)).join("\n");
  return { text: out.replace(/\n{3,}/g, "\n\n").trimEnd(), trimmed: true };
}

export function compactTextDensity(input: string): string {
  return input
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .join("\n");
}

export function compressTailBlock(input: string): string {
  const lines = input.split("\n");
  let machineMarkerSeen = false;
  const out: string[] = [];
  for (const line of lines) {
    if (isSystemTailMarker(line)) {
      machineMarkerSeen = true;
      out.push(line);
      continue;
    }
    if (machineMarkerSeen && (/^\[coords\//i.test(line.trim()) || /^【坐标/.test(line.trim()))) {
      if (out[out.length - 1]?.includes("[Coords/Anchor]") || out[out.length - 1]?.includes("【坐标/锚点】")) continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

export function patchRefsGuidance(input: string, mode: PlatformPatch["refsHintMode"], lang: Lang): string {
  if (!mode || mode === "default") return input;
  if (mode === "strict") {
    const line = lang === "zh"
      ? "参考图策略：先上传参考图，再粘贴提示词；若附件不足，优先保证主体身份图。"
      : "Reference strategy: upload refs first, then paste prompt; prioritize identity refs when attachments are limited.";
    return `${input.trimEnd()}\n\n${line}`;
  }
  const compact = input
    .split("\n")
    .filter((line) => !/reference links|参考图链接|attachments|附件照片/i.test(line))
    .join("\n");
  return compact;
}

export function stylePass(input: string, profile: PlatformProfile, lang: Lang, patch: PlatformPatch): string {
  const cap = getPlatformCapability(profile);
  let lines = input.split("\n");

  if (cap.prefersKeywordChain) {
    lines = lines.map((line) => {
      if (/^output policy:|^输出策略：|^conflict policy:|^冲突处理：/i.test(line.trim())) return "";
      return line;
    });
  }

  if (cap.prefersStructuredBlocks || patch.keepStructuredBlocks) {
    lines = lines.map((line) => {
      if (lang === "zh" && /^你将根据以下分镜结构/.test(line)) return "结构化生成：按对象 -> 关系 -> 构图 -> 光线顺序执行。";
      if (lang !== "zh" && /^Generate .* visuals following the storyboard below\./.test(line)) {
        return "Structured generation: follow Object -> Relation -> Composition -> Lighting order.";
      }
      return line;
    });
  }

  return lines.join("\n");
}

type CommonAdaptConfig = {
  engineKey: string;
  engineFamily: string;
  patch?: PlatformPatch;
  extraPasses?: string[];
  transformText?: (text: string, input: PlatformAdaptInput) => { text: string; passes?: string[] };
};

export function runCommonAdaptation(input: PlatformAdaptInput, config: CommonAdaptConfig): PlatformAdaptResult {
  const cap = getPlatformCapability(input.profile);
  const basePatch = resolvePlatformPatch(input.platformId);
  const patch: PlatformPatch = { ...basePatch, ...(config.patch ?? {}) };
  const appliedPatchNames = [...patchNames(input.platformId, basePatch)];
  const baseMaxChars = input.media === "video" ? cap.maxCharsVideo : cap.maxCharsImage;
  const maxChars = Math.max(1200, Math.floor(baseMaxChars * (patch.budgetFactor ?? 1)));

  let text = (input.prompt ?? "").replace(/\r\n/g, "\n").trimEnd();
  text = stylePass(text, input.profile, input.lang, patch);
  text = dropConflictLines(text.split("\n")).join("\n");

  if (patch.density === "compact") text = compactTextDensity(text);
  if (patch.compressTail) text = compressTailBlock(text);
  text = patchRefsGuidance(text, patch.refsHintMode, input.lang);

  const enginePasses = [...(config.extraPasses ?? [])];
  if (input.sceneStrategy) {
    if (input.sceneStrategy.layer !== "none") enginePasses.push(`scene_strategy_${input.sceneStrategy.layer}`);
    if (input.sceneStrategy.usesAdvancedLanguage) enginePasses.push("scene_strategy_advanced_language");
    if (input.sceneStrategy.usesLightingDefaults) enginePasses.push("scene_strategy_lighting_defaults");
  }
  if (input.creativeContext) {
    if (input.creativeContext.source !== "none") enginePasses.push(`creative_context_${input.creativeContext.source}`);
    if (input.creativeContext.hasPrimaryInput) enginePasses.push("creative_context_primary_input");
    if (input.creativeContext.hasSecondaryInput) enginePasses.push("creative_context_secondary_input");
  }
  if (config.transformText) {
    const transformed = config.transformText(text, input);
    text = transformed.text;
    enginePasses.push(...(transformed.passes ?? []));
  }

  text = dedupeLines(text);
  const trimmed = trimToBudget(text, maxChars);

  return {
    prompt: trimmed.text,
    meta: {
      platformId: input.platformId,
      baseProfile: input.profile,
      patchApplied: Boolean(input.platformId && PATCHES[input.platformId]) || Object.keys(config.patch ?? {}).length > 0,
      trimmedByBudget: trimmed.trimmed,
      trimReason: trimmed.trimmed ? `maxChars:${maxChars}` : "",
      appliedPatches: [...appliedPatchNames, ...enginePasses],
      tailCompressed: Boolean(patch.compressTail),
      refsGuidancePatched: patch.refsHintMode === "strict" || patch.refsHintMode === "minimal",
      density: patch.density ?? "default",
      engineKey: config.engineKey,
      engineFamily: config.engineFamily,
      sceneStrategyLayer: input.sceneStrategy?.layer,
      sceneStrategyClassicIds: input.sceneStrategy?.classicModeIds,
      sceneStrategyDirectorIds: input.sceneStrategy?.directorPackIds,
      sceneStrategyUsesAdvancedLanguage: input.sceneStrategy?.usesAdvancedLanguage,
      sceneStrategyUsesLightingDefaults: input.sceneStrategy?.usesLightingDefaults,
      sceneStrategyLightingProfileIds: input.sceneStrategy?.lightingProfileIds,
      creativeContextSource: input.creativeContext?.source ?? "none",
      creativeContextHasPrimaryInput: input.creativeContext?.hasPrimaryInput ?? false,
      creativeContextHasSecondaryInput: input.creativeContext?.hasSecondaryInput ?? false,
      creativeContextSubjectLabels: input.creativeContext?.subjectLabels ?? []
    }
  };
}
