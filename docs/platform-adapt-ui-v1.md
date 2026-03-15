# Platform Adapt UI v1

## 阶段目标

在现有 Pro Workspace 内，实现不同平台的适配解释 UI，用于展示不同 platformId 下的限制、映射、兼容性和导出差异。

- **平台适配解释层**，不是 adapter engine、schema 扩展、prompt 重写、export pipeline 重构
- 展示平台能力、限制、映射、prompt 预览、导出行为

## UI 结构

```
ProWorkspaceShell
├── ProWorkspaceNav (… | 输出 | 平台)
├── ProWorkspaceEditor
│   └── platform 面板 → PlatformAdaptPanel
│       ├── Platform Overview（platformId, engineId, mediaMode, exportMode, applyMode）
│       ├── Platform Capabilities（能力列表）
│       ├── Platform Limits（限制说明）
│       ├── Mapping（映射说明）
│       ├── Prompt Preview（prompt 预览 + 平台差异提示）
│       └── Export Behavior（导出行为说明）
└── ProWorkspaceStatusRail
```

## 平台能力来源

- **PlatformCapability**：`getPlatformCapability(baseProfile)` 来自 `config/platformCapabilities.ts`
- 派生展示项：supportsImage, supportsVideo, prefersStructuredBlocks, prefersKeywordChain, prefersNaturalLanguage, supportsMachineTail, recommendedRefCount
- **PlatformPreset**：`getPlatformPreset(platformId)` 来自 `config/platformPresets.ts`
- 派生展示项：maxRefsPerObject, promptStyle, baseProfile, patchId, strategyNote

## 限制说明来源

- **PlatformCapability**：supportsVideo, maxCharsImage, maxCharsVideo, recommendedPromptStyle
- **PlatformPreset**：maxRefsPerObject, promptStyle
- **resolvePlatformPatch**：compressTail, budgetFactor, refsHintMode

## Mapping 说明来源

- **PlatformCapability**：prefersStructuredBlocks, prefersKeywordChain, prefersNaturalLanguage
- **PlatformPreset**：patchId, strategyNote
- 映射文案由 UI 层根据上述字段组合生成，未新增 mapping engine

## 是否改 Schema

**否**。未改动 project、scene、layer、platform、adapter 等 schema。

## 是否改 Engine

**否**。未修改 prompt engine、compileV2、resolveSceneStrategy、adapter、export engine。

## 是否新增字段

**否**。未新增字段。

## 是否新增 Adapter

**否**。仅读取现有 `resolvePlatformPatch`、`PLATFORM_PRESETS`、`PLATFORM_CAPABILITIES`，未新增 adapter 逻辑。

## 是否准备进入 UI Polish

**是**。本阶段已完成平台解释层 UI，可进入 UI polish 阶段。

## Figma 对齐

- 使用 FIGMA_COLORS、EditorSection
- 深色工作台风格
- 无后台表格页、无全屏平台页

---

## 验收摘要

| 项目 | 结论 |
|------|------|
| **Stage** | Platform Adapt UI v1 |
| **Tasks** | PlatformOverviewSection, PlatformCapabilitySection, PlatformLimitSection, PlatformMappingSection, PlatformPromptPreviewSection, PlatformExportBehaviorSection |
| **Modified files** | ProWorkspaceNav.tsx, ProWorkspaceEditor.tsx, types.ts |
| **New files** | PlatformOverviewSection.tsx, PlatformCapabilitySection.tsx, PlatformLimitSection.tsx, PlatformMappingSection.tsx, PlatformPromptPreviewSection.tsx, PlatformExportBehaviorSection.tsx, PlatformAdaptPanel.tsx |
| **New fields** | none |
| **Schema change** | no |
| **Engine change** | no |
| **Adapter change** | no |
| **Figma aligned** | yes |
| **Ready for UI Polish** | yes |
