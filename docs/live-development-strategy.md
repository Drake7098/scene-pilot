# Live Development Strategy

Last updated: 2026-03-13

## Purpose
- 这是跨线程共享的单一事实源。
- 所有涉及产品流程、交互、提示词引擎、Quick/Pro 边界、生成链路的开发，都应先读这里。
- 当某次开发改变了主流程、主命名、主入口、平台执行策略、保存/导出规则或未完成项时，必须更新这里。

## Global Progress Tracking
- 全局任务追踪统一使用：`/Users/dk/scene-pilot/docs/development-tracker.json`
- 命令入口：`npm run tracker:*`（`summary/list/next/add/move/test/note/show/notify/remind/check`）
- 要求：
- 新需求先录入 tracker（至少 title/type/priority/workspace）
- 状态流转必须更新（`backlog/active/blocked/testing/done`）
- 测试状态必须更新（`none/planned/running/passed/failed`）
- API 接入项必须用 `type=api` 并带平台标签（例如 `fal`、`runway`）
- 里程碑任务必须配置触发规则（至少 `done`，可追加 `test failed`）
- 跨天任务建议配置至少一个定时提醒（`tracker:remind` + `tracker:check`）
- 本文档仍是“策略单一事实源”；tracker 是“执行进度单一事实源”。

## Product Positioning
- `Quick Workspace`：快速定方向、快速生成提示词、回看结果、继续编辑、继续生成。
- `Pro Workspace`：精确结构编辑与结果资产管理。
- `ScenePilotix`：面向 AI 视频与图像生成的结构化编辑器。
- 首次进入应用时展示一次“Quick / Pro 起始模式”选择弹层；用户选择后记忆，不重复询问。

## Current Product Structure

### Public Routes
- 根路径 `/` 为公开 Landing 页面（产品介绍、方案入口、合规链接）。
- 工作台主界面改为 `/app`（保留原有 Quick/Pro 能力，不改核心编辑逻辑）。
- 新增正式认证入口别名：`/login`、`/signin`、`/register`、`/signup`（统一重定向到 `/app?signin=1`）。
- `/app` 已启用强制登录闸门：未登录直访会跳 `/signin?redirect=/app`，仅登录态或 `signin=1` 认证入口可进入应用壳。
- 公开路由保留：`/pricing`、`/terms`、`/privacy`、`/product-intro`（另含 `/billing-terms`、`/refund-policy`）。
- 新增用户管理页：`/account`（别名 `/user-management`），用于账户与订阅全览管理。

### Quick Workspace
- 左侧只保留：`新建 / 保存 / 打开 / Pro 工作台`
- 中间主区固定为：
- 左：结果瀑布流
- 右：提示词黑区
- 底部：两步输入胶囊
- `打开` 采用弹层草稿列表，不在左侧常驻展示草稿。
- 只有用户手动点击 `保存`，才会生成草稿。
- 第二步提交绝不能自动在左侧生成文件条目。

### Pro Workspace
- 左：结构编辑
- 中：画布 + 结果切页
- 右：对象属性
- 下：提示词/导出检视区
- Pro 与 Quick 默认严格分层，不自动继承 Quick 的自由文本与结构状态。

### Top Menu（Quick / Pro 共用）
- 顶部 `...` 菜单保留统一入口：
- `帮助中心`
- `发布看板` 不再内嵌在应用内；改为独立本地页面：`/release-board.html`
- 右上角新增圆形用户头像为账号主入口（未登录显示随机色头像），点击直接进入 `登录/注册` 或 `账户中心`；`...` 菜单中的账号项保留为镜像入口（兼容旧测试与历史路径）。

## Naming and UI Rules
- 页面不放解释长句，解释进帮助中心。
- 同一事件只允许一个规范名称。
- 同一事件默认只保留一个主入口。
- 高频操作靠上，低频与破坏性操作靠下。
- 所有长度敏感 UI 尽量固定宽度，不因内容长度而漂移。
- 需要二次选择或文件选择器的动作默认使用省略号。

