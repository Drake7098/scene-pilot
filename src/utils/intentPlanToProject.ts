import type { Lang } from "../i18n";
import type { Project, TransitionType } from "../model";
import { sanitizeProject } from "../model";
import type { ResultStructureState } from "../components/ResultConsole";
import type { CanvasDraft } from "../types/canvasDraft";
import type { IntentPlan } from "../types/intentPlan";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapTransition(value: string): TransitionType {
  if (value === "time_jump") return "time_jump";
  if (value === "same_space") return "camera_continues";
  if (value === "indoor_outdoor" || value === "location_switch") return "dissolve";
  return "cut";
}

function fallbackSceneName(intentPlan: IntentPlan, lang: Lang) {
  return intentPlan.sourceBrief.slice(0, 28).trim() || (lang === "zh" ? "快速导入场景" : "Quick Imported Scene");
}

function imageProjectFromCanvas(intentPlan: IntentPlan, structureState: ResultStructureState, lang: Lang, canvas: Extract<CanvasDraft, { mediaType: "image" }>): Project {
  const sceneName = fallbackSceneName(intentPlan, lang);
  const layers = canvas.draggableNodes.map((node, index) => ({
    id: node.id,
    type: node.label,
    shape: "rect" as const,
    shapeDesc: "",
    look: [intentPlan.style.genre, intentPlan.style.mood, canvas.emphasis].filter(Boolean).join(", "),
    z: node.layer,
    color: node.role === "primary" ? "#87c4ff" : node.kind === "environment" ? "#78f2cf" : "#9bb7ff",
    opacity: 1,
    kf: [
      { t: 0 as const, x: node.x, y: node.y, w: node.w, h: node.h, rot: 0 },
      { t: 1 as const, x: node.x, y: node.y, w: node.w, h: node.h, rot: 0 }
    ],
    notes: [
      `role:${node.role}`,
      `depth:${node.depth}`,
      `composition_focus:${canvas.compositionFocus}`,
      `relation_mode:${canvas.relationMode}`,
      index === 0 ? `legacy_focus:${structureState.compositionFocus}` : ""
    ].filter(Boolean).join("; "),
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional" as const
  }));

  return sanitizeProject({
    project: {
      mode: "storyboard",
      mediaType: "image",
      shotPlan: "single"
    },
    scenes: [
      {
        id: "s1",
        name: sceneName,
        duration_s: 12,
        cameraPreset: intentPlan.camera.shotType ?? "medium",
        layoutLocked: false,
        inheritFromPrevious: false,
        inheritBgRefFromPrevious: false,
        inheritObjectRefsFromPrevious: "off",
        transitionType: "cut",
        camera: {
          shot: intentPlan.camera.shotType ?? "medium",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: {
          time: intentPlan.scene.timeOfDay ?? "",
          key_dir: intentPlan.camera.angle ?? "",
          mood: intentPlan.style.mood ?? ""
        },
        layers,
        config: {
          mediaMode: "image",
          compiler: "v1",
          sceneTier: canvas.sceneType === "indoor" ? "indoor" : "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: [
          "media: image",
          `goal: ${intentPlan.goal}`,
          `ratio: ${intentPlan.ratio}`,
          `location: ${canvas.sceneType}`,
          `framing: ${intentPlan.camera.framing ?? "center"}`,
          `background_density: ${canvas.backgroundDensity}`,
          `composition_focus:${canvas.compositionFocus}`,
          `relation_mode:${canvas.relationMode}`,
          ...canvas.compileHints,
          ...(intentPlan.hardConstraints ?? []),
          ...intentPlan.editHints
        ].filter(Boolean).join("\n")
      }
    ]
  });
}

function videoProjectFromCanvas(intentPlan: IntentPlan, structureState: ResultStructureState, lang: Lang, canvas: Extract<CanvasDraft, { mediaType: "video" }>): Project {
  const baseName = fallbackSceneName(intentPlan, lang);
  const scenes = canvas.shots.map((shot, index) => {
    const layers = canvas.keyObjects
      .filter((item) => shot.objectIds.includes(item.id))
      .map((item, layerIndex) => {
        const x = layerIndex === 0 ? structureState.subjectX * 100 : layerIndex % 2 ? 28 : 72;
        const y = layerIndex === 0 ? structureState.subjectY * 100 : 48;
        const size = layerIndex === 0 ? structureState.subjectSize * 100 : clamp(structureState.subjectSize * 82, 14, 28);
        return {
          id: item.id,
          type: item.label,
          shape: "rect" as const,
          shapeDesc: "",
          look: [intentPlan.style.genre, intentPlan.style.mood, canvas.rhythm].filter(Boolean).join(", "),
          z: layerIndex === 0 ? structureState.subjectLayer : 3 + layerIndex,
          color: item.role === "primary" ? "#87c4ff" : "#9bb7ff",
          opacity: 1,
          kf: [
            { t: 0 as const, x, y, w: size, h: Math.round(size * 1.1), rot: 0 },
            { t: 1 as const, x, y, w: size, h: Math.round(size * 1.1), rot: 0 }
          ],
          notes: [
            `role:${item.role}`,
            `appears_in:${item.appearsInShotIds.join(",")}`,
            `continuity_focus:${canvas.continuityFocus}`,
            `rhythm:${canvas.rhythm}`
          ].join("; "),
          externalPrompt: "",
          referenceLinks: "",
          localRefs: [],
          referencePolicy: "optional" as const
        };
      });

    return {
      id: shot.id,
      name: shot.title || `${baseName} ${index + 1}`,
      index,
      duration_s: 1 === canvas.shotCount ? 6 : 4,
      cameraPreset: intentPlan.camera.shotType ?? "medium",
      layoutLocked: false,
      inheritFromPrevious: index > 0,
      inheritBgRefFromPrevious: canvas.sceneTransitions === "same_space",
      inheritObjectRefsFromPrevious: (canvas.continuityFocus === "identity" ? "identity_only" : "all") as "identity_only" | "all",
      transitionType: mapTransition(shot.transitionFromPrev),
      shotNote: shot.summary,
      camera: {
        shot: intentPlan.camera.shotType ?? "medium",
        movement: canvas.structureType === "continuous" ? "push_in" : canvas.structureType === "single_shot" ? "follow" : "static",
        keyframes: [
          { t: 0 as const, x: 0, y: 0, zoom: 1, rot: 0 },
          { t: 1 as const, x: 0, y: 0, zoom: canvas.structureType === "continuous" ? 1.08 : 1, rot: 0 }
        ]
      },
      lighting: {
        time: intentPlan.scene.timeOfDay ?? "",
        key_dir: intentPlan.camera.angle ?? "",
        mood: intentPlan.style.mood ?? canvas.rhythm
      },
      layers,
      config: {
        mediaMode: "video" as const,
        compiler: "v2" as const,
        sceneTier: (canvas.mainScene === "indoor" ? "indoor" : canvas.mainScene === "complex" || canvas.structureType === "multi_scene" ? "open_space" : "small_plaza") as "indoor" | "small_plaza" | "open_space",
        v2Mode: "strict" as const,
        stability: "strict" as const
      },
      notes: [
        "media: video",
        "@compiler: v2",
        `goal: ${intentPlan.goal}`,
        `ratio: ${intentPlan.ratio}`,
        `location: ${shot.sceneLabel}`,
        `continuity_focus: ${canvas.continuityFocus}`,
        `rhythm: ${canvas.rhythm}`,
        `scene_transition: ${shot.transitionFromPrev}`,
        `composition_focus:${structureState.compositionFocus}`,
        ...canvas.compileHints,
        ...(intentPlan.hardConstraints ?? []),
        ...intentPlan.editHints
      ].filter(Boolean).join("\n")
    };
  });

  return sanitizeProject({
    project: {
      mode: "storyboard",
      mediaType: "video",
      shotPlan: canvas.structureType === "single_shot" ? "single" : canvas.structureType === "continuous" ? "continuous" : "multicam"
    },
    scenes
  });
}

function fallbackProject(intentPlan: IntentPlan, structureState: ResultStructureState, lang: Lang): Project {
  const sceneName = fallbackSceneName(intentPlan, lang);
  const layers = intentPlan.subjects.map((subject, idx) => {
    const sizeBase = structureState.subjectSize;
    const subjectSize = idx === 0 ? sizeBase : Math.max(12, Math.round(sizeBase * (subject.sizeHint === "small" ? 0.6 : subject.sizeHint === "large" ? 1.05 : 0.8)));
    const x = idx === 0
      ? structureState.subjectX
      : subject.positionHint === "left"
        ? 24
        : subject.positionHint === "right"
          ? 76
          : 50;
    const y = idx === 0 ? structureState.subjectY : subject.positionHint === "foreground" ? 64 : 40;
    return {
      id: subject.id,
      type: subject.label,
      shape: "rect" as const,
      shapeDesc: "",
      look: [intentPlan.style.genre, intentPlan.style.mood, intentPlan.style.lighting].filter(Boolean).join(", "),
      z: idx === 0 ? structureState.subjectLayer : clamp(2 + idx, 1, 20),
      color: idx === 0 ? "#b7c3ff" : "#9bb7ff",
      opacity: 1,
      kf: [
        { t: 0 as const, x, y, w: subjectSize, h: Math.round(subjectSize * 1.2), rot: 0 },
        { t: 1 as const, x, y, w: subjectSize, h: Math.round(subjectSize * 1.2), rot: 0 }
      ],
      notes: `role:${subject.role ?? "secondary"}; composition_focus:${structureState.compositionFocus}`,
      externalPrompt: "",
      referenceLinks: "",
      localRefs: [],
      referencePolicy: "optional" as const
    };
  });

  return sanitizeProject({
    project: {
      mode: "storyboard",
      mediaType: intentPlan.mediaType,
      shotPlan: intentPlan.mediaType === "video" ? "multicam" : "single"
    },
    scenes: [
      {
        id: "s1",
        name: sceneName,
        duration_s: intentPlan.mediaType === "video" ? 6 : 12,
        cameraPreset: intentPlan.camera.shotType ?? "medium",
        layoutLocked: false,
        inheritFromPrevious: false,
        inheritBgRefFromPrevious: false,
        inheritObjectRefsFromPrevious: "off",
        transitionType: "cut",
        camera: {
          shot: intentPlan.camera.shotType ?? "medium",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: {
          time: intentPlan.scene.timeOfDay ?? "",
          key_dir: intentPlan.camera.angle ?? "",
          mood: intentPlan.style.mood ?? ""
        },
        layers,
        config: {
          mediaMode: intentPlan.mediaType,
          compiler: intentPlan.mediaType === "video" ? "v2" : "v1",
          sceneTier: "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: [
          `media: ${intentPlan.mediaType}`,
          `goal: ${intentPlan.goal}`,
          `ratio: ${intentPlan.ratio}`,
          `location: ${intentPlan.scene.location ?? ""}`,
          `framing: ${intentPlan.camera.framing ?? "center"}`,
          `background_density: ${intentPlan.scene.backgroundDensity ?? "normal"}`,
          `primary_weight: ${intentPlan.composition?.primarySubjectWeight ?? ""}`,
          `primary_scale: ${intentPlan.composition?.subjectScalePreference ?? ""}`,
          `primary_depth: ${intentPlan.composition?.primaryDepth ?? ""}`,
          `composition_focus:${structureState.compositionFocus}`,
          ...intentPlan.constraints,
          ...(intentPlan.hardConstraints ?? []),
          ...intentPlan.editHints
        ].filter(Boolean).join("\n")
      }
    ]
  });
}

export function intentPlanToProProject(intentPlan: IntentPlan, structureState: ResultStructureState, lang: Lang): Project {
  const canvas = intentPlan.canvas;
  if (canvas?.mediaType === "image") return imageProjectFromCanvas(intentPlan, structureState, lang, canvas);
  if (canvas?.mediaType === "video") return videoProjectFromCanvas(intentPlan, structureState, lang, canvas);
  return fallbackProject(intentPlan, structureState, lang);
}
