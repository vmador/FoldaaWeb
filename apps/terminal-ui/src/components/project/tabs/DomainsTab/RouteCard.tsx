"use client"
import React, { useState } from "react"
import { MoreVertical, Edit2, Trash2, Power, Globe, ArrowRight, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import EditRouteModal from "./modals/EditRouteModal"

interface RouteCardProps {
    route: any
    onRefresh: () => void
}

export default function RouteCard({ route, onRefresh }: RouteCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    const handleToggle = async () => {
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("domain_routes")
                .update({ is_enabled: !route.is_enabled })
                .eq("id", route.id)
            
            if (error) throw error
            
            // Sync with Cloudflare
            await supabase.functions.invoke('deploy-project', {
                body: { project_id: route.project_id }
            })

            onRefresh()
        } catch (error) {
            console.error("Error toggling route:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete the route for ${route.pattern}?`)) return
        
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("domain_routes")
                .delete()
                .eq("id", route.id)
            
            if (error) throw error
            
            // Sync with Cloudflare
            await supabase.functions.invoke('deploy-project', {
                body: { project_id: route.project_id }
            })

            onRefresh()
        } catch (error) {
            console.error("Error deleting route:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div 
            className={`p-3 bg-black border rounded-lg transition-all group ${
                route.is_enabled ? "border-[#2A2A2E] hover:border-[#333336]" : "border-[#2A2A2E] opacity-60"
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${
                        route.is_enabled ? "bg-brand-500/5 border-brand-500/20 text-brand-400" : "bg-[#2A2A2E] border-[#333336] text-[#444]"
                    }`}>
                        <Globe className="w-4 h-4" />
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-white">{route.pattern || "/"}</span>
                            <ArrowRight className="w-3 h-3 text-[#333]" />
                            <span className="text-sm font-mono text-[#888]">Bound to Project Worker</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${route.is_enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-[#333]"}`} />
                            <span className="text-xs font-bold text-[#444] uppercase tracking-widest">
                                {route.is_enabled ? "ACTIVE_ROUTING" : "DISABLED"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleToggle}
                        disabled={isUpdating}
                        className={`p-1.5 rounded transition-colors ${
                            route.is_enabled 
                                ? "text-[#444] hover:text-amber-400 hover:bg-amber-500/10" 
                                : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        }`}
                        title={route.is_enabled ? "Disable Route" : "Enable Route"}
                    >
                        <Power className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 hover:bg-[#2A2A2E] rounded text-[#444] hover:text-white transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-36 bg-[#1C1C1E] border border-[#2A2A2E] rounded-md shadow-2xl z-20 py-1 overflow-hidden">
                                    <button 
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            setShowEditModal(true)
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#AAA] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            handleDelete()
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <EditRouteModal 
                    route={route}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false)
                        onRefresh()
                    }}
                />
            )}
        </div>
    )
}
