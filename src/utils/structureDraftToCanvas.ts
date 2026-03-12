import type { Lang } from "../i18n";
import type {
  CanvasDraft,
  ImageCanvasDraft,
  ImageCanvasNode,
  ImageSceneType,
  VideoCanvasDraft,
  VideoKeyObject,
  VideoRhythm,
  VideoSceneTransition
} from "../types/canvasDraft";
import type { DraftObject, StructureDraft } from "../types/structureDraft";

function mapImageCompositionFocus(draft: Extract<StructureDraft, { mediaType: "image" }>): ImageCanvasDraft["compositionFocus"] {
  if (draft.compositionFocus === "environment_wrap") return "environment_wrap";
  if (draft.composition.framing === "depth") return "depth";
  if (draft.composition.focusMode === "relation") return "left_right";
  return "center";
}

function mapImageSubjectCount(count: number): ImageCanvasDraft["subjectCount"] {
  if (count <= 1) return "1";
  if (count === 2) return "2";
  if (count === 3) return "3";
  return "4+";
}

function buildImageZones(sceneType: ImageSceneType) {
  const tone: "subject" | "scene" | "product" = sceneType === "product_display" ? "product" : sceneType === "complex" ? "scene" : "subject";
  return [
    { id: "bg", label: "后景", depth: "background" as const, x: 4, y: 6, w: 92, h: 24, tone },
    { id: "mid", label: "中景", depth: "midground" as const, x: 4, y: 31, w: 92, h: 32, tone },
    { id: "fg", label: "前景", depth: "foreground" as const, x: 4, y: 64, w: 92, h: 24, tone }
  ];
}

function buildImageNodeLayout(draft: Extract<StructureDraft, { mediaType: "image" }>): ImageCanvasNode[] {
  const primaryX = draft.composition.framing === "left" ? 28 : draft.composition.framing === "right" ? 70 : 50;
  const primaryY = draft.composition.framing === "depth" ? 68 : draft.sceneType === "product_display" ? 54 : 50;
  const positions = draft.objects.map((obj, index) => {
    if (index === 0) {
      return { x: primaryX, y: primaryY, w: draft.subjectScale === "detail" ? 34 : draft.subjectScale === "wide" ? 22 : 28, h: draft.subjectScale === "detail" ? 24 : 18 };
    }
    if (draft.relationMode === "front_back") {
      return index % 2 === 1
        ? { x: 54, y: 40, w: 22, h: 16 }
        : { x: 78, y: 58, w: 18, h: 14 };
    }
    if (draft.relationMode === "subject_environment") {
      return { x: 78, y: 28 + index * 10, w: 18, h: 12 };
    }
    return index % 2 === 1
      ? { x: 24, y: 54, w: 18, h: 14 }
      : { x: 76, y: 54, w: 18, h: 14 };
  });

  return draft.objects.map((obj, index) => ({
    id: obj.id,
    label: obj.name,
    role: obj.role,
    kind: obj.role === "environment" ? "environment" : obj.role === "support" ? "support" : "subject",
    layer: obj.depth === "foreground" ? 4 : obj.depth === "midground" ? 3 : 2,
    depth: obj.depth,
    emphasis: obj.role === "primary" ? "high" : obj.role === "secondary" ? "medium" : "low",
    ...positions[index]
  }));
}

function buildVideoKeyObjects(draft: Extract<StructureDraft, { mediaType: "video" }>): VideoKeyObject[] {
  return draft.objects.map((obj, index) => {
    const appearsInShotIds = draft.shots
      .filter((shot) => shot.objectIds.includes(obj.id))
      .map((shot) => shot.id);
    return {
      id: obj.id,
      label: obj.name,
      role: obj.role,
      appearsInShotIds: appearsInShotIds.length ? appearsInShotIds : draft.shots.slice(index === 0 ? 0 : 1).map((shot) => shot.id)
    };
  });
}

function inferVideoRhythm(draft: Extract<StructureDraft, { mediaType: "video" }>): VideoRhythm {
  return draft.rhythm;
}

function inferVideoTransition(draft: Extract<StructureDraft, { mediaType: "video" }>): VideoSceneTransition {
  return draft.sceneTransitions;
}

function defaultVideoShotCountByStructure(structureType: Extract<StructureDraft, { mediaType: "video" }>["structureType"]): 1 | 3 | 4 | 5 {
  if (structureType === "single_shot") return 1;
  if (structureType === "multicam") return 4;
  if (structureType === "continuous") return 4;
  return 5;
}

