import { expect, test } from "@playwright/test";
import { generateStructureDraft } from "../../../src/utils/structureDraftGenerator";
import { structureDraftToIntentPlan } from "../../../src/utils/structureDraftToIntentPlan";

test("structure_draft_priority_explicit_over_keyword", async () => {
  const draft = generateStructureDraft({
    mediaType: "video",
    structureHint: "continuous",
    userInput: "先切到特写，再回到广角看向主角",
    lang: "zh"
  });
  expect(draft.mediaType).toBe("video");
  expect(draft.structureType).toBe("continuous");
});

test("structure_draft_keyword_inference_when_no_explicit_choice", async () => {
  const draft = generateStructureDraft({
    mediaType: "video",
    structureHint: null,
    userInput: "先切到特写，再回到广角看向主角",
    lang: "zh"
  });
  expect(draft.mediaType).toBe("video");
  expect(draft.structureType).toBe("multicam");
});

test("structure_draft_defaults_when_signal_is_weak", async () => {
  const draft = generateStructureDraft({
    mediaType: "video",
    structureHint: null,
    userInput: "一个简单的画面",
    lang: "zh"
  });
  expect(draft.mediaType).toBe("video");
  expect(draft.structureType).toBe("single_shot");
  expect(draft.shotCount).toBe(1);
});

test("image_structure_draft_and_intent_plan_chain", async () => {
  const draft = generateStructureDraft({
    mediaType: "image",
    structureHint: null,
    userInput: "三个人站在酒吧里，中间是主角，左右对视",
    lang: "zh"
  });
  expect(draft.mediaType).toBe("image");
  expect(draft.objects.length).toBeGreaterThan(0);
  expect(draft.scene.length).toBeGreaterThan(0);

  const intentPlan = structureDraftToIntentPlan(draft, "测试输入", "zh");
  expect(intentPlan.mediaType).toBe("image");
  expect(intentPlan.subjects.length).toBeGreaterThan(0);
  expect(intentPlan.constraints.length).toBeGreaterThan(0);
});
