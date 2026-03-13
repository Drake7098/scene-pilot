export const PROMPT_EXPORT_FREE_DAYS = 7;
export const PROMPT_EXPORT_CREDITS_COST = 2;

export type PromptExportPolicy = {
  trialActive: boolean;
  remainingTrialDays: number;
  freeUntil: string | null;
  creditsCost: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getPromptExportPolicy(createdAt?: string | null, now = new Date()): PromptExportPolicy {
  const createdAtMs = Date.parse(String(createdAt || ""));
  if (!Number.isFinite(createdAtMs)) {
    return {
      trialActive: false,
      remainingTrialDays: 0,
      freeUntil: null,
      creditsCost: PROMPT_EXPORT_CREDITS_COST
    };
  }
  const freeUntilMs = createdAtMs + PROMPT_EXPORT_FREE_DAYS * DAY_MS;
  const remainingMs = freeUntilMs - now.getTime();
  const trialActive = remainingMs > 0;
  const remainingTrialDays = trialActive ? Math.max(1, Math.ceil(remainingMs / DAY_MS)) : 0;
  return {
    trialActive,
    remainingTrialDays,
    freeUntil: new Date(freeUntilMs).toISOString(),
    creditsCost: PROMPT_EXPORT_CREDITS_COST
  };
}
