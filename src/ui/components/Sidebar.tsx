import React from 'react';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pro';
}

/**
 * Sidebar Component - based on figmaUI design system
 * Left sidebar with consistent styling
 */
export function Sidebar({
  children,
  className,
  variant = 'default',
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-[260px] border-r border-[#3a3f46] bg-[#24262b] flex flex-col shrink-0 z-10',
        variant === 'pro' && 'border-r-2 border-r-[#f59e0b]/20',
        className
      )}
    >
      {children}
    </aside>
  );
}

/**
 * Sidebar Section - collapsible section for sidebar
 */
export function SidebarSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-[#3a3f46] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 hover:bg-[#343942] transition-colors group cursor-pointer"
      >
        {isOpen ? (
          <svg className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className="flex-1 text-left text-xs font-semibold text-[#e5e7eb] uppercase tracking-wider">
          {title}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar Item - clickable item for sidebar
 */
export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  badge,
}: {
  icon?: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors',
        active
          ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
          : 'text-[#e5e7eb] hover:bg-[#343942]'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="text-[10px]">{badge}</span>}
    </div>
  );
}

export default Sidebar;
