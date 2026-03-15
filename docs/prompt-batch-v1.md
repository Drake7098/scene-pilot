# Prompt Batch Test v1

## 阶段目标

- 批量生成 prompt，不生成图片，不调用模型
- 验证 template → payload → project → prompt → platform → export 完整链路
- 集成测试 Prompt Engine，确认链路稳定

## 使用的链路

复用现有能力，**未修改**：

- `loadTemplatePayloadById` — 模板 payload 加载
- `applyPayloadToProject` — payload 应用到 project
- `buildPromptForScene` — 生成 prompt
- `getPlatformPreset` — 平台配置
- `project.meta.currentTemplate` — 模板上下文

流程：

```
template (family + variant)
  → payload (loadTemplatePayloadById)
  → project (applyPayloadToProject)
  → scene
  → buildPromptForScene (platform adapt, workspace=pro)
  → final prompt
```

## 目录结构

```
scripts/prompt-batch/
  config.ts          # 配置（batch size, repeat, applyMode, platformId 等）
  build-prompts.ts   # 单模板 build prompt
  run-batch.ts       # 批量运行
  check-prompts.ts   # 基础规则检查
  save-results.ts    # 保存 prompts/logs/reports
  check-existing.ts  # 对已有 prompts 重跑检查
  print-report.ts    # 打印 report

artifacts/prompt-batch/
  prompts/           # *.txt 生成的 prompt 文本
  logs/              # *.json 每条记录元数据
  reports/
    report.json      # 汇总报告
```

## 输出结构

每条记录包含：

- `templateId`, `familyId`, `variantId`
- `applyMode`, `platformId`, `mediaMode`
- `promptLength`, `status` (ok/fail)
- `checkResult` (ok/warn/fail)

## 检查规则

- 非空
- 长度：过短 (<20 fail, <50 warn)、过长 (>8000 fail, >4000 warn)
- 内容检查（warn 级）：camera、subject、layout、style、machine tail

## 使用方式

```bash
npm run prompt-batch 50        # 50 模板 × 默认 3 次
npm run prompt-batch 20 3      # 20 模板 × 3 次
npm run prompt-batch:check     # 对 artifacts 中的 prompts 重跑检查
npm run prompt-batch:report    # 打印 report.json
```

环境变量（可选）：

- `PROMPT_BATCH_SIZE` — 批大小
- `PROMPT_BATCH_REPEAT` — 重复次数
- `PROMPT_BATCH_APPLY_MODE` — layout_only | layout_plus_style | full_workflow
- `PROMPT_BATCH_PLATFORM` — 平台 ID (fal, runway, 等)
- `PROMPT_BATCH_MEDIA` — image | video | all
- `PROMPT_BATCH_ARTIFACTS` — 输出目录

## 测试规模（本阶段）

- 先支持：20 模板 × 3 次，50 模板 × 5 次
- 不直接跑 1000

## 未修改项

- **Schema**：未修改
- **Template schema**：未修改
- **Payload schema**：未修改
- **Rule engine**：未修改
- **Prompt engine**：未修改
- **compileV2 / resolveSceneStrategy / applyPayloadToProject**：未修改
- **Export pipeline / platform adapt**：未修改
- **Core model**：未新增字段
- **UI / 页面 / adapter**：未新增

## 下一阶段是否可进入 Comfy Batch

在以下条件满足后可进入：

1. Batch 运行完成，report 生成
2. 检查结果 ok/warn 占比合理，无大量 fail
3. 无 schema/engine 修改
