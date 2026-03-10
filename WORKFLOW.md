# Scene Pilot Workflow

## 1. Setup

```bash
npm ci
```

## 2. Daily Development Loop

1. Start app locally.
```bash
npm run dev
```
2. Implement feature in `src/` (main entry: `src/App.tsx`, UI in `src/components/`, logic in `src/utils/`).
3. Run static checks.
```bash
npm run lint
npm run build
```

## 3. Test Workflow

### 3.1 Core robot regression (Playwright)

```bash
npm run robots:run
```

Optional modes:
```bash
npm run robots:test
npm run robots:test:ui
npm run robots:test:headed
```

### 3.2 Prompt quality checks

```bash
npm run robots:prompt:check
npm run robots:prompt:ab:check
```

### 3.3 AB evaluation (remote providers)

```bash
npm run ab:all
npm run ab:report
```

### 3.4 Local AB evaluation (ComfyUI / local judge)

```bash
npm run local-ab:baseline
npm run local-ab:judge
npm run local-ab:comfy
npm run local-ab:summary
```

## 4. CI / Automation Workflow

- GitHub Action: `.github/workflows/robots-daily.yml`
- Trigger:
  - Daily cron: `01:00 UTC`
  - Manual: `workflow_dispatch`
- Job pipeline:
  1. `npm ci`
  2. `npx playwright install --with-deps chromium`
  3. `npm run robots:run`
  4. Upload `tests/robots/artifacts`

## 5. Release Workflow

1. Confirm `npm run lint` and `npm run build` pass.
2. Run `npm run robots:run` and review artifacts under `tests/robots/artifacts`.
3. If prompt-related changes are included, run `npm run robots:prompt:ab:check`.
4. Update version in `package.json`.
5. Tag and release.

## 6. Fast File Map

- App shell: `src/App.tsx`
- Scene/sidebar editor: `src/components/Sidebar.tsx`
- Stage canvas: `src/components/Stage.tsx`
- Export flow: `src/components/ExportPanel.tsx`
- Prompt pipeline: `src/utils/promptPipeline.ts`
- Conflict/adaptive rules: `src/utils/conflictRules.ts`, `src/utils/adaptivePatch.ts`
- E2E robots: `tests/robots/scenarios/*.spec.ts`
- AB eval: `tests/ab/`
- Local AB eval: `tests/local-ab/`
