# ScenePilot Local Live AB Report

- date: 2026-03-10
- scope: image only
- objective: compare plain prompt vs ScenePilotix structured export on local Draw Things and ComfyUI

## Environment

- local llm api: `http://127.0.0.1:11434`
- comfyui: `http://127.0.0.1:8000`
- draw things: `http://127.0.0.1:7860`
- comfy checkpoint: `v1-5-pruned-emaonly-fp16.safetensors`
- draw things model: `FLUX.1-schnell`

## What Was Run

1. ComfyUI full batch
   - `10 cases x 2 modes x 1 seed = 20 images`
   - output: `tests/local-ab/outputs/raw/comfy-live-20260310-img10x1`
2. Draw Things partial batch
   - started with same scope
   - stopped early on request after `7` images
   - output: `tests/local-ab/outputs/raw/drawthings-live-20260310-img10x1`

## ComfyUI Result

- plain: `10/10` success
- structured: `10/10` success
- avg elapsed:
  - plain: `26961 ms`
  - structured: `18234 ms`
- avg prompt chars:
  - plain: `67`
  - structured: `694`

Interpretation:
- ComfyUI fully tolerated the current ScenePilotix structured export.
- On this run, structured prompts did not reduce success rate.
- Structured prompts were much longer, but still executed reliably.

## Draw Things Result

- completed images before stop: `7`
- completed set:
  - `single_001`: plain, structured
  - `single_002`: plain, structured
  - `dual_001`: plain, structured
  - `dual_002`: plain only
- average completed image gap: about `139 sec/image` (`2.32 min/image`)

Interpretation:
- Draw Things can execute the current structured export, but the path is much slower and less comfortable than ComfyUI.
- The local structured format is near the practical tolerance boundary for Draw Things.
- Draw Things is not a good primary engine for direct long structured-export prompts in the current form.

## Product Conclusion

1. Quick workspace can use local image engines.
   - ComfyUI is viable as the primary local engine.
   - Draw Things is viable as a fallback or simplified local path.
2. Current ScenePilotix structured export is locally robust on ComfyUI.
3. Current ScenePilotix structured export is locally heavy for Draw Things.

## Recommended Prompt Strategy

Use two local prompt modes instead of one shared export:

1. `local_comfy_full`
   - keep current structured export almost unchanged
   - suitable for ComfyUI
2. `local_draw_compact`
   - strip platform protocol header
   - strip anti-director boilerplate
   - keep only:
     - scene sentence
     - camera sentence
     - layout focus
     - top 1-3 object constraints

## Recommended Structure Adjustments

1. Add a local adapter after `runPromptPipeline`.
   - keep product export as source of truth
   - add a local post-process layer for engine-specific compacting
2. For Draw Things, cap structured prompt length.
   - target about `180-260` Chinese chars or one short block
3. Preserve only the strongest fields for local image mode:
   - subject identity
   - composition focus
   - position / scale
   - lighting
   - one negative block

## Notes

- During this run, ComfyUI initially failed because the runtime expected `~/Documents/ComfyUI` while models were under `~/Downloads/ComfyUI`. A symlink was added so live local runs could proceed.
- Fresh full baseline regeneration via local LLM was slower than the image test window, so the timed image run used the existing baseline prompt records already stored under `tests/local-ab/outputs/raw/prompts` and `tests/local-ab/outputs/raw/llm`.
