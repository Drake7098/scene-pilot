# Prompt Batch Test v2

## 阶段目标

- 增强 prompt batch 检查与统计
- 分析 warn 的具体原因
- 输出更详细报告
- 为 Comfy Batch 做准备

本阶段不生成图片，不调用 fal / runway / comfy。

## 新增检查规则

| 规则 | 说明 |
|------|------|
| **1. 长度检查** | >0, <50, >500, >1000, >2000；记录 length_bucket |
| **2. camera** | 是否包含 camera / shot / lens / angle |
| **3. subject** | 是否包含 subject / character / product |
| **4. layout** | 是否包含 layout / position / region / anchor |
| **5. style** | 是否包含 style / lighting / cinematic / mood |
| **6. machine tail** | 是否包含 coords / anchor / region / structural |
| **7. continuity** | 是否包含 @continuityId |
| **8. refs** | 是否包含 reference / ref / image |
| **9. platform token** | 是否包含 platform 特征 token |

## warn_reason 分类

| 原因 | 说明 |
|------|------|
| warn_length_short | 长度 < 50 |
| warn_length_long | 长度 > 4000 |
| warn_missing_camera | 缺少 camera/shot 相关词 |
| warn_missing_style | 缺少 style/lighting 相关词 |
| warn_missing_subject | 缺少 subject/character 相关词 |
| warn_missing_layout | 缺少 layout/position 相关词 |
| warn_missing_machine_tail | 缺少 coords/anchor/structural 结构层 |
| warn_layout_heavy | layout 相关内容占比过高 |
| warn_machine_heavy | machine notes 占比 > 55% |
| warn_continuity_heavy | @continuityId 出现 ≥ 3 次 |
| warn_unknown | 其他 warn |

每条 prompt 可对应多个 warn 原因。

## length_bucket

- `empty` — 长度为 0
- `under_50` — < 50
- `50_500` — 50–500
- `500_1000` — 500–1000
- `1000_2000` — 1000–2000
- `over_2000` — > 2000

## 统计输出

| 维度 | 说明 |
|------|------|
| 总数 | total, ok, warn, fail |
| byFamily | 按 family 分组统计 |
| byTemplate | 按 template 分组统计 |
| byPlatform | 按 platform 分组统计 |
| byApplyMode | 按 applyMode 分组统计 |
| byMediaMode | 按 mediaMode 分组统计 |
| warnReasons | 各 warn 原因计数 |
| lengthStats | byBucket, min, max, avg |

## report.json 结构

```json
{
  "total": 60,
  "ok": 15,
  "warn": 45,
  "fail": 0,
  "byFamily": { "family_id": { "ok": 5, "warn": 10, "fail": 0 } },
  "byTemplate": { ... },
  "byPlatform": { ... },
  "byApplyMode": { ... },
  "byMediaMode": { ... },
  "warnReasons": { "warn_missing_camera": 20, ... },
  "lengthStats": {
    "byBucket": { "500_1000": 30, "1000_2000": 25, ... },
    "min": 1238,
    "max": 1693,
    "avg": 1456
  }
}
```

## 使用方式

```bash
npm run prompt-batch 20 5    # 20 模板 × 5 次
npm run prompt-batch:check   # 重跑检查
npm run prompt-batch:report  # 打印报告
npx tsx scripts/prompt-batch/analyze-prompts.ts  # 详细分析
```

## 建议规模

- 20 × 5
- 30 × 5
- 50 × 5

不直接跑 1000。

## 未修改项

- **Schema**：未修改
- **Template schema**：未修改
- **Payload schema**：未修改
- **Rule engine**：未修改
- **Prompt engine**：未修改
- **compileV2 / resolveSceneStrategy / applyPayloadToProject**：未修改
- **Export pipeline / platform adapt**：未修改
- **Core model**：未新增字段
- **UI / 页面**：未新增

## 是否可进入 Comfy Batch

在以下条件满足后可进入：

1. v2 报告生成完成
2. 已分析 warn 原因与分布
3. 无 schema/engine 修改
