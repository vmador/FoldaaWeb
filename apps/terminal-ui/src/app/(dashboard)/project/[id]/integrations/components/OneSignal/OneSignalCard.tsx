"use client";

import React, { useState } from "react";
import { 
    Power, 
    Trash2, 
    Check, 
    Square,
    MessageSquare,
    Send,
    ExternalLink,
    Activity,
    Settings
} from "lucide-react";
import { clsx } from "clsx";

interface OneSignalCardProps {
    integration: {
        id: string;
        is_enabled: boolean;
        config: {
            app_id?: string;
            api_key?: string;
        };
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

export default function OneSignalCard({ 
    integration, 
    onToggle, 
    onDelete, 
    onConfigure 
}: OneSignalCardProps) {
    const { integration_types: type, is_enabled: isEnabled, config } = integration;
    const hasAppId = !!config?.app_id;

    return (
        <div className="flex flex-col gap-2 group">
            <div className="flex flex-col border border-[#2A2A2E] bg-[#1C1C1E] rounded overflow-hidden hover:border-[#333] transition-colors shadow-sm">
                {/* Main Header */}
                <div className="flex items-center justify-between p-3 border-b border-[#2A2A2E]">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            {isEnabled ? (
                                <Check className="w-4 h-4 text-brand-500 font-bold" />
                            ) : (
                                <Square className="w-4 h-4 text-[#444]" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold truncate uppercase tracking-tight">{type.display_name}</span>
                                <span className="text-xs text-[#444] font-mono whitespace-nowrap border border-[#2A2A2E] px-1 rounded uppercase tracking-tighter">Push</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onToggle(integration.id, !isEnabled)}
                            className={clsx(
                                "text-xs font-bold px-3 py-1.5 rounded-md transition-colors border uppercase tracking-wider",
                                isEnabled 
                                ? "bg-[#1C1C1E] hover:bg-[#2A2A2E] text-[#D8D8D8] border-[#2A2A2E]" 
                                : "bg-[#244544] hover:bg-[#2C5251] text-[#A6D1D1] border-[#2C5251]"
                            )}
                        >
                            {isEnabled ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                            onClick={() => onConfigure(integration)}
                            className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#1C1C1E] hover:bg-[#2A2A2E] text-[#D8D8D8] transition-colors border border-[#2A2A2E] uppercase tracking-wider"
                        >
                            Configure
                        </button>
                        <button 
                            onClick={() => onDelete(integration.id)}
                            className="text-[#444] hover:text-red-400 transition-colors p-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Body / Details */}
                <div className="p-3 bg-black/20 flex flex-col gap-3">
                    <p className="text-xs text-[#666] leading-relaxed">
                        {type.description}
                    </p>

                    {isEnabled && hasAppId && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2A2A2E]">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-[#444] uppercase tracking-widest flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> App ID
                                </span>
                                <span className="text-[#888]">{config.app_id}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <button 
                                    className="text-xs text-[#D8D8D8] hover:bg-[#2A2A2E] transition-colors flex items-center gap-1 bg-[#1C1C1E] px-2 py-1 rounded border border-[#2A2A2E]"
                                    onClick={() => window.open(`https://dashboard.onesignal.com/apps/${config.app_id}`, '_blank')}
                                >
                                    <ExternalLink className="w-3 h-3" /> DASHBOARD
                                </button>
                                <button 
                                    className="text-xs text-[#A6D1D1] hover:bg-[#2C5251] transition-colors flex items-center gap-1 bg-[#244544] px-2 py-1 rounded border border-[#2C5251]"
                                >
                                    <Send className="w-3 h-3" /> TEST_PUSH
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="px-3 flex items-center justify-between text-xs font-mono text-[#333]">
                <span>UUID: {integration.id}</span>
                {hasAppId ? (
                    <span className="text-emerald-900 uppercase tracking-tighter flex items-center gap-1">
                        <Check className="w-2 h-2" /> Configured
                    </span>
                ) : (
                    <span className="text-orange-900 uppercase tracking-tighter">Setup Required</span>
                )}
            </div>
        </div>
    );
}
