/**
 * Grid rendering strategy for template workspace.
 * Reserved for 1000+ template scaling.
 */

/** Above this count, consider switching to virtualized rendering. */
export const GRID_VIRTUALIZATION_THRESHOLD = 400;

export type GridRenderStrategy = "normal" | "virtual";
