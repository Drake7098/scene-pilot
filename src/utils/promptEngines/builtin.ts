import type { PlatformAdaptInput, PlatformAdaptResult, PromptPlatformEngine } from "./types";
import { runCommonAdaptation } from "./shared";
import { getLightingProfile } from "../../content/lightingProfiles";
import { stripExecutionScaffold, stripCompileScaffold } from "./scaffoldStrip";

// ─────────────────────────────────────────────
// 公共工具
// ─────────────────────────────────────────────

function joinStrategyDirectives(lines: string[]) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (!clean.length) return "";
  return `\n\n[Scene Strategy]\n${clean.join("\n")}`;
}



// 把 Anti-Director 多条负向规则替换为单条正向约束（节省 40% token）
function collapseAntiDirector(text: string): string {
  const antiRe = /Anti-Director Rules:[^\n]*(\n- [^\n]+)*/g;
  return text.replace(antiRe, "Constraint: Render exactly as specified. Preserve subject positions, depth layers, and frame composition without improvisation.");
}

// ─────────────────────────────────────────────
// 现有引擎：runway 策略指令（保持不变）
// ─────────────────────────────────────────────

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
  return { text: joinStrategyDirectives(lines), passes: ["runway_scene_strategy_distribution"] };
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
  return { text: joinStrategyDirectives(lines), passes: ["runway_creative_context_distribution"] };
}

// ─────────────────────────────────────────────
// 现有引擎：fal 策略指令（保持不变）
// ─────────────────────────────────────────────

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
  return { text: joinStrategyDirectives(lines), passes: ["fal_scene_strategy_distribution"] };
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
  return { text: joinStrategyDirectives(lines), passes: ["fal_creative_context_distribution"] };
}

// ─────────────────────────────────────────────
// Transform 函数
// ─────────────────────────────────────────────



function runwayTransform(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const strategyPatch = runwayStrategyDirectives(input);
  const creativePatch = runwayCreativeContextDirectives(input);
  if (input.media !== "video") {
    if (!strategyPatch.text && !creativePatch.text) return { text, passes: [] };
    return {
      text: `${text.trimEnd()}${strategyPatch.text}${creativePatch.text}`.trimEnd(),
      passes: [...strategyPatch.passes, ...creativePatch.passes]
    };
  }

  const next = text
    .split("\n")
    .filter((line) => !/^(Reference links|参考图链接|attachments|附件照片)[:：]/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  const passes: string[] = [];
  if (next !== text) passes.push("runway_motion_first_cleanup");
  const textWithStrategy = `${next}${strategyPatch.text}${creativePatch.text}`.trimEnd();
  passes.push(...strategyPatch.passes, ...creativePatch.passes);
  return { text: textWithStrategy, passes };
}

function falTransform(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const strategyPatch = falStrategyDirectives(input);
  const creativePatch = falCreativeContextDirectives(input);
  const ar = (input as any).aspectRatio;
  const arPatch = ar ? `\nAspect ratio: ${ar}.` : "";
  const combined = `${text.trimEnd()}${strategyPatch.text}${creativePatch.text}${arPatch}`.trimEnd();
  const passes = [...strategyPatch.passes, ...creativePatch.passes];
  if (ar) passes.push("fal_aspect_ratio");
  return { text: combined, passes };
}

// ─────────────────────────────────────────────
// 新增引擎：Midjourney
// 策略：去掉所有结构标签和冒号，输出纯关键词链 + 参数后置
// ─────────────────────────────────────────────

function midjourneyTransform(text: string, input?: PlatformAdaptInput): { text: string; passes: string[] } {
  const passes: string[] = ["midjourney_keyword_chain"];

  // 1. 去脚手架和 Anti-Director
  let t = text;

  // 2. 提取有效行（去掉标题行、约束行，保留内容行）
  const skipPatterns = [
    /^\[V2 SCENEPILOT/i,
    /^\[END\]/i,
    /^Camera Contract:/i,
    /^Layout Contract/i,
    /^T0 Frame Spec:/i,
    /^T1 Frame Spec:/i,
    /^Anti-Director Rules:/i,
    /^Constraint:/i,
    /^Generation constraints:/i,
    /^- No auto-center/i,
    /^- No hero-shot/i,
    /^- No depth\/order/i,
    /^- No auto zoom/i,
    /^- Do not force/i,
    /^- Keep depth and relative/i,
    /^- Preserve subject order/i,
    /^- Use frame-height/i,
    /^- Single camera/i,
    /^- Do not auto zoom/i,
    /^- Keep all main/i,
  ];

  const contentLines = t
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return !skipPatterns.some((re) => re.test(trimmed));
    })
    .map((line) =>
      line
        .trim()
        .replace(/^[-•]\s*/, "")            // 去列表符号
        .replace(/^[A-Za-z\s]+:\s*/,"")      // 去标签头（"Scene: " "Camera: "等）
        .replace(/\([^)]*only applies[^)]*\)/gi, "") // 去局部提示词注释
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter(Boolean);

  // 3. 拼成关键词链（逗号分隔）
  const kwChain = contentLines
    .map(l => l.trim())
    .filter(Boolean)
    .join(", ")
    .replace(/^[,\s]+/, "")
    .replace(/[,\s]+$/, "")
    .replace(/,\s*,+/g, ",");

  if (!kwChain) {
    return { text: "", passes: ["midjourney_keyword_chain_empty"] };
  }

  // 4. 追加 MJ 参数（默认 16:9，v6.1，raw 风格）
  const ar = (input as any).aspectRatio ?? "16:9";
  const final = `${kwChain} --ar ${ar} --v 6.1 --style raw`;

  return { text: final, passes };
}

function buildMidjourneyResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "midjourney-native",
    engineFamily: "midjourney",
    patch: {
      compressTail: true,
      refsHintMode: "minimal"
    },
    transformText: (text, runtimeInput) => midjourneyTransform(text, runtimeInput)
  });
}

// ─────────────────────────────────────────────
// 新增引擎：即梦/可灵（国产中文模型）
// 策略：中文自然语言 + 防国风/水墨偏移锚定词
// ─────────────────────────────────────────────

function jimengTransform(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const passes: string[] = ["jimeng_zh_localized"];

  // 保留结构，但在末尾注入防偏移锚定词
  let t = text;
  t = collapseAntiDirector(t);

  // 注入风格防偏移（如果用户没有显式指定中国传统风格）
  const hasExplicitTraditional = /国风|水墨|古风|汉服|宋代|唐代|传统中国/i.test(t);
  if (!hasExplicitTraditional) {
    const styleAnchor = input.media === "video"
      ? "非国风，非水墨，非古风。写实现代风格。"
      : "非国风，非水墨，非古风。写实现代风格。";
    t = `${t.trimEnd()}\n${styleAnchor}`;
    passes.push("jimeng_style_anchor_injection");
  }

  const ar = (input as any).aspectRatio;
  if (ar) {
    t = `${t.trimEnd()}\n画面比例：${ar}。`;
    passes.push("jimeng_aspect_ratio");
  }

  return { text: t.trimEnd(), passes };
}

function buildJimengResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "jimeng-native",
    engineFamily: "jimeng",
    patch: {
      compressTail: true,
      refsHintMode: "default"
    },
    transformText: (text, runtimeInput) => jimengTransform(text, runtimeInput)
  });
}

// ─────────────────────────────────────────────
// 新增引擎：通义万相（Wanx）
// 策略：保留结构化标签，中文，加阿里云/通义风格锚定
// ─────────────────────────────────────────────

