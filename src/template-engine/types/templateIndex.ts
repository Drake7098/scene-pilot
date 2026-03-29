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
import type {
  BackStructure,
  FrontCategory,
  GenerationSource,
  QualityLevel
} from "./templatePayload";

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
  /** Master/derived/user template system fields */
  masterTemplateId?: string;
  isMasterTemplate?: boolean;
  isDerivedTemplate?: boolean;
  isUserTemplate?: boolean;
  isNewTemplate?: boolean;
  newUntil?: number;
  generationSource?: GenerationSource;
  /** Front-facing task category (user-facing) */
  frontCategory?: FrontCategory;
  /** Back-end structure category (engine-facing) */
  backStructure?: BackStructure;
  /** Auto score and quality level (0-10 mapped to free/standard/advanced/premium) */
  score?: number;
  qualityLevel?: QualityLevel;
};
