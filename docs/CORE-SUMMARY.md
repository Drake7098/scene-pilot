# ScenePilotix 核心摘要（备忘录 / 全文档）

> 开发、运营、维护靠这一份可快速定位关键信息。Last updated: 2026-03-13

---

## 一、平台与服务器

| 层级 | 平台 | 说明 |
|------|------|------|
| **前端托管** | Cloudflare Pages | 静态站点 + Functions |
| **认证 + 主库** | Supabase | Auth（邮箱 OTP + Google）+ Postgres |
| **支付** | Paddle | checkout / customer-portal / webhook |
| **本地 DB（开发）** | Cloudflare D1 | `wrangler.toml` 绑定 `scene-pilot-db` |

### 环境 URL（2026-03-15：develop 服务器 = scenepilotix.pages.dev，正式服 = prod）

| 环境 | 项目名 | URL | 分支 |
|------|--------|-----|------|
| develop 服务器 | scenepilotix | https://scenepilotix.pages.dev | develop |
| 正式服 | scenepilotix1-prod | https://scenepilotix1-prod.pages.dev | main |
| 正式域名 | scenepilotix1-prod | https://www.scenepilotix.com | main |

### 关键环境变量（必记）

- **前端**：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_APP_BASE_URL`、`VITE_BILLING_ENABLED`、`VITE_AUTH_MOCK_FALLBACK`、`VITE_PRO_CONSOLE_DEV`（本地开发可选：强制显示 Pro 工作台布局）
- **Functions**：`SUPABASE_SERVICE_ROLE_KEY`、`CORS_ALLOW_ORIGINS`、`API_AUTH_STRICT=1`、`BILLING_ENABLED`、`BILLING_LIVE_ALLOWED`
- **Fail-Closed 要求**：`API_AUTH_STRICT=1`，`CORS_ALLOW_ORIGINS` 不允许 `*`

完整矩阵：`docs/supabase-env-matrix.md`、`docs/cloudflare-pages-release-checklist.md`

---

## 二、数据库

### 本地开发（D1）

```bash
npm run db:init:local      # migrate + seed
npm run db:migrate:local   # 仅迁移
npm run db:seed:local      # 仅种子
npm run db:query:local -- "SELECT ..."
```

迁移脚本：`db/migrations/0000_observability.sql`、`0001_billing_core.sql`、`0002_auth_core.sql`、`0003_legal_consents.sql`

### 生产（Supabase Postgres）

- `db/supabase/0000_core.sql`：核心表（users_profile、wallets、products、subscriptions、payments、credit_ledger 等）
- `db/supabase/0001_public_rpc_bridge.sql`：RPC 桥（reserve/finalize/rollback credits）
- `db/supabase/0002_legal_consents.sql`：法律同意留痕

执行：Supabase SQL Editor 按顺序执行。

---

## 三、Git 规则

### 分支策略（快捷优先，允许直接 push）

| 分支 | 用途 | 自动部署 |
|------|------|----------|
| develop | develop 服务器、先更新 | scenepilotix |
| main | 正式服、确认 develop 后再更新 | scenepilotix1-prod |

### 发布流程

```
push develop → develop 服务器更新 → 确认后 push main → 正式服更新
```

- 允许直接 push develop / main，不强制 PR；推荐先 push develop，再 push main。
- 可选：PR 闸门 `.github/workflows/pr-gate.yml`；`npm run release:readiness -- --target test|prod`。

### 并行开发防污染

- 发版前执行 `release:readiness`，会检查 tracker 中并行任务
- 建议发布线程用独立 worktree：`git worktree add -b codex/release-snapshot-YYYYMMDD /tmp/sp-release main`

---

## 四、软件架构

### 技术栈

- **前端**：React 19 + Vite 7 + TypeScript
- **API**：Cloudflare Pages Functions（`functions/api/`）
- **认证**：Supabase Auth（主） + D1 session（回退）

### 目录结构（关键）

```
scene-pilot/
├── src/                    # 前端源码
│   ├── App.tsx             # ⚠️ 主应用、高风险
│   ├── components/         # UI 组件
│   │   ├── Sidebar.tsx         # ⚠️ Pro 左侧栏
│   │   ├── ExportPanel.tsx     # ⚠️ 导出
│   │   └── TemplateWorkspace/  # 模板工作台
│   ├── data/               # 模板库、工作台数据
│   │   ├── templateLibrary400.ts
│   │   └── templateWorkspaceData.ts
│   ├── rules/              # 规则引擎
│   │   └── applyTemplate.ts
│   ├── services/           # authService、creditService、billingService
│   ├── utils/              # promptPipeline、promptEngines
│   └── model.ts            # 数据模型
├── functions/api/          # Cloudflare Functions
│   ├── _shared/            # auth、credits-service、billing-db
│   ├── auth/               # email、password、google
│   ├── billing/            # credits、me、ledger
│   ├── paddle/             # checkout、webhook、customer-portal
│   └── legal/              # consent
├── db/                     # 数据库
│   ├── migrations/         # D1 迁移
│   └── supabase/           # Postgres 初始化
├── tests/                  # 测试
│   ├── robots/             # Playwright 端到端
│   ├── local-ab/           # 本地 A/B（ComfyUI、Draw Things）
│   ├── ab/                 # 提示词 A/B
│   └── intent-benchmark/   # 意图评测
├── scripts/                # 运维脚本
├── docs/                   # 文档
└── .codex/skills/          # Agent skills
```

### 核心 API 端点

| 端点 | 用途 |
|------|------|
| `GET /api/billing/me` | 账户 credits |
| `GET /api/billing/credits/ledger` | 账本 |
| `POST /api/billing/credits/reserve` | 预扣 credits |
| `POST /api/billing/credits/finalize` | 确认扣点 |
| `POST /api/billing/credits/rollback` | 回滚扣点 |
| `POST /api/auth/email/send-code` | 发送 OTP |
| `POST /api/auth/email/verify-code` | 验证 OTP |
| `POST /api/auth/password/sign-in` | 密码登录 |
| `POST /api/paddle/checkout` | Paddle 结账 |
| `POST /api/paddle/webhook` | Paddle webhook |
| `POST /api/legal/consent` | 法律同意留痕 |

---

## 五、核心功能

### Quick 工作台

- 快速定方向、生成提示词、回看结果
- 左侧：新建 / 保存 / 打开 / Pro 工作台
- 主区：结果流 + 提示词黑区 + 两步输入
- 本地生成：ComfyUI 优先，Draw Things 回退

### Pro 工作台

- 精确结构编辑、画布、资产
- 左侧：项目、模板、场景、对象、策略、镜头
- 中央：画布 + 结果切页
- 右侧：属性 + 生成

### 模板工作台

- 400 模板（40 家族 × 10 变体）
- 应用模式：layout_only / layout_plus_style / full_workflow
- Credits 扣点、最近 20、收藏
- 入口：Pro 左侧模板区、模板工作台全屏

### 提示词引擎

- Quick 图片：IM v5；Quick 视频：VI v5
- Pro 图片：IM V5P；Pro 视频：VI V5P
- 引擎锁：`docs/engine-library-lock.json`，改引擎后需 `npm run engine:lock:update`

---

## 六、关键命令速查

### 开发

```bash
npm run dev                 # 本地开发
npm run build               # 生产构建
npm run engine:lock:check   # 引擎锁检查（改引擎前必跑）
npm run engine:lock:update  # 引擎锁更新
npm run health:local        # 本地健康检查
```

### 数据库

```bash
npm run db:init:local       # 初始化本地 D1
npm run db:migrate:local
npm run db:seed:local
```

### 任务追踪

```bash
npm run tracker:summary     # 摘要
npm run tracker:list        # 列表
npm run tracker:add         # 添加任务
npm run tracker:move        # 状态流转
```

### 测试

```bash
npm run robots:test         # Playwright 端到端
npm run robots:run          # 机器人执行
npm run local-ab:comfy      # ComfyUI 本地 A/B
npm run local-ab:draw       # Draw Things 本地 A/B
npm run intent-benchmark:eval:baseline  # 意图评测
```

### 发布与运维

```bash
npm run release:readiness -- --target test   # 测试服上线检查
npm run release:readiness -- --target prod   # 正式服上线检查
npm run check:env:release                    # 环境变量检查
npm run smoke:release                        # 冒烟
npm run release:cloudflare:audit             # CF 审计（需 token）
npm run release:cloudflare:sync-secrets      # 同步 secrets
npm run release:secrets:setup                # 密钥写入 Keychain
npm run release:safe                         # 一键安全发布
npm run paddle:webhook:replay                # webhook 重放校验
```

---

## 七、必读文档索引

| 文档 | 用途 |
|------|------|
| `AGENTS.md` | 全局规则、引擎、Quick/Pro 边界 |
| `docs/live-development-strategy.md` | 策略单一事实源、流程、缺口 |
| `docs/supabase-cloudflare-stage1-runbook.md` | Stage-1 部署 runbook |
| `docs/supabase-env-matrix.md` | 环境变量矩阵 |
| `docs/cloudflare-pages-release-checklist.md` | CF 上线清单 |
| `docs/development-tracker.json` | 任务追踪 |
| `docs/session-primer.md` | 新会话引导、近期完成 |
| `docs/pro-workspace-modules.md` | Pro 工作台模块说明 |

---

## 八、Skills 按任务类型

| 任务 | Skill |
|------|-------|
| 产品 UI、菜单、保存导出 | `product-ui-guardrails` |
| 提示词引擎、Quick/Pro 差异 | `prompt-engine-architecture` |
| 登录、会员、扣点、发布 | `release-billing-sync` |
| 跨线程产品/流程变更 | `live-dev-sync` |
| 新会话加载上下文 | `session-continuity` |
| API 安全 | `security-api-hardening` |
| 支付链安全 | `security-payment-check` |
| 发布闸门 | `security-release-gate` |

---

## 九、高风险文件

- `src/App.tsx`
- `src/components/ExportPanel.tsx`
- `src/components/ProjectControlBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/billing/BillingOverlay.tsx`
- `src/utils/promptPipeline.ts`
- `src/utils/promptEngines/builtin.ts`

---

## 十、当前已知缺口（2026-03-13）

- Paddle 测试服未联调完成，`BILLING_ENABLED=0`
- Google 登录测试服未配置
- fal / Runway provider adapter 未 fully landed
- 历史 Quick 相关文档/脚本残留仍需持续清理，避免旧入口回流
- 站点 HTML 仍带 `access-control-allow-origin: *`，与 API CORS 口径不一致
