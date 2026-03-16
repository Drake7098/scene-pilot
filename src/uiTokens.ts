export const UI_TYPO = {
  size11: 11,
  size12: 12,
  size13: 13,
  size14: 14,
  size15: 15,
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
    surfaceMuted: "rgba(186,206,232,0.09)",
    surfaceAmber: "rgba(245,158,11,0.1)"
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
    dangerSoft: "rgba(255,124,124,0.18)",
    amber: "#f59e0b",
    amberHover: "#d97706",
    amberSoft: "rgba(245,158,11,0.15)",
    amberBorder: "rgba(245,158,11,0.55)"
  },
  shadow: {
    panel: "0 18px 48px rgba(2,6,14,0.42)",
    float: "0 14px 34px rgba(2,6,14,0.5)",
    hover: "0 12px 28px rgba(4,10,22,0.26)",
    press: "0 6px 14px rgba(4,10,22,0.22)",
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
  hoverShadow: UI_PALETTE.shadow.hover,
  pressShadow: UI_PALETTE.shadow.press,
  insetShadow: UI_PALETTE.shadow.inset,
  focusRing: UI_PALETTE.shadow.focus,
  softRing: "0 0 0 1px rgba(102,168,255,0.18) inset"
} as const;

export const UI_CONTROL = {
  bg: {
    default: "rgba(255,255,255,0.045)",
    hover: "rgba(255,255,255,0.075)",
    active: "rgba(255,255,255,0.032)",
    disabled: "rgba(255,255,255,0.022)",
    accent: "rgba(104,171,255,0.18)",
    accentHover: "rgba(104,171,255,0.24)",
    accentActive: "rgba(104,171,255,0.16)",
    danger: "rgba(255,124,124,0.14)"
  },
  border: {
    default: UI_PALETTE.border.default,
    hover: UI_PALETTE.border.strong,
    active: UI_PALETTE.border.active,
    disabled: "rgba(170,193,226,0.12)",
    danger: UI_PALETTE.border.danger
  },
  shadow: {
    soft: `${UI_PALETTE.shadow.inset}, 0 8px 18px rgba(3,8,18,0.14)`,
    hover: `${UI_PALETTE.shadow.inset}, ${UI_PALETTE.shadow.hover}`,
    float: `${UI_PALETTE.shadow.inset}, ${UI_PALETTE.shadow.float}`,
    active: `${UI_PALETTE.shadow.inset}, ${UI_PALETTE.shadow.press}`
  },
  ring: {
    focus: UI_PALETTE.shadow.focus
  },
  transition: {
    fast: "120ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    normal: "180ms cubic-bezier(0.2, 0.8, 0.2, 1)"
  }
} as const;

export const UI_PANEL = {
  frostBorder: "rgba(180,204,236,0.16)",
  leftGlass:
    "linear-gradient(180deg, rgba(18,26,40,0.9) 0%, rgba(16,24,37,0.94) 42%, rgba(13,21,33,0.98) 100%)",
  rightGlass:
    "linear-gradient(180deg, rgba(17,25,36,0.88) 0%, rgba(16,23,34,0.92) 46%, rgba(13,20,30,0.96) 100%)",
  leftGlow:
    "radial-gradient(560px 420px at 18% 88%, rgba(82,138,228,0.18), transparent 58%), radial-gradient(420px 260px at 84% 18%, rgba(64,182,194,0.11), transparent 56%)",
  rightGlow:
    "radial-gradient(520px 360px at 82% 18%, rgba(74,196,192,0.12), transparent 58%), radial-gradient(420px 260px at 24% 84%, rgba(104,171,255,0.12), transparent 56%)",
  surfaceNoise:
    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)"
} as const;

