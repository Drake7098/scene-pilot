import type { Lang } from "../i18n";
import type { Layer, Scene } from "../model";
import type { SceneTier, V2Mode } from "./compileV2";
import { COMBAT_PATCH_LIST } from "../config/combatPatchList";

type PromptQualityScore = {
  countFidelity: number;
  layoutFidelity: number;
  depthSeparation: number;
  motionConsistency: number;
  antiDirectorCompliance: number;
  promptRedundancy: number;
  conflictRate: number;
};

type AdaptivePatchContext = {
  lang: Lang;
  sceneTier: SceneTier;
  durationSec: number;
  objectCount: number;
  isStaticTimeline: boolean;
  hasSemanticMotionIntent: boolean;
  mode: V2Mode;
};

type PatchOp =
  | { op: "append_camera_line"; line: string }
  | { op: "append_layout_line"; line: string }
  | { op: "append_anti_director_line"; line: string }
  | { op: "append_generation_line"; line: string }
  | { op: "remove_line_regex"; pattern: string }
  | { op: "replace_line_regex"; pattern: string; line: string };

type AdaptivePatch = {
  id: string;
  reason: string;
  severity: "low" | "medium" | "high";
  ops: PatchOp[];
};

const TIER_PROFILE: Record<
  SceneTier,
  { farThreshold: number; bgDensity: "low" | "medium" | "high"; antiDirector: "low" | "medium" | "strong" }
> = {
  indoor: {
    farThreshold: COMBAT_PATCH_LIST.profiles.indoor.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.indoor.background_density,
    antiDirector: COMBAT_PATCH_LIST.profiles.indoor.anti_director_strength,
  },
  small_plaza: {
    farThreshold: COMBAT_PATCH_LIST.profiles.small_plaza.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.small_plaza.background_density,
    antiDirector: COMBAT_PATCH_LIST.profiles.small_plaza.anti_director_strength,
  },
  open_space: {
    farThreshold: COMBAT_PATCH_LIST.profiles.open_space.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.open_space.background_density,
    antiDirector: COMBAT_PATCH_LIST.profiles.open_space.anti_director_strength,
  }
};

const MOTION_INTENT_RE =
  /跑|行走|慢走|快走|挪|移动|奔跑|跳|转身|挥手|抬手|吃|喝|追逐|\b(run|walk|jog|step|shift|move|turn|spin|wave|eat|drink|chase|approach|retreat)\b/i;
const NEG_STATIC_RE =
  /不(移动|动|走|跑|转)|静止|保持原位|固定不动|\b(no motion|stay still|static)\b/i;

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function getLayerKF(layer: Layer, t: 0 | 1) {
  const hit = (layer.kf ?? []).find((k) => k.t === t);
  return hit ?? (layer.kf ?? [])[0] ?? { t, x: 50, y: 50, w: 18, h: 18, rot: 0 };
}

function scoreDepthSeparation(scene: Scene): number {
  const hs = (scene.layers ?? []).map((l) => Math.max(0.01, getLayerKF(l, 0).h / 100));
  if (hs.length <= 1) return 1;
  const maxH = Math.max(...hs);
  const minH = Math.min(...hs);
  return clamp01((maxH - minH) / 0.35);
}

function scoreCountFidelity(prompt: string, objectCount: number): number {
  if (objectCount <= 0) return 1;
  const m = prompt.match(/T0 Frame Spec:\n([\s\S]*?)\n\nT1 Frame Spec:/);
  const body = m ? m[1] : "";
  const rows = body
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.startsWith("- "));
  const ratio = rows.length / objectCount;
  return clamp01(Math.min(ratio, 1 / Math.max(ratio, 1e-3)));
}

function scoreLayoutFidelity(prompt: string): number {
  let score = 0;
  if (/Layout Contract/i.test(prompt)) score += 0.25;
  if (/Preserve subject order|保持对象顺序/i.test(prompt)) score += 0.35;
  if (/depth layers|前中后层级|层级关系/i.test(prompt)) score += 0.2;
  if (/no relayout|不要自动重排|不重排构图/i.test(prompt)) score += 0.2;
  return clamp01(score);
}

