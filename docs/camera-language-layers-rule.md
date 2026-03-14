# 镜头语言分层规则｜模板系统约束

本规则用于统一模板系统中「镜头语言分层」与「扣点等级」的关系，确保：

- 普通用户界面保持简洁
- 高级模板具有真实价值
- 扣点有合理理由
- 不暴露全部镜头语言给用户
- 但能让用户知道为什么这个模板更高级

本规则为模板系统强制规则。

---

## 一、镜头语言分层规则

镜头语言分为三层：

### Layer 1｜用户可见镜头语言

数量约 10～12 个

用于：
- Camera Control 面板
- 用户手动选择
- 普通模板

示例：

- 写实克制
- 商业广告
- 电影叙事
- 对话覆盖式
- 产品质感
- 社媒直给
- 情绪压迫
- 悬疑氛围
- 动漫戏剧化
- 高级大片感

特点：
- 名字直观
- 易理解
- 不易冲突
- 高频使用

### Layer 2｜模板内部镜头语言（隐藏）

数量约 20～25 个

用于：
- 模板默认值
- Director preset
- 高级模板
- 连续模板
- 网剧 / 动漫 / 广告 / 产品高级模板

示例：`cinematic_soft`、`cinematic_dark`、`ad_luxury`、`ad_clean`、`drama_tension`、`suspense_observe`、`product_glossy`、`anime_dynamic`、`hero_entry` 等。

特点：
- 不直接暴露给普通用户
- 只能通过模板使用
- 不在 Camera Control 列表中显示

### Layer 3｜底层镜头语言库（完整）

50+ 项，用于 engine、future pro mode、future studio mode、内部扩展。默认不显示。

---

## 二、隐藏镜头语言与模板扣点规则

若模板使用 Layer 2 或 Layer 3 镜头语言，必须满足：

1. 模板必须标记为高级模板、连续模板或专业模板
2. 模板扣点 ≥ 5 credits
3. 模板详情必须显示高级标签

---

## 三、模板详情提示规则

Template Detail 面板中，若模板包含隐藏能力，必须显示标签：

| 标签 ID | 中文 | 英文 |
|---------|------|------|
| advanced_camera | 高级镜头 | Advanced Camera |
| advanced_lighting | 高级光影 | Advanced Lighting |
| director_preset | 导演控制 | Director Preset |
| continuity | 连续模板 | Continuity |
| multi_scene | 多分镜 | Multi Scene |
| cinematic_mode | 电影模式 | Cinematic Mode |
| anime_mode | 动漫模式 | Anime Mode |
| drama_mode | 剧情模式 | Drama Mode |

---

## 四、UI 限制规则

隐藏镜头语言：
- 不出现在 Camera Control 列表
- 不出现在 Scene Strategy 列表
- 不出现在普通用户下拉框

允许：
- 模板内部使用
- 模板应用后自动生效
- 用户可看到结果，但不能直接选

用户若想改，必须通过 Director Control、Camera Control（可见层）或更换模板。

---

## 五、模板应用后的行为

当模板使用隐藏镜头语言时：

- `Scene.notes` 通过 `camera_language:` marker 存储 Layer 2 值
- UI 显示为对应可见层名称（如 `cinematic_dark` →「电影叙事」）
- 或显示为「模板默认」

不能直接显示内部名称。

---

## 六、扣点系统绑定规则

| 类型 | 扣点 |
|------|------|
| Free | 0 |
| 普通模板 | 3 |
| 高级模板 | 5 |
| 连续模板 | 5 |
| 高级连续模板 | 5 |

高级模板判定条件之一：
- ✔ 使用隐藏镜头语言
- ✔ 使用高级光影预设
- ✔ 使用导演预设
- ✔ 使用 continuity
- ✔ 多分镜
- ✔ 高级 motion

满足任意一条即可判定为高级模板。

---

## 七、实现参考

- 镜头语言分层定义：`src/content/cameraLanguageLayers.ts`
- Camera Control 仅展示 Layer 1：`src/components/Sidebar.tsx`
- 模板 advancedTags：`src/types/templateWorkspace.ts`、`src/data/templateLibrary400.ts`
- 模板详情标签：`src/components/TemplateWorkspace/TemplateWorkspaceDetail.tsx`
