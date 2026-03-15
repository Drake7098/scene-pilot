# Prompt 区域结构问询（只读）

**目标**：在优化 Prompt 区域 UI（内容拥挤）之前，完整确认 Prompt 区域的真实结构，包括 UI、engine、pipeline、workspace、export 的关系。  
**约束**：仅输出结构信息；禁止修改代码、优化、重构、生成 patch。

---

## 1. Prompt UI Component Tree

### 1.1 提示词框 / Prompt 区域对应的真实组件

- **Pro 工作台（canUseProConsole 为 true）**
  - **主 Prompt 展示**：`PromptPreviewPanel`（在右侧 rail 内，仅当 section === `"prompt_preview"` 时显示）。
  - **路径**：`src/features/pro-workspace/components/PromptPreviewPanel.tsx`。
  - **谁渲染**：`ProWorkspaceEditor` 根据 `section` 渲染；当 `section === "prompt_preview"` 时 `content` 为 `<PromptPreviewPanel ... />`。
  - **位置**：ProWorkspaceShell → ProWorkspaceNav + **ProWorkspaceEditor** + ProWorkspaceStatusRail；Prompt 区域 = Editor 中间主内容区，Nav 左侧、StatusRail 右侧。

- **非 Pro 工作台（canUseProConsole 为 false）**
  - **Prompt 区域**：`ExportPanel` 整体作为“提示词+导出”区域。
  - **路径**：`src/components/ExportPanel.tsx`。
  - **谁渲染**：App 在 `styles.proPromptZone` 的 div 内直接渲染 `<ExportPanel ... />`。
  - **位置**：App 主布局 → `styles.center` 内下方 → `<div style={styles.proPromptZone}>` → `<ExportPanel />`。

- **Pro 工作台下“导出”Tab**
  - 与“提示词预览”并列的是 **ExportControlPanel**（section === `"export"`），不是 ExportPanel。ExportControlPanel 内没有大块 prompt 预览，只有 ExportCopySection 的复制按钮 + 简短说明；其 prompt 字符串来自 `buildPromptForScene`，仅用于 Copy 回调。

### 1.2 真实调用链

```
App
├── canUseProConsole === true
│   └── ProWorkspaceShell
│       ├── ProWorkspaceNav (section 切换)
│       ├── ProWorkspaceEditor(section, ...)
│       │   └── section === "prompt_preview" → PromptPreviewPanel(lang, project, scene, platformId, onCopyPrompt)
│       │       └── 内含：PromptOverviewSection, PromptMetaSection, PromptBreakdownSection, PromptSourceSection, PromptWarningSection
│       └── ProWorkspaceStatusRail
│
├── exportPanelSlot (Pro 时，off-screen 挂载)
│   └── ExportPanel(...)  // 用于 Copy/Export 弹窗与流程，不参与主界面布局
│
└── canUseProConsole === false
    └── <div style={styles.proPromptZone}>
            ExportPanel(...)  // 主界面可见的“Prompt 区域”
```

- **PromptPreviewPanel** 不被 ExportPanel 复用；ExportPanel 有自己的一套 prompt 计算与展示（见下文）。

---

## 2. Prompt Data Flow

### 2.1 Prompt 文本来源

- **PromptPreviewPanel（Pro 提示词预览 Tab）**
  - 来源：**buildPromptForScene**（单场景）。
  - 调用链：`PromptPreviewPanel` 内 `useMemo` → `buildPromptForScene({ project, scene, lang, platformId, profile: preset?.baseProfile, workspace: "pro" })` → 取 `pipeline?.finalCopyPrompt?.trim()` 作为 `prompt`，再传给 `PromptOverviewSection` / `PromptBreakdownSection` / `PromptSourceSection`。
  - **buildPromptForScene**（`src/utils/promptEngine.ts`）：内部构造单场景 project `{ ...input.project, scenes: [input.scene] }`，再调用 **runPromptEngine**（同文件），参数 `scope: "current_scene"`。
  - **runPromptEngine**：调用 **runPromptPipeline**（`src/utils/promptPipeline.ts`），再经 `transformByEngine`、`enforceRouteContract` 得到 `finalCopyPrompt`。
  - **runPromptPipeline**：核心文本来自 **generatePrompts(input.project, input.lang, "universal")**（`src/utils/prompt.ts`），然后 `adaptPromptToPlatformDetailed`、`cleanupFinalPrompt`。

