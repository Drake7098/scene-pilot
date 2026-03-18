import React, { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { editorTheme } from "../../theme/editorTheme";

const { colors, spacing, typography, radius, sizing } = editorTheme;

export type EditorSelectOption =
  | string
  | { label: string; value: string; disabled?: boolean };

function normalizeOptions(options: EditorSelectOption[]): { label: string; value: string; disabled: boolean }[] {
  return options.map((opt) =>
    typeof opt === "string"
      ? { label: opt, value: opt, disabled: false }
      : { label: opt.label, value: opt.value, disabled: opt.disabled ?? false }
  );
}

export type EditorSelectProps = {
  label?: string;
  options: EditorSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Use compact spacing (for camera/layout control blocks) */
  compact?: boolean;
  /** Tooltip (e.g. rule reason when disabled) */
  title?: string;
  /** PRO badge shown after label — pass "PRO" when a pro field is active */
  labelSuffix?: string;
};

export function EditorSelect({
  label,
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  disabled = false,
  placeholder,
  className,
  compact = false,
  title,
  labelSuffix,
}: EditorSelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const normalized = normalizeOptions(options);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (!isControlled) setUncontrolledValue(v);
      onChange?.(v);
    },
    [isControlled, onChange]
  );

  const marginBottom = compact ? spacing.fieldMarginBottomCompact : spacing.fieldMarginBottom;
  return (
    <div className={className} style={{ marginBottom }} title={title}>
      {label != null && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: typography.labelSize,
            fontWeight: typography.labelWeight,
            color: colors.textMuted,
            marginBottom: spacing.labelToControl,
          }}
        >
          {label}
          {labelSuffix && (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}>
              {labelSuffix}
            </span>
          )}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          title={title}
          style={{
            width: "100%",
            height: sizing.controlHeight,
            appearance: "none",
            WebkitAppearance: "none",
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: typography.bodySize,
            fontWeight: typography.bodyWeight,
            borderRadius: radius.input,
            padding: `0 28px 0 ${spacing.selectPaddingX}px`,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            outline: "none",
            transition: `border-color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.border; }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = colors.textMuted; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
        >
          {placeholder != null && <option value="">{placeholder}</option>}
          {normalized.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: sizing.selectArrowSize,
            height: sizing.selectArrowSize,
            color: colors.textMuted,
            pointerEvents: "none",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
