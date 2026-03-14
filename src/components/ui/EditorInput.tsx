import React, { useCallback, useState } from "react";
import { editorTheme } from "../../theme/editorTheme";

const { colors, spacing, typography, radius, sizing } = editorTheme;

export type EditorInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange"
> & {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  suffix?: string;
  type?: "text" | "number";
  disabled?: boolean;
  className?: string;
};

export function EditorInput({
  label,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder,
  suffix,
  type = "text",
  disabled = false,
  className,
  onFocus,
  onBlur,
  ...rest
}: EditorInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      wrapperRef.current?.style && (wrapperRef.current.style.borderColor = colors.accent);
      onFocus?.(e);
    },
    [onFocus]
  );
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      wrapperRef.current?.style && (wrapperRef.current.style.borderColor = colors.border);
      onBlur?.(e);
    },
    [onBlur]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!isControlled) setUncontrolledValue(v);
      onChange?.(v, e);
    },
    [isControlled, onChange]
  );

  return (
    <div className={className} style={{ marginBottom: spacing.fieldMarginBottom }}>
      {label != null && (
        <label
          style={{
            display: "block",
            fontSize: typography.labelSize,
            fontWeight: typography.labelWeight,
            color: colors.textMuted,
            marginBottom: spacing.labelToControl,
          }}
        >
          {label}
        </label>
      )}
      <div
        ref={wrapperRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: sizing.controlHeight,
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.input,
          paddingLeft: spacing.inputPaddingX,
          paddingRight: spacing.inputPaddingX,
          transition: `border-color ${editorTheme.transition.duration}ms ${editorTheme.transition.easing}`,
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = colors.textMuted; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; }}
      >
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          {...rest}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: typography.bodySize,
            fontWeight: typography.bodyWeight,
            color: colors.text,
          }}
        />
        {suffix != null && suffix !== "" && (
          <span style={{ fontSize: typography.hintSize, color: colors.textMuted, flexShrink: 0 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
