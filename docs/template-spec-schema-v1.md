# ScenePilotix Phase 1 模板规格结构 v1 (Template Spec Schema)

模板规格定义结构，用于后续生成 600 模板。**不是 payload、不是 index、不是 UI**，是规格定义。

---

## 1. 根结构 TemplateSpec

```ts
TemplateSpec {
  // === 标识 ===
  familyId: string
  variantId: string

  // === 项目级 ===
  mediaType: "image" | "video"
  storyPlan: "single" | "continuous" | "multi_cam" | "edited"
  ratio: "16:9" | "9:16" | "1:1"

  // === 场景级 ===
  sceneCount: number
  sceneSpec: SceneSpec[]

  // === 能力与应用 ===
  advancedTags?: AdvancedTag[]
  applyMode?: ApplyMode
}
```

---

## 2. SceneSpec

```ts
SceneSpec {
  // === 镜头 ===
  shot?: ShotId
  movement?: MovementId
  cameraLanguage?: CameraLanguageId    // L1 或 L2（L2 仅高级模板）
  proMotion?: ProMotionSpec           // pro_basic + pro_plus

  // === 导演与经典 ===
  classicMode?: ClassicModeId
  directorPack?: DirectorPackId

  // === 布光 ===
  time?: LightingTimeId
  keyDir?: KeyDirId
  mood?: MoodId
  lightingPack?: LightingPackId

  // === 构图 ===
  compositionPreset?: CompositionPresetId

  // === 背景 ===
  bg?: string

  // === 时长 ===
  duration_s?: number

  // === 连续性（多镜时有效）===
  continuitySpec?: ContinuitySpec

  // === 对象 ===
  objects: ObjectSpec[]
}
```

### SceneSpec 取值约束（来自 market-technique-corpus）

| 字段 | 取值集 | 说明 |
|------|--------|------|
| shot | ecu, cu, mcu, ms, mls, fs, ls, xls, insert_closeup, over_shoulder, pov | shot-size-taxonomy |
| movement | static, slow_push_in, slow_pull_out, pan_left, pan_right, tilt_up, tilt_down, follow_front, follow_back, orbit_left, orbit_right, handheld 等 | camera-movement-taxonomy |
| cameraLanguage | L1: realistic_restrained, cinematic_narrative, dialogue_cover, product_quality, social_direct, emotional_pressure, suspense_atmosphere, anime_dramatic, premium_blockbuster；L2: cinematic_soft, hero_entry 等（仅高级） | camera-language-taxonomy |
| proMotion | { basic?: MovementId, plus?: ProPlusId } | 有值时 movement 无效 |
| classicMode | video_classic_mode / image_classic_mode 取值 | classic 模式 id |
| directorPack | director_pack 取值 | 导演包 id |
| time | day, sunset, golden_hour, blue_hour, night | lighting-taxonomy |
| keyDir | top_left, top_right, backlight, rim_light | lighting-taxonomy |
| mood | warm, cold, bright, cinematic, mysterious | lighting-taxonomy |
| lightingPack | natural_skin_readability, low_key_edge_separation, premium_focal_highlights 等 | lighting-taxonomy |
| compositionPreset | center_pressure, depth_split, rule_of_thirds, left_right_standoff, cinematic_air 等 | composition-taxonomy |

---

## 3. ProMotionSpec

```ts
ProMotionSpec {
  basic?: string      // pro_basic_motion canonical_id
  plus?: string       // pro_plus_motion canonical_id（仅高级模板）
}
```

---

## 4. ContinuitySpec

```ts
ContinuitySpec {
  entryDir?: string   // entry_dir canonical_id
  exitDir?: string    // exit_dir canonical_id
  inherit?: boolean   // inherit_from_previous
  transition?: string // cut, dissolve, reverse_angle, camera_continues 等
}
```

取值来自 continuity-transition-taxonomy。

---

## 5. ObjectSpec

```ts
ObjectSpec {
  objectType: string       // character | product | prop | text | shape
  role?: string            // character | subject | prop（可选）
  look?: string            // 外观描述
  continuity?: string      // continuityId 锚点（如 char_a, prop_main）
  refs?: RefSpec           // 参考图策略
  composition: CompositionSpec
}
```

### RefSpec

```ts
RefSpec {
  policy?: "optional" | "required"
  links?: string[]         // 参考链接
}
```

---

## 6. CompositionSpec

```ts
CompositionSpec {
  x: number
  y: number
  w: number
  h: number
  rot?: number             // 旋转（度）
  t0?: number              // 视频起帧
  t1?: number              // 视频止帧
}
```

---

## 7. AdvancedTag

```ts
AdvancedTag = 
  | "advanced_camera"
  | "advanced_lighting"
  | "director_preset"
  | "continuity"
  | "multi_object"
  | "cinematic_mode"
  | "drama_mode"
  | "anime_mode"
```

cost=5 的模板必须至少含其一。

---

## 8. ApplyMode

```ts
ApplyMode = "layout_only" | "layout_plus_style" | "full_workflow"
```

| 值 | 说明 |
|----|------|
| layout_only | 仅对象布局、objectType、continuityId |
| layout_plus_style | + shot, movement, lighting, cameraLanguage |
| full_workflow | 全部 scene 字段 + project 覆盖 |

---

## 9. 与规范字段映射

| TemplateSpec 字段 | 规范字段 (normalized-field-architecture) |
|-------------------|------------------------------------------|
| familyId, variantId | 标识，非规范字段 |
| mediaType | mediaType |
| storyPlan | shotPlan |
| ratio | ratio |
| sceneCount | 推导 |
| shot | shot |
| movement | movement |
| cameraLanguage | cameraLanguage (L1/L2) |
| proMotion | proMotion |
| classicMode | classicMode |
| directorPack | directorPack |
| time, keyDir, mood | time, keyDir, mood |
| lightingPack | lightingPack |
| compositionPreset | compositionPreset |
| bg | bg |
| duration_s | duration_s |
| continuitySpec | entryDir, exitDir, inheritFromPrevious, transition |
| objectType, role, look, continuity | objectType, role, look, continuityId |
| refs | localRefs, referencePolicy, referenceLinks |
| x, y, w, h, rot, t0, t1 | 规范 Composition |

---

## 10. 输出摘要

| 项目 | 数量 |
|------|------|
| **schema 字段数** | 41 |
| **scene 字段数** | 15 |
| **object 字段数** | 6 |
| **advanced 字段数** | 8 |

### 详细计数

| 层级 | 字段 | 数量 |
|------|------|------|
| **TemplateSpec 根** | familyId, variantId, mediaType, storyPlan, ratio, sceneCount, sceneSpec, advancedTags, applyMode | 9 |
| **SceneSpec** | shot, movement, cameraLanguage, proMotion, classicMode, directorPack, time, keyDir, mood, lightingPack, compositionPreset, bg, duration_s, continuitySpec, objects | 15 |
| **ContinuitySpec** | entryDir, exitDir, inherit, transition | 4 |
| **ObjectSpec** | objectType, role, look, continuity, refs, composition | 6 |
| **CompositionSpec** | x, y, w, h, rot, t0, t1 | 7 |
| **AdvancedTag** | advanced_camera, advanced_lighting, director_preset, continuity, multi_object, cinematic_mode, drama_mode, anime_mode | 8 |

**schema 字段数** = 9 + 15 + 4 + 6 + 7 = 41
