# ScenePilot 工作台系统测试报告（2026-03-11）

## 范围
- 快捷工作台（Quick Workspace）
  - 两段输入
  - 结构画布
  - 本地生成
  - 回退与任务包降级
  - 进入 Pro 承接
- Pro 工作台
  - 图片/视频分流
  - 保存 / 另存
  - 导出
  - 项目菜单连续流
- 提示词引擎
  - `IM v5`
  - `VI V5`
  - `IM V5P`
  - `VI V5P`
- 不纳入本次阻断范围
  - 上线/云端发布
  - 外部商业平台真实出片质量

## 执行方式
- 构建验证：`npm run build`
- Quick/Pro 提示词轮次评测：
  - `npm run pro-sim:round1:audit`
  - `npm run quick-sim:round1:audit`
- 机器人套件：
  - `APP_URL=http://127.0.0.1:4173 npx playwright test -c tests/robots/playwright.config.ts`
- 功能能力审计：
  - `node tests/robots/scripts/audit-functional-coverage.mjs`

注：
- 本次先修复了 [`tests/robots/playwright.config.ts`](/Users/dk/scene-pilot/tests/robots/playwright.config.ts)，使传入 `APP_URL` 时不再重复拉起内置 webServer，避免测试被 5173 端口权限误杀。
- Playwright 已在提权环境下重跑，下面结论基于真实浏览器执行，不是沙箱假失败。

## 总结
- 构建：通过
- 机器人套件：`48` 条中 `37` 通过，`3` 失败，`8` 跳过
- 核心能力矩阵：`8` 项中 `5` 通过，`3` 失败
- Prompt 轮次评测：
  - Quick：平均分 `90.6`
  - Pro：平均分 `98.6`

## 关键结论
1. Pro 工作台整体稳定性明显高于 Quick，尤其是提示词结构稳定性已经接近可放大量测试的水平。
2. Quick 的本地生成链路存在真实阻断，不是测试脚本问题：
   - Draw Things 直连未触发
   - Draw Things 失败回退 ComfyUI 未触发
   - 导致 Quick 本地图片生成主链路目前不可靠
3. Quick -> Pro 承接链路本身是通的，但承接后的“生成预览再进入保存/导出”路径存在断点，表现为预览图未生成，后续保存导出流程被卡住。
4. Quick 提示词引擎仍有明显结构问题，尤其是：
   - 全量超预算
   - 比例与结构信息冲突
   - 主体语义漂移
5. 界面层面当前没有大面积布局崩坏：
   - Quick 中英文布局守卫通过
   - 项目菜单连续流通过
   - 说明 UI 框架基本稳，但状态机和提示词拼装仍有实质问题

## 功能结果

### 已通过
- Quick 双离线降级任务包
  - 场景：[`quick-workspace-handoff-pack.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/quick-workspace-handoff-pack.spec.ts)
  - 结论：两套本地引擎都不可用时，页面不崩，任务包降级链路可用
- Quick -> Pro 承接
  - 场景：[`quick-workspace-to-pro.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/quick-workspace-to-pro.spec.ts)
  - 结论：结构承接、进入 Pro、项目菜单可见都正常
- Quick 布局守卫
  - 场景：[`quick-workspace-layout-guard.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/quick-workspace-layout-guard.spec.ts)
  - 结论：中英文布局、控件宽度、两段输入排列无明显回归
- Pro 图片/视频媒体契约
  - 场景：[`pro-media-contract.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/pro-media-contract.spec.ts)
  - 结论：图片/视频分流仍然有效
- 项目菜单连续流
  - 场景：[`project-menu-flow.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/project-menu-flow.spec.ts)
  - 结论：项目菜单入口、保存/导出主流程连续性目前可用

### 真实失败
1. Quick 本地 Draw Things 生成未触发
   - 场景：[`quick-workspace-local-drawthings.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/quick-workspace-local-drawthings.spec.ts)
   - 现象：点击 `quick-canvas-generate` 后，`drawTxt2ImgCalls` 一直为 `0`
   - 结论：Quick 本地图片生成按钮到 Draw Things provider 的派发链断了，或已被新的状态机绕开