- **ExportPanel**
  - 来源：**runPromptEngine**，直接用**多场景/范围**的 project。
  - 调用链：`ExportPanel` 内 `promptProject = useMemo(...)`（按 `exportScope` 取当前场景或连续序列），再 `promptPipeline = useMemo(() => runPromptEngine({ project: promptProject, lang, profile: exportProfile, platformId: platformPresetId, scope: exportScope }), [...])`；展示用 `promptPipeline.finalCopyPrompt`，经 `splitMachineNotes` 得 `promptsMain` / `promptsNotes`。
  - 不调用 buildPromptForScene；不复用 PromptPreviewPanel 的组件或结果。

- **ExportControlPanel（Pro 的“输出”Tab）**
  - 来源：**buildPromptForScene**（与 PromptPreviewPanel 相同入参：project, scene, lang, platformId, profile, workspace "pro")，仅用于 `ExportCopySection` 的 `prompt` 展示与 `onCopy`，以及 ExportOverviewSection 的 meta；不渲染大段 prompt 文本块。

### 2.2 是否来自 generatePrompts / runPromptEngine / promptPipeline / buildPromptForScene

| 使用处               | generatePrompts | runPromptEngine | promptPipeline       | buildPromptForScene |
|----------------------|-----------------|----------------|----------------------|---------------------|
| PromptPreviewPanel   | 是（经 pipeline）| 是             | 是（runPromptEngine 内）| 是（入口）          |
| ExportPanel          | 是（经 pipeline）| 是             | 是（runPromptEngine 内）| 否                  |
| ExportControlPanel   | 是（经 pipeline）| 是             | 是（buildPromptForScene 内）| 是（入口）          |
| PlatformAdaptPanel   | 是（经 pipeline）| 是             | 是                   | 是（入口）          |
| ProWorkspaceStatusRail | 是（经 pipeline）| 是           | 是                   | 是（入口）          |

- **generatePrompts**：仅在 **promptPipeline**（runPromptPipeline）内被调用，参数为 `(project, lang, "universal")`；runPromptPipeline 的 project 可能为单场景（buildPromptForScene 传入）或多场景（ExportPanel 的 promptProject）。
- **完整调用链（单场景）**：  
  `buildPromptForScene` → `runPromptEngine` → `runPromptPipeline`（→ `generatePrompts` → `adaptPromptToPlatformDetailed` → `cleanupFinalPrompt`）→ `transformByEngine` → `enforceRouteContract` → `finalCopyPrompt`。

---

## 3. Prompt Dependencies

### 3.1 当前依赖的参数

- **lang**：i18n，所有 prompt 组件与 pipeline 都使用。
- **mediaMode**：来自 `resolveSceneConfig(scene).mediaMode`，影响 pipeline 的 media、engine 路由、图片/视频差异化处理。
- **profile**：PromptProfile，来自 platform preset 的 `baseProfile`；在 buildPromptForScene / runPromptEngine 中传入；ExportPanel 用 `exportProfile = platformPreset.baseProfile`。
- **engine route**：在 runPromptEngine 内由 `resolvePromptEngineRoute({ workspace, mediaMode })`、`resolvePromptEngineId` 决定；workspace 来自 input 或 `parsePromptWorkspace(firstScene?.notes)`。
- **platform preset / platformId**：来自 App 的 savePlatformId（Pro）或 ExportPanel 的 platformId；决定 preset、profile、平台适配。
- **export profile**：ExportPanel 内即 platform 的 baseProfile，与 profile 同源。
- **scope (scene / project / batch)**：ExportPanel 有 `exportScope`（current_scene | continuous_sequence），决定 promptProject 取单场景还是连续序列；buildPromptForScene 固定 scope `"current_scene"`。