export const UI_INFO = {
  surface: {
    default: "linear-gradient(180deg, rgba(20,28,40,0.72) 0%, rgba(14,20,31,0.82) 100%)",
    subtle: "rgba(18,25,36,0.68)",
    elevated: "linear-gradient(180deg, rgba(22,31,46,0.78) 0%, rgba(15,22,34,0.86) 100%)"
  },
  border: {
    default: "rgba(176,198,228,0.14)",
    subtle: "rgba(176,198,228,0.1)"
  },
  text: {
    title: UI_PALETTE.text.primary,
    body: UI_PALETTE.text.secondary
  },
  accent: {
    soft: "rgba(104,171,255,0.12)"
  }
} as const;

export const UI_STATUS = {
  surface: {
    success: "rgba(76,186,128,0.12)",
    warn: "rgba(245,190,120,0.12)",
    info: "rgba(104,171,255,0.12)"
  },
  border: {
    success: "rgba(76,186,128,0.28)",
    warn: "rgba(245,190,120,0.28)",
    info: "rgba(104,171,255,0.28)"
  }
} as const;

export const UI_ACTION = {
  surface: {
    default: "linear-gradient(180deg, rgba(27,37,54,0.88) 0%, rgba(20,29,44,0.92) 100%)",
    hover: "linear-gradient(180deg, rgba(33,45,66,0.92) 0%, rgba(24,35,52,0.96) 100%)",
    active: "linear-gradient(180deg, rgba(23,32,47,0.94) 0%, rgba(18,26,39,0.98) 100%)"
  },
  border: {
    default: "rgba(120,170,240,0.44)",
    hover: "rgba(146,188,246,0.64)",
    active: "rgba(104,171,255,0.82)"
  },
  shadow: {
    hover: "0 12px 24px rgba(10,20,38,0.26), inset 0 1px 0 rgba(255,255,255,0.08)"
  }
} as const;

export const UI_COMMAND = {
  surface: {
    quiet: "rgba(255,255,255,0.028)",
    default: "rgba(255,255,255,0.046)",
    hover: "rgba(255,255,255,0.08)",
    active: "rgba(255,255,255,0.036)",
    accent: "linear-gradient(180deg, rgba(33,46,70,0.9) 0%, rgba(23,34,54,0.96) 100%)",
    accentHover: "linear-gradient(180deg, rgba(40,56,84,0.94) 0%, rgba(28,40,62,0.98) 100%)",
    accentActive: "linear-gradient(180deg, rgba(24,35,54,0.96) 0%, rgba(18,28,44,1) 100%)"
  },
  border: {
    default: "rgba(180,200,230,0.18)",
    hover: "rgba(204,220,245,0.3)",
    active: "rgba(104,171,255,0.68)",
    accent: "rgba(126,176,246,0.42)",
    accentHover: "rgba(146,188,246,0.62)",
    accentActive: "rgba(104,171,255,0.82)"
  },
  shadow: {
    soft: "0 1px 0 rgba(255,255,255,0.05) inset",
    hover: "0 1px 0 rgba(255,255,255,0.06) inset, 0 10px 24px rgba(4,10,22,0.18)",
    active: "0 1px 0 rgba(255,255,255,0.04) inset, 0 6px 14px rgba(4,10,22,0.16)"
  }
} as const;

export const UI_MENU = {
  width: 232,
  panel: {
    radius: 16,
    padding: 6,
    border: "rgba(188,208,236,0.18)",
    surface: "linear-gradient(180deg, rgba(27,31,40,0.98) 0%, rgba(18,22,30,0.98) 100%)",
    shadow: "0 24px 56px rgba(0,0,0,0.46)"
  },
  item: {
    radius: 12,
    minHeight: 40,
    padX: 10,
    gap: 10,
    fontSize: UI_TYPO.size13,
    iconSize: 15,
    hover: "rgba(115,176,255,0.18)",
    active: "rgba(115,176,255,0.26)",
    textSecondary: "rgba(197,210,231,0.68)"
  }
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

/** Pro workspace typography (zh/en unified) */
export const PRO_TYPO = {
  fontFamily: "var(--pro-font-family)",
  xs: 12,
  "2xs": 11,
  "3xs": 10,
  sm: 13,
  weightRegular: 500,
  weightMedium: 600,
  weightBold: 700
} as const;
