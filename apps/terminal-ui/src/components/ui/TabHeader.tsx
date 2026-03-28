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
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 group border",
                    isPrimary ? "bg-background hover:bg-secondary border-foreground/12 hover:border-foreground/20 text-foreground" :
                    isDanger ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500" :
                    "bg-secondary hover:bg-secondary/80 border-foreground/12 text-muted-foreground hover:text-foreground"
                )}
            >
                {btn.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin border border-foreground/12 rounded-sm p-0.5" />
                ) : btn.icon ? (
                    <btn.icon className={clsx("w-4 h-4 border rounded-sm p-0.5 transition-colors", 
                        isPrimary ? "border-foreground/12 group-hover:border-muted-foreground/40" : "border-transparent" 
                    )} />
                ) : null}
                <span className="text-sm font-medium whitespace-nowrap">{btn.label}</span>
                {btn.shortcut && (
                    <span className="ml-1 px-1 py-0.5 bg-background/20 rounded text-xs font-mono opacity-40 lowercase">
                        {btn.shortcut}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="flex items-center justify-between h-[44.5px] px-3 -mx-3 border-b border-neutral-200 backdrop-blur-sm sticky top-0 z-30 mb-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {backAction && (
                        <button 
                            onClick={backAction.onClick}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <h2 className="text-foreground font-bold text-sm tracking-tight">{title}</h2>
                </div>
                {description && (
                    <span className="text-xs text-muted-foreground font-medium border-l border-foreground/12 pl-3 h-4 flex items-center">
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