function wanxTransform(text: string, input?: PlatformAdaptInput): { text: string; passes: string[] } {
  const passes: string[] = ["wanx_structured_zh"];

  let t = text;
  t = collapseAntiDirector(t);

  // 通义万相对结构化中文标签响应好，保持结构但去掉英文标签
  t = t
    .replace(/^Camera Contract:/gm, "镜头约束：")
    .replace(/^Layout Contract[^:]*:/gm, "构图约束：")
    .replace(/^T0 Frame Spec:/gm, "起始帧：")
    .replace(/^T1 Frame Spec:/gm, "结束帧：")
    .replace(/^Scene:/gm, "场景：")
    .replace(/^Style:/gm, "风格：")
    .replace(/^Motion:/gm, "运动：")
    .replace(/\[V2 SCENEPILOT COMPILE\]/g, "")
    .replace(/\[END\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 追加万相适合的输出格式提示
  const hasTraditional = /国风|水墨|古风/i.test(t);
  if (!hasTraditional) {
    t = `${t.trimEnd()}\n写实风格，非水墨，非古风。`;
    passes.push("wanx_style_anchor");
  }

  const ar = input ? (input as any).aspectRatio : undefined;
  if (ar) {
    t = `${t.trimEnd()}\n【比例】${ar}`;
    passes.push("wanx_aspect_ratio");
  }

  return { text: t, passes };
}

function buildWanxResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "wanx-native",
    engineFamily: "wanx",
    patch: {
      keepStructuredBlocks: true,
      refsHintMode: "default"
    },
    transformText: (text, runtimeInput) => wanxTransform(text, runtimeInput)
  });
}

// ─────────────────────────────────────────────
// 升级现有引擎：Runway（增加时序锚点模式）
// ─────────────────────────────────────────────

function runwayTransformV2(text: string, input: PlatformAdaptInput): { text: string; passes: string[] } {
  const base = runwayTransform(text, input);
  if (input.media !== "video") return base;

  // Runway 视频：Anti-Director 压缩为单条正向约束，节省 token 给时序描述
  const collapsed = collapseAntiDirector(base.text);
  const passes = [...base.passes];
  if (collapsed !== base.text) passes.push("runway_anti_director_collapse");

  const cleaned = collapsed.replace(/\n{3,}/g, "\n\n").trimEnd();
  const ar = (input as any).aspectRatio;
  const withAr = ar ? `${cleaned}\n--ratio ${ar}` : cleaned;
  return { text: withAr.trimEnd(), passes };
}

function buildRunwayResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "runway-family",
    engineFamily: "runway",
    patch: {
      compressTail: input.media === "video",
      refsHintMode: input.media === "video" ? "minimal" : "default"
    },
    transformText: runwayTransformV2
  });
}

// ─────────────────────────────────────────────
// 保持不变：fal 和 universal
// ─────────────────────────────────────────────

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

function buildUniversalResult(input: PlatformAdaptInput): PlatformAdaptResult {
  return runCommonAdaptation(input, {
    engineKey: "universal-core",
    engineFamily: "universal",
    transformText: (text) => ({ text, passes: [] })
  });
}

// ─────────────────────────────────────────────
// 引擎注册表（顺序决定优先级，越靠前越优先）
// ─────────────────────────────────────────────

export const builtinPromptPlatformEngines: PromptPlatformEngine[] = [
  // Midjourney 专用引擎（关键词链）
  {
    key: "midjourney-native",
    family: "midjourney",
    supports: (input) => input.platformId === "midjourney" || input.profile === "midjourney",
    adapt: buildMidjourneyResult
  },
  // 即梦/可灵 专用引擎（中文 + 防国风）
  {
    key: "jimeng-native",
    family: "jimeng",
    supports: (input) =>
      input.platformId === "jimeng" ||
      input.platformId === "keling" ||
      input.profile === "jimeng",
    adapt: buildJimengResult
  },
  // 通义万相 专用引擎（结构化中文）
  {
    key: "wanx-native",
    family: "wanx",
    supports: (input) => input.platformId === "wanx" || input.profile === "qwen",
    adapt: buildWanxResult
  },
  // fal/Flux 专用引擎（自然语言精确描述）
  {
    key: "fal-family",
    family: "fal",
    supports: (input) => input.profile === "fal" || input.platformId === "fal",
    adapt: buildFalResult
  },
  // Runway 引擎（时序锚点 + 运动向量，升级版）
  {
    key: "runway-family",
    family: "runway",
    supports: (input) => input.profile === "runway",
    adapt: buildRunwayResult
  },
  // 兜底通用引擎
  {
    key: "universal-core",
    family: "universal",
    supports: () => true,
    adapt: buildUniversalResult
  }
];
