# 模板注入范围（Phase B2）

## 必注入能力
1. `scene`
2. `background`
3. `layer`
4. `objects`
5. `object attributes`
6. `object descriptions`
7. `object state`
8. `object emotion`
9. `object clothing`
10. `injury/tears/blood/dirt/bandage/texture` 等细节
11. `camera`
12. `composition`
13. `lighting`
14. `semantic`
15. `motion/continuity`（适用时）

## 禁止项
1. 只做左栏少数字段注入。
2. 只做轻量描述。
3. 只做空泛语义。

## 验收
1. 新模板至少覆盖核心视觉组 + 对象组 + 镜头组。
2. 模板结果明显有结构感与专业度。
