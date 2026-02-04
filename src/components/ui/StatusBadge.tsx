'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  Circle,
  Wifi,
  WifiOff,
  Shield,
  ShieldOff,
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type StatusType =
  | 'online'
  | 'offline'
  | 'idle'
  | 'busy'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'completed'
  | 'in-progress'
  | 'locked'
  | 'unlocked';

export type StatusVariant = 'badge' | 'dot' | 'icon' | 'pill';
export type StatusSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  /** Status type */
  status: StatusType;
  /** Custom label (overrides default) */
  label?: string;
  /** Display variant */
  variant?: StatusVariant;
  /** Size */
  size?: StatusSize;
  /** Show icon */
  showIcon?: boolean;
  /** Animate (for pending/loading states) */
  animate?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Status Configurations
// ============================================================================

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  colors: {
    bg: string;
    text: string;
    dot: string;
    border: string;
  };
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  online: {
    label: 'Online',
    icon: Wifi,
    colors: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      border: 'border-emerald-500/30',
    },
  },
  offline: {
    label: 'Offline',
    icon: WifiOff,
    colors: {
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
      border: 'border-zinc-500/30',
    },
  },
  idle: {
    label: 'Idle',
    icon: Circle,
    colors: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
      border: 'border-amber-500/30',
    },
  },
  busy: {
    label: 'Sibuk',
    icon: AlertCircle,
    colors: {
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      dot: 'bg-red-500',
      border: 'border-red-500/30',
    },
  },
  success: {
    label: 'Berhasil',
    icon: Check,
    colors: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      border: 'border-emerald-500/30',
    },
  },
  error: {
    label: 'Error',
    icon: X,
    colors: {
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      dot: 'bg-red-500',
      border: 'border-red-500/30',
    },
  },
  warning: {
    label: 'Peringatan',
    icon: AlertCircle,
    colors: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
      border: 'border-amber-500/30',
    },
  },
  info: {
    label: 'Info',
    icon: AlertCircle,
    colors: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      dot: 'bg-blue-500',
      border: 'border-blue-500/30',
    },
  },
  pending: {
    label: 'Menunggu',
    icon: Clock,
    colors: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
      border: 'border-amber-500/30',
    },
  },
  active: {
    label: 'Aktif',
    icon: Check,
    colors: {
      bg: 'bg-[#088395]/15',
      text: 'text-[#7AB2B2]',
      dot: 'bg-[#088395]',
      border: 'border-[#088395]/30',
    },
  },
  inactive: {
    label: 'Tidak Aktif',
    icon: Circle,
    colors: {
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
      border: 'border-zinc-500/30',
    },
  },
  completed: {
    label: 'Selesai',
    icon: Check,
    colors: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      border: 'border-emerald-500/30',
    },
  },
  'in-progress': {
    label: 'Berlangsung',
    icon: Loader2,
    colors: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      dot: 'bg-blue-500',
      border: 'border-blue-500/30',
    },
  },
  locked: {
    label: 'Terkunci',
    icon: ShieldOff,
    colors: {
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
      border: 'border-zinc-500/30',
    },
  },
  unlocked: {
    label: 'Terbuka',
    icon: Shield,
    colors: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      border: 'border-emerald-500/30',
    },
  },
};

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfigs: Record<StatusSize, {
  badge: string;
  dot: string;
  icon: string;
  text: string;
  pill: string;
}> = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px]',
    dot: 'w-1.5 h-1.5',
    icon: 'w-3 h-3',
    text: 'text-[10px]',
    pill: 'px-2 py-0.5 text-[10px]',
  },
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    dot: 'w-2 h-2',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs',
    pill: 'px-2.5 py-1 text-xs',
  },
  md: {
    badge: 'px-2.5 py-1 text-xs',
    dot: 'w-2.5 h-2.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    pill: 'px-3 py-1.5 text-sm',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    dot: 'w-3 h-3',
    icon: 'w-5 h-5',
    text: 'text-base',
    pill: 'px-4 py-2 text-base',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function StatusBadge({
  status,
  label,
  variant = 'badge',
  size = 'sm',
  showIcon = true,
  animate = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const sizeConfig = sizeConfigs[size];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const shouldAnimate = animate || status === 'pending' || status === 'in-progress';

  // Dot variant
  if (variant === 'dot') {
    return (
      <span className={cn('flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'rounded-full',
            config.colors.dot,
            sizeConfig.dot,
            shouldAnimate && 'animate-pulse'
          )}
        />
        {displayLabel && (
          <span className={cn(config.colors.text, sizeConfig.text)}>
            {displayLabel}
          </span>
        )}
      </span>
    );
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.colors.bg,
          config.colors.text,
          sizeConfig.icon,
          'p-1',
          className
        )}
      >
        <Icon className={cn('w-full h-full', shouldAnimate && status === 'in-progress' && 'animate-spin')} />
      </span>
    );
  }

  // Pill variant
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          config.colors.bg,
          config.colors.text,
          config.colors.border,
          'border',
          sizeConfig.pill,
          className
        )}
      >
        {showIcon && (
          <Icon
            className={cn(
              sizeConfig.icon,
              shouldAnimate && status === 'in-progress' && 'animate-spin'
            )}
          />
        )}
        {displayLabel}
      </span>
    );
  }

  // Badge variant (default)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        config.colors.bg,
        config.colors.text,
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            shouldAnimate && status === 'in-progress' && 'animate-spin'
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

// ============================================================================
// Preset Components
// ============================================================================

export function OnlineStatus(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="online" {...props} />;
}

export function OfflineStatus(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="offline" {...props} />;
}

export function SuccessStatus(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="success" {...props} />;
}

export function ErrorStatus(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="error" {...props} />;
}

export function PendingStatus(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="pending" {...props} />;
}

// ============================================================================
// Export
// ============================================================================

export default StatusBadge;
