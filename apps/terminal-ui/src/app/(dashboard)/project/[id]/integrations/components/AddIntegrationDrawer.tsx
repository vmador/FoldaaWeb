"use client";

import React, { useState } from "react";
import { X, Plus, Search, MessageSquare, Mail, Webhook, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface IntegrationType {
    id: string;
    name: string;
    display_name: string;
    description: string;
}

interface AddIntegrationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    availableTypes: IntegrationType[];
    onInstall: (typeId: string) => void;
    isInstalling: boolean;
}

export default function AddIntegrationDrawer({
    isOpen,
    onClose,
    availableTypes,
    onInstall,
    isInstalling
}: AddIntegrationDrawerProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTypes = availableTypes.filter(type => 
        (type?.display_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (type?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const getIcon = (name: string) => {
        switch ((name || '').toLowerCase()) {
            case 'onesignal': return <MessageSquare className="w-4 h-4 text-orange-500" />;
            case 'resend': return <Mail className="w-4 h-4 text-sky-500" />;
            case 'webhook': return <Webhook className="w-4 h-4 text-emerald-500" />;
            default: return <Plus className="w-4 h-4 text-muted-foreground" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div 
                className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-sm bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background/40">
                    <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-brand-500/60" />
                        <span className="text-xs font-bold text-foreground tracking-widest uppercase font-mono">
                            INSTALL_PLUGIN
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-border bg-background/20">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-brand-500/50 transition-colors" />
                        <input 
                            type="text"
                            placeholder="SEARCH_REGISTRY"
                            className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-4 text-xs text-[#A0A0A0] font-mono focus:outline-none focus:border-brand-500/30 transition-colors uppercase placeholder:text-[#333]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                    {filteredTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-xs font-mono italic">- NO_MATCHES -</p>
                        </div>
                    ) : (
                        filteredTypes.map((type) => (
                            <div 
                                key={type.id}
                                className="group flex items-center justify-between border border-border bg-card/40 p-4 rounded-md hover:border-[#2C5251] hover:bg-[#244544]/5 transition-all cursor-pointer active:scale-[0.98]"
                                onClick={() => onInstall(type.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-[#2C5251] transition-colors shadow-inner">
                                        {getIcon(type.name)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-bold text-xs group-hover:text-[#A6D1D1] transition-colors uppercase tracking-tight">{type.display_name}</span>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-tight mt-0.5">
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#2C5251] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Metadata */}
                <div className="p-4 border-t border-border bg-background/20">
                    <div className="flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold">Registry Status</div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-mono">CONNECTION_STATUS</span>
                            <span className="text-xs text-green-500 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ONLINE
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-mono">ENTRIES_COUNT</span>
                            <span className="text-xs text-foreground font-mono">{availableTypes.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Scanline Effect Overlay (Subtle) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-20 pointer-events-none z-[60]" />
        </div>
    );
}
