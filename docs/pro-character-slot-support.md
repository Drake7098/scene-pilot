# 连续模板 Character 槽位支持

> **已弃用**：模板槽位功能已移除。本文档仅供历史参考。

## 为什么需要 Character 槽位

连续性模板（webdrama、anime）多使用多角色结构，如：

- **webdrama**：`Character A`、`Character B` 等角色层
- **anime**：`Subject` 或类似角色层

若 Template Slots 只识别传统主体类型（主体、subject、人物、角色），则 `Character A`、`Character B` 不会被识别，导致：

- Template Slots 显示“当前模板暂无可编辑槽位”或只有 copy / camera 等少量槽位
- 用户无法快速编辑连续模板中的主要角色
- 需要逐层打开对象属性，效率低

## 当前识别逻辑的扩展

### 主体类型识别

在 `src/utils/templateSlots.ts` 中：

1. **传统关键词**：`["主体", "subject", "人物", "角色"]`，通过 `t.includes(k)` 匹配
2. **Character 前缀**：`"character"` 作为前缀或子串，支持：
   - `Character A`、`Character B`
   - `character`、`character-a`、`character-b`
3. **规范化**：`type` 转小写、去空格/连字符后匹配

### 槽位提取策略

- **旧逻辑**：只取第一个 subject 层，生成一个 `subject` slot
- **新逻辑**：收集所有 subject/character 层，为每个生成独立 slot
- **slotId**：通过 `toSubjectSlotId(layer.type)` 生成，如 `character_a`、`character_b`
- **唯一性**：若 slotId 重复，追加 `_2`、`_3` 等后缀

### continuity 模板的角色提取规则

- 不单独为 continuity 做分支，统一用扩展后的 `isSubjectLayer` 和全量 subject 层收集
- webdrama 的 `Character A`、`Character B` 和 anime 的 `Subject` 均能被识别
- 优先保证至少 1–2 个主要角色槽位可编辑

## Base / Continuity 兼容

- **Base 模板**：通常 0–1 个 subject 层，仍只生成 0–1 个 subject slot，行为不变
- **Continuity 模板**：多角色层会生成多个 character slot，满足连续编辑需求
- **syncSlotToProject**：通过 `layerId` 绑定具体层，slotId 变化不影响同步逻辑