## Account Auth
- 账号中心未登录态当前采用邮箱+密码登录主按钮，并在下方保留 `OR + Google 登录`。
- 布局采用 SaaS 登录页风格：欢迎标题、邮箱输入、密码输入、登录按钮、分隔线、Google 登录、底部隐私/服务协议小字链接。
- 登录同意勾选位置规范：勾选行放在隐私/服务协议链接上方，并与协议入口形成同一分组，用户必须先主动勾选才能继续 Google 或密码登录。
- Google 登录必须经过后端校验后再落本地会话（不在前端直接信任 credential）。
- 登录支持 `redirect` 回跳参数（例如 `/app?signin=1&redirect=/account`），用于登录成功后回到目标业务页。
- 认证默认策略：生产 fail-closed（禁用本地 mock fallback）；仅本地开发可通过 `VITE_AUTH_MOCK_FALLBACK=1` 使用回退链路。

## Official Contact Mailboxes
- 官方邮箱已登记：
- `support@scenepilotix.com`
- `contact@scenepilotix.com`
- `noreply@scenepilotix.com`
- `admin@scenepilotix.com`
- 对外展示策略：
- 用户可见：`support`（客服）、`contact`（商务）
- 系统说明可见：`noreply`（仅系统通知，不作为客服入口）
- 内部保留：`admin`（不在产品页面对外展示）

## Saving / Opening / Export Rules

### Quick Workspace
- 保存的是“草稿”，不是“项目”。
- Quick 草稿当前保存：
- 两段输入
- 两层下拉选择
- 比例 / 秒数
- 当前结构结果
- 当前提示词文本
- Quick 草稿当前已进入第一阶段结果恢复：
- 保存时会记录可持久结果 URL（非 blob）
- 同会话可通过内存缓存恢复完整结果列表
- 跨刷新仍可能丢失 blob 媒体（第二阶段待完成）

### Project Library
- 项目库只保存“项目”，不保存单分镜。
- 项目库主存储格式：单文件 JSON。

### Export
- `复制提示词`：纯文本，不带参考图文件名。
- 提示词导出计费规则：注册后 7 天内免费；第 8 天起每次导出消耗 2 credits（Quick 复制/下载、Pro 复制/Prompt TXT 导出统一口径）。
- `导出项目（含参考图）`：跨平台交付包。
- 不再把单分镜伪装成项目。

## Scene Strategy
- 统一层名：`场景调度`
- 当前包含：
- 经典模式
- 导演级风格包
- 镜头语言
- 布光
- 场景调度已与提示词生成打通。
- 当前布光为两层：
- hard defaults：`time / keyDir / mood`
- soft language：lighting profile prompt lines

## Prompt Engine Status
- Prompt engine library 已建立。
- 当前重点平台方向：
- `fal`：对象、层次、构图、材质、布光
- `Runway`：镜头、动作、连续性、时间推进
- `sceneStrategy` 已进入平台适配层。
- `creativeContext` 已进入平台适配层。
- 引擎锁文件已启用：`/Users/dk/scene-pilot/docs/engine-library-lock.json`
- 测试前必须通过：`npm run engine:lock:check`
- 任何引擎改动后必须执行：`npm run engine:lock:update`，并同步更新本文件

## Cross-Thread Sync Gate
- 目标：杜绝 A 线程改完、B 线程仍按旧引擎/旧测试方法继续开发。
- 强制顺序：
1. 读本文件（本文件是唯一事实源）
2. `npm run engine:lock:check`
3. 若改过引擎：`npm run engine:lock:update`
4. 同步更新本文件中 `Prompt Engine Status / Current Temporary Generation Strategy / Known Gaps`
5. 再运行 `local-ab / robots / benchmark`
- 未通过引擎锁检查时，禁止继续测试与评估结论输出。
- 发布前新增并行污染闸门：`npm run release:readiness -- --target test|prod`。
- 该闸门默认拦截：分支不匹配、dirty worktree、tracker 中非发布 P0/P1 仍在进行。
- 当并行线程持续改动时，发布线程推荐使用独立 worktree：`git worktree add -b codex/release-snapshot-YYYYMMDD /tmp/scene-pilot-release main`。

