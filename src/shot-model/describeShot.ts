import type { Lang } from "../i18n";
import type { ShotDescription, ShotModel } from "./types";

function pickSubjectLine(model: ShotModel, lang: Lang): string {
  const primary = model.subject.primary;
  const supports = model.subject.secondary.slice(0, 3);
  if (lang === "zh") {
    const main = primary
      ? `主体：${primary.type || primary.id}${primary.look ? `，外观 ${primary.look}` : ""}`
      : "主体：未指定主主体，按场景对象关系执行。";
    const action = model.action.primaryAction ? `动作：${model.action.primaryAction}` : "";
    const support = supports.length
      ? `辅助主体：${supports.map((item) => item.type || item.id).join("、")}`
      : "";
    return [main, action, support].filter(Boolean).join("；");
  }

  const main = primary
    ? `Primary subject: ${primary.type || primary.id}${primary.look ? `, look ${primary.look}` : ""}`
    : "Primary subject is implicit; follow scene relation graph.";
  const action = model.action.primaryAction ? `Action: ${model.action.primaryAction}` : "";
  const support = supports.length ? `Supporting subjects: ${supports.map((item) => item.type || item.id).join(", ")}` : "";
  return [main, action, support].filter(Boolean).join("; ");
}

function pickCameraLine(model: ShotModel, lang: Lang): string {
  const cam = model.camera;
  const focus = model.composition.focus;
  if (lang === "zh") {
    return [
      `镜头：${cam.shot}，运动 ${cam.movement}，转场 ${cam.transitionType}`,
      `构图：${focus}，关系优先，禁止自动重排。`
    ].join("；");
  }
  return [
    `Camera: ${cam.shot}, movement ${cam.movement}, transition ${cam.transitionType}`,
    `Composition: ${focus}, relation-first, no auto relayout.`
  ].join("; ");
}

function pickSpaceLine(model: ShotModel, lang: Lang): string {
  const entry = model.space.entryDir ? `${model.space.entryDir}` : lang === "zh" ? "自动" : "auto";
  const exit = model.space.exitDir ? `${model.space.exitDir}` : lang === "zh" ? "自动" : "auto";
  const depth = model.space.depthOrder.map((item) => `${item.id}(z=${item.z})`).join(lang === "zh" ? "、" : ", ");
  if (lang === "zh") {
    return `空间：背景 ${model.space.background || "沿用场景背景"}；入场 ${entry}，离场 ${exit}；层级 ${depth || "按对象顺序"}。`;
  }
  return `Space: background ${model.space.background || "use scene background"}; entry ${entry}, exit ${exit}; depth ${depth || "follow object order"}.`;
}

function pickLightMaterialLine(model: ShotModel, lang: Lang): string {
  const light = model.lighting;
  const material = model.material.surfaceCues.slice(0, 3).join(lang === "zh" ? "、" : ", ");
  if (lang === "zh") {
    return `光线：时间 ${light.time}，主光 ${light.keyDir}，氛围 ${light.mood}；材质重点：${material || "按主体可读性"}。`;
  }
  return `Lighting: time ${light.time}, key ${light.keyDir}, mood ${light.mood}; material focus: ${material || "subject readability first"}.`;
}

function pickMoodStyleLine(model: ShotModel, lang: Lang): string {
  const style = [
    model.style.videoClassicModeId,
    model.style.imageClassicModeId,
    model.camera.directorPackId,
    model.camera.cameraLanguageId
  ].filter(Boolean).join(lang === "zh" ? "、" : ", ");

  if (lang === "zh") {
    return `情绪与风格：${model.mood.tone}，能量 ${model.mood.energy}；风格锚点 ${style || "无显式风格标记"}。`;
  }
  return `Mood and style: ${model.mood.tone}, energy ${model.mood.energy}; style anchors ${style || "no explicit style markers"}.`;
}

function pickConstraintLine(model: ShotModel, lang: Lang): string {
  const hard = model.semantic.hardConstraints.join(lang === "zh" ? "；" : "; ");
  const continuity = model.continuity.enabled
    ? model.motion.continuityHints.join(lang === "zh" ? "；" : "; ")
    : lang === "zh"
      ? "当前分镜不启用连续镜头承接。"
      : "No continuity carry-over for this shot.";

  if (lang === "zh") {
    return `约束与连续性：${hard}；连续性：${continuity}`;
  }
  return `Constraints and continuity: ${hard}; continuity: ${continuity}`;
}

export function describeShot(model: ShotModel, lang: Lang): ShotDescription {
  const segments = {
    subjectAction: pickSubjectLine(model, lang),
    cameraComposition: pickCameraLine(model, lang),
    spaceLayer: pickSpaceLine(model, lang),
    lightingMaterial: pickLightMaterialLine(model, lang),
    moodStyle: pickMoodStyleLine(model, lang),
    constraintsContinuity: pickConstraintLine(model, lang)
  };

  const lines = [
    segments.subjectAction,
    segments.cameraComposition,
    segments.spaceLayer,
    segments.lightingMaterial,
    segments.moodStyle,
    segments.constraintsContinuity
  ].filter(Boolean);

  return {
    title: lang === "zh" ? `分镜 ${String(model.context.index + 1).padStart(2, "0")}` : `Shot ${String(model.context.index + 1).padStart(2, "0")}`,
    lines,
    text: lines.join("\n"),
    segments
  };
}
