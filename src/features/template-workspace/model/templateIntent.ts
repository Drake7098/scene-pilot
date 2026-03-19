import type { TemplateIndex } from "./templateIndex";

export type TemplateIntentId =
  | "sell_product"
  | "people_portrait"
  | "cover_poster"
  | "talking_video"
  | "story_video"
  | "continuity";

export type TemplateIntentMeta = {
  id: TemplateIntentId;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
};

const LAST_TEMPLATE_INTENT_KEY = "sp_template_last_intent_v1";
const PENDING_TEMPLATE_INTENT_KEY = "sp_template_pending_intent_v1";

export const DEFAULT_TEMPLATE_INTENT_ID: TemplateIntentId = "sell_product";

export const TEMPLATE_INTENTS: TemplateIntentMeta[] = [
  {
    id: "sell_product",
    labelZh: "卖货出图",
    labelEn: "Sell Product",
    descriptionZh: "商品主图、卖点图、带货场景",
    descriptionEn: "Product hero, selling points, ad scenes"
  },
  {
    id: "people_portrait",
    labelZh: "人物出图",
    labelEn: "People Portrait",
    descriptionZh: "写真、职业照、人物宣传图",
    descriptionEn: "Portraits, headshots, character visuals"
  },
  {
    id: "cover_poster",
    labelZh: "封面海报",
    labelEn: "Cover & Poster",
    descriptionZh: "小红书、抖音、活动海报、课程封面",
    descriptionEn: "Social covers, posters, promo thumbnails"
  },
  {
    id: "talking_video",
    labelZh: "口播讲解",
    labelEn: "Talking Video",
    descriptionZh: "口播广告、教程、测评、演讲",
    descriptionEn: "Talking ads, tutorials, reviews, presentations"
  },
  {
    id: "story_video",
    labelZh: "剧情短视频",
    labelEn: "Story Video",
    descriptionZh: "开场、冲突、爆点、转折、收尾",
    descriptionEn: "Opening, conflict, climax, reveal, ending"
  },
  {
    id: "continuity",
    labelZh: "连续分镜",
    labelEn: "Continuity",
    descriptionZh: "多镜头连续调度、人物一致性",
    descriptionEn: "Multi-shot continuity and consistency"
  }
];

export function loadLastTemplateIntent(): TemplateIntentId {
  try {
    const raw = localStorage.getItem(LAST_TEMPLATE_INTENT_KEY);
    if (TEMPLATE_INTENTS.some((item) => item.id === raw)) return raw as TemplateIntentId;
  } catch {
    // ignore
  }
  return DEFAULT_TEMPLATE_INTENT_ID;
}

export function saveLastTemplateIntent(intentId: TemplateIntentId | null) {
  try {
    if (intentId) localStorage.setItem(LAST_TEMPLATE_INTENT_KEY, intentId);
    else localStorage.removeItem(LAST_TEMPLATE_INTENT_KEY);
  } catch {
    // ignore
  }
}

export function setPendingTemplateIntent(intentId: TemplateIntentId) {
  try {
    localStorage.setItem(PENDING_TEMPLATE_INTENT_KEY, intentId);
    localStorage.setItem(LAST_TEMPLATE_INTENT_KEY, intentId);
  } catch {
    // ignore
  }
}

export function consumePendingTemplateIntent(): TemplateIntentId | null {
  try {
    const raw = localStorage.getItem(PENDING_TEMPLATE_INTENT_KEY);
    localStorage.removeItem(PENDING_TEMPLATE_INTENT_KEY);
    return TEMPLATE_INTENTS.some((item) => item.id === raw) ? (raw as TemplateIntentId) : null;
  } catch {
    return null;
  }
}

export function pickDefaultTemplateForIntent(
  intentId: TemplateIntentId,
  items: TemplateIndex[]
): string | null {
  return items[0]?.id ?? null;
}