## Current Temporary Generation Strategy
- 当前本地测试生成链：优先 `ComfyUI`
- 图片：`ComfyUI -> Draw Things fallback`
- 视频锚图：`ComfyUI` 优先
- 会员升级页新增“本地测试生成（跳过会员）”入口，仅用于本地调试链路。
- 该入口支持手动选择 `ComfyUI` 或 `Draw Things` 并做严格单引擎执行（不自动 fallback），用于确认指定本地 API 是否畅通。
- 常规 Quick 生成链仍保持 `ComfyUI -> Draw Things fallback`，与严格单引擎测试入口分离。
- 这是临时测试策略，未来会切回正式 provider adapter。
- 当本地生成未产生可用媒体结果时，Quick 生成/Refine 的 credits 预留会自动回滚，不计费。
- 本地运行健康检查统一命令：`npm run health:local`

## Infra Migration (Stage-1 Active)
- 目标架构切换为：Cloudflare Pages（前端）+ Supabase Auth/Postgres（登录与主库）+ Paddle（支付）。
- 发布拓扑切换为双分支双环境：
- `develop` -> 测试服
- `main` -> 正式服（`www.scenepilotix.com`）
- 当前 Cloudflare Pages 项目：
- `scene-pilot-test` -> `https://scene-pilot-test.pages.dev`
- `scene-pilot-prod` -> `https://scene-pilot-prod.pages.dev`
- 合并策略统一为三级流转：
- `local -> develop(测试服) -> main(正式服)`
- `develop`、`main` 默认只允许 PR 合并，不允许直接 push。
- PR 合并闸门见：`/Users/dk/scene-pilot/.github/workflows/pr-gate.yml`
- 支付环境保险已启用：
- 前端：`VITE_BILLING_MODE` + `VITE_BILLING_LIVE_ALLOWED` + `VITE_BILLING_ALLOW_MOCK_FALLBACK`
- 服务端：`BILLING_MODE` + `BILLING_LIVE_ALLOWED`
- 命中 `live + not allowed` 时，`checkout/customer-portal/webhook` 统一返回 `billing_live_blocked`。
- Stage-1 交付文档：
- `/Users/dk/scene-pilot/docs/supabase-cloudflare-stage1-runbook.md`
- `/Users/dk/scene-pilot/docs/supabase-env-matrix.md`
- `/Users/dk/scene-pilot/docs/cloudflare-pages-release-checklist.md`
- Stage-1 环境同步脚本：
- `npm run release:cloudflare:sync-secrets -- --target all`
- Stage-1 数据库初始化脚本：
- `/Users/dk/scene-pilot/db/supabase/0000_core.sql`
- `/Users/dk/scene-pilot/db/supabase/0001_public_rpc_bridge.sql`
- Functions 鉴权已进入 Supabase 双栈：
- `requireApiAuth` 支持 Supabase access token（Bearer）校验，并校验 `claimedUserId` 一致性。
- 扣点接口新增并统一到服务端：
- `GET /api/billing/me`
- `GET /api/billing/credits/ledger`
- `POST /api/billing/credits/reserve`
- `POST /api/billing/credits/finalize`
- `POST /api/billing/credits/rollback`
- 前端 `creditService/providerGatewayService/billingService` 已接入会话鉴权 header 与服务端链路（保留本地回退仅用于离线调试）。

## Known Gaps
- 2026-03-13 收口完成：`scene-pilot-test/pages.dev` 与 `scene-pilot-prod/pages.dev` 的 smoke 已通过，严格鉴权与 billing-off 行为正确（`401/401/503`）。
- 2026-03-13 收口完成：`SUPABASE_SERVICE_ROLE_KEY` 已注入 test/prod；正式域名 `www.scenepilotix.com` 已绑定并通过最终 smoke（`200/401/503`）。
- Quick 草稿跨刷新场景仍不能完整恢复 blob 媒体结果（第二阶段：结果资产持久化）。
- Pro 的 `hosted / BYO` 交互已存在，但底层真实 `fal / Runway` provider adapter 尚未 fully landed。
- Paddle checkout / customer-portal / webhook 已支持 Supabase 优先、D1 回退；下一步需要在测试服完成真实 Paddle 回调联调与事件重放验证。
- 已提供 webhook 重放校验脚本：`npm run paddle:webhook:replay`（同 event_id 第二次应 dedup）。
- Google 登录当前为内部对接阶段：需要在部署环境配置 `VITE_GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_ID`（或 `GOOGLE_CLIENT_IDS`）后才可正式启用。
- `src/components/ResultConsole.tsx` 仍是高风险文件，Quick UI 很容易被局部改动带回旧布局。
- 自动化客服/工单机器人尚未产品化落地（当前仅有测试机器人 + 帮助中心）。

