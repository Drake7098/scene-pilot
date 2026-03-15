# ScenePilot｜项目菜单 / 提示词复制导出 / 提示框右侧区域 结构查询（Functional Audit v1）

**阶段**: Functional Audit v1（只读，未改代码/schema/engine/UI）

---

## 一、左侧栏第一个项目名称区域

### 1. 相关组件文件路径

- **主入口**: `src/components/Sidebar.tsx`（约 1193–1257 行）
- **未使用**: `src/components/ProjectControlBar.tsx`（带下拉菜单的组件，在 App 中已 import 但**未在任何 JSX 中渲染**）

### 2. 当前 UI 结构

- 左侧栏最上方是一块 **可折叠的 EditorSection**（`EditorSection` 来自 `src/components/ui/EditorSection.tsx`）。
- **标题**: `(projectLabel || "未命名项目" / "Untitled Project").trim() || "未命名项目"`，即用 `projectLabel` 显示，空则显示「未命名项目」。
- **图标**: `FolderOpen`。
- **内容**: 一个竖排按钮列表（`styles.projectSectionBody`），**没有**下拉菜单 / popover / context menu。

### 3. 是否有下拉菜单 / popover / context menu

- **无**。当前实现是「可折叠区块 + 标题 + 一列按钮」，没有点击标题展开的下拉。
- `ProjectControlBar` 组件内部有下拉菜单（`projectMenuOpen` + 一列 menuItem），但该组件**未被使用**。

### 4. 当前菜单项与 handler

| 序号 | 按钮文案 (zh/en) | Handler | 说明 |
|------|------------------|--------|------|
| 1 | 保存项目… / Save Project... | `onSaveProject?.()` | → `saveToDisk()` |
| 2 | 复制提示词 / Copy Prompt | `onCopyPrompt?.()` | → `openExportPanel("copy")` |
| 3 | 导出… / Export... | `onExportProject?.()` | → `openExportPanel("open")` |
| 分隔线 | | | |
| 4 | 打开项目 / Open Project | `onOpenProject?.()` | → `fileInputRef.current?.click()`（上传 JSON） |
| 5 | 项目库 / Project Library | `onOpenLibrary?.()` | → 打开项目库弹层 |
| 6 | 重命名项目 / Rename Project | `onRenameProject?.()` | → `requestRenameProject()` |
| 7 | 另存项目… / Save Project As... | `onSaveAs?.()` | → `saveAsToDisk()` |
| 8 | 复制为新项目 / Duplicate Project | `onDuplicateProject?.()` | 条件渲染，有则显示 |
| 9 | 保存为模板 / Save as Template | `onSaveAsTemplate?.()` | 条件渲染，有则显示 |
| 分隔线 | | | |
| 10 | 新建项目 / New Project | `onNewProject?.()` | → `requestNewProject()` |

### 5. 项目名称编辑逻辑

- **重命名**：`App.tsx` 中 `requestRenameProject()` 打开重命名弹窗，`confirmRenameProject()` 只调用 `setLabelPersist(renameProjectDraft.trim() || defaultProjectName(lang))`。
- **只更新 UI 用标签**：`setLabelPersist` 会 `setFileLabel(label)` 并写入 `localStorage["scene_pilot_last_file_label"]`。
- **不写回 project**：重命名**不会**调用 `updateProject` 或修改 `project.name`，因此 `project.name` 与 `fileLabel` 可能不一致。

### 6. 当前是否支持（及实现程度）

| 能力 | 支持 | 实现程度 |
|------|------|----------|
| 新建项目 | ✅ | 完整：弹确认（未保存先保存/直接新建）→ CreateWizard 或直接 `openCreateWizard(false)` |
| 重命名 | ✅ | 仅改 `fileLabel` + localStorage，不改 `project.name` |
| 保存 | ✅ | 完整：选平台 → 保存到项目库（目录/文件） |
| 另存为 | ✅ | 完整：选平台 + 输入目录名 → `saveProjectToLibrary(platform, pickedName)` |
| 复制项目 | ✅ | 完整：`duplicateProject(safeProject)` → `updateProject(dup)` + 更新 fileLabel |
| 删除项目 | ❌ | 无「删除当前项目」；仅有「项目库」内删除某条库条目 `deleteLibraryEntry(entry)` |
| 从模板创建项目 | ✅ | 完整：模板工作台 Use Template → `createProjectFromTemplate` / `createProjectFromUserTemplate` |

