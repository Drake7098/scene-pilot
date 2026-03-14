# Pro Template Context 回归验证

---

## 验证项

### 1. 应用模板后 Current Template 正常显示

| 步骤 | 预期 |
|------|------|
| 打开 Pro 工作台 | 无模板时显示“未使用模板”空状态 |
| 打开模板工作台，选择任一模板并应用 | 回到 Pro 工作台后，Current Template 显示该模板标题、family/variant、category/domain、cost、apply mode |
| 检查左侧 Templates 区域 | Current Template 模块在 TemplateSidebarEntry 上方，层次清晰 |

**结果**：[待执行]

---

### 2. 切换模板后 Current Template 正常更新

| 步骤 | 预期 |
|------|------|
| 已应用模板 A 的项目 | Current Template 显示模板 A |
| 再次打开模板工作台，选择模板 B 并应用 | 回到 Pro 工作台后，Current Template 显示模板 B |
| 对比前后 | 标题、family、variant 等均更新为模板 B |

**结果**：[待执行]

---

### 3. 刷新项目后 Current Template 仍存在

| 步骤 | 预期 |
|------|------|
| 应用模板后保存项目 | 项目 JSON 中含 `meta.currentTemplate` |
| 关闭项目后重新打开（或刷新） | Current Template 仍显示原模板信息 |
| 检查 `sanitizeProject` | 旧项目无 `currentTemplate` 不报错，有则正确解析 |

**结果**：[待执行]

---

### 4. base / continuity 模板都兼容

| 步骤 | 预期 |
|------|------|
| 应用 base 类模板 | Current Template 正常显示，category/domain 正确 |
| 应用 continuity 类模板 | Current Template 正常显示，category/domain 正确 |
| 应用 anime / webdrama 等 | 同样正常显示 |

**结果**：[待执行]

---

### 5. Recent / Favorites 未受破坏

| 步骤 | 预期 |
|------|------|
| 应用模板后 | Recent 列表中包含该模板 |
| 收藏模板后 | Favorites 列表中包含该模板 |
| 从 Recent/Favorites 快速应用 | 行为与从模板工作台应用一致，Current Template 正常更新 |

**结果**：[待执行]

---

### 6. 回跳到模板工作台并定位当前模板

| 步骤 | 预期 |
|------|------|
| 有当前模板时，点击“查看详情 / 更换模板” | 打开模板工作台，且右侧详情/选中态定位到当前模板 |
| 无当前模板时，点击“打开模板工作台” | 打开模板工作台，无预选 |

**结果**：[待执行]

---

## 回归结果汇总

| 验证项 | 状态 |
|--------|------|
| 1. 应用模板后 Current Template 正常显示 | 待执行 |
| 2. 切换模板后 Current Template 正常更新 | 待执行 |
| 3. 刷新项目后 Current Template 仍存在 | 待执行 |
| 4. base / continuity 模板都兼容 | 待执行 |
| 5. Recent / Favorites 未受破坏 | 待执行 |
| 6. 回跳到模板工作台并定位当前模板 | 待执行 |

---

*文档生成时间：2026-03-14*
