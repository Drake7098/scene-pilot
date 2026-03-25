# Field to Shot Model Map

## Mapping Rules

目标：不丢字段、先完整入模、先裁决后描述。

## Main Map

- `scene.camera.shot/movement/cameraPreset/transitionType`
  - -> `shotModel.camera`
- `scene.duration_s/project.project.shotPlan`
  - -> `shotModel.context`
- `scene.shotNote`
  - -> `shotModel.action.primaryAction` + `detail.shotNote`
- `scene.entryDir/exitDir`
  - -> `shotModel.space` + `continuity.bridgeToNext`
- `scene.lighting.time/key_dir/mood`
  - -> `shotModel.lighting`
- `scene.notes`
  - -> `detail.sceneNotes` + marker 解析（camera/director/classic/pro-motion）
- `layer.id/type/look/notes/externalPrompt/referenceLinks/z/kf`
  - -> `subject/layer/material/detail/motion/relations`

## Hidden / Pro / Advanced Fields

- `camera_language:` -> `camera.cameraLanguageId`
- `director_pack:` -> `camera.directorPackId`
- `video_classic_mode:` -> `style.videoClassicModeId`
- `image_classic_mode:` -> `style.imageClassicModeId`
- `image_pro_effects:` -> `style.imageProEffectIds`
- `pro_basic_motion:` -> `camera.proBasicMotionId`
- `pro_plus_motion:` -> `camera.proPlusMotionIds`

## Conflict Entry

字段先进入 `resolveShotConflicts`，再进入 `semantic.hardConstraints` / `action.blockedActions`，避免冲突文本直接污染最终描述。
