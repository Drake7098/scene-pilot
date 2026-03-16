# ScenePilotix Stage-1 Runbook (Cloudflare + Supabase)

Last updated: 2026-03-13

## 目标
- 保留现有测试服。
- 新增正式站：`https://www.scenepilotix.com`。
- 登录体系迁移到 Supabase Auth（邮箱 OTP + Google）。
- 主业务库迁移到 Supabase Postgres。
- Paddle 在新域名稳定后再接入。

## 一、GitHub / 分支发布策略

### 分支职责
- `develop`: 测试环境主分支（持续联调）
- `main`: 正式环境主分支（只放已验收版本）

### 发布流程（2026-03-15 起，快捷优先）
1. push **develop** → 自动部署 **develop 服务器**（scenepilotix，域名 scenepilotix.pages.dev）。
2. 确认 develop 服务器无误后，merge 到 main 并 push **main** → 自动部署正式服（scenepilotix1-prod）。允许直接 push，不强制 PR。

### Cloudflare Pages 项目
- `scenepilotix` → Production branch: `develop`（develop 服务器，域名 scenepilotix.pages.dev）
- `scenepilotix1-prod` → Production branch: `main`（正式服）

## 当前发布状态（2026-03-13）

- 代码侧：登录回跳、fail-closed、`/api/auth/password/sign-in`、`AUTH_DEV_CODE_EXPOSE` 默认关闭，已完成。
- develop 服务器：`https://scenepilotix.pages.dev` 冒烟通过（`/api/generation/providers=401`、`/api/billing/me=401`、`/api/paddle/checkout=503`）。
- 预正式服：`https://scenepilotix1-prod.pages.dev` 冒烟通过（同上）。
- 生产域名：`https://www.scenepilotix.com` 已绑定 `scenepilotix1-prod` 并通过最终冒烟（`200/401/503`）。
- 结论：Stage-1 发布链路收口完成（支付仍按 `BILLING_ENABLED=0` 关闭，待 Paddle 正式联调再开启）。

### 并行线程防污染（上线前新增）

- 发布线程在发版前必须执行：
- `npm run release:readiness -- --target test`
- `npm run release:readiness -- --target prod`
- 该检查会读取 `development-tracker.json`，对并行中的非发布 P0/P1 任务给出阻断，防止“别的线程未收口变更”混入上线包。

## 二、域名与 TLS

1. 将 `www.scenepilotix.com` 绑定到 `scenepilotix1-prod`。
2. 将 `scenepilotix.com` 做 301 跳转到 `https://www.scenepilotix.com`。
3. SSL/TLS 模式使用 `Full (strict)`。

## 三、环境变量矩阵（Cloudflare Pages）

见文件：[`docs/supabase-env-matrix.md`](/Users/dk/scene-pilot/docs/supabase-env-matrix.md)
以及：[`docs/cloudflare-pages-release-checklist.md`](/Users/dk/scene-pilot/docs/cloudflare-pages-release-checklist.md)

支付环境保险（必须）：
- 测试服：`BILLING_MODE=sandbox` + `BILLING_LIVE_ALLOWED=0`
- 正式服：`BILLING_MODE=live` + `BILLING_LIVE_ALLOWED=1`
- 任一环境只要命中 `mode=live && live_allowed=0`，服务端会返回 `billing_live_blocked`，禁止 live 扣费。

### 必须满足的硬条件（Fail-Closed）

- `API_AUTH_STRICT=1`
- `CORS_ALLOW_ORIGINS` 不能为 `*`
- 生产环境：
- `VITE_AUTH_MOCK_FALLBACK=0`
- `AUTH_DEV_CODE_EXPOSE=0`
- 建议在 Cloudflare 侧先跑：
- `CF_API_TOKEN=... CF_ACCOUNT_ID=... npm run release:cloudflare:audit`

## 四、数据库初始化（Supabase Postgres）

