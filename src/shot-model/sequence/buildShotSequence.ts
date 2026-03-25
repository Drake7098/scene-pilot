import type { BuildShotSequenceInput, ShotSequence, ShotSequenceEdge, ShotSequenceNode } from "./types";

function motionRelation(prev: ShotSequenceNode, next: ShotSequenceNode): ShotSequenceEdge["motionRelation"] {
  const prevFast = /fast|rush|whip|push/i.test(`${prev.camera.movement} ${prev.camera.shot}`);
  const nextFast = /fast|rush|whip|push/i.test(`${next.camera.movement} ${next.camera.shot}`);
  if (prevFast && nextFast) return "hold";
  if (!prevFast && nextFast) return "accelerate";
  if (prevFast && !nextFast) return "decelerate";
  return "switch";
}

export function buildShotSequence(input: BuildShotSequenceInput): ShotSequence {
  const source = input.shotModels.slice(0, 5);
  const nodes: ShotSequenceNode[] = source.map((item, index) => ({
    shotId: item.context.sceneId,
    index,
    durationSec: item.context.durationSec,
    entryDir: item.space.entryDir,
    exitDir: item.space.exitDir,
    camera: {
      shot: item.camera.shot,
      movement: item.camera.movement
    },
    continuity: {
      identity: item.continuity.carryOver.identity,
      camera: item.continuity.carryOver.camera,
      direction: item.continuity.carryOver.direction
    }
  }));

  const edges: ShotSequenceEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({
      fromShotId: nodes[i].shotId,
      toShotId: nodes[i + 1].shotId,
      carryOver: {
        identity: nodes[i].continuity.identity && nodes[i + 1].continuity.identity,
        camera: nodes[i].continuity.camera && nodes[i + 1].continuity.camera,
        direction: nodes[i].continuity.direction && nodes[i + 1].continuity.direction
      },
      motionRelation: motionRelation(nodes[i], nodes[i + 1])
    });
  }

  return {
    durationSec: nodes.reduce((sum, item) => sum + item.durationSec, 0),
    nodes,
    edges,
    sourceShotIds: source.map((item) => item.context.sceneId),
    entryDirection: nodes[0]?.entryDir ?? null,
    exitDirection: nodes[nodes.length - 1]?.exitDir ?? null
  };
}
