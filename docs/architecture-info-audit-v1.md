# ScenePilot 架构信息收集（Functional Audit v1 · 只读）

**目的**：确认 Project / Prompt / Template / Continuity / Pricing / User / Engine 的真实结构。  
**约束**：仅输出信息，未修改任何代码。

---

## 一、Project 系统结构

### 1. 项目数据结构定义

- **Project type 定义位置**：`src/model.ts`（约 198–208 行）。

**包含字段（完整）：**

| 字段 | 是否在 Project 上 | 说明 |
|------|------------------|------|
| name | ✅ | `name?: string`，显示名，创建/复制时设，用户可重命名 |
| id | ✅ | `id?: string`，稳定项目 id |
| scenes | ✅ | `scenes: Scene[]` |
| continuity | ✅ | `continuity?: ProjectContinuity`，来自 payload.continuity（模板应用时） |
| template | ❌ | 无 `template` 字段；当前模板信息在 `meta.currentTemplate` |
| label | ❌ | 无 `label` 字段 |
| fileLabel | ❌ | 非 Project 字段；为 App 内 state，见下 |
| labelPersist | ❌ | 非 Project 字段；为“写入 fileLabel + localStorage”的封装，见下 |
| createdAt | ❌ | 无 |
| updatedAt | ❌ | 无 |

**Project 完整类型：**

```ts
export type Project = {
  id?: string;
  name?: string;
  project: { mode: Mode; mediaType?: MediaType; shotPlan?: ShotPlan; creativeContext?: ProjectCreativeContext };
  scenes: Scene[];
  meta?: ProjectMeta;
  continuity?: ProjectContinuity;
};
```

- **fileLabel**：App 内 `useState<string>`，初始值来自 `localStorage.getItem("scene_pilot_last_file_label")`（`src/App.tsx` 约 467–473 行）。  
- **labelPersist**：App 内函数 `setLabelPersist(label)`，写 `setFileLabel(label)` 并写/删 `scene_pilot_last_file_label`（约 2714–2722 行）。

### 2. 当前项目保存逻辑位置

| 动作 | 实现函数 | 文件路径 |
|------|----------|----------|
| Save | `saveToDisk` | `src/App.tsx` |
| SaveAs | `saveAsToDisk` | `src/App.tsx` |
| Duplicate | 逻辑在 `runProjectAction("duplicate")`，内部调 `duplicateProject(safeProject)` | `duplicateProject` 在 `src/lib/projectCreation.ts`；入口与状态更新在 `src/App.tsx` |
| SaveAsTemplate | `saveCurrentProjectAsTemplate(uid, safeProject)`，由 `runProjectAction("save_as_template")` 调用 | `saveCurrentProjectAsTemplate` 在 `src/lib/userTemplatesStore.ts`；调用在 `src/App.tsx` |
| Rename | `runProjectAction("rename_confirm", { renameDraft })` 内更新 project.name + fileLabel + labelPersist；弹窗确认为 `confirmRenameProject` | `src/App.tsx` |

- **写入磁盘（项目库）**：`saveProjectToLibrary(platformId, pickedName?)` 在 `src/App.tsx`；`storage.saveProject(project)` 在 `src/utils/storage.ts`（单 key `scenepilot_project`），当前 App 未在用户操作主路径上调用 `saveProject` 做自动保存。

### 3. fileLabel / labelPersist 来源

- **定义**：`fileLabel` 为 App 的 state（`useState`，初始从 localStorage 读）；`labelPersist` 为函数 `setLabelPersist`。  
- **写入**：`setLabelPersist(label)` 写 memory 的 `fileLabel` 并写/删 `localStorage["scene_pilot_last_file_label"]`；在重命名确认、从模板/复制创建后设 name、打开库项目后设 entry.label、上传文件后设 f.name 等处调用。  
- **读取**：App 初始化时从 `scene_pilot_last_file_label` 读；Sidebar/ExportPanel 等通过 props `projectLabel={fileLabel || defaultProjectName(lang)}` 使用。  
- **多来源**：是。fileLabel 可由重命名、新建/复制/从模板创建、打开库项目、上传 JSON 等不同路径设置；单一 key，后写覆盖。

