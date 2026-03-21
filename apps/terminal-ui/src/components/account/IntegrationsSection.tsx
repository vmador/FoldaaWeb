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
                <h2 className="text-lg font-semibold text-white tracking-tight">External Integrations</h2>
                <p className="text-[#666] text-sm mt-1">Manage connections to third-party services and providers.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-[#444] uppercase tracking-widest pl-1">Security & Encryption</h3>
                    <div className="h-px flex-1 bg-[#2A2A2E]"></div>
                </div>
                <div className="p-4 bg-black border border-fuchsia-500/10 rounded-xl flex items-center justify-between group transition-all shadow-xl shadow-fuchsia-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
                            <Shield className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">AES-256-GCM Protection</span>
                            <span className="text-xs text-[#444] max-w-xl">
                                Your API tokens and private keys are encrypted at rest. 
                                Decryption only occurs in secure Edge environments during deployment workflow execution.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-[#444] uppercase tracking-widest pl-1">Connected Services</h3>
                    <div className="h-px flex-1 bg-[#2A2A2E]"></div>
                </div>
                {/* Grid of integration cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CloudflareCard />
                    <AppleCard />
                    <MarketplaceCard />
                </div>
            </div>

            {/* Footer / Helper section */}
            <div className="p-4 bg-black border border-[#2A2A2E] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-[#222]" />
                    <p className="text-xs text-[#444] font-mono tracking-widest leading-none">
                        Missing an integration? Contact our support team.
                    </p>
                </div>
                <button className="px-3 py-1.5 bg-[#2A2A2E] border border-[#333336] text-[#666] rounded-lg text-xs font-bold uppercase tracking-widest hover:text-white hover:border-[#333] transition-all">
                    Request Integration
                </button>
            </div>
        </div>
    )
}
