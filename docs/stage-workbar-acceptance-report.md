# Stage Work Bar｜整体验收报告

验收日期：2026-03-14

---

## [场景 A｜Work Bar 基础显示与移动]

**是否通过**：部分通过

**已通过项**：
- A1 单对象选中显示：`isPro && sel` 时 Work Bar 出现，未选中时隐藏
- A2 可移动：`onBarPointerDown` + `onPositionDrag` 实现拖动，clamp(0.05, 0.95) 限制在 Stage 范围内
- A4 缩放/切场景：Work Bar 与 world 分离，位置为 Stage 容器百分比，缩放不影响位置；切换对象后重新渲染
- A5 Tooltip：`title={allowed ? btn.title : reason(btn.id) || btn.title}`，禁用时显示 reason

**未通过项**：
- A3 靠边自动避让：当前仅 clamp 到 5%～95%，无“靠边自动避让”或“安全可见区”逻辑，极端缩放下可能被裁

**修正建议**：
- 可选：在 position 接近边缘时自动向内偏移，或在 transform 时做额外 clamp，确保不贴边

---

## [场景 B｜按钮能力边界]

**是否通过**：是

**已通过项**：
- B1 首轮按钮：Select、Move、Center、Reset、Copy T0→T1、Lock/Unlock、Assign Slot、Mark Anchor 均已实现
- B2 高风险按钮：无自由旋转、warp/skew、布尔、path motion、group、自由 scene 批量同步、直接改 prompt 等
- B3 图片模式：`copyT0ToT1` 由 `mediaMode === "video" && canEdit` 控制，图片模式禁用
- B4 视频模式：Copy T0→T1 可用，关键帧操作通过 `stageCopyT0ToT1` 受控
- B5 Continuity 差异：`markAnchor` 仅在 `isContinuity` 时 allowed，base 模板隐藏

**未通过项**：无

**修正建议**：无

---

## [场景 C｜Stage Guard 与对象权限控制]

**是否通过**：部分通过

**已通过项**：
- C1 锁定对象：`parseLayoutLocked` + `onPointerDownLayer` 检查 `state.isLocked`，锁定对象无法启动拖拽
- C2 Reset Transform：`stageResetTransform` 将 kf 恢复为 DEFAULT_KF，行为可预测
- C4 Guard 统一：Work Bar 动作均经 `stageActionGuard`，再调用 `stageCenterObject` 等 action
- C5 对象状态分类：`getStageObjectState` 提供 `template-derived`、`slot-bound`、`anchor-bound`、`inherited`、`user-added`、`locked`、`protected-layout`

**未通过项**：
- ~~C3 Move Guard：拖拽仅检查 `isLocked`，未检查 `isProtectedLayout`~~ → 已修复：`onPointerDownLayer` / `onPointerDownHandle` 增加 `state.isProtectedLayout` 检查
- C2 Reset 与模板默认值：`stageResetTransform` 使用硬编码 DEFAULT_KF(50,50,18,18,0)，未使用模板默认值

**修正建议**：
- ~~在 `onPointerDownLayer` 和 `onPointerDownHandle` 中增加 `if (state.isProtectedLayout) return`~~ 已实施
- 若设计需要，可扩展 `stageResetTransform` 从 `currentTemplate` 或 scene 默认值读取默认 kf

---

## [场景 D｜与 Template Slots 联动]

**是否通过**：是

**已通过项**：
- D1 Slot-bound 可视：`StageObjectBadges` 显示 `boundSlotId`，`getStageObjectState` 正确识别 slot 绑定
- D2 Assign Slot：Work Bar 中 `assignSlot` 点击后 return（reroute），由 Template Slots 负责实际绑定，设计上符合 reroute
- D3 Slots 改值→Stage：Template Slots 通过 `syncSlotToProject` 改 layer.look，Stage 从 project 渲染，同步正常
- D4 Stage 快动作→Slots：move/center/reset 仅改 layer.kf，不动 layerId，slot 映射保持
- D5 非模板对象：无 currentTemplate 时 `assignSlot` 不显示，符合预期

**未通过项**：无

**修正建议**：
- Assign Slot 点击可考虑 focus/scroll 到 Template Slots 区域，改善 reroute 体验

---

## [场景 E｜与 Continuity 联动]

**是否通过**：是

**已通过项**：
- E1 Anchor 可视：`StageObjectBadges` 显示 `hasAnchor`，`getLayerAnchorId` 解析 `@continuityId`
- E2 Mark Anchor：`stageMarkAnchor` / `stageClearAnchor` 修改 layer.notes，Continuity 相关逻辑可读取
- E3 Anchor move 限制：当前 anchor-bound 与普通对象权限相同；guard 对 move 返回 allow-with-normalize，首轮可接受
- E4 切 scene：Stage 由 scene prop 驱动，workBarPos 为 Stage 级状态，切换 scene 后选中和 Work Bar 随之更新
- E5 T0/T1 与 continuity：`stageCopyT0ToT1` 只改 layer kf，不改 notes/continuity，不破坏 continuity

