# Sidebar 项目区块 / 项目名菜单详情收集（只读）

**目标**：确认左侧栏「项目」区块是否适合作为项目名下的文件菜单基础；只做信息收集与结构分析，未改代码。

---

## 1. Current Sidebar Project Section

### 1.1 区块标题显示逻辑

- **显示字段来源**：`projectLabel`（Sidebar 的 prop）。App 传入 `projectLabel={fileLabel || defaultProjectName(lang)}`，即 **fileLabel**，空时用 `defaultProjectName(lang)`。
- **是 fileLabel 还是 project.name**：**fileLabel**（及空时的 defaultProjectName）。标题**不**直接读 `project.name`；Rename 后 runProjectAction 会同步 project.name 与 fileLabel，故两者一致。
- **默认文案**：`defaultProjectName(lang)`（来自 `src/utils/naming.ts`）。
- **空项目时**：`projectLabel` 为空时用「未命名项目」/「Untitled Project」；标题最终为 `(projectLabel || "未命名项目").trim() || "未命名项目"`，保证至少显示「未命名项目」。

### 1.2 区块内所有按钮（按视觉顺序）

| # | 按钮文案 | Handler / prop | 最终调用链 | 走 runProjectAction | 弹窗 | 打开 ExportPanel | 直接执行 |
|---|----------|----------------|------------|---------------------|------|------------------|----------|
| 1 | 保存项目… / Save Project... | onSaveProject | runProjectAction("save") → saveToDisk() → saveProjectToLibrary | ✅ | 选平台弹窗 | 否 | 否（先选平台） |
| 2 | 复制提示词 / Copy Prompt | onCopyPrompt | handleCopyPrompt → openExportPanel("copy") | 是（copy 统一入口） | 可选确认/冲突弹窗 | 是 | 否 |
| 3 | 导出… / Export... | onExportProject | handleExportProject → openExportPanel("open") | 是（export 统一入口） | 导出弹窗 | 是 | 否 |
| — | **分隔线** | styles.projectActionSep | — | — | — | — | — |
| 4 | 打开项目 / Open Project | onOpenProject | fileInputRef.current?.click()（上传 JSON） | 否 | 否 | 否 | 是（文件选择） |
| 5 | 项目库 / Project Library | onOpenLibrary | setLibraryOpen(true) + refreshLibraryEntries | 否 | 否（打开库弹层） | 否 | 是 |
| 6 | 重命名项目 / Rename Project | onRenameProject | requestRenameProject → 弹窗 → confirmRenameProject → runProjectAction("rename_confirm", { renameDraft }) | ✅ | 是 | 否 | 否（确认后执行） |
| 7 | 另存项目… / Save Project As... | onSaveAs | runProjectAction("save_as") → saveAsToDisk() | ✅ | 选平台 + prompt 输入目录名 | 否 | 否 |
| 8 | 复制为新项目 / Duplicate Project | onDuplicateProject | handleDuplicateProject → runProjectAction("duplicate") | ✅ | 否 | 否 | 是 |
| 9 | 保存为模板 / Save as Template | onSaveAsTemplate | handleSaveAsTemplate → runProjectAction("save_as_template") | ✅ | 否 | 否 | 是（写 localStorage + 开模板工作台） |
| — | **分隔线** | styles.projectActionSep | — | — | — | — | — |
| 10 | 新建项目 / New Project | onNewProject | requestNewProject（可能弹未保存确认）→ openCreateWizard / enterProWorkspace | 否 | 可能（未保存确认） | 否 | 否 |

### 1.3 区块内其他元素

- **icon**：EditorSection 的 `icon={FolderOpen}`，在标题左侧。
- **subtitle**：无。
- **tag**：无。
- **divider**：有，两处 `<div style={styles.projectActionSep} />`（Save/Export 后一组，Open/Library/Rename/SaveAs/Dup/SaveAsTemplate 后一组，再 New）。
- **grouped actions**：仅通过分隔线分三组（保存+复制+导出 | 打开+库+重命名+另存+复制项目+保存为模板 | 新建），无明确分组标题。
- **more menu**：无。
- **dropdown**：无；区块为可折叠 EditorSection，展开后为一列按钮，无下拉。
- **hidden items**：无；onDuplicateProject / onSaveAsTemplate 为可选 prop，不传则该按钮不渲染（条件渲染），无“隐藏”态。

### 区块显示条件

- 整块渲染条件：`projectLabel != null && onSaveProject`。App 始终传 projectLabel 和 onSaveProject，故在 Pro 主布局下该区块始终显示（与 Template/Pro 右侧内容无关）。

---

## 2. Name / Label Sync

### 2.1 Sidebar 标题显示值从哪里来

- 来自 App 传入的 **projectLabel**，值为 `fileLabel || defaultProjectName(lang)`。即 **fileLabel** 为主，空则用默认项目名。

