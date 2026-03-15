# Template600 Progress — Batch 2

**Stage:** Template600 Spec Build — Batch 2

**Families:** 20  
**Variants:** 120  
**Payloads:** 120  

**Schema check:** pass  
**符合 spec:** yes  
**修改架构:** no  
**修改 engine:** no  

**Stop:** Batch 2 complete, variants ≥ 120

---

## Counts

| 类型 | 数量 |
|------|------|
| families | 20 |
| variants | 120 |
| payloads | 120 |

---

## Families (20)

| id | category | mediaType |
|----|----------|-----------|
| product_hero | product | image |
| product_center_display | product | image |
| product_compare | product | image |
| dialogue_duo | dialogue | video |
| solo_speaker | dialogue | video |
| interview_layout | dialogue | video |
| faceoff_scene | dialogue | video |
| selling_point_ad | ad | image |
| talking_head_ad | ad | video |
| social_vertical_ad | social | video |
| opening_shot | short_video | video |
| emotional_peak | short_video | video |
| character_entrance | short_video | video |
| turning_point_shot | short_video | video |
| push_in_motion | camera_move | video |
| pull_out_motion | camera_move | video |
| pan_motion | camera_move | video |
| tracking_motion | camera_move | video |
| center_composition | composition | image |
| symmetry_composition | composition | image |

---

## 分类覆盖

| 要求 | 映射 |
|------|------|
| product | product_hero, product_center_display, product_compare |
| dialogue | dialogue_duo, solo_speaker, interview_layout, faceoff_scene |
| motion | camera_move (push, pull, pan, tracking) |
| composition | center_composition, symmetry_composition |
| camera | camera_move |
| emotion | short_video (emotional_peak, turning_point_shot) |
| ad | selling_point_ad, talking_head_ad |
| shortvideo | opening_shot, emotional_peak, character_entrance, turning_point_shot |
| cinema | cinematic variants |
| 直播 | social_vertical_ad |
| 口播 | solo_speaker, talking_head_ad |
| 剧情 | turning_point_shot, emotional_peak |
| 商品 | product families |
| 特写 | basic_close, insert_closeup variants |
| 转场 | camera_move (push/pull motion) |

---

## 是否改 schema

**否**

---

## 是否改 engine

**否**
