"use client"
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastType } from '@/components/Toast';

interface Toast {
    id: string;
    message: string;
    type?: ToastType;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, options?: { persistent?: boolean; action?: { label: string; onClick: () => void }, id?: string }) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success', options: { persistent?: boolean; action?: { label: string; onClick: () => void }, id?: string } = {}) => {
        const id = options.id || Math.random().toString(36).substr(2, 9);
        setToasts((prev) => {
            // Remove existing toast with same id if provided (prevents duplicates)
            const filtered = options.id ? prev.filter(t => t.id !== options.id) : prev;
            return [...filtered, { id, message, type, ...options }];
        });
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
