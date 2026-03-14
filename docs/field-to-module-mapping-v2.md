# ScenePilotix Phase 1 字段 → 模块映射 v2

每个规范字段归属唯一主编辑模块，禁止多入口编辑。

---

## 模块列表

| 模块 | 说明 |
|------|------|
| **Current Template** | 模板工作台：选择/应用模板、applyMode |
| **Scenes / Continuity** | 场景列表、连续性、时长、衔接、方向 |
| **Director Control** | 导演包、经典模式 |
| **Camera Control** | 景别、运动、Pro 运镜、镜头语言 |
| **Lighting / Atmosphere** | 光线时间、主光方向、氛围、布光方案 |
| **Scene Background** | 背景预设、自定义描述、背景参考图 |
| **Object Properties** | 对象类型、外观、备注、参考图 |
| **Composition** | 对象坐标、尺寸、构图预设 |
| **Export / Platform** | 平台、导出方式、结构强度 |

---

## 字段 → 主模块映射

### Project Layer

| canonical_name | 主编辑模块 | 说明 |
|----------------|------------|------|
| mediaType | Current Template | 模板带入；无模板时项目设置 |
| ratio | Current Template | 模板带入；可项目级覆盖 |
| shotPlan | Scenes / Continuity | 场景计划 |
| platformTarget | Export / Platform | 导出面板 |
| exportMethod | Export / Platform | 导出面板 |
| structureIntensity | 只读 | 由 sceneCount/template 推导 |
| continuity | Scenes / Continuity | 连续性视图 |
| sceneCount | 只读 | 由 scenes 推导 |
| totalDuration | 只读 | 由 scenes 推导 |
| workspaceMode | 项目设置 | Quick/Pro 切换 |
| currentTemplate | 只读 | 应用后展示 |

### Scene Layer

| canonical_name | 主编辑模块 | 说明 |
|----------------|------------|------|
| name | Scenes / Continuity | 场景卡片双击 |
| duration_s | Scenes / Continuity | 场景时长 |
| shot | Camera Control | 景别选择器 |
| movement | Camera Control | 运动选择器（有 pro_motion 时禁用） |
| cameraLanguage | Camera Control | 镜头语言选择器 |
| proMotion | Camera Control | Pro 运镜（基础 + PRO+） |
| classicMode | Director Control | 经典模式 |
| directorPack | Director Control | 导演包 |
| time | Lighting / Atmosphere | 光线时间 |
| keyDir | Lighting / Atmosphere | 主光方向 |
| mood | Lighting / Atmosphere | 氛围 |
| lightingPack | Lighting / Atmosphere | 布光方案（Phase 1 可经 classic/director） |
| transition | Scenes / Continuity | 衔接方式 |
| entryDir | Scenes / Continuity | 入场方向 |
| exitDir | Scenes / Continuity | 离场方向 |
| inheritFromPrevious | Scenes / Continuity | 继承上一镜 |
| shotNote | Scenes / Continuity | 分镜备注 |
| bg | Scene Background | 背景自定义 |
| backgroundRef | Scene Background | 背景参考图 |
| media | Camera Control | 单镜 media 覆盖（高级） |
| compiler | Camera Control | v1/v2（高级） |
| sceneTier | Director Control | 场景层级（高级） |
| v2Mode | Camera Control | V2 模式（高级） |
| imageProEffects | Director Control | 图片专业效果 |

### Object Layer

| canonical_name | 主编辑模块 | 说明 |
|----------------|------------|------|
| objectType | Object Properties | 类型 |
| look | Object Properties | 外观 |
| shapeDesc | Object Properties | 形状描述 |
| externalPrompt | Object Properties | 对象局部提示 |
| notes | Object Properties | 备注 |
| continuityId | Object Properties | 连续性锚点绑定；Scene 禁止编辑 |
| localRefs | Object Properties | 本地参考图 |
| referencePolicy | Object Properties | 参考策略 |
| referenceLinks | Object Properties | 参考链接 |
| z | Composition | 层级（或 Object 列表） |
| layoutLocked | Object Properties | 布局锁定 |

### Composition Layer

| canonical_name | 主编辑模块 | 说明 |
|----------------|------------|------|
| x, y, w, h, rot | Composition | Stage 画布 / PropsPanel |
| t0, t1 | Composition | Stage 画布 keyframe |
| compositionPreset | Director Control | image_pro_effects |

### Hidden / Advanced Layer

| canonical_name | 主编辑模块 | 说明 |
|----------------|------------|------|
| cameraLanguage L2 | Current Template | 模板带入，不暴露 UI |
| cameraLanguage L3 | engine_only | 无 UI |
| pro_plus_motion | Camera Control | Pro+ 运镜 |
| lightingProfileIds | Director Control / Lighting | 经 classic/director 间接 |
| directorInternalCues | engine_only | 导演包内部 |
| stability | Director Control | 稳定性（高级） |

---

## 模块 → 字段汇总

| 模块 | 字段数 | 字段列表 |
|------|--------|----------|
| Current Template | 3 | mediaType, ratio, currentTemplate(只读) |
| Scenes / Continuity | 10 | shotPlan, continuity, name, duration_s, transition, entryDir, exitDir, inheritFromPrevious, shotNote |
| Director Control | 6 | classicMode, directorPack, sceneTier, imageProEffects, compositionPreset, stability |
| Camera Control | 8 | shot, movement, cameraLanguage, proMotion, media, compiler, v2Mode |
| Lighting / Atmosphere | 4 | time, keyDir, mood, lightingPack |
| Scene Background | 2 | bg, backgroundRef |
| Object Properties | 10 | objectType, look, shapeDesc, externalPrompt, notes, continuityId, localRefs, referencePolicy, referenceLinks, layoutLocked |
| Composition | 4 | x/y/w/h/rot, t0/t1, z |
| Export / Platform | 2 | platformTarget, exportMethod |

---

## 唯一主入口已定义

**是**。上述映射为每个可编辑字段指定唯一主模块，禁止在其他模块重复编辑同一语义字段。continuityId 唯一入口为 Object Properties，Scene 层禁止编辑。

---

## 下一步建议

1. **规则矩阵与禁选策略**：建立 shot vs movement vs pro_motion、classic vs director vs camera_language 的互斥与禁选规则。
2. **applyMode 实现**：按 layout_only / layout_plus_style / full_workflow 区分模板应用写入范围。
3. **camera_language 接入 prompt**：在 formatScenePrompt / compileV2 中接入 camera_language。
4. **payload.continuity 写入 project**：applyPayloadToProject 时写入 project.continuity。