**未通过项**：无

**修正建议**：无

---

## [场景 F｜与 Platform Mode / Export 联动]

**是否通过**：部分通过

**已通过项**：
- F2 Stage→Prompt：`onUpdateScene` → `updateScene` → `updateProject`，project 更新后 ExportPanel/prompt 读取同一 project，同步正常
- F4 禁止绕开平台策略：Stage 不直接改 platform/export，仅改 scene/layer

**未通过项**：
- F1 Platform Mode 对 Stage 约束：Stage 与 stage-editor 未引用 `platformMode`、`structureIntensity`，强结构模式对 move/resize 的约束未实现
- F3 Platform 变化→Stage：平台切换时 Stage guard 无响应

**修正建议**：
- 将 `structureIntensity` 传入 capability resolver，在 strong 模式下收紧 center/reset/move 的 allowed 或增加 guard 条件

---

## [场景 G｜空项目 / 非模板项目 / 用户新增对象降级]

**是否通过**：是

**已通过项**：
- G1 空项目：无 layer 时 `sel` 为 null，Work Bar 不渲染；有 layer 时基础功能可用
- G2 非模板项目：`hasTemplate` 为 false 时 `assignSlot` 不显示，`markAnchor` 不显示，其余按钮正常
- G3 用户新增对象：`getStageObjectState` 在无 currentTemplate 时标记为 `user-added`，Work Bar 行为与 template-derived 一致
- G4 非法状态容错：选中切换、删除对象时 `sel` 变化，Work Bar 隐藏或切换对象，无 ghost selection

**未通过项**：无

**修正建议**：无

---

## [跨模块联动]

**是否通过**：是

**已通过项**：
- Stage 选中→PropsPanel：`onSelectLayer` 更新 `selectedLayerId`，PropsPanel 接收同一 `selectedLayerId` 并聚焦对应对象
- Current Template 变更：替换模板后 project 更新，Stage 重新渲染，Work Bar 使用新 project
- Continuity 切换：切换 scene 后 `scene` prop 更新，Stage/Work Bar 使用新 scene
- 刷新/重载：project 含 meta（currentTemplate、proExportMode），loadProject 经 sanitizeProject，状态可恢复

**未通过项**：无

**修正建议**：无

---

## [代码结构验收]

**是否通过**：是

**已通过项**：
- Work Bar 模块化：`StageWorkBar` 独立组件，`stage-editor` 提供 `stageCapabilityResolver`、`stageActionGuard`、actions
- Guard 统一：`stageActionGuard` 统一处理所有 action，Work Bar 在 `handleAction` 中先 guard 再执行
- Stage Action 受控：`stageCenterObject`、`stageResetTransform`、`stageCopyT0ToT1`、`stageToggleLock`、`stageMarkAnchor` 均为纯函数，不直接 setState
- 对象状态 selector：`getStageObjectState` 统一提供 labels、isLocked、continuityId、isProtectedLayout
- 结构化主链：Stage 动作仅改 project.scenes[].layers[]，prompt 由编译层从 project 生成，无旁路状态

**未通过项**：无

**修正建议**：无

---

## [整体结论]

**Stage Work Bar 是否已经成为「结构安全、联动一致的对象级快速编辑入口」**：**是（存在少量改进点）**

整体上：
- 仅开放结构安全动作，无高风险自由设计工具
- 有统一 Guard 层，Work Bar 动作均经 guard
- 与 Template Slots、Continuity、PropsPanel、Export 联动正确
- 空项目、非模板项目、用户新增对象均可降级
- 锁定对象无法拖拽

主要缺口：
1. 拖拽未检查 `isProtectedLayout`
2. Platform Mode / structure intensity 未影响 Stage 约束
3. Reset 使用硬编码默认值，未使用模板默认
4. Assign Slot 点击为 no-op，可增加 reroute 到 Template Slots

---

## [当前仍缺的关键能力]

1. **Platform Mode 对 Stage 的约束**：`structureIntensity` 未传入 Stage，强结构模式对 move/resize 的约束未实现。
2. **Reset 使用模板默认值**：`stageResetTransform` 使用固定 DEFAULT_KF，设计上期望「回到模板默认值」时需从 template 或 scene 上下文读取。
3. **Assign Slot reroute 体验**：Assign Slot 点击无效果，可增加 focus/scroll 到 Template Slots 面板以改善 reroute。
