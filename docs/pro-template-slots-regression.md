# Pro Template Slots 回归验证

> **已弃用**：模板槽位功能已移除。本文档仅供历史参考。

---

## 验证项

### 1. 应用模板后 Slots 正常显示

| 步骤 | 预期 |
|------|------|
| 打开 Pro 工作台 | 无模板时 Template Slots 显示「未使用模板，无槽位可编辑」 |
| 打开模板工作台，选择任一模板并应用 | 回到 Pro 工作台后，右侧 Template Slots 显示 subject / product / background / copy / style / camera 等槽位 |
| 检查 PropsPanel 布局 | Template Slots 在 Scene Background 上方 |

**结果**：[待执行]

---

### 2. 修改 subject / product / background / copy 等 Slot 后，项目内容变化正确

| 步骤 | 预期 |
|------|------|
| 修改 subject slot | 第一个主体类图层的 look 更新 |
| 修改 product slot | 第一个产品类图层的 look 更新 |
| 修改 background slot | 分镜背景（bg:）更新 |
| 修改 copy slot | 分镜 name 更新 |
| 修改 style slot | scene.notes 中 pro_director_style: 更新 |
| 修改 camera slot | scene.camera.shot / movement 更新 |

**结果**：[待执行]

---

### 3. 刷新后 Slot 状态仍存在

| 步骤 | 预期 |
|------|------|
| 应用模板并修改部分 slot 后保存项目 | 项目 JSON 中含 `meta.templateSlots` |
| 关闭项目后重新打开（或刷新） | Template Slots 仍显示，currentValue 与保存时一致 |

**结果**：[待执行]

---

### 4. Object Properties 未被破坏

| 步骤 | 预期 |
|------|------|
| 从 Template Slots 修改 subject | 在 Object Properties 选中对应图层，look 字段显示新值 |
| 从 Object Properties 修改某图层 look | Template Slots 的 subject 不自动回写（当前设计：单向 slot→结构） |
| Scene Background、Composition 等 | 行为与之前一致 |

**结果**：[待执行]

---

### 5. 没有模板时为空状态

| 步骤 | 预期 |
|------|------|
| 新建空白项目或未应用模板的项目 | Template Slots 显示「未使用模板，无槽位可编辑」 |
| 模板无主体/产品图层 | 对应 slot 不显示；background / copy / style / camera 仍可显示 |

**结果**：[待执行]

---

### 6. Reset 单槽 / 全部 Reset

| 步骤 | 预期 |
|------|------|
| 修改 slot 后点击该 slot 旁 Reset | 恢复为 defaultValue，source 变为 template-default |
| 点击全部 Reset | 所有 slot 恢复默认，项目内容随之还原 |

**结果**：[待执行]

---

## 回归结果汇总

| 验证项 | 状态 |
|--------|------|
| 1. 应用模板后 Slots 正常显示 | 待执行 |
| 2. 改 subject/product/background/copy 等后项目内容正确 | 待执行 |
| 3. 刷新后 Slot 状态仍存在 | 待执行 |
| 4. Object Properties 未被破坏 | 待执行 |
| 5. 没有模板时空状态正确 | 待执行 |
| 6. Reset 单槽 / 全部 Reset | 待执行 |

---

*文档生成时间：2026-03-14*
