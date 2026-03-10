# ScenePilotix 本地 A/B 三轮对比报告



生成时间：2026-03-08T12:56:58.933Z



## 轮次定义

- Round1：plain 使用本地大模型生成

- Round2：plain 使用规则模板生成

- Round3：plain 使用 Codex 手工生成

- Structured：三轮都固定为 ScenePilotix 真实导出



## 汇总结果

### round1_local_llm_plain
- cases: 11
- plainAvg: 2.655
- structuredAvg: 5
- avgLift(structured-plain): 2.345
- structuredWinRate: 1
- structured/plain/tie: 11/0/0

### round2_rule_plain
- cases: 11
- plainAvg: 2.7
- structuredAvg: 5
- avgLift(structured-plain): 2.3
- structuredWinRate: 1
- structured/plain/tie: 11/0/0

### round3_codex_plain
- cases: 11
- plainAvg: 2.873
- structuredAvg: 5
- avgLift(structured-plain): 2.127
- structuredWinRate: 1
- structured/plain/tie: 11/0/0



## 工具纳入状态

- ComfyUI baseUrl: http://127.0.0.1:8000

- ComfyUI available: true

- round1_local_llm_plain: failed (Error: submit failed: 400)

- round2_rule_plain: failed (Error: submit failed: 400)

- round3_codex_plain: failed (Error: submit failed: 400)

- DrawThings queueDir: /Users/dk/scene-pilot/tests/local-ab/outputs/raw/drawthings-queue

- queue: /Users/dk/scene-pilot/tests/local-ab/outputs/raw/drawthings-queue/round1_local_llm_plain.json

- queue: /Users/dk/scene-pilot/tests/local-ab/outputs/raw/drawthings-queue/round2_rule_plain.json

- queue: /Users/dk/scene-pilot/tests/local-ab/outputs/raw/drawthings-queue/round3_codex_plain.json