function inferMainSceneFromNarrative(
  structureType: Extract<StructureDraft, { mediaType: "video" }>["structureType"],
  narrative: string,
  fallback: VideoCanvasDraft["mainScene"]
): VideoCanvasDraft["mainScene"] {
  if (structureType === "multi_scene") return "multi_scene";
  const text = narrative.toLowerCase();
  const indoorTerms = ["室内", "房间", "客厅", "卧室", "厨房", "酒吧", "咖啡馆", "indoor", "room", "interior", "living room", "kitchen", "bedroom", "bar", "cafe"];
  const outdoorTerms = ["室外", "街道", "森林", "公园", "海边", "山", "沙漠", "雪地", "outdoor", "street", "forest", "park", "beach", "mountain", "desert", "snowfield"];
  const indoorHit = indoorTerms.some((term) => text.includes(term));
  const outdoorHit = outdoorTerms.some((term) => text.includes(term));
  if (outdoorHit && !indoorHit) return "outdoor";
  if (indoorHit && !outdoorHit) return "indoor";
  if (indoorHit && outdoorHit) return "complex";
  if (fallback === "multi_scene") return "complex";
  return fallback;
}

function normalizeSceneTransition(
  structureType: Extract<StructureDraft, { mediaType: "video" }>["structureType"],
  transition: VideoSceneTransition
): VideoSceneTransition {
  if (structureType === "single_shot") return "none";
  if (structureType === "multi_scene") return transition === "none" ? "location_switch" : transition;
  return transition === "none" ? "same_space" : transition;
}

function normalizeVideoShotCount(
  structureType: Extract<StructureDraft, { mediaType: "video" }>["structureType"],
  shotCount: number
): 1 | 3 | 4 | 5 {
  if (structureType === "single_shot") return 1;
  if (shotCount <= 1) return defaultVideoShotCountByStructure(structureType);
  if (shotCount <= 3) return 3;
  if (shotCount <= 4) return 4;
  return 5;
}

function normalizeVideoShots(
  draft: Extract<StructureDraft, { mediaType: "video" }>,
  shotCount: 1 | 3 | 4 | 5,
  transition: VideoSceneTransition
) {
  const base = draft.shots.map((shot) => ({ ...shot })).slice(0, shotCount);
  while (base.length < shotCount) {
    const nextIndex = base.length + 1;
    base.push({
      id: `shot_${nextIndex}`,
      index: nextIndex,
      title: `shot_${nextIndex}`,
      durationSec: draft.structureType === "single_shot" ? 6 : 4,
      sceneLabel: draft.scene,
      objectIds: draft.objects.map((item) => item.id),
      transitionFromPrev: nextIndex === 1 ? "none" : transition,
      emphasis: ""
    });
  }
  return base.map((shot, index) => ({
    ...shot,
    index: index + 1,
    sceneLabel: shot.sceneLabel || draft.scene,
    objectIds: shot.objectIds?.length ? shot.objectIds : draft.objects.map((item) => item.id),
    transitionFromPrev: (index === 0 ? "none" : shot.transitionFromPrev || transition) as VideoCanvasDraft["shots"][number]["transitionFromPrev"]
  }));
}

