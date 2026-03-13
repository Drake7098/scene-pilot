# Supabase + Cloudflare 环境变量矩阵

Last updated: 2026-03-13

## 测试环境（scene-pilot-test / develop）

### 前端（公开变量）
- `VITE_SUPABASE_URL=https://sampclwsqputkeswqbbu.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<SUPABASE_PUBLISHABLE_KEY>`
- `VITE_APP_BASE_URL=https://scene-pilot-12y.pages.dev`
- `VITE_BILLING_ENABLED=0`（Paddle 未联调完成前建议关闭）
- `VITE_BILLING_MODE=sandbox`
- `VITE_BILLING_LIVE_ALLOWED=0`
- `VITE_BILLING_ALLOW_MOCK_FALLBACK=0`（测试服禁止自动 mock 支付回退）
- `VITE_AUTH_MOCK_FALLBACK=1`（仅本地开发/机器人兼容；测试服建议关闭）

### Functions（服务端变量）
- `SUPABASE_URL=https://sampclwsqputkeswqbbu.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>`
- `CORS_ALLOW_ORIGINS=https://scene-pilot-12y.pages.dev,https://www.scenepilotix.com,http://localhost:5173`
- `API_AUTH_STRICT=1`
- `BILLING_ENABLED=0`（Paddle 未联调完成前建议关闭）
- `BILLING_MODE=sandbox`
- `BILLING_LIVE_ALLOWED=0`
- `AUTH_DEV_CODE_EXPOSE=0`（默认关闭，防止验证码明文外泄）
- 说明：`API_AUTH_STRICT=1` 时，前端请求需携带 Supabase access token（Bearer），Functions 会校验 token 与 `userId` 一致性。

## 正式环境（scene-pilot-prod / main）

### 前端（公开变量）
- `VITE_SUPABASE_URL=https://sampclwsqputkeswqbbu.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<SUPABASE_PUBLISHABLE_KEY>`
- `VITE_APP_BASE_URL=https://www.scenepilotix.com`
- `VITE_BILLING_ENABLED=0`（Paddle 未联调完成前建议关闭）
- `VITE_BILLING_MODE=live`
- `VITE_BILLING_LIVE_ALLOWED=1`
- `VITE_BILLING_ALLOW_MOCK_FALLBACK=0`
- `VITE_AUTH_MOCK_FALLBACK=0`（生产必须 fail-closed）

### Functions（服务端变量）
- `SUPABASE_URL=https://sampclwsqputkeswqbbu.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>`
- `CORS_ALLOW_ORIGINS=https://www.scenepilotix.com,https://scene-pilot-12y.pages.dev`
- `API_AUTH_STRICT=1`
- `BILLING_ENABLED=0`（Paddle 未联调完成前建议关闭）
- `BILLING_MODE=live`
- `BILLING_LIVE_ALLOWED=1`
- `AUTH_DEV_CODE_EXPOSE=0`（生产必须关闭）
- 说明：`API_AUTH_STRICT=1` 时，前端请求需携带 Supabase access token（Bearer），Functions 会校验 token 与 `userId` 一致性。

## Paddle（域名稳定后再配置）

### 公共
- `PADDLE_API_KEY=<PADDLE_API_KEY>`
- `PADDLE_WEBHOOK_SECRET=<PADDLE_WEBHOOK_SECRET>`
- `PADDLE_PRICE_PRO_MONTHLY=<price_id>`
- `PADDLE_PRICE_CREDIT_100=<price_id>`
- `PADDLE_PRICE_CREDIT_500=<price_id>`
- `PADDLE_PRICE_CREDIT_2000=<price_id>`

### 前端
- `VITE_PADDLE_ENV=production`
- `VITE_PADDLE_CLIENT_TOKEN=<PADDLE_CLIENT_TOKEN>`
- `VITE_PADDLE_PRICE_PRO_MONTHLY=<price_id>`
- `VITE_PADDLE_PRICE_CREDIT_100=<price_id>`
- `VITE_PADDLE_PRICE_CREDIT_500=<price_id>`
- `VITE_PADDLE_PRICE_CREDIT_2000=<price_id>`

## Google 登录（Supabase OAuth）

- 在 Supabase Dashboard 配置 Google Provider：
- Client ID
- Client Secret
- 回调地址按 Supabase 提供值填入 Google Console。
- Cloudflare 侧通常不需要额外 Google 私密变量（由 Supabase 托管 OAuth）。

## 安全规则

- `SUPABASE_SERVICE_ROLE_KEY` 只允许在 Functions 使用，绝不进入前端变量。
- 前端仅使用 `VITE_SUPABASE_ANON_KEY`。
- 避免在日志中打印 token / secret / db 连接串。
- 强制启用“支付环境保险开关”：只有 `BILLING_MODE=live` 且 `BILLING_LIVE_ALLOWED=1` 时才允许 live 支付链路；其余环境一律拦截 `billing_live_blocked`。