### 7. 关键代码位置

- Sidebar 项目区块：`src/components/Sidebar.tsx` 约 1193–1257 行（`EditorSection` + 一列 `button`）。
- 重命名：`App.tsx` 中 `requestRenameProject`、`confirmRenameProject`、重命名弹窗（约 3589–3620 行）。
- `setLabelPersist` / fileLabel 初始化：`App.tsx` 约 467–473 行（`useState` 从 `scene_pilot_last_file_label` 读）、约 2700–2708 行（`setLabelPersist` 实现）。

---

## 二、项目创建 / 保存 / 另存 / 复制 调用链与状态

### 1. createBlankProject

- **定义**: `src/lib/projectCreation.ts` → `createBlankProject(): Project`
- **逻辑**: 生成 `proj_xxx` id、`generateNextProjectName({ prefix: "project" })` 作为 name，`defaultProject()` + `sanitizeProject`，`meta.sourceType: "blank"`。
- **调用**: 当前代码库中**未在 App 中直接调用**；新建项目走 CreateWizard → `buildProjectFromWizard`，名称来自 wizard 的 `projectName` 或 `defaultProjectName(lang)`。

### 2. createProjectFromTemplate

- **定义**: `src/lib/projectCreation.ts` → `createProjectFromTemplate(template, options?): Promise<Project>`
- **逻辑**: `loadTemplatePayloadById` → `applyPayloadToProject` → 新 id、`templateIdToSlug(template.id)` 为 prefix 生成 name，`meta.sourceType: "template"` 等。
- **调用**: `App.tsx` 中 `handleUseTemplateFromWorkspace`（约 1471 行）使用；市场模板用此，用户私有模板用 `createProjectFromUserTemplate`。

### 3. createProjectFromUserTemplate

- **定义**: `src/lib/projectCreation.ts` → `createProjectFromUserTemplate(userTemplate): Project`
- **逻辑**: 克隆 `userTemplate.projectSnapshot`，新 id、`generateNextProjectName({ prefix: userTemplate.slug || "user-template" })`，无扣费。
- **调用**: `App.tsx` 中 `handleUseTemplateFromWorkspace` 当 `isUserPrivateTemplate(indexOrItem)` 时使用。

### 4. duplicateProject

- **定义**: `src/lib/projectCreation.ts` → `duplicateProject(project): Project`
- **逻辑**: 深拷贝 project，新 id，`inferProjectNamePrefix(project.name ?? sourceTemplateSlug)` + `generateNextProjectName` 作为 name，`meta.sourceType: "duplicate"`。
- **调用**: `App.tsx` 中 `handleDuplicateProject()`（约 1505–1513 行）→ `updateProject(dup)`，并 `setFileLabel(name); setLabelPersist(name)`。

### 5. rename project 相关逻辑

- **入口**: Sidebar「重命名项目」→ `requestRenameProject()`。
- **流程**: `setRenameProjectDraft(fileLabel || defaultProjectName(lang))` → 打开重命名弹窗 → 用户确认 → `confirmRenameProject()` → `setLabelPersist(renameProjectDraft.trim() || defaultProjectName(lang))`。
- **仅更新**: `fileLabel` 状态 + `localStorage["scene_pilot_last_file_label"]`；**不**更新 `project.name` 或写入 `storage.saveProject(project)`。

### 6. save current project 相关逻辑

- **入口**: Sidebar / 快捷键「保存项目…」→ `saveToDisk()`。
- **流程**: `requestSavePlatform("save")`（若未锁定则选平台）→ `saveProjectToLibrary(pickedPlatform)`（不传目录名，用当前 `libraryProjectName` 或默认）→ 序列化项目 + 资源 → 写入 File System Access API 根目录下的项目目录或单文件，并 `setLastLibrarySavedSnapshot(currentLibrarySnapshot)`。
- **项目写入内存/本地**: 平时编辑的 `project` 由 App 的 `setProject`/`updateProject` 更新；**不**通过 `storage.saveProject(project)` 做自动保存到 localStorage（见下）。

### 7. 是否存在 save as 逻辑

- **有**。`saveAsToDisk()`：选平台、输入目录名（默认 `safeExportName(fileLabel || defaultProjectName(lang))`）→ `saveProjectToLibrary(pickedPlatform, pickedName)`，并锁定保存平台。

