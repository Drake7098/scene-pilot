/**
 * Template workspace visual baseline.
 * Mirrors `src/design-reference/figma/app.tsx` colors and compact control rhythm.
 */

export const TEMPLATE_WORKSPACE_UI = {
  colors: {
    bg: "#1f2125",
    panel: "#24262b",
    border: "#3a3f46",
    hover: "#343942",
    buttonBase: "#2e333b",
    buttonBorder: "#4b515b",
    buttonHover: "#353a42",
    text: "#e5e7eb",
    textMuted: "#9ca3af",
    textDim: "#6b7280",
    accent: "#f59e0b",
    accentHover: "#d97706",
    accentSoft: "rgba(245,158,11,0.10)",
    accentBorder: "rgba(245,158,11,0.30)",
    green: "#10b981",
    greenSoft: "rgba(16,185,129,0.10)",
  },
  radius: {
    sm: 8,
    md: 10,
    lg: 14,
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
    md: 10,
    lg: 12,
  },
  controlHeight: {
    sm: 34,
    md: 36,
    lg: 50,
  },
} as const;
