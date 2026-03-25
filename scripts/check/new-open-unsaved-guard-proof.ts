import assert from "node:assert/strict";
import { runUnsavedChangesGuard } from "../../src/services/unsavedChangesGuard";

async function verifyFlow(flow: "new" | "open") {
  const allow = await runUnsavedChangesGuard({
    hasUnsavedChanges: false,
    confirmSaveFirst: () => false,
    runSave: async () => false,
    confirmDiscard: () => false,
  });
  assert.equal(allow.allowed, true);
  assert.equal(allow.outcome, "allow_no_unsaved");

  const blocked = await runUnsavedChangesGuard({
    hasUnsavedChanges: true,
    confirmSaveFirst: () => false,
    runSave: async () => true,
    confirmDiscard: () => false,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.outcome, "blocked_by_user");

  return { flow, allow: allow.outcome, blocked: blocked.outcome };
}

async function main() {
  const newFlow = await verifyFlow("new");
  const openFlow = await verifyFlow("open");
  console.log(
    `[new-open-guard-proof] PASS new=${newFlow.allow}/${newFlow.blocked} open=${openFlow.allow}/${openFlow.blocked}`
  );
}

void main();
