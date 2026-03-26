"use client"
import React, { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUserProfile } from "@/lib/hooks/useUserProfile"

interface AddDomainWizardProps {
    projectId: string
    onClose: () => void
    onSuccess: () => void
}

export default function AddDomainWizard({ projectId, onClose, onSuccess }: AddDomainWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [domain, setDomain] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newDomainId, setNewDomainId] = useState<string | null>(null)
    const [hasCloudflare, setHasCloudflare] = useState(false)
    const [isAutomating, setIsAutomating] = useState(false)
    const [nameServers, setNameServers] = useState<string[]>([])
    const { profile } = useUserProfile()

    React.useEffect(() => {
        const checkCloudflare = async () => {
            if (!profile?.id) return
            const { data } = await supabase
                .from("cloudflare_credentials")
                .select("id")
                .eq("user_id", profile.id)
                .single()
            setHasCloudflare(!!data)
        }
        checkCloudflare()
    }, [profile?.id])

    const handleAdd = async () => {
        if (!domain) return
        setError(null)
        setIsSubmitting(true)

        try {
            // Basic validation
            const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
            if (!domainRegex.test(domain)) {
                throw new Error("Invalid domain format. Use example.com or app.example.com")
            }

            const { data, error: insertError } = await supabase
                .from("domains")
                .insert({
                    project_id: projectId,
                    user_id: profile?.id,
                    domain_name: domain.toLowerCase(),
                    status: "pending",
                    ssl_status: "pending"
                })
                .select()
                .single()

            if (insertError) throw insertError
            
            setNewDomainId(data.id)
            setStep(2)
        } catch (err: any) {
            setError(err.message || "Failed to add domain")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAutomatedSetup = async () => {
        if (!newDomainId || !domain) return
        setIsAutomating(true)
        setError(null)

        try {
            const { data, error: setupError } = await supabase.functions.invoke("setup-domain-dns", {
                body: { domain, domain_id: newDomainId }
            })

            if (setupError) throw setupError

            if (data && data.success === false) {
                throw new Error(data.error || "Unknown Edge Function Error")
            }

            // Trigger verification in background
            supabase.functions.invoke("verify-domain", {
                body: { domain }
            })

            if (data?.name_servers && data.name_servers.length > 0) {
                setNameServers(data.name_servers)
                setStep(3)
            } else {
                onSuccess()
            }
        } catch (err: any) {
            setError(err.message || "Automated setup failed. Please try manual configuration.")
        } finally {
            setIsAutomating(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg bg-black border border-[#2A2A2E] rounded-xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                            <Globe className="w-4 h-4 text-brand-400" />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Add Custom Domain</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#2A2A2E] rounded-md text-[#444] hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-[#666] uppercase tracking-wider">Domain Name</label>
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="example.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full bg-[#1C1C1E] border border-[#2A2A2E] rounded-md px-4 py-3 text-white text-base focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                                />
                                <p className="text-xs text-[#444] leading-relaxed">
                                    You can use root domains (example.com) or subdomains (app.example.com).
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-400">{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-2 text-[#666] hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAdd}
                                    disabled={!domain || isSubmitting}
                                    className="px-6 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                    CONTINUE
                                </button>
                            </div>
                        </div>
                    ) : step === 2 ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center gap-2 mb-2">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg">Domain Added!</h4>
                                <p className="text-sm text-[#666] max-w-[320px]">
                                    {domain} has been registered. Now you need to configure your DNS records.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-400">{error}</span>
                                </div>
                            )}

                            <div className="p-4 bg-[#1C1C1E] border border-[#2A2A2E] rounded-lg flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-[#444] uppercase tracking-widest">A Record</span>
                                    <div className="flex items-center justify-between bg-black border border-[#2A2A2E] px-3 py-2 rounded font-mono text-sm">
                                        <span className="text-brand-400">76.76.21.21</span>
                                        <button onClick={() => copyToClipboard("76.76.21.21")} className="p-1 hover:text-white text-[#444] transition-colors"><Copy className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                                <p className="text-xs text-[#444] leading-relaxed italic">
                                    // Point your root domain to our edge network by adding this A record in your DNS provider settings.
                                </p>
                                
                                {hasCloudflare && (
                                    <div className="mt-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                                            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Cloudflare Detected</span>
                                        </div>
                                        <p className="text-[11px] text-[#666]">
                                            We can automatically configure your DNS records using your connected Cloudflare account.
                                        </p>
                                        <button 
                                            onClick={handleAutomatedSetup}
                                            disabled={isAutomating}
                                            className="w-full py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 rounded text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isAutomating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                                            {isAutomating ? "CONFIGURING..." : "SETUP_AUTOMATICALLY"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={onSuccess}
                                className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded transition-transform active:scale-[0.98] hover:bg-[#EEE]"
                            >
                                GOT_IT_AND_FINISH
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center gap-2 mb-2">
                                <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-brand-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg">Cloudflare Configured!</h4>
                                <p className="text-sm text-[#666] max-w-[320px]">
                                    We've set up the DNS records. To complete the onboarding, update your domain's nameservers at your registrar to the following:
                                </p>
                            </div>

                            <div className="flex flex-col mt-4">
                                {nameServers.map((ns, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-3 border-b border-[#2A2A2E] last:border-b-0">
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Nameserver {idx + 1}</span>
                                            <span className="text-white font-mono text-[13px]">{ns}</span>
                                        </div>
                                        <button onClick={() => copyToClipboard(ns)} className="p-1.5 bg-[#1C1C1E] rounded hover:text-white text-[#888] hover:bg-[#2A2A2E] transition-colors">
                                            <Copy className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={onSuccess}
                                className="w-full py-3 mt-2 bg-white text-black font-bold uppercase tracking-widest text-xs rounded transition-transform active:scale-[0.98] hover:bg-[#EEE]"
                            >
                                GOT_IT_AND_FINISH
                            </button>
                        </div>
                    )}
                </div>

            </motion.div>
        </div>,
        document.body
    )
}
