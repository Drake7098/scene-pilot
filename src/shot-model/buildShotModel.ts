import type { Layer, LayerKF, TransitionType } from "../model";
import { resolveSceneConfig } from "../model";
import { parseCameraLanguageId } from "../content/cameraLanguageLayers";
import { parseDirectorStylePackId } from "../content/directorStylePacks";
import { parseImageClassicModeId, parseImageProEffects, parseVideoClassicModeId } from "../content/proCreativeModes";
import { parseProMotionSelection } from "../content/proCameraPresets";
import { resolveSceneStrategy } from "../utils/sceneStrategyResolver";
import type { BuildShotModelInput, ShotModel, ShotRelationEdge, ShotRole, ShotSubjectNode } from "./types";
import { resolveShotConflicts } from "./resolveShotConflicts";

function getShotPlan(project: BuildShotModelInput["project"]): ShotModel["context"]["shotPlan"] {
  const raw = (project?.project as any)?.shotPlan;
  if (raw === "single" || raw === "multicam" || raw === "continuous" || raw === "edit") return raw;
  return "single";
}

function getKF(layer: Layer, t: 0 | 1): LayerKF {
  const hit = (layer.kf ?? []).find((kf) => kf.t === t);
  const base = (layer.kf ?? []).find((kf) => kf.t === 0) ?? (layer.kf ?? [])[0];
  return (
    hit ??
    base ?? {
      t,
      x: 50,
      y: 50,
      w: 20,
      h: 20,
      rot: 0
    }
  );
}

function parseBg(notes: string): string {
  const hit = (notes ?? "")
    .split("\n")
    .find((line) => line.trim().toLowerCase().startsWith("bg:"));
  return hit ? hit.trim().slice(3).trim() : "";
}

function parseReferences(value: string): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toRole(layer: Layer, rank: number): ShotRole {
  if ((layer.type || "").toLowerCase().includes("background")) return "environment";
  if (rank === 0) return "primary";
  if ((layer.type || "").toLowerCase().includes("env")) return "environment";
  return "secondary";
}

function relationByAnchor(a: ShotSubjectNode, b: ShotSubjectNode): ShotRelationEdge {
  if (a.anchor.start.x + 2 < b.anchor.start.x) {
    return { from: a.id, to: b.id, relation: "left_of", priority: "hard", reason: "start-frame x ordering" };
  }
  if (a.anchor.start.x > b.anchor.start.x + 2) {
    return { from: a.id, to: b.id, relation: "right_of", priority: "hard", reason: "start-frame x ordering" };
  }
  if (a.z > b.z) {
    return { from: a.id, to: b.id, relation: "foreground", priority: "hard", reason: "z order" };
  }
  if (a.z < b.z) {
    return { from: a.id, to: b.id, relation: "background", priority: "hard", reason: "z order" };
  }
  return { from: a.id, to: b.id, relation: "overlap", priority: "soft", reason: "same layer depth and near anchor" };
}

function isStaticTimeline(nodes: ShotSubjectNode[]): boolean {
  return nodes.every((node) => {
    const a = node.anchor.start;
    const b = node.anchor.end;
    const eq = (x: number, y: number) => Math.round(x * 10) === Math.round(y * 10);
    return eq(a.x, b.x) && eq(a.y, b.y) && eq(a.w, b.w) && eq(a.h, b.h) && eq(a.rot, b.rot);
  });
}

function summarisePath(node: ShotSubjectNode): string {
  const a = node.anchor.start;
  const b = node.anchor.end;
  const dx = Math.round((b.x - a.x) * 10) / 10;
  const dy = Math.round((b.y - a.y) * 10) / 10;
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
    return `${node.id}: hold position`;
  }
  const xWord = dx > 0 ? "right" : "left";
  const yWord = dy > 0 ? "down" : "up";
  if (Math.abs(dx) >= 2 && Math.abs(dy) >= 2) return `${node.id}: move ${xWord} and ${yWord}`;
  if (Math.abs(dx) >= 2) return `${node.id}: move ${xWord}`;
  return `${node.id}: move ${yWord}`;
}

function energyFromMotion(mode: ShotModel["motion"]["mode"], durationSec: number): ShotModel["mood"]["energy"] {
  if (mode === "kinetic" && durationSec <= 4) return "high";
  if (mode === "kinetic") return "medium";
  return "low";
}

function deriveFocus(nodes: ShotSubjectNode[]): ShotModel["composition"]["focus"] {
  const primaryCount = nodes.filter((item) => item.role === "primary").length;
  if (primaryCount <= 1 && nodes.length <= 2) return "single_subject";
  if (nodes.filter((item) => item.role === "environment").length >= Math.ceil(nodes.length / 2)) return "environment_first";
  return "multi_subject";
}

function normalizeTransitionType(raw: string | null | undefined): TransitionType {
  if (raw === "cut" || raw === "reverse_angle" || raw === "camera_continues" || raw === "dissolve" || raw === "time_jump") {
    return raw;
  }
  return "cut";
}

