# Pro Workspace Parity Patch

## 1. 丢失能力清单

ProWorkspaceShell 替代旧 Stage+PropsPanel 后，Pro 用户曾丢失的能力：

| 能力 | 原位置 |
|------|--------|
| 生成按钮 | PropsPanel bottomSlot |
| 复制提示词 / 导出入口 | ExportPanel (proPromptZone) |
| 背景参考图 (backgroundRef) | PropsPanel Scene Background |
| 对象参考图 (localRefs) | PropsPanel Object Properties |
| Layer 改名 (onRenameLayer) | PropsPanel |
| 冲突跳转 (onJumpToConflict) | ExportPanel |
| 对象 type 预设 | PropsPanel |
| 对象 look 预设 | PropsPanel |
| shapeDesc | PropsPanel |
| referencePolicy | PropsPanel |
| referenceLinks | PropsPanel |
| 对象级 layoutLocked | PropsPanel |
| T1 锁定原因说明 | PropsPanel Composition |
| 背景 preset | PropsPanel |

## 2. 本次恢复的能力

### P0（已完成）

1. **生成按钮** — 在 ProWorkspaceShell 底部 utility bar 恢复，复用 `generateProAsset`、`proGenerationSource`、`canUseBringYourOwnApi`
2. **复制提示词 / 导出入口** — 底部 bar 增加 Copy、Export 按钮，调用 `openExportPanel`；ExportPanel 以隐藏方式挂载，用于处理 modal
3. **背景参考图** — SceneEditorPanel 增加导入 / 移除 / 缩略图展示
4. **对象参考图** — ObjectEditorPanel 增加 localRefs 导入 / 移除
5. **Layer 改名** — ObjectEditorPanel 增加对象 ID 编辑与 `onRenameLayer` 调用
6. **冲突跳转** — ConstraintInspectorPanel 中冲突项与对象状态可点击，调用 `onJumpToConflict` 选中对应 layer

### P1（已完成）

7. **对象 type 预设** — ObjectEditorPanel 增加 type 下拉（character, subject, station, spacecraft 等）
8. **对象 look 预设** — 保持为自由文本输入（未做完整 type-aware 预设）
9. **shapeDesc** — ObjectEditorPanel 增加形态字段
10. **referencePolicy** — ObjectEditorPanel 增加 optional/required 选择
11. **referenceLinks** — ObjectEditorPanel 增加参考链接输入
12. **对象级 layoutLocked** — ObjectEditorPanel 增加 checkbox，通过 `writeLayoutLocked` 写入 notes
13. **T1 锁定原因** — CompositionEditorPanel 在图片模式下禁用 T1 并显示“图片模式：终点 t=1 已锁定”
14. **背景 preset** — SceneEditorPanel 增加基础 preset 下拉（白底/黑底/灰底/客厅/街道等）

## 3. 通过复用旧模块恢复的能力

- **ExportPanel** — 原样挂载（视觉隐藏），仅用于 modal 响应 `openExportNonce`
- **putRefBlob / getRefBlob / deleteRefBlob** — 复用 `localRefs` 工具做背景/对象参考图
- **writeLayoutLocked** — 复用 stage-editor 的 notes 写入
- **generateProAsset** — 复用 App 中已有逻辑，经 bottomSlot 传入
- **openExportPanel** — 复用 App 中已有逻辑

## 4. 仍暂缓的能力

- 对象 look 的完整 type-aware 预设（与 PropsPanel 等价）
- Canvas / 生成资产标签页（资产预览）
- 更丰富的 notes 要素 picker
- 冲突详情 modal（当前仅跳转，无详情弹窗）

## 5. 是否修改架构

**否**。仍使用现有 project / scene / layer 数据流和更新入口。

## 6. 是否修改 schema

**否**。未改动 project、scene、layer 等 schema。

## 7. 是否新增字段

**否**。未新增字段。

## 8. Pro / 非 Pro 是否进一步收敛

**部分收敛**。Pro 用户通过 ProWorkspaceShell 已恢复核心能力，非 Pro 仍使用旧布局。未做布局统一，但数据流与更新逻辑保持一致。

## 9. 当前是否可进入 Rule Engine UI

**是**。Parity Patch 已完成，Pro 用户的生产闭环已恢复，可进入 Rule Engine UI 阶段。
