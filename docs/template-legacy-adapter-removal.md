# Legacy Adapter 移除说明

## 一、legacyAdapter 原先干什么

- `getTemplateWorkspaceItemFromIndex(index)`：将 TemplateIndex 转为 TemplateWorkspaceItem（UnifiedTemplate）
- 仅支持 base 400，continuity 返回 null
- 用于旧流程：Index → Item → unifiedTemplateToSceneTemplate → applyTemplateSnapshot
- `getTemplateMetadataFromIndex`：取 id/cost/name 等元数据（已迁入 template-engine）

## 二、现在为什么不再需要

- 主流程统一为：TemplateIndex → loadTemplatePayloadById → applyPayloadToProject
- 不再需要 UnifiedTemplate 中间形态
- 工作台和快捷入口均直接使用 TemplateIndex
- getTemplateMetadataFromIndex 已由 template-engine 提供

## 三、是否还保留兼容壳

- 保留 `getTemplateWorkspaceItemFromIndex`，并标记 `@deprecated`
- 当前无主流程调用，仅通过 workspace 对外导出
- 若未来有「需要 UnifiedTemplate 形态」的旧代码，可继续用

## 四、主流程是否已不依赖

- 是。主 apply 链为：handleUseTemplateFromWorkspace → applyTemplateFromIndex → loadTemplatePayloadById → applyPayloadToProject
- 未使用 getTemplateWorkspaceItemFromIndex
- 未使用 unifiedTemplateToSceneTemplate
- 未使用 applyTemplateSnapshot
