"use client"
import React, { useState } from "react"
import { MoreVertical, ExternalLink, CheckCircle2, Clock, AlertTriangle, Trash2, Link2, Unlink } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

interface DomainRowProps {
    domain: any
    onViewDetail: (id: string) => void
    onRefresh: () => void
}

export default function DomainRow({ domain, onViewDetail, onRefresh }: DomainRowProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "verified":
                return {
                    icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
                    text: "VERIFIED",
                    bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }
            case "pending":
                return {
                    icon: <Clock className="w-3 h-3 text-amber-400" />,
                    text: "PENDING",
                    bg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
            case "failed":
            case "error":
                return {
                    icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
                    text: "ERROR",
                    bg: "bg-red-500/10 text-red-400 border-red-500/20"
                }
            default:
                return {
                    icon: <div className="w-1.5 h-1.5 rounded-full bg-[#444]" />,
                    text: "UNVERIFIED",
                    bg: "bg-[#2A2A2E] text-[#666] border-[#333336]"
                }
        }
    }

    const state = getStatusStyles(domain.status)

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to remove ${domain.domain_name}?`)) return
        
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from("domains")
                .delete()
                .eq("id", domain.id)
            
            if (error) throw error
            onRefresh()
        } catch (error) {
            console.error("Error deleting domain:", error)
            alert("Failed to delete domain. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div 
            className="grid grid-cols-[1fr_120px_180px_100px_48px] items-center gap-4 px-4 py-3 bg-black hover:bg-black transition-colors border-t border-[#2A2A2E] group"
        >
            {/* Domain Name */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#1C1C1E] border border-[#2A2A2E] flex items-center justify-center group-hover:border-fuchsia-500/30 transition-colors">
                    <span className="text-xs font-bold text-[#444] group-hover:text-fuchsia-400 capitalize">
                        {domain.domain_name?.charAt(0) || "D"}
                    </span>
                </div>
                <div className="flex flex-col">
                    <button 
                        onClick={() => onViewDetail(domain.id)}
                        className="text-sm font-medium text-white hover:text-fuchsia-400 transition-colors text-left truncate max-w-[200px]"
                    >
                        {domain.domain_name}
                    </button>
                    {domain.is_primary && (
                        <span className="text-xs font-bold text-fuchsia-400 tracking-widest uppercase">Primary</span>
                    )}
                </div>
            </div>

            {/* Status */}
            <div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${state.bg} text-xs font-bold tracking-wider`}>
                    {state.icon}
                    {state.text}
                </div>
            </div>

            {/* Project */}
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#2A2A2E] border border-[#2A2A2E] flex items-center justify-center">
                   <Link2 className="w-2.5 h-2.5 text-[#444]" />
                </div>
                <span className="text-xs text-[#888] truncate">
                    {domain.project_name || "Internal Proxy"}
                </span>
            </div>

            {/* Date */}
            <div className="text-xs text-[#444] font-mono">
                {format(new Date(domain.created_at), "MMM d, yyyy")}
            </div>

            {/* Action Menu */}
            <div className="text-right relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 hover:bg-[#2A2A2E] rounded text-[#444] hover:text-white transition-colors"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1C1C1E] border border-[#2A2A2E] rounded-md shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    onViewDetail(domain.id)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#AAA] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Details
                            </button>
                            <div className="h-px bg-[#2A2A2E] my-1" />
                            <button 
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    handleDelete()
                                }}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isDeleting ? "Removing..." : "Remove Domain"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