### 8. 是否存在项目删除逻辑

- **无「删除当前项目」**。
- **有**「删除项目库中的某一条」：`deleteLibraryEntry(entry)` 从 File System 目录中 `removeEntry(entry.name, { recursive: true })`。

### 9. 是否存在「打开项目列表后切换项目」的逻辑

- **有**。项目库弹层中选一条 → `importLibraryEntryToEditor(entry)`：若当前有未保存改动则先确认保存或放弃 → 从库中读项目文件/目录 → `restoreProjectAssetsFromLibrary` + `updateProject(opened)`，并 `setLabelPersist(entry.label)`、`setLastLibrarySavedSnapshot(...)`、关闭库弹层。

### 10. 单 project state / projects[] / 存储 / fileLabel 与 project.name / labelPersist

- **单 project state**：App 中仅有一个 `project`（及 `setProject`/`updateProject`），无 `projects[]` 或内存中的项目列表。
- **项目列表**：仅「项目库」来自 File System Access API 的目录列表（`libraryEntries`），不是内存数组。
- **localStorage**：`src/utils/storage.ts` 中 `KEY_PROJECT = "scenepilot_project"`；`loadProject()` / `saveProject(project)` 读写**单个** project JSON。当前 App **未在用户操作路径上调用 `saveProject(project)` 做自动保存**（即没有「每隔 N 秒写入 localStorage」的逻辑）。
- **fileLabel 与 project.name**：`fileLabel` 是界面显示用的「当前项目名称」，初始来自 `localStorage["scene_pilot_last_file_label"]`；`project.name` 在 `createBlankProject` / `createProjectFromTemplate` / `duplicateProject` / `buildProjectFromWizard` 时被设置。重命名只改 `fileLabel`，二者可不同步。
- **labelPersist**：即「把 fileLabel 持久化」的封装：`setLabelPersist(label)` 会 `setFileLabel(label)` 并写入或清除 `scene_pilot_last_file_label`。

### 11. 谁负责写入、自动保存、默认名

- **项目写入唯一入口（内存）**：`updateProject` / `setProject`。
- **项目写入磁盘（项目库）**：`saveProjectToLibrary(platformId, projectDirName?)`（内部 `serializeProjectForLibrary` + File System API 写文件/目录）。
- **自动保存**：当前**没有**基于时间的自动保存；未实现「定期 `saveProject(project)` 到 localStorage」或自动写入项目库。
- **默认项目名**：`defaultProjectName(lang)`（`src/utils/naming.ts`）；新建/另存/重命名时的默认名来自 wizard 的 `projectName`、`fileLabel` 或 `defaultProjectName`。

---

## 三、提示词区域整体结构

### 1. Prompt 面板组件文件路径

- **Pro 工作台内「提示词预览」Tab**：`src/features/pro-workspace/components/PromptPreviewPanel.tsx`（组合 PromptOverviewSection、PromptBreakdownSection、PromptSourceSection、PromptWarningSection、PromptMetaSection）。
- **右侧整块「提示词 + 导出」面板（非 Pro 布局）**：`src/components/ExportPanel.tsx`，在 App 中放在 `styles.proPromptZone` 中直接渲染（约 4221–4240 行）。

### 2. 提示词文本区域组件

- **ExportPanel**：左侧列 `styles.leftColumn` 内，`styles.promptPane` + `pro-prompt-readonly`，展示 `displayPromptMain` / `displayPromptNotes`（来自 `promptsMain` / `promptsNotes`，即 `runPromptEngine(...).finalCopyPrompt` 经 `splitMachineNotes` 拆分），可展开/收起。
- **PromptPreviewPanel**：内部 `PromptOverviewSection` 的 `<pre>` 展示 `prompt`（`buildPromptForScene(...).finalCopyPrompt`）。

### 3. 右侧按钮区域组件

- **ExportPanel**：`styles.rightColumn`（固定宽度 220px）内：
  - `primaryActions`：两个主按钮「复制提示词」「导出提示词 + 参考图」；
  - `moreExportWrap`：「更多导出」下拉（下载 prompt.txt、完整项目包）；
  - `platformModeBlock`：PlatformModePanel（平台、导出模式等）。

### 4. 是否存在 ResultConsole / PromptPanel / ExportPanel / PromptCard / PromptActions

