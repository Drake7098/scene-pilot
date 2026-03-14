/**
 * Convert UnifiedTemplate to SceneTemplate for applyTemplateSnapshot.
 */

import type { SceneTemplate } from "../model/template";
import type { UnifiedTemplate } from "../types/templateWorkspace";

const CATEGORY_MAP: Record<UnifiedTemplate["category"], SceneTemplate["category"]> = {
  product: "product",
  dialogue: "dialogue",
  ad: "ad",
  short_video: "short_video",
  social: "social",
  camera_move: "camera_move",
  composition: "custom",
  continuous: "custom",
  cover_poster: "custom"
};

export function unifiedTemplateToSceneTemplate(t: UnifiedTemplate): SceneTemplate {
  return {
    id: t.id,
    name: t.name,
    category: CATEGORY_MAP[t.category] ?? "custom",
    description: t.description,
    isBuiltin: true,
    isProOnly: !t.isFree,
    tags: t.tags,
    scene: JSON.parse(JSON.stringify(t.scene))
  };
}