1. 打开 Supabase SQL Editor。
2. 执行脚本：[`db/supabase/0000_core.sql`](/Users/dk/scene-pilot/db/supabase/0000_core.sql)
3. 再执行脚本：[`db/supabase/0001_public_rpc_bridge.sql`](/Users/dk/scene-pilot/db/supabase/0001_public_rpc_bridge.sql)
4. 确认以下表已创建：
- `users_profile`
- `wallets`
- `products`
- `subscriptions`
- `payments`
- `payment_events`
- `checkout_sessions`
- `credit_ledger`
5. 确认触发器已生效：
- `auth.users` 新增用户后自动创建 `users_profile` + `wallets`
6. 确认 RLS 与策略：
- 用户只能读取自己的账户/钱包/账本/订阅/支付
- `products` 仅暴露 active 产品
7. 确认 RPC bridge 可调用（service role）：
- `public.sp_reserve_credits`
- `public.sp_finalize_reserved_credits`
- `public.sp_rollback_reserved_credits`
- `public.sp_grant_credits`

## 五、登录开发顺序（必须按此顺序）

1. **Auth 接入**
- 前端改为 Supabase Auth（邮箱 OTP + Google OAuth）
- 以 Supabase session 作为唯一登录态来源
- 去掉本地 dev code 与 local challenge fallback

2. **账户读取**
- `getCurrentUser/getCurrentSession` 改为读取 Supabase user + `users_profile/wallets`

3. **权限判断**
- tier/credits 从数据库读取，不再由前端本地状态决定

4. **扣点链路**
- 统一走服务端接口：
- `GET /api/billing/me`
- `GET /api/billing/credits/ledger`
- `POST /api/billing/credits/reserve`
- `POST /api/billing/credits/finalize`
- `POST /api/billing/credits/rollback`
- 接口鉴权统一使用 Supabase access token（Bearer）+ claimed userId 校验。

5. **验收**
- 邮箱登录
- Google 登录
- 登出/会话过期
- 跨域回跳（测试域 + 正式域）
- reserve/finalize/rollback 扣点闭环

## 六、Paddle 延后接入顺序（域名稳定后）

1. 配置 Paddle webhook：
- `https://www.scenepilotix.com/api/paddle/webhook`
2. 启用签名校验与幂等去重（`payment_events.provider_event_id`）。
3. 完成链路：
- checkout -> webhook -> 支付入账 -> credits 发放 / 订阅更新
 - 现状：`/api/paddle/checkout`、`/api/paddle/customer-portal`、`/api/paddle/webhook` 已支持 Supabase 优先执行（D1 回退仅作兼容）。
4. 验收：
- 首购 Pro
- 续费
- 单次 credits 购买
- webhook 重放防重
5. 回放命令（同一 `event_id` 发送两次，第二次应返回 `dedup=true`）：
- `APP_URL=https://scenepilotix.pages.dev PADDLE_WEBHOOK_SECRET=<secret> npm run paddle:webhook:replay`
- 如需指定测试用户与产品：
- `APP_URL=... PADDLE_WEBHOOK_SECRET=... PADDLE_REPLAY_USER_ID=<uuid> PADDLE_REPLAY_PRODUCT_ID=pro_monthly npm run paddle:webhook:replay`

## 七、上线门禁（Go/No-Go）

### Go 条件
- Supabase Auth 邮箱 + Google 均通过
- `users_profile/wallets` 自动创建验证通过
- 关键接口不再依赖本地 mock
- 测试服连续 24h 稳定
- 环境变量检查通过：`npm run check:env:release`

### No-Go 条件
- 任何扣点在前端执行
- webhook 不幂等
- 生产环境仍暴露开发验证码

## 八、无支付版上线（当前建议）

1. 在前端与 Functions 同时关闭支付开关：
- `VITE_BILLING_ENABLED=0`
- `BILLING_ENABLED=0`
2. 执行生产冒烟脚本：
- `APP_URL=https://www.scenepilotix.com npm run smoke:release`
 - 默认按严格模式校验（要求鉴权接口返回 `401/403`）。
 - 若临时要放宽鉴权校验：`SMOKE_EXPECT_STRICT_AUTH=0 APP_URL=... npm run smoke:release`
3. 预期：
- 页面路由 `/, /app, /pricing, /terms, /privacy` 均 `200`
- `POST /api/paddle/checkout` 返回 `503 billing_disabled`
