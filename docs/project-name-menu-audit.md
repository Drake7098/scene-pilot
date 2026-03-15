# 项目名称下拉菜单审计（只读，不改代码）

**目标**：输出项目名称菜单的完整结构与跳转链路，识别旧 UI / 旧 handler / 旧跳转，为 Step1 改造做准备。  
**禁止**：改代码、改 schema、改 engine、改 prompt engine、重写 pricing、重排 sidebar/workspace。

---

## 一、当前“项目名称菜单”的两种实现

| 实现 | 文件 | 当前是否挂载 | 形态 |
|------|------|----------------|------|
| **Sidebar 项目区块** | Sidebar.tsx（EditorSection + 按钮列表） | ✅ 是，App 只渲染 Sidebar | 左侧栏可折叠区块，标题为项目名，展开后为一列按钮 |
| **ProjectControlBar 下拉** | ProjectControlBar.tsx | ❌ 否，App 未渲染该组件 | 点击“项目名”触发下拉菜单（data-testid="project-menu"） |

当前用户可见的“项目名称”相关入口仅为 **Sidebar 项目区块**；ProjectControlBar 仅被 import，未出现在渲染树中。

---

## A. 当前菜单结构

### A.1 Sidebar 项目区块（实际在用的入口）

**位置**：`Sidebar.tsx`，`projectLabel != null && onSaveProject` 时渲染。  
**结构**：一个 `EditorSection`，title = 项目名（或「未命名项目」），内部为 `projectSectionBody` 的垂直按钮列表 + 分隔线。

**一级项（无二级菜单）**：

| # | 菜单文案 (zh / en) | 所在分组 | 显示条件 | 点击调用的 handler（Sidebar 接收的 prop） | 最终行为简述 |
|---|--------------------|----------|----------|--------------------------------------------|--------------|
| 1 | 新建项目 / New Project | Group 1: File | 始终 | onNewProject?.() | requestNewProject() → 可能弹未保存确认 → 或 requestProAccess("pro") + openCreateWizard |
| 2 | 打开项目 / Open Project | Group 1: File | 始终 | onOpenProject?.() | fileInputRef.current?.click() → 系统文件选择器 |
| 3 | 保存项目 / Save Project | Group 1: File | 始终 | onSaveProject?.() | runProjectAction("save") → saveToDisk() → 平台选择弹窗 → 保存到项目库 |
| 4 | 另存项目 / Save Project As | Group 1: File | 始终 | onSaveAs?.() | runProjectAction("save_as") → saveAsToDisk() → 平台+目录选择 → 另存到库 |
| — | （分隔线 projectActionSep） | — | — | — | — |
| 5 | 重命名项目 / Rename Project | Group 2: Project | 始终 | onRenameProject?.() | requestRenameProject() → setRenameProjectOpen(true) → 重命名弹窗 |
| 6 | 复制为新项目 / Duplicate Project | Group 2: Project | onDuplicateProject 有传时 | onDuplicateProject() | runProjectAction("duplicate") → 内存复制项目并 setFileLabel |
| 7 | 项目库 / Project Library | Group 2: Project | 始终 | onOpenLibrary?.() | setLibraryOpen(true) + refreshLibraryEntries → 项目库弹层 |
| — | （分隔线） | — | — | — | — |
| 8 | 复制提示词 / Copy Prompt | Group 3: Export | 始终 | onCopyPrompt?.() | handleCopyPrompt() → openExportPanel("copy") → 打开 ExportPanel 并 action=copy |
| 9 | 导出提示词 / Export Prompt | Group 3: Export | onExportPromptTxt 有传时 | onExportPromptTxt() | openExportPanel("prompt_txt") → ExportPanel 以 prompt_txt 打开 |
| 10 | 导出提示词 + 参考图 / Export Prompt + Refs | Group 3: Export | onExportPromptPlusRefs 有传时 | onExportPromptPlusRefs() | openExportPanel("prompt_plus_refs") → ExportPanel |
| 11 | 导出项目包 / Export Project Package | Group 3: Export | 始终 | onExportProject?.() | handleExportProject() → openExportPanel("open") → ExportPanel |
| — | （分隔线） | — | — | — | — |
| 12 | 保存为模板 / Save as Template | Group 4: Template | onSaveAsTemplate 有传时 | onSaveAsTemplate() | runProjectAction("save_as_template") → 写 localStorage + 开模板工作台并定位到“我的模板” |