2. Quick Draw Things 失败后未回退 ComfyUI
   - 场景：[`quick-workspace-local-fallback-comfy.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/quick-workspace-local-fallback-comfy.spec.ts)
   - 现象：点击 `quick-canvas-generate` 后，`comfyPromptCalls` 一直为 `0`
   - 结论：本地 fallback 路径没有真正落到 ComfyUI，说明“探测失败 -> 回退执行”这段逻辑现在不可靠

3. Quick 承接到 Pro 后，预览图未生成，导致保存/导出前置状态不足
   - 场景：[`pro-save-export-local.spec.ts`](/Users/dk/scene-pilot/tests/robots/scenarios/pro-save-export-local.spec.ts)
   - 现象：等待 `quick-preview-image` 超时，元素不存在
   - 结论：Quick 的本地预览生成没有形成稳定结果，进一步影响 Pro 保存/导出联测

## 提示词引擎结果

### Pro 工作台
- 报告：
  - [Pro summary.json](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/pro/summary.json)
  - [Pro summary.md](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/pro/summary.md)
- 结果：
  - 平均分 `98.6`
  - `IM V5P`: `100`
  - `VI V5P`: `97.45`
  - 高频问题：无
- 判断：
  - Pro 的四段结构已基本稳定
  - 可以进入更大样本量和结果侧验证

### Quick 工作台
- 报告：
  - [Quick summary.json](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/quick/summary.json)
  - [Quick summary.md](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/quick/summary.md)
- 结果：
  - 平均分 `90.6`
  - `IM v5`: `92`
  - `VI V5`: `89.45`
  - `120/120` 全部命中 `engine_length_over_budget`
- 判断：
  - Quick 引擎还没有收敛
  - 主要问题不是“媒体串味”，而是“太长、太杂、预算失控”

## 已观测到的提示词问题

### P1：Quick prompt 出现比例冲突
- 证据：失败场景快照中，用户输入包含 `1:1` 或 `9:16`，但结构化 prompt 同时保留了 `16:9`
- 例子：
  - `portrait indoors, centered subject, clean background, 1:1 ... 16:9 ...`
  - `poster composition, bigger subject, simplified background, 9:16 ... 16:9 ...`
- 影响：
  - 比例约束自相矛盾
  - 本地模型和导出平台都更容易漂移

### P1：Quick prompt 存在主体语义漂移
- 证据：Draw Things 失败快照中的结构化 prompt 出现了 `subject: door`
- 输入原文是：
  - `portrait indoors, centered subject, clean background, 1:1`
- 影响：
  - 主体标签推断不稳定
  - “indoor/room/door”这类环境词可能污染了主体抽取

### P1：Quick prompt 仍然偏冗长
- 证据：Quick 轮次 `120/120` 命中超预算
- 影响：
  - 本地模型尤其容易失真
  - 也会直接削弱 Quick 工作台“快”的价值

### P2：Quick image prompt 结构虽不再串入明显摄像语句，但执行层仍然被细碎标签拖厚
- 表现：
  - 同时叠加 brief、二段修正、比例、structure、scene type、subject、composition、relation、background、style
- 影响：
  - 信息量大于 Quick 场景实际需要
  - 用户看起来是“被强化”，模型收到的是“被压重”

## 界面与流畅度观察

### 正向
- Quick 中英文布局稳定，无明显重叠或截断
- 项目菜单交互是连续的
- Structured Prompt 面板可编辑，主画布与右侧结构编辑区没有明显错位

### 问题
- Quick 结构画布阶段的 CTA 语义有些混乱
  - 同时存在 `Generate Preview` 和 `Local Output`
  - 当前失败集中在 `Generate Preview` 没有真正把本地 provider 调起来
- 出错时停留态不够清楚
  - 当前失败快照里能看到用户仍停在画布编辑态，没有明确“本地生成未触发”的系统反馈
- Quick 的 prompt 编辑框内容可见性强，但也暴露了结构冲突
  - 用户能直接看到比例冲突和主体漂移

## 中断 / 回退链路

### 已成立
- 双离线 -> 任务包降级：成立
- Quick -> Pro 承接：成立

### 未成立
- Draw Things 探测成功 -> 本地生成：未成立
- Draw Things 探测失败 -> ComfyUI 回退：未成立
- Quick 预览生成成功 -> Pro 保存/另存/导出联动：未成立

## 跳过项
以下 `8` 条场景本次未执行，不计为失败，但属于覆盖缺口：
- `chaos_breaker_invalid_and_extreme_inputs`
- `export_platform_switch_and_policy_hint`
- `help_center_guard_top_menu_and_modal_controls`
- `modal_interaction_guard_save_model_and_export_overlay`
- `novice_user_create_first_storyboard`
- `power_creator_high_frequency_edits`
- `regression_daily_fixed_script`
- `v2_compiler_guard_scene_tier_and_mode`

## 优先级建议

### P0
- 修 Quick 本地生成派发
  - 目标：`quick-canvas-generate` 必须真正触发 Draw Things / ComfyUI 分支
- 修 Quick fallback
  - 目标：Draw Things 探测失败后，必须实际进入 ComfyUI 生成路径
- 修 Quick 比例冲突
  - 目标：最终 prompt 只保留一个有效 ratio

### P1
- 修 Quick 主体抽取漂移
  - 重点排查环境词污染主体词的问题
- 压缩 `IM v5 / VI V5`
  - 目标：至少先把 `engine_length_over_budget` 降到非全量命中

### P2
- 清理 Quick 画布阶段的 CTA 语义
  - “Generate Preview” 和 “Local Output” 的职责边界需要更明确
- 补出错反馈
  - 至少让本地 provider 未触发、fallback 未触发在 UI 上可见

## 本次可直接引用的结果文件
- [机器人结果 JSON](/Users/dk/scene-pilot/tests/robots/artifacts/results.json)
- [功能能力审计 JSON](/Users/dk/scene-pilot/tests/robots/artifacts/functional-audit.json)
- [功能能力审计 Markdown](/Users/dk/scene-pilot/tests/robots/artifacts/functional-audit.md)
- [Quick Prompt Audit](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/quick/summary.md)
- [Pro Prompt Audit](/Users/dk/scene-pilot/artifacts/pro-workbench/round1-audit/pro/summary.md)
