import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full min-w-0 rounded-md border border-[#3a3f46] bg-[#1f2125] px-3 py-1 text-sm text-[#e5e7eb]',
          'transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-[#9ca3af]',
          'focus-visible:outline-none focus-visible:border-[#f59e0b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-[#4b525c]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
