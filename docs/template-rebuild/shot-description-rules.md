# Shot Description Rules

实现文件：`src/shot-model/describeShot.ts`

`describeShot(shotModel)` 的输出顺序固定为：

1. 主体与动作
2. 镜头与构图
3. 空间与层级
4. 光线与材质
5. 情绪与风格
6. 约束与连续性

## Guardrails

- 禁止输出控制台式字段串作为主描述
- 禁止把 `景别=` / `区域=` / `锚点=` / `t0=t1` 裸露为主句式
- 允许在模型内部保留锚点与坐标，但对模型输出必须转成视觉语义
- 主描述优先可执行视觉语言，而不是字段名集合
