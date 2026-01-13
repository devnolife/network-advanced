'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'points';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    points?: number;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    points: (title: string, points: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const toastConfig = {
    success: {
        icon: CheckCircle2,
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/50',
        iconColor: 'text-emerald-400',
        titleColor: 'text-emerald-300',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        iconColor: 'text-red-400',
        titleColor: 'text-red-300',
    },
    info: {
        icon: Info,
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/50',
        iconColor: 'text-cyan-400',
        titleColor: 'text-cyan-300',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/50',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-300',
    },
    points: {
        icon: Sparkles,
        bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20',
        border: 'border-amber-500/50',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-300',
    },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove();
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`
        relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
        ${config.bg} ${config.border}
        shadow-xl shadow-black/20 min-w-[300px] max-w-[400px]
      `}
        >
            {/* Icon */}
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${config.titleColor}`}>{toast.title}</h4>
                    {toast.points && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50">
                            +{toast.points} pts
                        </span>
                    )}
                </div>
                {toast.message && (
                    <p className="text-sm text-zinc-400 mt-0.5">{toast.message}</p>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={onRemove}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-zinc-500" />
            </button>

            {/* Progress Bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl origin-left ${toast.type === 'success' ? 'bg-emerald-500' :
                        toast.type === 'error' ? 'bg-red-500' :
                            toast.type === 'points' ? 'bg-amber-500' :
                                toast.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
            />
        </motion.div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    const points = useCallback((title: string, pts: number) => {
        addToast({ type: 'points', title, points: pts, duration: 5000 });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, points }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onRemove={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
