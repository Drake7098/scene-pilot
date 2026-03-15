# Export UI v1

## 阶段目标

在现有 Pro Workspace 内，实现统一的 Export / Copy / Generate / Platform 选择 UI，作为输出控制中心。

- **Export 控制层 UI**，不是 engine 重构、adapter 系统重写、平台 authoring、新 pipeline
- 选择平台、引擎、导出模式
- 复制 prompt、调用 generate、调用 export

## UI 布局

```
ProWorkspaceShell
├── ProWorkspaceNav (… | 输出 Export)
├── ProWorkspaceEditor
│   └── export 面板 → ExportControlPanel
│       ├── Export Overview（platform, engine, applyMode, mediaMode, template）
│       ├── Platform Select（platformId 下拉）
│       ├── Engine & Source（engineId 只读 + hosted/my api）
│       ├── Export Mode（prompt_only | package）
│       ├── Copy（复制提示词）
│       ├── Generate（生成按钮）
│       └── Export Actions（Export、Copy for platform）
└── ProWorkspaceStatusRail
```

## Platform / Engine / Mode 来源

- **platformId**：`PLATFORM_PRESETS`，`getPlatformPreset`，App 的 `savePlatformId` / `syncSavePlatform`
- **engineId**：由 `resolvePromptEngineId` 派生（workspace=pro + mediaMode）→ IM V5P / VI V5P，只读展示
- **exportMode**：现有 `prompt_only` | `package`，来自 `project.meta.proExportMode`，`handleProExportModeChange`
- **hosted / my api**：`proGenerationSource`，`canUseBringYourOwnApi` 控制可见性

## Generate / Copy / Export 如何复用

- **Copy**：`onCopyPrompt` → `openExportPanel("copy")` → ExportPanel 的 `guardBeforeExport("copy")` → `runCopyPrompt`
- **Export**：`onExport` → `openExportPanel("open")` → 显示 ExportPanel modal
- **Generate**：`onGenerate` → `generateProAsset()` → App 现有生成逻辑

## 是否修改 Schema

**否**。未改动 project、scene、layer 等 schema。

## 是否修改 Engine

**否**。未修改 prompt engine、compileV2、resolveSceneStrategy、applyPayloadToProject。

## 是否新增字段

**否**。未新增字段。

## 是否新增 Adapter

**否**。未新增 adapter，仅通过 UI 调用已有 export / copy / generate 逻辑。

## 是否准备进入 Platform Adapt UI

**否**。本阶段仅做 platform 选择与 export 控制，不做 adapter 配置、prompt mapping、字段映射。后续 Platform Adapt UI 再处理 adapter 规则与配置。

## Figma 对齐

- 使用 FIGMA_COLORS、EditorSection
- 区块内 Section 折叠
- 工业工作台风格，无新布局体系、全屏 export 页、表单式后台 UI

---

## 验收摘要

| 项目 | 结论 |
|------|------|
| **Stage** | Export UI v1 |
| **Tasks** | ExportOverviewSection, PlatformSelectSection, EngineSelectSection, ExportModeSection, CopySection, GenerateSection, ExportActionSection |
| **Modified files** | ProWorkspaceShell.tsx, ProWorkspaceEditor.tsx, ProWorkspaceNav.tsx, types.ts, App.tsx |
| **New files** | ExportOverviewSection.tsx, PlatformSelectSection.tsx, EngineSelectSection.tsx, ExportModeSection.tsx, ExportCopySection.tsx, ExportGenerateSection.tsx, ExportActionSection.tsx, ExportControlPanel.tsx |
| **New fields** | none |
| **Schema change** | no |
| **Engine change** | no |
| **Adapter change** | no |
| **Figma aligned** | yes |
| **Ready for Platform Adapt UI** | no |
