/**
 * Platform Mode View Model - read layer for Platform Mode panel.
 * Centralizes platform strategy derived from template, project, export settings.
 */

import type { Project } from "../model";
import type { PlatformPresetId } from "../config/platformPresets";
import type { ExportMode } from "./exportViewModel";

export type StructureIntensity = "soft" | "balanced" | "strong";
export type ExportMethodDisplay = "prompt_only" | "prompt_reference" | "prompt_structure";

export type PlatformModeViewModel = {
  currentPlatformTarget: PlatformPresetId;
  recommendedPlatforms: PlatformPresetId[];
  exportMethod: ExportMethodDisplay;
  exportModeRaw: ExportMode;
  structureIntensity: StructureIntensity;
  coordinateStrength: "off" | "light" | "full";
  needsReferenceImage: boolean;
  suppressCoordinateLiteral: boolean;
  prefersNaturalLanguageCamera: boolean;
  notesZh: string;
  notesEn: string;
};

const DEFAULT_PLATFORMS: PlatformPresetId[] = ["universal", "runway", "fal", "midjourney"];
const VIDEO_CONTINUITY_PLATFORMS: PlatformPresetId[] = ["runway", "fal", "vidu", "jimeng"];
const IMAGE_PRODUCT_PLATFORMS: PlatformPresetId[] = ["midjourney", "jimeng", "krea", "wanx"];
const ANIME_PLATFORMS: PlatformPresetId[] = ["runway", "fal", "vidu"];

function recommendPlatformsFromTemplate(project: Project): PlatformPresetId[] {
  const domain = project.meta?.currentTemplate?.domain ?? "";
  const category = project.meta?.currentTemplate?.category ?? "";
  const mediaType = project.project?.mediaType ?? "video";

  if (domain === "webdrama_continuity" || domain === "anime_continuity") {
    return mediaType === "video" ? VIDEO_CONTINUITY_PLATFORMS : DEFAULT_PLATFORMS;
  }
  if (category === "product" || category === "ad") {
    return mediaType === "image" ? IMAGE_PRODUCT_PLATFORMS : DEFAULT_PLATFORMS;
  }
  if (domain === "anime_continuity") {
    return ANIME_PLATFORMS;
  }

  return DEFAULT_PLATFORMS;
}

function deriveStructureIntensity(project: Project): StructureIntensity {
  const shotPlan = project.project?.shotPlan ?? "single";
  const sceneCount = project.scenes?.length ?? 1;
  const hasTemplate = Boolean(project.meta?.currentTemplate);
  if (shotPlan === "continuous" && sceneCount > 1 && hasTemplate) return "strong";
  if (sceneCount > 1 || hasTemplate) return "balanced";
  return "soft";
}

function deriveNeedsReference(project: Project): boolean {
  const totalRefs = (project.scenes ?? []).reduce(
    (sum, s) => sum + (s.layers ?? []).reduce((acc, l) => acc + (l.localRefs?.length ?? 0), 0),
    0
  );
  return totalRefs > 0;
}

export function buildPlatformModeViewModel(
  project: Project,
  currentPlatformId: PlatformPresetId,
  exportMode: ExportMode
): PlatformModeViewModel {
  const recommended = recommendPlatformsFromTemplate(project);
  const structureIntensity = deriveStructureIntensity(project);
  const needsRef = deriveNeedsReference(project);

  const exportMethod: ExportMethodDisplay =
    exportMode === "package"
      ? "prompt_reference"
      : structureIntensity === "strong"
        ? "prompt_structure"
        : "prompt_only";

  const coordinateStrength: "off" | "light" | "full" =
    structureIntensity === "soft" ? "off" : structureIntensity === "balanced" ? "light" : "full";

  const suppressCoordinateLiteral = structureIntensity === "soft";
  const prefersNaturalLanguageCamera = structureIntensity !== "strong";

  const notesParts: string[] = [];
  if (project.meta?.currentTemplate) {
    notesParts.push(
      `Template: ${project.meta.currentTemplate.titleEn || project.meta.currentTemplate.titleZh}`
    );
  }
  if (needsRef) {
    notesParts.push("Reference images recommended");
  }

  return {
    currentPlatformTarget: currentPlatformId,
    recommendedPlatforms: recommended,
    exportMethod,
    exportModeRaw: exportMode,
    structureIntensity,
    coordinateStrength,
    needsReferenceImage: needsRef,
    suppressCoordinateLiteral,
    prefersNaturalLanguageCamera,
    notesZh: notesParts.join("; "),
    notesEn: notesParts.join("; ")
  };
}
