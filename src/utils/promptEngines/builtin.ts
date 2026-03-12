import type { PlatformAdaptInput, PlatformAdaptResult, PromptPlatformEngine } from "./types";
import { runCommonAdaptation } from "./shared";
import { getLightingProfile } from "../../content/lightingProfiles";

function joinStrategyDirectives(lines: string[]) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (!clean.length) return "";
  return `\n\n[Scene Strategy]\n${clean.join("\n")}`;
}

function runwayStrategyDirectives(input: PlatformAdaptInput) {
  const strategy = input.sceneStrategy;
  if (!strategy || input.media !== "video") return { text: "", passes: [] as string[] };

  const lines: string[] = [];
  if (strategy.classicModeIds.length) {
    lines.push("Honor the scene's base shot, movement, transition, and lighting defaults before adding flourish.");
  }
  if (strategy.usesAdvancedLanguage) {
    lines.push("Use advanced shot grammar as seasoning only; do not break motion continuity or subject readability.");
  }
  if (strategy.usesLightingDefaults) {
    lines.push("Preserve the scene lighting defaults as execution anchors; do not reinvent unrelated lighting setups.");
  }
  for (const profileId of strategy.lightingProfileIds) {
    const profile = getLightingProfile(profileId);
    if (profile) lines.push(profile.runwayEn);
  }
  for (const packId of strategy.directorPackIds) {
    if (packId === "architectural_tension") {
      lines.push("Establish space first, then tighten with controlled push-in, same-space continuity, and readable edge separation.");
    } else if (packId === "intimate_observation") {
      lines.push("Stay close to reactions, pauses, and facial readability with restrained camera presence.");
    } else if (packId === "industrial_epic") {
      lines.push("Favor wide scale contrast, slow reveals, rim-separated subjects, and stately pacing.");
    } else if (packId === "kinetic_pursuit") {
      lines.push("Favor forward momentum, pursuit tracking, clear directional motion, and cuts that preserve energy.");
    } else if (packId === "poetic_restraint") {
      lines.push("Favor minimal camera movement, breathing room, soft layered light, and sparse transitions.");
    } else if (packId === "commercial_spectacle") {
      lines.push("Favor high readability, controlled push-ins, premium highlights, and fast focal delivery.");
    }
  }
  if (!lines.length) return { text: "", passes: [] as string[] };
  return {
    text: joinStrategyDirectives(lines),
    passes: ["runway_scene_strategy_distribution"]
  };
}

function runwayCreativeContextDirectives(input: PlatformAdaptInput) {
  const creative = input.creativeContext;
  if (!creative || input.media !== "video") return { text: "", passes: [] as string[] };
  const lines: string[] = [];
  if (creative.hasSecondaryInput) {
    lines.push("Honor the project's second raw input as the action-order and must-keep constraint layer.");
  }
  if (creative.subjectLabels.length) {
    lines.push(`Keep subject identity readable across the sequence: ${creative.subjectLabels.join(", ")}.`);
  }
  if (!lines.length) return { text: "", passes: [] as string[] };
  return {
    text: joinStrategyDirectives(lines),
    passes: ["runway_creative_context_distribution"]
  };
}

function falStrategyDirectives(input: PlatformAdaptInput) {
  const strategy = input.sceneStrategy;
  if (!strategy || input.media !== "image") return { text: "", passes: [] as string[] };

  const lines: string[] = [];
  if (strategy.classicModeIds.length) {
    lines.push("Treat the scene preset framing and lighting defaults as hard composition anchors.");
  }
  if (strategy.usesAdvancedLanguage) {
    lines.push("Keep advanced visual language subordinate to object hierarchy, composition clarity, and material readability.");
  }
  if (strategy.usesLightingDefaults) {
    lines.push("Preserve the scene lighting defaults when rendering material separation and depth.");
  }
  for (const profileId of strategy.lightingProfileIds) {
    const profile = getLightingProfile(profileId);
    if (profile) lines.push(profile.falEn);
  }
  for (const packId of strategy.directorPackIds) {
    if (packId === "architectural_tension") {
      lines.push("Prioritize spatial geometry, pressure through depth, restrained contrast, and clean environmental order.");
    } else if (packId === "intimate_observation") {
      lines.push("Prioritize skin, expression, and relational micro-details over spectacle.");
    } else if (packId === "industrial_epic") {
      lines.push("Prioritize scale contrast, metallic structure readability, and strong silhouette separation against the environment.");
    } else if (packId === "kinetic_pursuit") {
      lines.push("Prioritize directional body language, dynamic spacing, and motion-readable object placement.");
    } else if (packId === "poetic_restraint") {
      lines.push("Prioritize negative space, soft layering, restrained gesture, and emotional breathing room.");
    } else if (packId === "commercial_spectacle") {
      lines.push("Prioritize product-grade readability, premium material finish, and immediate focal hierarchy.");
    }
  }
  if (!lines.length) return { text: "", passes: [] as string[] };
  return {
    text: joinStrategyDirectives(lines),
    passes: ["fal_scene_strategy_distribution"]
  };
}

