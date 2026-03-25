import assert from "node:assert/strict";
import { runUnsavedChangesGuard } from "../../src/services/unsavedChangesGuard";

async function main() {
  const noUnsaved = await runUnsavedChangesGuard({
    hasUnsavedChanges: false,
    confirmSaveFirst: () => {
      throw new Error("confirmSaveFirst should not be called when there are no unsaved changes");
    },
    runSave: async () => {
      throw new Error("runSave should not be called when there are no unsaved changes");
    },
    confirmDiscard: () => {
      throw new Error("confirmDiscard should not be called when there are no unsaved changes");
    },
  });

  assert.equal(noUnsaved.allowed, true);
  assert.equal(noUnsaved.outcome, "allow_no_unsaved");

  const blocked = await runUnsavedChangesGuard({
    hasUnsavedChanges: true,
    confirmSaveFirst: () => false,
    runSave: async () => true,
    confirmDiscard: () => false,
  });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.outcome, "blocked_by_user");

  console.log("[unsaved-guard-proof] PASS no_unsaved=allow_no_unsaved unsaved=blocked_by_user");
}

void main();
