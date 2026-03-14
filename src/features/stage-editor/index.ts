/**
 * Stage Editor - guards, actions, object state for Pro Stage.
 */

export { getStageObjectState, writeLayoutLocked } from "./guards/stageObjectState";
export type { StageObjectState, StageObjectStateLabel } from "./guards/stageObjectState";
export { stageActionGuard } from "./guards/stageActionGuard";
export type { GuardResult, StageActionKind } from "./guards/stageActionGuard";
export { resolveWorkBarCapabilities } from "./guards/stageCapabilityResolver";
export type { WorkBarActionId, WorkBarActionCapability } from "./guards/stageCapabilityResolver";
export { stageResetTransform } from "./actions/stageResetTransform";
export { stageCopyT0ToT1 } from "./actions/stageCopyKeyframe";
export { stageToggleLock } from "./actions/stageToggleLock";
export { stageCenterObject } from "./actions/stageCenterObject";
