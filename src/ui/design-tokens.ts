/**
 * UI Design Tokens - from figmaUI design system
 * Based on shadcn/ui theme with ScenePilot customizations
 */

// Color palette from figmaUI (dark theme optimized)
export const colors = {
  // Background colors
  background: '#1f2125',
  backgroundPanel: '#24262b',
  backgroundHover: '#2e333b',
  
  // Border colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderHover: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#f59e0b',
  
  // Text colors
  textPrimary: '#e5e7eb',
  textSecondary: '#9ca3af',
  textMuted: 'rgba(143, 143, 150, 0.8)',
  
  // Accent colors
  accent: '#f59e0b',
  accentHover: '#d97706',
  accentSoft: 'rgba(245, 158, 11, 0.1)',
  
  // Functional colors
  destructive: '#ef4444',
  destructiveHover: '#dc2626',
  success: '#22c55e',
  warning: '#f59e0b',
  
  // Input colors
  input: 'transparent',
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Ring color (focus states)
  ring: 'rgba(245, 158, 11, 0.3)',
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: '"SF Pro Text", "Avenir Next", "Segoe UI", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Consolas", "Menlo", monospace',
  },
  fontSize: {
    xs: '0.6875rem',    // 11px
    sm: '0.75rem',      // 12px
    base: '0.8125rem',  // 13px
    lg: '0.875rem',     // 14px
    xl: '1rem',         // 16px
    '2xl': '1.125rem',  // 18px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

// Spacing
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
} as const;

// Border radius
export const radius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  full: '9999px',
} as const;

export const radiusValue = '0.625rem' // 10px base radius

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
} as const;

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Component-specific tokens
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.25rem',   // 36px
      lg: '2.5rem',    // 40px
    },
    padding: {
      sm: '0 0.75rem',
      md: '0 1rem',
      lg: '0 1.5rem',
    },
  },
  input: {
    height: '2.25rem', // 36px
    padding: '0 0.75rem',
  },
  card: {
    padding: '1.5rem',
    borderRadius: 'var(--radius)',
  },
  section: {
    padding: '0.75rem 1rem',
    headerHeight: '2.5rem',
  },
} as const;

// Export CSS variables string for injection
export function getCSSVariables(): string {
  return `
    :root {
      /* Colors */
      --color-background: ${colors.background};
      --color-background-panel: ${colors.backgroundPanel};
      --color-background-hover: ${colors.backgroundHover};
      --color-border: ${colors.border};
      --color-border-hover: ${colors.borderHover};
      --color-border-focus: ${colors.borderFocus};
      --color-text-primary: ${colors.textPrimary};
      --color-text-secondary: ${colors.textSecondary};
      --color-text-muted: ${colors.textMuted};
      --color-accent: ${colors.accent};
      --color-accent-hover: ${colors.accentHover};
      --color-accent-soft: ${colors.accentSoft};
      --color-destructive: ${colors.destructive};
      --color-input: ${colors.input};
      --color-input-background: ${colors.inputBackground};
      --color-ring: ${colors.ring};
      
      /* Typography */
      --font-family-sans: ${typography.fontFamily.sans};
      --font-family-mono: ${typography.fontFamily.mono};
      
      /* Radius */
      --radius: ${radiusValue};
      
      /* Transitions */
      --transition-fast: ${transitions.fast};
      --transition-normal: ${transitions.normal};
      --transition-slow: ${transitions.slow};
    }
  `;
}
