/**
 * Pro Workspace UI v1 - Constants aligned with Figma design reference
 * Single source of truth for layout, spacing, colors across Template/Pro/Rule/Prompt/Export/Platform
 */

import { editorSizing } from "../../theme/editorTheme";

export const PRO_NAV_WIDTH = editorSizing.navWidth;
export const PRO_RAIL_WIDTH = editorSizing.railWidth;
export const PRO_HEADER_HEIGHT = 48;
export const PRO_PANEL_PADDING = 16;
export const PRO_SECTION_GAP = 12;
export const PRO_FIELD_GAP = 8;
export const PRO_BOTTOM_BAR_PADDING = 16;
export const PRO_CONTROL_HEIGHT = 28;
/** Canvas grid unit (Figma 40px) - used for layout alignment */
export const PRO_CANVAS_GRID_UNIT = 40;
/** Bottom panel / prompt area height (canvas +2 grid units for composition mode) */
export const PRO_BOTTOM_PANEL_HEIGHT = 280;

export const FIGMA_COLORS = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b",
  accentHover: "#d97706",
} as const;
