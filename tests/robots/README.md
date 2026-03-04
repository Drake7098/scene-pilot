# Robot Testing v1 (0304)

This folder contains a minimal robot testing scaffold for Phase 5.

## Scope (v1)
- 6 active robots: `novice_user`, `power_creator`, `regression_daily`, `chaos_breaker`, `export_platform_robot`, `v2_compiler_guard`
- 2 planned robots: `quality_scoring`, `judge`
- Unified artifacts: trace, screenshot, console log, metadata

## Commands
- `npm run robots:run`: run tests and update run-state + summary
- `npm run robots:test`: run Playwright tests directly
- `npm run robots:test:ui`: Playwright live UI mode
- `npm run robots:dashboard`: open local robot dashboard server
- `npm run robots:prompt:ab:clean`: generate/evaluate 100 clean prompt sims
- `npm run robots:prompt:ab:conflict`: generate/evaluate 100 conflict-injected sims
- `npm run robots:prompt:ab:check`: run both clean + conflict A/B checks

## Prompt Eval Key Metrics
- `correctionRate`: semantic conflict correction rate (`1 - actionConflictCases/total`)
- `structuralConsistencyRate`: non-conflicting structure rate (`1 - conflictPairCases/total`)
- `requiredPassRate`: required-fragment pass rate (`1 - missingRequiredCases/total`)
- `forbiddenCleanRate`: forbidden-fragment clean rate (`1 - forbiddenHitCases/total`)

## Daily Automation
- GitHub Actions workflow: `.github/workflows/robots-daily.yml`
- Trigger modes:
  - Daily schedule (UTC 01:00)
  - Manual run (`workflow_dispatch`)
- Each run uploads `tests/robots/artifacts` for report review.

## Dashboard
1. Run tests: `npm run robots:run`
2. Start dashboard: `npm run robots:dashboard`
3. Open: `http://127.0.0.1:4188`

The dashboard reads:
- `tests/robots/artifacts/run-state.json`
- `tests/robots/artifacts/summary.json`
- `tests/robots/artifacts/results.json`
- `tests/robots/artifacts/html-report/index.html`

## Environment
- `APP_URL`: target app url (default: `http://127.0.0.1:5173`)
- `ROBOT_E2E_LIVE=1`: enables live flow steps in scenario templates
- `ROBOT_DASHBOARD_PORT`: dashboard port (default: `4188`)
