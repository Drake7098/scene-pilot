# 模板 · 规则引擎 · 提示词 —— 总结方案

> 最后更新：2026-03-13

## 一、模板逻辑：独立新项目 vs 当前分镜追加

### 1.1 现状

- **当前行为**：`applyTemplateSnapshot` 将模板场景**替换/追加到当前项目的分镜列表**。
- **调用路径**：Sidebar → `onUseTemplate` → `applyTemplateSnapshot(template, project, scenes.length)` → 在现有 project 上 `nextScenes[sceneIdx] = clonedScene`。
- **问题**：用户期望「从模板新建项目」，而不是「在当前项目下新增/替换分镜」。

### 1.2 目标行为

**使用模板 = 新建独立项目**：

1. 点击模板「使用」→ 以模板场景为唯一分镜，创建新项目。
2. 新项目：
   - `project.project.mediaType` 取自模板 scene 的 `mediaMode`；
   - `project.project.shotPlan` 固定为 `"single"`（单镜模板）；
   - `project.scenes = [clonedScene]`，仅此一分镜；
   - 项目名建议：`{模板名}` 或 `{模板名} - 副本`。
3. 操作结果：
   - 切换到新项目（`updateProject` + `setSceneIdx(0)`）；
   - 不修改当前项目；
   - 如当前项目未保存，可先提示「保存当前项目？」再切换。

### 1.3 实现要点

| 模块 | 改动 |
|------|------|
| `applyTemplate.ts` | 新增 `createProjectFromTemplate(template)`，返回完整 `Project`，不再依赖 `currentProject`。 |
| `Sidebar.tsx` `onUseTemplate` | 调用 `createProjectFromTemplate` → `updateProject(newProject)` → `setSceneIdx(0)`，不再传入当前 project。 |
| 产品文案 | 「使用模板」=「从模板新建项目」；不再暗示「追加到当前」。 |

### 1.4 模板应同步的字段（见第四部分）

---

## 二、规则引擎与冲突检测现状

### 2.1 现有规则来源

| 来源 | 用途 | 状态 |
|------|------|------|
| `src/utils/conflictRules.ts` | 运行时场景/对象级冲突检测 | ✅ 已用 |
| `tests/robots/config/prompt-eval-rules.json` | 评测：required/forbidden/conflict_pairs | ✅ 已用 |
| `backup/rules-and-templates-rescue/src/rules/` | 完整规则引擎（media/storyPlan/motion/workspace/export） | ⚠️ 备份，未接入主分支 |

### 2.2 conflictRules.ts 覆盖的冲突

- **对象层**：静止 vs 运动、无文字 vs 添加文字、无叠加 vs overlay、对象数量约束 vs 新增主体、不居中 vs 主角居中、对象级越权全局词、场景策略与对象冲突。
- **场景层**：t0=t1 静止 vs 运动描述、跨对象全局动作冲突、背景与场景光照重复。

### 2.3 备份规则引擎（rules-and-templates-rescue）

- **mediaRules**：图片模式时禁用时长/运镜/出入镜/继承、自动 patch 运镜为 static 等。
- **storyPlanRules**：分镜策略相关。
- **motionRules**：运镜相关。
- **workspaceRules**：Quick/Pro 差异。
- **exportRules**：导出范围/目标平台。

**建议**：若需统一「字段可见性 + 自动 patch + 冲突检测」，可逐步将 backup 规则引擎迁回主分支，并与 `conflictRules` 合并为单一规则层。

---

## 三、全平台冲突清单与规划

### 3.1 冲突对（conflict_pairs，来自 prompt-eval-rules.json）

| 冲突对 | 说明 |
|--------|------|
| 静止构图 vs t0→t1 变化 | 全时长静止时不应写「完成 t0→t1 变化」 |
| no text vs add text overlay | 无文字 vs 添加文字 |
| no overlays vs ui overlay | 无叠加 vs 界面叠加 |
| 不自动居中 vs center the hero | 居中策略冲突 |
| 保持对象数量 vs add/remove subjects | 对象数量约束冲突 |
| 不重排构图 vs re-layout composition | 构图保持 vs 重排 |

### 3.2 conflictRules.ts 已覆盖

- 静止 vs 运动（对象、场景、跨对象）
- 文字约束冲突
- 叠加层冲突
- 对象数量冲突
- 居中策略冲突
- 对象级越权全局词
- 场景策略与对象/背景冲突

### 3.3 平台维度（platformPresets）

- **fal**：对象层级、构图、材质、布光；`promptStyle: long`。
- **Runway / Pika / Luma**：镜头、动作、连续性；部分 `promptStyle: short`，有 patch。
- **Midjourney / Krea**：keyword-chain；`promptStyle: short`。
- **潜在平台冲突**：
  - 长 prompt 平台 vs 短 prompt 平台：同一结构输出需做 truncate/compact。
  - 对象优先 vs 时间线优先：fal 与 Runway 的 prompt 结构不同。
  - 参考图数量：`maxRefsPerObject` 因平台而异（2 或 3）。