## High-Risk Files
- `/Users/dk/scene-pilot/src/components/ResultConsole.tsx`
- `/Users/dk/scene-pilot/src/App.tsx`
- `/Users/dk/scene-pilot/src/components/ExportPanel.tsx`
- `/Users/dk/scene-pilot/src/components/ProjectControlBar.tsx`
- `/Users/dk/scene-pilot/src/components/Sidebar.tsx`
- `/Users/dk/scene-pilot/src/utils/promptPipeline.ts`
- `/Users/dk/scene-pilot/src/utils/promptEngines/builtin.ts`

## Update Protocol
- 涉及以下变化时，必须同步更新本文件：
- 主流程变化
- 命名变化
- 保存/导出规则变化
- Quick/Pro 边界变化
- 提示词引擎策略变化
- 平台执行策略变化
- 新发现的主缺口
- 引擎锁 hash 变化（`docs/engine-library-lock.json` 变更）

## Recent Decisions
- 已新增独立用户管理页 `/account`，采用行业标准分区：Profile / Security / Subscription & Billing / Credits / API / Account Actions。
- 账号弹层 `overview` 中新增“用户管理页面”入口，用于从高频弹层进入完整管理页。
- 新增首次进入模式引导：首开弹层提供 `快捷工作台 / Pro 工作台` 两个入口，含一行短说明；用户选择或跳过后记忆，不再重复弹出。
- Quick 与 Pro 不再互相继承内容。
- Quick 左侧不再常驻“我的/喜欢/下载/删除”。
- Quick 左侧当前仅保留：`新建 / 保存 / 打开 / Pro 工作台`
- Quick 提示词区固定在中间主区右上。
- Quick 提示词外层框已删除，仅保留黑色编辑区。
- 项目库只保存项目，主格式为单文件 JSON。
- 当前本地生成测试优先 `ComfyUI`。
- Quick 草稿恢复已进入第一阶段：支持结果列表恢复（可持久 URL + 同会话完整缓存）。
- Quick 生成在“仅任务包/无可用媒体”情况下不再扣 credits（自动回滚预留）。
- 会员升级页支持本地测试生成直连入口，可跳过会员并按所选本地引擎执行。
- 提示词导出采用统一计费策略：注册 7 天免费，之后每次导出 2 credits；不足时统一进入点数页。
- 首次语言默认策略：系统语言为中文（`zh*`）时默认中文，其余语言默认英文；若已有 `scenepilot_lang` 保存值则优先使用保存值。
- 机器人功能矩阵（8项）已恢复为 `Executed 8 / Passed 8 / Blocker failures 0`（2026-03-12）。
- 机器人能力断言已与当前产品规则对齐：
- Quick 本地图片链路：`ComfyUI` 优先，`Draw Things` 回退。
- Quick -> Pro：仅模式切换，不自动继承 Quick 自由文本到 Pro 项目快照。
- 应用内已移除 `开发看板` 入口，发布清单改为独立本地页面 `/release-board.html`（用户清单在上，发布清单在下，勾选后变灰并本地持久化）。
- 账号中心 Auth 区新增 Google 登录入口，后端新增 `/api/auth/google` 进行 Google token 校验。
- 账号中心未登录态采用 SaaS 登录布局（邮箱+密码主入口 + Google 入口 + 协议链接），账户 tabs 在未登录态隐藏。
- `/account` 未登录时的登录入口已切到带回跳参数：`/signin?redirect=/account`（底层跳转 `/app?signin=1`）；登录成功后自动返回 `/account`。
- 用户管理页已与 `BILLING_ENABLED` 对齐：支付关闭时禁用购买/升级/账单入口并给出短提示。
- 新增测试站定价页入口：`/pricing` 与 `/pricing-test`，用于支付平台提审（不改变 Quick/Pro 主流程）。
- Supabase Auth/Postgres 正在迁移中；当前主链路仍有部分 D1/local mock 兼容逻辑未移除。
- 支付合规文档入口统一为：`/terms`、`/privacy`、`/billing-terms`、`/refund-policy`，并在定价页、账号中心、支付弹层同步展示 Paddle 结账说明与官方联系邮箱分工。
- 新增法律同意留痕链路：注册/登录勾选（Terms + Privacy）与付费勾选（Billing + Refund）会写入 `/api/legal/consent`，并落库到 `legal_consents`（D1/Supabase）；前端离线失败会本地排队并在下次登录后自动补交。
- 新增 Landing 首屏并将工作台主入口切换为 `/app`；Landing 以 Quick/Pro 选择作为主决策入口，Pricing 为次级信息入口。
- Landing 首屏入口已收敛为单一决策组：`进入快捷工作台` / `进入 Pro 工作台`（镜像主入口），`Pricing` 保留为次级信息入口，不再与工作台入口并列重复主动作命名。
- Landing 的 Quick/Pro 主按钮改为“先登录再进入工作台”：点击后跳 `/app?signin=1` 并自动打开账号登录弹层。
- 账号中心 Auth 勾选位置已更新：注册/登录勾选固定放在协议链接前；Google 与密码登录均在函数层强制校验勾选状态。
- 付费同意勾选升级为四份协议联合确认：`Billing + Refund + Terms + Privacy`；未勾选不得进入支付下一步，并同步写入 consent 记录。
- 账号体系新增服务端邮箱验证码全链路：`/api/auth/email/send-code`、`/api/auth/email/verify-code`、`/api/auth/me`、`/api/auth/logout`。
- 已补齐密码登录链路：`POST /api/auth/password/sign-in`（无 Supabase 时支持邮箱+密码登录/注册并发 session cookie）。
- 本地 DB 迁移新增 `0002_auth_core.sql`（`auth_identities / auth_password_credentials / auth_email_otps / auth_sessions`），`db:migrate:local` 已纳入该 migration。
- 安全加固已新增统一限流层（auth/generation/checkout/legal/collect/feedback），并增加 Paddle webhook 时间窗校验（默认 5 分钟）与基础安全响应头（`public/_headers`）。
- 前端 `authService` 已改为“后端优先、mock 回退”模式；本地已实测 `send-code -> verify-code -> me -> logout -> me(null)`。
- 前端 `authService` 新增 Supabase 优先认证：当 `VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY` 存在时，邮箱 OTP / 会话读取 / Google OAuth 优先走 Supabase，旧 API 与本地挑战码仅作后备链路。
- Functions `requireApiAuth` 与前端请求头已完成 Supabase 会话鉴权联通；扣点主链路切到服务端 API，前端本地扣点仅作为失败回退。
- Paddle 服务端链路已进入 Supabase 优先：`checkout/customer-portal/webhook` 可直接读写 Supabase（仍保留 D1 回退兼容）。
- 已新增安全回归用例：`security-hardening.spec.ts` 覆盖 webhook 幂等防重（同 event_id 第二次 `dedup=true`）。
- 已新增无支付版上线开关：前端 `VITE_BILLING_ENABLED` + Functions `BILLING_ENABLED`，关闭后充值/升级入口禁用，Paddle 接口返回 `billing_disabled`。
- 已新增基础生产冒烟脚本：`npm run smoke:release`（路由可达 + 鉴权接口状态 + 支付接口开关状态）。
- 已新增环境变量检查脚本：`npm run check:env:release`（上线前必跑）。
- `check:env:release` 已加硬校验：`API_AUTH_STRICT` 必须为 `1`，`CORS_ALLOW_ORIGINS` 不允许 `*`。
- 已新增 Cloudflare Pages 审计脚本：`npm run release:cloudflare:audit`（需 `CF_API_TOKEN + CF_ACCOUNT_ID`）。
- 已新增发布编排脚本：`npm run release:orchestrate -- --target test|prod --app-url <url>`（串联 readiness/env/smoke）。