---

## 二、项目动作入口

**触发项目动作的 UI：**

| 组件名 | 文件路径 | 触发函数名（或 prop） |
|--------|----------|------------------------|
| Sidebar | `src/components/Sidebar.tsx` | `onSaveProject`, `onRenameProject`, `onSaveAs`, `onDuplicateProject`, `onSaveAsTemplate`（均为 props，由 App 传入） |
| ProjectControlBar | `src/components/ProjectControlBar.tsx` | `onSaveProject`, `onRenameProject`, `onSaveAs`, `onDuplicateProject`, `onSaveAsTemplate`（同上）；组件在 App 中 **仅 import，未在 JSX 中渲染**） |

- **ProjectControlBar**：未在 App 中挂载，故当前无“项目名下拉菜单”的 UI；项目相关操作仅通过 **Sidebar** 内「项目」区块的按钮触发。  
- **TopBar / ProjectMenu / DropdownMenu**：未发现独立 TopBar 项目菜单；ProjectControlBar 若挂载则可视为 dropdown，当前未用。  
- **Workspace**：ProWorkspaceShell / TemplateWorkspace 不直接提供 Save/Rename/Duplicate/SaveAsTemplate；这些由 Sidebar 提供。

**当前是否有多入口：**

- **Save**：入口统一为 `runProjectAction("save")`（Sidebar onSaveProject、快捷键、createNewProjectAfterSave、ensureReadyForLibraryOpen）。  
- **Rename**：仅 Sidebar 的「重命名项目」→ `requestRenameProject` 打开弹窗，确认 → `confirmRenameProject` → `runProjectAction("rename_confirm", ...)`。  
- **Duplicate**：仅 Sidebar 的「复制为新项目」→ `handleDuplicateProject` → `runProjectAction("duplicate")`。  
- **SaveAsTemplate**：仅 Sidebar 的「保存为模板」→ `handleSaveAsTemplate` → `runProjectAction("save_as_template")`。  
- **SaveAs**：仅 Sidebar 的「另存项目…」→ `runProjectAction("save_as")`。  

不存在多套并行的 save/rename/duplicate 实现；均为单一入口经 `runProjectAction` 或代理到它。

---

## 三、Prompt 输出系统

- **Prompt 生成入口**：  
  - `generatePrompts(project, lang, profile)`：`src/utils/prompt.ts`（约 884 行）。  
  - `runPromptEngine(input)`：`src/utils/promptEngine.ts`（约 619 行），内部用 `runPromptPipeline` + 按 route 做 engine 变换与 contract。  
  - `buildPromptForScene({ project, scene, lang, platformId, profile?, workspace? })`：`src/utils/promptEngine.ts`（约 645 行），将 project 收窄为单 scene 后调 `runPromptEngine`。

- **generatePrompts 位置**：`src/utils/prompt.ts`，`export function generatePrompts(project: Project, lang: Lang, profile: PromptProfile = "universal"): string`。被 `src/utils/promptPipeline.ts`（及旧 `promptPipeline.js`）的 pipeline 使用。

- **ExportPanel 用的 prompt 来源**：ExportPanel 内 `promptPipeline = runPromptEngine({ project: promptProject, lang, profile: exportProfile, platformId: platformPresetId, scope: exportScope })`，`quickCopyPrompt = promptPipeline.finalCopyPrompt.trimEnd()`；即 **runPromptEngine** 的 `finalCopyPrompt`。`promptProject` 由当前 project 按 exportScope 截成单 scene 或连续 scenes。  
- **调用链**：ExportPanel → `runPromptEngine` → `runPromptPipeline`（promptPipeline.ts）→ `generatePrompts`（prompt.ts）+ `adaptPromptToPlatformDetailed`（platformAdapter）等 → promptEngine 内 `transformByEngine` / `enforceRouteContract` → `finalCopyPrompt`。

