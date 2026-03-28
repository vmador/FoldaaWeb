"use client";

import React from "react";
import { Power, Settings, Trash2, Check, Square } from "lucide-react";
import clsx from "clsx";

interface IntegrationCardProps {
    integration: {
        id: string;
        is_enabled: boolean;
        config: any;
        integration_types: {
            name: string;
            display_name: string;
            description: string;
        };
    };
    onToggle: (id: string, enabled: boolean) => void;
    onDelete: (id: string) => void;
    onConfigure: (integration: any) => void;
}

export function IntegrationCard({ 
    integration, 
    onToggle, 
    onDelete, 
    onConfigure 
}: IntegrationCardProps) {
    const { integration_types: type, is_enabled: isEnabled } = integration;

    return (
        <div className="flex flex-col gap-2 group">
            <div className="flex items-center justify-between border border-border bg-card p-3 rounded hover:border-border transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        {isEnabled ? (
                            <Check className="w-4 h-4 text-brand-500 font-bold" />
                        ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold truncate uppercase tracking-tight">{type.display_name}</span>
                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap border border-border px-1 rounded uppercase">{type.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">{type.description}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                    <button 
                        onClick={() => onToggle(integration.id, !isEnabled)}
                        className={clsx(
                            "text-xs font-bold px-3 py-1.5 rounded-md transition-colors border uppercase tracking-wider",
                            isEnabled 
                            ? "bg-card hover:bg-secondary text-foreground border-border" 
                            : "bg-[#244544] hover:bg-[#2C5251] text-[#A6D1D1] border-[#2C5251]"
                        )}
                    >
                        {isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                        onClick={() => onConfigure(integration)}
                        className="text-xs font-bold px-3 py-1.5 rounded-md bg-card hover:bg-secondary text-foreground transition-colors border border-border uppercase tracking-wider"
                    >
                        Configure
                    </button>
                    <button 
                        onClick={() => onDelete(integration.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            
            <div className="px-3 flex items-center justify-between text-xs font-mono text-[#333]">
                <span>UUID: {integration.id}</span>
                {isEnabled && <span className="text-brand-900 uppercase tracking-tighter">Running</span>}
            </div>
        </div>
    );
}
