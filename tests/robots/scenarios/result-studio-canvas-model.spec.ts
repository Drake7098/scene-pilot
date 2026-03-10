import { expect, test } from "@playwright/test";
import type { CanvasDraft } from "../../../src/types/canvasDraft";
import { canvasDraftToIntentPlan } from "../../../src/utils/canvasDraftToIntentPlan";
import { intentPlanToProProject } from "../../../src/utils/intentPlanToProject";

test("image_canvas_draft_flows_into_intent_and_project", async () => {
  const canvas: CanvasDraft = {
    mediaType: "image",
    primaryBrief: "三个人站在酒吧里，中间是主角",
    secondaryBrief: "主角更大，背景偏丰富，人物左右分布",
    structureType: "multi_subject",
    objects: [
      { id: "lead", label: "主角", role: "primary", kind: "subject" },
      { id: "left", label: "左侧人物", role: "secondary", kind: "subject" },
      { id: "right", label: "右侧人物", role: "secondary", kind: "subject" }
    ],
    sceneType: "indoor",
    compositionFocus: "left_right",
    subjectCount: "3",
    backgroundDensity: "rich",
    relationMode: "left_right",
    emphasis: "主角更大，左右关系清晰",
    draggableNodes: [
      { id: "lead", label: "主角", role: "primary", kind: "subject", x: 50, y: 54, w: 30, h: 20, layer: 5, depth: "midground", emphasis: "high" },
      { id: "left", label: "左侧人物", role: "secondary", kind: "subject", x: 26, y: 57, w: 18, h: 14, layer: 3, depth: "midground", emphasis: "medium" },
      { id: "right", label: "右侧人物", role: "secondary", kind: "subject", x: 76, y: 57, w: 18, h: 14, layer: 3, depth: "midground", emphasis: "medium" }
    ],
    sceneZones: [
      { id: "bg", label: "后景", depth: "background", x: 4, y: 6, w: 92, h: 24, tone: "scene" },
      { id: "mid", label: "中景", depth: "midground", x: 4, y: 31, w: 92, h: 32, tone: "scene" },
      { id: "fg", label: "前景", depth: "foreground", x: 4, y: 64, w: 92, h: 24, tone: "scene" }
    ],
    compileHints: ["scene:bar", "background:rich", "relation:left_right"]
  };

  const intent = canvasDraftToIntentPlan(canvas, "zh");
  expect(intent.canvas?.mediaType).toBe("image");
  expect(intent.constraints.join("\n")).toContain("primary brief");
  expect(intent.hardConstraints?.join("\n")).toContain("composition focus");

  const project = intentPlanToProProject(intent, {
    subjectX: 0.5,
    subjectY: 0.54,
    subjectSize: 0.3,
    subjectLayer: 5,
    compositionFocus: "center"
  }, "zh");

  expect(project.scenes).toHaveLength(1);
  expect(project.scenes[0]?.layers).toHaveLength(3);
  expect(project.scenes[0]?.notes).toContain("background_density: rich");
  expect(project.scenes[0]?.notes).toContain("relation_mode:left_right");
});

test("video_canvas_draft_flows_into_multishot_project", async () => {
  const canvas: CanvasDraft = {
    mediaType: "video",
    primaryBrief: "先看到门外风雪，然后开门进入屋内",
    secondaryBrief: "保持同一人物，暖光稳定，情绪逐渐放松",
    structureType: "multi_scene",
    shotCount: 3,
    shots: [
      { id: "shot_1", index: 1, title: "门外风雪", summary: "建立外部环境", transitionFromPrev: "none", emphasis: "scene_progression", sceneLabel: "outdoor", objectIds: ["hero"] },
      { id: "shot_2", index: 2, title: "推门进入", summary: "过渡到内部", transitionFromPrev: "indoor_outdoor", emphasis: "scene_progression", sceneLabel: "transition", objectIds: ["hero"] },
      { id: "shot_3", index: 3, title: "屋内避难所", summary: "暖光稳定", transitionFromPrev: "same_space", emphasis: "scene_progression", sceneLabel: "indoor", objectIds: ["hero", "room"] }
    ],
    keyObjects: [
      { id: "hero", label: "主角", role: "primary", appearsInShotIds: ["shot_1", "shot_2", "shot_3"] },
      { id: "room", label: "避难所房间", role: "environment", appearsInShotIds: ["shot_3"] }
    ],
    mainScene: "multi_scene",
    continuityFocus: "lighting",
    rhythm: "emotion",
    sceneTransitions: "indoor_outdoor",
    storyboardNodes: [
      { id: "node_1", shotId: "shot_1", x: 6, y: 38, w: 18, h: 24 },
      { id: "node_2", shotId: "shot_2", x: 29, y: 38, w: 18, h: 24 },
      { id: "node_3", shotId: "shot_3", x: 52, y: 38, w: 18, h: 24 }
    ],
    compileHints: ["continuity:lighting", "scene:multi_scene", "rhythm:emotion"]
  };

  const intent = canvasDraftToIntentPlan(canvas, "zh");
  const project = intentPlanToProProject(intent, {
    subjectX: 0.48,
    subjectY: 0.46,
    subjectSize: 0.26,
    subjectLayer: 5,
    compositionFocus: "center"
  }, "zh");

  expect(project.scenes).toHaveLength(3);
  expect(project.scenes[0]?.name).toContain("门外风雪");
  expect(project.scenes[1]?.transitionType).toBe("dissolve");
  expect(project.scenes[2]?.notes).toContain("continuity_focus: lighting");
  expect(project.scenes[2]?.layers.map((layer) => layer.type)).toContain("避难所房间");
});
