import type { Lang } from "../i18n";
import type { Layer, Scene } from "../model";

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

export function detectSceneConflicts(scene: Scene, lang: Lang): PromptConflict[] {
  const out: PromptConflict[] = [];
  const layers = scene.layers ?? [];

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

  return out;
}
