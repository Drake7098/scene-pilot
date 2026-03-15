# Continuity 模块消失查询（Functional Audit v1 · 只读）

**目标**：查明左侧栏「镜头连续性 / continuity / object continuity」模块不显示的原因。  
**约束**：只读查询，未修改任何代码。

---

## 1. continuity UI 在哪里

### 文件路径与组件

| 项目 | 说明 |
|------|------|
| **组件** | `ContinuityPanel` |
| **文件** | `src/components/ContinuityPanel.tsx` |
| **ViewModel** | `src/utils/continuityViewModel.ts`（`buildContinuityViewModel`, `transitionLabel`, `dirDisplay`） |

### Render 位置

- **唯一渲染点**：`src/components/Sidebar.tsx` 约 1756–1767 行。
- **结构**：Sidebar 根 div（`className="pro-sidebar spx-glass-left editor-sidebar-forms"`）→ 子节点依次为：Project EditorSection（条件）、toast、floatingHint、confirmDel、Templates EditorSection、**Scenes EditorSection**、**ContinuityPanel**、Object Layers EditorSection、Scene Strategy、Camera、Camera/Lighting、等。
- **结论**：Continuity 模块在 **Sidebar 内** 渲染，位于「Scenes」与「Object Layers」之间；**不在** SceneEditor、ProWorkspaceShell、ProWorkspaceEditor、ScenePanel 内。

### 相关引用（非独立 continuity section 的 UI）

- **ObjectEditorPanel**（`src/features/pro-workspace/components/ObjectEditorPanel.tsx`）：展示/编辑 `continuityId`（连续性锚点 ID）、`state.continuityId` 的 Anchor 图标；属于 Pro 工作台「对象」面板，不是左侧栏的 Continuity 区块。
- **ConstraintInspectorPanel / PromptPreviewPanel / ProWorkspaceStatusRail / DisabledStateSection**：仅读取 `continuityId` 或 `state.continuityId` 做禁用态/提示，不渲染 Continuity 主面板。
- **Stage.tsx**：`hasAnchor={!!objState.continuityId}` 仅用于画布显示，与 Sidebar 无关。

---

## 2. 是否有条件渲染

### ContinuityPanel 内部条件（唯一导致「整块不显示」的逻辑）

```ts
// ContinuityPanel.tsx, lines 42-48
const isVideo = (project.project?.mediaType ?? "video") === "video";
const hasScenes = (project.scenes?.length ?? 0) > 1;

if (!isVideo) {
  return null;
}
```

- **条件**：`project.project?.mediaType !== "video"` 时（例如为 `"image"`），组件直接 `return null`，整块 Continuity 不渲染。
- **默认值**：`mediaType` 缺省时按 `"video"` 处理，因此只有**显式为 image 项目**时才会不显示。

### 其他条件（只影响内容，不隐藏整块）

- `isEmpty && !hasScenes`：单镜或非连续项目 → 显示「单镜或非连续项目」。
- `isEmpty && hasScenes`：多镜但非连续模板 → 显示「多镜非连续模板」+ SummaryRow。
- `vm.continuityEnabled`：由 `continuityViewModel` 的 `isVideo && (shotPlan === "continuous" || shotPlan === "multicam")` 决定，只控制「连续 / 承接关系 / 锚点」等子区块是否展示，不控制 ContinuityPanel 是否挂载。

### Sidebar 侧是否有条件包住 ContinuityPanel

- **无**。Scenes EditorSection、ContinuityPanel、Object Layers EditorSection 等均为同一层级的兄弟节点，**没有被** `projectLabel != null && onSaveProject`、`isPro`、`workspaceMode`、`isTemplateWorkspaceOpen` 等条件包裹；只有「Project」那块 EditorSection 有条件。

### 结论

- **唯一会令 Continuity 模块完全消失的条件**：`project.project?.mediaType === "image"`（即当前为**图片项目**）。
- 与 sceneCount、objects、workspaceMode、isPro、template 等无直接关系；它们不控制 ContinuityPanel 的挂载，只影响 ViewModel 内容或其它 section。

---

## 3. 是否依赖 project.continuity

### 数据模型（model.ts）

- **Project**：`continuity?: ProjectContinuity`（约 206–207 行）。
- **ProjectContinuity**（约 189–196 行）：`enabled`, `characterCarryOver`, `directionCarryOver`, `cameraCarryOver`, `bgCarryOver`, `referenceSlots`；注释为「From payload.continuity when template applied」。

### 在哪里读取

- **applyPayload.ts**：`...(payload.continuity ? { continuity: payload.continuity } : {})` 写入 project。
- **ContinuityPanel / continuityViewModel**：**未读取** `project.continuity`。ViewModel 完全由以下推导：
  - `project.project?.shotPlan`、`project.project?.mediaType`
  - `project.meta?.currentTemplate?.domain`
  - `project.scenes`、当前 scene 的 `inheritFromPrevious`、`transitionType`、`entryDir`、`exitDir`、`inheritBgRefFromPrevious`
  - 当前 scene 的 `layers[].notes` 中解析 `@continuityid:` 得到 anchor 列表

### 在哪里初始化

- 仅在模板应用时由 `applyPayload` 从 `payload.continuity` 写入 project；新建/空白项目不会带 `project.continuity`。

### 在哪里「丢失」

- 若从未应用过带 `continuity` 的模板，则 project 上本就没有 `continuity`；**ContinuityPanel 的显示不依赖该字段**，因此不存在「因 project.continuity 丢失而导致模块消失」的路径。
- 模块消失只与 `project.project?.mediaType === "image"` 有关。

### continuityId / layer.notes

