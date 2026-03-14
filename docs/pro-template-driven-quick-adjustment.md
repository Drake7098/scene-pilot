# 模板驱动的快速调整流程

> 模板自动带入哪些默认值，用户只需改哪些高价值选项，如何实现 1～2 分钟快速调整

---

## 一、模板应自动带入的默认值

模板不应只带布局和对象，而应带入整套「导演意图 + 镜头 + 光」的默认配置：

| 类别 | 字段 | 说明 |
|------|------|------|
| 导演 | directorPreset | 导演预设，如「电影叙事」「商业广告」 |
| 镜头 | cameraTask | 镜头任务，如「建立空间」「人物出场」 |
| 镜头 | shot | 景别 |
| 镜头 | movement | 镜头运动 |
| 镜头 | cameraLanguage | 镜头语言风格 |
| 光 | lightingPreset | 光影风格包 |
| 光 | time / keyDir / mood | 时间氛围、主光方向、氛围强度 |
| 连续 | continuity behavior | 继承、carry-over、方向等 |
| 导出 | platform recommendation | 推荐平台（仅在导出区展示） |

### 当前实现与扩展

- **已有**：模板 payload 中的 `raw` scene 可含 `camera`、`lighting`、`notes`（含 director_pack、pro_motion 等）
- **待扩展**：模板 schema 明确支持 `directorPreset`、`cameraTask`、`lightingPreset` 等高层字段
- **待扩展**：`applyPayloadToProject` 时写入这些默认值

---

## 二、用户只需改的高价值选项

目标：**1～2 分钟内完成有效调整**。

### 必改（通常 1～3 项）

| 选项 | 模块 | 说明 |
|------|------|------|
| 主体/对象内容 | Template Slots / Object Properties | 少量文字或参考图 |
| 导演预设 | Director Control | 1 个 |
| 镜头任务或景别 | Camera Control | 1 个 |
| 光与氛围 | Lighting / Atmosphere | 1 个 |

### 可选微调

| 选项 | 模块 | 说明 |
|------|------|------|
| 景别 / 运动 | Camera Control | 对默认不满时再调 |
| 镜头语言 | Camera Control | 想更精细控制时 |
| 转场 | Camera Control | 多镜项目 |
| 氛围强度 | Lighting / Atmosphere | 微调气质 |

### 不需要改的

- 大量底层参数（time、keyDir、mood 等）——由导演预设和光影风格包带出
- Prompt 文本框——仅作观察与复制
- Platform Mode——导出时再选

---

## 三、如何实现 1～2 分钟快速调整

### 1. 模板应用后首屏突出 4 项

应用模板后，左侧应优先展示：

1. **导演预设**（Director Control）
2. **镜头任务** 或 **景别**（Camera Control）
3. **光与氛围** 或 **光影风格包**（Lighting / Atmosphere）
4. （如有）**主体/对象** 快速入口（可跳 Template Slots）

用户只需在这 4 项中各做 0～1 次选择。

### 2. 默认值即「可用结果」

- 模板自带 directorPreset、cameraTask、lightingPreset
- 不选 = 使用模板默认
- 选 = 覆盖为预设值
- 避免「不选就出错」或「必须填很多才能生成」

### 3. 层级清晰，不堆参数

- 一级字段：导演预设、镜头任务、镜头语言、光影风格包
- 二级字段：景别、运动、时间、主光、氛围——折叠或放在子面板
- 不把 key_dir、mood 等当主入口

### 4. 目标时间

- **新手**：3 分钟内完成第一次有效调整
- **熟手**：1～2 分钟内完成

---

## 四、流程总结

```
选模板 → 应用 → 回到 Pro
    ↓
看到「当前模板 + 导演 / 镜头 / 光」默认
    ↓
改 1）导演预设（可选）
改 2）镜头任务或景别（可选）
改 3）光与氛围（可选）
改 4）主体/对象内容（必改 1～2 处）
    ↓
直接生成
```

模板 + 预设组合 > 用户自己拼字段。