### 3.2 在哪个组件决定 / 传入 Prompt UI

- **lang**：App 统一，经 ProWorkspaceShell / ExportPanel props 传入。
- **mediaMode**：由当前 scene 在 PromptPreviewPanel / ExportControlPanel / ExportPanel 内通过 `resolveSceneConfig(scene)` 得到。
- **profile / platformId**：Pro 由 App 的 savePlatformId 与 getPlatformPreset 决定，经 ProWorkspaceShell → ProWorkspaceEditor → PromptPreviewPanel / ExportControlPanel；ExportPanel 自己用 props 的 platformId 和 getPlatformPreset，profile 即 exportProfile。
- **scope**：仅 ExportPanel 使用；由内部 state（internalExportScope）或 props（exportScope）决定，用于 promptProject 与 runPromptEngine 的 scope。
- **workspace**：buildPromptForScene 显式传 `workspace: "pro"`；runPromptEngine 未传时从 scene.notes 解析。

---

## 4. Prompt Layout Structure

### 4.1 PromptPreviewPanel（Pro 提示词预览 Tab）

- **结构**：根 `div`（flex column, gap 0）→ 多个 **EditorSection**（折叠块）：
  - **Prompt Overview**：icon FileText；内容 = **PromptOverviewSection**。
  - **Context**：icon Settings；内容 = **PromptMetaSection**。
  - **Section Breakdown**：icon Layers；内容 = **PromptBreakdownSection**。
  - **Source Explanation**：icon Info；内容 = **PromptSourceSection**。
  - **Prompt Warnings**：icon AlertTriangle；内容 = **PromptWarningSection**。
- **PromptOverviewSection** 内包含：
  - **header**：一行，左侧 “完整提示词” / “Full Prompt” 标签，右侧 **Copy** 按钮（走 onCopyPrompt，不直接剪贴板）。
  - **pre**：只读 prompt 文本，样式含 maxHeight 280、overflowY auto、padding 12、圆角边框。
- **无**：toolbar、profile selector、engine selector、batch selector、platform selector、export selector；platform/engine 由上层传入 platformId，不在此选择。

### 4.2 ExportPanel（非 Pro 的 proPromptZone 或 Pro 的 Copy/Export 弹窗来源）

- **结构**：根 `div.pro-export-panel`（styles.wrap）→ actionHint（若有）→ **styles.splitLayout**：
  - **leftColumn**（结构化提示词展示区）：
    - **header/title row**：标题 “结构化提示词展示区” + Help 按钮（readonlyHelpText）。
    - 可选 **冲突 badge**（sceneConflicts.length > 0）。
    - **promptPane**：内为 `pre`（displayPromptMain）、可选 notes `pre`（displayPromptNotes）、可选 **展开/收起** 按钮（compactLineLimit 4 行，showExpandToggle）。
  - **rightColumn**（生成与导出）：
    - **sectionTitle**：“生成与导出”。
    - **primaryActions**：复制提示词、导出提示词+参考图 两个主按钮。
    - **moreExportWrap**：“更多导出” 下拉（Download prompt.txt、完整项目包）。
    - **PlatformModePanel**（当 onPlatformChange && onExportModeChange 时）：平台 + 导出模式。
- **Modal（copyConfirmOpen / showExportModal 等）**：另有复制确认弹窗、导出类型/范围/平台等表单项；其中 **Export Scope**（导出范围）在 showExportModal 时存在（rangeField.visible、scopeOptions.length > 1 时显示 current_scene / continuous_sequence 等）；profile/engine 在 modal 内通过 platform 与 export 配置体现。
- **无**：独立的 engine selector、batch selector 在主体 splitLayout 中未出现；scope 在 modal 内以“导出范围”出现。

### 4.3 ProWorkspaceShell / App

- **ProWorkspaceShell**：只提供 Nav + Editor + StatusRail 和 bottomSlot / exportPanelSlot，不包含 prompt 具体布局；Prompt 布局在 ProWorkspaceEditor 的 PromptPreviewPanel 或 ExportControlPanel 内。
- **App**：proPromptZone 仅包一层 ExportPanel，无额外 header/toolbar；高度由 App 的 proPromptZone（minHeight 140）与 ExportPanel 的 wrap（height 140）共同约束。

