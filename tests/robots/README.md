# Robot Testing v1 (0304)

This folder contains a minimal robot testing scaffold for Phase 5.

## Scope (v1)
- 4 active robots: `novice_user`, `power_creator`, `regression_daily`, `chaos_breaker`
- 3 planned robots: `cross_platform_publish`, `quality_scoring`, `judge`
- Unified artifacts: trace, screenshot, console log, metadata

## Commands
- `npm run robots:run`: run tests and update run-state + summary
- `npm run robots:test`: run Playwright tests directly
- `npm run robots:test:ui`: Playwright live UI mode
- `npm run robots:dashboard`: open local robot dashboard server

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
