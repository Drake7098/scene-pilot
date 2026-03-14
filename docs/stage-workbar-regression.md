# Stage Work Bar 回归验收清单

> 开发完成后必须验证的项目

---

## 一、Work Bar 基础行为

| 项 | 预期 | 验证 |
|---|------|------|
| 可移动 | Work Bar 可在 Stage 内拖动 | [ ] |
| 不越界 | 不会跑出 Stage 边界 | [ ] |
| 选中显示 | 选中单个对象时 Work Bar 出现 | [ ] |
| 未选隐藏 | 未选中时 Work Bar 隐藏 | [ ] |
| tooltip | 每个按钮有 tooltip | [ ] |
| 禁用原因 | disabled 时 tooltip 说明原因 | [ ] |

---

## 二、对象状态与按钮显隐

| 项 | 预期 | 验证 |
|---|------|------|
| 锁定后 | Move、Resize、Copy T0→T1 禁用 | [ ] |
| 图片模式 | Copy T0→T1 隐藏或禁用 | [ ] |
| base 模板 | Mark Anchor 隐藏 | [ ] |
| continuity 模板 | Mark Anchor 显示 | [ ] |
| 无 currentTemplate | Assign Slot 隐藏 | [ ] |
| protected-layout | 只显示有限按钮 | [ ] |

---

## 三、场景验收

### A. base 模板对象

| 项 | 预期 | 验证 |
|---|------|------|
| 选中后 Work Bar 出现 | 是 | [ ] |
| Move / Center / Reset 正常 | 是 | [ ] |
| Copy T0→T1 禁用 | 图片模式 | [ ] |
| Lock 后不可误拖 | 是 | [ ] |

### B. 视频模板对象

| 项 | 预期 | 验证 |
|---|------|------|
| T0/T1 同步可用 | 是 | [ ] |
| 不破坏 scene strategy | 是 | [ ] |
| prompt 结果同步合理 | 是 | [ ] |

### C. continuity 模板对象

| 项 | 预期 | 验证 |
|---|------|------|
| anchor 对象识别正确 | 是 | [ ] |
| 高风险 move 受限 | 是 | [ ] |
| Continuity Panel 与 Stage 同步 | 是 | [ ] |

### D. slot-bound 对象

| 项 | 预期 | 验证 |
|---|------|------|
| Assign Slot 生效 | 是 | [ ] |
| Template Slots 同步 | 是 | [ ] |
| 不出现错绑、乱绑 | 是 | [ ] |

### E. 非模板 / 用户新增对象

| 项 | 预期 | 验证 |
|---|------|------|
| Work Bar 仍正常 | 是 | [ ] |
| 状态显示合理 | 是 | [ ] |
| 不错误套用模板保护 | 是 | [ ] |

### F. 空项目

| 项 | 预期 | 验证 |
|---|------|------|
| Stage 不报错 | 是 | [ ] |
| Work Bar 基础行为正常 | 是 | [ ] |
| 无无效按钮误显示 | 是 | [ ] |

---

## 四、全局联动

| 项 | 预期 | 验证 |
|---|------|------|
| Stage 选中 → PropsPanel 聚焦 | 是 | [ ] |
| Template Slots 与 Stage 同步 | 是 | [ ] |
| Continuity Panel 切 scene → Stage 同步 | 是 | [ ] |
| Current Template 变更 → Stage 上下文更新 | 是 | [ ] |
| Platform Mode → Guard 规则同步 | 是 | [ ] |
| ExportPanel 不因 Stage 改动报错 | 是 | [ ] |

---

*文档版本：基于 Stage 结构安全化重构方案*
