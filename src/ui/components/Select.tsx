import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
}

/**
 * Select Component - based on figmaUI design system
 * Native select with custom styling
 */
export function Select({
  options,
  label,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-[11px] font-medium text-[#9ca3af] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full bg-[#1f2125] border border-[#3a3f46] text-[#e5e7eb] text-xs rounded-md py-1.5 pl-2.5 pr-8 appearance-none',
            'focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/30',
            'transition-colors cursor-pointer',
            'hover:border-[#9ca3af]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

export default Select;