### A.2 ProjectControlBar 下拉菜单（存在但未挂载）

**位置**：`ProjectControlBar.tsx`。  
**结构**：trigger 按钮（项目名 + ChevronDown）→ `projectMenuOpen` 为 true 时渲染 `data-testid="project-menu"` 的 div，内容为 4 组 + 分隔线，与 Sidebar 项目区块项一一对应（含快捷键文案）。

- 分组与项与上表一致；handler 为 props：onNewProject, onOpenProject, onSaveProject, onSaveAs, onRenameProject, onDuplicateProject, onOpenLibrary, onCopyPrompt, onExportPromptTxt, onExportPromptPlusRefs, onExportProject, onSaveAsTemplate。
- 无独立“最终行为”，与 Sidebar 共用 App 传入的同一批 handler。

---

## B. 当前跳转链路

| 菜单项 | click source | intermediate handler (App) | dispatcher / router / modal / panel | final destination |
|--------|---------------|----------------------------|--------------------------------------|-------------------|
| 新建项目 | Sidebar 按钮 onNewProject | requestNewProject → 可能 requestProAccess("pro") | 未保存确认弹窗 NewProjectConfirm 或 requestProAccess → AccountCenterModal("pro") | openCreateWizard(false) 或 AccountCenterModal section "pro" |
| 打开项目 | Sidebar 按钮 onOpenProject | () => fileInputRef.current?.click() | 无 | 系统文件选择器（选 JSON） |
| 保存项目 | Sidebar 按钮 onSaveProject | runProjectAction("save") → saveToDisk() | requestSavePlatform → SavePlatform 选平台弹窗 | saveProjectToLibrary（IndexedDB/OPFS 等） |
| 另存项目 | Sidebar 按钮 onSaveAs | runProjectAction("save_as") → saveAsToDisk() | requestSavePlatform("save_as") + 目录/名称 | 同上，另存新名/新目录 |
| 重命名项目 | Sidebar 按钮 onRenameProject | requestRenameProject | setRenameProjectOpen(true) | 重命名弹窗 → confirm 后 runProjectAction("rename_confirm") |
| 复制为新项目 | Sidebar 按钮 onDuplicateProject | handleDuplicateProject → runProjectAction("duplicate") | 无 | 内存中 duplicateProject + setFileLabel，无页面跳转 |
| 项目库 | Sidebar 按钮 onOpenLibrary | setLibraryOpen(true); refreshLibraryEntries(...) | 无 | 项目库弹层（libraryOpen 控制的 UI） |
| 复制提示词 | Sidebar 按钮 onCopyPrompt | handleCopyPrompt → openExportPanel("copy") | setOpenExportAction + setOpenExportNonce | ExportPanel 打开且 action=copy（弹窗/侧板） |
| 导出提示词 | Sidebar 按钮 onExportPromptTxt | () => openExportPanel("prompt_txt") | 同上 | ExportPanel action=prompt_txt |
| 导出提示词+参考图 | Sidebar 按钮 onExportPromptPlusRefs | () => openExportPanel("prompt_plus_refs") | 同上 | ExportPanel action=prompt_plus_refs |
| 导出项目包 | Sidebar 按钮 onExportProject | handleExportProject → openExportPanel("open") | 同上 | ExportPanel action=open |
| 保存为模板 | Sidebar 按钮 onSaveAsTemplate | handleSaveAsTemplate → runProjectAction("save_as_template") | saveCurrentProjectAsTemplate + setTemplateWorkspaceState | 模板工作台打开，视图="我的模板"、section="created" |

---

## C. 旧 UI 清单

