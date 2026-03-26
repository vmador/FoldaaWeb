"use client"
import React, { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { 
    Lock, 
    ArrowRight, 
    Check, 
    CaretDown, 
    CaretUp,
    ShieldCheck,
    Briefcase,
    User,
    Users,
    CircleDashed,
    Info,
    Globe
} from "@phosphor-icons/react"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import { supabase } from "@/lib/supabase"
import FoldParticlesBackground from "./FoldParticlesBackground"
import clsx from "clsx"

type Step = "welcome" | "profile" | "role" | "cloudflare" | "ready"

const ROLES = [
    'Software Engineer', 'Designer', 'Product Manager', 
    'Researcher', 'Data', 'Educator', 'Student', 'Other'
]

export default function OnboardingModal() {
    const { profile, updateProfile, refreshData } = useUserProfile()
    const [step, setStep] = useState<Step>("welcome")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showInstructions, setShowInstructions] = useState(false)
    
    // Form States
    const [firstName, setFirstName] = useState(profile?.first_name || "")
    const [lastName, setLastName] = useState(profile?.last_name || "")
    const [username, setUsername] = useState(profile?.username || "")
    const [role, setRole] = useState(profile?.role || "")
    const [usageType, setUsageType] = useState("personal")
    
    // Cloudflare States
    const [cloudflareData, setCloudflareData] = useState({
        account_id: "",
        api_token: "",
        zone_id: "",
    })
    const [cfError, setCfError] = useState("")
    const [cfSuccess, setCfSuccess] = useState("")

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || "")
            setLastName(profile.last_name || "")
            setUsername(profile.username || "")
            setRole(profile.role || "")
        }
    }, [profile])

    const handleNext = async () => {
        if (step === "welcome") setStep("profile")
        else if (step === "profile") {
            if (!firstName || !username) return
            setIsSubmitting(true)
            await updateProfile({ first_name: firstName, last_name: lastName, username })
            setIsSubmitting(false)
            setStep("role")
        }
        else if (step === "role") {
            if (!role) return
            setIsSubmitting(true)
            await updateProfile({ role })
            setIsSubmitting(false)
            setStep("cloudflare")
        }
        else if (step === "cloudflare") {
            setStep("ready")
        }
        else if (step === "ready") {
            setIsSubmitting(true)
            await updateProfile({ onboarding_completed: true })
            await refreshData()
        }
    }

    const handleConnectCloudflare = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!cloudflareData.api_token) return
        setIsSubmitting(true)
        setCfError("")
        setCfSuccess("")
        
        try {
            const { data: result, error: functionError } = await supabase.functions.invoke("encrypt-cloudflare-token", {
                body: {
                    api_token: cloudflareData.api_token.trim(),
                    account_id: cloudflareData.account_id ? cloudflareData.account_id.trim() : null,
                    zone_id: cloudflareData.zone_id ? cloudflareData.zone_id.trim() : null,
                },
            })

            if (functionError) throw functionError
            if (!result?.success) throw new Error(result?.error || "Failed to connect")
            
            setCfSuccess("Successfully connected!")
            setTimeout(() => {
                setStep("ready")
            }, 1200)
        } catch (err: any) {
            setCfError(err.message || "Failed to save credentials")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkipOnboarding = async () => {
        setIsSubmitting(true)
        try {
            await supabase.from('cloudflare_accounts').upsert({
                user_id: profile?.id,
                status: 'skipped',
                updated_at: new Date().toISOString()
            })
            setStep("ready")
        } catch (err) {
            setCfError("Failed to skip. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } }
    }

    const stepVariants: Variants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[200] bg-black overflow-hidden selection:bg-white/20"
            style={{ 
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            }}
        >
            <FoldParticlesBackground />
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent via-black/20 to-black/40">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full max-w-[420px] flex flex-col items-center"
                >
                    {/* Minimal Header */}
                    <div className="mb-12 flex flex-col items-center opacity-80">
                        <img 
                            src="https://framerusercontent.com/images/xaKkzfzUA63o142A4ZaJD2ekTE.png" 
                            alt="Logo" 
                            className="w-12 h-12 mb-6 grayscale brightness-200"
                        />
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div 
                                    key={s} 
                                    className={clsx(
                                        "w-1 h-1 rounded-full transition-all duration-500",
                                        (step === "welcome" && s === 1) || 
                                        (step === "profile" && s === 2) || 
                                        (step === "role" && s === 3) || 
                                        (step === "cloudflare" && s === 4) || 
                                        (step === "ready" && s === 5)
                                            ? "bg-white scale-125 shadow-[0_0_8px_white]" 
                                            : "bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* HUD Content Area (Borderless, Compact) */}
                    <div className="w-full px-6">
                        <AnimatePresence mode="wait">
                            {step === "welcome" && (
                                <motion.div key="welcome" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8">
                                    <div className="space-y-3">
                                        <h1 className="text-2xl font-bold text-white tracking-tight">Onboarding</h1>
                                        <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                                            Prepare your environment for professional deployment.
                                        </p>
                                    </div>
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleNext}
                                            className="w-full py-3.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            Initialize Setup
                                            <ArrowRight size={14} weight="bold" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "profile" && (
                                <motion.div key="profile" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
                                    <div className="text-center space-y-1">
                                        <h2 className="text-lg font-bold text-white opacity-90">Profile Sync</h2>
                                        <p className="text-zinc-600 text-xs">Identify your account entity.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">First Name</label>
                                                <input 
                                                    type="text" 
                                                    autoFocus
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-zinc-800"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Last Name</label>
                                                <input 
                                                    type="text" 
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-zinc-800"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Handle</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 font-mono text-xs">@</span>
                                                <input 
                                                    type="text" 
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:border-white/20 outline-none transition-all font-mono placeholder:text-zinc-800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <button 
                                            onClick={handleNext}
                                            disabled={!firstName || !username || isSubmitting}
                                            className="w-full py-3.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <CircleDashed size={16} className="animate-spin" /> : "Deploy Identity"}
                                        </button>
                                        <button onClick={() => setStep("welcome")} className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors">
                                            Return
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "role" && (
                                <motion.div key="role" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
                                    <div className="text-center space-y-1">
                                        <h2 className="text-lg font-bold text-white opacity-90">Configuration</h2>
                                        <p className="text-zinc-600 text-xs">Define your operational focus.</p>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Environment Scope</label>
                                            <div className="flex bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl">
                                                <button
                                                    onClick={() => setUsageType('personal')}
                                                    className={clsx(
                                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                                                        usageType === 'personal' ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5" : "text-zinc-600 hover:text-zinc-400"
                                                    )}
                                                >
                                                    <User size={14} weight="bold" />
                                                    Standalone
                                                </button>
                                                <button
                                                    onClick={() => setUsageType('team')}
                                                    className={clsx(
                                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                                                        usageType === 'team' ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5" : "text-zinc-600 hover:text-zinc-400"
                                                    )}
                                                >
                                                    <Users size={14} weight="bold" />
                                                    Collaborative
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Functional Specialization</label>
                                            <div className="flex flex-wrap gap-2">
                                                {ROLES.map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setRole(r)}
                                                        className={clsx(
                                                            "px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all active:scale-95",
                                                            role === r 
                                                                ? "bg-white/10 border-white/40 text-white" 
                                                                : "bg-transparent border-white/[0.05] text-zinc-600 hover:border-white/20 hover:text-zinc-400"
                                                        )}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <button 
                                            onClick={handleNext}
                                            disabled={!role || isSubmitting}
                                            className="w-full py-3.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <CircleDashed size={16} className="animate-spin" /> : "Confirm Scope"}
                                        </button>
                                        <button onClick={() => setStep("profile")} className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors">
                                            Back
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "cloudflare" && (
                                <motion.div key="cloudflare" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                                    <div className="text-center space-y-1">
                                        <h2 className="text-lg font-bold text-white opacity-90">Deployment Engine</h2>
                                        <p className="text-zinc-600 text-xs">Link Cloudflare for edge computing.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <form onSubmit={handleConnectCloudflare} className="space-y-6">
                                            {cfError && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 font-medium">
                                                    {cfError}
                                                </div>
                                            )}
                                            {cfSuccess && (
                                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-medium flex items-center gap-2">
                                                    <Check size={12} weight="bold" />
                                                    {cfSuccess}
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700">API Access Token</label>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowInstructions(!showInstructions)}
                                                            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                                        >
                                                            {showInstructions ? "Hide Manual" : "Help"}
                                                        </button>
                                                    </div>
                                                    
                                                    {showInstructions && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            className="overflow-hidden pb-4"
                                                        >
                                                            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg space-y-3">
                                                                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                                                    Required permissions: <span className="text-zinc-300 font-mono">Workers Scripts (Edit)</span>, <span className="text-zinc-300 font-mono">KV Storage (Edit)</span>.
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open("https://dash.cloudflare.com/profile/api-tokens", "_blank")}
                                                                    className="w-full py-2 bg-white/[0.03] text-white border border-white/[0.1] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all"
                                                                >
                                                                    Open Tokens Dashboard
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <textarea 
                                                        autoFocus
                                                        value={cloudflareData.api_token}
                                                        onChange={(e) => setCloudflareData({ ...cloudflareData, api_token: e.target.value.trim() })}
                                                        rows={1}
                                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3 text-xs text-white focus:border-white/20 outline-none transition-all font-mono placeholder:text-zinc-800 min-h-[50px] resize-none"
                                                        placeholder="CF_TOKEN_..."
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 opacity-100">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Zone ID</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Optional"
                                                            value={cloudflareData.zone_id}
                                                            onChange={(e) => setCloudflareData({ ...cloudflareData, zone_id: e.target.value.trim() })}
                                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:border-white/20 outline-none transition-all font-mono placeholder:text-zinc-800"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-1">Account ID</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Optional"
                                                            value={cloudflareData.account_id}
                                                            onChange={(e) => setCloudflareData({ ...cloudflareData, account_id: e.target.value.trim() })}
                                                            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-2.5 text-xs text-white focus:border-white/20 outline-none transition-all font-mono placeholder:text-zinc-800"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button 
                                                    type="button"
                                                    onClick={handleSkipOnboarding}
                                                    className="px-6 py-3.5 bg-white/[0.02] text-zinc-600 border border-white/[0.05] rounded-lg font-bold text-xs hover:text-white transition-all active:scale-95"
                                                >
                                                    Skip
                                                </button>
                                                <button 
                                                    type="submit"
                                                    disabled={!cloudflareData.api_token || isSubmitting}
                                                    className="flex-1 py-3.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                                                >
                                                    {isSubmitting ? <CircleDashed size={16} className="animate-spin" /> : "Deploy Pipeline"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {step === "ready" && (
                                <motion.div key="ready" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center space-y-10">
                                    <div className="space-y-3">
                                        <h1 className="text-2xl font-bold text-white tracking-tight">System Ready</h1>
                                        <p className="text-zinc-500 text-sm leading-relaxed mx-auto max-w-[280px]">
                                            Initialization complete. Your deployment interface is fully operational.
                                        </p>
                                    </div>
                                    <div className="pt-6">
                                        <button 
                                            onClick={handleNext}
                                            className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                                        >
                                            Launch Terminal
                                            <ArrowRight size={16} weight="bold" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Minimal Footer */}
                    <div className="mt-20 opacity-30">
                        <p className="text-[10px] text-zinc-700 uppercase tracking-[0.4em] font-black">
                            Folda OS • Alpha
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body
    )
}
