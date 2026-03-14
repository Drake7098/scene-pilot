# ScenePilotix Phase 1 暗色禁选策略 v1

定义哪些内容应“暗色禁选”（disabled），以及禁选原因、触发条件、用户解锁方式。

---

## 禁选类型定义

| 类型 | 说明 | UI 表现 |
|------|------|----------|
| **暗色禁选** | 置灰，不可点击 | disabled + tooltip 说明原因 |
| **隐藏** | 不显示 | 条件不满足时不渲染 |
| **只读** | 可看不可改 | readonly |

---

## 1. 高级镜头语言

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| camera_language L2 项 | L2 仅模板带入，用户不可直接选 | 始终对用户禁用 | 不提供解锁；用户可选 L1 |
| camera_language L3 | 引擎层，Phase 1 不暴露 | 始终隐藏 | 无 |
| 部分 L1（如 anime_dramatic）| 当前模板为 base 非 anime | template.domain≠anime_continuity 且 非 anime 类模板 | 换用 anime 模板 |

---

## 2. 高级运镜

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| pro_plus_motion | 仅高级模板可带入 | template.cost<5 且 非 continuity 非 starter | 换用 5 credits 或 continuity 模板 |
| pro_plus_motion 部分项 | 与已选 basic 或同 category 冲突 | proPlusDisabledIds | 取消冲突项 |
| movement | 被 pro motion 强占 | pro_basic_motion 或 pro_plus_motion 有值 | 清空 pro motion |

---

## 3. 高级导演包

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| directorPack | 仅高级模板可带入 | template.cost<5 且 非指定高级 variant | 换用 5 credits 模板 |
| directorPack 部分项 | 与 classicMode 冲突（若定义） | classicMode 已选且 有互斥规则 | 取消 classicMode |

**注**：Phase 1 导演包与 classic 可并存；若有互斥再细化。

---

## 4. 高级光影包

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| lightingPack 独立选择器 | Phase 1 可无；若有则仅高级 | template.cost<5 | 换用 5 credits 模板 |
| lightingProfileIds 直接编辑 | 经 classic/director 间接，无独立 UI | 始终 | 通过 classic/director 选择 |

---

## 5. 不适用当前模板类型的字段

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| entryDir, exitDir, inheritFromPrevious | 单镜无意义 | shotPlan=single | 切到 continuous/multicam/edit |
| transition | 单镜无意义 | shotPlan=single | 同上 |
| movement, pro motion（视频向）| 图片模式 | mediaType=image | 切到 video |
| imageProEffects | 视频模式 | mediaType=video | 切到 image |
| image_classic_mode | 视频模式 | mediaType=video | 同上 |
| video_classic_mode | 图片模式 | mediaType=image | 同上 |

---

## 6. 被模板默认强占的字段

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| 全部 scene 字段 | applyMode=layout_only | 用户选 layout_only 应用 | 重新应用选 layout_plus_style 或 full_workflow |
| cameraLanguage（L2 映射）| 模板写入 L2，用户见只读 | 模板带入 L2 | 点“自定义”选 L1，清除 L2 |
| continuityId | 模板锁定锚点；**唯一入口 Object Properties**，Scene 禁止编辑 | template 写入且 layoutLocked | 解除锚点（Object Properties 入口） |

---

## 7. 被 continuity 锁定的字段

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| continuityId 解除 | 破坏 continuity；**仅 Object Properties 可编辑** | 对象有 @continuityId | Object Properties 提供“解除锚点”操作 |
| 删除带 continuityId 的对象 | 破坏 continuity | 同上 | 先解除锚点再删 |
| entryDir/exitDir 大改 | 可能导致衔接失效 | continuity 模板 | 允许改，可 warning |

---

## 8. 被 platform mode 禁止的字段

| 项目 | 禁选原因 | 触发条件 | 用户如何解锁 |
|------|----------|----------|--------------|
| 无 | Phase 1 platform 不直接禁字段 | - | - |
| 备选：structureIntensity=soft 时 | 简化模式隐藏部分高级项 | 未来可加 | 切 platform 或 提高 structureIntensity |

---

## 禁选决策表（简明）

| 字段/区域 | 禁选条件 | 解锁方式 |
|-----------|----------|----------|
| movement | pro_motion 有值 | 清空 pro_motion |
| pro_plus_motion | cost<5 且 非高级模板 | 换模板 |
| camera_language L2 | 始终（用户不可选） | 无 |
| directorPack | cost<5（若策略收紧） | 换模板 |
| lightingPack | cost<5（若有独立选择器） | 换模板 |
| entryDir/exitDir/transition | shotPlan=single | 改 shotPlan |
| imageProEffects | mediaType=video | 改 mediaType |
| video_classic_mode | mediaType=image | 改 mediaType |
| 全部（layout_only）| applyMode=layout_only 应用后 | 重新应用选其他 mode |
| continuityId 解除/删除 | 有 @continuityId；Scene 禁止编辑，仅 Object Properties | 先解除锚点 |
