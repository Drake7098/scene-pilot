# Shot Benchmark Eval

产物：`artifacts/shot-benchmark/benchmark-results.json`

## Benchmarks

1. 体育动作冻结镜头
- 输出包含：Raw Fields / Shot Model / Shot Description / Final Prompt / Old Route Approx
- 新链路特征：先锁定主体动作冻结，再输出镜头与构图约束，避免字段散乱直拼

2. 广告级产品高光镜头
- 输出包含：Raw Fields / Shot Model / Shot Description / Final Prompt / Old Route Approx
- 新链路特征：材质与高光被组织到 lighting+material，再进入描述层

3. 电影级空间氛围镜头
- 输出包含：Raw Fields / Shot Model / Shot Description / Final Prompt / Old Route Approx
- 新链路特征：空间层级 + 连续性提示先建模，再进入描述层

## Overall Delta vs Old Route

- 旧链路：字段串并列，视觉主次关系弱
- 新链路：先关系建模，再按视觉语义顺序描述
- 旧链路：冲突容易直接外泄到 prompt
- 新链路：冲突先在 ShotModel 阶段裁决