### 4.4 汇总：各元素所在组件

| 元素               | PromptPreviewPanel     | ExportPanel                     | ProWorkspaceShell / App   |
|--------------------|------------------------|----------------------------------|----------------------------|
| header             | 有（EditorSection 标题 + Overview 内一行） | 有（leftColumn titleRow + rightColumn sectionTitle） | proPromptZone 无           |
| toolbar            | 无                     | 无（主区为按钮列）               | 无                         |
| textarea / pre     | 有（Overview 内 pre）  | 有（leftColumn promptPane 内 pre）| —                          |
| scroll container   | 有（pre maxHeight 280 overflowY auto）| 有（rightColumnScroll overflowY auto；promptPane flex 可挤缩）| proPromptZone flex column  |
| buttons            | Copy（Overview）       | 复制、导出+参考图、更多导出、PlatformModePanel 内 | —                          |
| profile selector   | 无                     | 无（profile 来自 platform）     | 无                         |
| export selector    | 无                     | modal 内有导出类型/范围         | 无                         |
| engine selector    | 无                     | 无（engine 由 mediaMode 等推导）| 无                         |
| batch selector     | 无                     | 无                             | 无                         |
| platform selector  | 无                     | 有（PlatformModePanel）         | 无                         |

---

## 5. Prompt Size Control

### 5.1 控制方与方式

- **PromptPreviewPanel**
  - 外层：ProWorkspaceEditor 的 `section`（非 composition 时）用 `div.pro-rail-scroll`，`flex: 1`、`padding: PRO_PANEL_PADDING`，无固定高度，可随内容增高并滚动。
  - 内层：PromptOverviewSection 的 `pre` 为 **maxHeight: 280**、**overflowY: "auto"**；其余 EditorSection 内容无固定高度，整体由 flex 与滚动容器决定。
  - **结论**：高度由 Workspace 的 flex 与 Overview 内 maxHeight 280 共同决定；不固定整块高度，可滚动。

- **ExportPanel**
  - **wrap**（styles.wrap）：**height: 140**, **minHeight: 140**，flex column，gap 8；在 App 的 proPromptZone（minHeight 140）内时，整块被压成 140px 高。
  - **splitLayout**：flex 1, minHeight 0，横向 flex row。
  - **leftColumn**：flex 1, minWidth 0，纵向 gap 4。
  - **promptPane**：flex 1, minHeight 0，内 pre 无固定高度，靠 flex 收缩；内容多时依赖 expand 按钮展开全文（compactLineLimit 4 行折叠）。
  - **rightColumn**：width 220，rightColumnScroll 为 flex 1、minHeight 0、overflowY auto。
  - **结论**：ExportPanel 整体**固定高度 140px**；左侧 prompt 区与右侧操作区在该高度内分配，prompt 区域无独立 max-height 数值，易显挤。

- **App proPromptZone**：`minHeight: 140`，`display: flex`，`flexDirection: "column"`；不设 max-height，由子组件 ExportPanel 的 140 决定实际高度。

### 5.2 小结

- **CSS**：PromptOverviewSection 的 pre 在组件内联 style；ExportPanel 的 wrap/splitLayout/leftColumn/rightColumn/promptPane 等在 ExportPanel 的 `styles` 对象（约 1403–1725 行）。
- **是否 flex**：是；两处均为 flex 布局。
- **是否固定高度**：PromptPreviewPanel 否（仅 pre 最大 280）；ExportPanel 整体是（140px）。
- **是否 max-height**：PromptOverviewSection 的 pre 有 maxHeight 280；ExportPanel 无整区 max-height。
- **是否 scroll**：Overview 的 pre 内滚动；ExportPanel 的 rightColumnScroll 滚动；promptPane 内容可被折叠/展开。
- **是否 auto grow**：PromptPreviewPanel 整体可随内容增高；ExportPanel 不增高，固定 140。