| 项 | 位置 | 说明 | 标记 |
|----|------|------|------|
| Sidebar 项目区块按钮样式 | Sidebar.tsx styles.projectAction | className="pro-project-action" + editorTheme.colors.text/border，PRO_TYPO | 当前主入口 UI；非 Figma 顶部栏下拉样式 |
| ProjectControlBar 触发按钮 | ProjectControlBar.tsx | 非 Pro 用 UI_COMMAND/UI_PALETTE/UI_TYPO；Pro 用 var(--pro-*) | 旧 topbar 风格；当前未挂载 |
| ProjectControlBar 下拉面板 | ProjectControlBar.tsx styles.menu / menuPro | UI_MENU.panel（圆角 16、渐变背景、阴影）；Pro 时 menuPro 覆盖为 var(--pro-bg-panel) | 与 Figma 左栏 Section 风格不同；未挂载 |
| 分隔线 | projectActionSep / menuSep | 1px 线，margin 6px 0 或 8px 4px | 仍在使用（Sidebar + ProjectControlBar 内） |

---

## D. 旧 handler 清单

| handler | 定义位置 | 是否 legacy | 说明 |
|---------|-----------|-------------|------|
| runProjectAction | App.tsx | 否，统一入口 | 保存/另存/重命名/复制/保存为模板的统一 dispatcher |
| saveToDisk / saveAsToDisk | App.tsx | 否 | 依赖 requestSavePlatform（选平台弹窗），再写库 |
| requestSavePlatform | App.tsx | 否 | 打开 SavePlatform 选平台 modal |
| requestRenameProject | App.tsx | 否 | 只打开重命名弹窗 |
| requestNewProject | App.tsx | 否 | 含 requestProAccess("pro") 与 openCreateWizard |
| handleDuplicateProject | App.tsx | 否，代理 | 仅调用 runProjectAction("duplicate") |
| handleSaveAsTemplate | App.tsx | 否，代理 | 仅调用 runProjectAction("save_as_template") |
| handleCopyPrompt | App.tsx | 否 | 仅 openExportPanel("copy") |
| handleExportProject | App.tsx | 否 | 仅 openExportPanel("open") |
| openExportPanel | App.tsx | 否 | 设置 openExportAction + openExportNonce，由 ExportPanel 消费 |
| onOpenProject | App 传入 | 否 | fileInputRef.current?.click() |
| onOpenLibrary | App 传入 | 否 | setLibraryOpen + refreshLibraryEntries |

以上均未发现“旧 export 入口”或“旧 billing/upgrade/pricing 入口”在项目名称菜单内被直接调用；导出统一走 ExportPanel，无在菜单里直接调 pricing/billing 的项。

---

## E. 旧跳转清单

| 来源 | 跳转目标 | 是否在项目名称菜单内 |
|------|----------|------------------------|
| 无 | /pricing | 否，项目名称菜单无“升级/定价”项 |
| 无 | BillingOverlay | 否 |
| 无 | AccountCenterModal | 仅间接：requestNewProject → requestProAccess("pro") → openAccountCenter("pro") |
| 打开项目 | 无路由跳转，仅文件选择器 | — |
| 保存/另存 | 无路由跳转，SavePlatform 弹窗 + 写库 | — |
| 复制/导出相关 | 无路由跳转，ExportPanel 打开 | — |

项目名称菜单本身**不包含**任何“旧页面”跳转（如 /pricing、/account）；唯一可能打开的“中心”是 requestProAccess 导致的 AccountCenterModal("pro")。

---

## F. UI 来源审计（项目名称菜单）

### F.1 使用的组件

| 实现 | 组件 | 说明 |
|------|------|------|
| Sidebar 项目区块 | EditorSection（ui）、普通 button | 可折叠区块，标题=项目名；无 dropdown/popover |
| ProjectControlBar（未挂载） | 无第三方 dropdown；本地 div + state projectMenuOpen | 绝对定位的 div 作为下拉层 |

### F.2 className / style 来源

- **Sidebar 项目区块**
  - 按钮：`className="pro-project-action"`，`style={styles.projectAction}`。
  - styles.projectAction：来自 Sidebar 内部 styles 对象，使用 editorTheme.colors.text、PRO_TYPO.xs/weightMedium/fontFamily，borderRadius 6，padding 6px 0。
  - 分隔线：styles.projectActionSep，editorTheme.colors.border。
