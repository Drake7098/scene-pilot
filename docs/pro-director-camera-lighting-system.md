# Pro Director / Camera / Lighting 系统设计

> 各模块字段设计与主/子字段关系

---

## 一、Director Control

### 主字段

| 字段 | 类型 | 说明 |
|------|------|------|
| 导演预设 | 单选 | 目标导向预设，一组 shot / movement / language / lighting / pacing 组合 |

### 建议预设列表

| 预设 | 适用 |
|------|------|
| 模板默认 | 沿用当前模板自带设置 |
| 商业广告 | 精致、高对比、产品感 |
| 品牌大片 | 电影感、克制、高质感 |
| 社媒快节奏 | 直给、明亮、快切 |
| 电影叙事 | 克制约束、情绪推进 |
| 对话场面 | 中近景、反打、反应 |
| 情绪冲突 | 特写、压迫感、戏剧化 |
| 人物出场 | 建立空间、引入主体 |
| 高级产品展示 | 棚拍光、简洁、突出主体 |
| 动漫戏剧化 | 高对比、夸张运动、情绪化 |

### 可选子字段（首轮可折叠）

- 节奏倾向
- 叙事强度

### 与现有数据映射

- 当前实现：`director_pack:` + 经典模式（`pro_classic:` / `image_classic:`）等价于「导演预设」
- 未来可扩展为独立 `directorPreset` 字段，对应更丰富预设表

---

## 二、Camera Control

### 主字段结构

| 层级 | 字段 | 说明 |
|------|------|------|
| 一级 | 镜头任务 | 建立空间、人物出场、双人对话、跟随叙事、产品展示、情绪特写、高潮推进、结尾停顿 |
| 二级 | 景别 | 特写、近景、中景、全景、远景 |
| 二级 | 运动 | 静止、推近、拉远、横移、跟拍、环绕、升降 |
| 一级 | 镜头语言 | 克制写实、广告精致、电影叙事、社媒直给、情绪压迫、动漫戏剧化、悬念观察式、对话覆盖式 |
| 多镜 | 转场 | cut、dissolve、match cut、fade、hold |

### 镜头任务（建议）

| 任务 | 典型 shot | 典型 movement |
|------|-----------|---------------|
| 建立空间 | wide | slow_push_in |
| 人物出场 | medium | static / slow_pan |
| 双人对话 | medium | static / handheld |
| 跟随叙事 | medium | dolly / handheld |
| 产品展示 | close / medium | static / slow_push_in |
| 情绪特写 | close | static |
| 高潮推进 | close / medium | push_in / handheld |
| 结尾停顿 | wide / medium | static |

### 镜头语言（建议）

| 选项 | 气质 |
|------|------|
| 克制写实 | 克制、秩序、不抢戏 |
| 广告精致 | 高完成度、商业感 |
| 电影叙事 | 情绪推进、节奏控制 |
| 社媒直给 | 直接、明亮、快节奏 |
| 情绪压迫 | 特写、戏剧化、压迫感 |
| 动漫戏剧化 | 夸张、高对比、情绪化 |
| 悬念观察式 | 观察感、留白 |
| 对话覆盖式 | 覆盖式、反打、反应 |

### 与现有数据映射

- 景别 → `scene.camera.shot`
- 运动 → `scene.camera.movement`
- 镜头语言 → `pro_motion:`（PRO+ 镜头语言）或 `image_pro_effect:`（画面语言）
- 转场 → `scene.transitionType`

---

## 三、Lighting / Atmosphere

### 主字段结构

| 字段 | 说明 |
|------|------|
| 时间氛围 | 白天、黄昏、夜晚、清晨、阴天、室内人造光 |
| 主光方向 | 正面、侧光、逆光、顶光、边缘光、柔和漫射 |
| 氛围强度 | 自然、干净商业、戏剧化、压迫感、温暖、冷感、高级感、悬疑感 |
| 光影风格包 | 商业棚拍、电影低照度、明亮社媒、霓虹都市、高级产品光、动漫高对比、柔和情绪光 |

### 与现有数据映射

- 时间氛围 → `scene.lighting.time`
- 主光方向 → `scene.lighting.key_dir`
- 氛围强度 → `scene.lighting.mood`
- 光影风格包 → 可基于 `lightingProfiles` 扩展，或新增 `lightingStylePack` 字段

---

## 四、模块关系

```
Director Control (导演预设)
    └─ 影响：Camera 默认、Lighting 默认、节奏倾向

Camera Control (镜头任务 / 景别 / 运动 / 镜头语言 / 转场)
    └─ 独立于 Lighting，但可与 Director 预设联动

Lighting / Atmosphere (时间 / 主光 / 氛围 / 风格包)
    └─ 独立于 Camera，但可与 Director 预设联动
```

三者可独立调整，也可通过 Director 预设一次性设定合理组合。
