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

  const keyObjects = buildVideoKeyObjects(draft);
  return {
    mediaType: "video",
    primaryBrief: draft.primaryBrief,
    secondaryBrief: draft.secondaryBrief,
    structureType: draft.structureType,
    shotCount: draft.shotCount,
    shots: draft.shots.map((shot) => ({
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
    mainScene: draft.mainScene,
    continuityFocus: draft.continuityFocus,
    rhythm: inferVideoRhythm(draft),
    sceneTransitions: inferVideoTransition(draft),
    storyboardNodes: draft.shots.map((shot, index) => ({
      id: `node_${shot.id}`,
      shotId: shot.id,
      x: 6 + index * 23,
      y: 38,
      w: draft.shots.length === 1 ? 88 : 18,
      h: 24
    })),
    compileHints: [
      ...draft.continuity,
      `scene:${draft.scene}`,
      `main_scene:${draft.mainScene}`,
      `camera_motion:${draft.cameraMotion}`,
      `rhythm:${draft.rhythm}`
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
