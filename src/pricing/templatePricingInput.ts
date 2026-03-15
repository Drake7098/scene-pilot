/**
 * Build TemplatePricingInput from various sources (payload, single scene).
 * No schema/engine changes.
 */

import type { Scene } from "../model";
import type { TemplatePayload, TemplateSceneSnapshot } from "../template-engine/types/templatePayload";
import type { SceneLikeForPricing, TemplatePricingInput } from "./templatePricingTypes";

function isSceneLike(raw: unknown): raw is Scene {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.notes === "string" &&
    typeof o.camera === "object" &&
    o.camera !== null
  );
}

function snapshotToSceneLike(snapshot: TemplateSceneSnapshot): SceneLikeForPricing {
  const raw = snapshot.raw;
  if (isSceneLike(raw)) {
    return {
      camera: raw.camera,
      lighting: raw.lighting,
      transitionType: raw.transitionType,
      entryDir: raw.entryDir,
      exitDir: raw.exitDir,
      inheritFromPrevious: raw.inheritFromPrevious,
      notes: raw.notes,
      config: raw.config
    };
  }
  const notesParts: string[] = [];
  if (snapshot.directorStylePack) notesParts.push(`director_pack: ${snapshot.directorStylePack}`);
  if (snapshot.cameraLanguage) notesParts.push(`camera_language: ${snapshot.cameraLanguage}`);
  if (snapshot.imageProEffects) notesParts.push(`image_pro_effects: ${snapshot.imageProEffects}`);
  if (snapshot.classicShot) notesParts.push(`image_classic_mode: ${snapshot.classicShot}`);
  if (snapshot.classicMotion) notesParts.push(`video_classic_mode: ${snapshot.classicMotion}`);
  const notes = notesParts.join("\n");

  return {
    camera: {
      shot: snapshot.classicShot ?? "",
      movement: snapshot.classicMotion ?? ""
    },
    lighting: { time: "", key_dir: "", mood: "" },
    transitionType: undefined,
    entryDir: snapshot.entryDirection as SceneLikeForPricing["entryDir"],
    exitDir: snapshot.exitDirection as SceneLikeForPricing["exitDir"],
    inheritFromPrevious: undefined,
    notes,
    config: undefined
  };
}

/** Build pricing input from template payload (e.g. loaded by loadTemplatePayloadById). */
export function payloadToPricingInput(payload: TemplatePayload): TemplatePricingInput {
  const scenes = (payload.scenes ?? []).map(snapshotToSceneLike);
  const storyPlan = payload.projectDefaults?.storyPlan;
  return {
    scenes,
    storyPlan,
    projectShotPlan: undefined
  };
}

/** Build pricing input from a single Scene (e.g. UnifiedTemplate.scene). */
export function sceneToPricingInput(scene: Scene): TemplatePricingInput {
  return {
    scenes: [
      {
        camera: scene.camera,
        lighting: scene.lighting,
        transitionType: scene.transitionType,
        entryDir: scene.entryDir,
        exitDir: scene.exitDir,
        inheritFromPrevious: scene.inheritFromPrevious,
        notes: scene.notes,
        config: scene.config
      }
    ],
    storyPlan: undefined,
    projectShotPlan: undefined
  };
}
