"use client"
import React, { useState, useEffect } from "react"
import { 
    Search, Loader2, ArrowRight, CheckCircle2, 
    AlertCircle, Globe, Terminal, Layout
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { TerminalModal } from "@/components/ui/TerminalModal"

interface TransferDomainModalProps {
    domainId: string
    currentProjectId: string
    domainName: string
    onClose: () => void
    onSuccess: () => void
}

export default function TransferDomainModal({ 
    domainId, 
    currentProjectId, 
    domainName,
    onClose, 
    onSuccess 
}: TransferDomainModalProps) {
    const [projects, setProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [isTransferring, setIsTransferring] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No authenticated user found")

            const { data, error } = await supabase
                .from("projects")
                .select("id, name, subdomain")
                .eq("user_id", user.id)
                .neq("id", currentProjectId)
                .order("name", { ascending: true })

            if (error) throw error
            setProjects(data || [])
        } catch (err: any) {
            console.error("Error fetching projects for transfer:", err)
            setError(err.message || "Failed to load projects")
        } finally {
            setIsLoading(false)
        }
    }

    const handleTransfer = async () => {
        if (!selectedProjectId) return
        
        setIsTransferring(true)
        setError(null)
        
        try {
            // 1. Update the domain record
            const { error: domainError } = await supabase
                .from("domains")
                .update({ project_id: selectedProjectId })
                .eq("id", domainId)

            if (domainError) throw domainError

            // 2. Update all associated routes
            const { error: routesError } = await supabase
                .from("domain_routes")
                .update({ project_id: selectedProjectId })
                .eq("domain_id", domainId)

            if (routesError) throw routesError

            onSuccess()
        } catch (err: any) {
            console.error("Transfer failed:", err)
            setError(err.message || "Failed to transfer domain")
        } finally {
            setIsTransferring(false)
        }
    }

    const filteredProjects = projects.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <TerminalModal 
            isOpen={true} 
            onClose={onClose} 
            title="TRANSFER_DOMAIN"
            maxWidth="max-w-md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#666] hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleTransfer}
                        disabled={!selectedProjectId || isTransferring}
                        className="px-6 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-50 text-white rounded text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.3)]"
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                TRANSFERRING...
                            </>
                        ) : (
                            <>
                                <ArrowRight className="w-3.5 h-3.5" />
                                CONFIRM_TRANSFER
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Warning Header */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Warning</span>
                        <p className="text-[11px] text-amber-200/60 leading-relaxed font-mono">
                            Transferring <span className="text-amber-300">"{domainName}"</span> will immediately stop traffic to the current project workers.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-widest ml-1">
                        Select Destination Project
                    </label>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                        <input 
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1C1C1E] border border-[#2A2A2E] rounded py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors placeholder:text-[#333]"
                        />
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#444]">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-[10px] font-mono uppercase tracking-widest">Scanning_Projects...</span>
                            </div>
                        ) : filteredProjects.length > 0 ? (
                            filteredProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProjectId(project.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                                        selectedProjectId === project.id 
                                            ? 'bg-brand-500/10 border-brand-500/50' 
                                            : 'bg-black/20 border-[#2A2A2E] hover:border-[#444]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className={`p-2 rounded ${selectedProjectId === project.id ? 'bg-brand-500/20' : 'bg-[#1C1C1E]'}`}>
                                            <Layout className={`w-4 h-4 ${selectedProjectId === project.id ? 'text-brand-400' : 'text-[#666]'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white">{project.name}</span>
                                            <span className="text-[10px] text-[#444] font-mono">{project.subdomain}.foldaa.com</span>
                                        </div>
                                    </div>
                                    {selectedProjectId === project.id && (
                                        <CheckCircle2 className="w-4 h-4 text-brand-400" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#444] border border-dashed border-[#2A2A2E] rounded">
                                <span className="text-[10px] font-mono uppercase tracking-widest italic">// No_Matching_Projects</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded flex gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-400 font-mono">{error}</p>
                    </div>
                )}
            </div>
        </TerminalModal>
    )
}
