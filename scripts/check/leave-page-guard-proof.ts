import assert from "node:assert/strict";
import { shouldBlockPageLeave } from "../../src/services/unsavedChangesGuard";

function main() {
  const allowWhenClean = shouldBlockPageLeave(false);
  assert.equal(allowWhenClean, false);

  const blockWhenDirty = shouldBlockPageLeave(true);
  assert.equal(blockWhenDirty, true);

  console.log("[leave-page-guard-proof] PASS clean=false dirty=true");
}

main();