- **ExportPanel**：存在，`src/components/ExportPanel.tsx`，即「导出 + 提示词预览 + 复制/导出按钮」一体。
- **PromptPreviewPanel**：存在，Pro 里「提示词预览」Tab 的面板。
- **PromptOverviewSection**、**ExportCopySection**、**ExportActionSection**：存在，分别为 Pro 内「完整提示词+复制」、Export 里「复制提示词」、Export 里「导出动作」。
- **ResultConsole**：未以该命名出现；结果/生成相关是别的命名（如 Pro 画布下方生成区）。
- **PromptActions**：无单独组件名；动作分散在 ExportPanel 右侧列、ExportControlPanel、以及 Pro 底部/侧边按钮。

### 5. 提示词区域布局

- **非 Pro 布局**（`styles.proPromptZone`）：上方画布/PropsPanel，下方一整块 ExportPanel；ExportPanel 内部为 `splitLayout`：左列提示词预览，右列 220px 宽「生成与导出」按钮 + 更多导出 + 平台/模式。
- **Pro 布局**：ProWorkspaceShell → ProWorkspaceNav + ProWorkspaceEditor + ProWorkspaceStatusRail；ExportPanel 通过 `exportPanelSlot` 以不可见方式挂载（用于弹窗），右侧栏是 ProWorkspaceStatusRail；提示词预览在 ProWorkspaceEditor 的「提示词预览」Tab（PromptPreviewPanel）。

### 6. 右侧拥挤原因（结构层面）

- **右列固定 220px**：`rightColumn` 宽度固定，所有主操作、次操作、平台/模式都挤在这一列。
- **主操作与「更多导出」同列**：复制、导出提示词+参考图、更多导出（下载 prompt.txt、完整项目包）竖向堆叠，无主次分组。
- **平台/导出模式与复制/导出混在一起**：PlatformModePanel 在同一个 rightColumnScroll 内，视觉上未与「复制/导出」分层。
- **Pro 与非 Pro 两套入口**：Pro 有 ExportControlPanel（复制、导出、生成）+ 底部 Slot 的复制/导出；非 Pro 有 ExportPanel 同一块区域；两处都调用同一 `openExportPanel("copy")` / `openExportPanel("open")`，但 UI 分散。
- **无统一 drawer / more menu / segmented actions**：ExportPanel 只有一个「更多导出」下拉，其余都是单列按钮，没有按「主操作 / 次操作 / 设置」分组的布局或折叠区。

### 7. 按钮同行 vs 堆叠

- **同行**：无；右侧列内按钮均为竖向排列（`flexDirection: "column"`, `gap: 6` / `gap: 8`）。
- **堆叠**：复制提示词、导出提示词+参考图 → 更多导出 → 平台/模式，全部在 `rightColumnScroll` 内垂直排列。

### 8. 响应式/折叠逻辑

- **有**：提示词预览区有「展开完整内容 / 收起」；PlatformModePanel 有 `collapsed` / `onToggle`；ExportPanel 的「更多导出」为下拉展开。
- **无**：右侧列宽度不随视口变化，没有在小屏下把右侧按钮收进一个「操作」抽屉的逻辑。

---

## 四、复制提示词 / 导出提示词 / 保存提示词 / 保存提示词+参考图

### 1. 复制提示词

- **按钮位置**：  
  - 左侧栏项目区块「复制提示词」；  
  - ExportPanel 右侧「复制提示词」主按钮；  
  - Pro 底部/ExportControlPanel「复制」区块（ExportCopySection）、「导出动作」区块（ExportActionSection）的「复制后发送到平台」；  
  - Pro 生成区旁的「复制提示词」按钮（App 约 3941、3949 行）；  
  - PromptPreviewPanel 内 PromptOverviewSection 的「复制」。
- **文案**：多为「复制提示词」/「Copy Prompt」或「复制」/「Copy」。
- **Handler**：  
  - 项目菜单 / Export 入口：`onCopyPrompt()` → `openExportPanel("copy")` → ExportPanel 的 `useEffect` 中 `guardBeforeExport("copy")` → 无冲突则 `runCopyPrompt()` → 弹复制确认框 → `confirmCopyPrompt()` → `copy(quickCopyPrompt)`（`navigator.clipboard.writeText`）；有冲突则先弹冲突弹窗。  
  - PromptOverviewSection：无 `onCopy` 时用默认 `defaultCopy`，直接 `navigator.clipboard.writeText(prompt)`，无冲突检查、无弹窗。