- **continuityId**：从 layer 的 `notes` 中解析 `@continuityId:` 或 `@continuityid:` 得到；用于 ObjectEditorPanel、Stage、ConstraintInspectorPanel、PromptPreviewPanel、ProWorkspaceStatusRail、DisabledStateSection、stageObjectState 等；**不参与** ContinuityPanel 是否渲染的决策，只参与内容与禁用态。

---

## 4. Sidebar 是否移除了 section

### 当前 Sidebar section 列表（顺序）

1. **Project**（条件：`projectLabel != null && onSaveProject`）
2. **Templates**（EditorSection）
3. **Scenes**（EditorSection）
4. **Continuity**（ContinuityPanel，无 EditorSection 包裹，自身内部用 EditorSection）
5. **Object Layers**（EditorSection）
6. **Scene Strategy**（EditorSection）
7. **Camera Control**（EditorSection）
8. **Camera / Lighting**（EditorSection）

### Continuity 在 Sidebar 中的形态

- ContinuityPanel **仍在** Sidebar 中渲染（约 1756–1767 行），**未被移除**。
- 使用 `sidebarCollapsed.has("continuity")` 与 `toggleSidebar("continuity")`，且 `useProCollapseSections` 的 key 列表包含 `"continuity"`（约 1141–1144 行），因此 section 配置存在且可折叠。
- **旧版**：未做 git 历史比对，但从当前代码看，Continuity 仍是 Sidebar 的正式 section，只是由 ContinuityPanel 内部根据 `isVideo` 决定是否 `return null`。

### 结论

- Sidebar **没有**移除 continuity section；若看不到，是因为 **ContinuityPanel 在 mediaType 为 image 时返回 null**，而不是 section 被删掉。

---

## 5. workspaceMode 是否影响

### 相关变量

- **workspaceMode**（App）：`useState<ResultConsoleMode>("pro")`，未在 Sidebar 或 ContinuityPanel 中使用。
- **isTemplateWorkspaceOpen**（App）：为 true 时右侧显示 TemplateWorkspace，**左侧仍为同一 Sidebar**；Sidebar 与 ContinuityPanel 的渲染不受该状态影响。
- **canUseProConsole(accountUser)**：决定右侧是 ProWorkspaceShell 还是其它布局；**不参与**左侧 Sidebar 是否渲染或 ContinuityPanel 是否 return null。

### 结论

- **TemplateWorkspace / ProWorkspace 的切换不会屏蔽 Continuity**；它们只影响右侧主内容区。左侧 Sidebar 始终是同一棵树，ContinuityPanel 的显示只受自身 `isVideo` 条件影响。

---

## 6. ProWorkspaceShell 是否过滤

### 结构

- **ProWorkspaceShell**：包含 ProWorkspaceNav、ProWorkspaceEditor、ProWorkspaceStatusRail；**不包含** Sidebar，也不渲染 ContinuityPanel。
- **ProWorkspaceEditor**：按 section 渲染 SceneEditorPanel、ObjectEditorPanel、CompositionEditorPanel、ConstraintInspectorPanel、PromptPreviewPanel、PlatformAdaptPanel、ExportControlPanel 等；**没有** ContinuityPanel 或 Continuity section。
- **SceneEditorPanel**：场景/镜头/衔接/光线/背景等；**没有** continuity 专用区块（衔接、continuity 相关字段在 Sidebar 的 ContinuityPanel 与 Scene 卡片上展示）。

### 结论

- ProWorkspaceShell / ProWorkspaceEditor / SceneEditor **没有**「过滤掉」或替代 Sidebar 的 Continuity UI；它们只是另一套右侧编辑区。左侧栏的 Continuity 始终由 **App → Sidebar → ContinuityPanel** 渲染，唯一不显示的原因是 **ContinuityPanel 内 `!isVideo` 时 return null**。

---

## 7. continuity 数据是否还存在

### model.ts

- **Project.continuity**：存在，类型 `ProjectContinuity`（可选）。
- **ProjectContinuity**：存在，含 `enabled`、`characterCarryOver` 等。
- **continuityId**：不在 Project/Scene/Layer 类型上作为顶级字段；由 layer.notes 中 `@continuityId:` 解析得到，在 stage-editor、ObjectEditorPanel、continuityViewModel 等处使用。

### 结论

- **数据模型仍在**；ContinuityPanel 不依赖 `project.continuity`，只依赖 `project.project`（mediaType、shotPlan）和 scenes/domain。因此「模块消失」不是因 project.continuity 或 continuityId 被删导致，而是 **mediaType 为 image** 导致。

---

## 8. 可能原因小结（why missing）

1. **当前项目为图片项目（mediaType === "image"）**  
   - ContinuityPanel 内 `isVideo = (project.project?.mediaType ?? "video") === "video"`；当 `mediaType === "image"` 时 `return null`，整块不显示。  
   - 这是**当前代码下唯一会令 Continuity 模块完全消失**的条件。

2. **project.project 结构异常**  
   - 若某路径下 `project.project` 缺失或被写成其它结构，`project.project?.mediaType` 可能为 undefined；此时默认 `"video"`，面板应仍显示。  
   - 若存在把 `project.project.mediaType` 显式设为 `"image"` 的流程（例如从模板或 wizard 创建图片项目），则会进入「不显示」分支。

3. **未移除、未因 workspace/Pro 被屏蔽**  
   - Sidebar 未移除 continuity section；workspaceMode、isTemplateWorkspaceOpen、canUseProConsole 不控制 ContinuityPanel 的挂载；ProWorkspaceShell 不替代或过滤 Sidebar 的 Continuity。

**建议排查**：确认当前打开的项目在 `project.project.mediaType` 上的值；若为 `"image"`，则按现有实现 Continuity 模块不会显示；若希望图片项目也显示该区块，需修改 ContinuityPanel 的 `if (!isVideo) return null` 逻辑（本次只读，未改代码）。
