# Phase T0 Field Source Map

Generated at: 2026-03-21T18:53:19.765Z

| fieldKey | level | type | default | visibility | definedIn | usedIn | usedInTemplate | usedInPrompt | usageLevel | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| appearance | optional | string | - | public | src/template-engine/types/templatePayload.ts | src/components/PropsPanel.tsx | no | no | low | - |
| appliedAt | optional | number | - | public | src/model.ts |  | no | no | low | - |
| appliedTemplateIds | optional | string[] | - | public | src/model.ts |  | no | no | low | - |
| applyMode | core | "layout_only" | "layout_plus_style" | "full_workflow" | - | public | src/model.ts | src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | no | no | low | - |
| aspectRatio | optional | TemplateRatio | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/PropsPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| backgroundPreset | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| backgroundPromptEn | pro | string | - | pro | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| backgroundPromptZh | pro | string | - | pro | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| backgroundRef | optional | SceneRefMeta | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | no | low | - |
| basedOnProjectId | pro | string | - | pro | src/model.ts |  | no | no | low | - |
| bgCarryOver | optional | boolean | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| camera | core | Camera | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| cameraCarryOver | optional | boolean | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| cameraLanguage | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts | src/template-engine/apply/applyPayload.ts | no | no | low | - |
| cameraMoveMode | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| cameraPreset | optional | string | - | public | src/model.ts |  | no | yes | low | - |
| category | core | TemplateCategory | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| characterCarryOver | optional | boolean | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| chargedAt | core | string | - | public | src/model.ts |  | no | no | low | - |
| chargeType | core | "template_apply" | - | public | src/model.ts |  | no | no | low | - |
| classicMotion | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| classicShot | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| color | optional | string | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | yes | high | - |
| compiler | optional | SceneCompiler | - | public | src/model.ts |  | yes | yes | high | - |
| constraintStrength | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| continuity | optional | TemplateContinuity | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| continuityId | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts | src/features/pro-workspace/components/ObjectEditorPanel.tsx | no | no | low | - |
| cost | core | number | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts | src/template-engine/index.ts | no | no | low | - |
| currentTemplate | optional | CurrentTemplateContext | - | public | src/model.ts | src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | no | low | - |
| descriptionEn | optional | string | - | public | src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| descriptionZh | optional | string | - | public | src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| directionCarryOver | optional | boolean | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| directorStylePack | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| domain | core | TemplateDomain | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| duration | optional | number | - | public | src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| duration_s | core | number | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| enabled | optional | boolean | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | no | medium | - |
| entryDir | optional | Direction | - | public | src/model.ts |  | yes | yes | medium | - |
| entryDirection | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| exitDir | optional | Direction | - | public | src/model.ts |  | yes | yes | medium | - |
| exitDirection | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| exportDefaults | optional | TemplateExportDefaults | - | public | src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | no | high | - |
| externalPrompt | pro | string | - | pro | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | yes | yes | high | - |
| familyId | core | string | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts | src/features/template-workspace/factory/buildTemplatePayload.ts<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/buildTemplatePayload.ts<br/>src/template-engine/factory/unifiedAdapter.ts | no | no | low | - |
| familyNameEn | core | string | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| familyNameZh | core | string | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| featured | core | boolean | - | public | src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| fileName | optional | string | - | public | src/model.ts | src/components/ExportPanel.tsx | no | yes | low | - |
| form | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | yes | low | - |
| fromTemplateWorkspace | optional | boolean | - | public | src/model.ts |  | no | no | low | - |
| h | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| id | core | string | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts<br/>src/template-engine/index.ts | yes | yes | high | - |
| imageProEffects | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| index | optional | number | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/index.ts | yes | yes | high | - |
| industry | optional | TemplateIndustry | - | public | src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| inheritBgRefFromPrevious | advanced | boolean | - | advanced | src/model.ts |  | no | no | low | - |
| inheritFromPrevious | advanced | boolean | - | advanced | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | no | medium | - |
| inheritObjectRefsFromPrevious | advanced | ObjectRefInheritMode | - | advanced | src/model.ts |  | no | no | low | - |
| intentSummary | optional | string | - | public | src/model.ts |  | no | no | low | - |
| isFree | core | boolean | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts | src/template-engine/index.ts | no | no | low | - |
| jumpCutMode | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| keyframes | core | { t: 0 | 1 | - | public | src/model.ts | src/template-engine/apply/applyPayload.ts | yes | no | high | - |
| kf | core | LayerKF[] | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| layers | core | Layer[] | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| layoutLocked | optional | boolean | - | public | src/model.ts |  | no | no | low | - |
| lensRecipe | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| lighting | core | Lighting | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| lightingSetup | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| localRefs | optional | LocalRefMeta[] | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | yes | no | high | - |
| locationHint | optional | string | - | public | src/model.ts |  | no | no | low | - |
| look | core | string | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | yes | yes | high | - |
| mediaMode | optional | MediaType | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | yes | high | - |
| mediaType | optional | TemplateMediaType | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | no | high | - |
| mergedInput | optional | string | - | public | src/model.ts |  | no | no | low | - |
| meta | optional | ProjectMeta | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | yes | low | - |
| method | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| mime | core | string | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | no | low | - |
| movement | core | string | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| name | core | string | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts<br/>src/template-engine/index.ts | yes | yes | high | - |
| nameEn | optional | string | - | public | src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts<br/>src/template-engine/index.ts | yes | no | high | - |
| nameZh | optional | string | - | public | src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts<br/>src/template-engine/index.ts | yes | no | high | - |
| notes | core | string | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| notesEn | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| notesZh | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| objectInheritance | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| objectPromptEn | pro | string | - | pro | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| objectPromptZh | pro | string | - | pro | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| objects | optional | TemplateObjectSnapshot[] | - | public | src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | no | high | - |
| opacity | optional | number | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | no | high | - |
| platformId | optional | string | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/features/pro-workspace/components/ExportControlPanel.tsx | no | yes | low | - |
| preview | optional | string | - | public | src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| pricingBucketAtCreation | pro | string | - | pro | src/model.ts |  | no | no | low | - |
| primaryInput | optional | string | - | public | src/model.ts |  | no | yes | low | - |
| proExportMode | pro | ProExportMode | - | pro | src/model.ts |  | no | no | low | - |
| project | pro | { mode: Mode | - | pro | src/model.ts | src/components/ExportPanel.tsx<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | no | yes | low | - |
| projectDefaults | pro | TemplateProjectDefaults | - | pro | src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | no | high | - |
| proMotions | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| range | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| ratio | core | TemplateRatio | - | public | src/template-engine/types/templateIndex.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | no | yes | low | - |
| raw | optional | unknown | - | public | src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| referenceLinks | core | string | - | public | src/model.ts | src/components/ExportPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | yes | yes | high | - |
| referencePolicy | advanced | "optional" | "required" | - | advanced | src/model.ts | src/components/ExportPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | yes | no | high | - |
| referenceSlots | optional | unknown[] | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| rot | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| sceneChangeMode | advanced | string | - | advanced | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| sceneCount | optional | number | - | public | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| sceneDurations | optional | number[] | - | public | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| sceneId | optional | string | - | public | src/model.ts |  | no | yes | low | - |
| scenes | core | TemplateSceneSnapshot[] | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| sceneTier | advanced | SceneTier | - | advanced | src/model.ts |  | no | yes | low | - |
| secondaryInput | optional | string | - | public | src/model.ts |  | no | yes | low | - |
| shape | core | Shape | - | public | src/model.ts |  | yes | yes | high | - |
| shapeDesc | optional | string | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx | no | yes | low | - |
| shot | core | string | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx<br/>src/template-engine/apply/applyPayload.ts | yes | yes | high | - |
| shotNote | optional | string | - | public | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx | no | yes | low | - |
| size | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | yes | low | - |
| source | core | ProjectCreativeSource | - | public | src/model.ts | src/components/ExportPanel.tsx | no | yes | low | - |
| sourceTemplateId | optional | string | - | public | src/model.ts |  | no | no | low | - |
| sourceTemplateSlug | optional | string | - | public | src/model.ts |  | no | no | low | - |
| sourceType | optional | ProjectSourceType | - | public | src/model.ts |  | no | no | low | - |
| spaceLevel | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| stability | advanced | SceneStability | - | advanced | src/model.ts |  | no | yes | low | - |
| storyPlan | optional | TemplateStoryPlan | - | public | src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts | src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/apply/applyPayload.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | no | high | - |
| styleHint | optional | string | - | public | src/model.ts |  | no | no | low | - |
| subjectLabels | optional | string[] | - | public | src/model.ts |  | no | yes | low | - |
| t | core | 0 | 1 | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| t0 | optional | unknown | - | public | src/template-engine/types/templatePayload.ts |  | no | yes | low | - |
| t1 | optional | unknown | - | public | src/template-engine/types/templatePayload.ts |  | no | yes | low | - |
| tags | optional | string[] | - | public | src/template-engine/types/templateIndex.ts<br/>src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| target | optional | string | - | public | src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | yes | medium | - |
| templateId | core | string | - | public | src/model.ts | src/features/pro-workspace/components/ExportControlPanel.tsx | no | no | low | - |
| templateOwnedAtCreation | optional | boolean | - | public | src/model.ts |  | no | no | low | - |
| tier | optional | string | - | public | src/model.ts |  | no | yes | low | - |
| titleEn | core | string | - | public | src/model.ts |  | no | no | low | - |
| titleZh | core | string | - | public | src/model.ts |  | no | no | low | - |
| totalDuration | optional | number | - | public | src/template-engine/types/templatePayload.ts |  | yes | no | medium | - |
| transitionType | advanced | TransitionType | - | advanced | src/model.ts | src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | yes | high | - |
| type | optional | string | - | public | src/model.ts<br/>src/template-engine/types/templatePayload.ts | src/components/ExportPanel.tsx<br/>src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | yes | yes | high | - |
| updatedAt | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/pro-workspace/components/ObjectEditorPanel.tsx<br/>src/features/pro-workspace/components/SceneEditorPanel.tsx | no | no | low | - |
| v2Mode | advanced | SceneV2Mode | - | advanced | src/model.ts |  | no | yes | low | - |
| variant | optional | TemplateVariant | - | public | src/template-engine/types/templateIndex.ts | src/features/template-workspace/factory/buildTemplatePayload.ts<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/data/families/register400.ts<br/>src/template-engine/factory/buildTemplatePayload.ts<br/>src/template-engine/factory/unifiedAdapter.ts | no | no | low | - |
| variantId | core | string | - | public | src/model.ts<br/>src/template-engine/types/templateIndex.ts |  | no | no | low | - |
| variantNameEn | optional | string | - | public | src/model.ts |  | no | no | low | - |
| variantNameZh | optional | string | - | public | src/model.ts |  | no | no | low | - |
| w | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| workspaceMode | optional | string | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
| x | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx<br/>src/features/template-workspace/factory/unifiedAdapter.ts<br/>src/template-engine/factory/unifiedAdapter.ts | yes | yes | high | - |
| y | core | number | - | public | src/model.ts | src/components/PropsPanel.tsx | yes | yes | high | - |
| z | core | number | - | public | src/model.ts |  | yes | yes | high | - |
| zOrder | optional | number | - | public | src/template-engine/types/templatePayload.ts |  | no | no | low | - |
