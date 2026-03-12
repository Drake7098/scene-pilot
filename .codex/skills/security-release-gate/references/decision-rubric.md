# Decision Rubric

Decision levels:

1. `GO`
   - no required failures
   - no warnings
2. `GO_WITH_RISKS`
   - no required failures
   - warnings exist and have owner + due date
3. `HOLD`
   - any required failure exists
   - threat model missing or invalid

Required blockers include:

- missing auth/schema/cors required checks
- payment webhook signature/idempotency failure
- missing mandatory threat model sections
