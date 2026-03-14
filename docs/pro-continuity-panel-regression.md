# Pro Continuity Panel 回归验证

---

## 验证项

### 1. continuity 模板下 Panel 正常显示

| 步骤 | 预期 |
|------|------|
| 应用 webdrama 或 anime  continuity 模板 | 左侧 Continuity Panel 显示，模板类型为网剧/动漫 |
| shotPlan 为 continuous 或 multicam | 显示 continuity 开、承接关系、carry-over |
| 多镜项目 | 显示 from previous、to next、transition、entry/exit direction |

**结果**：[待执行]

---

### 2. Scene 切换时 Continuity 摘要同步更新

| 步骤 | 预期 |
|------|------|
| 在多镜项目中切换 scene | Continuity Panel 中“当前 scene / 总 scene”更新 |
| 切换到第一镜 | from previous 为 —，hasPrev 为 false |
| 切换到最后一镜 | to next 为 —，hasNext 为 false |
| 点击“上一镜”“下一镜” | 正确跳转到对应 scene |

**结果**：[待执行]

---

### 3. Base 模板下空状态正确

| 步骤 | 预期 |
|------|------|
| 单镜项目 | 显示「单镜或非连续项目」 |
| 多镜 base 模板（非 continuity） | 显示「多镜非连续模板」，仍有 scene 索引与上一镜/下一镜 |
| 图片项目 | Continuity Panel 不显示 |

**结果**：[待执行]

---

### 4. Scenes / Strategy 未被破坏

| 步骤 | 预期 |
|------|------|
| Scenes 列表 | 正常增删、切换、命名、时长 |
| Scene Strategy | 入镜/出镜、对象继承、景别、镜头等正常 |
| 从 Continuity Panel 跳转 | 与从 Scenes 点击切换效果一致 |

**结果**：[待执行]

---

### 5. Continuity 相关字段显示正确

| 步骤 | 预期 |
|------|------|
| inheritFromPrevious | character carry-over 正确显示 |
| inheritBgRefFromPrevious | background carry-over 正确显示 |
| entryDir / exitDir | 方向正确显示 |
| transitionType | 衔接方式正确显示 |
| 有 @continuityId 的 layer | 锚点摘要中显示 |

**结果**：[待执行]

---

## 回归结果汇总

| 验证项 | 状态 |
|--------|------|
| 1. continuity 模板下 panel 正常显示 | 待执行 |
| 2. scene 切换时 continuity 摘要同步更新 | 待执行 |
| 3. base 模板下空状态正确 | 待执行 |
| 4. Scenes / Strategy 未被破坏 | 待执行 |
| 5. continuity 相关字段显示正确 | 待执行 |

---

*文档生成时间：2026-03-14*