### 2.2 project.name 与 fileLabel 的关系

- **project.name**：Project 类型字段，在 create/duplicate/从模板创建时由 projectCreation 或 buildProjectFromWizard 设置；Rename 确认时由 runProjectAction("rename_confirm") 写回。
- **fileLabel**：App 的 state，用于 UI 显示与导出文件名；初始来自 `localStorage["scene_pilot_last_file_label"]`；Rename/新建/复制/从模板/打开库/上传文件等会 setFileLabel 或 setLabelPersist。
- **关系**：Step2 后 Rename 已同步两者；其他场景（新建/复制/从模板/打开库）在设置 project 的同时会 setFileLabel(name)，故正常情况下一致；若从未 Rename 且从旧数据恢复，理论上 project.name 可能与 fileLabel 不同步（当前实现已尽量同步）。

### 2.3 labelPersist 的作用

- 封装“把显示名持久化”：`setLabelPersist(label)` 内部 `setFileLabel(label)` 并写入或删除 `localStorage["scene_pilot_last_file_label"]`，保证刷新后仍显示该名。

### 2.4 各场景下标题会变成什么

| 场景 | 标题来源 / 结果 |
|------|-----------------|
| 新建项目 | wizard 的 projectName 或 defaultProjectName → setLabelPersist(projectFileName)；标题为该名。 |
| Rename | renameDraft 确认 → runProjectAction("rename_confirm") → setFileLabel(trimmed) + setLabelPersist(trimmed) + updateProject(..., name: trimmed)；标题为 trimmed。 |
| Save | 不改变 projectLabel/fileLabel；标题不变。 |
| SaveAs | 不直接改 fileLabel；仅写入库目录名，标题不变。 |
| Duplicate | 新 project.name 来自 duplicateProject；setFileLabel(name) + setLabelPersist(name)；标题为新项目名。 |
| SaveAsTemplate | 不改变当前 project 的 name/fileLabel；标题不变。 |
| 打开项目库项目 | importLibraryEntryToEditor → setLabelPersist(entry.label)；标题为 entry.label。 |
| 从模板创建项目 | createProjectFromTemplate/UserTemplate 得到新 project.name；setFileLabel(name) + setLabelPersist(name)；标题为新项目名。 |
| 上传项目文件 | onUploadFile → setLabelPersist(f.name)；标题为文件名。 |

### 2.5 ExportPanel / 导出文件名 / Sidebar 标题是否一致

- **一致**。ExportPanel 的 `projectLabel` 由 App 传入 `fileLabel`（或非 Pro 布局同理）；导出文件名 `projectNameForFile = safeName(projectLabel || defaultProjectName(lang))`，与 Sidebar 标题同源（fileLabel || defaultProjectName），故标题与导出文件名一致。

---

## 3. Action Inventory

### A. 文件类

| 动作 | 位置 | 说明 |
|------|------|------|
| New | Sidebar 项目区块 | onNewProject → requestNewProject |
| Open | Sidebar 项目区块 | onOpenProject → fileInputRef.click() |
| Save | Sidebar 项目区块 | onSaveProject → runProjectAction("save") |
| SaveAs | Sidebar 项目区块 | onSaveAs → runProjectAction("save_as") |
| Duplicate | Sidebar 项目区块 | onDuplicateProject → runProjectAction("duplicate") |
| Rename | Sidebar 项目区块 | onRenameProject → requestRenameProject → confirm → runProjectAction("rename_confirm") |

### B. 模板类

| 动作 | 位置 | 说明 |
|------|------|------|
| SaveAsTemplate | Sidebar 项目区块 | onSaveAsTemplate → runProjectAction("save_as_template") |
| 其他 | 同区块下方有「模板」EditorSection（TemplateSidebarEntry、CurrentTemplateContext），打开模板工作台等 | 非“项目”区块内，但同属 Sidebar |

### C. 导出类

| 动作 | 位置 | 说明 |
|------|------|------|
| Copy Prompt | Sidebar 项目区块 | onCopyPrompt → handleCopyPrompt → openExportPanel("copy") |
| Export…（打开导出） | Sidebar 项目区块 | onExportProject → handleExportProject → openExportPanel("open") |
| Export txt / zip / project | 在 ExportPanel 内（弹窗或右侧操作区） | 不在项目区块内；由「导出…」打开 ExportPanel 后再选 |

### D. 项目库类

| 动作 | 位置 | 说明 |
|------|------|------|
| Project Library | Sidebar 项目区块 | onOpenLibrary → setLibraryOpen(true) + refreshLibraryEntries |

**建议归属（仅建议，未改代码）：**

