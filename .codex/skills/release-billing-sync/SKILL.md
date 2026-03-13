---
name: release-billing-sync
description: Enforce cross-thread release flow, environment isolation, and billing safety gates for ScenePilot. Use for auth, billing, Paddle, deploy, branch strategy, CI gate, and env-variable changes.
---

# Release + Billing Sync

Use this skill whenever a task touches:
- 登录/注册/Auth session
- 会员、点数、扣点、Paddle checkout/webhook/customer portal
- 测试服/正式服发布流程
- 分支策略（develop/main）、PR gate、环境变量矩阵

## Goal

保持所有线程对同一发布策略和支付安全边界的一致执行，防止：
- 测试服误用 live 支付
- 正式服配置回退到 mock
- 线程 A/B 使用不同的发布规则

## Single Source of Truth

Before coding, read:
- `/Users/dk/scene-pilot/docs/live-development-strategy.md`
- `/Users/dk/scene-pilot/docs/supabase-env-matrix.md`
- `/Users/dk/scene-pilot/docs/supabase-cloudflare-stage1-runbook.md`

## Mandatory Checks (Before Test / Before Merge)

1. 引擎锁检查：
- `npm run engine:lock:check`

2. 构建检查：
- `npm run build`

3. PR 闸门（GitHub Actions）必须通过：
- `build-gate`
- `auth-billing-smoke`

## Billing Environment Safety (Non-Negotiable)

Front-end flags:
- `VITE_BILLING_MODE`: `sandbox | live`
- `VITE_BILLING_LIVE_ALLOWED`: `0 | 1`
- `VITE_BILLING_ALLOW_MOCK_FALLBACK`: `0 | 1`（测试服/正式服默认 `0`）

Functions flags:
- `BILLING_MODE`: `sandbox | live`
- `BILLING_LIVE_ALLOWED`: `0 | 1`

Safety rule:
- 只有 `mode=live` 且 `live_allowed=1` 允许 live 支付。
- 否则统一拦截：`billing_live_blocked`。

## Branch / Deploy Policy

- `local -> develop(test) -> main(prod)`
- `develop/main` 禁止直接 push，必须 PR 合并。
- Feature PR 目标分支：`develop`
- Release PR 目标分支：`main`（从 develop 合并）

## Definition of Done

When this skill is used, completion requires:
1. 相关代码变更已落地（前后端一致）
2. 文档同步（至少更新一处事实源文档）
3. `npm run engine:lock:check` + `npm run build` 通过
4. 明确说明本次是否改动了发布/支付边界

## Do Not

- 不要在测试服使用 live 支付 token/price/webhook
- 不要让前端在非本地 silently fallback 到 mock 支付
- 不要仅改前端或仅改服务端（支付边界必须双端一致）
