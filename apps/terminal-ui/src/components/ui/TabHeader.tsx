"use client"
import React from 'react';
import clsx from 'clsx';
import { Loader2, LucideIcon, ChevronLeft } from 'lucide-react';

export interface TabHeaderAction {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    loading?: boolean;
    disabled?: boolean;
    shortcut?: string;
    variant?: 'primary' | 'secondary' | 'danger';
}

export interface TabHeaderProps {
    title: string;
    description?: string;
    action?: TabHeaderAction;
    secondaryAction?: TabHeaderAction;
    backAction?: {
        onClick: () => void;
    };
    customActionContent?: React.ReactNode;
}

export function TabHeader({ title, description, action, secondaryAction, backAction, customActionContent }: TabHeaderProps) {
    const renderButton = (btn: TabHeaderAction) => {
        const isPrimary = btn.variant === 'primary' || !btn.variant;
        const isDanger = btn.variant === 'danger';
        
        return (
            <button
                key={btn.label}
                onClick={btn.onClick}
                disabled={btn.disabled || btn.loading}
                className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded transition-all disabled:opacity-50",
                    isPrimary ? "bg-[#111] hover:bg-[#1A1A1A] border border-[#333] hover:border-fuchsia-500/30 text-white" :
                    isDanger ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500" :
                    "bg-[#2A2A2E] hover:bg-[#1A1A1A] border border-[#333336] text-[#666] hover:text-[#888]"
                )}
            >
                {btn.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : btn.icon && <btn.icon className="w-3 h-3" />}
                <span className="text-xs font-bold whitespace-nowrap">{btn.label}</span>
                {btn.shortcut && (
                    <span className="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs font-mono opacity-40 lowercase">
                        {btn.shortcut}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="flex items-center justify-between h-[44.5px] px-3 -mx-3 border-b border-[#2A2A2E] bg-black/40 backdrop-blur-sm sticky top-0 z-30 mb-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {backAction && (
                        <button 
                            onClick={backAction.onClick}
                            className="p-1 hover:bg-[#2A2A2E] rounded text-[#666] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <h2 className="text-white font-bold text-sm tracking-tight">{title}</h2>
                </div>
                {description && (
                    <span className="text-xs text-[#666] font-medium border-l border-[#333336] pl-3 h-4 flex items-center">
                        {description}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {customActionContent}
                {secondaryAction && renderButton(secondaryAction)}
                {action && renderButton(action)}
            </div>
        </div>
    );
}
