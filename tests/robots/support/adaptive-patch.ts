import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SceneTier = "indoor" | "small_plaza" | "open_space";
export type V2Mode = "strict" | "short";

export type PromptQualityScore = {
  countFidelity: number;
  layoutFidelity: number;
  depthSeparation: number;
  motionConsistency: number;
  antiDirectorCompliance: number;
  promptRedundancy: number;
  conflictRate: number;
};

export type AdaptivePatchInput = {
  scores: PromptQualityScore;
  context: {
    sceneTier: SceneTier;
    durationSec: number;
    objectCount: number;
    isStaticTimeline: boolean;
    mode: V2Mode;
  };
};

export type PatchOp =
  | { op: "append_camera_line"; line: string }
  | { op: "append_layout_line"; line: string }
  | { op: "append_anti_director_line"; line: string }
  | { op: "append_generation_line"; line: string }
  | { op: "remove_line_regex"; pattern: string }
  | { op: "replace_line_regex"; pattern: string; line: string };

export type AdaptivePatch = {
  id: string;
  reason: string;
  severity: "low" | "medium" | "high";
  ops: PatchOp[];
};

type CombatPatchProfile = {
  far_threshold_height_pct: number;
  background_density: "low" | "medium" | "high";
  anti_director_strength: "low" | "medium" | "strong";
};

type CombatPatchItem = {
  id: string;
  trigger: string;
  actions: string[];
};

type CombatPatchList = {
  version: string;
  description: string;
  profiles: Record<SceneTier, CombatPatchProfile>;
  patches: CombatPatchItem[];
};

const DEFAULT_TIER_PROFILE: Record<
  SceneTier,
  { farThreshold: number; bgDensity: "low" | "medium" | "high"; antiDirector: "low" | "medium" | "strong" }
> = {
  indoor: { farThreshold: 0.12, bgDensity: "low", antiDirector: "low" },
  small_plaza: { farThreshold: 0.08, bgDensity: "medium", antiDirector: "medium" },
  open_space: { farThreshold: 0.05, bgDensity: "high", antiDirector: "strong" },
};

const PATCH_ID_MAP: Record<string, string> = {
  "combat.depth_open_space_boost": "v2.depth_tier_enforce",
  "combat.static_no_fake_motion": "v2.static_lock",
  "combat.motion_unroll": "v2.motion_unroll",
  "combat.count_identity_lock": "v2.identity_count_lock",
  "combat.redundancy_trim": "v2.dedupe_tail",
};

function loadCombatPatchList(): CombatPatchList | null {
  try {
    const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../config/combat-patch-list.json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as CombatPatchList;
  } catch {
    return null;
  }
}

function resolveTierProfile(config: CombatPatchList | null): typeof DEFAULT_TIER_PROFILE {
  if (!config?.profiles) return DEFAULT_TIER_PROFILE;
  return {
    indoor: {
      farThreshold: config.profiles.indoor?.far_threshold_height_pct ?? DEFAULT_TIER_PROFILE.indoor.farThreshold,
      bgDensity: config.profiles.indoor?.background_density ?? DEFAULT_TIER_PROFILE.indoor.bgDensity,
      antiDirector: config.profiles.indoor?.anti_director_strength ?? DEFAULT_TIER_PROFILE.indoor.antiDirector,
    },
    small_plaza: {
      farThreshold: config.profiles.small_plaza?.far_threshold_height_pct ?? DEFAULT_TIER_PROFILE.small_plaza.farThreshold,
      bgDensity: config.profiles.small_plaza?.background_density ?? DEFAULT_TIER_PROFILE.small_plaza.bgDensity,
      antiDirector: config.profiles.small_plaza?.anti_director_strength ?? DEFAULT_TIER_PROFILE.small_plaza.antiDirector,
    },
    open_space: {
      farThreshold: config.profiles.open_space?.far_threshold_height_pct ?? DEFAULT_TIER_PROFILE.open_space.farThreshold,
      bgDensity: config.profiles.open_space?.background_density ?? DEFAULT_TIER_PROFILE.open_space.bgDensity,
      antiDirector: config.profiles.open_space?.anti_director_strength ?? DEFAULT_TIER_PROFILE.open_space.antiDirector,
    },
  };
}

function resolvePatchId(config: CombatPatchList | null, key: string, fallback: string): string {
  if (!config?.patches?.length) return fallback;
  const enabled = new Set(
    config.patches
      .map((p) => PATCH_ID_MAP[p.id])
      .filter((v): v is string => Boolean(v)),
  );
  return enabled.has(key) ? key : fallback;
}

function n(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return Number(v.toFixed(4));
}

