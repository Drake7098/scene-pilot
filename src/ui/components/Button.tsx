import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button';
    
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f59e0b]';
    
    const variants = {
      default: 'bg-[#f59e0b] text-[#1f2125] hover:bg-[#d97706]',
      secondary: 'bg-[#2e333b] text-[#e5e7eb] hover:bg-[#353a42]',
      outline: 'border border-[#3a3f46] bg-transparent text-[#e5e7eb] hover:bg-[#343942]',
      ghost: 'text-[#e5e7eb] hover:bg-[#343942]',
      destructive: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 py-2 text-sm',
      lg: 'h-10 px-6 py-2 text-base',
      icon: 'h-9 w-9',
    };
    
    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
