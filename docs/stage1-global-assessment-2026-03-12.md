# Stage-1 Global Assessment (2026-03-12)

## Scope
- Workspace: `/Users/dk/scene-pilot`
- Focus: 线下调试、功能完整度、工作流连通、提示词引擎/场景调度落地度、开发运营维护、自动客服能力

## Evidence Snapshot
- Build: `npm run build` -> pass
- Local runtime health: `npm run health:local` -> ComfyUI/Draw Things 均未就绪（当前机器状态）
- Functional capability audit: `npm run robots:functional:audit` -> `8/8 executed`, `8/8 passed`, `blocker failures=0`
- P0 capability suite (8 specs): all passed

## Scorecard (Stage-1)
- 线下调试可用性: **78/100**
- 功能连通性（Quick/Pro/保存/导出）: **87/100**
- 提示词引擎与场景调度集成度: **84/100**
- 质量防线（机器人守卫）: **90/100**
- 开发运营维护体系: **72/100**
- 自动客服/工单闭环: **35/100**
- 综合评分: **79/100**

## What Was Fixed In This Stage
- 补齐 `npm run health:local`，统一本地引擎健康检查入口。
- 修复 Quick 画布就绪测试锚点：恢复 `quick-structure-canvas-ready`。
- 为结果瀑布流补齐媒体锚点：`quick-preview-image` / `quick-preview-video`。
- 机器人断言全面对齐当前产品策略：
- 本地图片生成改为 `ComfyUI` 优先、`Draw Things` 回退。
- Quick -> Pro 改为模式切换，不自动继承 Quick 自由文本。
- 保存/另存/导出断言改为单文件 JSON 与轻提示策略（不再依赖“已下载/已保存”大提示卡）。

## Current Gaps (Not Fully Landed Yet)
- Quick 草稿跨刷新无法完整恢复 blob 媒体结果（仅同会话可完整恢复）。
- Pro 的 hosted/BYO 已有 UI，但 `fal/Runway` provider adapter 尚未 fully landed。
- 自动客服机器人未落地到产品层（目前仅测试机器人和帮助中心）。
- 本地运行环境当前未起 ComfyUI/Draw Things 服务，真实 API 调试需先恢复本地服务。

## Root-Cause Classification
- 输入问题：少量（主要是测试构造输入偏旧）
- 意图归一化问题：中等（Quick -> Pro 继承策略切换后，旧断言仍假设自动承接）
- 提示词引擎问题：中等（架构已分层，但平台执行层尚未 fully landed）
- 底层模型/运行时问题：中等偏高（本地引擎服务未就绪导致健康检查失败）

## Phase-2 / 3 / 4 Plan

## Phase-2 (Prompt + Provider Execution Hardening)
- Goal: 打通 Pro hosted/BYO 到真实 provider adapter（fal/runway）。
- Tasks:
- 完成 `functions/api/generation/*` 与前端 `providerGatewayService` 的双向契约测试。
- 以 `workspace/mediaMode/engineId` 维度输出端到端追踪日志。
- Quick/Pro 各做 3 轮提示词评测（生成 -> 评分 -> 调整 -> 复测）。
- Exit Criteria:
- Pro hosted 与 BYO 至少各 1 条图像、1 条视频真实链路可运行。
- 报告中可定位问题来源：输入/归一化/引擎/模型。

## Phase-3 (Result Asset Persistence + Workflow Closure)
- Goal: 完成 Quick 草稿跨刷新结果资产持久化闭环。
- Tasks:
- 为 blob 媒体建立持久化存储映射（IndexedDB 或文件桥接层）。
- 恢复草稿时重建预览列表、选中态、评分态一致性。
- 增加“草稿恢复回归”机器人守卫。
- Exit Criteria:
- 刷新后恢复率 >= 95%（含媒体可预览）。
- 不出现“草稿有结构但无结果媒体”的误恢复。

## Phase-4 (Ops + Support Automation)
- Goal: 建立运营维护与自动客服最小闭环。
- Tasks:
- 上线客服机器人最小版：问题分类、FAQ 命中、工单入队、升级人工。
- 对接计费异常与导出失败自动诊断模板。
- 增加周报自动产出：失败率、扣点回滚率、导出成功率、帮助中心命中率。
- Exit Criteria:
- 80% 常见问题由机器人首轮分流。
- 高优先级问题 5 分钟内进入可追踪工单。