export function buildShotModel(input: BuildShotModelInput): ShotModel {
  const { project, scene, sceneIndex } = input;
  const shotPlan = getShotPlan(project);
  const resolved = resolveSceneConfig(scene);
  const durationSec = Math.max(1, Math.round(Number(scene.duration_s) || 0));
  const sortedLayers = (scene.layers ?? [])
    .slice()
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0));

  const subjectNodes: ShotSubjectNode[] = sortedLayers.map((layer, idx) => {
    const a = getKF(layer, 0);
    const b = getKF(layer, 1);
    return {
      id: layer.id,
      role: toRole(layer, idx),
      type: (layer.type ?? "").trim(),
      look: (layer.look ?? "").trim(),
      notes: (layer.notes ?? "").trim(),
      localPrompt: (layer.externalPrompt ?? "").trim(),
      referenceLinks: parseReferences(layer.referenceLinks ?? ""),
      z: Number.isFinite(layer.z) ? layer.z : 0,
      anchor: {
        start: { x: a.x, y: a.y, w: a.w, h: a.h, rot: a.rot },
        end: { x: b.x, y: b.y, w: b.w, h: b.h, rot: b.rot }
      }
    };
  });

  const relations: ShotRelationEdge[] = [];
  for (let i = 0; i < subjectNodes.length; i += 1) {
    for (let j = i + 1; j < subjectNodes.length; j += 1) {
      relations.push(relationByAnchor(subjectNodes[i], subjectNodes[j]));
    }
  }

  const isStatic = isStaticTimeline(subjectNodes);
  const conflictState = resolveShotConflicts({
    sceneNotes: scene.notes ?? "",
    layerNotes: subjectNodes.map((item) => item.notes),
    layerLocalPrompts: subjectNodes.map((item) => item.localPrompt),
    isStaticTimeline: isStatic
  });

  const strategy = resolveSceneStrategy(scene, "en", resolved.mediaMode);
  const cameraLanguageId = parseCameraLanguageId(scene.notes ?? "") || null;
  const directorPackId = parseDirectorStylePackId(scene.notes ?? "");
  const proMotion = parseProMotionSelection(scene.notes ?? "");
  const imageClassicModeId = parseImageClassicModeId(scene.notes ?? "");
  const videoClassicModeId = parseVideoClassicModeId(scene.notes ?? "");
  const imageProEffectIds = parseImageProEffects(scene.notes ?? "");

  const movement =
    conflictState.allowMotionDisplacement
      ? (scene.camera?.movement || strategy.defaults.movement || "static")
      : "static";

  const motionMode: ShotModel["motion"]["mode"] = movement === "static" && isStatic ? "static" : "kinetic";

  const hardConstraints: string[] = [
    "preserve object count",
    "preserve relative layer order",
    "preserve start-frame anchors"
  ];
  if (!conflictState.allowTextOverlay) hardConstraints.push("no text overlays");
  if (!conflictState.allowAddRemoveSubjects) hardConstraints.push("no add/remove subjects");
  if (!conflictState.allowHeroCenterOverride) hardConstraints.push("no auto-center override");
  if (!conflictState.allowMotionDisplacement) hardConstraints.push("no displacement beyond structural path");

  const spatialNarrative = [
    scene.shotNote ? `shot note: ${scene.shotNote}` : "",
    scene.entryDir ? `entry direction: ${scene.entryDir}` : "",
    scene.exitDir ? `exit direction: ${scene.exitDir}` : ""
  ].filter(Boolean);

  const localPromptCues = subjectNodes
    .map((item) => item.localPrompt)
    .filter(Boolean);

  const referenceLinks = Array.from(
    new Set(subjectNodes.flatMap((item) => item.referenceLinks).filter(Boolean))
  );

  const continuityEnabled = shotPlan === "continuous" || Boolean(project.continuity?.enabled);

  const bridgeToNext = continuityEnabled
    ? [
        scene.exitDir ? `carry exit direction ${scene.exitDir} to next shot` : "",
        "keep identity continuity for primary subjects",
        "keep camera semantic continuity"
      ].filter(Boolean)
    : [];

  const consumedFields = [
    "scene.duration_s",
    "scene.camera.shot",
    "scene.camera.movement",
    "scene.cameraPreset",
    "scene.transitionType",
    "scene.shotNote",
    "scene.entryDir",
    "scene.exitDir",
    "scene.notes",
    "scene.lighting.time",
    "scene.lighting.key_dir",
    "scene.lighting.mood",
    "layer.id",
    "layer.type",
    "layer.look",
    "layer.notes",
    "layer.externalPrompt",
    "layer.referenceLinks",
    "layer.kf[t0,t1]",
    "layer.z",
    "hidden.camera_language",
    "hidden.director_pack",
    "hidden.video_classic_mode",
    "hidden.image_classic_mode",
    "hidden.image_pro_effects",
    "hidden.pro_basic_motion",
    "hidden.pro_plus_motion"
  ];

  return {
    context: {
      sceneId: scene.id,
      sceneName: scene.name || scene.id,
      index: sceneIndex,
      totalScenes: project.scenes.length,
      mediaMode: resolved.mediaMode,
      shotPlan,
      durationSec
    },
    subject: {
      primary: subjectNodes.find((item) => item.role === "primary") ?? null,
      secondary: subjectNodes.filter((item) => item.role === "secondary"),
      environment: subjectNodes.filter((item) => item.role === "environment"),
      relations
    },
    action: {
      primaryAction: scene.shotNote?.trim() || "execute scene intention with clear subject readability",
      supportActions: subjectNodes.map((item) => item.notes).filter(Boolean),
      blockedActions: conflictState.decisions.filter((item) => item.action === "drop").map((item) => item.conflict)
    },
    camera: {
      shot: scene.camera?.shot || scene.cameraPreset || strategy.defaults.shot || "medium",
      movement,
      preset: scene.cameraPreset || "",
      cameraLanguageId,
      directorPackId,
      proBasicMotionId: proMotion.basicId,
      proPlusMotionIds: proMotion.proPlusIds,
      transitionType: normalizeTransitionType(scene.transitionType ?? strategy.defaults.transitionType)
    },
    composition: {
      focus: deriveFocus(subjectNodes),
      framing: subjectNodes.map((node) => `${node.id} @ (${Math.round(node.anchor.start.x)}, ${Math.round(node.anchor.start.y)})`),
      antiRules: ["no auto-center", "no object count drift"]
    },
    space: {
      background: parseBg(scene.notes ?? ""),
      entryDir: scene.entryDir ?? null,
      exitDir: scene.exitDir ?? null,
      depthOrder: subjectNodes.map((item) => ({ id: item.id, z: item.z })),
      spatialNarrative
    },
    layer: {
      orderedIds: subjectNodes.map((item) => item.id),
      anchors: subjectNodes.map((item) => ({
        id: item.id,
        start: `x=${Math.round(item.anchor.start.x)} y=${Math.round(item.anchor.start.y)} w=${Math.round(item.anchor.start.w)} h=${Math.round(item.anchor.start.h)}`,
        end: `x=${Math.round(item.anchor.end.x)} y=${Math.round(item.anchor.end.y)} w=${Math.round(item.anchor.end.w)} h=${Math.round(item.anchor.end.h)}`
      }))
    },
    lighting: {
      time: scene.lighting?.time || strategy.defaults.time,
      keyDir: scene.lighting?.key_dir || strategy.defaults.keyDir,
      mood: scene.lighting?.mood || strategy.defaults.mood,
      profileIds: strategy.lightingProfileIds,
      cues: strategy.promptLines.filter((line) => /light|lighting|光|主光|背光/i.test(line))
    },
    material: {
      surfaceCues: subjectNodes.map((item) => item.look).filter(Boolean),
      styleCues: imageProEffectIds
    },
    detail: {
      shotNote: scene.shotNote ?? "",
      sceneNotes: scene.notes ?? "",
      localPromptCues,
      referenceLinks
    },
    mood: {
      tone: scene.lighting?.mood || strategy.defaults.mood,
      energy: energyFromMotion(motionMode, durationSec),
      keywords: [
        scene.lighting?.mood,
        directorPackId,
        imageClassicModeId,
        videoClassicModeId
      ].filter(Boolean) as string[]
    },
    style: {
      imageClassicModeId,
      videoClassicModeId,
      imageProEffectIds
    },
    semantic: {
      intentLabels: [
        resolved.mediaMode,
        shotPlan,
        cameraLanguageId || "",
        directorPackId || ""
      ].filter(Boolean),
      hardConstraints,
      softConstraints: [
        "style follows structure",
        "global camera language cannot be overridden by object-local prompts"
      ]
    },
    motion: {
      mode: motionMode,
      pathSummary: subjectNodes.map(summarisePath),
      continuityHints: continuityEnabled ? ["keep subject identity", "keep camera intent", "keep direction continuity"] : []
    },
    continuity: {
      enabled: continuityEnabled,
      carryOver: {
        identity: Boolean(project.continuity?.characterCarryOver ?? true),
        camera: Boolean(project.continuity?.cameraCarryOver ?? true),
        direction: Boolean(project.continuity?.directionCarryOver ?? true),
        background: Boolean(project.continuity?.bgCarryOver ?? false)
      },
      bridgeToNext
    },
    metadata: {
      sourceProject: {
        id: project.id,
        name: project.name
      },
      sourceScene: {
        id: scene.id,
        name: scene.name
      },
      consumedFields,
      unresolvedFields: [],
      conflictDecisions: conflictState.decisions
    }
  };
}
