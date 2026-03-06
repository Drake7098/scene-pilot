export const UI_TYPO = {
  size11: 11,
  size12: 12,
  size13: 13,
  size14: 14,
  size16: 16
} as const;

export const UI_FONT = {
  title: UI_TYPO.size13,
  section: UI_TYPO.size13,
  body: UI_TYPO.size12,
  hint: UI_TYPO.size12,
  tiny: UI_TYPO.size11
} as const;

export const UI_RADIUS = {
  panel: 16,
  control: 12,
  chip: 999
} as const;

export const UI_SPACE = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32
} as const;

export const UI_PALETTE = {
  bg: {
    app: "#0a0d14",
    toolbar: "rgba(16,22,34,0.76)",
    sidebar: "rgba(14,19,30,0.72)",
    inspector: "rgba(13,18,29,0.78)",
    canvas: "rgba(9,13,24,0.72)",
    overlay: "rgba(8,10,18,0.7)"
  },
  surface: {
    surface1: "rgba(255,255,255,0.035)",
    surface2: "rgba(255,255,255,0.06)",
    surfaceActive: "rgba(102,168,255,0.18)",
    surfaceMuted: "rgba(186,206,232,0.09)"
  },
  text: {
    primary: "rgba(237,243,252,0.96)",
    secondary: "rgba(197,210,231,0.82)",
    tertiary: "rgba(154,171,198,0.66)",
    inverse: "rgba(11,15,24,0.94)"
  },
  border: {
    default: "rgba(170,193,226,0.24)",
    soft: "rgba(170,193,226,0.16)",
    strong: "rgba(204,220,245,0.38)",
    active: "rgba(104,171,255,0.86)",
    danger: "rgba(255,124,124,0.72)"
  },
  accent: {
    coldBlue: "rgba(104,171,255,0.86)",
    cyan: "rgba(88,202,218,0.78)",
    coldBlueSoft: "rgba(104,171,255,0.18)",
    dangerSoft: "rgba(255,124,124,0.18)"
  },
  shadow: {
    panel: "0 18px 48px rgba(2,6,14,0.42)",
    float: "0 14px 34px rgba(2,6,14,0.5)",
    inset: "0 1px 0 rgba(255,255,255,0.06) inset",
    focus: "0 0 0 2px rgba(102,168,255,0.34)"
  }
} as const;

export const UI_COLOR = {
  text: UI_PALETTE.text.primary,
  textMuted: UI_PALETTE.text.secondary,
  bgBase: UI_PALETTE.bg.app,
  bgPanel: UI_PALETTE.bg.sidebar,
  bgPanelStrong: "rgba(12,17,27,0.92)",
  bgInput: "rgba(10,14,24,0.82)",
  surface: UI_PALETTE.surface.surface1,
  surfaceStrong: UI_PALETTE.surface.surface2,
  border: UI_PALETTE.border.default,
  borderSoft: UI_PALETTE.border.soft,
  accent: UI_PALETTE.accent.coldBlue,
  accentSoft: UI_PALETTE.accent.coldBlueSoft,
  danger: UI_PALETTE.border.danger,
  dangerSoft: UI_PALETTE.accent.dangerSoft
} as const;

export const UI_EFFECT = {
  panelShadow: UI_PALETTE.shadow.panel,
  floatShadow: UI_PALETTE.shadow.float,
  insetShadow: UI_PALETTE.shadow.inset,
  focusRing: UI_PALETTE.shadow.focus,
  softRing: "0 0 0 1px rgba(102,168,255,0.18) inset"
} as const;

export const UI_SIZE = {
  controlH: 34,
  compactH: 30,
  controlRadius: UI_RADIUS.control,
  compactRadius: 10,
  labelWSidebar: 88,
  labelWProps: 92,
  labelWExport: 84,
  labelWSmall: 62,
  labelWKf: 40
} as const;

export const UI_OPACITY = {
  title: 0.94,
  label: 0.78,
  hint: 0.72
} as const;
