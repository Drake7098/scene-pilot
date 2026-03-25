# Final Go-Live Checklist

Last updated: 2026-03-22

## 唯一放行文档
- 本文档是最终放行清单唯一文档。

## 唯一放行检查入口
- 命令：`node scripts/release/final-go-live-gate.mjs --target prod`
- 结论规则：
- `PASS = 可收费上线`
- `FAIL = 暂不可收费上线`

## 聚合检查项（固定 8 项）
1. release blocking baseline
2. Robots Daily 稳定
3. release:readiness 硬门槛
4. 未保存保护全覆盖
5. 扣点一致性
6. webhook 幂等
7. 自动补偿
8. ops 最小监控

## 人工放行规则
- 仅当唯一入口返回 `PASS = 可收费上线` 且进程退出码为 `0`，才允许收费上线。
- 任一检查项失败，返回 `FAIL = 暂不可收费上线`，必须人工介入后重新执行唯一入口。
