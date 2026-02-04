'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

export type StatCardVariant = 'default' | 'gradient' | 'bordered' | 'minimal';
export type StatCardColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardTrend {
  value: number;
  direction: TrendDirection;
  label?: string;
}

export interface StatCardProps {
  /** Title/label of the stat */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional description below value */
  description?: string;
  /** Icon component */
  icon?: ReactNode;
  /** Trend information */
  trend?: StatCardTrend;
  /** Card variant */
  variant?: StatCardVariant;
  /** Color theme */
  color?: StatCardColor;
  /** Link to navigate on click */
  href?: string;
  /** Additional class names */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Format value as currency */
  currency?: boolean;
  /** Custom footer content */
  footer?: ReactNode;
}

// ============================================================================
// Color Mappings
// ============================================================================

const colorMap: Record<StatCardColor, {
  icon: string;
  gradient: string;
  border: string;
  text: string;
  bg: string;
}> = {
  primary: {
    icon: 'bg-[#088395]/20 text-[#7AB2B2] border-[#088395]/30',
    gradient: 'from-[#088395]/20 via-transparent to-transparent',
    border: 'border-[#088395]/30 hover:border-[#088395]/50',
    text: 'text-[#7AB2B2]',
    bg: 'bg-[#088395]/10',
  },
  success: {
    icon: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    gradient: 'from-emerald-500/20 via-transparent to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  warning: {
    icon: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    gradient: 'from-amber-500/20 via-transparent to-transparent',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  danger: {
    icon: 'bg-red-500/20 text-red-400 border-red-500/30',
    gradient: 'from-red-500/20 via-transparent to-transparent',
    border: 'border-red-500/30 hover:border-red-500/50',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  info: {
    icon: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gradient: 'from-blue-500/20 via-transparent to-transparent',
    border: 'border-blue-500/30 hover:border-blue-500/50',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  neutral: {
    icon: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    gradient: 'from-zinc-500/20 via-transparent to-transparent',
    border: 'border-zinc-500/30 hover:border-zinc-500/50',
    text: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
  },
};

// ============================================================================
// Helper Components
// ============================================================================

function TrendIndicator({ trend }: { trend: StatCardTrend }) {
  const { value, direction, label } = trend;

  const directionConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
    neutral: {
      icon: Minus,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/20',
    },
  };

  const config = directionConfig[direction];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
      <Icon className="w-3.5 h-3.5" />
      <span>{value > 0 ? '+' : ''}{value}%</span>
      {label && <span className="text-zinc-500 ml-1">{label}</span>}
    </div>
  );
}

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-[var(--color-surface-3)] rounded animate-pulse" />
          <div className="h-8 w-20 bg-[var(--color-surface-3)] rounded animate-pulse mt-3" />
          <div className="h-3 w-32 bg-[var(--color-surface-3)] rounded animate-pulse mt-2" />
        </div>
        <div className="w-12 h-12 bg-[var(--color-surface-3)] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  color = 'primary',
  href,
  className,
  loading = false,
  currency = false,
  footer,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton className={className} />;
  }

  const colors = colorMap[color];

  // Format value
  const formattedValue = currency
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value))
    : value;

  // Variant styles
  const variantStyles = {
    default: 'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
    gradient: cn('bg-gradient-to-br border', colors.gradient, colors.border, 'bg-[var(--color-surface-1)]'),
    bordered: cn('bg-transparent border-2', colors.border),
    minimal: 'bg-transparent border-0',
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-xl p-5 transition-all duration-300',
        variantStyles[variant],
        href && 'cursor-pointer hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Background decoration for gradient variant */}
      {variant === 'gradient' && (
        <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20', colors.bg)} />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            {title}
          </p>

          {/* Value */}
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
              {formattedValue}
            </h3>
            {trend && <TrendIndicator trend={trend} />}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-3 rounded-xl border transition-colors duration-300',
            colors.icon
          )}>
            {icon}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}

      {/* Link indicator */}
      {href && (
        <div className="absolute bottom-4 right-4 text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// Compound Components
// ============================================================================

export function StatCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StatCard;