- **复制内容**：  
  - 均为**当前（或当前连续序列）的、平台适配后的最终提示词**：`runPromptEngine(...).finalCopyPrompt`（ExportPanel）或 `buildPromptForScene(...).finalCopyPrompt`（PromptPreviewPanel），即**当前语言、当前平台、当前导出范围**下的纯文本；**非**原始 rawPrompts，**非**结构化 JSON。

### 2. 复制提示词文件（下载为文件）

- **存在**。ExportPanel「更多导出」→「下载 prompt.txt」→ `runOpenSaveModal("prompt_only")` → 导出弹窗中选「提示词 TXT」后提交 → `downloadQuickPromptFile()`。
- **格式**：单文件 **txt**（`flowBundle.promptText`，即 `quickCopyPrompt + "\n"`），MIME `text/plain;charset=utf-8`。
- **文件名**：`flowBundle.quickPromptFileName` = `${projectNameForFile}__${shotNameForFile}__${platformForFile}__prompt.txt`（例如 `项目名__分镜01__Universal__prompt.txt`）。
- **谁生成**：ExportPanel 内 `flowBundle` useMemo，以及 `downloadQuickPromptFile` 里 `new Blob([flowBundle.promptText], ...)` + 创建 a 标签 download。

### 3. 保存提示词

- **当前含义**：在本文脉里「保存提示词」被用作「导出为文件」或「复制到剪贴板」，**不是**「保存到本地项目」或「保存到云端」的单独动作。
- **导出为 TXT**：见上「下载 prompt.txt」。
- **保存到项目库**：「保存项目」/「另存为」保存的是**整个项目**（JSON + 资源），不是「只保存提示词」；项目 JSON 内含场景/对象等，导出到项目库时会带 `exportProfile.platformId` 等。
- **内容**：prompt 为平台适配后的 `finalCopyPrompt`；项目库中的项目文件包含完整 project + assets（参考图 dataUrl），元信息在 `exportProfile` 和 project.meta 中。

### 4. 保存提示词 + 参考图

- **存在**。ExportPanel 主按钮「导出提示词 + 参考图」→ `runExportPromptPlusRefs()`。
- **打包方式**：`downloadFlowZipPackage(promptPlusRefsBundle)`，生成 **ZIP**；bundle 内含 prompt.txt、refs-manifest.txt、README、以及各场景背景与对象参考图的 blob 文件（路径按 sceneTag、BG/OBJ 等规则命名）。
- **参考图来源**：当前导出范围的 scene 的 `backgroundRef` 与各 layer 的 `localRefs`（来自 IndexedDB `getRefBlob(refId)`）。
- **逻辑**：完整：冲突检查 → 可选扣费/预留 → 构建 promptPlusRefsBundle（prompt + manifest + 所有 ref blobs）→ buildZipStored → 下载 ZIP。

### 5. 提示框按钮与 Export UI / Prompt UI / Platform Adapt UI 是否共享逻辑

- **共享**：  
  - 「复制提示词」多处最终都指向「同一段平台适配后的 prompt」；项目菜单 / Pro 底部 / ExportPanel 的复制都走 `openExportPanel("copy")` → ExportPanel 的 `guardBeforeExport("copy")` → `runCopyPrompt` / `confirmCopyPrompt`。  
  - ExportControlPanel 的「复制」与「导出」传的是 App 的 `onCopyPrompt` / `onExport`，即同样 `openExportPanel("copy")` / `openExportPanel("open")`。
- **重复**：  
  - 「复制」在：Sidebar 项目区、ExportPanel 右侧主按钮、Pro ExportControlPanel 的 ExportCopySection、ExportActionSection 的「复制后发送到平台」、Pro 生成区旁两个按钮、PromptOverviewSection 的复制。  
  - 前几处统一走 ExportPanel 的复制流程（可有冲突检查+确认弹窗）；PromptOverviewSection 的复制**未**走该流程，直接写剪贴板，与「复制提示词」语义重复。
- **可收敛**：  
  - 将「复制」统一为一个入口（例如只从 ExportPanel/Export 控制中心触发），或让 PromptOverviewSection 的复制也走 `onCopy` 回调（即打开 ExportPanel copy 或统一 copy 服务）；  
  - 「导出」与「复制」在 Export 面板内已在一起，但和项目菜单、Pro 底部/侧栏多处重复入口，可收敛为「项目菜单 + 一个导出/复制中心」。

