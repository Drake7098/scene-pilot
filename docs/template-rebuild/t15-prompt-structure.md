# T1.5 Enhanced Prompt Structure

实验目标：验证结构化分段 prompt 的控制力上限（仅实验，不进入正式链路）。

## Canonical Structured Format

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
pose_action: ...
```

## Baseline Prompt (sample)

```text
Create a cinematic product realism scene featuring single product bottle with clean premium studio haze.
```

## Enhanced Prompt (sample)

```text
camera: 35mm low-angle dolly-in
composition: rule-of-thirds with negative space right
space: default spatial relation
layer: subject + environment
lighting: key light 45deg left, soft rim back
material: material not specified
detail: premium hero reveal
mood: clean premium studio haze
style: cinematic product realism
semantic: premium hero reveal
subject: single product bottle
```
