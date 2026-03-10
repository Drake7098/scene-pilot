import { expect, test } from "@playwright/test";
import { adaptPromptToPlatformDetailed } from "../../../src/utils/platformAdapter";
import { splitMachineNotes } from "../../../src/utils/promptTail";

test("splitMachineNotes detects legacy marker", () => {
  const input = [
    "# Scene 1",
    "Subject: runner",
    "",
    "(System Structural Control Layer)",
    "[Coords] x,y,w,h in percentages"
  ].join("\n");

  const out = splitMachineNotes(input);
  expect(out.main).toContain("Subject: runner");
  expect(out.notes.startsWith("(System Structural Control Layer)")).toBeTruthy();
});

test("splitMachineNotes falls back when marker is removed", () => {
  const input = [
    "# Scene 1",
    "Subject: runner",
    "",
    "[Stability Layer]",
    "[LRL] Spatial enforcement for layout; no coordinate-number repetition; no auto-center/balance/size equalization.",
    "[Coords] Same as image: frame percentages; rot degrees; origin top-left."
  ].join("\n");

  const out = splitMachineNotes(input);
  expect(out.main).toContain("Subject: runner");
  expect(out.notes.startsWith("[Stability Layer]")).toBeTruthy();
});

test("splitMachineNotes avoids splitting normal prompt text", () => {
  const input = [
    "Output policy: structure first, style second.",
    "This line is still part of normal prompt text."
  ].join("\n");

  const out = splitMachineNotes(input);
  expect(out.notes).toBe("");
  expect(out.main).toContain("Output policy");
});

test("platform trim keeps system-tail marker for gray zone rendering", () => {
  const filler = Array.from({ length: 1300 }, (_, i) => `detail-${i} ${"x".repeat(42)}`).join("\n");
  const input = [
    filler,
    "",
    "(System Structural Control Layer)",
    "[Stability Layer] enforce layout consistency.",
    "[Coords] x,y,w,h in frame percentages.",
    "[LRL] Spatial enforcement for layout."
  ].join("\n");

  const out = adaptPromptToPlatformDetailed({
    prompt: input,
    profile: "jimeng",
    lang: "en",
    media: "video",
    platformId: "keling"
  });

  expect(out.meta.trimmedByBudget).toBeTruthy();
  expect(out.prompt).toContain("(System Structural Control Layer)");
});
