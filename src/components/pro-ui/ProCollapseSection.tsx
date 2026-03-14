import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { editorTheme } from "../../theme/editorTheme";

const { colors, typography, sizing, spacing, transition } = editorTheme;

export interface ProCollapseSectionProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function ProCollapseSection({
  title,
  collapsed,
  onToggle,
  actions,
  children,
}: ProCollapseSectionProps) {
  return (
    <div className="pro-collapse-section" style={styles.section}>
      <button
        type="button"
        className="pro-section-header"
        style={styles.header}
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="pro-section-body"
      >
        {collapsed ? (
          <ChevronRight style={styles.chevron} aria-hidden />
        ) : (
          <ChevronDown style={styles.chevron} aria-hidden />
        )}
        <span style={styles.title}>{title}</span>
        {actions ? <span style={styles.actions}>{actions}</span> : null}
      </button>
      {!collapsed && (
        <div
          id="pro-section-body"
          className="pro-section-body"
          style={styles.body}
          role="region"
        >
          {children}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    borderBottom: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    minHeight: sizing.sectionHeaderHeight,
    padding: `${spacing.sectionHeaderY}px ${spacing.sectionHeaderX}px`,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: colors.text,
    fontSize: typography.sectionTitleSize,
    fontWeight: typography.sectionTitleWeight,
    textAlign: "left",
    transition: `background-color ${transition.duration}ms ${transition.easing}`,
  },
  chevron: {
    width: sizing.chevronSize,
    height: sizing.chevronSize,
    color: colors.textMuted,
    flexShrink: 0,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexShrink: 0,
  },
  body: {
    padding: `${spacing.sectionBodyTop}px ${spacing.sectionBodyX}px ${spacing.sectionBodyBottom}px`,
  },
};
