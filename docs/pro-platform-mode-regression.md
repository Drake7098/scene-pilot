# Pro Platform Mode 回归验证

---

## 验证项

### 1. 应用模板后 Platform Mode 显示合理

| 步骤 | 预期 |
|------|------|
| 应用 continuity 模板 | 推荐平台显示 runway、fal 等视频平台 |
| 应用 product 模板 | 推荐平台显示 midjourney、jimeng 等 |
| 应用 base 模板 | 推荐平台为 universal、runway、fal、midjourney |

**结果**：[待执行]

---

### 2. 无模板时默认值合理

| 步骤 | 预期 |
|------|------|
| 新建空白项目 | Platform Mode 显示当前平台、默认导出方式、结构提示 |
| 推荐平台 | 显示 universal 等通用平台 |

**结果**：[待执行]

---

### 3. 切换平台 / 导出方式后状态同步

| 步骤 | 预期 |
|------|------|
| 在 Platform Mode 切换平台 | ExportPanel 的适用大模型同步更新 |
| 在 Platform Mode 切换导出方式（仅提示词 / 提示词+参考图） | 打开导出弹窗时，导出类型与 Platform Mode 一致 |
| 在导出弹窗切换 | Platform Mode 的导出方式同步更新 |

**结果**：[待执行]

---

### 4. ExportPanel 未被破坏

| 步骤 | 预期 |
|------|------|
| 复制提示词 | 正常 |
| 导出项目 | 正常 |
| 平台选择 | 与 Platform Mode 一致 |
| 导出类型选择 | 与 Platform Mode 一致 |

**结果**：[待执行]

---

### 5. continuity / base 模板都兼容

| 步骤 | 预期 |
|------|------|
| 应用 webdrama continuity | 推荐平台、结构强度合理 |
| 应用 base 模板 | 推荐平台、结构强度合理 |
| 无模板 | 不报错，显示默认值 |

**结果**：[待执行]

---

## 回归结果汇总

| 验证项 | 状态 |
|--------|------|
| 1. 应用模板后 Platform Mode 显示合理 | 待执行 |
| 2. 无模板时默认值合理 | 待执行 |
| 3. 切换平台/导出方式后状态同步 | 待执行 |
| 4. ExportPanel 未被破坏 | 待执行 |
| 5. continuity / base 模板都兼容 | 待执行 |

---

*文档生成时间：2026-03-14*
