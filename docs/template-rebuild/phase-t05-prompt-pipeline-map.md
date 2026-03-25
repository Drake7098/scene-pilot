# Phase T0.5 Prompt Pipeline Map

Generated at: 2026-03-21T18:53:43.405Z

## Prompt Pipeline Entry
- `src/utils/promptEngine.ts`: `buildPromptForScene` / `runPromptEngine`
- `src/features/pro-workspace/components/ExportControlPanel.tsx`: export prompt preview entry
- `src/features/pro-workspace/components/PromptPreviewPanel.tsx`: prompt preview entry

## Middle Processing
- `src/utils/promptPipeline.ts`: pipeline normalize / split sections / compile
- `src/utils/promptCompile.ts`: compile structured scene text
- `src/utils/adaptivePatch.ts`: adaptive patch and section append
- `src/utils/promptEngines/*`: engine route transform and scaffold trim

## Field Mapping & Weakening
- Camera/layout/subject fields are mapped through prompt compile sections.
- Optional or advanced fields may be flattened into generic lines depending on route/engine transform.
- Some field detail can be weakened when compacting for specific engines.

## Provider / Adapter Differences
- `src/utils/promptEngine.ts` + `src/config/platformPresets.ts`: route and engine id selection by workspace/media/profile.
- `src/services/providerGatewayService.ts`: provider payload transport after prompt build.
