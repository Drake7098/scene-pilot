# 模板应用主链流程图

## 一、当前 Base 400 应用链（改造前）

```
用户点击使用模板（工作台 / 快捷入口）
  → handleUseTemplateFromWorkspace(indexOrItem)
  → 若有 item（TemplateWorkspaceItem）：
       getTemplateWorkspaceItemFromIndex(index) → item
       doApplyBase(unifiedTemplateToSceneTemplate(item))
         → applyTemplateSnapshot(sceneTemplate, project, sceneIdx, "pro")
           → cloneSceneFromTemplate(template, sceneIdExists, layerIdExists)
           → 替换/追加 scene 到 project
  → 若有 index 且为 base：实际上 base 场景下 item 恒非空，不会走 applyTemplateFromIndex
```

**调用点：**
- `App.tsx` handleUseTemplateFromWorkspace → doApplyBase
- `App.tsx` doApplyBase → applyTemplateSnapshot（直接调用）
- `rules/applyTemplate.ts` applyTemplateSnapshot → cloneSceneFromTemplate

**数据流：** TemplateIndex → TemplateWorkspaceItem（UnifiedTemplate）→ SceneTemplate → applyTemplateSnapshot

---

## 二、当前 Continuity 应用链

```
用户点击使用模板（工作台选择 continuity 模板）
  → handleUseTemplateFromWorkspace(index)
  → item 为 null（getTemplateWorkspaceItemFromIndex 对 continuity 返回 null）
  → doApplyContinuity()
    → applyTemplateFromIndex(index, project, appendScene)
    → domain in (webdrama_continuity, anime_continuity)
    → loadTemplatePayloadById(index.id)
      → templateContinuityLoader（webdrama / anime）
    → applyPayloadToProject(payload, project, appendScene)
      → 合并 scenes 到 project
```

**调用点：**
- `App.tsx` handleUseTemplateFromWorkspace → doApplyContinuity
- `templateApplyService.ts` applyTemplateFromIndex → loadTemplatePayloadById → applyPayloadToProject

**数据流：** TemplateIndex → loadTemplatePayloadById → TemplatePayload → applyPayloadToProject

---

## 三、曾走 snapshot 的位置（已移除）

| 位置 | 说明 |
|------|------|
| App.tsx doApplyBase | ~~直接调用 applyTemplateSnapshot~~ 已移除 |
| templateApplyService.applyTemplateToProject | ~~调用 applyTemplateSnapshot~~ 已删除 |

---

## 四、已走 payload 的位置

| 位置 | 说明 |
|------|------|
| templateApplyService.applyPayloadToProject | continuity 模板的最终应用 |
| templateApplyService.applyTemplateFromIndex（continuity 分支） | loadTemplatePayloadById → applyPayloadToProject |

---

## 五、统一后的目标链路

```
用户点击使用模板
  → handleUseTemplateFromWorkspace(indexOrItem)
  → 解析为 TemplateIndex：
       - 若入参为 index：直接使用
       - 若入参为 item：getTemplateIndex().find(t => t.id === item.id)
  → applyTemplateFromIndex(index, project, appendScene)
  → loadTemplatePayloadById(index.id)
       - base: buildTemplatePayload(familyId, variant) [familyBases + variantPatches 或 unifiedAdapter]
       - continuity: templateContinuityLoader
  → applyPayloadToProject(payload, project, appendScene)
       - 含 ID 去重（regenerateSceneIds）
  → updateProject(result.appliedProject)
```

**单一主链：** TemplateIndex → loadTemplatePayloadById → TemplatePayload → applyPayloadToProject → updateProject

**主流程中不再调用：** applyTemplateSnapshot、unifiedTemplateToSceneTemplate、cloneSceneFromTemplate
