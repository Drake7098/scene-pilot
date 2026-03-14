# Pro 工作台整合验收后修复

本文档记录整合验收后对 Pro 工作台的小范围精修，修复 P0–P2 三个问题。

## 本轮修复内容

### P1｜proExportMode 持久化

**问题**：`proExportMode` 为 React state，刷新后恢复默认 `"quick"`，影响连续使用体验。

**修复**：
- 在 `ProjectMeta` 中新增 `proExportMode?: ProExportMode`
- 写入 `project.meta.proExportMode`，随项目保存与恢复
- `handleProExportModeChange` 在切换时同时更新 state 和 project 并持久化
- `useEffect` 在 project 变化时同步 `proExportMode` 从 meta
- `sanitizeProject` 对 meta 中的 `proExportMode` 进行规范化，旧项目默认为 `"quick"`

**影响**：用户切换导出模式后，刷新或重载项目均可恢复上次选择。

---

### P2｜loadProject 与 sanitizeProject 衔接增强

**问题**：`loadProject()` 未调用 `sanitizeProject`，异常或旧版 meta 缺少规范化，健壮性不足。

**修复**：
- `storage.loadProject()`：在返回前调用 `sanitizeProject(parsed)`
- `onUploadFile`：上传项目文件后调用 `sanitizeProject` 再 `setProject`
- 项目库打开：已在使用 `sanitizeProject`，无需修改

**sanitizeProject 对 meta 的规范化**：
- `currentTemplate`：校验结构并补齐缺失字段
- `appliedTemplateIds`：限制长度 500，过滤非字符串
- `proExportMode`：`"package"` 或 `"quick"`，缺省为 `"quick"`

**影响**：所有 load 路径进入工作态前均经过规范化，旧项目可安全降级。

---

## 修复后对模板驱动工作流的影响

- **导出模式**：与项目一起持久化，刷新不丢失
- **项目加载**：旧项目、缺字段项目可安全加载并补齐默认值
