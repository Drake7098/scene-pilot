# Release Blocking Baseline

Last updated: 2026-03-21

## 1. 发版阻断项
- 引擎锁校验未通过：`npm run engine:lock:check` 失败。
- 构建未通过：`npm run build` 失败。
- 发布就绪闸门未通过：`npm run release:readiness -- --target test|prod` 返回拦截状态（分支不匹配、工作区脏改动、存在未收敛发布级 P0/P1 任务）。
- 支付环境隔离违规：命中 `live + not allowed` 防护或 test/prod 支付配置混用，导致 `checkout/customer-portal/webhook` 安全门禁异常。
- 认证与鉴权 fail-closed 预期被破坏：非本地请求未按严格策略执行，或受保护接口存在未授权访问路径。

## 2. 非阻断项
- 文案、排版、视觉样式细节优化（不影响主链路可用性与安全性）。
- 帮助中心内容补充与措辞微调（不改变核心发版链路）。
- 本地调试体验优化（仅限开发便捷性，不影响线上安全门禁与核心流程）。
- 已登记且有明确后续计划的低优先级体验问题（不涉及安全、计费、登录、发布闸门）。

## 3. 阻断优先级（P0/P1）
- `P0`（必须立即阻断发布）：
- 安全与资金风险：支付链路隔离失效、鉴权绕过、未授权访问。
- 发布基础能力失效：`engine:lock:check` / `build` / `release:readiness` 任一失败。
- 环境污染风险：test/prod 配置串用、发布目标与分支策略不一致。
- `P1`（默认阻断，需明确豁免才可放行）：
- 不直接造成安全/资金事故，但会导致主链路明显不可用或结果不可交付的问题。
- 发布后高概率触发回滚的稳定性问题（已有复现与证据）。

## 4. 责任归属
- 发布负责人（Release Owner）：对本基线执行结果与最终放行决策负责。
- 引擎负责人（Prompt Engine Owner）：对 `engine:lock` 一致性与引擎变更收口负责。
- 平台/交付负责人（Infra Owner）：对 `build`、`release:readiness`、环境隔离与部署链路负责。
- 计费与认证负责人（Billing/Auth Owner）：对支付隔离、扣点链路、鉴权 fail-closed 负责。
- 任务负责人（Feature Owner）：对其改动导致的阻断项修复与复测闭环负责。

## 5. 放行条件
- 阻断项清零：所有 `P0` 必须为 0；所有 `P1` 默认清零，若存在例外必须有书面豁免结论。
- 三项硬闸门通过并留痕：
- `npm run engine:lock:check`
- `npm run build`
- `npm run release:readiness -- --target <test|prod>`
- 支付与鉴权防护验证通过：确认无 test/prod 串用、无 live 非授权放开、无未授权访问路径。
- 责任人确认完成：Release Owner 汇总并确认各 Owner 已完成对应项签收。
