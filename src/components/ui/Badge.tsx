'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  className,
  style,
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    primary: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const dotSizes: Record<BadgeSize, string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-zinc-400',
    primary: 'bg-cyan-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      style={style}
    >
      {dot && (
        <span
          className={cn(
            'rounded-full',
            dotSizes[size],
            dotColor || dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

// Status Badge dengan animasi
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'pending' | 'error';
  label?: string;
  showDot?: boolean;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const statusConfig: Record<
    StatusBadgeProps['status'],
    { variant: BadgeVariant; label: string; animate?: boolean }
  > = {
    online: { variant: 'success', label: 'Online' },
    offline: { variant: 'danger', label: 'Offline' },
    pending: { variant: 'warning', label: 'Pending', animate: true },
    error: { variant: 'danger', label: 'Error', animate: true },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={showDot} className={className}>
      {config.animate && showDot && (
        <span
          className={cn(
            'absolute rounded-full animate-ping',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5',
            config.variant === 'warning' ? 'bg-amber-400' : 'bg-red-400',
            'opacity-75'
          )}
          style={{ left: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px' }}
        />
      )}
      {label || config.label}
    </Badge>
  );
}
