/**
 * Scene field rules engine.
 *
 * 核心逻辑：根据当前 scene/project 状态，
 * 返回每个字段是否可用（enabled）、是否可见（visible）及原因。
 *
 * 调用层只需把 scene + project 传入 buildSceneFieldRules()，
 * 得到一个 SceneFieldRuleMap，再交给 useFieldState / useAllowedOptions 消费。
 */

import type { Project, Scene } from "../model";
import { resolveSceneConfig } from "../model";
import type { FieldKey } from "./fieldKeys";
import { FIELD_KEYS } from "./fieldKeys";
import {
  parseDirectorStylePackId,
} from "../content/directorStylePacks";
import {
  parseVideoClassicModeId,
  parseImageClassicModeId,
  parseImageProEffects,
  disabledVideoProPlusIds,
  disabledImageEffectIds,
} from "../content/proCreativeModes";
import { parseCameraLanguageId } from "../content/cameraLanguageLayers";
import { parseProMotionSelection } from "../content/proCameraPresets";

// ─── Result types ────────────────────────────────────────────────────────────

export type FieldRuleResult = {
  visible: boolean;
  enabled: boolean;
  /** 原因文字，供 tooltip 展示，中文优先；调用方可按 lang 自行替换 */
  reasonZh?: string;
  reasonEn?: string;
};

/** fieldKey → FieldRuleResult */
export type SceneFieldRuleMap = Map<FieldKey, FieldRuleResult>;