---

## 6. Workspace Differences

### 6.1 Prompt 是否出现、以及是否共用组件

- **Pro 工作台（canUseProConsole 为 true）**
  - 有专门的“提示词预览”Tab：**PromptPreviewPanel**（ProWorkspaceEditor section `prompt_preview`）。
  - 有“输出”Tab：**ExportControlPanel**，内含复制/生成/导出入口，prompt 来自 buildPromptForScene，不渲染大段 prompt 文本。
  - **ExportPanel** 仅在 **exportPanelSlot** 中挂载（position fixed 0,0 且 overflow hidden），用于 Copy/Export 弹窗与流程，**不在主界面占位**；用户点击“复制提示词”等会打开 ExportPanel 的 modal/流程，此时看到的是 ExportPanel 自己的 leftColumn + rightColumn 布局（弹窗或浮层）。

- **Template 工作台**
  - **无** 独立的 Prompt 预览组件；TemplateWorkspace 主要做模板浏览、选择、应用，没有与 Pro 相同的“提示词预览”或 ExportPanel 主界面块。

- **Sidebar**
  - **无** Prompt 区域；Sidebar 有“项目”区块、模板、分镜列表等，没有提示词框或 prompt 预览。

- **ExportPanel**
  - 在**非 Pro** 布局中作为主界面 **proPromptZone** 的内容（即“Prompt 区域”= ExportPanel）；在 **Pro** 布局中仅作弹窗/流程用，不占主布局。

### 6.2 是否共用同一个 PromptPreviewPanel

- **不共用**。ExportPanel **从不**渲染 PromptPreviewPanel；它自己用 runPromptEngine 算 prompt，并用 leftColumn 的 pre + 展开按钮展示。PromptPreviewPanel 只在 ProWorkspaceEditor 的 prompt_preview 分支中渲染。

---

## 7. ExportPanel Relation

### 7.1 ExportPanel 是否重新生成 prompt

- **是**。ExportPanel 内独立 `useMemo` 调用 **runPromptEngine**（project: promptProject, lang, profile, platformId, scope），得到 `promptPipeline.finalCopyPrompt`，与 PromptPreviewPanel 的 buildPromptForScene 是**两套计算**；参数一致时结果应一致，但**没有复用**同一份结果或组件。

### 7.2 ExportPanel 是否复用 PromptPreviewPanel

- **否**。ExportPanel 没有 import 或渲染 PromptPreviewPanel；其 prompt 展示是自身 leftColumn 的 pre + expand 逻辑。

### 7.3 ExportPanel 是否有自己的 pipeline

- **是**。使用 **runPromptEngine**（即 runPromptPipeline + transformByEngine + enforceRouteContract），与 PromptPreviewPanel 使用的 buildPromptForScene（内部同样 runPromptEngine）同一条 pipeline 实现，但**调用独立**，且 ExportPanel 的 project 可为多场景（exportScope continuous_sequence）。

### 7.4 ExportPanel 是否有自己的 profile

- **有**。`exportProfile = platformPreset.baseProfile`，来自 ExportPanel 的 platformId（props 或内部 platformPresetId）；与 Pro 侧 getPlatformPreset(platformId).baseProfile 同源，但由 ExportPanel 自己取。

---

## 8. Why Crowded（基于代码）

### 8.1 ExportPanel（非 Pro 主界面 或 弹窗中的 Export 区域）

