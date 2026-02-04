'use client';

import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, forwardRef, InputHTMLAttributes } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Show clear button */
  showClear?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
  /** Input class names */
  inputClassName?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Search on enter key */
  searchOnEnter?: boolean;
  /** Callback when enter is pressed */
  onSearch?: (value: string) => void;
}

// ============================================================================
// Hook: useDebounce
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Main Component
// ============================================================================

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      debounceMs = 300,
      placeholder = 'Cari...',
      showClear = true,
      size = 'md',
      loading = false,
      className,
      inputClassName,
      autoFocus = false,
      searchOnEnter = false,
      onSearch,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with controlled value
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue);
      }
    }, [controlledValue]);

    // Debounced value
    const debouncedValue = useDebounce(internalValue, debounceMs);

    // Trigger onChange with debounced value
    useEffect(() => {
      if (!searchOnEnter && onChange && debouncedValue !== controlledValue) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange, searchOnEnter, controlledValue]);

    // Handle input change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      
      // If no debounce, call onChange immediately
      if (debounceMs === 0 && onChange) {
        onChange(newValue);
      }
    }, [debounceMs, onChange]);

    // Handle clear
    const handleClear = useCallback(() => {
      setInternalValue('');
      onChange?.('');
      onSearch?.('');
      inputRef.current?.focus();
    }, [onChange, onSearch]);

    // Handle key down
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && (searchOnEnter || onSearch)) {
        e.preventDefault();
        onChange?.(internalValue);
        onSearch?.(internalValue);
      }
      if (e.key === 'Escape') {
        handleClear();
      }
    }, [internalValue, onChange, onSearch, searchOnEnter, handleClear]);

    // Size styles
    const sizeStyles = {
      sm: {
        container: 'h-8',
        input: 'text-xs pl-8 pr-8',
        iconLeft: 'left-2.5 w-3.5 h-3.5',
        iconRight: 'right-2.5 w-3.5 h-3.5',
      },
      md: {
        container: 'h-10',
        input: 'text-sm pl-10 pr-10',
        iconLeft: 'left-3 w-4 h-4',
        iconRight: 'right-3 w-4 h-4',
      },
      lg: {
        container: 'h-12',
        input: 'text-base pl-12 pr-12',
        iconLeft: 'left-4 w-5 h-5',
        iconRight: 'right-4 w-5 h-5',
      },
    };

    const styles = sizeStyles[size];
    const hasValue = internalValue.length > 0;

    return (
      <div className={cn('relative', styles.container, className)}>
        {/* Search icon */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none transition-colors',
            styles.iconLeft,
            hasValue && 'text-[var(--color-foreground)]'
          )}
        >
          <Search className="w-full h-full" />
        </div>

        {/* Input */}
        <input
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full h-full rounded-lg',
            'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
            'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#088395]/50 focus:border-[#088395]',
            'hover:border-[var(--color-surface-hover)]',
            styles.input,
            inputClassName
          )}
          {...props}
        />

        {/* Right side: clear button or loading */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center',
            styles.iconRight
          )}
        >
          {loading ? (
            <Loader2 className="w-full h-full text-[var(--color-muted-foreground)] animate-spin" />
          ) : showClear && hasValue ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                'transition-colors rounded-full p-0.5',
                'hover:bg-[var(--color-surface-hover)]'
              )}
            >
              <X className="w-full h-full" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================================================
// Export
// ============================================================================

export default SearchInput;