- **Prompt 是否直接依赖 project.name**：否。`generatePrompts` 与 `runPromptEngine` 未使用 `project.name`；导出文件名等用 `projectLabel`（来自 App 的 fileLabel），由 ExportPanel 的 prop `projectLabel` 传入。  
- **Prompt 是否依赖 template**：间接。project 的 scenes/layers/config 可能来自模板应用；pipeline 不直接读 `meta.currentTemplate`，但 project 结构受 template 影响。  
- **Prompt 是否依赖 continuity**：仅一句占位（“transition/continuity logic”）；不读 `project.continuity` 或 continuityId。  
- **Prompt 是否依赖 engine**：是。`runPromptEngine` 内 `resolvePromptEngineRoute`、`transformByEngine`、`enforceRouteContract` 按 workspace/mediaMode 选 route 和 engine 并做变换。

---

## 四、Continuity 系统

- **continuity 数据在 Project 里还是 Scene 里**：  
  - **Project**：`project.continuity?: ProjectContinuity`（model.ts），来自模板 payload。  
  - **Scene**：无 `continuity` 字段；有 `entryDir`、`exitDir`、`transitionType`、`inheritFromPrevious` 等，continuity 视图模型从这些推导。  
  - **Layer**：无 `continuity` 字段；`notes` 中可含 `@continuityId:xxx`，由 `continuityViewModel` / stage 等解析。

- **continuity type 定义**：  
  - `ProjectContinuity`：`src/model.ts`（约 189–196 行）。  
  - `TemplateContinuity`：`src/template-engine/types/templatePayload.ts`。  
  - 无单独 “Continuity” 业务 type；UI 用 `ContinuityViewModel`（`src/utils/continuityViewModel.ts`）。

- **continuity UI 组件**：`ContinuityPanel`，`src/components/ContinuityPanel.tsx`；仅在 **Sidebar** 内渲染（Sidebar.tsx 约 1756–1767 行）。当 `project.project?.mediaType === "image"` 时 `return null`，故图片项目下不显示。

- **continuity 是否参与 prompt**：仅一句占位；不读 project.continuity 或 layer continuityId 参与生成正文。  
- **continuity 是否参与 template**：是。模板 payload 可有 `continuity`（TemplateContinuity）；apply 时写入 `project.continuity`；webdrama/anime continuity 模板会设 scene/layer 的继承与方向等。  
- **continuity 是否参与 export**：导出逻辑不直接读 `project.continuity`；导出的是 runPromptEngine 结果与资源，continuity 通过 project 结构间接影响 prompt 内容。

---

## 五、Template 系统

- **Template type 位置**：  
  - **TemplateIndex**：`src/template-engine/types/templateIndex.ts`（或 `src/features/template-workspace/model/templateIndex.ts` 若存在）；轻量索引。  
  - **TemplatePayload**：`src/template-engine/types/templatePayload.ts`；含 projectDefaults、scenes、objects、continuity、exportDefaults。  
  - **UserPrivateTemplate**：`src/lib/userTemplatesStore.ts`；用户“我创建的”模板，含 projectSnapshot。

- **Template 是否是 Project 的子集**：概念上 TemplatePayload 描述可应用到 project 的默认与场景等；不是 Project 的 TypeScript 子类型；apply 后得到 Project。

- **SaveAsTemplate 做了什么**：`saveCurrentProjectAsTemplate(userId, project)`（`src/lib/userTemplatesStore.ts`）：生成 name/slug/id，克隆 project 为 snapshot，写入 localStorage（key `scenepilot_user_templates_{userId}`），返回 UserPrivateTemplate；App 再设 libraryHint、刷新模板列表、打开模板工作台并选中新模板。

