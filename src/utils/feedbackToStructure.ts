import type { Lang } from "../i18n";
import type { IntentPlan } from "../types/intentPlan";

export type StructureStateLite = {
  subjectX: number;
  subjectY: number;
  subjectSize: number;
  subjectLayer: number;
  compositionFocus: "left" | "center" | "right";
};

export type FeedbackPatchResult = {
  structureState: StructureStateLite;
  intentPlan: IntentPlan;
  notes: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function copyIntent(intentPlan: IntentPlan): IntentPlan {
  return {
    ...intentPlan,
    style: { ...intentPlan.style },
    camera: { ...intentPlan.camera },
    scene: { ...intentPlan.scene },
    composition: intentPlan.composition ? { ...intentPlan.composition } : undefined,
    constraints: [...intentPlan.constraints],
    hardConstraints: intentPlan.hardConstraints ? [...intentPlan.hardConstraints] : [],
    editHints: [...intentPlan.editHints],
    subjects: intentPlan.subjects.map((subject) => ({ ...subject }))
  };
}

export function applyFeedbackToStructure(
  intentPlan: IntentPlan,
  structureState: StructureStateLite,
  feedbackRaw: string,
  lang: Lang
): FeedbackPatchResult {
  const feedback = feedbackRaw.toLowerCase().trim();
  const nextState: StructureStateLite = { ...structureState };
  const nextIntent = copyIntent(intentPlan);
  const notes: string[] = [];

  if (!feedback) return { structureState: nextState, intentPlan: nextIntent, notes };

  if (includesAny(feedback, ["主体太小", "subject too small"])) {
    nextState.subjectSize = clamp(nextState.subjectSize + 6, 12, 56);
    nextIntent.composition = { ...nextIntent.composition, subjectScalePreference: "large" };
    notes.push(lang === "zh" ? "反馈映射: 主体放大" : "Feedback map: enlarge primary subject");
  }

  if (includesAny(feedback, ["主体太大", "subject too big", "subject too large"])) {
    nextState.subjectSize = clamp(nextState.subjectSize - 6, 10, 56);
    nextIntent.composition = { ...nextIntent.composition, subjectScalePreference: "small" };
    notes.push(lang === "zh" ? "反馈映射: 主体缩小" : "Feedback map: reduce primary subject");
  }

  if (includesAny(feedback, ["背景太乱", "background too messy", "background cluttered"])) {
    nextIntent.scene.backgroundDensity = "clean";
    notes.push(lang === "zh" ? "反馈映射: 背景复杂度 -> clean" : "Feedback map: background density -> clean");
  }

  if (includesAny(feedback, ["背景太空", "background too empty", "background too plain"])) {
    nextIntent.scene.backgroundDensity = "rich";
    notes.push(lang === "zh" ? "反馈映射: 背景复杂度 -> rich" : "Feedback map: background density -> rich");
  }

  if (includesAny(feedback, ["主体不居中", "not centered", "off-center"])) {
    nextState.subjectX = 42;
    nextState.compositionFocus = "center";
    nextIntent.camera.framing = "center";
    nextIntent.composition = { ...nextIntent.composition, visualFocus: "center" };
    notes.push(lang === "zh" ? "反馈映射: 构图重心 -> center" : "Feedback map: composition focus -> center");
  }

  if (includesAny(feedback, ["主体偏左", "too left", "shift left"])) {
    nextState.subjectX = clamp(nextState.subjectX + 8, 0, 80);
    nextState.compositionFocus = "center";
    nextIntent.camera.framing = "center";
    notes.push(lang === "zh" ? "反馈映射: 主体向右回调" : "Feedback map: nudge subject right");
  }

  if (includesAny(feedback, ["主体偏右", "too right", "shift right"])) {
    nextState.subjectX = clamp(nextState.subjectX - 8, 0, 80);
    nextState.compositionFocus = "center";
    nextIntent.camera.framing = "center";
    notes.push(lang === "zh" ? "反馈映射: 主体向左回调" : "Feedback map: nudge subject left");
  }

  if (includesAny(feedback, ["风格太弱", "style too weak"])) {
    if (!nextIntent.style.genre) nextIntent.style.genre = "cinematic";
    nextIntent.constraints.push(lang === "zh" ? "加强风格一致性和笔触辨识度" : "Increase style consistency and visual signature");
    notes.push(lang === "zh" ? "反馈映射: 增强风格约束" : "Feedback map: increase style constraints");
  }

  if (includesAny(feedback, ["光线不对", "lighting is wrong", "bad lighting"])) {
    if (!nextIntent.style.lighting) {
      nextIntent.style.lighting = nextIntent.scene.timeOfDay === "night" ? "neon" : "soft";
    }
    nextIntent.constraints.push(lang === "zh" ? "重新校准主光方向和亮部层次" : "Rebalance key light direction and highlight hierarchy");
    notes.push(lang === "zh" ? "反馈映射: 光线策略修正" : "Feedback map: lighting strategy patch");
  }

  return { structureState: nextState, intentPlan: nextIntent, notes };
}