/** 特定选项的可用状态 */
export type OptionRuleResult = {
  value: string;
  enabled: boolean;
  reasonZh?: string;
  reasonEn?: string;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

const ON: FieldRuleResult = { visible: true, enabled: true };
const OFF = (zh: string, en: string): FieldRuleResult => ({
  visible: true,
  enabled: false,
  reasonZh: zh,
  reasonEn: en,
});
const HIDDEN: FieldRuleResult = { visible: false, enabled: false };

// ─── Main builder ────────────────────────────────────────────────────────────

/**
 * 根据 scene + project 的当前状态，计算所有字段的规则结果。
 *
 * 设计原则（来自你的架构意图）：
 *  1. 选了导演包 → classicShot / classicMotion / lensRecipe 变暗（导演包接管全局电影语言）
 *  2. 选了经典模式 → directorStylePack 变暗（两者不能同时生效）
 *  3. 选了 proMotions → classicMotion 变暗（proMotion 已经提供运动语言）
 *  4. 选了 lensRecipe（镜头配方）→ classicShot / classicMotion 变暗
 *  5. 图片模式 → 所有视频专属字段（cameraMoveMode / jumpCutMode / entryDir / exitDir）隐藏
 *  6. single shot（单镜头）→ sceneChangeMode / entryDir / exitDir 隐藏
 *  7. continuous shot → jumpCutMode 禁用（连续镜头不能有跳切）
 *  8. imageProEffects 内部互斥 → 交给 disabledImageEffectIds
 *  9. proMotions 内部互斥 → 交给 disabledVideoProPlusIds
 * 10. layoutLocked（模板 layout_only 模式）→ 大部分编辑字段禁用
 */
export function buildSceneFieldRules(
  scene: Scene,
  project: Project | null
): SceneFieldRuleMap {
  const map = new Map<FieldKey, FieldRuleResult>();
  const set = (key: FieldKey, result: FieldRuleResult) => map.set(key, result);

  // ── 读取当前场景状态 ─────────────────────────────────────────────────────
  const mediaMode = resolveSceneConfig(scene).mediaMode; // "image" | "video"
  const isVideo = mediaMode === "video";
  const isImage = mediaMode === "image";

  const shotPlan = (project?.project?.shotPlan ?? "single") as string;
  const isSingle = shotPlan === "single";
  const isContinuous = shotPlan === "continuous";

  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "full_workflow";
  const isLayoutLocked = applyMode === "layout_only";

  const notes = scene.notes ?? "";
  const directorPackId = parseDirectorStylePackId(notes);
  const hasDirectorPack = Boolean(directorPackId);

  const classicModeId = isVideo
    ? parseVideoClassicModeId(notes)
    : parseImageClassicModeId(notes);
  const hasClassicMode = Boolean(classicModeId);

  const lensRecipeId = parseCameraLanguageId(notes); // hidden camera language
  const hasLensRecipe = Boolean(lensRecipeId);

  const proMotionSelection = parseProMotionSelection(notes);
  const hasProMotion = proMotionSelection.proPlusIds.length > 0;

  // ── 项目级别字段 ─────────────────────────────────────────────────────────
  set(FIELD_KEYS.PROJECT_MEDIA_TYPE, ON);
  set(FIELD_KEYS.PROJECT_STORY_PLAN, ON);
  set(FIELD_KEYS.PROJECT_WORKSPACE_MODE, ON);
  set(
    FIELD_KEYS.PROJECT_SCENE_COUNT,
    isLayoutLocked
      ? OFF("模板锁定布局，不能增减场景数量", "Template locks layout; scene count is fixed.")
      : ON
  );
  set(FIELD_KEYS.PROJECT_TOTAL_DURATION, ON);

  // ── 场景基础字段 ──────────────────────────────────────────────────────────
  set(
    FIELD_KEYS.SCENE_DURATION,
    isLayoutLocked
      ? OFF("模板锁定布局，时长不可编辑", "Template locks layout; duration is fixed.")
      : ON
  );

  // ── 场景变换 / 转场 ───────────────────────────────────────────────────────
  // single 模式下无多场景，转场模式无意义
  if (isSingle) {
    set(FIELD_KEYS.SCENE_CHANGE_MODE, HIDDEN);
  } else {
    set(FIELD_KEYS.SCENE_CHANGE_MODE, ON);
  }

  // 连续镜头不支持跳切
  if (!isVideo) {
    set(FIELD_KEYS.SCENE_JUMP_CUT_MODE, HIDDEN);
  } else if (isContinuous) {
    set(
      FIELD_KEYS.SCENE_JUMP_CUT_MODE,
      OFF("连续镜头模式不支持跳切", "Jump cut is not available in continuous shot mode.")
    );
  } else {
    set(FIELD_KEYS.SCENE_JUMP_CUT_MODE, ON);
  }

  // cameraMoveMode 仅视频可用
  set(
    FIELD_KEYS.SCENE_CAMERA_MOVE_MODE,
    isImage ? HIDDEN : ON
  );

  // 入场/出场方向：仅视频 + 非 single
  if (isImage || isSingle) {
    set(FIELD_KEYS.SCENE_ENTRY_DIRECTION, HIDDEN);
    set(FIELD_KEYS.SCENE_EXIT_DIRECTION, HIDDEN);
  } else {
    set(FIELD_KEYS.SCENE_ENTRY_DIRECTION, ON);
    set(FIELD_KEYS.SCENE_EXIT_DIRECTION, ON);
  }

  // ── 经典模式 (classicShot / classicMotion) ────────────────────────────────
  // 导演包 接管全局电影语言 → 经典模式变暗
  if (hasDirectorPack) {
    set(
      FIELD_KEYS.SCENE_CLASSIC_SHOT,
      OFF("已启用导演包，经典景别由导演包接管", "Director pack is active; classic shot is managed by the pack.")
    );
    set(
      FIELD_KEYS.SCENE_CLASSIC_MOTION,
      isImage
        ? HIDDEN
        : OFF("已启用导演包，经典运动由导演包接管", "Director pack is active; classic motion is managed by the pack.")
    );
  } else if (hasLensRecipe) {
    // 镜头配方 接管 → 经典模式变暗
    set(
      FIELD_KEYS.SCENE_CLASSIC_SHOT,
      OFF("已启用镜头配方（高级镜头语言），与经典景别互斥", "Lens recipe (advanced camera language) is active; classic shot is mutually exclusive.")
    );
    set(
      FIELD_KEYS.SCENE_CLASSIC_MOTION,
      isImage
        ? HIDDEN
        : OFF("已启用镜头配方，经典运动不可叠加", "Lens recipe is active; classic motion cannot be combined.")
    );
  } else if (hasProMotion && !isImage) {
    // proMotion 已提供运动语言 → classicMotion 变暗
    set(FIELD_KEYS.SCENE_CLASSIC_SHOT, ON);
    set(
      FIELD_KEYS.SCENE_CLASSIC_MOTION,
      OFF("已选专业运动（Pro Motion），经典运动不能同时生效", "Pro motion is selected; classic motion cannot be combined.")
    );
  } else {
    set(FIELD_KEYS.SCENE_CLASSIC_SHOT, ON);
    set(
      FIELD_KEYS.SCENE_CLASSIC_MOTION,
      isImage ? HIDDEN : ON
    );
  }

  // ── 导演包 ────────────────────────────────────────────────────────────────
  // 经典模式已选 → 导演包变暗（互斥）
  if (hasClassicMode && !hasDirectorPack) {
    set(
      FIELD_KEYS.SCENE_DIRECTOR_STYLE_PACK,
      OFF("已选经典模式，导演包与经典模式互斥", "Classic mode is active; director pack cannot be combined.")
    );
  } else if (hasLensRecipe) {
    set(
      FIELD_KEYS.SCENE_DIRECTOR_STYLE_PACK,
      OFF(
        "已启用镜头语言，与导演包互斥——请先在「镜头控制」将镜头语言清为「未选择」",
        "Camera language is active and conflicts with director pack — clear it first in Camera Language."
      )
    );
  } else {
    set(FIELD_KEYS.SCENE_DIRECTOR_STYLE_PACK, ON);
  }

  // ── 镜头配方（lensRecipe / hidden camera language）────────────────────────
  // 经典模式或导演包已选 → lensRecipe 变暗
  if (hasClassicMode || hasDirectorPack) {
    set(
      FIELD_KEYS.SCENE_LENS_RECIPE,
      OFF(
        "经典模式或导演包已接管电影语言，镜头配方不可叠加",
        "Classic mode or director pack owns cinematic language; lens recipe cannot be added."
      )
    );
  } else {
    set(FIELD_KEYS.SCENE_LENS_RECIPE, ON);
  }

  // ── Pro Motions ───────────────────────────────────────────────────────────
  // 图片模式不支持
  if (isImage) {
    set(FIELD_KEYS.SCENE_PRO_MOTIONS, HIDDEN);
  } else if (hasClassicMode) {
    // 经典模式已提供运动语言
    set(
      FIELD_KEYS.SCENE_PRO_MOTIONS,
      OFF("经典模式已定义运动语言，Pro Motion 不可叠加", "Classic mode defines motion; pro motion cannot be combined.")
    );
  } else {
    set(FIELD_KEYS.SCENE_PRO_MOTIONS, ON);
  }

  // ── Image Pro Effects ─────────────────────────────────────────────────────
  if (isVideo) {
    set(FIELD_KEYS.SCENE_IMAGE_PRO_EFFECTS, HIDDEN);
  } else {
    set(FIELD_KEYS.SCENE_IMAGE_PRO_EFFECTS, ON);
  }

  // ── Constraint strength ───────────────────────────────────────────────────
  set(FIELD_KEYS.SCENE_CONSTRAINT_STRENGTH, ON);

  // ── Lighting setup ────────────────────────────────────────────────────────
  // 导演包/经典模式会注入光照，用户还是可以覆盖，但给一个 warning 而不是禁用
  set(FIELD_KEYS.SCENE_LIGHTING_SETUP, ON);

  // ── Background ────────────────────────────────────────────────────────────
  set(FIELD_KEYS.SCENE_BACKGROUND_PROMPT, ON);
  set(FIELD_KEYS.SCENE_BACKGROUND_REF_IMAGE, ON);

  // ── Object fields ─────────────────────────────────────────────────────────
  set(FIELD_KEYS.OBJECT_T0, ON);
  set(
    FIELD_KEYS.OBJECT_T1,
    isImage
      ? OFF("图片模式只有 T0 关键帧", "Image mode only has a T0 keyframe.")
      : ON
  );
  set(FIELD_KEYS.OBJECT_REF_IMAGE, ON);
  set(FIELD_KEYS.OBJECT_NOTES, ON);

  // ── Export fields ─────────────────────────────────────────────────────────
  set(FIELD_KEYS.EXPORT_RANGE, ON);
  set(FIELD_KEYS.EXPORT_METHOD, ON);
  set(FIELD_KEYS.EXPORT_TARGET, ON);

  return map;
}

// ─── Option-level rules ──────────────────────────────────────────────────────

/**
 * 针对 proMotions 字段，返回每个选项的可用状态。
 * 复用 Sidebar 里已有的 disabledVideoProPlusIds 逻辑。
 */
export function buildProMotionOptionRules(
  scene: Scene,
  allOptionIds: string[]
): OptionRuleResult[] {
  const shot = (scene.camera?.shot ?? "").toLowerCase();
  const movement = (scene.camera?.movement ?? "").toLowerCase();
  const notes = scene.notes ?? "";
  const selected = parseProMotionSelection(notes).proPlusIds;
  const disabled = disabledVideoProPlusIds(shot, movement, selected);

  return allOptionIds.map((id) => ({
    value: id,
    enabled: !disabled.has(id),
    reasonZh: disabled.has(id) ? "与当前景别/运动组合互斥" : undefined,
    reasonEn: disabled.has(id) ? "Conflicts with current shot/movement combination." : undefined,
  }));
}

/**
 * 针对 imageProEffects 字段，返回每个选项的可用状态。
 * 复用 disabledImageEffectIds 逻辑。
 */
export function buildImageProEffectOptionRules(
  scene: Scene,
  allOptionIds: string[]
): OptionRuleResult[] {
  const notes = scene.notes ?? "";
  const selected = parseImageProEffects(notes);
  const disabled = disabledImageEffectIds(selected);

  return allOptionIds.map((id) => ({
    value: id,
    enabled: !disabled.has(id),
    reasonZh: disabled.has(id) ? "与已选图片效果互斥" : undefined,
    reasonEn: disabled.has(id) ? "Conflicts with a selected image effect." : undefined,
  }));
}
