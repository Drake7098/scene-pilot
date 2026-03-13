# Cloudflare Pages 上线配置清单（并行开发版）

Last updated: 2026-03-13

## 目标

- 在并行线程持续开发时，保证测试服与正式服配置可控，不被未收口改动污染上线结果。

## A. 先做隔离检查（本地）

1. `npm run release:readiness -- --target test`
2. `npm run release:readiness -- --target prod`

若出现以下任一项，禁止继续上线：

- `dirty_worktree:*`
- `parallel_active_tasks:*`
- `branch_mismatch:*`

## B. Cloudflare Pages 测试服（develop）

项目：`scene-pilot-test`

### Build 环境变量（前端）

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BASE_URL=https://scene-pilot-12y.pages.dev`
- `VITE_BILLING_ENABLED=0`
- `VITE_AUTH_MOCK_FALLBACK=0`（测试服建议关闭，避免误判）

### Functions 环境变量（服务端）

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOW_ORIGINS=https://scene-pilot-12y.pages.dev,https://www.scenepilotix.com,http://localhost:5173`
- `API_AUTH_STRICT=1`
- `BILLING_ENABLED=0`
- `AUTH_DEV_CODE_EXPOSE=0`

审计命令（需 API token）：

- `CF_API_TOKEN=... CF_ACCOUNT_ID=... npm run release:cloudflare:audit`

## C. Cloudflare Pages 正式服（main）

项目：`scene-pilot-prod`

### Build 环境变量（前端）

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BASE_URL=https://www.scenepilotix.com`
- `VITE_BILLING_ENABLED=0`
- `VITE_AUTH_MOCK_FALLBACK=0`（生产必须）

### Functions 环境变量（服务端）

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOW_ORIGINS=https://www.scenepilotix.com,https://scene-pilot-12y.pages.dev`
- `API_AUTH_STRICT=1`
- `BILLING_ENABLED=0`
- `AUTH_DEV_CODE_EXPOSE=0`（生产必须）

## D. 域名与 DNS

1. `www.scenepilotix.com` 绑定到 `scene-pilot-prod`
2. 根域 `scenepilotix.com` 301 到 `https://www.scenepilotix.com`
3. 等待 DNS 生效后再做 smoke

## E. 发布验收（每次都跑）

1. `CF_API_TOKEN=... CF_ACCOUNT_ID=... npm run release:cloudflare:audit`
2. `npm run check:env:release`
3. `APP_URL=https://scene-pilot-12y.pages.dev npm run smoke:release`
4. `APP_URL=https://www.scenepilotix.com npm run smoke:release`

也可一键编排：

- 测试服：`npm run release:orchestrate -- --target test --app-url https://scene-pilot-12y.pages.dev`
- 正式服：`npm run release:orchestrate -- --target prod --app-url https://www.scenepilotix.com`

通过标准：

- `GET /api/generation/providers` 为 `401/403`
- `GET /api/billing/me` 为 `401/403`
- `POST /api/paddle/checkout` 在 billing off 时为 `503`
