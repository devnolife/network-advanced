'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ProgressVariant = 'default' | 'gradient' | 'striped' | 'animated';
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressColor = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ProgressBarProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Size variant */
  size?: ProgressSize;
  /** Style variant */
  variant?: ProgressVariant;
  /** Color theme */
  color?: ProgressColor;
  /** Additional class names */
  className?: string;
  /** Animate on mount */
  animate?: boolean;
  /** Label position */
  labelPosition?: 'top' | 'right' | 'inside';
}

export interface CircularProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color theme */
  color?: ProgressColor;
  /** Additional class names */
  className?: string;
  /** Content inside circle */
  children?: ReactNode;
}

// ============================================================================
// Color Mappings
// ============================================================================

const colorMap: Record<ProgressColor, {
  bar: string;
  gradient: string;
  track: string;
  text: string;
}> = {
  primary: {
    bar: 'bg-[#088395]',
    gradient: 'bg-gradient-to-r from-[#09637E] via-[#088395] to-[#7AB2B2]',
    track: 'bg-[#088395]/20',
    text: 'text-[#7AB2B2]',
  },
  success: {
    bar: 'bg-emerald-500',
    gradient: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400',
    track: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
  warning: {
    bar: 'bg-amber-500',
    gradient: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400',
    track: 'bg-amber-500/20',
    text: 'text-amber-400',
  },
  danger: {
    bar: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-red-600 via-red-500 to-red-400',
    track: 'bg-red-500/20',
    text: 'text-red-400',
  },
  info: {
    bar: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400',
    track: 'bg-blue-500/20',
    text: 'text-blue-400',
  },
};

const sizeMap: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

// ============================================================================
// Linear Progress Bar
// ============================================================================

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  variant = 'default',
  color = 'primary',
  className,
  animate = true,
  labelPosition = 'top',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const colors = colorMap[color];

  // Variant styles for the bar
  const barVariantStyles = {
    default: colors.bar,
    gradient: colors.gradient,
    striped: cn(
      colors.bar,
      'bg-[length:1rem_1rem]',
      'bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]'
    ),
    animated: cn(
      colors.gradient,
      'bg-[length:1rem_1rem]',
      'bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]',
      'animate-[progress-stripes_1s_linear_infinite]'
    ),
  };

  const displayLabel = label ?? `${Math.round(percentage)}%`;

  return (
    <div className={cn('w-full', className)}>
      {/* Top label */}
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            {label || 'Progress'}
          </span>
          <span className={cn('text-xs font-semibold', colors.text)}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Track */}
        <div
          className={cn(
            'flex-1 rounded-full overflow-hidden',
            colors.track,
            sizeMap[size]
          )}
        >
          {/* Bar */}
          <motion.div
            className={cn(
              'h-full rounded-full relative',
              barVariantStyles[variant],
              'transition-all duration-300'
            )}
            initial={animate ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Inside label */}
            {showLabel && labelPosition === 'inside' && size === 'lg' && percentage > 10 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {Math.round(percentage)}%
              </span>
            )}

            {/* Shine effect for gradient variant */}
            {variant === 'gradient' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </motion.div>
        </div>

        {/* Right label */}
        {showLabel && labelPosition === 'right' && (
          <span className={cn('text-sm font-semibold min-w-[3rem] text-right', colors.text)}>
            {displayLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Circular Progress
// ============================================================================

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  color = 'primary',
  className,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const colors = colorMap[color];

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={colors.track}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color === 'primary' ? '#09637E' : undefined} className={`${colors.bar.replace('bg-', 'stop-color: ')}`} />
            <stop offset="100%" stopColor={color === 'primary' ? '#7AB2B2' : undefined} className={`${colors.bar.replace('bg-', 'stop-color: ')}`} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className={cn('text-lg font-bold', colors.text)}>
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Multi-segment Progress
// ============================================================================

export interface ProgressSegment {
  value: number;
  color: ProgressColor;
  label?: string;
}

export interface MultiProgressProps {
  segments: ProgressSegment[];
  size?: ProgressSize;
  showLabels?: boolean;
  className?: string;
}

export function MultiProgress({
  segments,
  size = 'md',
  showLabels = false,
  className,
}: MultiProgressProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn('w-full', className)}>
      {/* Track */}
      <div className={cn('flex rounded-full overflow-hidden bg-[var(--color-surface-3)]', sizeMap[size])}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const colors = colorMap[segment.color];

          return (
            <motion.div
              key={index}
              className={cn('h-full', colors.bar, index === 0 && 'rounded-l-full', index === segments.length - 1 && 'rounded-r-full')}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
            />
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-4 mt-2">
          {segments.map((segment, index) => {
            const colors = colorMap[segment.color];
            return (
              <div key={index} className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-full', colors.bar)} />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {segment.label || `Segment ${index + 1}`}: {segment.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CSS Animation Keyframes (add to globals.css if not exists)
// ============================================================================
// @keyframes progress-stripes {
//   from { background-position: 1rem 0; }
//   to { background-position: 0 0; }
// }

// ============================================================================
// Export
// ============================================================================

export default ProgressBar;