- **适合放在“项目名下拉菜单”里**：Save、SaveAs、Rename、Duplicate、New、Open、Project Library（文件/库类主操作）。
- **更适合保留在 Sidebar 独立区或与“项目”平级**：Copy Prompt、Export…（导出与“文件”语义略不同，且会打开 ExportPanel）。
- **可收进二级/More**：SaveAsTemplate（低频、高级）；或保留在项目菜单底部带分隔。

---

## 4. ProjectControlBar Status

### 4.1 组件用途

- 提供**项目名 + ChevronDown** 的触发器，点击后展开**下拉菜单**，内含与当前 Sidebar 项目区块**相同的一组项目动作**（Save、Copy Prompt、Export、Open、Project Library、Rename、SaveAs、Duplicate、SaveAsTemplate、New），并带快捷键文案（⌘S、⇧⌘S、⌘O、⌘N 等）。支持 `variant="topbar"` 或 `"sidebar"`（sidebar 时显示 "ScenePilotix / {projectName}" 风格）。

### 4.2 里面原本设计了哪些项目动作

- 与 Sidebar 项目区块一致：Save、Copy Prompt、Export、Open、Project Library、Rename、SaveAs、Duplicate（可选）、SaveAsTemplate（可选）、New；顺序与分组（分隔线）也一致。

### 4.3 为什么当前没有在 App JSX 中渲染

- App 中仅 `import { ProjectControlBar } from "./components/ProjectControlBar"`，**没有任何 `<ProjectControlBar ... />` 或类似 JSX**。左侧项目相关 UI 完全由 **Sidebar** 内的「项目」EditorSection 承担；历史上可能计划用 ProjectControlBar 做 topbar 或 sidebar 的项目名下拉，但当前实现只用了 Sidebar 的展开区块，未挂载 ProjectControlBar。

### 4.4 如果现在重新挂载，会不会和 Sidebar 项目区块重复

- **会**。ProjectControlBar 与 Sidebar 项目区块动作集合、顺序、语义完全一致；若在同一个布局中同时挂载（例如 Sidebar 顶部用 ProjectControlBar、下面保留现有项目区块），则会出现两套入口（同一批动作出现两次）。除非：只保留其一（例如用 ProjectControlBar 替代 Sidebar 项目区块，或只在 topbar 用 ProjectControlBar 且 Sidebar 不再显示项目区块）。

### 4.5 Functional Audit v1 Step2 是否适合启用它

- **Step2 目标**是项目名与项目动作一致性、统一 runProjectAction、不重排 Sidebar/Workspace。  
- **建议**：Step2 **不适合**启用 ProjectControlBar。原因：  
  - 启用即需二选一：要么撤掉 Sidebar 项目区块，要么接受双入口；前者属于布局/结构变更，后者与“收敛入口”冲突。  
  - 当前已收敛到 runProjectAction + Sidebar 单一入口；再挂 ProjectControlBar 会重新引入双入口。  
- **更合适时机**：在后续 Step4 或单独“项目名菜单”重构时，再决定是用 ProjectControlBar 替代 Sidebar 项目区块，还是保留现状并仅做分组/文案/顺序优化。

---

## 5. UX Issues（信息架构判断）

基于当前真实 UI 的判断：

- **文件动作和导出动作混杂**：是。同一列中既有 Save/SaveAs/Open/Duplicate/Rename（文件语义），也有 Copy Prompt、Export…（导出/复制到剪贴板）；用户心智上“存盘”和“导出给外部用”常分开，当前混在一起。

- **高频和低频平铺**：是。Save、Rename、Duplicate、新建、打开/库 使用频率差异大，但都同一层级、同一视觉权重；SaveAsTemplate 与 Duplicate 相对低频，与 Save/Open 同级。

- **模板动作位置**：SaveAsTemplate 放在“另存/复制项目”之后、分隔线后“新建”之前；既不是“文件主操作”，也不是“最后一项”，位置略尴尬；主流产品里“保存为模板”多为二级或“更多”内。

- **项目名区域承担了过多操作**：是。标题仅“项目名/未命名项目”，下方却承担了 10 个操作（含 2 条分隔线），相当于把“文件菜单 + 导出快捷 + 库入口 + 模板”全压在一块；没有“项目名 + 下拉”的层级，所有操作平铺在区块内。

- **与主流产品菜单习惯不一致**：是。主流多为“项目名/文件名 → 点击展开下拉”，主操作（Save、Rename、Duplicate）在下拉内，导出/分享常在“文件”外或“分享/导出”入口；当前是“可折叠区块 + 一列按钮”，更像设置面板而非文件菜单。

- **对新用户**：按钮多且未分组命名（仅分隔线），需扫读才能理解“保存”和“导出”区别；“复制提示词”与“复制为新项目”都带“复制”，易混。

- **对重度用户**：无快捷键可见于该区块（快捷键在 ProjectControlBar 设计中有，但未挂载）；操作需多次点击展开再点按钮，效率一般。

