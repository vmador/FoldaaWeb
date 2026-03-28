"use client"
import React, { useEffect, useState } from 'react';
import { X, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = "max-w-lg"
}) => {
    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={clsx(
                            "relative w-full bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden",
                            maxWidth
                        )}
                    >
                        {/* Header */}
                         <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-brand-500/80" />
                                <span className="text-xs font-bold text-foreground tracking-widest uppercase font-mono">
                                    {title}
                                </span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-6 py-4 border-t border-border bg-background/20 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                        
                        {/* Scanline Effect Overlay (Subtle) */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-20" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
