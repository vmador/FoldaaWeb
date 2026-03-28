"use client"
import React, { useState, useEffect } from "react"
import { 
    Shield, Globe, Settings2, AlertCircle, CheckCircle2, 
    ArrowRight, Plus, Loader2, RefreshCw, Copy, ExternalLink,
    Lock, Zap, Server, Trash2, ArrowLeftRight, AlertTriangle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import RouteCard from "./RouteCard"
import DNSDetailsModal from "./modals/DNSDetailsModal"
import AddRouteModal from "./modals/AddRouteModal"
import TransferDomainModal from "./modals/TransferDomainModal"

interface DomainDetailProps {
    domainId: string
    onBack: () => void
}

export default function DomainDetail({ domainId, onBack }: DomainDetailProps) {
    const [domain, setDomain] = useState<any>(null)
    const [routes, setRoutes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [showDNSModal, setShowDNSModal] = useState(false)
    const [showAddRouteModal, setShowAddRouteModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    useEffect(() => {
        fetchDomainDetails()
    }, [domainId])

    const fetchDomainDetails = async () => {
        if (!domainId || domainId === "null" || domainId === "undefined") {
            console.warn("Invalid domainId provided to DomainDetail:", domainId)
            setFetchError("Invalid domain identifier.")
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setFetchError(null)
        console.log("[DomainDetail] Fetching details for domainId:", domainId)
        
        try {
            // Get current session to ensure user is logged in
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setFetchError("Your session has expired. Please log in again.")
                return
            }

            const { data: domainData, error: domainError } = await supabase
                .from("domains")
                .select("*")
                .eq("id", domainId)
                .single()

            if (domainError) {
                if (domainError.code === "PGRST116") {
                    console.warn("[DomainDetail] Domain not found in database:", domainId)
                    setFetchError("This domain could not be found. It may have been deleted or moved to another project.")
                } else {
                    console.error("[DomainDetail] Supabase error (domain):", JSON.stringify(domainError, null, 2))
                    throw domainError
                }
                return
            }

            if (!domainData) {
                setFetchError("The requested domain configuration could be retrieved but is empty.")
                return
            }
            setDomain(domainData)

            const { data: routesData, error: routesError } = await supabase
                .from("domain_routes")
                .select("*")
                .eq("domain_id", domainId)
                .order("pattern", { ascending: true })

            if (routesError) {
                console.error("[DomainDetail] Supabase error (routes):", JSON.stringify(routesError, null, 2))
                throw routesError
            }
            setRoutes(routesData || [])
        } catch (error: any) {
            console.error("[DomainDetail] Caught unexpected error:", error)
            const errorMsg = error.message || error.details || "Failed to load domain configuration"
            setFetchError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async () => {
        setIsVerifying(true)
        // Call edge function to verify domain
        try {
            const { data, error } = await supabase.functions.invoke("verify-domain", {
                body: { domain: domain.domain_name }
            })
            if (error) throw error
            fetchDomainDetails()
        } catch (error) {
            console.error("Verification failed:", error)
            alert("Verification failed. Please check your DNS records.")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to permanently remove ${domain.domain_name}? This action cannot be undone.`)) return
        
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from("domains")
                .delete()
                .eq("id", domainId)
            
            if (error) throw error
            onBack() // Go back to list after deletion
        } catch (error: any) {
            console.error("Error deleting domain:", error)
            alert(error.message || "Failed to delete domain. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[#444] text-sm p-8 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>LOADING_DOMAIN_CONFIG...</span>
            </div>
        )
    }

    if (fetchError || !domain) {
        return (
            <div className="p-8 border border-red-500/10 bg-red-500/5 rounded-lg flex flex-col items-center gap-4 text-center max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500/50" />
                <div className="flex flex-col gap-1">
                    <h3 className="text-white font-bold uppercase tracking-widest text-sm">Domain Error</h3>
                    <p className="text-[#888] text-xs font-mono">
                        {fetchError || "The requested domain configuration could not be found."}
                    </p>
                </div>
                <button 
                    onClick={onBack}
                    className="mt-2 px-4 py-1.5 bg-[#1C1C1E] border border-[#2A2A2E] text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                >
                    Return to List
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Domain Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SSL Status */}
                <div className="p-4 bg-[#1C1C1E] border border-[#2A2A2E] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-[#666] uppercase tracking-wider">SSL Security</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white font-medium text-base">
                            {domain.ssl_status === "active" ? "Encrypted (HTTPS)" : "Unsecured (HTTP)"}
                        </span>
                        <span className="text-xs text-[#444]">
                            {domain.ssl_status === "active" ? "Automatic Let's Encrypt SSL active" : "Waiting for domain verification"}
                        </span>
                    </div>
                </div>

                {/* Verification Status */}
                <div className="p-4 bg-[#1C1C1E] border border-[#2A2A2E] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-[#666] uppercase tracking-wider">Verification</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-medium text-base">
                                {domain.status === "verified" ? "DNS Verified" : "Action Required"}
                            </span>
                            <span className="text-xs text-[#444]">
                                {domain.status === "verified" ? "Propagation complete" : "Records not detected yet"}
                            </span>
                        </div>
                        {domain.status !== "verified" && (
                            <button 
                                onClick={handleVerify}
                                disabled={isVerifying}
                                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Connection Status */}
                <div className="p-4 bg-[#1C1C1E] border border-[#2A2A2E] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Server className="w-4 h-4 text-brand-400" />
                        <span className="text-xs font-bold text-[#666] uppercase tracking-wider">Server Status</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white font-medium text-base">Global Edge</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs text-[#444]">Active across 28 regions</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DNS Configuration Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-2">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-[#444]" />
                        DNS Configuration
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[#888] font-mono">{domain.domain_name}</span>
                        <button 
                            onClick={() => setShowDNSModal(true)}
                            className="text-brand-400 text-xs font-bold hover:underline"
                        >
                            VIEW_RECORDS
                        </button>
                    </div>
                </div>
                
                {domain.status !== "verified" ? (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg flex gap-4">
                        <div className="mt-1">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-amber-200/80 leading-relaxed">
                                Your domain is not yet routing to Foldaa. Please add the required DNS records to your domain provider (GoDaddy, Namecheap, etc.) to activate your custom domain.
                            </p>
                            <button 
                                onClick={() => setShowDNSModal(true)}
                                className="w-fit mt-2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Setup Instructions
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <p className="text-sm text-emerald-200/80">
                            Domain is successfully connected and verified. DNS records are correctly configured.
                        </p>
                    </div>
                )}
            </div>

            {/* Routing Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-2">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#444]" />
                        Routing Rules
                    </h3>
                    <button 
                        onClick={() => setShowAddRouteModal(true)}
                        className="px-2 py-1 bg-[#2A2A2E] hover:bg-[#1A1A1A] text-white border border-[#333336] rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        <Plus className="w-3 h-3 text-brand-400" />
                        Add Rule
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {routes.length > 0 ? (
                        routes.map(route => (
                            <RouteCard 
                                key={route.id} 
                                route={route} 
                                onRefresh={fetchDomainDetails}
                            />
                        ))
                    ) : (
                        <div className="p-6 border border-dashed border-[#2A2A2E] rounded-lg text-center">
                            <p className="text-[#444] text-sm font-mono italic">
                                // No routing rules defined for this domain.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t border-[#2A2A2E]">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h3 className="text-red-500 text-sm font-bold uppercase tracking-widest">Danger Zone</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Transfer Option */}
                        <div className="p-4 bg-black border border-[#2A2A2E] rounded-lg group hover:border-[#444] transition-colors">
                            <div className="flex flex-col gap-1 mb-4">
                                <span className="text-white font-bold text-sm uppercase tracking-wider">Transfer to Project</span>
                                <p className="text-xs text-[#666]">Move this domain and all its rules to another project in your workspace.</p>
                            </div>
                            <button 
                                onClick={() => setShowTransferModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2E] text-white rounded text-xs font-bold uppercase tracking-widest hover:border-brand-500/50 transition-all"
                            >
                                <ArrowLeftRight className="w-3.5 h-3.5 text-brand-400" />
                                Initiate Transfer
                            </button>
                        </div>

                        {/* Delete Option */}
                        <div className="p-4 bg-black border border-[#2A2A2E] rounded-lg">
                            <div className="flex flex-col gap-1 mb-4">
                                <span className="text-red-500 font-bold text-sm uppercase tracking-wider">Remove Domain</span>
                                <p className="text-xs text-[#666]">Disconnect this domain from your account. This will stop all active traffic.</p>
                            </div>
                            <button 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/10 text-red-500 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isDeleting ? "REMOVING..." : "REMOVE_DOMAIN"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showDNSModal && (
                <DNSDetailsModal 
                    domain={domain} 
                    onClose={() => setShowDNSModal(false)} 
                />
            )}
            
            {showAddRouteModal && (
                <AddRouteModal 
                    domainId={domainId}
                    projectId={domain.project_id}
                    onClose={() => setShowAddRouteModal(false)}
                    onSuccess={() => {
                        setShowAddRouteModal(false)
                        fetchDomainDetails()
                    }}
                />
            )}

            {showTransferModal && (
                <TransferDomainModal 
                    domainId={domainId}
                    currentProjectId={domain.project_id}
                    domainName={domain.domain_name}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={() => {
                        setShowTransferModal(false)
                        onBack() // Go back to list as it's no longer in this project
                    }}
                />
            )}
        </div>
    )
}
