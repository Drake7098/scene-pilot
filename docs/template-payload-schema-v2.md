# ScenePilotix 模板 Spec → Payload 映射 v2

定义 TemplateSpec 到 TemplatePayload 的映射关系。Payload 为 apply 前的中间结构，最终经 `applyPayloadToProject` 写入 Project/Scene/Layer。

---

## 1. 根层映射

| spec 字段 | payload 目标 | 说明 |
|-----------|--------------|------|
| familyId | （不写入 payload，用于 index/loader） | |
| variantId | （不写入 payload，用于 index/loader） | |
| mediaType | projectDefaults.mediaType | |
| storyPlan | projectDefaults.storyPlan | shotPlan |
| ratio | projectDefaults.aspectRatio | |
| sceneCount | projectDefaults.sceneCount | 推导 |
| sceneSpec | scenes[] | 每项 → TemplateSceneSnapshot |
| advancedTags | （不写入 payload，用于 index） | |
| applyMode | （不写入 payload，用于 apply 时控制写入范围） | |

---

## 2. spec.cameraLanguage → payload

| spec | payload |
|------|---------|
| sceneSpec[].cameraLanguage | scene.notes 追加 `camera_language: {id}` |

**实现**：`applyCameraLanguage(notes, id)` 或直接写入 `notes` 中的 `camera_language:` marker。

**层级**：
- L1：写入 canonical_id
- L2：写入 L2 id，用户见 L1 映射标签

---

## 3. spec.proMotion → payload

| spec | payload |
|------|---------|
| sceneSpec[].proMotion.basic | scene.notes 追加 `pro_basic_motion: {id}` |
| sceneSpec[].proMotion.plus | scene.notes 追加 `pro_plus_motion: {id}` |

**实现**：写入 scene.notes marker。有 proMotion 时，camera.movement 不输出（R-MUTEX-001）。

---

## 4. spec.directorPack → payload

| spec | payload |
|------|---------|
| sceneSpec[].directorPack | scene.notes 追加 `director_pack: {id}` |

**实现**：写入 scene.notes marker。directorPack 可携带 lightingProfileIds。

---

## 5. spec.lightingPack → payload

| spec | payload |
|------|---------|
| sceneSpec[].lightingPack | lightingProfileIds |

**实现**：lightingProfileIds 无独立存储时，经 classicMode/directorPack 间接带入；或写入 scene 的 lightingSetup / 扩展字段。Phase 1 可经 classic/director 携带。

**备选**：若 payload 支持独立 lightingProfileIds，则直接写入。

---

## 6. spec.continuitySpec → payload

| spec | payload |
|------|---------|
| sceneSpec[].continuitySpec.entryDir | scene.entryDir |
| sceneSpec[].continuitySpec.exitDir | scene.exitDir |
| sceneSpec[].continuitySpec.inherit | scene.inheritFromPrevious |
| sceneSpec[].continuitySpec.transition | scene.transitionType |

**实现**：写入 scene 顶层字段。continuity 规则写入 payload.continuity。

---

## 7. spec.composition → payload

| spec | payload |
|------|---------|
| objectSpec.composition.x | layer.kf[].x |
| objectSpec.composition.y | layer.kf[].y |
| objectSpec.composition.w | layer.kf[].w |
| objectSpec.composition.h | layer.kf[].h |
| objectSpec.composition.rot | layer.kf[].rot |
| objectSpec.composition.t0 | layer.kf[0].t |
| objectSpec.composition.t1 | layer.kf[1].t |

**实现**：composition 映射到 layer.kf 关键帧数组。kf 格式：`[{ t, x, y, w, h, rot }, ...]`。

---

## 8. spec.objects → payload

| spec | payload |
|------|---------|
| objectSpec[] | scene.layers[] 或 payload 的 objects（依 apply 链） |
| objectSpec.objectType | layer.type |
| objectSpec.role | （可选，无直接存储时可并入 notes） |
| objectSpec.look | layer.look |
| objectSpec.continuity | layer.notes 追加 `@continuityId:{id}` |
| objectSpec.refs.policy | layer.referencePolicy |
| objectSpec.refs.links | layer.referenceLinks |
| objectSpec.composition | layer.kf |

**实现**：每个 ObjectSpec 产出一个 Layer，含 type, look, kf, notes, referencePolicy, referenceLinks 等。

---

## 9. 其余 sceneSpec 字段映射

| spec | payload |
|------|---------|
| sceneSpec[].shot | scene.camera.shot |
| sceneSpec[].movement | scene.camera.movement |
| sceneSpec[].time | scene.lighting.time |
| sceneSpec[].keyDir | scene.lighting.key_dir |
| sceneSpec[].mood | scene.lighting.mood |
| sceneSpec[].compositionPreset | scene.notes 的 image_pro_effects 或 compositionPreset |
| sceneSpec[].bg | scene.notes 追加 `bg: {...}` |
| sceneSpec[].duration_s | scene.duration_s |
| sceneSpec[].classicMode | scene.notes 追加 `video_classic_mode:` 或 `image_classic_mode:` |

---

## 10. 映射汇总表

| spec 路径 | payload 目标 |
|-----------|--------------|
| spec.mediaType | projectDefaults.mediaType |
| spec.storyPlan | projectDefaults.storyPlan |
| spec.ratio | projectDefaults.aspectRatio |
| spec.sceneCount | projectDefaults.sceneCount |
| spec.sceneSpec[i].shot | scenes[i].camera.shot |
| spec.sceneSpec[i].movement | scenes[i].camera.movement |
| spec.sceneSpec[i].cameraLanguage | scenes[i].notes `camera_language:` |
| spec.sceneSpec[i].proMotion | scenes[i].notes `pro_basic_motion:` `pro_plus_motion:` |
| spec.sceneSpec[i].directorPack | scenes[i].notes `director_pack:` |
| spec.sceneSpec[i].lightingPack | lightingProfileIds（或经 classic/director） |
| spec.sceneSpec[i].time, keyDir, mood | scenes[i].lighting |
| spec.sceneSpec[i].continuitySpec | scenes[i].entryDir, exitDir, inheritFromPrevious, transitionType |
| spec.sceneSpec[i].compositionPreset | scenes[i].notes image_pro_effects |
| spec.sceneSpec[i].objects[j].composition | layers[j].kf |
| spec.sceneSpec[i].objects[j] | scenes[i].layers[j] |