- **固定高度 140px**（styles.wrap）：所有内容（左侧 prompt 预览 + 右侧复制/导出/更多/平台模式）挤在同一 140px 内；promptPane 与 rightColumn 在 flex 下争抢空间，左侧 pre 区域实际可用高度很小。
- **左栏内容多**：titleRow（标题 + Help）+ 可选 conflict badge + promptPane（pre + 可选 notes pre + 展开按钮），在 140px 内纵向排列，无分段折叠。
- **右栏内容多**：sectionTitle + primaryActions（两个主按钮）+ moreExportWrap（更多导出）+ PlatformModePanel（平台 + 导出模式），全部在 rightColumnScroll 内纵向排列；若 PlatformModePanel 展开，进一步占高。
- **profile / engine / export / scope 同时存在**：主体 splitLayout 中有平台（PlatformModePanel）；modal 打开时有导出类型、导出范围（scope）、平台等，信息集中。
- **scroll 与嵌套**：wrap 固定高度，splitLayout flex 1 minHeight 0，leftColumn 与 promptPane 均为 flex 1 minHeight 0，形成多层 flex 收缩；pre 无单独 max-height，仅靠 flex 和 4 行折叠逻辑，长 prompt 时视觉拥挤。

### 8.2 PromptPreviewPanel（Pro 提示词预览 Tab）

- **5 个 EditorSection 垂直堆叠**：Prompt Overview、Context、Section Breakdown、Source Explanation、Prompt Warnings，全部 defaultOpen 为 true（除 Source 为 false），一屏内多块折叠标题 + 内容，信息密度高。
- **Prompt Overview 内**：header 行（标签 + Copy）+ pre（maxHeight 280）；若其他 section 也展开，整页偏长，需在 pro-rail-scroll 内滚动，但单块（Overview）本身有 maxHeight，不算“挤在一格”。
- **拥挤感主要来自**：section 过多、无分组或渐进披露，而非单一块过高。

### 8.3 小结（代码依据）

- **ExportPanel**：固定 140px + 左右分栏 + 左栏（标题/冲突/完整 prompt 区/展开）+ 右栏（复制/导出/更多/平台模式）+ modal 内导出范围/类型，导致**控件多、高度锁死、scroll 容器嵌套**，是当前“Prompt 区域拥挤”的主要来源。
- **PromptPreviewPanel**：**控件数量多**（5 个 section）、**无固定高度**但**多 section 同时展开**导致一屏内容多；**padding/gap** 使用 PRO 常量，未明显不合理，拥挤更多是**信息架构**（多块平铺）而非单块尺寸。

---

## 9. Future Risk（扩展点与拥挤上限）

### 9.1 可能增加的要素

- **credits**：若放在 Prompt 区或导出区附近，会再占一行或一块。
- **engine selector**：当前 engine 由 mediaMode/workspace 推导；若显式选择，会多一个控件（可能在 ExportControlPanel 或 ExportPanel 右侧）。
- **platform selector**：ExportPanel 已有 PlatformModePanel；若再拆或加说明，会增体积。
- **batch export**：若在 ExportPanel 增加“批量导出”入口或范围选择，会与现有“更多导出”和 scope 并列。
- **template rules**：若在 Prompt 区展示模板规则或可编辑规则，会多一块内容。
- **continuity debug**：若在 Prompt 区显示连续性调试信息，会加一段只读区域。
- **rule warnings**：PromptPreviewPanel 已有 PromptWarningSection；若增强规则与警告，会加重该 section 或增加新 section。

### 9.2 当前结构是否接近拥挤上限

- **ExportPanel**：在**固定 140px** 下，左栏已含标题、冲突、prompt 预览、展开；右栏含复制、导出、更多、平台模式；**已接近上限**。再增加 credits、engine 选择、batch 入口等而不改布局（如不增加高度、不收起/分组），会明显拥挤或不可用。
- **PromptPreviewPanel**：当前为**多 section 垂直排列**，无固定总高；增加“规则/连续性调试/更多 meta”仍可再堆 section，但**可读性和扫读成本**会继续下降，建议视为**接近需重组的上限**（分组、折叠、或拆到其他 Tab）。

---

## 10. 输出格式对照（已覆盖）

- **Prompt UI Component Tree** → §1  
- **Prompt Data Flow** → §2  
- **Prompt Layout Structure** → §4  
- **Prompt Size Control** → §5  
- **Prompt Dependencies** → §3  
- **Workspace Differences** → §6  
- **ExportPanel Relation** → §7  
- **Why Crowded** → §8  
- **Future Risk** → §9  

以上均为基于代码的只读分析，未改代码、未做优化或重构。
