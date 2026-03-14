# Base 400 模板 Payload 迁移说明

## 一、Base 之前怎么 apply

**路径：**

1. 用户点击使用模板 → `handleUseTemplateFromWorkspace(indexOrItem)`
2. 通过 `getTemplateWorkspaceItemFromIndex(index)` 得到 `TemplateWorkspaceItem`（UnifiedTemplate）
3. `unifiedTemplateToSceneTemplate(item)` 转为 `SceneTemplate`
4. `applyTemplateSnapshot(sceneTemplate, project, sceneIdx, "pro")` 直接应用
5. `applyTemplateSnapshot` 内部调用 `cloneSceneFromTemplate` 做 scene/layer ID 去重并替换/追加 scene

**依赖：**

- `rules/applyTemplate.ts`：applyTemplateSnapshot
- `lib/templateStore.ts`：cloneSceneFromTemplate
- `utils/unifiedTemplateToSceneTemplate.ts`：UnifiedTemplate → SceneTemplate
- `data/templateLibrary400.ts`：原始 400 模板数据

---

## 二、Base 现在怎么 apply

**路径：**

1. 用户点击使用模板 → `handleUseTemplateFromWorkspace(indexOrItem)`
2. 解析为 `TemplateIndex`（若入参为 item，通过 `getTemplateIndex().find(t => t.id === item.id)`）
3. `applyTemplateFromIndex(index, project, appendScene)`
4. `loadTemplatePayloadById(index.id)` → base 分支：`loadTemplatePayload(familyId, variant)` → `buildTemplatePayload`
5. `buildTemplatePayload` 使用 `familyBases` + `variantPatches`（register400）或 fallback 到 `buildPayloadFromUnifiedTemplate`（unifiedAdapter）
6. `applyPayloadToProject(payload, project, appendScene)` → 合并 scenes，调用 `ensureUniqueSceneIds` 做 ID 去重

**单一主链：** TemplateIndex → loadTemplatePayloadById → TemplatePayload → applyPayloadToProject

---

## 三、为何必须统一

1. **双轨维护成本**：base 走 snapshot，continuity 走 payload，两套逻辑易出错
2. **扩展性**：未来 600、模板工厂、Studio 等都走 payload 更易扩展
3. **架构清晰**：统一为 Index → Payload → Apply 一条主链
4. **ID 去重一致**：applyPayloadToProject 统一使用 ensureUniqueSceneIds

---

## 四、仍保留的兼容层

| 结构 | 用途 |
|------|------|
| `templateLibrary400` | 400 模板元数据与 scene 源数据，register400 / unifiedAdapter 仍依赖 |
| `register400` (familyBases + variantPatches) | 构建 base payload 的主路径 |
| `buildPayloadFromUnifiedTemplate` (unifiedAdapter) | 当 familyBase 未注册时的 fallback |
| `getTemplateWorkspaceItemFromIndex` | legacyAdapter，仍被 templateWorkspaceData 等使用（非主 apply 路径） |
| `unifiedTemplateToSceneTemplate` | 仍存在，主流程不再调用 |
| `applyTemplateSnapshot` | 仍存在，主流程不再调用 |
| `cloneSceneFromTemplate` | 仍存在，被 ensureUniqueSceneIds 复用逻辑（regenerateSceneIds） |

---

## 五、已退出主流程的历史结构

| 结构 | 说明 |
|------|------|
| `templateApplyService.applyTemplateToProject` | 已删除，原 base 专用分支 |
| App 层 `doApplyBase` / `doApplyContinuity` 双分支 | 已合并为单一 `doApply` |

**未删除但已退出主流程：**

- `applyTemplateSnapshot`：保留供其他潜在调用方（如有）或未来移除前兼容
- `unifiedTemplateToSceneTemplate`：保留，unifiedAdapter 内部不直接使用，但可作参考
