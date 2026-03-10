import type { Lang } from "../i18n";
import type { StructureDraft } from "../types/structureDraft";
export type { QuickWorkspaceStage, StructureDraft, StructureHint } from "../types/structureDraft";
export {
  completeStructureDraft,
  defaultStructureHint,
  generateStructureDraft,
  normalizeStructureHint,
  validStructureHints,
  type GenerateStructureDraftArgs
} from "./structureDraftGenerator";
export { structureDraftToIntentPlan } from "./structureDraftToIntentPlan";

export function structureDraftToBrief(draft: StructureDraft, lang: Lang): string {
  if (draft.mediaType === "image") {
    const objects = draft.objects.map((item) => item.name).join(", ");
    return [
      `${draft.scene}`,
      `${lang === "zh" ? "对象" : "objects"}: ${objects}`,
      `${lang === "zh" ? "构图" : "composition"}: ${draft.composition.subjectCount}/${draft.composition.focusMode}/${draft.composition.framing}/${draft.composition.backgroundDensity}`,
      `${lang === "zh" ? "重点" : "focus"}: ${draft.focus}`,
      ...draft.spatialRelations
    ].filter(Boolean).join("; ");
  }
  return [
    `${lang === "zh" ? "场景" : "scene"}: ${draft.scene}`,
    `${lang === "zh" ? "对象" : "objects"}: ${draft.objects.map((item) => item.name).join(", ")}`,
    `${lang === "zh" ? "分镜" : "shots"}: ${draft.shotCount}`,
    ...draft.shots.map((shot) => `${shot.index}. ${shot.title}`),
    ...draft.continuity
  ].filter(Boolean).join("; ");
}
