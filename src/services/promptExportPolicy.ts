/** Prompt export is free; no credits charged. Kept for compatibility. */
export const PROMPT_EXPORT_FREE_DAYS = 0;
export const PROMPT_EXPORT_CREDITS_COST = 0;

export type PromptExportPolicy = {
  trialActive: boolean;
  remainingTrialDays: number;
  freeUntil: string | null;
  creditsCost: number;
};

/** Prompt export is always free; no trial, no charge. */
export function getPromptExportPolicy(_createdAt?: string | null, _now = new Date()): PromptExportPolicy {
  return {
    trialActive: true,
    remainingTrialDays: 0,
    freeUntil: null,
    creditsCost: 0
  };
}
