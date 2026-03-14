/**
 * Pro 工作台视觉主题
 */

export const editorColors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b",
  accentHover: "#d97706",
  accentSoft: "rgba(245, 158, 11, 0.1)",
  danger: "#c96b6b",
} as const;

export const editorSpacing = {
  sectionHeaderX: 12,
  sectionHeaderY: 8,
  sectionBodyX: 12,
  sectionBodyTop: 4,
  sectionBodyBottom: 12,
  fieldMarginBottom: 12,
  labelToControl: 4,
  inputPaddingX: 10,
  inputPaddingY: 6,
  selectPaddingX: 10,
  selectPaddingY: 6,
  panelPadding: 16,
} as const;

export const editorRadius = {
  input: 12,
  panel: 14,
  button: 12,
  chip: 10,
} as const;

export const editorTypography = {
  sectionTitleSize: 12,
  sectionTitleWeight: 600,
  labelSize: 11,
  labelWeight: 500,
  bodySize: 12,
  bodyWeight: 500,
  hintSize: 10,
} as const;

export const editorSizing = {
  controlHeight: 28,
  sectionHeaderHeight: 32,
  chevronSize: 14,
  selectArrowSize: 12,
} as const;

export const editorTransition = {
  duration: 200,
  easing: "ease-in-out",
} as const;

export const editorTheme = {
  colors: editorColors,
  typography: editorTypography,
  sizing: editorSizing,
  spacing: editorSpacing,
  radius: editorRadius,
  transition: editorTransition,
} as const;
