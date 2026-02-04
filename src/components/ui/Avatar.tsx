'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import Image from 'next/image';

// ============================================================================
// Types
// ============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'idle' | 'none';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Fallback text (initials) */
  fallback?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Shape variant */
  shape?: AvatarShape;
  /** Status indicator */
  status?: AvatarStatus;
  /** Border ring color */
  ring?: boolean;
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface AvatarGroupProps {
  /** Avatar items */
  children: ReactNode;
  /** Maximum avatars to show */
  max?: number;
  /** Size variant */
  size?: AvatarSize;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfigs: Record<AvatarSize, {
  container: string;
  text: string;
  status: string;
  statusRing: string;
}> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
    status: 'w-1.5 h-1.5',
    statusRing: 'ring-1',
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    status: 'w-2 h-2',
    statusRing: 'ring-1',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    status: 'w-2.5 h-2.5',
    statusRing: 'ring-2',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-base',
    status: 'w-3 h-3',
    statusRing: 'ring-2',
  },
  xl: {
    container: 'w-16 h-16',
    text: 'text-lg',
    status: 'w-3.5 h-3.5',
    statusRing: 'ring-2',
  },
  '2xl': {
    container: 'w-24 h-24',
    text: 'text-2xl',
    status: 'w-4 h-4',
    statusRing: 'ring-2',
  },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-500',
  busy: 'bg-red-500',
  idle: 'bg-amber-500',
  none: '',
};

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromString(str: string): string {
  // Generate a consistent color based on string
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// Main Component
// ============================================================================

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  shape = 'circle',
  status = 'none',
  ring = false,
  className,
  onClick,
}: AvatarProps) {
  const sizeConfig = sizeConfigs[size];
  const initials = fallback ? getInitials(fallback) : '?';
  const bgColor = fallback ? getColorFromString(fallback) : 'bg-[var(--color-surface-3)]';

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden',
        'flex-shrink-0',
        sizeConfig.container,
        shapeClass,
        ring && 'ring-2 ring-[var(--color-border)] ring-offset-2 ring-offset-[var(--color-background)]',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || fallback || 'Avatar'}
          fill
          className="object-cover"
          sizes={sizeConfig.container.replace('w-', '').replace('h-', '') + 'px'}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-semibold text-white',
            bgColor
          )}
        >
          <span className={sizeConfig.text}>{initials}</span>
        </div>
      )}

      {/* Status indicator */}
      {status !== 'none' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            'ring-[var(--color-background)]',
            sizeConfig.status,
            sizeConfig.statusRing,
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

// ============================================================================
// Avatar Group
// ============================================================================

export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleCount = Math.min(childArray.length, max);
  const remainingCount = childArray.length - max;
  const sizeConfig = sizeConfigs[size];

  return (
    <div className={cn('flex -space-x-2', className)}>
      {childArray.slice(0, visibleCount).map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-[var(--color-background)] rounded-full"
        >
          {child}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'bg-[var(--color-surface-3)] text-[var(--color-foreground)]',
            'ring-2 ring-[var(--color-background)]',
            'font-medium',
            sizeConfig.container,
            sizeConfig.text
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Avatar with Label
// ============================================================================

export interface AvatarWithLabelProps extends AvatarProps {
  /** Primary label (name) */
  name?: string;
  /** Secondary label (subtitle) */
  subtitle?: string;
  /** Reverse layout (label on left) */
  reverse?: boolean;
}

export function AvatarWithLabel({
  name,
  subtitle,
  reverse = false,
  ...avatarProps
}: AvatarWithLabelProps) {
  const sizeConfig = sizeConfigs[avatarProps.size || 'md'];

  return (
    <div className={cn('flex items-center gap-3', reverse && 'flex-row-reverse')}>
      <Avatar {...avatarProps} fallback={avatarProps.fallback || name} />
      <div className={cn('min-w-0', reverse && 'text-right')}>
        {name && (
          <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
            {name}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default Avatar;