export function buildAdaptivePatches(input: AdaptivePatchInput): AdaptivePatch[] {
  const config = loadCombatPatchList();
  const tierProfile = resolveTierProfile(config);
  const scores = {
    countFidelity: n(input.scores.countFidelity),
    layoutFidelity: n(input.scores.layoutFidelity),
    depthSeparation: n(input.scores.depthSeparation),
    motionConsistency: n(input.scores.motionConsistency),
    antiDirectorCompliance: n(input.scores.antiDirectorCompliance),
    promptRedundancy: n(input.scores.promptRedundancy),
    conflictRate: n(input.scores.conflictRate),
  };

  const profile = tierProfile[input.context.sceneTier];
  const patches: AdaptivePatch[] = [];

  if (input.context.isStaticTimeline) {
    patches.push({
      id: resolvePatchId(config, "v2.static_lock", "v2.static_lock"),
      reason: "t0=t1 scene must not carry fake transition instructions",
      severity: "high",
      ops: [
        { op: "remove_line_regex", pattern: "完成\\s*t0→t1\\s*变化|complete\\s+t0->t1\\s+transition" },
        {
          op: "append_camera_line",
          line: `- Current t0=t1; full ${Math.max(1, input.context.durationSec)}s keeps static composition.`,
        },
      ],
    });
  } else if (scores.motionConsistency < 0.75) {
    patches.push({
      id: resolvePatchId(config, "v2.motion_unroll", "v2.motion_unroll"),
      reason: "motion text is too abstract; needs qualitative transition language",
      severity: "medium",
      ops: [
        {
          op: "append_camera_line",
          line: `- Apply described T0->T1 transition within ${Math.max(1, input.context.durationSec)}s only.`,
        },
        {
          op: "append_layout_line",
          line: "- Describe transitions with words: lateral shift / nearer-farther / grows-shrinks / slight turn.",
        },
      ],
    });
  }

  if (scores.depthSeparation < 0.75) {
    patches.push({
      id: resolvePatchId(config, "v2.depth_tier_enforce", "v2.depth_tier_enforce"),
      reason: "depth layering is weak and can collapse into flat composition",
      severity: input.context.sceneTier === "open_space" ? "high" : "medium",
      ops: [
        {
          op: "append_layout_line",
          line: `- ${profile.bgDensity} background density; far subjects are below frame-height ratio ${profile.farThreshold}.`,
        },
        {
          op: "append_anti_director_line",
          line: "- Keep foreground-midground-background separation; do not flatten depth.",
        },
      ],
    });
  }

  if (scores.countFidelity < 0.9 || scores.layoutFidelity < 0.85) {
    patches.push({
      id: resolvePatchId(config, "v2.identity_count_lock", "v2.identity_count_lock"),
      reason: "subject count or layout lock is unstable",
      severity: "high",
      ops: [
        { op: "append_generation_line", line: "- Keep object count and identity unchanged; no add/remove subjects." },
        { op: "append_generation_line", line: "- Preserve relative order and placement; no relayout." },
      ],
    });
  }

  if (scores.antiDirectorCompliance < 0.8 || input.context.sceneTier === "open_space") {
    patches.push({
      id: "v2.anti_director_boost",
      reason: "director drift risk remains high",
      severity: profile.antiDirector === "strong" ? "high" : "medium",
      ops: [
        { op: "append_anti_director_line", line: "- No auto-centering, no symmetry, no hero-only framing." },
        { op: "append_anti_director_line", line: "- Keep depth order stable; no queue relayout." },
      ],
    });
  }

  if (scores.conflictRate > 0.02) {
    patches.push({
      id: "v2.conflict_guard",
      reason: "mutually exclusive lines detected",
      severity: "high",
      ops: [
        { op: "remove_line_regex", pattern: "add\\s+text\\s+overlay|ui\\s+overlay|center\\s+the\\s+hero\\s+subject" },
        { op: "append_generation_line", line: "- no subtitles / no overlays / no text / no numbers." },
      ],
    });
  }

  if (scores.promptRedundancy > 0.2) {
    patches.push({
      id: resolvePatchId(config, "v2.dedupe_tail", "v2.dedupe_tail"),
      reason: "tail constraints are repeated and dilute priority signals",
      severity: "medium",
      ops: [{ op: "remove_line_regex", pattern: "(?i)^(.*)$\\n\\1$" }],
    });
  }

  if (input.context.mode === "short") {
    patches.push({
      id: "v2.short_mode_trim",
      reason: "short mode should keep only high-signal constraints",
      severity: "low",
      ops: [
        { op: "replace_line_regex", pattern: "Moderate depth of field.*", line: "- Keep all main subjects recognizable." },
      ],
    });
  }

  return patches;
}
