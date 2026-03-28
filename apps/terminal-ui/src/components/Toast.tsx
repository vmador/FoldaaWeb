"use client"
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose: (id: string) => void;
}

const Toast = ({ id, message, type = 'success', persistent = false, action, onClose }: ToastProps) => {
    useEffect(() => {
        if (!persistent) {
            const timer = setTimeout(() => {
                onClose(id);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [id, persistent, onClose]);

    const icons = {
        success: <CheckCircle2 size={14} className="text-foreground/40" />,
        error: <AlertCircle size={14} className="text-red-500/60" />,
        info: <Info size={14} className="text-foreground/40" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={clsx(
                "flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg shadow-xl min-w-[320px] max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300",
                type === 'error' && "border-red-500/30"
            )}
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="flex-1 text-xs font-mono text-foreground uppercase tracking-wider flex items-center justify-between gap-4">
                <span>{message}</span>
                {action && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                        }}
                        className="flex-shrink-0 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-foreground/80 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <button 
                onClick={() => onClose(id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, onClose }: { toasts: any[], onClose: (id: string) => void }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    );
};
