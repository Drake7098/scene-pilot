import type { Lang } from "../i18n";
import type { IntentPlan } from "../types/intentPlan";
import type { StructureDraft } from "../types/structureDraft";
import { canvasDraftToIntentPlan } from "./canvasDraftToIntentPlan";
import { structureDraftToCanvas } from "./structureDraftToCanvas";

export function structureDraftToIntentPlan(draft: StructureDraft, sourceBrief: string, lang: Lang): IntentPlan {
  const intent = canvasDraftToIntentPlan(structureDraftToCanvas(draft, lang), lang);
  return {
    ...intent,
    sourceBrief
  };
}
