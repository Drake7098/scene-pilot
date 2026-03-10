# ScenePilot Global Rules

## Test Priority

1. The first goal of evaluation is to improve the prompt generation engine.
2. Compare `user input -> generated prompt -> generated image/video` as one chain.
3. Do not treat raw generation success rate as the primary conclusion if model quality or workflow quality is the main bottleneck.
4. When reviewing A/B results, prioritize:
   - whether the generated prompt preserves scene structure
   - whether the generated prompt improves video/image semantic execution
   - whether failures come from prompt design or from the model/runtime itself
5. Every test report should separate:
   - prompt quality judgment
   - generation result judgment
   - runtime/model bottlenecks

## Prompt Evaluation Rules

1. Evaluate prompts by structure clarity, brevity, conflict rate, and execution reliability.
2. Remove repeated rules, duplicated timing clauses, and mutually conflicting camera directives.
3. Prefer compact structure blocks over long protocol-heavy text when testing local or weaker runtimes.
4. Preserve the user's intent, but normalize noisy or risky wording before export if it hurts execution.

## Source Attribution Rules

1. Always keep these fields separately in test data:
   - `userInputRaw`
   - `userIntentNormalized`
   - `generatedPrompt`
   - `promptSource`
2. `promptSource` must be tracked in metadata, not by changing visible prompt text sent to the model.
3. Do not use hidden Unicode, zero-width characters, or visually identical text tricks inside the actual model prompt. They contaminate evaluation and make debugging harder.
4. If the UI needs invisible differentiation, do it only in local metadata, DOM attributes, filenames, or sidecar JSON, never in the prompt body itself.

## Optimization Direction

1. Prompt generation should aim for minimal sufficient structure.
2. Keep the strongest execution constraints:
   - subject identity and count
   - relative position
   - key motion or T0/T1 delta
   - camera rule
   - lighting/style
3. Move secondary protocol text out of the final prompt whenever possible.
