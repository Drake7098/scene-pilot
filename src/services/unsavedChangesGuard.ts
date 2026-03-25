export type UnsavedGuardOutcome =
  | "allow_no_unsaved"
  | "allow_after_save"
  | "allow_discard"
  | "blocked_save_failed"
  | "blocked_by_user";

export type UnsavedGuardResult = {
  allowed: boolean;
  outcome: UnsavedGuardOutcome;
};

export type UnsavedGuardInput = {
  hasUnsavedChanges: boolean;
  confirmSaveFirst: () => boolean;
  runSave: () => Promise<boolean>;
  confirmDiscard: () => boolean;
};

export function computeUnsavedChanges(currentSnapshot: string, lastSavedSnapshot: string): boolean {
  return currentSnapshot !== lastSavedSnapshot;
}

export function shouldBlockPageLeave(hasUnsavedChanges: boolean): boolean {
  return hasUnsavedChanges;
}

export async function runUnsavedChangesGuard(input: UnsavedGuardInput): Promise<UnsavedGuardResult> {
  if (!input.hasUnsavedChanges) {
    return { allowed: true, outcome: "allow_no_unsaved" };
  }

  if (input.confirmSaveFirst()) {
    const saved = await input.runSave();
    if (saved) {
      return { allowed: true, outcome: "allow_after_save" };
    }
    return { allowed: false, outcome: "blocked_save_failed" };
  }

  if (input.confirmDiscard()) {
    return { allowed: true, outcome: "allow_discard" };
  }

  return { allowed: false, outcome: "blocked_by_user" };
}
