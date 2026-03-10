import type { Lang } from "../i18n";
import type { Scene } from "../model";
import { parseProMotionSelection } from "../content/proCameraPresets";

export type EffectiveMotionSource = "pro_motion" | "camera_movement" | "none";

export type EffectiveMotionResult = {
  source: EffectiveMotionSource;
  cameraMovementDisabled: boolean;
  movementValue: string;
};

function clean(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export function resolveEffectiveMotion(scene: Scene): EffectiveMotionResult {
  const selection = parseProMotionSelection(scene.notes ?? "");
  const hasProMotion = Boolean(selection.basicId) || selection.proPlusIds.length > 0;
  const movementValue = clean((scene.camera as any)?.movement);

  if (hasProMotion) {
    return {
      source: "pro_motion",
      cameraMovementDisabled: true,
      movementValue: ""
    };
  }
  if (movementValue) {
    return {
      source: "camera_movement",
      cameraMovementDisabled: false,
      movementValue
    };
  }
  return {
    source: "none",
    cameraMovementDisabled: false,
    movementValue: ""
  };
}

export function effectiveMotionHint(lang: Lang, source: EffectiveMotionSource) {
  if (source !== "pro_motion") return "";
  return lang === "zh" ? "已由 Pro 运镜指令集接管" : "Controlled by Pro Motion Library";
}