---

## 五、按钮与菜单全量清单

### A. 左上/左侧项目名称相关区域（Sidebar 项目区块）

| 文案 | 所在组件 | Handler | 状态 |
|------|-----------|--------|------|
| 保存项目… | Sidebar EditorSection | onSaveProject → saveToDisk | 可用，完整 |
| 复制提示词 | 同上 | onCopyPrompt → openExportPanel("copy") | 可用，完整 |
| 导出… | 同上 | onExportProject → openExportPanel("open") | 可用，完整 |
| 打开项目 | 同上 | onOpenProject → fileInputRef.click() | 可用，完整 |
| 项目库 | 同上 | onOpenLibrary → setLibraryOpen(true)+refresh | 可用，完整 |
| 重命名项目 | 同上 | onRenameProject → requestRenameProject | 可用，仅改 fileLabel |
| 另存项目… | 同上 | onSaveAs → saveAsToDisk | 可用，完整 |
| 复制为新项目 | 同上 | onDuplicateProject → handleDuplicateProject | 可用，完整 |
| 保存为模板 | 同上 | onSaveAsTemplate → handleSaveAsTemplate | 可用，完整 |
| 新建项目 | 同上 | onNewProject → requestNewProject | 可用，完整 |

说明：**ProjectControlBar**（带下拉的「项目名 + ChevronDown」）已在代码中但**未在 App 中渲染**，故当前没有「项目名下拉菜单」这一 UI。

### B. 提示词 / 导出区域

| 文案 | 所在组件 | Handler | 状态 | 是否与其他重复 |
|------|-----------|--------|------|----------------|
| 复制提示词 | ExportPanel 右侧主按钮 | guardBeforeExport("copy") | 可用 | 与项目菜单、Pro 多处「复制」同逻辑 |
| 导出提示词 + 参考图 | ExportPanel 右侧主按钮 | runExportPromptPlusRefs | 可用 | 与「更多导出」内「完整项目包」部分重叠 |
| 更多导出 | ExportPanel 右侧 | 展开下拉 | 可用 | - |
| 下载 prompt.txt | ExportPanel 更多导出 | runOpenSaveModal("prompt_only") | 可用 | 独立 |
| 完整项目包 | ExportPanel 更多导出 | runOpenSaveModal("package") | 可用 | 与主按钮「导出提示词+参考图」同范围时重叠 |
| 复制 | PromptPreviewPanel → PromptOverviewSection | defaultCopy(prompt) | 可用 | 与「复制提示词」同内容，但无冲突/确认流程 |
| 复制提示词 | ExportControlPanel → ExportCopySection | onCopy → onCopyPrompt | 可用 | 与项目菜单/ExportPanel 复制重复 |
| 复制后发送到平台 | ExportControlPanel → ExportActionSection | onCopy → onCopyPrompt | 可用 | 同上，文案不同 |
| 导出 | ExportControlPanel → ExportActionSection | onExport → openExportPanel("open") | 可用 | 与项目菜单「导出」重复 |
| 复制提示词 / 导出 | Pro 生成区旁（App 内） | openExportPanel("copy")/("open") | 可用 | 同上 |

---

## 六、提示词框右侧拥挤的结构性原因

1. **右列固定 220px**：所有操作挤在一列，无法用多列或横向分组缓解。
2. **主操作与次操作同列竖排**：复制、导出+参考图、更多导出、平台/模式在同一垂直流里，没有「主操作一行 + 次操作折叠/更多」的分层。
3. **提示词展示与操作区仅左右分栏**：左侧预览、右侧 220px 按钮，没有把「仅复制/导出」与「平台/模式设置」分块或折叠，导致一屏内元素过多。
4. **Pro / 非 Pro 两套入口叠加**：Pro 有 ExportControlPanel（复制、导出、生成）+ 底部 Slot 的复制/导出；非 Pro 有 ExportPanel；功能重叠但布局分散，加重「很多按钮」的感觉。
5. **缺少统一的「主操作 / 更多」结构**：没有 drawer、统一的「更多」菜单或分段式操作组，所有动作都平铺在右侧一列。

---

## 七、需重点贴出的文件与片段

