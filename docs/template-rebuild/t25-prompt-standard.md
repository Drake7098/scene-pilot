# T2.5 Prompt Standard

## Segment Order

1. camera
2. composition
3. space
4. layer
5. lighting
6. material
7. detail
8. mood
9. style
10. semantic
11. subject

## Priority Rule

1. subject
2. semantic
3. camera
4. space
5. composition
6. layer
7. lighting
8. material
9. detail
10. mood
11. style

## Conflict Handling

1. 同类冲突：保留高优先级字段，低优先级字段降级为补充描述。
2. 跨类冲突：主体语义与镜头优先于风格和氛围。
3. 生成前必须执行 deconflict，不允许冲突字段直接拼接。

## Weak Field Handling

1. 空值字段不写入值，按 `not specified` 填充标准段。
2. 弱字段仅保留 metadata，不进入强控制段。

## Metadata Handling

1. metadata 与主 prompt 分离保存（sidecar JSON）。
2. metadata 不写入用户可见 prompt 主体。

## Canonical Prompt Format

```text
camera: ...
composition: ...
space: ...
layer: ...
lighting: ...
material: ...
detail: ...
mood: ...
style: ...
semantic: ...
subject: ...
```
