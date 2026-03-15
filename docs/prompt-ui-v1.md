# Prompt UI v1

## 1. 阶段目标

在现有 Pro Workspace 内，构建 Prompt 的**可读、可检查、可复制、可分段查看**的 UI 层。

- **Prompt 展示与检查阶段**，不是 Prompt Engine 改造、Prompt Authoring、Export 阶段
- 展示完整 prompt、分段 breakdown、来源说明、警告、元数据
- 支持整体复制
- 为后续 Export UI 提供检查基础

## 2. 与 Figma 参考源的对齐说明

所有 UI 对齐 `src/design-reference/figma/app.tsx`：

- **颜色**：`#1f2125` bg, `#24262b` panel, `#3a3f46` border, `#343942` hover, `#f59e0b` accent, `#e5e7eb` text, `#9ca3af` textMuted
- **区块结构**：使用 `EditorSection` 实现可折叠 Section，与 Figma 中 Properties、Composition、Effects 等区块一致
- **信息密度**：紧凑行高、小字号（10–12px）、合理分组
- **风格**：工业工作台风格，非聊天式、非文档式

## 3. Prompt UI 整体布局

```
ProWorkspaceShell
├── ProWorkspaceNav
├── ProWorkspaceEditor
│   └── prompt_preview 面板 → PromptPreviewPanel
│       ├── Prompt Overview（完整提示词 + Copy）
│       ├── Context（meta）
│       ├── Section Breakdown（分段展示）
│       ├── Source Explanation（来源说明）
│       └── Prompt Warnings（提示词相关警告）
└── ProWorkspaceStatusRail
    └── Prompt 摘要（字符数 + engineId）
```

## 4. 完整 Prompt 如何展示

- **PromptOverviewSection**：展示 `buildPromptForScene` 返回的 `finalCopyPrompt`
- 只读 `<pre>` 区域，支持滚动
- 提供 Copy 按钮，复制完整 prompt 到剪贴板
- 未修改 prompt engine，直接使用现有输出

## 5. Breakdown 如何组织

- **PromptBreakdownSection**：UI 层只读解析
- 使用 `splitMachineNotes` 区分主 prompt 与 machine/control tail
- 使用 `parsePromptSections`（UI 层）将 main 按行解析为：Scene、Camera/Motion、Composition、Subjects、Motion、Style/Lighting、Constraints/Notes、Extras
- 每段带标题，只读展示，不编辑
- Breakdown 不反向影响完整 prompt

## 6. Source Explanation 如何展示

- **PromptSourceSection**：按 breakdown 各段说明主要来源
- 映射：scene → template + scene fields；subjects → object look/notes/externalPrompt；camera → scene camera + template/director pack；constraints → rules/negative
- 当 `applyMode = layout_only` 时，对受影响的段标注「部分受 applyMode 限制」

## 7. Warning 如何展示

- **PromptWarningSection**：消费 Rule UI 已有结果
- 当 `layoutLocked`：说明场景级字段未进入 prompt
- 当 `mediaMode === "image"`：说明 T1/视频运动已精简
- 当存在 disabled 字段：说明数量及未进入 prompt
- 当存在 prompt 相关冲突（notes/externalPrompt/scene）：说明可能影响输出质量
- 只做说明，不做自动修复

## 8. Copy 如何复用

- PromptOverviewSection 提供 Copy 按钮
- 使用 `navigator.clipboard.writeText` 或 `document.execCommand("copy")` 直接复制
- 支持外部传入 `onCopy` 回调复用已有复制流程
- 当前未接入 ExportPanel 的 prepare 流程，仅做纯文本复制

## 9. 是否修改架构

**否**。仍使用现有 project / scene / platformId 数据流、`buildPromptForScene`、`splitMachineNotes`。

## 10. 是否修改 Schema

**否**。未改动 project、scene、layer 等 schema。

## 11. 是否新增字段

**否**。未新增字段。

## 12. 是否修改 Prompt Engine

**否**。仅使用 `buildPromptForScene` 输出做 UI 展示。`parsePromptSections` 为 UI 层只读解析，不修改 prompt engine、compileV2、resolveSceneStrategy。

## 13. 是否准备进入 Export UI

**是**。本阶段已提供 prompt 的完整展示、分段检查、来源解释和警告，为 Export UI 的审核与导出奠定基础。未实现平台导出配置、批量导出、export mode 面板。

---

## 验收摘要

| 项目 | 结论 |
|------|------|
| **Stage** | Prompt UI v1 |
| **Tasks** | PromptOverviewSection, PromptBreakdownSection, PromptSourceSection, PromptWarningSection, PromptMetaSection |
| **Modified files** | PromptPreviewPanel.tsx, ProWorkspaceStatusRail.tsx, ProWorkspaceShell.tsx |
| **New files** | PromptOverviewSection.tsx, PromptBreakdownSection.tsx, PromptSourceSection.tsx, PromptWarningSection.tsx, PromptMetaSection.tsx, parsePromptSections.ts |
| **New fields** | none |
| **Schema change** | no |
| **Architecture change** | no |
| **Prompt engine change** | no |
| **Figma reference aligned** | yes |
| **Ready for Export UI** | yes |
