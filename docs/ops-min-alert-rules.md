# Minimal Production Monitoring + Alert Rules

Last updated: 2026-03-22

## Unified Monitoring Entry
- API summary endpoint: `/api/ops/summary`
- Purpose: one place to view minimum required production signals before paid launch.

## Minimum Signals Covered
- Frontend errors: from telemetry `event=error` in `events` table.
- API / key service failures: `ops_signals.signal_type=api_failure`.
- Payment / webhook failures: `ops_signals.signal_type=payment_webhook_failure`.
- Release/readiness health visibility: `ops_signals.signal_type=release_health` and readiness command output (`npm run release:readiness`).

## Manual Intervention Rules
- `frontend_error_spike` (warn, manual): frontend errors >= 5 within summary window.
- `api_failure_spike` (critical, manual): API failures >= 3 within summary window.
- `webhook_failure_detected` (critical, manual): any webhook failure detected within summary window.

## Usage
1. Query `/api/ops/summary` during test/prod checks.
2. If any `alerts[].manualIntervention=true`, stop paid-release progression and investigate.
3. Run `npm run release:readiness -- --target test|prod` and keep output as release evidence.
