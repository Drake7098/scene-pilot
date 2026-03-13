# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Observability (Anonymous Telemetry + Feedback)

This project supports anonymous telemetry and explicit user feedback via Cloudflare Pages Functions.

- Frontend sender: `src/utils/analytics.ts`
- Ingestion APIs: `functions/api/collect.ts`, `functions/api/feedback.ts`
- Stats API (protected): `functions/api/stats.ts`
- Maintenance prune API (protected): `functions/api/maintenance/prune.ts`
- Schema: `db/migrations/0000_observability.sql`

Required environment variables:

- `CORS_ALLOW_ORIGINS`: comma-separated origin allowlist for API access.
  - Example: `https://app.example.com,https://staging.example.com`
- `STATS_API_TOKEN`: required token for `/api/stats` access.
  - Send via `Authorization: Bearer <token>` or `x-stats-token: <token>`.
- `MAINTENANCE_API_TOKEN` (optional): token for `/api/maintenance/prune`.
  - If omitted, prune endpoint falls back to `STATS_API_TOKEN`.
  - Send via `Authorization: Bearer <token>` or `x-maintenance-token: <token>`.

Optional frontend endpoint override:

- `VITE_TELEMETRY_BASE_URL` (build-time), or
- local override through `setTelemetryApiBase(...)`.

Notes:

- Feedback submission is independent of telemetry opt-in (user-initiated send is always attempted).
- Event payloads store `props_json` with size limiting to reduce ingestion failures.
- Crash/error events are aggregated into `error_fingerprints` for de-duplicated monitoring.
- For existing databases created before `props_json/device_id`, the collect endpoint auto-heals schema on write.
- Use `/api/maintenance/prune` for retention cleanup (supports `dry_run=1`).
