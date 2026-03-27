import { editorTheme } from "../../../theme/editorTheme";

/**
 * Template workspace visual baseline.
 * Mirrors `src/design-reference/figma/app.tsx` colors and compact control rhythm.
 */

export const TEMPLATE_WORKSPACE_UI = {
  colors: {
    bg: editorTheme.colors.bg,
    panel: editorTheme.colors.panel,
    border: editorTheme.colors.border,
    hover: editorTheme.colors.hover,
    buttonBase: "#2e333b",
    buttonBorder: "#4b515b",
    buttonHover: "#353a42",
    text: editorTheme.colors.text,
    textMuted: editorTheme.colors.textMuted,
    textDim: "#6b7280",
    accent: editorTheme.colors.accent,
    accentHover: editorTheme.colors.accentHover,
    accentSoft: "rgba(245,158,11,0.10)",
    accentBorder: "rgba(245,158,11,0.30)",
    green: "#10b981",
    greenSoft: "rgba(16,185,129,0.10)",
  },
  radius: {
    sm: editorTheme.radius.input,
    md: editorTheme.radius.panel,
    lg: editorTheme.radius.panel,
  },
  fontSize: {
    body: 12,
    label: 11,
    caption: 10,
  },
  lineHeight: {
    compact: 1.2,
    normal: 1.4,
    relaxed: 1.55,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: editorTheme.spacing.inputPaddingX,
    lg: editorTheme.spacing.fieldMarginBottom,
  },
  controlHeight: {
    sm: editorTheme.sizing.controlHeight,
    md: editorTheme.sizing.controlHeight,
    lg: 50,
  },
} as const;
