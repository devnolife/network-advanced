'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  Search,
  FolderOpen,
  Users,
  Database,
  AlertCircle,
  Plus,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';
import { Button } from './Button';

// ============================================================================
// Types
// ============================================================================

export type EmptyStateVariant = 'default' | 'minimal' | 'card';
export type EmptyStateType = 
  | 'no-data'
  | 'no-results'
  | 'no-access'
  | 'error'
  | 'empty-folder'
  | 'no-users'
  | 'custom';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface EmptyStateProps {
  /** Type of empty state (determines default icon and message) */
  type?: EmptyStateType;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom icon */
  icon?: ReactNode | LucideIcon;
  /** Style variant */
  variant?: EmptyStateVariant;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional class names */
  className?: string;
  /** Size of the empty state */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Preset Configurations
// ============================================================================

const presets: Record<EmptyStateType, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  'no-data': {
    icon: Database,
    title: 'Belum Ada Data',
    description: 'Belum ada data yang tersedia. Mulai dengan menambahkan data baru.',
  },
  'no-results': {
    icon: Search,
    title: 'Tidak Ada Hasil',
    description: 'Tidak ditemukan hasil yang sesuai dengan pencarian Anda. Coba kata kunci lain.',
  },
  'no-access': {
    icon: AlertCircle,
    title: 'Akses Ditolak',
    description: 'Anda tidak memiliki akses untuk melihat konten ini.',
  },
  'error': {
    icon: AlertCircle,
    title: 'Terjadi Kesalahan',
    description: 'Maaf, terjadi kesalahan saat memuat data. Silakan coba lagi.',
  },
  'empty-folder': {
    icon: FolderOpen,
    title: 'Folder Kosong',
    description: 'Folder ini tidak memiliki item. Tambahkan item baru untuk memulai.',
  },
  'no-users': {
    icon: Users,
    title: 'Belum Ada Pengguna',
    description: 'Belum ada pengguna yang terdaftar. Undang pengguna baru untuk memulai.',
  },
  'custom': {
    icon: FileQuestion,
    title: 'Tidak Ada Konten',
    description: 'Tidak ada konten untuk ditampilkan saat ini.',
  },
};

// ============================================================================
// Illustration Component
// ============================================================================

function EmptyIllustration({ icon: Icon, size }: { icon: LucideIcon; size: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { container: 'w-16 h-16', icon: 'w-8 h-8' },
    md: { container: 'w-24 h-24', icon: 'w-12 h-12' },
    lg: { container: 'w-32 h-32', icon: 'w-16 h-16' },
  };

  const sizes = sizeMap[size];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative rounded-full bg-[var(--color-surface-2)] flex items-center justify-center',
        sizes.container
      )}
    >
      {/* Background rings */}
      <div className="absolute inset-0 rounded-full border border-[var(--color-border)] opacity-50" />
      <div className="absolute inset-2 rounded-full border border-[var(--color-border)] opacity-30" />
      <div className="absolute inset-4 rounded-full border border-[var(--color-border)] opacity-20" />
      
      {/* Icon */}
      <Icon className={cn('text-[var(--color-muted-foreground)]', sizes.icon)} />
      
      {/* Decorative dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#088395]/30"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute -bottom-2 -left-2 w-2 h-2 rounded-full bg-[#7AB2B2]/30"
      />
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  variant = 'default',
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const preset = presets[type];
  
  const displayTitle = title || preset.title;
  const displayDescription = description || preset.description;
  const DisplayIcon = (icon as LucideIcon) || preset.icon;

  const sizeStyles = {
    sm: {
      container: 'py-6 px-4',
      title: 'text-sm',
      description: 'text-xs',
      gap: 'gap-3',
    },
    md: {
      container: 'py-10 px-6',
      title: 'text-base',
      description: 'text-sm',
      gap: 'gap-4',
    },
    lg: {
      container: 'py-16 px-8',
      title: 'text-lg',
      description: 'text-base',
      gap: 'gap-6',
    },
  };

  const styles = sizeStyles[size];

  const variantStyles = {
    default: '',
    minimal: '',
    card: 'rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        styles.gap,
        variantStyles[variant],
        className
      )}
    >
      {/* Illustration */}
      {typeof icon === 'function' ? (
        <EmptyIllustration icon={icon as LucideIcon} size={size} />
      ) : icon ? (
        <div className="text-[var(--color-muted-foreground)]">{icon}</div>
      ) : (
        <EmptyIllustration icon={DisplayIcon} size={size} />
      )}

      {/* Text content */}
      <div className="space-y-1.5 max-w-sm">
        <h3 className={cn('font-semibold text-[var(--color-foreground)]', styles.title)}>
          {displayTitle}
        </h3>
        <p className={cn('text-[var(--color-muted-foreground)]', styles.description)}>
          {displayDescription}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={action.onClick}
              className="gap-2"
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'ghost'}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={secondaryAction.onClick}
              className="gap-2"
            >
              {secondaryAction.icon || <RefreshCw className="w-4 h-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Preset Components
// ============================================================================

export function NoData(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="no-data" {...props} />;
}

export function NoResults(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="no-results" {...props} />;
}

export function NoAccess(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="no-access" {...props} />;
}

export function ErrorState(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState type="error" {...props} />;
}

// ============================================================================
// Export
// ============================================================================

export default EmptyState;
