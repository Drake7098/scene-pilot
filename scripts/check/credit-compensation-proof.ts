import assert from "node:assert/strict";
import { createChargeRequestTracker } from "../../src/services/chargeRequestTracker";

function main() {
  const tracker = createChargeRequestTracker();

  const successReq = "req_success_001";
  assert.equal(tracker.begin(successReq), true);
  tracker.markReserved(successReq, "entry_success_001");
  tracker.markFinalized(successReq);
  const noCompensation = tracker.pickCompensationEntry(successReq);
  assert.equal(noCompensation, null);
  assert.equal(tracker.get(successReq)?.status, "finalized");

  const failedReq = "req_failed_001";
  assert.equal(tracker.begin(failedReq), true);
  tracker.markReserved(failedReq, "entry_failed_001");
  const firstCompensation = tracker.pickCompensationEntry(failedReq);
  assert.equal(firstCompensation, "entry_failed_001");
  assert.equal(tracker.get(failedReq)?.status, "compensating");
  tracker.markRolledBack(failedReq);
  assert.equal(tracker.get(failedReq)?.status, "rolled_back");

  const duplicateCompensation = tracker.pickCompensationEntry(failedReq);
  assert.equal(duplicateCompensation, null);
  assert.equal(tracker.get(failedReq)?.status, "rolled_back");

  console.log("[credit-compensation-proof] PASS success=no_compensation failure=auto_rollback duplicate=no_double_refund");
}

main();
