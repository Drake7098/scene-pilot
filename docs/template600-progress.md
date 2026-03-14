# Template600 Progress — Spec 构建阶段

**Stage:** Template600 Spec Build

**Families:** 10  
**Variants:** 47  
**Payloads:** 47  

**Schema check:** pass  
**符合 spec:** yes  
**修改架构:** no  

**Stop:** Phase 1 complete, awaiting next phase

---

## Counts

| 类型 | 数量 |
|------|------|
| families | 10 |
| variants | 47 |
| payloads | 47 |

---

## Families (10)

| id | category | mediaType | variants |
|----|----------|-----------|----------|
| product_hero | product | image | 5 |
| dialogue_duo | dialogue | video | 5 |
| opening_shot | short_video | video | 5 |
| push_in_motion | camera_move | video | 5 |
| center_composition | composition | image | 4 |
| selling_point_ad | ad | image | 4 |
| solo_speaker | dialogue | video | 5 |
| product_center_display | product | image | 4 |
| tracking_motion | camera_move | video | 5 |
| emotional_peak | short_video | video | 5 |

---

## Schema Check

- **Family spec:** id, name, nameZh, category, description, mediaType, storyPlan, shotRange, movementRange, cameraLanguageRange, lightingRange, compositionRange, objectTypes, advancedTags, variants[] — 均来自 template-family-spec / template-spec-schema
- **Variant spec:** id, familyId, name, nameZh, applyMode, tags, payloadRef — 符合要求
- **Payload spec:** projectDefaults, scenes[] — 符合 template-payload-schema-v2
- **applyMode:** layout_only | layout_plus_style | full_workflow 仅使用既有取值

---

## 是否符合 spec

**是**

- 字段来自 template-spec-schema-v1, template-payload-schema-v2, template-family-spec
- 分类来自 market-technique-corpus, template-family-spec README
- 取值来自 market-technique-corpus canonical_id

---

## 是否修改架构

**否**

- 未新增字段
- 未新增 taxonomy
- 未修改 schema
- 未修改 template engine / prompt engine / rule engine
- 未修改 compileV2 / resolveSceneStrategy
- 仅新增 `templates/` 目录下 spec 数据文件

---

## 目录结构

```
templates/
  families/    10 × .json
  variants/    47 × .json
  payloads/    47 × .json
```

---

## 阶段停止条件

- 已生成 ~50 templates
- 结构已验证
- 等待下一阶段指令
