"use client"
import React, { useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { X, ArrowRight, Loader2, Link2, Info, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AddRouteModalProps {
    domainId: string
    onClose: () => void
    onSuccess: () => void
}

export default function AddRouteModal({ domainId, onClose, onSuccess }: AddRouteModalProps) {
    const [path, setPath] = useState("/")
    const [targetPort, setTargetPort] = useState("3000")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAdd = async () => {
        if (!path || !targetPort) return
        setError(null)
        setIsSubmitting(true)

        try {
            // Validation
            if (!path.startsWith("/")) {
                throw new Error("Path must start with /")
            }

            const portNum = parseInt(targetPort)
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                throw new Error("Invalid target port (1-65535)")
            }

            const { error: insertError } = await supabase
                .from("domain_routes")
                .insert({
                    domain_id: domainId,
                    path: path,
                    target_port: portNum,
                    is_active: true
                })

            if (insertError) {
                if (insertError.code === "23505") {
                    throw new Error("A route with this path already exists for this domain.")
                }
                throw insertError
            }
            
            onSuccess()
        } catch (err: any) {
            setError(err.message || "Failed to add route")
        } finally {
            setIsSubmitting(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-black border border-[#2A2A2E] rounded-xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2A2A2E] flex items-center justify-center border border-[#2A2A2E]">
                            <Link2 className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Add Routing Rule</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#2A2A2E] rounded-md text-[#444] hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                             <label className="text-xs font-bold text-[#666] uppercase tracking-wider">Public Path</label>
                             <div className="relative">
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="/"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    className="w-full bg-[#1C1C1E] border border-[#2A2A2E] rounded-md px-4 py-3 text-white text-base focus:outline-none focus:border-fuchsia-500/50 transition-colors font-mono"
                                />
                             </div>
                             <p className="text-xs text-[#444]">The external URL path (e.g. /, /api, /blog)</p>
                        </div>

                        <div className="flex flex-col gap-2">
                             <label className="text-xs font-bold text-[#666] uppercase tracking-wider">Internal Port</label>
                             <input 
                                type="text"
                                placeholder="3000"
                                value={targetPort}
                                onChange={(e) => setTargetPort(e.target.value)}
                                className="w-full bg-[#1C1C1E] border border-[#2A2A2E] rounded-md px-4 py-3 text-white text-base focus:outline-none focus:border-fuchsia-500/50 transition-colors font-mono"
                             />
                             <p className="text-xs text-[#444]">The port where your application is running inside the container.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-red-400">{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-[#666] hover:text-white text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAdd}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                            CREATE_RULE
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}
