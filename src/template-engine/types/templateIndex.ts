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
  /** Legacy templates are frozen for compare-only usage. */
  isLegacy?: boolean;
  /** Enabled templates are visible in UI and can be applied. */
  isEnabled?: boolean;
  /** Online templates are allowed for online/release pools. */
  isOnline?: boolean;
  /** Experiment-only templates. */
  isExperiment?: boolean;
  /** Benchmark templates for rebuild phases. */
  isBenchmark?: boolean;
};
