# Development Tracker（全局开发看板）

这是 ScenePilot 的全局开发追踪入口，目标是解决：
- 待开发项一句话快速录入
- 全局可视化（完成/未完成/激活/阻塞/测试状态）
- API 接入计划不丢失（如 fal / Runway）
- 跨线程统一进度，不靠聊天记忆

## 单一事实源
- 数据文件：`/Users/dk/scene-pilot/docs/development-tracker.json`
- 命令脚本：`/Users/dk/scene-pilot/scripts/dev-tracker.mjs`

## 状态模型
- 任务状态：`backlog | active | blocked | testing | done | archived`
- 测试状态：`none | planned | running | passed | failed`
- 优先级：`p0 | p1 | p2 | p3`
- 类型：`feature | api | infra | bug | test | ux | prompt | ops | docs`
- 工作台范围：`quick | pro | global`

## 常用命令
```bash
npm run tracker:summary
npm run tracker:list
npm run tracker:next
npm run tracker:show -- TK-20260312-001

# 一句话新增
npm run tracker:add -- "接入 fal 图片生成 API" --type api --priority p0 --workspace global --tags fal,image,provider

# 状态流转
npm run tracker:move -- TK-20260312-001 active
npm run tracker:test -- TK-20260312-001 running
npm run tracker:note -- TK-20260312-001 "完成 provider auth，待回归测试"

# 触发规则：完成时提醒，测试失败提醒
npm run tracker:notify -- TK-20260312-001 --status done,blocked --test failed

# 定时提醒：到点触发
npm run tracker:remind -- add TK-20260312-001 --at "2026-03-13T10:00:00+08:00" --msg "检查 fal 接入联调"

# 拉取提醒（会把到点提醒写入未读告警）
npm run tracker:check
```

## 执行约定（建议）
- 每个新需求先 `tracker:add`，再开发。
- 每次切任务先 `tracker:move` 到 `active/testing/blocked`。
- 每次测完更新 `tracker:test`。
- 交付完成后 `tracker:move ... done` 并补一条 `tracker:note`。
- 每天开工先看 `tracker:next` 和 `tracker:summary`。
- 每天收工前执行一次 `tracker:check`，清掉到点提醒并看未读告警。

## 提醒与触发
- 定时提醒：写入任务级 `reminders`，到点后通过 `tracker:check` 触发未读告警。
- 状态触发：任务状态变到指定值时自动写入告警（例如 `done`、`blocked`）。
- 测试触发：测试状态变到指定值时自动写入告警（例如 `failed`）。
- 告警保存在 `development-tracker.json > alerts`，支持 `tracker:check -- --ack all` 一键标记已读。

## API 计划管理
对 API 接入统一按 `type=api` + `tags` 管理，例如：
- `tags: fal,image,provider`
- `tags: runway,video,provider`

这样你可以随时筛选：
```bash
npm run tracker:list -- --type api
npm run tracker:list -- --q runway
```