function falCreativeContextDirectives(input: PlatformAdaptInput) {
  const creative = input.creativeContext;
  if (!creative || input.media !== "image") return { text: "", passes: [] as string[] };
  const lines: string[] = [];
  if (creative.hasPrimaryInput) {
    lines.push("Treat the project's first raw input as the upstream subject-scene target without overriding explicit layout blocks.");
  }
  if (creative.subjectLabels.length) {
    lines.push(`Preserve object naming and hierarchy around these subject seeds: ${creative.subjectLabels.join(", ")}.`);
  }
  if (!lines.length) return { text: "", passes: [] as string[] };
  return {
    text: joinStrategyDirectives(lines),
    passes: ["fal_creative_context_distribution"]
  };
}

function stripExecutionScaffold(text: string): { text: string; passes: string[] } {
  const next = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^\[Platform Execution Contract:/i.test(trimmed) || /^【平台执行协议：/.test(trimmed)) return false;
      if (/^Output policy:/i.test(trimmed) || /^输出策略：/.test(trimmed)) return false;
      if (/^Conflict policy:/i.test(trimmed) || /^冲突处理：/.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return next === text ? { text, passes: [] } : { text: next, passes: ["strip_execution_scaffold"] };
}

function runwayTransform(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const cleaned = stripExecutionScaffold(text);
  const strategyPatch = runwayStrategyDirectives(input);
  const creativePatch = runwayCreativeContextDirectives(input);
  if (input.media !== "video") {
    if (!strategyPatch.text && !creativePatch.text) return cleaned;
    return {
      text: `${cleaned.text.trimEnd()}${strategyPatch.text}${creativePatch.text}`.trimEnd(),
      passes: [...cleaned.passes, ...strategyPatch.passes, ...creativePatch.passes]
    };
  }

  const next = cleaned.text
    .split("\n")
    .filter((line) => !/^(Reference links|参考图链接|attachments|附件照片)[:：]/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  const passes = [...cleaned.passes];
  if (next !== cleaned.text) passes.push("runway_motion_first_cleanup");
  const textWithStrategy = `${next}${strategyPatch.text}${creativePatch.text}`.trimEnd();
  passes.push(...strategyPatch.passes, ...creativePatch.passes);
  return { text: textWithStrategy, passes };
}

function falTransform(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const cleaned = stripExecutionScaffold(text);
  const strategyPatch = falStrategyDirectives(input);
  const creativePatch = falCreativeContextDirectives(input);
  if (!strategyPatch.text && !creativePatch.text) return cleaned;
  return {
    text: `${cleaned.text.trimEnd()}${strategyPatch.text}${creativePatch.text}`.trimEnd(),
    passes: [...cleaned.passes, ...strategyPatch.passes, ...creativePatch.passes]
  };
}

function buildUniversalResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "universal-core",
    engineFamily: "universal"
  });
}

function buildRunwayResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "runway-family",
    engineFamily: "runway",
    patch: {
      compressTail: input.media === "video",
      refsHintMode: input.media === "video" ? "minimal" : "default"
    },
    transformText: runwayTransform
  });
}

function buildFalResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "fal-family",
    engineFamily: "fal",
    patch: {
      keepStructuredBlocks: input.media === "image",
      refsHintMode: input.media === "image" ? "strict" : "default"
    },
    extraPasses: input.media === "image" ? ["fal_object_first_bias"] : [],
    transformText: (text, runtimeInput) => falTransform(text, runtimeInput)
  });
}

export const builtinPromptPlatformEngines: PromptPlatformEngine[] = [
  {
    key: "fal-family",
    family: "fal",
    supports: (input) => input.profile === "fal" || input.platformId === "fal",
    adapt: buildFalResult
  },
  {
    key: "runway-family",
    family: "runway",
    supports: (input) => input.profile === "runway",
    adapt: buildRunwayResult
  },
  {
    key: "universal-core",
    family: "universal",
    supports: () => true,
    adapt: buildUniversalResult
  }
];
