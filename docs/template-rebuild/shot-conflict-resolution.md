# Shot Conflict Resolution

实现文件：`src/shot-model/resolveShotConflicts.ts`

## Principle

冲突必须在 ShotModel 构建阶段完成裁决，不允许把冲突字段并列写入最终描述。

## Current Decisions

1. `static_vs_motion`
- 触发：`t0=t1` 或文本同时出现静止与运动
- 胜者：`structural`
- 动作：`drop motion displacement`

2. `no_text_vs_add_text`
- 触发：同时出现 no-text 与 text-overlay
- 胜者：`scene`
- 动作：`drop add-text`

3. `preserve_count_vs_add_remove`
- 触发：同时出现保持数量与新增/删除主体
- 胜者：`structural`
- 动作：`drop add/remove`

4. `no_auto_center_vs_center_hero`
- 触发：同时出现不自动居中与主角居中
- 胜者：`scene`
- 动作：`downgrade center-hero to soft preference`

## Output Form

裁决结果会进入：
- `shotModel.metadata.conflictDecisions`
- `shotModel.semantic.hardConstraints`
- `shotModel.action.blockedActions`
