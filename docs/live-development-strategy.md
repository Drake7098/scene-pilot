# Live Development Strategy

Last updated: 2026-03-12

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

## Current Product Structure

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
- `开发看板`（一键打开，内嵌查看 tracker 状态并支持打开 Markdown）

## Naming and UI Rules
- 页面不放解释长句，解释进帮助中心。
- 同一事件只允许一个规范名称。
- 同一事件默认只保留一个主入口。
- 高频操作靠上，低频与破坏性操作靠下。
- 所有长度敏感 UI 尽量固定宽度，不因内容长度而漂移。
- 需要二次选择或文件选择器的动作默认使用省略号。

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

## Known Gaps
- Quick 草稿跨刷新场景仍不能完整恢复 blob 媒体结果（第二阶段：结果资产持久化）。
- Pro 的 `hosted / BYO` 交互已存在，但底层真实 `fal / Runway` provider adapter 尚未 fully landed。
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
- 首次语言默认策略：系统语言为中文（`zh*`）时默认中文，其余语言默认英文；若已有 `scenepilot_lang` 保存值则优先使用保存值。
- 机器人功能矩阵（8项）已恢复为 `Executed 8 / Passed 8 / Blocker failures 0`（2026-03-12）。
- 机器人能力断言已与当前产品规则对齐：
- Quick 本地图片链路：`ComfyUI` 优先，`Draw Things` 回退。
- Quick -> Pro：仅模式切换，不自动继承 Quick 自由文本到 Pro 项目快照。
- 顶部 `...` 菜单已加入 `开发看板` 入口，用于直接查看全局 tracker 状态。