- **ProjectControlBar（未挂载）**
  - Trigger：className 为 `pro-topbar-trigger`（isPro 时），style 为 styles.projectButton / projectButtonPro 或 sidebarTrigger。
  - 菜单：className 为 `pro-topbar-menu`（isPro 时），style 为 styles.menu / menuPro。
  - 项：styles.menuItem，来自 UI_MENU.item（minHeight 40, padX 10, radius 12 等）。

### F.3 颜色 token 来源

- Sidebar：editorTheme.colors（#1f2125, #24262b, #3a3f46, #343942, #e5e7eb, #9ca3af 等），与 Figma app.tsx 的 colors 一致。
- ProjectControlBar：非 Pro 用 UI_PALETTE / UI_COMMAND；Pro 用 var(--pro-bg-panel)、var(--pro-border)、var(--pro-text-primary) 等。

### F.4 与 Figma 参考的对比

- **Figma app.tsx**：顶部栏为 header（h-12, border-b, bg-[#24262b]），左侧为 “SceneMaker / Untitled Project”，右侧为 Preview、Export、User；**无“项目名点击展开下拉”的交互**；左侧栏为 Section 折叠列表。
- **当前 Sidebar 项目区块**：形态更接近 Figma 的“左侧 Section”，但标题是项目名，内容是文件/项目/导出/模板按钮列，**不是** Figma 顶栏的“项目名 + 下拉”。
- **ProjectControlBar**：是“项目名 + 下拉”形态，但 **Figma 参考里没有对应下拉**；且该组件当前**未挂载**。

结论：项目名称菜单的**实际 UI**（Sidebar 区块）与 Figma 左栏 Section 风格可对齐；若将来启用“项目名下拉”，需以 Figma 顶栏 + 设计规范为准单独对齐，当前无 Figma 下拉参考。

---

## G. Step1 改造建议（仅结构和动作，不写代码）

### 应保留

- 四组结构：文件 / 项目 / 导出 / 模板。
- 所有现有 handler 的语义与调用关系（runProjectAction、openExportPanel、requestRenameProject、requestNewProject、onOpenLibrary 等）。
- 复制提示词、导出提示词、导出提示词+参考图、导出项目包四条导出入口（统一走 ExportPanel）。
- 不删旧组件：ProjectControlBar 不删，仅标记为“可选/代理入口”或“未挂载待 Step 后决定”。

### 应收口

- 项目名称相关动作**只保留一套**入口语义：要么以 Sidebar 项目区块为唯一入口，要么以“项目名下拉”为唯一入口，避免两套并列造成重复与歧义。
- 若 Step1 采用“项目名下拉”为主：将 Sidebar 项目区块收口为“代理”到同一批 handler，或仅保留折叠区块但内部按钮改为触发与下拉相同的逻辑（不新增 handler）。
- 若 Step1 仍以 Sidebar 区块为主：明确 ProjectControlBar 为“未使用/待后续步”的组件，不在本步挂载或对外暴露为“项目名称菜单”。

### 应“删除调用但不删组件”

- 不删除 ProjectControlBar 组件文件；若决定统一用 Sidebar 区块，则不在任何地方挂载 ProjectControlBar，或仅保留挂载但菜单内容与 Sidebar 完全一致并标注为“代理”。
- 不删除 Sidebar 内项目区块的 EditorSection；若 Step1 改为“项目名下拉”为主，可将区块内按钮改为调用与下拉相同的 handler（或隐藏区块仅保留下拉），而不删除该 Section 的 DOM 结构或组件，便于回退。

### 不做的内容（遵守约定）

- 不删旧组件。
- 不做 schema / engine / prompt engine 修改。
- 不重写 pricing 页面。
- 不重排 sidebar / workspace 整体结构。
- 不进入 Step2 及以后（如新路由、新 billing 入口等）。

---

**文档结束；未修改任何代码。**
