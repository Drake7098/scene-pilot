import React, { useCallback, useState } from "react";
import { editorTheme } from "../../theme/editorTheme";

const { colors, radius, transition } = editorTheme;
const boxSize = 16;

export type EditorCheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  /** Tooltip (e.g. rule reason when disabled) */
  title?: string;
};

export function EditorCheckbox({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  label,
  className,
  title,
}: EditorCheckboxProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : uncontrolledChecked;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked;
      if (!isControlled) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    },
    [isControlled, onCheckedChange]
  );

  return (
    <label
      className={className}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 24,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "2px 0",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        aria-hidden
      />
      <span
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: radius.chip,
          border: `1px solid ${checked ? colors.accent : colors.border}`,
          backgroundColor: checked ? colors.accent : colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: `border-color ${transition.duration}ms ${transition.easing}, background-color ${transition.duration}ms ${transition.easing}`,
        }}
      >
        {checked && (
          <span style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: colors.bg }} />
        )}
      </span>
      {label != null && (
        <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{label}</span>
      )}
    </label>
  );
}