function scoreMotionConsistency(prompt: string, isStaticTimeline: boolean, hasSemanticMotionIntent: boolean): number {
  const low = prompt.toLowerCase();
  const hasStaticLock =
    /当前 t0=t1|keep composition static|stays stable|保持静止构图|保持原位/.test(prompt);
  const hasForcedTransition =
    /完成 t0→t1 变化|apply t0→t1 transition|complete t0->t1 transition/.test(low);

  if (hasSemanticMotionIntent && hasStaticLock) return 0.3;

  if (isStaticTimeline) {
    if (hasForcedTransition) return 0.25;
    return hasStaticLock ? 1 : 0.7;
  }
  if (hasStaticLock) return 0.55;
  return /T1 Frame Spec:/.test(prompt) ? 0.9 : 0.6;
}

function scoreAntiDirector(prompt: string): number {
  let score = 0;
  if (/Anti-Director Rules:/i.test(prompt)) score += 0.2;
  if (/no auto-centering|不自动居中/.test(prompt)) score += 0.35;
  if (/no symmetry|不做对称构图|禁止自动居中、对称构图/.test(prompt)) score += 0.2;
  if (/no hero|不强行把任何对象变成主角|主角化/.test(prompt)) score += 0.25;
  return clamp01(score);
}

function scoreRedundancy(prompt: string): number {
  const lines = prompt
    .split("\n")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (!lines.length) return 0;
  const count = new Map<string, number>();
  lines.forEach((line) => count.set(line, (count.get(line) ?? 0) + 1));
  let repeated = 0;
  count.forEach((v) => {
    if (v > 1) repeated += v;
  });
  return clamp01(repeated / lines.length);
}

function scoreConflictRate(prompt: string): number {
  const pairs: Array<[RegExp, RegExp]> = [
    [/no text/i, /add text overlay/i],
    [/no overlays/i, /ui overlay/i],
    [/no auto-centering|不自动居中/i, /center the hero subject/i],
    [/do not re-layout composition|不重排构图/i, /re-layout composition/i],
    [/保持静止构图|keep composition static/i, /完成 t0→t1 变化|complete t0->t1 transition/i]
  ];
  let hit = 0;
  pairs.forEach(([a, b]) => {
    if (a.test(prompt) && b.test(prompt)) hit += 1;
  });
  return pairs.length ? hit / pairs.length : 0;
}

function scorePrompt(prompt: string, scene: Scene, context: AdaptivePatchContext): PromptQualityScore {
  return {
    countFidelity: scoreCountFidelity(prompt, context.objectCount),
    layoutFidelity: scoreLayoutFidelity(prompt),
    depthSeparation: scoreDepthSeparation(scene),
    motionConsistency: scoreMotionConsistency(prompt, context.isStaticTimeline, context.hasSemanticMotionIntent),
    antiDirectorCompliance: scoreAntiDirector(prompt),
    promptRedundancy: scoreRedundancy(prompt),
    conflictRate: scoreConflictRate(prompt)
  };
}

