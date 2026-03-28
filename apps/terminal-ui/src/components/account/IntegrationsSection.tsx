"use client"
import React from "react"
import { Shield, Info } from "lucide-react"
import CloudflareCard from "./integrations/CloudflareCard"
import AppleCard from "./integrations/AppleCard"
import MarketplaceCard from "./integrations/MarketplaceCard"

export default function IntegrationsSection() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header section with terminal aesthetic */}
            <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">External Integrations</h2>
                <p className="text-muted-foreground text-sm mt-1">Manage connections to third-party services and providers.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Security & Encryption</h3>
                    <div className="h-px flex-1 bg-secondary"></div>
                </div>
                <div className="p-4 bg-background border border-white/[0.05] rounded-xl flex items-center justify-between group transition-all shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-foreground/[0.03] flex items-center justify-center border border-white/[0.08]">
                            <Shield className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground uppercase tracking-wider">AES-256-GCM Protection</span>
                            <span className="text-xs text-muted-foreground max-w-xl">
                                Your API tokens and private keys are encrypted at rest. 
                                Decryption only occurs in secure Edge environments during deployment workflow execution.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Connected Services</h3>
                    <div className="h-px flex-1 bg-secondary"></div>
                </div>
                {/* Grid of integration cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CloudflareCard />
                    <AppleCard />
                    <MarketplaceCard />
                </div>
            </div>

            {/* Footer / Helper section */}
            <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-[#222]" />
                    <p className="text-xs text-muted-foreground font-mono tracking-widest leading-none">
                        Missing an integration? Contact our support team.
                    </p>
                </div>
                <button className="px-3 py-1.5 bg-secondary border border-border text-muted-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:text-foreground hover:border-border transition-all">
                    Request Integration
                </button>
            </div>
        </div>
    )
}
