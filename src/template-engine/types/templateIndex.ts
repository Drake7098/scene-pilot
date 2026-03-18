/**
 * TemplateIndex - lightweight index for list/search/filter.
 */

import type {
  TemplateCategory,
  TemplateMediaType,
  TemplateStoryPlan,
  TemplateRatio,
  TemplateVariant,
  TemplateDomain,
  TemplateIndustry
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
  /** Internal routing domain (engine use) */
  domain: TemplateDomain;
  /** User-facing industry/scene classification */
  industry?: TemplateIndustry;
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
  variant?: TemplateVariant;
};
