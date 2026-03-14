/**
 * TemplateIndex - lightweight index for list/search/filter/recent/favorites.
 * Used for first-screen load without full payload.
 */

import type {
  TemplateCategory,
  TemplateMediaType,
  TemplateStoryPlan,
  TemplateRatio,
  TemplateVariant,
  TemplateDomain
} from "./templateTypes";

export type TemplateIndex = {
  id: string;
  familyId: string;
  familyNameEn: string;
  familyNameZh: string;
  variantId: string;
  nameZh: string;
  nameEn: string;
  category: TemplateCategory;
  /** base | webdrama_continuity | anime_continuity */
  domain: TemplateDomain;
  descriptionZh?: string;
  descriptionEn?: string;
  tags: string[];
  mediaType: TemplateMediaType;
  storyPlan: TemplateStoryPlan;
  ratio: TemplateRatio;
  isFree: boolean;
  cost: number;
  featured: boolean;
  preview?: string;
  /** Base template variant (for base domain) */
  variant?: TemplateVariant;
};
