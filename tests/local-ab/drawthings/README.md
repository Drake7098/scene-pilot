# Draw Things 最小验证方案

## 目标
用最小样本验证 ScenePilotix 结构化 prompt 是否比普通 prompt 更容易生成可用图片。

## 第一阶段建议规模
- 12 个图片 case（推荐）
- 每个 case 跑两种 prompt：`plain` / `structured`
- 每种 prompt 固定 2 个 seed：`101` / `202`
- Draw Things 总量：`12 x 2 x 2 = 48` 张图

## Prompt 来源要求（必须）
- `plain`：由 Drake-DS 根据用户自然语言生成普通 prompt。
- `structured`：必须来自 ScenePilotix 产品真实导出链路（runPromptPipeline）。
- 禁止用测试目录内“手写拼接版 structured prompt”替代。

## 推荐固定参数
- 模型：使用同一个 Draw Things 模型，不要混用
- 分辨率：`1024x1024`
- Steps：`24`
- Sampler：`Euler A` 或你当前最稳定的默认 sampler
- CFG：`6.5`
- Seed 规则：每个 case 固定 `101` 和 `202`
- 负面提示：固定一版，不随 case 改动
- 如无 refs，全部关闭参考图输入；如有 refs，同一 case 两种 prompt 必须用同一组 refs

## 执行流程（已支持自动补位）
1. 执行 `npm run local-ab:draw:queue` 生成任务包：
   - `tests/local-ab/outputs/raw/drawthings/queue.json`
   - `tests/local-ab/outputs/raw/drawthings/run-pack/tasks.csv`
   - `tests/local-ab/outputs/raw/drawthings/run-pack/prompts/*.txt`
2. Draw Things 侧按 `tasks.csv` 跑图，文件名用 `outputFilename`。
3. 执行 `npm run local-ab:draw:import` 自动扫描并导入图片到评分模板。
4. 在 `tests/local-ab/outputs/scored` 补评分后执行 `npm run local-ab:summary`。

## 文件命名规则
建议：
- `caseId__plain__seed101.png`
- `caseId__plain__seed202.png`
- `caseId__structured__seed101.png`
- `caseId__structured__seed202.png`

`local-ab:draw:import` 会自动扫描以下候选目录：
- `DRAWTHINGS_IMAGE_DIR`（若显式配置）
- `tests/local-ab/outputs/raw/drawthings/images`
- `~/Library/Containers/com.liuliu.draw-things/Data/Documents/Downloads`
- `~/Downloads`（含 `scenepilot_ab_report_*` 产物目录）

## 评分建议
- `completion_score`: 0-5
- `composition_score`: 0-5
- `semantic_match_score`: 0-5
- `usability_score`: 0-5
- `is_usable`: `usability_score >= 4`

## 第一阶段重点 case
- 单主体静态图
- 双人物关系
- 多对象构图
- 进入房间
- 连续进入下一个房间（按关键帧理解）
- 静态结构 + 强运动冲突
- 多 refs 场景
