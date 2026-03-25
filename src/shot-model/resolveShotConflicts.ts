import type { ShotConflictDecision } from "./types";

type ResolveShotConflictsInput = {
  sceneNotes: string;
  layerNotes: string[];
  layerLocalPrompts: string[];
  isStaticTimeline: boolean;
};

export type ResolvedShotConflictState = {
  allowMotionDisplacement: boolean;
  allowTextOverlay: boolean;
  allowAddRemoveSubjects: boolean;
  allowHeroCenterOverride: boolean;
  decisions: ShotConflictDecision[];
};

const RULES = {
  staticWords: /\b(static|still|freeze|no movement|stays stable|keep still)\b|保持静止|保持原位|不移动|静止构图/i,
  motionWords: /\b(run|walk|move|moving|rush|dash|pan|zoom|rotate|turn|enter)\b|跑|走|移动|位移|推进|拉远|旋转|转身|进入/i,
  noTextWords: /\b(no text|no subtitles|no numbers)\b|无文字|不要文字|无字幕|无数字/i,
  textOverlayWords: /\b(add text|title card|text overlay|subtitle)\b|添加文字|标题字|字幕/i,
  noAddWords: /\b(do not add|no add\/remove subjects|keep object count)\b|不得新增|不得删除|保持对象数量/i,
  addWords: /\b(add subject|add character|add person|extra subject)\b|新增主体|新增人物|额外人物/i,
  noCenterWords: /\b(no auto-centering|do not center|no symmetry)\b|不自动居中|不对称/i,
  centerHeroWords: /\b(center the hero|hero shot|main subject in center)\b|主角居中|中心主角/i
};

const has = (re: RegExp, text: string) => re.test(text);

function joined(input: ResolveShotConflictsInput): string {
  return [input.sceneNotes, ...input.layerNotes, ...input.layerLocalPrompts].filter(Boolean).join("\n");
}

export function resolveShotConflicts(input: ResolveShotConflictsInput): ResolvedShotConflictState {
  const decisions: ShotConflictDecision[] = [];
  const text = joined(input);

  let allowMotionDisplacement = true;
  let allowTextOverlay = true;
  let allowAddRemoveSubjects = true;
  let allowHeroCenterOverride = true;

  const staticAndMotion = has(RULES.staticWords, text) && has(RULES.motionWords, text);
  if (input.isStaticTimeline || staticAndMotion) {
    allowMotionDisplacement = false;
    decisions.push({
      id: "motion_static_priority",
      field: "motion",
      conflict: "static_vs_motion",
      winner: "structural",
      action: "drop",
      detail: input.isStaticTimeline
        ? "t0=t1 timeline is static; drop displacement instructions from free text."
        : "Conflicting static and motion language; keep structural static path."
    });
  }

  const textConflict = has(RULES.noTextWords, text) && has(RULES.textOverlayWords, text);
  if (textConflict) {
    allowTextOverlay = false;
    decisions.push({
      id: "text_overlay_conflict",
      field: "semantic",
      conflict: "no_text_vs_add_text",
      winner: "scene",
      action: "drop",
      detail: "No-text rule wins over add-text overlays for render safety."
    });
  }

  const countConflict = has(RULES.noAddWords, text) && has(RULES.addWords, text);
  if (countConflict) {
    allowAddRemoveSubjects = false;
    decisions.push({
      id: "subject_count_conflict",
      field: "subject",
      conflict: "preserve_count_vs_add_remove",
      winner: "structural",
      action: "drop",
      detail: "Preserve object-count structural rule; downgrade add/remove wishes to soft intent."
    });
  }

  const centerConflict = has(RULES.noCenterWords, text) && has(RULES.centerHeroWords, text);
  if (centerConflict) {
    allowHeroCenterOverride = false;
    decisions.push({
      id: "centering_conflict",
      field: "composition",
      conflict: "no_auto_center_vs_center_hero",
      winner: "scene",
      action: "downgrade",
      detail: "No-auto-center remains hard; center-hero becomes soft preference only."
    });
  }

  return {
    allowMotionDisplacement,
    allowTextOverlay,
    allowAddRemoveSubjects,
    allowHeroCenterOverride,
    decisions
  };
}