---

## 6. Display Conditions / Permissions

- **区块整体**：显示条件为 `projectLabel != null && onSaveProject`；App 始终传，故不依赖登录、uid、Workspace 类型、媒体类型。  
- **各动作**：  
  - 均**不要求登录/uid** 才显示；SaveAsTemplate 会写 user 私有模板（用 accountUser?.id ?? "guest"），执行时用 uid，但按钮不因未登录隐藏。  
  - **Template Workspace / Pro Workspace**：右侧切换不影响 Sidebar；项目区块在两种 workspace 下同一套，无差异。  
  - **图片/视频模式**：项目区块内无根据 mediaType 显隐的按钮。  
  - **项目是否存在 / scenes 是否为空**：不依赖；始终显示。  
  - **onDuplicateProject / onSaveAsTemplate**：为可选 prop；App 当前传入，若某处不传则对应按钮不渲染（条件渲染），无“禁用”态。  
  - **fileLabel / project.name**：仅影响标题文案，不控制按钮显示。

---

## 7. Mainstream Comparison

- **项目名区域通常只承载什么**：Figma/Notion/Canva/Docs/VS Code 多为“文件名或项目名 + 下拉”，下拉内为**文件类**（Save、Save As、Duplicate、Rename、Move、Archive 等）和少量“分享/导出”入口；项目名区域本身不直接堆“导出格式”或“复制到剪贴板”的多种变体。

- **文件动作如何分层**：常见为“文件”或“…”下拉内一级：Save、Save As、Duplicate、Rename；二级或“更多”里：Move、Archive、Export 等；New/Open 常在顶部或独立入口。

- **导出是否与保存混放**：通常**不混**。Save 明确为“存盘”；Export/Share 单独入口或单独菜单（如“导出为…”“分享”），避免“保存”和“导出为 PDF”等同列同级。

- **“保存为模板”**：多在产品里为**高级/二级**（如“更多”里，或“文件 → 另存为模板”），很少与 Save/SaveAs 并列一级。

- **Duplicate / Rename / Move / Archive**：多在**文件菜单内**（项目名下拉或 File 菜单），与 Save/SaveAs 同层或下一层；不在侧栏平铺一长列。

与 ScenePilot 对比：当前 Sidebar 项目区块相当于把“文件菜单 + 导出快捷 + 库 + 模板”全部平铺在一列，且无“项目名下拉”层级，与上述习惯不一致。

---

## 8. Suggested Menu Structure（仅建议，不改代码）

### 方案 A：最小改动版

- **一级显示**（项目名区块内，保持现有一列，仅做顺序/分组微调）：  
  - 第一组：**Save**、**Save As**、**Rename**、**Duplicate**。  
  - 分隔线。  
  - 第二组：**Open**、**Project Library**、**New**。  
  - 分隔线。  
  - 第三组：**Copy Prompt**、**Export…**（仍在此区块，但明确视为“导出”组）。  
  - 分隔线。  
  - 第四组：**Save as Template**（视为高级，放最后）。  

- **收进“更多”**：无；保持全部一级，仅分组更清晰。  

- **不应放进项目名菜单**：无；所有动作仍可在项目区块内。  

- **保留在 Sidebar 独立区更合理**：Copy Prompt、Export… 若产品希望强调“导出与文件分离”，可考虑移到 Sidebar 其他区块（如“导出”区块），项目区块只保留纯文件+库+模板；方案 A 不强制移，仅分组。

### 方案 B：更合理版

- **一级显示（项目名下拉内，若未来用 ProjectControlBar 或等价下拉）**：  
  - **Save**、**Save As**、**Rename**、**Duplicate**、**New**、**Open**、**Project Library**。  
  - 分隔线。  
  - **Copy Prompt**、**Export…**（作为“导出”组，仍在下拉内但分组靠下）。  
  - 分隔线。  
  - **Save as Template**（或放入“更多”）。  

- **收进“更多”**：**Save as Template**（可选）；或 **Export…** 仅保留“打开 ExportPanel”，具体“导出 txt/zip/项目”留在 ExportPanel 内。  

- **不应放进项目名菜单**：无必须排除项；若产品希望“项目库”为独立入口，可保留在 Sidebar 独立按钮而非下拉内（方案 B 仍可放在下拉）。  

- **保留在 Sidebar 独立区更合理**：  
  - **Project Library**：可保留为 Sidebar 独立入口（与“项目名下拉”并列），减少下拉长度。  
  - **Copy Prompt / Export…**：若希望“项目名下拉”只做文件语义，可将两者移到 Sidebar 的“导出”或“操作”区块，项目名下拉只保留：Save、Save As、Rename、Duplicate、New、Open、（可选）Save as Template。

---

**以上为只读分析与建议，未修改任何代码、未生成 patch、未重构。**