- **UseTemplate 做了什么**：从模板工作台或 Sidebar 选模板后，App 的 `handleUseTemplateFromWorkspace` 根据是市场模板还是用户私有调 `createProjectFromTemplate` 或 `createProjectFromUserTemplate`（`src/lib/projectCreation.ts`），得到新 Project，`updateProject` + 设 fileLabel/labelPersist，关模板工作台；市场模板会走定价/扣费，用户私有不扣费。

- **Template 是否影响 project.name**：是。从模板创建时 `projectCreation` 用 `generateNextProjectName({ prefix: slug })` 等设 project.name；App 并设 fileLabel。  
- **Template 是否影响 prompt**：间接。应用模板会改 project/scenes/layers，prompt 基于 project 生成，故受影响。  
- **Template 是否影响 continuity**：是。payload 可带 `continuity`，apply 时写入 `project.continuity`；continuity 模板会设 scene 继承与方向。  
- **Template 是否影响 pricing**：是。使用市场模板可能扣费；pricing 在 `src/pricing`、`src/template-engine/billing`、`src/features/billing` 等处理。

---

## 六、Engine / Adapter / Rule

- **当前 engine 类型**：  
  - **Prompt engine**：`runPromptEngine`（promptEngine.ts）；route 为 `quick_image` | `quick_video` | `pro_image` | `pro_video`；`transformByEngine`、`resolvePromptEngineRoute`、`resolvePromptEngineId`、`enforceRouteContract`。  
  - **Platform adapter**：`adaptPromptWithPlatformEngine`（`src/utils/promptEngines`）、`adaptPromptToPlatform` / `adaptPromptToPlatformDetailed`（`src/utils/platformAdapter.ts`），对 prompt 做平台适配。

- **prompt engine 位置**：`src/utils/promptEngine.ts`（runPromptEngine、buildPromptForScene、transformByEngine、resolvePromptEngineRoute 等）；pipeline 在 `src/utils/promptPipeline.ts`；platform 适配在 `src/utils/platformAdapter.ts` 与 `src/utils/promptEngines/`。

- **export adapter 位置**：无单独“export adapter”命名；导出流程在 `src/components/ExportPanel.tsx`（runPromptEngine、downloadFlowZipPackage、downloadQuickPromptFile、saveProjectToLibrary 等由 App 提供或内部实现）；平台/文件名等用 `projectLabel` 与 platform preset。

- **rule / conflict / eval 位置**：  
  - **Field keys（规则用）**：`src/rules/fieldKeys.ts`（FIELD_KEYS、PROJECT_KEYS 等）。  
  - **Conflict**：`src/utils/conflictRules.ts`（`detectSceneConflicts`）；ExportPanel、ConstraintInspectorPanel、PropsPanel、PromptPreviewPanel 等使用。  
  - **useAllowedOptions / useFieldState**：`src/hooks/useAllowedOptions.ts`、`src/hooks/useFieldState.ts`，消费 FIELD_KEYS。  
  - **Eval**：未查见统一“eval”模块；adaptivePatch 等有 scoring（如 conflictRate）。

- **template 是否走 rule**：模板应用走 `applyPayloadToProject`（template-engine）；FIELD_KEYS 等主要用于导出/选项可见性等，非模板 apply 主路径。  
- **prompt 是否走 rule**：prompt 生成不直接读 FIELD_KEYS；constraint/conflict 在 UI 与 export 前检查（detectSceneConflicts），与 prompt 管线分离。

---

## 七、Pro 工作台 vs Template 工作台

- **Pro Workspace 组件**：`ProWorkspaceShell`，`src/features/pro-workspace/components/ProWorkspaceShell.tsx`；内含 ProWorkspaceNav、ProWorkspaceEditor、ProWorkspaceStatusRail。  
- **Template Workspace 组件**：`TemplateWorkspace`，`src/features/template-workspace/components/TemplateWorkspace.tsx`；列表/详情/使用模板等。

