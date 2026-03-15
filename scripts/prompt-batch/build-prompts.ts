/**
 * Prompt Batch Test v1 - Build single prompt from template
 * Reuses: loadTemplatePayloadById, applyPayloadToProject, buildPromptForScene
 */

import type { Project } from "../../src/model";
import { getTemplateIndexById, getTemplateIndex } from "../../src/template-engine/index/templateIndexData";
import { loadTemplatePayloadById } from "../../src/template-engine/payload/templateLoader";
import { applyPayloadToProject } from "../../src/template-engine/apply/applyPayload";
import { buildPromptForScene } from "../../src/utils/promptEngine";
import { getPlatformPreset } from "../../src/config/platformPresets";
import type { PlatformPresetId } from "../../src/config/platformPresets";
import type { ApplyTemplateMode } from "../../src/template-engine/types/filter";

function createEmptyProject(): Project {
  return {
    project: { mode: "storyboard", mediaType: "image", shotPlan: "single" },
    scenes: [],
    meta: {},
  };
}

export type BuildPromptResult = {
  templateId: string;
  familyId: string;
  variantId: string;
  applyMode: ApplyTemplateMode;
  platformId: string;
  engineId?: string;
  mediaMode: "image" | "video";
  prompt: string;
  length: number;
  status: "ok" | "fail";
  error?: string;
};

export async function buildPromptFromTemplate(
  templateId: string,
  platformId: PlatformPresetId,
  applyMode: ApplyTemplateMode,
  lang: "zh" | "en" = "en"
): Promise<BuildPromptResult> {
  const index = getTemplateIndexById(templateId);
  if (!index) {
    return {
      templateId,
      familyId: "",
      variantId: "",
      applyMode,
      platformId,
      mediaMode: "image",
      prompt: "",
      length: 0,
      status: "fail",
      error: "template_not_found",
    };
  }

  try {
    const payload = await loadTemplatePayloadById(templateId);
    if (!payload || !payload.scenes?.length) {
      return {
        templateId,
        familyId: index.familyId,
        variantId: index.variantId ?? "",
        applyMode,
        platformId,
        mediaMode: (index.mediaType as "image" | "video") ?? "image",
        prompt: "",
        length: 0,
        status: "fail",
        error: "payload_empty",
      };
    }

    const emptyProject = createEmptyProject();
    const result = applyPayloadToProject(payload, emptyProject, false, applyMode);
    if (!result.success || !result.appliedProject?.scenes?.length) {
      return {
        templateId,
        familyId: index.familyId,
        variantId: index.variantId ?? "",
        applyMode,
        platformId,
        mediaMode: (index.mediaType as "image" | "video") ?? "image",
        prompt: "",
        length: 0,
        status: "fail",
        error: "apply_failed",
      };
    }

    const project = result.appliedProject;
    const scene = project.scenes[0];
    const preset = getPlatformPreset(platformId as PlatformPresetId);
    const output = buildPromptForScene({
      project: {
        ...project,
        meta: {
          ...project.meta,
          currentTemplate: {
            templateId,
            familyId: index.familyId,
            familyNameZh: index.familyNameZh ?? "",
            familyNameEn: index.familyNameEn ?? "",
            variantId: index.variantId ?? "",
            titleZh: index.nameZh ?? "",
            titleEn: index.nameEn ?? "",
            category: index.category ?? "",
            domain: index.domain ?? "",
            tier: "",
            cost: index.cost ?? 0,
            isFree: index.isFree ?? false,
            applyMode,
          },
        },
      },
      scene,
      lang,
      platformId: platformId as PlatformPresetId,
      profile: preset?.baseProfile,
      workspace: "pro",
    });

    const prompt = output.finalCopyPrompt?.trim() ?? "";
    return {
      templateId,
      familyId: index.familyId,
      variantId: index.variantId ?? "",
      applyMode,
      platformId,
      engineId: output.metadata?.engineId,
      mediaMode: (index.mediaType as "image" | "video") ?? (scene.config?.mediaMode ?? "image"),
      prompt,
      length: prompt.length,
      status: "ok",
    };
  } catch (e) {
    return {
      templateId,
      familyId: index.familyId,
      variantId: index.variantId ?? "",
      applyMode,
      platformId,
      mediaMode: (index.mediaType as "image" | "video") ?? "image",
      prompt: "",
      length: 0,
      status: "fail",
      error: String(e instanceof Error ? e.message : e),
    };
  }
}

export function getTemplateIds(mediaFilter: "image" | "video" | "all" = "all"): string[] {
  const all = getTemplateIndex();
  if (mediaFilter === "all") return all.map((t) => t.id);
  return all.filter((t) => t.mediaType === mediaFilter).map((t) => t.id);
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
