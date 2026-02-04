'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SkeletonVariant = 'default' | 'shimmer' | 'pulse';

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animation variant */
  variant?: SkeletonVariant;
  /** Additional class names */
  className?: string;
  /** Whether to show skeleton */
  loading?: boolean;
  /** Content to show when not loading */
  children?: ReactNode;
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function Skeleton({
  width,
  height,
  rounded = 'md',
  variant = 'shimmer',
  className,
  loading = true,
  children,
}: SkeletonProps) {
  if (!loading && children) {
    return <>{children}</>;
  }

  const roundedMap = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  const variantStyles = {
    default: 'bg-[var(--color-surface-3)]',
    shimmer: 'bg-[var(--color-surface-3)] animate-shimmer bg-gradient-to-r from-[var(--color-surface-3)] via-[var(--color-surface-2)] to-[var(--color-surface-3)] bg-[length:200%_100%]',
    pulse: 'bg-[var(--color-surface-3)] animate-pulse',
  };

  return (
    <div
      className={cn(
        roundedMap[rounded],
        variantStyles[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// ============================================================================
// Preset Skeletons
// ============================================================================

/** Text line skeleton */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}

/** Avatar skeleton */
export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  );
}

/** Card skeleton */
export function SkeletonCard({
  className,
  showImage = true,
  lines = 3,
}: {
  className?: string;
  showImage?: boolean;
  lines?: number;
}) {
  return (
    <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden', className)}>
      {showImage && <Skeleton height={160} rounded="none" />}
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="60%" rounded="sm" />
        <SkeletonText lines={lines} />
        <div className="flex gap-2 pt-2">
          <Skeleton height={32} width={80} rounded="md" />
          <Skeleton height={32} width={80} rounded="md" />
        </div>
      </div>
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton height={16} width={i === 0 ? '80%' : '60%'} rounded="sm" />
        </td>
      ))}
    </tr>
  );
}

/** Table skeleton */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-3 text-left">
                <Skeleton height={14} width="50%" rounded="sm" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton height={14} width="60%" rounded="sm" />
          <Skeleton height={28} width="40%" rounded="sm" />
          <Skeleton height={12} width="80%" rounded="sm" />
        </div>
        <Skeleton width={48} height={48} rounded="lg" />
      </div>
    </div>
  );
}

/** List item skeleton */
export function SkeletonListItem({
  showAvatar = true,
  className,
}: {
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      {showAvatar && <SkeletonAvatar size={40} />}
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="50%" rounded="sm" />
        <Skeleton height={12} width="70%" rounded="sm" />
      </div>
      <Skeleton height={24} width={60} rounded="md" />
    </div>
  );
}

/** List skeleton */
export function SkeletonList({
  items = 5,
  showAvatar = true,
  className,
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('divide-y divide-[var(--color-border)]', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

/** Dashboard skeleton */
export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-5">
          <Skeleton height={20} width="30%" className="mb-4" rounded="sm" />
          <Skeleton height={200} rounded="md" />
        </div>
        <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-5">
          <Skeleton height={20} width="30%" className="mb-4" rounded="sm" />
          <SkeletonList items={4} />
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default Skeleton;
