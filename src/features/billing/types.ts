/**
 * Billing system types - template charges, generation charges, transactions.
 * Backend-ready structure for future API sync.
 */

export type BillingChargeType =
  | "template_apply"
  | "generate_image"
  | "generate_video";

export type BillingTransactionType =
  | "purchase"
  | "grant"
  | "template_apply"
  | "generate_image"
  | "generate_video"
  | "refund";

/** Per-project template charge record. Persists in project.meta.billing. */
export type AppliedTemplateCharge = {
  templateId: string;
  familyId?: string;
  variantId?: string;
  cost: number;
  chargedAt: string;
  chargeType: "template_apply";
};

/** Per-project generation charge record (reserved). */
export type GenerationCharge = {
  sceneId?: string;
  platformId?: string;
  cost: number;
  chargedAt: string;
  chargeType: "generate_image" | "generate_video";
};

/** Project-level billing state. Persists with project. */
export type ProjectBillingMeta = {
  appliedTemplateCharges: AppliedTemplateCharge[];
  generationCharges: GenerationCharge[];
};

/** User billing account (local frontend; backend will own this). */
export type BillingAccount = {
  creditsBalance: number;
  totalCreditsPurchased: number;
  totalCreditsSpent: number;
  totalTemplateCreditsSpent: number;
  totalGenerationCreditsSpent: number;
  lastTransactionAt: string | null;
};

/** Local transaction record for audit trail. */
export type BillingTransaction = {
  id: string;
  type: BillingTransactionType;
  creditsDelta: number;
  usdAmount?: number;
  projectId?: string;
  templateId?: string;
  sceneId?: string;
  platformId?: string;
  createdAt: string;
  note?: string;
};
