"use client"
import React from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { X, Copy, Info, CheckCircle2, Globe, Server } from "lucide-react"

interface DNSDetailsModalProps {
    domain: any
    onClose: () => void
}

export default function DNSDetailsModal({ domain, onClose }: DNSDetailsModalProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const isSubdomain = domain.domain_name.split('.').length > 2 && !domain.domain_name.startsWith('www.')

    const records = isSubdomain ? [
        { type: "CNAME", host: domain.domain_name.split('.')[0], value: "cname.foldaa.com", ttl: "60" }
    ] : [
        { type: "A", host: "@", value: "76.76.21.21", ttl: "60" },
        { type: "CNAME", host: "www", value: "foldaa.com", ttl: "60" }
    ]

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl bg-black border border-[#2A2A2E] rounded-xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2A2A2E] flex items-center justify-center border border-[#2A2A2E]">
                            <Server className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm">DNS Configuration</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#2A2A2E] rounded-md text-[#444] hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="p-4 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-lg flex gap-3">
                        <Info className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-fuchsia-200/70 leading-relaxed">
                            To activate <span className="text-white font-bold">{domain.domain_name}</span>, update your DNS records at your domain registrar (e.g. GoDaddy, Namecheap, Cloudflare) with the values below.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-[80px_1fr_1fr_60px_40px] gap-2 px-3 text-xs font-bold text-[#444] uppercase tracking-widest">
                            <div>Type</div>
                            <div>Name</div>
                            <div>Value</div>
                            <div>TTL</div>
                            <div></div>
                        </div>

                        {records.map((record, i) => (
                            <div key={i} className="grid grid-cols-[80px_1fr_1fr_60px_40px] items-center gap-2 p-3 bg-[#1C1C1E] border border-[#2A2A2E] rounded group hover:border-fuchsia-500/30 transition-colors">
                                <div className="text-xs font-bold text-fuchsia-400 font-mono">{record.type}</div>
                                <div className="text-xs text-white font-mono truncate">{record.host}</div>
                                <div className="text-xs text-white font-mono truncate">{record.value}</div>
                                <div className="text-xs text-[#444] font-mono">{record.ttl}</div>
                                <button 
                                    onClick={() => copyToClipboard(record.value)}
                                    className="p-1.5 hover:bg-[#2A2A2E] rounded text-[#333] hover:text-fuchsia-400 transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-[#666] uppercase tracking-wider">Verification Status</h4>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#2A2A2E] rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${domain.status === "verified" ? "w-full bg-emerald-500" : "w-1/3 bg-amber-500"}`}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#444] uppercase tracking-widest min-w-[80px] text-right">
                                {domain.status === "verified" ? "CONNECTED" : "PROPAGATING"}
                            </span>
                        </div>
                        <p className="text-xs text-[#333] italic">
                            // DNS propagation can take anywhere from a few minutes to 48 hours depending on your registrar.
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-xs rounded transition-transform active:scale-[0.98] hover:bg-[#EEE]"
                        >
                            FINISH_SETUP
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}