- **是否共用 Project**：是。App 持单一 `project` state；Pro 与 Template 都读/写该 project（如 Use Template 时 `updateProject(newProject)`）。  
- **是否共用 Prompt**：是。同一 `buildPromptForScene` / `runPromptEngine`；Pro 的 PromptPreviewPanel、ExportControlPanel、ExportPanel 等都用同一套。  
- **是否共用 Engine**：是。同一 prompt engine 与 platform 适配。  
- **是否共用 Export**：是。ExportPanel 与 runProjectAction("save")/("save_as") 等统一；Pro 的复制/导出入口调同一 handleCopyPrompt / handleExportProject。  
- **是否共用 Continuity**：是。Continuity 仅在 Sidebar 的 ContinuityPanel；Pro 与模板工作台切换时左侧仍是同一 Sidebar，故共用。

---

## 八、Pricing / User / Credits

- **pricing 配置**：`src/pricing/`（templatePricingResolver、templatePricingInput、templateCapabilityTags 等）；`src/template-engine/billing/resolveCost.ts`；`src/features/billing/`（如 templateBillingService）。  
- **credits**：App 中 `accountCredits` state，由 wallet/credits 接口更新（如 `setAccountCredits(wallet.creditsBalance)`）；reserve/finalize/rollback 在生成流程中调用。  
- **user state**：App 中 `accountUser`（UserState | null）；登录/会话状态。

- **是否影响 export**：不影响导出内容或 runPromptEngine；可能影响“谁可导出”或计费（例如生成扣 credits，导出本身不查 credits）。  
- **是否影响 template**：是。使用市场模板会查定价与扣费；用户私有模板不扣费。  
- **是否影响 engine**：不直接；engine 选择由 workspace/mediaMode 等决定。  
- **是否影响 prompt**：不直接；prompt 内容不读 user/credits。

---

## 九、项目名 UI

- **左上角项目名下拉菜单**：当前 **不存在**。ProjectControlBar（带项目名 + ChevronDown 下拉）在 App 中 **仅 import，未在 JSX 中渲染**。  
- **实际项目名与操作 UI**：**Sidebar** 内「项目」区块（EditorSection，标题为 projectLabel/“未命名项目”），其下为竖排按钮（保存项目、复制提示词、导出、打开项目、项目库、重命名、另存为、复制为新项目、保存为模板、新建项目）。  
- **组件名**：Sidebar；**文件路径**：`src/components/Sidebar.tsx`。  
- **rename 触发点**：Sidebar 内「重命名项目」按钮 → `onRenameProject`（App 传入 `requestRenameProject`）→ 打开重命名弹窗；确认 → `confirmRenameProject` → `runProjectAction("rename_confirm", ...)`。  
- **save 触发点**：Sidebar「保存项目…」→ `onSaveProject` → `runProjectAction("save")`。  
- **duplicate 触发点**：Sidebar「复制为新项目」→ `onDuplicateProject` → `handleDuplicateProject` → `runProjectAction("duplicate")`。  
- **saveAsTemplate 触发点**：Sidebar「保存为模板」→ `onSaveAsTemplate` → `handleSaveAsTemplate` → `runProjectAction("save_as_template")`。

---

## 十、当前统一入口是否存在

- **是**。已有统一 project action 入口：**`runProjectAction`**（`src/App.tsx`）。  
- **函数名**：`runProjectAction(action, payload?)`。  
- **action**：`"rename_confirm"` | `"save"` | `"save_as"` | `"duplicate"` | `"save_as_template"`。  
- **行为**：rename_confirm 同步 project.name + fileLabel + labelPersist；save/save_as 委托给 saveToDisk/saveAsToDisk；duplicate/save_as_template 内联逻辑或调 duplicateProject/saveCurrentProjectAsTemplate。  
- **旧入口**：confirmRenameProject、handleDuplicateProject、handleSaveAsTemplate、Sidebar 的 onSaveProject/onSaveAs、shortcutActionsRef.save/saveAs、createNewProjectAfterSave、ensureReadyForLibraryOpen 均通过或代理到 `runProjectAction`，未再分散到多套实现。

---

（以上为只读结构说明，未修改代码、未重构、未优化、未自动修复。）
