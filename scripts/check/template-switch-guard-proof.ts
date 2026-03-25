import assert from "node:assert/strict";
import { runUnsavedChangesGuard } from "../../src/services/unsavedChangesGuard";

async function main() {
  const allowSwitch = await runUnsavedChangesGuard({
    hasUnsavedChanges: false,
    confirmSaveFirst: () => false,
    runSave: async () => false,
    confirmDiscard: () => false,
  });
  assert.equal(allowSwitch.allowed, true);
  assert.equal(allowSwitch.outcome, "allow_no_unsaved");

  const blockSwitch = await runUnsavedChangesGuard({
    hasUnsavedChanges: true,
    confirmSaveFirst: () => false,
    runSave: async () => true,
    confirmDiscard: () => false,
  });
  assert.equal(blockSwitch.allowed, false);
  assert.equal(blockSwitch.outcome, "blocked_by_user");

  console.log(
    "[template-switch-guard-proof] PASS allow_without_unsaved=allow_no_unsaved cancel_with_unsaved=blocked_by_user"
  );
}

void main();
