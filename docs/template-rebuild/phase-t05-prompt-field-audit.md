# Phase T0.5 Prompt Field Audit

Generated at: 2026-03-21T18:53:43.405Z

| fieldKey | enterPrompt | builder | segment | format | lostInfo | lossType | strength |
|---|---|---|---|---|---|---|---|
| aspectRatio | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | extras | text_line | no | none | strong |
| camera | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts<br/>src/utils/promptEngines/shared.ts | camera | text_line | no | none | strong |
| color | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/features/pro-workspace/components/ExportGenerateSection.tsx | extras | text_line | no | none | strong |
| compiler | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts | extras | text_line | partial | weakened | medium |
| config | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/utils/promptEngines/shared.ts<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/PlatformAdaptPanel.tsx<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx | extras | text_line | no | none | strong |
| continuity | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | extras | text_line | no | none | strong |
| duration | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/services/providerGatewayService.ts | extras | text_line | no | none | strong |
| duration_s | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | extras | text_line | no | none | strong |
| exportDefaults | no |  | extras | text_line | yes | dropped | weak |
| externalPrompt | yes | src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | constraints | text_line | partial | weakened | medium |
| h | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | layout | text_line | no | none | strong |
| id | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/features/pro-workspace/components/ExportControlPanel.tsx | extras | text_line | no | none | strong |
| index | yes | src/utils/promptEngine.ts | extras | text_line | partial | generalized | medium |
| key_dir | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| keyframes | no |  | extras | text_line | yes | dropped | weak |
| kf | yes | src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | extras | text_line | partial | weakened | medium |
| layers | yes | src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/utils/promptEngines/builtin.ts<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx | extras | text_line | no | none | strong |
| lighting | yes | src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | lighting | text_line | partial | weakened | medium |
| look | yes | src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/utils/promptEngines/shared.ts | subjects | text_line | no | none | strong |
| mediaMode | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/PlatformAdaptPanel.tsx<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx | extras | text_line | no | none | strong |
| mediaType | yes | src/services/providerGatewayService.ts | extras | text_line | partial | generalized | medium |
| mood | yes | src/utils/prompt.ts | lighting | text_line | partial | generalized | medium |
| movement | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | extras | text_line | no | none | strong |
| name | yes | src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx | extras | text_line | no | none | strong |
| nameEn | no |  | extras | text_line | yes | dropped | weak |
| notes | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | constraints | text_line | no | none | strong |
| opacity | no |  | extras | text_line | yes | dropped | weak |
| projectDefaults | no |  | extras | text_line | yes | dropped | weak |
| raw | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts<br/>src/services/providerGatewayService.ts | extras | text_line | no | none | strong |
| referenceLinks | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| referencePolicy | no |  | extras | text_line | yes | dropped | weak |
| rot | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | extras | text_line | no | none | strong |
| scenes | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts | extras | text_line | no | none | strong |
| shape | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| shot | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | camera | text_line | no | none | strong |
| storyPlan | no |  | extras | text_line | yes | dropped | weak |
| t | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/utils/promptEngines/builtin.ts<br/>src/utils/promptEngines/shared.ts<br/>src/utils/promptEngines/scaffoldStrip.ts<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/PlatformAdaptPanel.tsx<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx<br/>src/features/pro-workspace/components/ExportGenerateSection.tsx | extras | text_line | no | none | strong |
| time | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts | lighting | text_line | partial | weakened | medium |
| transitionType | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| type | yes | src/utils/promptEngine.ts<br/>src/utils/promptPipeline.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts<br/>src/utils/promptEngines/builtin.ts<br/>src/utils/promptEngines/shared.ts<br/>src/utils/promptEngines/scaffoldStrip.ts<br/>src/features/pro-workspace/components/ExportControlPanel.tsx<br/>src/features/pro-workspace/components/PlatformAdaptPanel.tsx<br/>src/features/pro-workspace/components/PromptPreviewPanel.tsx<br/>src/features/pro-workspace/components/ExportGenerateSection.tsx<br/>src/services/providerGatewayService.ts | extras | text_line | no | none | strong |
| w | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | layout | text_line | no | none | strong |
| x | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | layout | text_line | no | none | strong |
| y | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/adaptivePatch.ts | layout | text_line | no | none | strong |
| z | yes | src/utils/promptEngine.ts<br/>src/utils/prompt.ts<br/>src/utils/promptEngines/builtin.ts | layout | text_line | no | none | strong |
| zoom | yes | src/utils/promptEngines/builtin.ts | extras | text_line | partial | generalized | medium |
| localRefs | no |  | extras | text_line | yes | dropped | weak |
| nameZh | no |  | extras | text_line | yes | dropped | weak |
| objects | no |  | subjects | text_line | yes | dropped | weak |
| bgCarryOver | no |  | extras | text_line | yes | dropped | weak |
| cameraCarryOver | no |  | camera | text_line | yes | dropped | weak |
| characterCarryOver | no |  | extras | text_line | yes | dropped | weak |
| directionCarryOver | no |  | extras | text_line | yes | dropped | weak |
| enabled | no |  | extras | text_line | yes | dropped | weak |
| entryDir | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| entryDirection | no |  | extras | text_line | yes | dropped | weak |
| exitDir | yes | src/utils/prompt.ts | extras | text_line | partial | generalized | medium |
| exitDirection | no |  | extras | text_line | yes | dropped | weak |
| inheritFromPrevious | no |  | extras | text_line | yes | dropped | weak |
| method | yes | src/services/providerGatewayService.ts | extras | text_line | partial | generalized | medium |
| objectInheritance | no |  | subjects | text_line | yes | dropped | weak |
| range | no |  | extras | text_line | yes | dropped | weak |
| referenceSlots | no |  | extras | text_line | yes | dropped | weak |
| sceneCount | no |  | extras | text_line | yes | dropped | weak |
| sceneDurations | no |  | extras | text_line | yes | dropped | weak |
| slot | no |  | extras | text_line | yes | dropped | weak |
| target | yes | src/utils/promptEngines/builtin.ts | extras | text_line | partial | generalized | medium |
| totalDuration | no |  | extras | text_line | yes | dropped | weak |
