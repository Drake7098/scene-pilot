# proExportMode 持久化与 loadProject/sanitizeProject 增强

## proExportMode 持久化

### 存储位置

- **字段**：`project.meta.proExportMode`
- **类型**：`ProExportMode`（`"quick"` | `"package"`）
- **序列化**：随项目 JSON 保存，与 `saveProject` / `loadProject` 一致

### 保存与恢复

- **保存**：用户切换导出模式时，`handleProExportModeChange` 调用 `updateProject` 更新 `project.meta.proExportMode` 并 `saveProject`
- **恢复**：`useEffect` 监听 `project.meta.proExportMode`，同步到 React state `proExportMode`
- **旧项目**：无该字段时，`sanitizeProject` 写入默认 `"quick"`

### UI 联动

- `ExportPanel` 和 `PlatformModePanel` 均通过 `exportMode` / `onExportModeChange` 使用该状态
- 状态与项目 meta 一致，不出现 UI 与项目数据不一致

---

## loadProject 接入 sanitizeProject

### 当前流程

| 路径               | 是否 sanitize | 说明                      |
|--------------------|---------------|---------------------------|
| `loadProject()`    | ✅ 是         | 从 localStorage 读取后 sanitize |
| `onUploadFile`     | ✅ 是         | 上传 JSON 后 sanitize     |
| 项目库打开         | ✅ 是         | 原本已使用 sanitizeProject |

### 修改点

1. **storage.ts**：`loadProject()` 在 `return` 前调用 `sanitizeProject(parsed)`
2. **App.tsx**：`onUploadFile` 中 `setProject(sanitizeProject(obj as Project))`

---

## 加载时 meta 字段规范化

`sanitizeProject` 对以下 meta 字段做规范化：

| 字段                | 处理逻辑                                                       |
|---------------------|----------------------------------------------------------------|
| `appliedTemplateIds`| 仅保留字符串，长度上限 500                                     |
| `currentTemplate`   | 校验结构，补齐 templateId、familyId、domain 等必填字段         |
| `proExportMode`     | `"package"` 或 `"quick"`，缺省为 `"quick"`                     |

---

## 旧项目兼容策略

- **无 meta**：`p.meta = { appliedTemplateIds: [], proExportMode: "quick" }`
- **meta 无 proExportMode**：默认 `"quick"`
- **meta 有 proExportMode 但非法**：归一为 `"quick"`
- **currentTemplate 结构不完整**：过滤无效项，缺失字段用空字符串或默认值补齐
- **不因缺字段而抛错**：所有字段均有安全回退