function buildAdaptivePatches(score: PromptQualityScore, context: AdaptivePatchContext): AdaptivePatch[] {
  const profile = TIER_PROFILE[context.sceneTier];
  const zh = context.lang === "zh";
  const out: AdaptivePatch[] = [];

  if (context.isStaticTimeline) {
    out.push({
      id: "v2.static_lock",
      reason: "remove fake motion guidance for static timeline",
      severity: "high",
      ops: [
        { op: "remove_line_regex", pattern: "完成\\s*t0→t1\\s*变化|complete\\s+t0->t1\\s+transition" },
        {
          op: "append_camera_line",
          line: zh
            ? `- 当前 t0=t1，整段 ${context.durationSec} 秒保持静止构图。`
            : `- Current t0=t1; keep static composition for full ${context.durationSec}s.`
        }
      ]
    });
  } else if (score.motionConsistency < 0.75) {
    out.push({
      id: "v2.motion_unroll",
      reason: "inject qualitative transition cues",
      severity: "medium",
      ops: [
        {
          op: "append_camera_line",
          line: zh
            ? `- 在 ${context.durationSec} 秒内按 T0→T1 完成变化。`
            : `- Apply T0->T1 transition within ${context.durationSec}s only.`
        },
        {
          op: "append_layout_line",
          line: zh
            ? "- 用语言描述变化：左右位移 / 远近变化 / 尺寸增减 / 轻微转向。"
            : "- Describe change with words: lateral shift / near-far change / grows-shrinks / slight turn."
        }
      ]
    });
  }

  if (score.depthSeparation < 0.75) {
    out.push({
      id: "v2.depth_tier_enforce",
      reason: "enforce tier depth profile",
      severity: context.sceneTier === "open_space" ? "high" : "medium",
      ops: [
        {
          op: "append_layout_line",
          line: zh
            ? `- ${profile.bgDensity === "high" ? "高" : profile.bgDensity === "medium" ? "中" : "低"}背景密度：远景阈值 h<${profile.farThreshold}。`
            : `- ${profile.bgDensity} background density: far-layer threshold h<${profile.farThreshold}.`
        },
        {
          op: "append_anti_director_line",
          line: zh
            ? "- 强化前中后分离，禁止压平空间深度。"
            : "- Keep foreground-mid-background separation; do not flatten depth."
        }
      ]
    });
  }

  if (score.countFidelity < 0.9 || score.layoutFidelity < 0.85) {
    out.push({
      id: "v2.identity_count_lock",
      reason: "boost object count/identity/layout lock",
      severity: "high",
      ops: [
        {
          op: "append_generation_line",
          line: zh ? "- 保持对象数量和身份不变，不得新增/删除主体。" : "- Keep object count and identity unchanged; no add/remove subjects."
        },
        {
          op: "append_generation_line",
          line: zh ? "- 保持相对位置与顺序，不得重排构图。" : "- Preserve relative order and placement; no relayout."
        }
      ]
    });
  }

  if (score.antiDirectorCompliance < 0.8 || context.sceneTier === "open_space") {
    out.push({
      id: "v2.anti_director_boost",
      reason: "reinforce anti-director policy",
      severity: profile.antiDirector === "strong" ? "high" : "medium",
      ops: [
        {
          op: "append_anti_director_line",
          line: zh ? "- 不自动居中，不对称，不主角化。": "- No auto-centering, no symmetry, no hero-only framing."
        },
        {
          op: "append_anti_director_line",
          line: zh ? "- 保持层级和顺序稳定，不整齐排队。": "- Keep depth and order stable; no neat lineup."
        }
      ]
    });
  }

  if (score.conflictRate > 0.02) {
    out.push({
      id: "v2.conflict_guard",
      reason: "strip mutually exclusive phrases",
      severity: "high",
      ops: [
        { op: "remove_line_regex", pattern: "add\\s+text\\s+overlay|ui\\s+overlay|center\\s+the\\s+hero\\s+subject" },
        {
          op: "append_generation_line",
          line: zh ? "- no subtitles / no overlays / no text / no numbers." : "- no subtitles / no overlays / no text / no numbers."
        }
      ]
    });
  }

  if (score.promptRedundancy > 0.2) {
    out.push({
      id: "v2.dedupe_tail",
      reason: "remove repeated lines",
      severity: "medium",
      ops: [{ op: "remove_line_regex", pattern: "(?i)^\\s*(.+?)\\s*\\n\\1\\s*$" }]
    });
  }

  if (context.mode === "short") {
    out.push({
      id: "v2.short_mode_trim",
      reason: "short mode output should stay concise",
      severity: "low",
      ops: [
        {
          op: "replace_line_regex",
          pattern: "主要主体保持可识别\\。|Keep all main subjects recognizable\\.",
          line: zh ? "- 主体可识别。" : "- Keep subjects recognizable."
        }
      ]
    });
  }

  return out;
}

function appendToSection(lines: string[], header: string, lineToAppend: string): string[] {
  if (lines.some((l) => l.trim() === lineToAppend.trim())) return lines;
  const idx = lines.findIndex((l) => l.trim() === header);
  if (idx < 0) return lines;
  let insert = idx + 1;
  while (insert < lines.length && lines[insert].trim().startsWith("- ")) insert += 1;
  const next = lines.slice();
  next.splice(insert, 0, lineToAppend);
  return next;
}

