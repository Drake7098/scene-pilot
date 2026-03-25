import assert from "node:assert/strict";
import { createChargeRequestTracker } from "../../src/services/chargeRequestTracker";

function main() {
  const tracker = createChargeRequestTracker();

  const req1 = "req_normal_001";
  assert.equal(tracker.begin(req1), true);
  tracker.markReserved(req1, "entry_001");
  tracker.markFinalized(req1);
  const done = tracker.get(req1);
  assert.equal(done?.status, "finalized");
  assert.equal(done?.entryId, "entry_001");

  const duplicated = tracker.begin(req1);
  assert.equal(duplicated, false);

  const req2 = "req_fail_001";
  assert.equal(tracker.begin(req2), true);
  tracker.markFailed(req2, "generation_failed");
  const failed = tracker.get(req2);
  assert.equal(failed?.status, "failed");
  assert.equal(failed?.error, "generation_failed");

  console.log(
    "[credit-consistency-proof] PASS normal=finalized duplicate=blocked failed=failed"
  );
}

main();
