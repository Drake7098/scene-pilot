# Snapshot 相关逻辑废弃报告

## 一、已退出主流程

| 逻辑 | 文件 | 说明 |
|------|------|------|
| `applyTemplateSnapshot` | rules/applyTemplate.ts | 原 base 模板 apply 主路径，已由 template-engine `applyPayloadToProject` 替代 |
| `cloneSceneFromTemplate` | lib/templateStore.ts | 仅被 applyTemplateSnapshot 使用，主流程改用 `ensureUniqueSceneIds` |
| `unifiedTemplateToSceneTemplate` | utils/unifiedTemplateToSceneTemplate.ts | 原 UnifiedTemplate→SceneTemplate 转换，主流程不再使用 |
| `builtinTemplates` | data/builtinTemplates.ts | 原内置模板源，主流程改用 template-engine index + templateLibrary400 |
| `listBuiltinTemplates` / `getAllTemplates` | lib/templateStore.ts | 依赖 builtinTemplates，主流程不再使用 |

## 二、仍保留为兼容

| 逻辑 | 原因 |
|------|------|
| `applyTemplateSnapshot` | 保留文件，若 TemplatesPanel 等旧 UI 仍调用 |
| `cloneSceneFromTemplate` | applyTemplateSnapshot 依赖 |
| `ensureUniqueSceneIds` | template-engine apply 仍在使用，**非废弃** |
| `builtinTemplates` | templateStore 的 listBuiltinTemplates/getAllTemplates 仍引用 |
| `unifiedTemplateToSceneTemplate` | 无主流程引用，可作类型参考保留 |

## 三、可未来彻底删除

- `applyTemplateSnapshot`：确认无引用后可删
- `cloneSceneFromTemplate`：随 applyTemplateSnapshot 一起删
- `unifiedTemplateToSceneTemplate`：已无引用可删
- `builtinTemplates`：若 listBuiltinTemplates/getAllTemplates 无引用可删
- `listBuiltinTemplates` / `getAllTemplates`：仅 TemplatesPanel 使用，TemplatesPanel 废弃后可删