export function structureDraftToCanvas(draft: StructureDraft, _lang: Lang): CanvasDraft {
  if (draft.mediaType === "image") {
    return {
      mediaType: "image",
      primaryBrief: draft.primaryBrief,
      secondaryBrief: draft.secondaryBrief,
      structureType: draft.structureType,
      objects: draft.objects.map((item) => ({
        id: item.id,
        label: item.name,
        role: item.role,
        kind: item.role === "environment" ? "environment" : item.role === "support" ? "support" : "subject"
      })),
      sceneType: draft.sceneType,
      compositionFocus: mapImageCompositionFocus(draft),
      subjectCount: mapImageSubjectCount(draft.composition.subjectCount),
      backgroundDensity: draft.composition.backgroundDensity,
      relationMode: draft.relationMode,
      emphasis: draft.emphasis,
      draggableNodes: buildImageNodeLayout(draft),
      sceneZones: buildImageZones(draft.sceneType),
      compileHints: [
        draft.focus,
        ...draft.spatialRelations,
        `scene:${draft.scene}`,
        `background:${draft.composition.backgroundDensity}`,
        `relation:${draft.relationMode}`
      ]
    };
  }

  const normalizedShotCount = normalizeVideoShotCount(draft.structureType, draft.shotCount);
  const normalizedTransition = normalizeSceneTransition(draft.structureType, inferVideoTransition(draft));
  const normalizedShots = normalizeVideoShots(draft, normalizedShotCount, normalizedTransition);
  const normalizedMainScene = inferMainSceneFromNarrative(
    draft.structureType,
    `${draft.primaryBrief} ${draft.secondaryBrief} ${draft.scene}`,
    draft.mainScene
  );
  const normalizedDraft: Extract<StructureDraft, { mediaType: "video" }> = {
    ...draft,
    shotCount: normalizedShotCount,
    sceneTransitions: normalizedTransition,
    mainScene: normalizedMainScene,
    shots: normalizedShots
  };
  const keyObjects = buildVideoKeyObjects(normalizedDraft);
  return {
    mediaType: "video",
    primaryBrief: normalizedDraft.primaryBrief,
    secondaryBrief: normalizedDraft.secondaryBrief,
    structureType: normalizedDraft.structureType,
    shotCount: normalizedDraft.shotCount,
    shots: normalizedDraft.shots.map((shot) => ({
      id: shot.id,
      index: shot.index,
      title: shot.title,
      summary: shot.emphasis,
      transitionFromPrev: shot.transitionFromPrev,
      emphasis: shot.emphasis,
      sceneLabel: shot.sceneLabel,
      objectIds: shot.objectIds
    })),
    keyObjects,
    mainScene: normalizedDraft.mainScene,
    continuityFocus: normalizedDraft.continuityFocus,
    rhythm: inferVideoRhythm(normalizedDraft),
    sceneTransitions: normalizedDraft.sceneTransitions,
    storyboardNodes: normalizedDraft.shots.map((shot, index) => ({
      id: `node_${shot.id}`,
      shotId: shot.id,
      x: 6 + index * 23,
      y: 38,
      w: normalizedDraft.shots.length === 1 ? 88 : 18,
      h: 24
    })),
    compileHints: [
      ...normalizedDraft.continuity,
      `scene:${normalizedDraft.scene}`,
      `main_scene:${normalizedDraft.mainScene}`,
      `camera_motion:${normalizedDraft.cameraMotion}`,
      `rhythm:${normalizedDraft.rhythm}`
    ]
  };
}

function syncImageNodeObjects(
  objects: ImageCanvasDraft["objects"],
  nodes: ImageCanvasDraft["draggableNodes"]
): ImageCanvasDraft["objects"] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return objects.map((item) => {
    const node = nodeMap.get(item.id);
    if (!node) return item;
    return {
      ...item,
      role: node.role,
      kind: node.kind
    };
  });
}

export function updateImageCanvasNodes(
  canvas: ImageCanvasDraft,
  updater: (nodes: ImageCanvasDraft["draggableNodes"]) => ImageCanvasDraft["draggableNodes"]
): ImageCanvasDraft {
  const nextNodes = updater(canvas.draggableNodes);
  return {
    ...canvas,
    draggableNodes: nextNodes,
    objects: syncImageNodeObjects(canvas.objects, nextNodes)
  };
}

export function updateVideoShots(
  canvas: VideoCanvasDraft,
  updater: (shots: VideoCanvasDraft["shots"]) => VideoCanvasDraft["shots"]
): VideoCanvasDraft {
  const nextShots = updater(canvas.shots).map((shot, index) => ({
    ...shot,
    index: index + 1
  }));
  return {
    ...canvas,
    shotCount: nextShots.length === 1 ? 1 : nextShots.length === 3 ? 3 : nextShots.length === 4 ? 4 : 5,
    shots: nextShots,
    storyboardNodes: nextShots.map((shot, index) => ({
      id: `node_${shot.id}`,
      shotId: shot.id,
      x: 6 + index * (nextShots.length === 1 ? 0 : 23),
      y: 38,
      w: nextShots.length === 1 ? 88 : 18,
      h: 24
    }))
  };
}

export function updateVideoKeyObjects(
  canvas: VideoCanvasDraft,
  updater: (objects: VideoCanvasDraft["keyObjects"]) => VideoCanvasDraft["keyObjects"]
): VideoCanvasDraft {
  return {
    ...canvas,
    keyObjects: updater(canvas.keyObjects)
  };
}
