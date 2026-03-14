---
name: session-continuity
description: Use at the start of a new chat session on ScenePilot to load baseline context and recent work. Ensures continuity across chat threads.
---

# Session Continuity

Use this skill when the user asks to "继续" / "开新聊天" / "保证连续性"，或在新会话中明确提到需要加载上下文。

## Purpose

- 新聊天没有上一轮对话记忆
- 通过结构化读取，快速建立基线 + 近期上下文
- 避免重复询问、避免与已实现逻辑冲突

## Required Reads (Baseline)

按顺序读取，建立基线认知：

1. **AGENTS.md** `/Users/dk/scene-pilot/AGENTS.md`
   - 全局规则、测试优先、Prompt 引擎、Quick/Pro 边界、保存导出

2. **Live Development Strategy** `/Users/dk/scene-pilot/docs/live-development-strategy.md`
   - 产品流程、主入口、路由、Quick/Pro 结构、账号认证、命名规范

3. **Session Primer（近期上下文）** `/Users/dk/scene-pilot/docs/session-primer.md`
   - 近期完成项、当前进行中、下一步建议
   - 用户可能在此文件末尾追加"接下来做 X"

## Optional Reads (按任务类型)

| 任务类型 | 必读 |
|----------|------|
| 产品 UI、菜单、保存导出 | `product-ui-guardrails` skill |
| UI 布局、间距、配色、分镜背景/参考图等视觉调整 | `ui-design-reference` skill + `src/design-reference/figma/app.tsx` |
| 提示词引擎、Quick/Pro 差异 | `prompt-engine-architecture` skill |
| 登录、会员、扣点、发布 | `release-billing-sync` skill |
| 跨线程产品/流程变更 | `live-dev-sync` skill |
| API 安全、支付链 | `security-api-hardening`、`security-payment-check` |

## Workflow

1. 用户在新聊天中粘贴 `docs/session-primer.md` 的内容或引用该 skill
2. Agent 读取上述 Required Reads
3. Agent 简短确认："已加载基线 + 近期上下文。当前理解：..."
4. 用户提出具体任务，Agent 基于已加载上下文作答

## Output Standard

加载完成后，Agent 应输出：

```
【上下文已加载】
- 基线：AGENTS.md + live-development-strategy.md
- 近期：session-primer.md
- 待办/进行中：（从 tracker 或 primer 提取）

请直接说接下来要做什么。
```
