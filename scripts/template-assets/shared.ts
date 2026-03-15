/**
 * Template Asset Pipeline v1 - Shared helpers
 * Reuses existing buildPromptForScene, applyPayloadToProject, loadTemplatePayloadById
 */

import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import type { Project, Scene } from "../../src/model";
import type { TemplateIndex } from "../../src/template-engine/types/templateIndex";
import { getTemplateIndex, getTemplateIndexById } from "../../src/template-engine/index/templateIndexData";
import { loadTemplatePayloadById } from "../../src/template-engine/payload/templateLoader";
import { applyPayloadToProject } from "../../src/template-engine/apply/applyPayload";
import { buildPromptForScene } from "../../src/utils/promptEngine";
import { getPlatformPreset } from "../../src/config/platformPresets";
import type { PlatformPresetId } from "../../src/config/platformPresets";

export type AssetManifestEntry = {
  templateId: string;
  familyId: string;
  variantId: string;
  mediaType: "image" | "video";
  platformId: string;
  engineId?: string;
  promptHash?: string;
  promptText?: string;
  assetPath?: string;
  thumbnailPath?: string;
  firstFramePath?: string;
  status: "pending" | "success" | "failed" | "skipped";
  retryCount: number;
  score?: number;
  selected?: boolean;
  rejected?: boolean;
  error?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
};

export function createEmptyProject(): Project {
  return {
    project: { mode: "storyboard", mediaType: "image", shotPlan: "single" },
    scenes: [],
    meta: {},
  };
}

export async function buildProjectAndPrompt(
  templateId: string,
  platformId: PlatformPresetId,
  lang: "zh" | "en" = "en"
): Promise<{
  project: Project;
  scene: Scene;
  prompt: string;
  engineId?: string;
  mediaType: "image" | "video";
} | null> {
  const index = getTemplateIndexById(templateId);
  if (!index) return null;

  const payload = await loadTemplatePayloadById(templateId);
  if (!payload || !payload.scenes?.length) return null;

  const emptyProject = createEmptyProject();
  const result = applyPayloadToProject(payload, emptyProject, false, "layout_plus_style");
  if (!result.success || !result.appliedProject?.scenes?.length) return null;

  const project = result.appliedProject;
  const scene = project.scenes[0];
  const preset = getPlatformPreset(platformId);
  const output = buildPromptForScene({
    project: { ...project, meta: { ...project.meta, currentTemplate: { templateId, familyId: index.familyId, familyNameZh: index.familyNameZh ?? "", familyNameEn: index.familyNameEn ?? "", variantId: index.variantId, titleZh: index.nameZh ?? "", titleEn: index.nameEn ?? "", category: index.category ?? "", domain: index.domain ?? "", tier: "", cost: index.cost ?? 0, isFree: index.isFree ?? false, applyMode: "layout_plus_style" } } },
    scene,
    lang,
    platformId,
    profile: preset?.baseProfile,
    workspace: "pro",
  });

  const prompt = output.finalCopyPrompt?.trim() ?? "";
  return {
    project,
    scene,
    prompt,
    engineId: output.metadata?.engineId,
    mediaType: index.mediaType ?? (scene.config?.mediaMode ?? "image"),
  };
}

export function getTemplateList(): TemplateIndex[] {
  return getTemplateIndex();
}

export function selectPhaseATemplates(): { image: string[]; video: string[] } {
  const all = getTemplateList();
  const image: string[] = [];
  const video: string[] = [];

  const imageFamilies = [
    "product_hero",
    "product_center_display",
    "product_compare",
    "center_composition",
    "symmetry_composition",
    "selling_point_ad",
    "social_vertical_ad",
  ];
  const videoFamilies = ["solo_speaker", "dialogue_duo", "opening_shot", "push_in_motion", "character_entrance"];

  for (const t of all) {
    if (t.mediaType === "image" && imageFamilies.includes(t.familyId) && image.length < 10) {
      image.push(t.id);
    }
    if (t.mediaType === "video" && videoFamilies.includes(t.familyId) && video.length < 3) {
      video.push(t.id);
    }
  }
  return { image, video };
}

export async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

export async function saveJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function loadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}
