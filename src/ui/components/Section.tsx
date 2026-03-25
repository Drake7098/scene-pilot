import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface SectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  extra?: React.ReactNode;
  className?: string;
}

/**
 * Section Component - based on figmaUI design system
 * Collapsible section with header and content
 */
export function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  extra,
  className,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'border-b border-[#3a3f46] last:border-0',
        className
      )}
    >
      <div
        className="flex items-center w-full px-3 py-2 hover:bg-[#343942] transition-colors group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" />
        )}

        {Icon && <Icon className="w-3.5 h-3.5 mr-2 text-[#9ca3af]" />}
        <span className="flex-1 text-left text-xs font-semibold text-[#e5e7eb] uppercase tracking-wider">
          {title}
        </span>

        {extra && (
          <div onClick={(e) => e.stopPropagation()}>{extra}</div>
        )}
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-3 pb-3 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Section;
