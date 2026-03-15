/**
 * Help Center — shared styles (Stage 3).
 * Aligned with design-reference/figma/app.tsx: spacing, titles, buttons, sidebar selected, card border, radius, background.
 */

export const helpColors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b",
  accentHover: "#d97706"
} as const;

/** Sidebar: fixed width, group title + section tabs; selected = accent tint */
export const helpSidebarStyles = {
  wrap: {
    width: 200,
    minWidth: 200,
    flexShrink: 0,
    minHeight: 0,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    paddingRight: 8,
    borderRight: `1px solid ${helpColors.border}`,
    background: helpColors.panel
  },
  group: {
    marginBottom: 12
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: helpColors.textMuted,
    padding: "6px 10px 4px",
    marginBottom: 2
  },
  tab: {
    textAlign: "left" as const,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid transparent",
    background: "transparent",
    color: helpColors.text,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer" as const,
    width: "100%",
    transition: "background 0.15s, border-color 0.15s, color 0.15s"
  },
  tabHover: {
    background: helpColors.hover
  },
  tabActive: {
    border: `1px solid ${helpColors.accent}`,
    background: `${helpColors.accent}1a`,
    color: helpColors.accent
  }
} as const;

/** Panel: scrollable content area; section title + block cards */
export const helpPanelStyles = {
  wrap: {
    minHeight: 0,
    flex: 1,
    overflow: "auto" as const,
    padding: "12px 16px",
    background: helpColors.bg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: helpColors.text,
    marginBottom: 16
  },
  blockList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12
  },
  blockCard: {
    border: `1px solid ${helpColors.border}`,
    borderRadius: 8,
    background: helpColors.panel,
    padding: "12px 14px"
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: helpColors.text,
    marginBottom: 6
  },
  blockText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: helpColors.text,
    opacity: 0.94,
    whiteSpace: "pre-line" as const
  }
} as const;

/** FAQ + Feedback: feedback block after FAQ blocks */
export const helpFeedbackStyles = {
  block: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: `1px solid ${helpColors.border}`
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: helpColors.text,
    marginBottom: 8
  },
  channels: {
    fontSize: 12,
    color: helpColors.textMuted,
    lineHeight: 1.5,
    marginBottom: 10
  },
  templateBox: {
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${helpColors.border}`,
    background: "rgba(0,0,0,0.2)",
    marginBottom: 10
  },
  templateLine: {
    fontSize: 12,
    color: helpColors.text,
    opacity: 0.85,
    lineHeight: 1.5
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    resize: "vertical" as const,
    borderRadius: 8,
    border: `1px solid ${helpColors.border}`,
    background: "rgba(0,0,0,0.25)",
    color: helpColors.text,
    padding: "10px 12px",
    fontSize: 12,
    lineHeight: 1.5,
    outline: "none"
  },
  btns: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap" as const,
    marginTop: 12
  },
  btnGhost: {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${helpColors.border}`,
    background: helpColors.panel,
    color: helpColors.text,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700
  },
  btnPrimary: {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${helpColors.accent}`,
    background: helpColors.accent,
    color: helpColors.bg,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700
  }
} as const;

/** Modal: mask + container (width 880–980, maxHeight 85vh) */
export const helpModalStyles = {
  mask: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    borderRadius: 12,
    border: `1px solid ${helpColors.border}`,
    background: helpColors.panel,
    boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
    padding: 14,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    width: "min(980px, calc(100vw - 32px))",
    maxHeight: "85vh"
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexShrink: 0
  },
  headTitle: {
    fontWeight: 800,
    fontSize: 14,
    color: helpColors.text
  },
  iconBtn: {
    height: 30,
    width: 30,
    borderRadius: 8,
    border: `1px solid ${helpColors.border}`,
    background: helpColors.bg,
    color: helpColors.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    marginTop: 10,
    display: "flex",
    flex: 1,
    minHeight: 0,
    overflow: "hidden"
  }
} as const;
