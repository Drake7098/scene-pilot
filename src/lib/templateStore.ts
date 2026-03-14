import type { Scene } from "../model";
import type { SceneTemplate } from "../model/template";
import { builtinTemplates } from "../data/builtinTemplates";

const STORAGE_KEY = "scenepilot_user_templates_v1";

function loadUserTemplates(): SceneTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserTemplates(templates: SceneTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

function nextId(prefix: string, exists: (id: string) => boolean): string {
  for (let i = 1; i < 99999; i++) {
    const id = `${prefix}${i}`;
    if (!exists(id)) return id;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function regenerateSceneIds(scene: Scene, sceneIdExists: (id: string) => boolean, layerIdExists: (id: string) => boolean): Scene {
  const newSceneId = nextId("s", sceneIdExists);
  const layerIdMap = new Map<string, string>();
  const layers = (scene.layers ?? []).map((l) => {
    const newId = nextId("layer", (id) => layerIdExists(id) || Array.from(layerIdMap.values()).includes(id));
    layerIdMap.set(l.id, newId);
    return { ...l, id: newId };
  });

  return {
    ...JSON.parse(JSON.stringify(scene)),
    id: newSceneId,
    name: scene.name,
    layers
  };
}

/** @deprecated 主流程已用 template-engine index。仅历史兼容。 */
export function listBuiltinTemplates(): SceneTemplate[] {
  return [...builtinTemplates];
}

export function listUserTemplates(): SceneTemplate[] {
  return loadUserTemplates();
}

/** @deprecated 主流程已用 template-engine index。仅历史兼容。 */
export function getAllTemplates(): SceneTemplate[] {
  return [...builtinTemplates, ...loadUserTemplates()];
}

export function saveUserTemplate(template: SceneTemplate): void {
  const list = loadUserTemplates();
  const exists = list.findIndex((t) => t.id === template.id);
  const now = Date.now();
  const toSave: SceneTemplate = {
    ...template,
    isBuiltin: false,
    createdAt: exists >= 0 ? list[exists].createdAt : now,
    updatedAt: now
  };
  if (exists >= 0) {
    list[exists] = toSave;
  } else {
    list.push(toSave);
  }
  saveUserTemplates(list);
}

export function deleteUserTemplate(templateId: string): void {
  const list = loadUserTemplates().filter((t) => t.id !== templateId);
  saveUserTemplates(list);
}

export function duplicateTemplate(template: SceneTemplate): SceneTemplate {
  const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const clonedScene = JSON.parse(JSON.stringify(template.scene));
  return {
    ...template,
    id: newId,
    name: `${template.name} (Copy)`,
    isBuiltin: false,
    scene: clonedScene,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function createTemplateFromScene(
  scene: Scene,
  meta: { name: string; category: SceneTemplate["category"]; description?: string }
): SceneTemplate {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: meta.name,
    category: meta.category,
    description: meta.description,
    isBuiltin: false,
    isProOnly: false,
    tags: [],
    scene: JSON.parse(JSON.stringify(scene)),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/** @deprecated 主流程已用 ensureUniqueSceneIds。仅 applyTemplateSnapshot 使用，勿新调用。 */
export function cloneSceneFromTemplate(
  template: SceneTemplate,
  sceneIdExists: (id: string) => boolean,
  layerIdExists: (id: string) => boolean
): Scene {
  return regenerateSceneIds(template.scene, sceneIdExists, layerIdExists);
}

/**
 * Ensure scene and layer IDs are unique relative to existing scenes.
 * Used when applying TemplatePayload to avoid ID collisions.
 */
export function ensureUniqueSceneIds(
  scene: Scene,
  existingScenes: Scene[]
): Scene {
  const sceneIdExists = (id: string) =>
    existingScenes.some((s) => s.id === id);
  const layerIdExists = (id: string) =>
    existingScenes.some((s) => (s.layers ?? []).some((l) => l.id === id));
  return regenerateSceneIds(scene, sceneIdExists, layerIdExists);
}
