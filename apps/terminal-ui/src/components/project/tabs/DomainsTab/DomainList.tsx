"use client"
import React from "react"
import { Globe, AlertCircle, CheckCircle2, MoreVertical, ExternalLink } from "lucide-react"
import DomainRow from "./DomainRow"

interface DomainListProps {
    domains: any[]
    onViewDetail: (id: string) => void
    onRefresh: () => void
}

export default function DomainList({ domains, onViewDetail, onRefresh }: DomainListProps) {
    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-[#2A2A2E] rounded-xl bg-black">
                <div className="w-12 h-12 rounded-full bg-[#2A2A2E] flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-[#333]" />
                </div>
                <h3 className="text-white font-medium mb-1">No domains connected</h3>
                <p className="text-[#666] text-sm text-center max-w-[300px] mb-6">
                    Connect a custom domain to your project to make it available to the world under your own brand.
                </p>
                <button
                    onClick={() => (window as any).dispatchEvent(new CustomEvent('open-add-domain'))}
                    className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest hover:text-fuchsia-300 transition-colors"
                >
                    ADD_FIRST_DOMAIN
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-px bg-[#2A2A2E] border border-[#2A2A2E] rounded-lg [&>*:last-child]:rounded-b-lg">
            <div className="grid grid-cols-[1fr_120px_180px_100px_48px] items-center gap-4 px-4 py-2 bg-[#1C1C1E] text-xs font-bold text-[#444] uppercase tracking-wider rounded-t-lg">
                <div>Domain</div>
                <div>Status</div>
                <div>Project</div>
                <div>Created</div>
                <div className="text-right">Action</div>
            </div>
            
            {domains.map((domain) => (
                <DomainRow 
                    key={domain.id} 
                    domain={domain} 
                    onViewDetail={onViewDetail}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    )
}
