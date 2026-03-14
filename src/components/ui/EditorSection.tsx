import React, { useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { editorTheme } from "../../theme/editorTheme";

const { colors, spacing, typography, transition, sizing } = editorTheme;

export type EditorSectionProps = {
  title: string;
  icon?: React.ElementType;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  extra?: React.ReactNode;
  /** When set, header uses grid layout so extra aligns with a fixed-width column (e.g. plus/minus) */
  extraColumnWidth?: number;
  className?: string;
  children: React.ReactNode;
};

export function EditorSection({
  title,
  icon: Icon,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  extra,
  extraColumnWidth,
  className,
  children,
}: EditorSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = useCallback(() => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [isOpen, isControlled, onOpenChange]);

  const useGrid = extraColumnWidth != null && extra != null;
  const headerContent = (
    <>
      {isOpen ? (
        <ChevronDown style={{ width: sizing.chevronSize, height: sizing.chevronSize, color: colors.textMuted, marginRight: 6, flexShrink: 0 }} aria-hidden />
      ) : (
        <ChevronRight style={{ width: sizing.chevronSize, height: sizing.chevronSize, color: colors.textMuted, marginRight: 6, flexShrink: 0 }} aria-hidden />
      )}
      {Icon && (
        <Icon style={{ width: sizing.chevronSize, height: sizing.chevronSize, color: colors.textMuted, marginRight: 8, flexShrink: 0 }} aria-hidden />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          fontSize: typography.sectionTitleSize,
          fontWeight: typography.sectionTitleWeight,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      {extra != null && !useGrid && (
        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          {extra}
        </div>
      )}
    </>
  );

  return (
    <div className={className} style={{ borderBottom: `1px solid ${colors.border}` }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        style={{
          display: useGrid ? "grid" : "flex",
          gridTemplateColumns: useGrid ? `1fr ${extraColumnWidth}px` : undefined,
          alignItems: "center",
          width: "100%",
          minHeight: sizing.sectionHeaderHeight,
          padding: `${spacing.sectionHeaderY}px ${spacing.sectionHeaderX}px`,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: colors.text,
          transition: `background-color ${transition.duration}ms ${transition.easing}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {useGrid ? (
          <>
            <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>{headerContent}</div>
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: extraColumnWidth }}>
              {extra}
            </div>
          </>
        ) : (
          headerContent
        )}
      </div>
      <div
        ref={contentRef}
        style={{
          overflow: "hidden",
          transition: `max-height ${transition.duration}ms ${transition.easing}, opacity ${transition.duration}ms ${transition.easing}`,
          maxHeight: isOpen ? 2000 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div style={{ padding: `${spacing.sectionBodyTop}px ${spacing.sectionBodyX}px ${spacing.sectionBodyBottom}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
