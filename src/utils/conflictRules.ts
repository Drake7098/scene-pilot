import type { Lang } from "../i18n";
import type { Layer, Project, Scene } from "../model";
import { resolveSceneConfig } from "../model";
import { resolveSceneStrategy } from "./sceneStrategyResolver";
import { parseDirectorStylePackId } from "../content/directorStylePacks";
import { parseVideoClassicModeId, parseImageClassicModeId } from "../content/proCreativeModes";
import { parseCameraLanguageId } from "../content/cameraLanguageLayers";
import { parseProMotionSelection } from "../content/proCameraPresets";

export type ConflictSeverity = "warning" | "high";
export type ConflictField = "notes" | "externalPrompt" | "scene";

export type PromptConflict = {
  id: string;
  severity: ConflictSeverity;
  scope: "layer" | "cross-layer" | "scene";
  layerId: string | null;
  field: ConflictField;
  title: string;
  detail: string;
};

type RulePack = {
  staticWords: RegExp;
  motionWords: RegExp;
  lightingWords: RegExp;
  noTextWords: RegExp;
  textOverlayWords: RegExp;
  noOverlayWords: RegExp;
  overlayWords: RegExp;
  noAddWords: RegExp;
  addWords: RegExp;
  noCenterWords: RegExp;
  centerHeroWords: RegExp;
  globalWords: RegExp;
};

const RULES: RulePack = {
  staticWords: /\b(static|still|freeze|no movement|stays stable|keep still)\b|保持静止|保持原位|不移动|静止构图/i,
  motionWords: /\b(run|walk|move|moving|rush|dash|pan|zoom|rotate|turn)\b|跑|走|移动|位移|推进|拉远|旋转|转身/i,
  lightingWords: /\b(light|lighting|backlight|rim light|key light|soft light|sunlight|shadow|glow|neon)\b|光照|灯光|主光|背光|轮廓光|柔光|阳光|阴影|辉光|霓虹/i,
  noTextWords: /\b(no text|no subtitles|no numbers)\b|无文字|不要文字|无字幕|无数字/i,
  textOverlayWords: /\b(add text|title card|text overlay|subtitle)\b|添加文字|标题字|字幕/i,
  noOverlayWords: /\b(no overlays|no ui overlay)\b|无叠加|无界面叠加/i,
  overlayWords: /\b(ui overlay|hud|overlay)\b|界面叠加|覆盖层/i,
  noAddWords: /\b(do not add|no add\/remove subjects|keep object count)\b|不得新增|不得删除|保持对象数量/i,
  addWords: /\b(add subject|add character|add person|extra subject)\b|新增主体|新增人物|额外人物/i,
  noCenterWords: /\b(no auto-centering|do not center|no symmetry)\b|不自动居中|不对称/i,
  centerHeroWords: /\b(center the hero|hero shot|main subject in center)\b|主角居中|中心主角/i,
  globalWords: /\b(all subjects|whole scene|global|camera|composition)\b|全场景|全局|镜头|构图/i
};

function parseBg(notes: string): string {
  const hit = (notes ?? "")
    .split("\n")
    .find((line) => line.trim().toLowerCase().startsWith("bg:"));
  return hit ? hit.trim().slice(3).trim() : "";
}

