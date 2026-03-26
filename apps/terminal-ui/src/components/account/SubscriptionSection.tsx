"use client"
import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Check, CheckCircle, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react"
import clsx from "clsx"

// Mock validation function if the real one isn't available
const validateLicenseKey = async (key: string, userId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-license`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ licenseKey: key })
        })
        if (!res.ok) {
            const err = await res.json()
            return { valid: false, error: err.error || "Invalid license key" }
        }
        return { valid: true }
    } catch (err: any) {
        return { valid: false, error: err.message || "Failed to validate license" }
    }
}

export default function SubscriptionSection() {
    const [user, setUser] = useState<any>(null)
    const [plan, setPlan] = useState("free")
    const [loading, setLoading] = useState(true)
    const [licenseKey, setLicenseKey] = useState("")
    const [activating, setActivating] = useState(false)
    const [error, setError] = useState("")
    const [showLicenseInput, setShowLicenseInput] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUser(session.user)
            } else {
                setLoading(false)
                setError("Please sign in to view subscription details")
            }
        }
        getUser()
    }, [])

    useEffect(() => {
        const fetchUserPlan = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }

            try {
                const { data: license } = await supabase
                    .from("user_licenses")
                    .select("plan_type, status, expires_at")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (license) {
                    if (!license.expires_at || new Date() < new Date(license.expires_at)) {
                        setPlan(license.plan_type)
                    }
                }
            } catch (error) {
                console.error("Error fetching user plan:", error)
                setPlan("free")
            } finally {
                setLoading(false)
            }
        }

        fetchUserPlan()
    }, [user])

    const refreshPlan = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const { data: license } = await supabase
                .from("user_licenses")
                .select("plan_type, status, expires_at")
                .eq("user_id", user.id)
                .eq("status", "active")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()

            if (license) {
                if (!license.expires_at || new Date() < new Date(license.expires_at)) {
                    setPlan(license.plan_type)
                }
            }
        } catch (error) {
            console.error("Error refreshing plan:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleActivateLicense = async () => {
        if (!licenseKey.trim()) {
            setError("Please enter a license key")
            return
        }

        setActivating(true)
        setError("")

        const result = await validateLicenseKey(licenseKey.trim(), user.id)

        if (result.valid) {
            await refreshPlan()
            setLicenseKey("")
            setShowLicenseInput(false)
            setError("")
        } else {
            setError(result.error)
        }

        setActivating(false)
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleActivateLicense()
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-5 h-5 text-[#333] animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-black border border-[#2A2A2E] rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-[#333]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Sign In Required</h3>
                <p className="text-xs text-[#666] font-mono">Please sign in to view your subscription details</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-500 pt-2">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Free Plan */}
                <div className={clsx(
                    "p-5 rounded-xl border transition-all duration-300",
                    plan === 'free' 
                        ? 'bg-[#030303] border-brand-500/20 shadow-[0_0_20px_rgba(6,182,212,0.02)]' 
                        : 'bg-transparent border-[#2A2A2E] opacity-60 grayscale'
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-[#444] uppercase tracking-widest px-1.5 py-0.5 bg-[#1C1C1E] border border-[#2A2A2E] rounded">Free</span>
                        {plan === 'free' && (
                            <div className="flex items-center gap-1.5 text-zinc-500">
                                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Active</span>
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-6 font-sans tracking-tight">Standard</h3>

                    <div className="space-y-3 mb-8">
                        {[
                            "Limited 3 Projects",
                            "Custom app icons",
                            "Automatic updates",
                            "Basic analytics",
                            "Priority access",
                            "Integrations",
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <Check className="w-3 h-3 text-[#333] stroke-[3]" />
                                <span className="text-xs text-[#888] font-mono tracking-tight">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        className={clsx(
                            "w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all",
                            plan === 'free'
                                ? 'bg-white/[0.05] text-zinc-500 border border-white/[0.08] cursor-default'
                                : 'bg-[#1C1C1E] border border-[#2A2A2E] text-[#666] hover:text-white hover:border-[#333]'
                        )}
                    >
                        {plan === "free" ? "Active Plan" : "Downgrade"}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className={clsx(
                    "p-5 rounded-xl border transition-all duration-300 relative overflow-hidden",
                    plan === 'pro' 
                        ? 'bg-[#030303] border-brand-500/40 shadow-[0_0_30px_rgba(6,182,212,0.05)]' 
                        : 'bg-[#030303] border-[#2A2A2E] hover:border-[#333]'
                )}>
                    {/* Subtle Gradient Glow */}
                    {plan === 'pro' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.1] rounded">Pro</span>
                        {plan === 'pro' && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                                <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Active</span>
                            </div>
                        )}
                    </div>

                    <div className="mb-6 relative z-10">
                        <span className="text-lg font-bold text-white font-sans tracking-tight">$13.99</span>
                        <span className="text-xs text-[#444] font-mono ml-1">/ mo</span>
                    </div>

                    <div className="space-y-3 mb-8 relative z-10">
                        {[
                            "Unlimited Framer links",
                            "Custom app icons",
                            "Automatic updates",
                            "Advanced analytics",
                            "New features access",
                        ].map((feature, i) => (i < 5 && (
                            <div key={i} className="flex items-center gap-2.5">
                                <Check className="w-3 h-3 text-zinc-600 stroke-[3]" />
                                <span className="text-xs text-[#AAA] font-mono tracking-tight">{feature}</span>
                            </div>
                        )))}
                    </div>

                    {/* Action Area */}
                    <div className="relative z-10">
                        {plan === "pro" ? (
                            <button className="w-full py-2 rounded text-xs font-bold uppercase tracking-widest bg-white/[0.05] text-zinc-400 border border-white/[0.1] cursor-default">
                                Active Plan
                            </button>
                        ) : !showLicenseInput ? (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => window.open("https://amador.lemonsqueezy.com/buy/e8cae0a4-2d2b-4f33-ab59-86ed6bc3ba80", "_blank")}
                                    className="w-full py-2 bg-white text-black hover:bg-[#E5E5E5] rounded text-xs font-bold transition-all uppercase tracking-widest"
                                >
                                    Get Pro License
                                </button>
                                <button
                                    onClick={() => setShowLicenseInput(true)}
                                    className="w-full py-2 bg-transparent text-[#666] hover:text-[#AAA] rounded text-xs font-bold transition-all uppercase tracking-widest"
                                >
                                    Activate license key
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#030303] border border-[#2A2A2E] rounded-lg">
                                    <span className="text-xs font-mono uppercase tracking-widest text-[#444]">Activation</span>
                                    <button onClick={() => setShowLicenseInput(false)} className="text-[#444] hover:text-white transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="LMSQ-XXXX..."
                                    className="w-full bg-black border border-[#2A2A2E] rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-brand-500/30 outline-none transition-all placeholder-[#222]"
                                />
                                {error && <p className="text-red-500 text-xs font-mono">{error}</p>}
                                <button
                                    onClick={handleActivateLicense}
                                    disabled={!licenseKey.trim() || activating}
                                    className="w-full py-1.5 bg-white/[0.05] text-zinc-400 hover:bg-white/[0.1] border border-white/[0.1] rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {activating ? "Processing..." : "Activate"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help / Footer */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#030303] border border-[#2A2A2E] rounded-xl">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#333]" />
                    <span className="text-xs text-[#666] font-mono tracking-tight leading-none pt-0.5">Secure billing via <strong>LemonSqueezy</strong></span>
                </div>
                <button className="text-xs font-bold text-[#444] hover:text-[#666] uppercase tracking-widest transition-colors">
                    Support
                </button>
            </div>
        </div>
    )
}
