# Stage 全局联动边界图

> Stage 与 Template Context / Slots / Props / Continuity / Platform Mode / ExportPanel 的联动关系

---

## 一、联动总览

```
                    ┌─────────────────┐
                    │ Current Template│
                    └────────┬────────┘
                             │ currentTemplate, appliedTemplateIds
                             ▼
┌──────────────┐    ┌──────────────────────────────────────────────┐    ┌─────────────────┐
│ Continuity   │◄──►│                    Stage                      │◄──►│  PropsPanel     │
│ Panel        │    │  • 对象选中/移动/缩放/锁定/Reset/Copy T0→T1   │    │  Object Props   │
└──────────────┘    │  • Work Bar (可移动)                          │    └─────────────────┘
                    │  • 通过 Guard 约束，不改高危字段               │
                    └──────────────────────────────────────────────┘
                             │
                             │ project.scenes[].layers[]
                             ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Template Slots  │◄──►│ Platform Mode   │
                    │ slot → layer    │    │ 结构强度约束    │
                    └────────┬────────┘    └────────┬────────┘
                             │                      │
                             ▼                      ▼
                    ┌─────────────────────────────────────────────┐
                    │              ExportPanel / Prompt            │
                    │  compileV2 / promptPipeline → finalCopyPrompt│
                    └─────────────────────────────────────────────┘
```

---

## 二、各模块联动要求

### 2.1 Template Context

| 方向 | 联动 | 禁止 |
|------|------|------|
| Template → Stage | 选中 template-derived 对象时，Stage 知道当前模板；reset 时优先回到 template default | Stage 直接改 currentTemplate meta |
| Stage → Template | - | Stage 随意断开模板来源关系 |

### 2.2 Template Slots

| 方向 | 联动 | 禁止 |
|------|------|------|
| Slots → Stage | slot-bound 对象在 Stage 上有可视提示；Assign Slot 通过统一 action | Stage 直接绕过 slots 改模板核心语义 |
| Stage → Slots | slot 改变时，Stage 位置/描述正确同步；对象状态显示所属 slot | 一个对象乱绑多个冲突 slot；Stage silent 覆盖 slot mapping |

### 2.3 Object Properties (PropsPanel)

| 方向 | 联动 | 边界 |
|------|------|------|
| Stage → Props | Stage 改位置/尺寸/锁定后，PropsPanel 同步 | Stage 不替代 PropsPanel |
| Props → Stage | Props 改属性后，Stage 同步 | PropsPanel 不替代 Work Bar 快速动作 |

### 2.4 Scene Strategy

| 方向 | 联动 | 禁止 |
|------|------|------|
| Strategy → Stage | camera / composition 等模板默认策略进入 Stage 表现 | Stage 自由改 scene-level strategy 复杂字段 |
| Stage → Strategy | Copy T0→T1、Center、Reset 不破坏 scene strategy | 改动 camera 类含义应 reroute 到 Scene Strategy |

### 2.5 Continuity Panel

| 方向 | 联动 | 禁止 |
|------|------|------|
| Continuity → Stage | anchor 对象在 Stage 上有视觉标记 | Stage 直接改 carry-over flags |
| Stage → Continuity | continuity scene 下高风险 move 过更严 guard；t0/t1 同步不破坏 continuity | Stage 自由解除 continuity anchor |

### 2.6 Platform Mode

| 方向 | 联动 | 说明 |
|------|------|------|
| Platform → Stage | coordinate strength、structure intensity 影响 Stage 可编辑自由度 | 强结构模式对 move/resize 更严格 |
| Stage → Platform | Stage 不直接编辑 platform mode | - |

### 2.7 ExportPanel / Prompt

| 方向 | 联动 | 禁止 |
|------|------|------|
| Stage → Prompt | Stage 的安全动作映射到 prompt 编译结果；冲突应在形成前阻断 | Stage 直接改最终 prompt 文本 |
| Prompt → Stage | - | 用户通过 Stage 绕开结构层污染导出 prompt |

---

## 三、字段权限矩阵

| 字段/能力 | Stage | Template Slots | PropsPanel | Scene Strategy | Continuity | Platform Mode |
|-----------|-------|----------------|------------|----------------|------------|---------------|
| layer.kf (x,y,w,h,rot) | ✓ 改 | - | ✓ 精细改 | - | - | - |
| layer.look | - | ✓ 改 | ✓ 改 | - | - | - |
| layer.notes (anchor 等) | Mark Anchor | - | ✓ 改 | - | - | - |
| layer 锁定 | ✓ 改 | - | ✓ 改 | - | - | - |
| slot 绑定 | Assign Slot | ✓ 改 | - | - | - | - |
| scene.notes (strategy) | - | - | - | ✓ 改 | - | - |
| scene camera | - | - | - | ✓ 改 | - | - |
| carry-over flags | - | - | - | - | ✓ 改 | - |
| platform / export | - | - | - | - | - | ✓ 改 |

---

## 四、冲突阻断策略

- **形成前阻断**：Guard 层在 action 执行前检查，deny 或 reroute
- **不依赖导出时检测**：不在 ExportPanel 才报冲突，而是 Stage 上就不允许形成冲突
- **轻量反馈**：禁用按钮 + tooltip 说明原因，不弹大段 warning

---

*文档版本：基于 Stage 结构安全化重构方案*
