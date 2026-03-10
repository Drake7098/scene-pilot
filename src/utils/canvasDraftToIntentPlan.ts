import type { Lang } from "../i18n";
import type { CanvasDraft } from "../types/canvasDraft";
import type { IntentPlan } from "../types/intentPlan";

function joinBriefs(canvas: CanvasDraft) {
  return [canvas.primaryBrief.trim(), canvas.secondaryBrief.trim()].filter(Boolean).join("\n");
}

export function canvasDraftToIntentPlan(canvas: CanvasDraft, lang: Lang): IntentPlan {
  if (canvas.mediaType === "image") {
    const primaryNode = canvas.draggableNodes.find((node) => node.role === "primary") ?? canvas.draggableNodes[0];
    return {
      version: "v1",
      sourceBrief: joinBriefs(canvas),
      lang,
      mediaType: "image",
      goal: canvas.structureType === "product_object"
        ? "ad"
        : canvas.relationMode === "subject_environment"
          ? "scene"
          : canvas.subjectCount === "1"
            ? "portrait"
            : "storyframe",
      ratio: "1:1",
      style: {
        genre: canvas.structureType === "product_object" ? "commercial" : "cinematic",
        mood: canvas.emphasis
      },
      camera: {
        shotType: canvas.subjectCount === "1" ? "closeup" : canvas.compositionFocus === "environment_wrap" ? "wide" : "medium",
        angle: "eye",
        framing: canvas.compositionFocus === "left_right" ? "balanced" : canvas.draggableNodes[0]?.x && canvas.draggableNodes[0].x < 40 ? "left" : canvas.draggableNodes[0]?.x && canvas.draggableNodes[0].x > 60 ? "right" : "center"
      },
      scene: {
        location: canvas.sceneType,
        backgroundDensity: canvas.backgroundDensity === "strong_environment" ? "rich" : canvas.backgroundDensity,
        timeOfDay: canvas.sceneType === "indoor" ? "indoor" : "unknown"
      },
      composition: {
        visualFocus: primaryNode && primaryNode.x < 40 ? "left" : primaryNode && primaryNode.x > 60 ? "right" : "center",
        primarySubjectWeight: primaryNode ? Number((primaryNode.w / 36).toFixed(2)) : 1,
        subjectScalePreference: primaryNode && primaryNode.w >= 30 ? "large" : primaryNode && primaryNode.w <= 20 ? "small" : "medium",
        primaryDepth: primaryNode?.depth ?? "midground"
      },
      subjects: canvas.draggableNodes.map((node) => ({
        id: node.id,
        label: node.label,
        role: node.role === "primary" ? "main" : "secondary",
        positionHint: node.depth === "foreground" ? "foreground" : node.depth === "background" ? "background" : node.x < 40 ? "left" : node.x > 60 ? "right" : "center",
        sizeHint: node.w >= 30 ? "large" : node.w <= 18 ? "small" : "medium",
        locked: node.role === "primary"
      })),
      constraints: [
        `primary brief: ${canvas.primaryBrief}`,
        `secondary brief: ${canvas.secondaryBrief}`,
        `scene type: ${canvas.sceneType}`,
        `relation mode: ${canvas.relationMode}`,
        `background density: ${canvas.backgroundDensity}`,
        ...canvas.compileHints
      ],
      hardConstraints: [
        `subject count: ${canvas.subjectCount}`,
        `composition focus: ${canvas.compositionFocus}`
      ],
      editHints: [
        canvas.emphasis,
        ...canvas.sceneZones.map((zone) => `${zone.label}:${zone.depth}`)
      ],
      canvas
    };
  }

  return {
    version: "v1",
    sourceBrief: joinBriefs(canvas),
    lang,
    mediaType: "video",
    goal: "storyframe",
    ratio: "16:9",
    style: {
      mood: canvas.rhythm,
      genre: canvas.structureType === "multicam" ? "multicam" : "cinematic"
    },
    camera: {
      shotType: canvas.structureType === "single_shot" ? "medium" : "wide",
      angle: "eye",
      framing: canvas.structureType === "continuous" ? "center" : "balanced"
    },
    scene: {
      location: canvas.mainScene,
      backgroundDensity: "normal",
      timeOfDay: canvas.mainScene === "indoor" ? "indoor" : "unknown"
    },
    composition: {
      visualFocus: "center",
      primarySubjectWeight: 1,
      subjectScalePreference: "medium",
      primaryDepth: "midground"
    },
    subjects: canvas.keyObjects.map((item, index) => ({
      id: item.id,
      label: item.label,
      role: index === 0 || item.role === "primary" ? "main" : "secondary",
      positionHint: index === 0 ? "center" : index % 2 ? "left" : "right",
      sizeHint: index === 0 ? "large" : "medium",
      locked: item.appearsInShotIds.length > 1
    })),
    constraints: [
      `primary brief: ${canvas.primaryBrief}`,
      `secondary brief: ${canvas.secondaryBrief}`,
      `structure type: ${canvas.structureType}`,
      `shot count: ${canvas.shotCount}`,
      `continuity focus: ${canvas.continuityFocus}`,
      `rhythm: ${canvas.rhythm}`,
      `scene transitions: ${canvas.sceneTransitions}`,
      ...canvas.compileHints
    ],
    hardConstraints: canvas.shots.map((shot) => `shot ${shot.index}: ${shot.title} / ${shot.sceneLabel} / ${shot.transitionFromPrev}`),
    editHints: canvas.keyObjects.map((item) => `${item.label}: ${item.appearsInShotIds.join(",")}`),
    canvas
  };
}