function hasGenerationSection(lines: string[]): boolean {
  return lines.some((l) => /^Generation constraints:|^生成约束：/.test(l.trim()));
}

function ensureGenerationSection(lines: string[], lang: Lang): string[] {
  if (hasGenerationSection(lines)) return lines;
  const markerIdx = lines.findIndex((l) => l.trim() === "[END]");
  const head = lang === "zh" ? "生成约束：" : "Generation constraints:";
  const insertAt = markerIdx >= 0 ? markerIdx + 1 : lines.length;
  const next = lines.slice();
  next.splice(insertAt, 0, "", head);
  return next;
}

function applyOps(prompt: string, ops: PatchOp[], lang: Lang): string {
  let lines = prompt.split("\n");
  for (const op of ops) {
    if (op.op === "remove_line_regex") {
      const re = new RegExp(op.pattern, "i");
      lines = lines.filter((l) => !re.test(l));
      continue;
    }
    if (op.op === "replace_line_regex") {
      const re = new RegExp(op.pattern, "i");
      lines = lines.map((l) => (re.test(l) ? op.line : l));
      continue;
    }
    if (op.op === "append_camera_line") {
      lines = appendToSection(lines, "Camera Contract:", op.line);
      continue;
    }
    if (op.op === "append_layout_line") {
      lines = appendToSection(lines, "Layout Contract (obey strictly):", op.line);
      continue;
    }
    if (op.op === "append_anti_director_line") {
      lines = appendToSection(lines, "Anti-Director Rules:", op.line);
      continue;
    }
    if (op.op === "append_generation_line") {
      lines = ensureGenerationSection(lines, lang);
      const header = lang === "zh" ? "生成约束：" : "Generation constraints:";
      lines = appendToSection(lines, header, op.line);
    }
  }
  return dedupeLines(lines.join("\n"));
}

function dedupeLines(input: string): string {
  const lines = input.split("\n");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const k = line.trim();
    if (!k) {
      out.push("");
      continue;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function isStaticTimeline(scene: Scene): boolean {
  return (scene.layers ?? []).every((layer) => {
    const a = getLayerKF(layer, 0);
    const b = getLayerKF(layer, 1);
    return (
      Math.round((a.x ?? 0) * 10) === Math.round((b.x ?? 0) * 10) &&
      Math.round((a.y ?? 0) * 10) === Math.round((b.y ?? 0) * 10) &&
      Math.round((a.w ?? 0) * 10) === Math.round((b.w ?? 0) * 10) &&
      Math.round((a.h ?? 0) * 10) === Math.round((b.h ?? 0) * 10) &&
      Math.round((a.rot ?? 0) * 10) === Math.round((b.rot ?? 0) * 10)
    );
  });
}

function hasSemanticMotionIntent(scene: Scene): boolean {
  return (scene.layers ?? []).some((layer) => {
    const text = [
      layer.type ?? "",
      layer.look ?? "",
      layer.notes ?? "",
      layer.externalPrompt ?? "",
      layer.shapeDesc ?? "",
    ]
      .join(" ")
      .trim();
    if (!text) return false;
    if (!MOTION_INTENT_RE.test(text)) return false;
    return !NEG_STATIC_RE.test(text);
  });
}

export function optimizeV2ScenePrompt(prompt: string, scene: Scene, lang: Lang, sceneTier: SceneTier, mode: V2Mode): string {
  const semanticMotion = hasSemanticMotionIntent(scene);
  const context: AdaptivePatchContext = {
    lang,
    sceneTier,
    durationSec: Math.max(1, Math.round(Number(scene.duration_s) || 1)),
    objectCount: Math.max(0, scene.layers?.length ?? 0),
    isStaticTimeline: isStaticTimeline(scene) && !semanticMotion,
    hasSemanticMotionIntent: semanticMotion,
    mode
  };
  const score = scorePrompt(prompt, scene, context);
  const patches = buildAdaptivePatches(score, context);
  const ops = patches.flatMap((p) => p.ops);
  return applyOps(prompt, ops, lang);
}
