'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, CheckCircle, X, LucideIcon } from 'lucide-react';
import { Button } from './Button';

// ============================================================================
// Types
// ============================================================================

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Dialog variant */
  variant?: ConfirmDialogVariant;
  /** Custom icon */
  icon?: ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional content */
  children?: ReactNode;
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;
}

// ============================================================================
// Variant Configurations
// ============================================================================

const variantConfigs: Record<ConfirmDialogVariant, {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  confirmVariant: 'danger' | 'primary' | 'success';
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    confirmVariant: 'danger',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    confirmVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    confirmVariant: 'primary',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    confirmVariant: 'success',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'danger',
  icon,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  loading = false,
  children,
  disableBackdropClick = false,
}: ConfirmDialogProps) {
  const config = variantConfigs[variant];
  const Icon = config.icon;

  const handleBackdropClick = () => {
    if (!disableBackdropClick && !loading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative w-full max-w-md',
                'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
                'rounded-2xl shadow-2xl shadow-black/30',
                'overflow-hidden'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={loading}
                className={cn(
                  'absolute top-4 right-4 p-1 rounded-lg',
                  'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  'hover:bg-[var(--color-surface-hover)]',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={cn('p-3 rounded-full', config.iconBg)}>
                    {icon || <Icon className={cn('w-8 h-8', config.iconColor)} />}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-center text-[var(--color-foreground)]">
                  {title}
                </h2>

                {/* Description */}
                {description && (
                  <p className="mt-2 text-sm text-center text-[var(--color-muted-foreground)]">
                    {description}
                  </p>
                )}

                {/* Additional content */}
                {children && (
                  <div className="mt-4">
                    {children}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-4 bg-[var(--color-surface-2)] border-t border-[var(--color-border)]">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.confirmVariant}
                  className="flex-1"
                  onClick={handleConfirm}
                  loading={loading}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Preset Dialogs
// ============================================================================

export interface DeleteConfirmDialogProps extends Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'> {
  /** Item name to delete */
  itemName?: string;
}

export function DeleteConfirmDialog({
  itemName,
  description,
  ...props
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      variant="danger"
      title={`Hapus ${itemName || 'Item'}?`}
      description={description || `Apakah Anda yakin ingin menghapus ${itemName || 'item ini'}? Tindakan ini tidak dapat dibatalkan.`}
      confirmText="Hapus"
    />
  );
}

export interface SaveConfirmDialogProps extends Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'> {
  /** Whether there are unsaved changes */
  hasChanges?: boolean;
}

export function SaveConfirmDialog({
  hasChanges = true,
  description,
  ...props
}: SaveConfirmDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      variant="warning"
      title="Simpan Perubahan?"
      description={description || (hasChanges ? 'Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin menyimpannya?' : 'Simpan perubahan yang telah dibuat?')}
      confirmText="Simpan"
    />
  );
}

export interface DiscardConfirmDialogProps extends Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'> {}

export function DiscardConfirmDialog({
  description,
  ...props
}: DiscardConfirmDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      variant="warning"
      title="Buang Perubahan?"
      description={description || 'Perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin melanjutkan?'}
      confirmText="Buang"
    />
  );
}

// ============================================================================
// Hook for confirm dialog
// ============================================================================

import { useState, useCallback } from 'react';

export interface UseConfirmDialogOptions {
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmDialog(options: UseConfirmDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
    }
  }, [isLoading]);

  const confirm = useCallback(async () => {
    if (options.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [options]);

  return {
    isOpen,
    isLoading,
    open,
    close,
    confirm,
    dialogProps: {
      open: isOpen,
      onClose: close,
      onConfirm: confirm,
      loading: isLoading,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default ConfirmDialog;