function parseConstraintMarker(notes: string, keys: string[]): string {
  const lines = (notes ?? "").split("\n");
  for (const key of keys) {
    const hit = lines.find((line) => line.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`));
    if (hit) return hit.trim().slice(key.length + 1).trim();
  }
  return "";
}

function getKF(layer: Layer, t: 0 | 1) {
  const hit = (layer.kf ?? []).find((k) => k.t === t);
  return hit ?? (layer.kf ?? [])[0] ?? { t, x: 50, y: 50, w: 18, h: 18, rot: 0 };
}

function layerText(layer: Layer): string {
  return `${layer.notes ?? ""}\n${layer.externalPrompt ?? ""}`.trim();
}

function isStaticScene(scene: Scene): boolean {
  return (scene.layers ?? []).every((layer) => {
    const a = getKF(layer, 0);
    const b = getKF(layer, 1);
    const eq = (x: number, y: number) => Math.round(x * 10) === Math.round(y * 10);
    return eq(a.x, b.x) && eq(a.y, b.y) && eq(a.w, b.w) && eq(a.h, b.h) && eq(a.rot ?? 0, b.rot ?? 0);
  });
}

function has(re: RegExp, text: string): boolean {
  return re.test(text);
}

function zhOrEn(lang: Lang, zh: string, en: string): string {
  return lang === "zh" ? zh : en;
}

export function detectSceneConflicts(
  scene: Scene,
  lang: Lang,
  project?: Project | null
): PromptConflict[] {
  const out: PromptConflict[] = [];
  const layers = scene.layers ?? [];
  const notes = scene.notes ?? "";
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const sceneStrategy = resolveSceneStrategy(scene, lang, mediaMode);
  const strategyOwnsGlobalLanguage = Boolean(sceneStrategy.classicModeId || sceneStrategy.directorPackId);
  const bgText = parseBg(notes);
  const directorPackId = parseDirectorStylePackId(notes) || sceneStrategy.directorPackId || null;
  const cameraLanguageId = parseCameraLanguageId(notes) || null;
  const classicModeId = mediaMode === "video"
    ? parseVideoClassicModeId(notes)
    : parseImageClassicModeId(notes);
  const proMotionIds = parseProMotionSelection(notes).proPlusIds;
  const perspectiveLock = parseConstraintMarker(notes, ["lock_perspective", "constraint_perspective_lock"]).toLowerCase();
  const proportionLock = parseConstraintMarker(notes, ["lock_proportion", "constraint_proportion_lock"]).toLowerCase();
  const focusPriority = parseConstraintMarker(notes, ["focus_priority", "constraint_focus_priority"]).toLowerCase();
  const paletteDiscipline = parseConstraintMarker(notes, ["palette_discipline", "constraint_palette_discipline"]).toLowerCase();

  for (const layer of layers) {
    const all = layerText(layer);
    const notes = String(layer.notes ?? "");
    const ext = String(layer.externalPrompt ?? "");

    if (has(RULES.staticWords, all) && has(RULES.motionWords, all)) {
      out.push({
        id: `layer_static_motion_${layer.id}`,
        severity: "high",
        scope: "layer",
        layerId: layer.id,
        field: "notes",
        title: zhOrEn(lang, "静止与运动冲突", "Static vs Motion Conflict"),
        detail: zhOrEn(lang, `对象 ${layer.id} 同时出现“保持静止”和“移动/跑动”。`, `Layer ${layer.id} contains both static and motion instructions.`)
      });
    }
    if (has(RULES.noTextWords, all) && has(RULES.textOverlayWords, all)) {
      out.push({
        id: `layer_text_conflict_${layer.id}`,
        severity: "high",
        scope: "layer",
        layerId: layer.id,
        field: "notes",
        title: zhOrEn(lang, "文字约束冲突", "Text Constraint Conflict"),
        detail: zhOrEn(lang, `对象 ${layer.id} 同时写了“无文字”和“添加文字/字幕”。`, `Layer ${layer.id} contains both no-text and add-text instructions.`)
      });
    }
    if (has(RULES.noOverlayWords, all) && has(RULES.overlayWords, all)) {
      out.push({
        id: `layer_overlay_conflict_${layer.id}`,
        severity: "warning",
        scope: "layer",
        layerId: layer.id,
        field: "notes",
        title: zhOrEn(lang, "叠加层约束冲突", "Overlay Constraint Conflict"),
        detail: zhOrEn(lang, `对象 ${layer.id} 同时出现“无叠加”和“overlay/hud”。`, `Layer ${layer.id} includes both no-overlay and overlay terms.`)
      });
    }
    if (has(RULES.noAddWords, all) && has(RULES.addWords, all)) {
      out.push({
        id: `layer_count_conflict_${layer.id}`,
        severity: "high",
        scope: "layer",
        layerId: layer.id,
        field: "notes",
        title: zhOrEn(lang, "对象数量约束冲突", "Object Count Conflict"),
        detail: zhOrEn(lang, `对象 ${layer.id} 同时出现“不得新增/删除”和“新增主体”。`, `Layer ${layer.id} includes both no-add/remove and add-subject instructions.`)
      });
    }
    if (has(RULES.noCenterWords, all) && has(RULES.centerHeroWords, all)) {
      out.push({
        id: `layer_center_conflict_${layer.id}`,
        severity: "warning",
        scope: "layer",
        layerId: layer.id,
        field: "notes",
        title: zhOrEn(lang, "居中策略冲突", "Centering Strategy Conflict"),
        detail: zhOrEn(lang, `对象 ${layer.id} 同时出现“不要居中”和“主角居中”。`, `Layer ${layer.id} includes both no-centering and center-hero wording.`)
      });
    }
    if (has(RULES.globalWords, ext)) {
      out.push({
        id: `layer_global_scope_${layer.id}`,
        severity: "warning",
        scope: "layer",
        layerId: layer.id,
        field: "externalPrompt",
        title: zhOrEn(lang, "对象局部提示词疑似越权", "Object-local Prompt Scope Risk"),
        detail: zhOrEn(lang, `对象 ${layer.id} 的局部提示词出现了全局词（镜头/全场景/构图）。`, `Object-local prompt of ${layer.id} contains global terms (camera/scene/composition).`)
      });
    }
    if (has(RULES.globalWords, notes) && has(RULES.globalWords, ext)) {
      out.push({
        id: `layer_double_global_${layer.id}`,
        severity: "warning",
        scope: "layer",
        layerId: layer.id,
        field: "externalPrompt",
        title: zhOrEn(lang, "局部与备注同时改全局", "Local+Notes Global Override Risk"),
        detail: zhOrEn(lang, `对象 ${layer.id} 的备注和局部提示词都在改全局。`, `Both notes and object-local prompt of ${layer.id} attempt global overrides.`)
      });
    }
    // 只在明确检测到全局词时才提示，减少误报
    if (strategyOwnsGlobalLanguage) {
      const globalWordsMatch = has(RULES.globalWords, all);
      const lightingWordsMatch = has(RULES.lightingWords, all);
      if (globalWordsMatch || lightingWordsMatch) {
        // 检查是否是真正的全局词，避免误报
        const actualGlobalWords = /\b(camera|lens|shot|framing|composition|global|all subjects|whole scene|full frame)\b/i.test(all);
        const actualLightingWords = /\b(light|lighting|backlight|rim light|key light|soft light|sunlight|shadow|glow|neon)\b/i.test(all);
        // 只对明显的全局控制词进行提示，减少误报
        if (actualGlobalWords || actualLightingWords) {
          // 检查是否只是描述性的词汇，不是控制指令
          const isDescriptiveOnly = /\b(description|detail|look|appearance|style)\b/i.test(all);
          if (!isDescriptiveOnly) {
            out.push({
              id: `layer_strategy_scope_${layer.id}`,
              severity: "warning",
              scope: "layer",
              layerId: layer.id,
              field: has(RULES.globalWords, ext) ? "externalPrompt" : "notes",
              title: zhOrEn(lang, "对象级输入正在改写场景策略", "Object-level Input Overrides Scene Strategy"),
              detail: zhOrEn(
                lang,
                `对象 ${layer.id} 的局部描述出现了镜头/构图/光照等场景级词，但当前分镜已经启用了经典模式或导演包。建议把全局电影语言放回左栏。`,
                `Layer ${layer.id} uses camera/composition/lighting wording while the scene already has a Classic Mode or Directing Pack. Keep global cinematic language on the left panel.`
              )
            });
          }
        }
      }
    }
  }

  const staticScene = isStaticScene(scene);
  if (staticScene) {
    const movingLayers = layers.filter((l) => has(RULES.motionWords, layerText(l)));
    if (movingLayers.length > 0) {
      out.push({
        id: "scene_static_vs_motion",
        severity: "high",
        scope: "scene",
        layerId: null,
        field: "scene",
        title: zhOrEn(lang, "场景静止但描述要求运动", "Static Timeline vs Motion Description"),
        detail: zhOrEn(
          lang,
          `当前场景 t0=t1（静止），但 ${movingLayers.map((x) => x.id).join("、")} 写了运动描述。`,
          `Scene is static (t0=t1), but motion instructions exist in layers: ${movingLayers.map((x) => x.id).join(", ")}.`
        )
      });
    }
  }

  const globalMotionByLayer = layers
    .map((l) => ({ id: l.id, text: layerText(l) }))
    .filter((x) => has(RULES.globalWords, x.text))
    .map((x) => ({
      id: x.id,
      wantsStatic: has(RULES.staticWords, x.text),
      wantsMotion: has(RULES.motionWords, x.text)
    }));

  const hasGlobalStatic = globalMotionByLayer.some((x) => x.wantsStatic);
  const hasGlobalMotion = globalMotionByLayer.some((x) => x.wantsMotion);
  if (hasGlobalStatic && hasGlobalMotion) {
    out.push({
      id: "cross_global_static_motion",
      severity: "high",
      scope: "cross-layer",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "跨对象全局动作冲突", "Cross-layer Global Motion Conflict"),
      detail: zhOrEn(
        lang,
        "不同对象都在写全局规则，且同时存在“全局静止”和“全局运动”要求。",
        "Different layers contain global rules with both global-static and global-motion instructions."
      )
    });
  }

  if (strategyOwnsGlobalLanguage && bgText && has(RULES.lightingWords, bgText) && sceneStrategy.defaults.time + sceneStrategy.defaults.keyDir + sceneStrategy.defaults.mood) {
    out.push({
      id: "scene_bg_lighting_conflict",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "背景描述和场景光照策略重复", "Background Text Duplicates Scene Lighting Strategy"),
      detail: zhOrEn(
        lang,
        "右栏背景描述里包含了光照词，但当前场景策略已经在左栏控制光照。建议背景只写空间和环境，不再重复写灯光。",
        "Scene background text contains lighting wording while the current scene strategy already controls lighting. Keep the background focused on place and environment."
      )
    });
  }

  // ── 约束锁定一致性检查（V3 constraint locks）────────────────────────────
  const camAngle = (notes.split("\n").find((line) => line.trim().toLowerCase().startsWith("cam_angle:")) ?? "")
    .split(":")
    .slice(1)
    .join(":")
    .trim()
    .toLowerCase();
  if ((perspectiveLock === "natural" || perspectiveLock === "strict") && camAngle === "dutch") {
    out.push({
      id: "constraint_perspective_vs_dutch",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "透视锁定与荷兰角冲突", "Perspective lock conflicts with Dutch angle"),
      detail: zhOrEn(
        lang,
        "已启用自然/严格透视锁定，同时又设置了荷兰倾斜机位，可能导致透视目标不稳定。",
        "Natural/strict perspective lock is enabled while Dutch angle is set, which may destabilize perspective intent."
      )
    });
  }

  if (focusPriority === "hero_only" && layers.length > 1) {
    const oversizedSupport = layers
      .slice(1)
      .some((layer) => {
        const k0 = getKF(layer, 0);
        return (k0.w ?? 0) >= 25;
      });
    if (oversizedSupport) {
      out.push({
        id: "constraint_focus_vs_support_scale",
        severity: "warning",
        scope: "scene",
        layerId: null,
        field: "scene",
        title: zhOrEn(lang, "主焦点锁定与支撑物比例冲突", "Hero focus lock conflicts with support scale"),
        detail: zhOrEn(
          lang,
          "已启用主焦点锁定，但存在较大支撑对象（宽度>=25），可能抢焦。",
          "Hero-only focus lock is enabled while one or more support objects are large (w>=25), which may steal focus."
        )
      });
    }
  }

  if (paletteDiscipline === "warm_amber_limited") {
    const colorGrade = (notes.split("\n").find((line) => line.trim().toLowerCase().startsWith("color_grade:")) ?? "")
      .toLowerCase();
    const hasConflictingPalette =
      colorGrade.includes("teal_orange") ||
      colorGrade.includes("cool_steel") ||
      /\bneon\b/i.test(notes);
    if (hasConflictingPalette) {
      out.push({
        id: "constraint_palette_conflict",
        severity: "warning",
        scope: "scene",
        layerId: null,
        field: "scene",
        title: zhOrEn(lang, "色彩纪律与场景调色冲突", "Palette discipline conflicts with color grade"),
        detail: zhOrEn(
          lang,
          "已启用暖琥珀限色，但当前调色或光线词包含冷钢/青橙/霓虹倾向。",
          "Warm-amber palette discipline is enabled, but current grade/lighting wording includes cool steel, teal-orange, or neon tendencies."
        )
      });
    }
  }

  if (proportionLock === "on") {
    const hasExtremeLens = /\bfocal_length:\s*(8mm|14mm|18mm|macro)\b/i.test(notes);
    if (hasExtremeLens) {
      out.push({
        id: "constraint_proportion_vs_extreme_lens",
        severity: "warning",
        scope: "scene",
        layerId: null,
        field: "scene",
        title: zhOrEn(lang, "比例锁定与极端镜头冲突", "Proportion lock conflicts with extreme lens"),
        detail: zhOrEn(
          lang,
          "已启用比例锁定，同时使用极端镜头（超广/微距），可能引入形变风险。",
          "Proportion lock is enabled while an extreme lens (ultra-wide/macro) is used, which may introduce distortion risk."
        )
      });
    }
  }

  // ── 字段组合冲突检测 ──────────────────────────────────────────────────────

  if (classicModeId && directorPackId) {
    out.push({
      id: "field_classic_director_conflict",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "经典模式与导演包同时启用", "Classic mode and director pack both active"),
      detail: zhOrEn(
        lang,
        "两者都会控制镜头语言，可能互相覆盖。建议只保留一个。",
        "Both control cinematic language and may override each other. Keep only one."
      )
    });
  }

  if (cameraLanguageId && classicModeId) {
    out.push({
      id: "field_lens_classic_conflict",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "镜头配方与经典模式同时启用", "Lens recipe and classic mode both active"),
      detail: zhOrEn(
        lang,
        "镜头配方和经典模式都在定义镜头语言，可能重复叠加。",
        "Both define camera language and may stack redundantly."
      )
    });
  }

  if (cameraLanguageId && directorPackId) {
    out.push({
      id: "field_lens_director_conflict",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "镜头配方与导演包同时启用", "Lens recipe and director pack both active"),
      detail: zhOrEn(
        lang,
        "两者都在控制高级镜头语言，建议选一个主控。",
        "Both control advanced camera language. Pick one as the primary."
      )
    });
  }

  const hasContinuousShotPlan = (project?.project?.shotPlan ?? "single") === "continuous";
  const hasJumpCutMotion = proMotionIds.some((id) =>
    ["whip_pan", "match_cut", "jump_cut"].includes(id)
  );
  if (hasContinuousShotPlan && hasJumpCutMotion) {
    out.push({
      id: "field_continuous_jumpcut_conflict",
      severity: "warning",
      scope: "scene",
      layerId: null,
      field: "scene",
      title: zhOrEn(lang, "连续镜头与跳切运镜冲突", "Continuous shot plan conflicts with jump-cut motion"),
      detail: zhOrEn(
        lang,
        "连续镜头模式不适合跳切类运镜，会破坏时空连贯性。",
        "Continuous shot plan is incompatible with jump-cut motions."
      )
    });
  }

  return out;
}