### 3.4 规划与规避

1. **输入阶段**：用户编辑时通过 `detectSceneConflicts` 实时提示冲突。
2. **导出/生成前**：再次跑 conflictRules，有 high 冲突时阻止或强提示。
3. **平台适配**：在 `platformAdapter` 中按 `platformId` 做 prompt 变换，避免把「fal 专用结构」直接丢给 Runway。
4. **规则统一**：将 `prompt-eval-rules.json` 的 conflict_pairs 与 `conflictRules.ts` 对齐，避免两套规则不一致。

---

## 四、模板应自动同步的值

### 4.1 模板存储（SceneTemplate.scene）

- 单分镜结构：`id, name, duration_s, camera, lighting, layers, config, notes` 等。
- `config` 含：`mediaMode`, `compiler`, `sceneTier`, `v2Mode` 等。

### 4.2 新建项目时应同步的字段

| 字段 | 来源 | 说明 |
|------|------|------|
| `project.project.mediaType` | `scene.config.mediaMode` | 图片/视频 |
| `project.project.shotPlan` | 固定 `"single"` | 单镜模板 |
| `project.scenes[0]` | `cloneSceneFromTemplate(template)` | 完整分镜 |
| 项目名 | `template.name` | 新建项目默认名 |

### 4.3 应用模板到现有项目（若保留为可选功能）

- 仅当用户明确选择「将模板插入当前项目」时，才走「追加/替换分镜」逻辑。
- 主入口统一为「从模板新建项目」。

---

## 五、提示词引擎加强方案

### 5.1 架构分层（保持）

```
userInput -> normalizedStructure -> sceneStrategy -> creativeContext
  -> workspaceBehavior(quick/pro) -> platformAdapter -> provider
```

- **不合并层**：每层职责清晰，便于平台/工作台差异化。

### 5.2 提示词部分可加强点

#### （1）结构强制

- **required**（prompt-eval-rules.json）在生成后做校验，缺失时补或告警。
- 图片模式：禁止输出 `Camera Contract`、`T1 Frame Spec`、整段镜头运动（AGENTS.md 已规定）。

#### （2）冲突消解

- 生成前：用 `detectSceneConflicts` 过滤冲突描述，或对冲突字段做优先级决策（如「场景策略优先于对象备注」）。
- 生成后：用 conflict_pairs 做 post-check，命中时替换或移除冲突句。

#### （3）平台裁剪

- `promptStyle: short` 平台：对长 prompt 做智能截断（保留 Layout/Subjects，压缩 Camera/Motion）。
- 参考图链接：按 `maxRefsPerObject` 截断，避免超平台限制。

#### （4）负向约束（Anti-Director Rules）

- 根据 mediaMode、platform、sceneStrategy 自动注入禁止项（如「no x=, y=, w=, h=」「no 完成 t0→t1 变化 when all_stable」）。
- 与 prompt-eval-rules 的 forbidden 对齐。

#### （5）结构分段校验

- 确保 `Layout Contract`、`Camera Contract`、`T0/T1 Frame Spec`、`Anti-Director Rules` 分段存在且顺序稳定。
- 对 Quick 工作台可做更短、更强调执行的变体。

### 5.3 建议落地顺序

1. **P0**：模板改为「新建独立项目」。
2. **P0**：导出/生成前强制跑 `detectSceneConflicts`，high 冲突时阻止或强提示。
3. **P1**：图片模式硬性 strip 视频骨架语言（Camera Contract、T1 Frame Spec 等）。
4. **P1**：将 conflict_pairs 与 conflictRules 规则统一到单一清单。
5. **P2**：按 platform 做 prompt 裁剪与 Anti-Director 自动注入。
6. **P2**：评估是否迁回 backup 规则引擎，统一字段可见性与 patch。

---

## 六、文件索引

| 文件 | 用途 |
|------|------|
| `src/rules/applyTemplate.ts` | 模板应用（需改：新建项目） |
| `src/lib/templateStore.ts` | 模板 CRUD、克隆 |
| `src/utils/conflictRules.ts` | 场景冲突检测 |
| `src/config/platformPresets.ts` | 平台配置 |
| `src/utils/promptPipeline.ts` | 提示词主流程 |
| `src/utils/promptEngine.ts` | 引擎路由与结构解析 |
| `src/utils/platformAdapter.ts` | 平台适配 |
| `tests/robots/config/prompt-eval-rules.json` | 评测规则 |
| `backup/rules-and-templates-rescue/src/rules/` | 备份规则引擎 |
| `docs/live-development-strategy.md` | 策略单一事实源 |
| `.codex/skills/prompt-engine-architecture/SKILL.md` | 提示词架构 skill |
