import { writeFileSync, mkdirSync } from "node:fs";
import { buildShotModel } from "../src/shot-model/buildShotModel";
import { describeShot } from "../src/shot-model/describeShot";
import { generatePrompts } from "../src/utils/prompt";
import type { Project, Scene } from "../src/model";

function baseScene(id: string, name: string): Scene {
  return {
    id,
    name,
    duration_s: 4,
    camera: {
      shot: "medium",
      movement: "static",
      keyframes: [
        { t: 0, x: 50, y: 50, zoom: 1, rot: 0 },
        { t: 1, x: 50, y: 50, zoom: 1, rot: 0 }
      ]
    },
    lighting: { time: "day", key_dir: "top_left", mood: "cinematic" },
    layers: [],
    notes: "media: image"
  };
}

function layer(id: string, type: string, look: string, z: number, x0: number, y0: number, x1: number, y1: number, notes = "") {
  return {
    id,
    type,
    shape: "rect" as const,
    look,
    z,
    color: "#ffffff",
    opacity: 1,
    kf: [
      { t: 0 as const, x: x0, y: y0, w: 24, h: 24, rot: 0 },
      { t: 1 as const, x: x1, y: y1, w: 24, h: 24, rot: 0 }
    ],
    notes,
    externalPrompt: "",
    referenceLinks: ""
  };
}

function oldRouteApprox(scene: Scene) {
  return [
    `shot=${scene.camera.shot}`,
    `movement=${scene.camera.movement}`,
    `lighting=${scene.lighting.time}/${scene.lighting.key_dir}/${scene.lighting.mood}`,
    ...scene.layers.map((item) => `${item.id}:${item.type}@(${item.kf[0]?.x},${item.kf[0]?.y})->(${item.kf[1]?.x},${item.kf[1]?.y})`)
  ].join(" | ");
}

const sports = baseScene("sports_01", "Sports Freeze");
sports.camera.shot = "close";
sports.camera.movement = "fast_push";
sports.notes = ["media: image", "camera_language: cinematic_narrative", "no text", "bg: stadium at night"].join("\n");
sports.shotNote = "athlete jump kick peak frame";
sports.layers = [
  layer("athlete", "athlete", "sweat and rim light", 2, 46, 52, 46, 52, "freeze action beat"),
  layer("ball", "football", "motion trail", 3, 58, 42, 58, 42, "keep ball readable")
];

const product = baseScene("product_01", "Product Highlight");
product.camera.shot = "insert_closeup";
product.camera.movement = "static";
product.notes = ["media: image", "director_pack: commercial_spectacle", "image_classic_mode: premium_product", "bg: dark studio"].join("\n");
product.shotNote = "single hero bottle with premium highlights";
product.layers = [
  layer("hero_product", "glass bottle", "micro scratches and glossy edge", 3, 50, 54, 50, 54, "center hero"),
  layer("support_surface", "pedestal", "matte black", 1, 50, 72, 50, 72, "stable base")
];

const cinematicA = baseScene("cinematic_01", "Cinematic Atmosphere A");
cinematicA.camera.shot = "wide";
cinematicA.camera.movement = "slow_push_in";
cinematicA.duration_s = 5;
cinematicA.notes = ["media: video", "video_classic_mode: suspense_watch", "director_pack: architectural_tension", "bg: abandoned corridor"].join("\n");
cinematicA.shotNote = "character enters corridor and scans surroundings";
cinematicA.entryDir = "W";
cinematicA.exitDir = "E";
cinematicA.layers = [
  layer("lead", "detective", "wet coat silhouette", 3, 24, 56, 44, 55, "walk forward"),
  layer("corridor", "environment", "long depth with fog", 0, 50, 50, 50, 50, "keep geometry")
];

const projectSports: Project = { project: { mode: "storyboard", mediaType: "image", shotPlan: "single" }, scenes: [sports] };
const projectProduct: Project = { project: { mode: "storyboard", mediaType: "image", shotPlan: "single" }, scenes: [product] };
const projectCinematic: Project = { project: { mode: "storyboard", mediaType: "video", shotPlan: "continuous" }, scenes: [cinematicA], continuity: { enabled: true, cameraCarryOver: true, characterCarryOver: true, directionCarryOver: true } };

const cases = [
  { id: "benchmark_1_sports_action_freeze", project: projectSports, scene: sports },
  { id: "benchmark_2_product_highlight", project: projectProduct, scene: product },
  { id: "benchmark_3_cinematic_space_atmosphere", project: projectCinematic, scene: cinematicA }
].map((item) => {
  const shotModel = buildShotModel({ project: item.project, scene: item.scene, sceneIndex: 0 });
  const description = describeShot(shotModel, "en");
  const finalPrompt = generatePrompts(item.project, "en", "universal");
  return {
    id: item.id,
    rawFieldInput: {
      scene: item.scene,
      notes: item.scene.notes,
      layers: item.scene.layers.map((l) => ({
        id: l.id,
        type: l.type,
        look: l.look,
        notes: l.notes,
        externalPrompt: l.externalPrompt,
        kf: l.kf
      }))
    },
    shotModel,
    shotDescription: description,
    finalPrompt,
    oldRouteApprox: oldRouteApprox(item.scene),
    improvementHint: "new chain expresses subject-camera-space constraints in ordered visual language instead of flat field serialization"
  };
});

mkdirSync("/Users/dk/scene-pilot/artifacts/shot-benchmark", { recursive: true });
writeFileSync(
  "/Users/dk/scene-pilot/artifacts/shot-benchmark/benchmark-results.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      chain: "Template Fields -> Shot Model -> Shot Description -> Prompt Engine -> Final Prompt",
      cases
    },
    null,
    2
  )
);

console.log("wrote artifacts/shot-benchmark/benchmark-results.json");
