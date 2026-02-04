'use client';

import { cn } from '@/lib/utils';
import {
  ReactNode,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useCallback,
  KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type DropdownAlign = 'start' | 'center' | 'end';
export type DropdownSide = 'top' | 'bottom' | 'left' | 'right';

export interface DropdownProps {
  /** Trigger element */
  trigger: ReactNode;
  /** Dropdown content */
  children: ReactNode;
  /** Alignment relative to trigger */
  align?: DropdownAlign;
  /** Side to show dropdown */
  side?: DropdownSide;
  /** Offset from trigger */
  offset?: number;
  /** Additional class names */
  className?: string;
  /** Content class names */
  contentClassName?: string;
  /** Controlled open state */
  open?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** Close on item click */
  closeOnSelect?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export interface DropdownItemProps {
  /** Item content */
  children: ReactNode;
  /** Icon */
  icon?: LucideIcon | ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive/danger style */
  destructive?: boolean;
  /** Show check mark */
  selected?: boolean;
  /** Shortcut text */
  shortcut?: string;
  /** Additional class names */
  className?: string;
  /** Href for link items */
  href?: string;
}

export interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export interface DropdownSeparatorProps {
  className?: string;
}

export interface DropdownSubmenuProps {
  /** Trigger content */
  trigger: ReactNode;
  /** Submenu items */
  children: ReactNode;
  /** Icon */
  icon?: LucideIcon | ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// Context
// ============================================================================

interface DropdownContextValue {
  closeDropdown: () => void;
  closeOnSelect: boolean;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown');
  }
  return context;
}

// ============================================================================
// Dropdown Container
// ============================================================================

export function Dropdown({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  offset = 4,
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
  closeOnSelect = true,
  disabled = false,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  }, [controlledOpen, onOpenChange]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeDropdown]);

  // Position styles
  const positionStyles = {
    top: { bottom: '100%', marginBottom: offset },
    bottom: { top: '100%', marginTop: offset },
    left: { right: '100%', marginRight: offset },
    right: { left: '100%', marginLeft: offset },
  };

  const alignStyles = {
    start: { left: 0 },
    center: { left: '50%', transform: 'translateX(-50%)' },
    end: { right: 0 },
  };

  return (
    <DropdownContext.Provider value={{ closeDropdown, closeOnSelect }}>
      <div className={cn('relative inline-block', className)}>
        {/* Trigger */}
        <div
          ref={triggerRef}
          onClick={() => !disabled && setOpen(!isOpen)}
          className={cn(disabled && 'opacity-50 cursor-not-allowed')}
        >
          {trigger}
        </div>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -8 : 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -8 : 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 min-w-[180px]',
                'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
                'rounded-xl shadow-xl shadow-black/30',
                'py-1.5',
                contentClassName
              )}
              style={{
                ...positionStyles[side],
                ...(side === 'top' || side === 'bottom' ? alignStyles[align] : {}),
              }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DropdownContext.Provider>
  );
}

// ============================================================================
// Dropdown Item
// ============================================================================

export function DropdownItem({
  children,
  icon,
  onClick,
  disabled = false,
  destructive = false,
  selected = false,
  shortcut,
  className,
  href,
}: DropdownItemProps) {
  const { closeDropdown, closeOnSelect } = useDropdownContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    if (closeOnSelect) {
      closeDropdown();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const IconComponent = typeof icon === 'function' ? icon : null;

  const content = (
    <>
      {/* Icon or check */}
      <span className="w-5 flex items-center justify-center flex-shrink-0">
        {selected ? (
          <Check className="w-4 h-4 text-[#088395]" />
        ) : IconComponent ? (
          <IconComponent className="w-4 h-4" />
        ) : icon ? (
          <>{icon}</>
        ) : null}
      </span>

      {/* Label */}
      <span className="flex-1 truncate">{children}</span>

      {/* Shortcut */}
      {shortcut && (
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)] opacity-60">
          {shortcut}
        </span>
      )}
    </>
  );

  const itemClassName = cn(
    'flex items-center gap-2 w-full px-3 py-2 text-sm',
    'transition-colors cursor-pointer',
    'focus:outline-none',
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : destructive
        ? 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
        : 'text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] focus:bg-[var(--color-surface-hover)]',
    className
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={itemClassName}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      role="menuitem"
      className={itemClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {content}
    </div>
  );
}

// ============================================================================
// Dropdown Label
// ============================================================================

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Dropdown Separator
// ============================================================================

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return (
    <div className={cn('my-1.5 h-px bg-[var(--color-border)]', className)} />
  );
}

// ============================================================================
// Dropdown Submenu
// ============================================================================

export function DropdownSubmenu({
  trigger,
  children,
  icon,
  disabled = false,
}: DropdownSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const IconComponent = typeof icon === 'function' ? icon : null;

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm',
          'transition-colors cursor-pointer',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]'
        )}
      >
        <span className="w-5 flex items-center justify-center flex-shrink-0">
          {IconComponent ? <IconComponent className="w-4 h-4" /> : icon ? <>{icon}</> : null}
        </span>
        <span className="flex-1 truncate">{trigger}</span>
        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute left-full top-0 ml-1 min-w-[160px]',
              'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
              'rounded-xl shadow-xl shadow-black/30',
              'py-1.5'
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default Dropdown;
