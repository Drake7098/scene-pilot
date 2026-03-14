# Pro 工作台 · Platform Mode 模块

---

## 一、为什么模板系统必须显式平台模式

不同平台（Runway、Midjourney、即梦、可灵等）对提示词格式、参考图数量、坐标结构、镜头语言的要求不同。若用户导出时才发现格式不匹配，体验差。

Platform Mode 将**平台适配能力显式化**：

- 用户可见：当前目标平台、模板推荐平台、导出方式、结构强度
- 用户可切换：平台、导出方式（仅提示词 / 提示词+参考图）
- 导出前即有预期，减少试错

---

## 二、Platform Mode 数据来源

| 字段 | 来源 |
|------|------|
| `currentPlatformTarget` | App 状态 `savePlatformId`，与 ExportPanel 同步 |
| `recommendedPlatforms` | 从 `project.meta.currentTemplate` 的 domain/category 推导 |
| `exportMethod` | 从 `exportMode`（quick/package）和 structureIntensity 推导 |
| `structureIntensity` | 从 project.shotPlan、scene 数量、是否有模板推导 |
| `coordinateStrength` | 从 structureIntensity 推导 |
| `needsReferenceImage` | 从项目内 reference 数量推导 |
| `suppressCoordinateLiteral` | 从 structureIntensity 推导 |
| `prefersNaturalLanguageCamera` | 从 structureIntensity 推导 |

模板应用后不落库额外平台元数据；推荐平台由 domain/category 规则推导。

---

## 三、与 ExportPanel 的边界

| 模块 | 职责 |
|------|------|
| **Platform Mode** | 平台策略展示、推荐平台、导出方式、结构提示；用户在此切换平台与导出方式 |
| **ExportPanel** | 最终导出预览、复制、保存；平台选择、导出类型（quick/package）受 Platform Mode 控制 |

- Platform Mode 改动通过 `onPlatformChange`、`onExportModeChange` 同步到 App，再传给 ExportPanel
- ExportPanel 接收 `platformId`、`exportMode` 作为受控属性，与 Platform Mode 一致

---

## 四、当前支持的策略字段

| 字段 | 说明 |
|------|------|
| currentPlatformTarget | 当前目标平台 ID |
| recommendedPlatforms | 推荐平台列表（由模板 domain/category 推导） |
| exportMethod | prompt_only / prompt_reference |
| structureIntensity | soft / balanced / strong |
| coordinateStrength | off / light / full |
| needsReferenceImage | 是否建议使用参考图 |
| suppressCoordinateLiteral | 是否抑制坐标字面量 |
| prefersNaturalLanguageCamera | 是否偏好自然语言镜头描述 |

---

*文档生成时间：2026-03-14*