- **App.tsx**  
  - 项目名/保存/复制相关：fileLabel 初始化（467–473）、setLabelPersist（2700–2708）、saveToDisk/saveAsToDisk（2733–2748）、openExportPanel（597–599）、handleDuplicateProject（1505–1513）、requestRenameProject/confirmRenameProject（2017–2025）、Sidebar 传入的 projectLabel 与 on*（3702–3720）、Pro 的 onCopyPrompt/onExport（3828–3829）、ExportPanel 渲染与 openExportAction（4040–4055、4221–4240）。
- **左侧栏项目名区域**：`src/components/Sidebar.tsx` 约 1193–1257 行（EditorSection + 项目区块按钮列表）。
- **Prompt 面板主组件**：`src/features/pro-workspace/components/PromptPreviewPanel.tsx`（整文件）；`src/components/ExportPanel.tsx`（左侧 promptPane + 右侧 rightColumn）。
- **Prompt 按钮区**：ExportPanel 内 `styles.rightColumn`（约 996–1074 行）：primaryActions、moreExportWrap、platformModeBlock。
- **Export UI**：`src/components/ExportPanel.tsx`（整体）；`src/features/pro-workspace/components/ExportControlPanel.tsx`（组合各 Section）；ExportCopySection、ExportActionSection。
- **Platform Adapt UI**：`src/features/pro-workspace/components/PlatformAdaptPanel.tsx`。
- **projectCreation.ts**：`src/lib/projectCreation.ts`（createBlankProject、createProjectFromTemplate、createProjectFromUserTemplate、duplicateProject、generateNextProjectName、inferProjectNamePrefix）。
- **storage.ts**：`src/utils/storage.ts`（loadProject、saveProject、KEY_PROJECT）。
- **复制/导出相关**：ExportPanel 内 `guardBeforeExport`、`runCopyPrompt`、`confirmCopyPrompt`、`copy(quickCopyPrompt)`（约 402–424、431–441 行）；`downloadQuickPromptFile`、`downloadFlowZipPackage`、`runExportPromptPlusRefs`（约 871–913 行）；App 的 `copyToClipboard`（3218–3230）。

---

## 八、总结

1. **左上/左侧项目名称菜单当前真实功能**：可折叠区块 + 10 个操作（保存、复制提示词、导出、打开项目、项目库、重命名、另存为、复制为新项目、保存为模板、新建项目）；**无**下拉菜单（ProjectControlBar 未渲染）。
2. **缺失或半实现**：重命名只改 `fileLabel` 不改 `project.name`；无「删除当前项目」；无基于时间的自动保存；`ProjectControlBar` 未使用。
3. **项目保存模型**：**单项目**；内存中仅一个 `project`；项目库为磁盘（File System Access API）列表；localStorage 仅一个 key 存 project、一个 key 存 fileLabel。
4. **提示词复制/导出/保存的分散情况**：复制有多处入口（项目菜单、ExportPanel、Pro Export 与生成区、PromptOverviewSection），其中大部分走 `openExportPanel("copy")`，PromptOverviewSection 单独直接写剪贴板；导出为 TXT/ZIP 与「提示词+参考图」在 ExportPanel 内实现，与项目菜单「导出」、Pro「导出」共享同一 open 逻辑。
5. **明显重复的按钮**：「复制提示词」与「复制」/「复制后发送到平台」多处；「导出」与「导出提示词+参考图」/「完整项目包」入口多处。
6. **提示词框右侧拥挤的主因**：右列固定 220px、主/次操作与平台设置同列竖排、无主次分层或折叠、Pro/非 Pro 两套入口叠加、缺少统一「主操作 + 更多」结构。
7. **后续优先改哪一层建议**：  
   - **提示词动作收敛**：统一「复制」入口与流程（含冲突与确认），避免 PromptOverviewSection 与 Export 双轨；合并「导出」入口为单一导出/复制中心。  
   - **右侧布局重构**：右列主操作（复制/导出）与「更多」/平台模式分层或折叠，或增加 drawer。  
   - **项目菜单**：如需「项目名下拉」可启用并接入现有 ProjectControlBar，或统一为单一项目名 + 下拉；同时考虑重命名写回 `project.name` 与一致性。  
   - **导出逻辑收敛**：在保持现有 ExportPanel 能力的前提下，将「下载 prompt.txt」「完整项目包」「导出提示词+参考图」收敛到同一导出流程与文案，减少重复入口。

（以上为只读结构查询与结论，未修改任何代码、schema、engine 或 UI。）
