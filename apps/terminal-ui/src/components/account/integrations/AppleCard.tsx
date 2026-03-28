"use client"
import React, { useState, useEffect } from "react"
import { Apple, Shield, AlertCircle, CheckCircle, Loader2, Save, Trash2, Key } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AppleCard() {
    const [teamId, setTeamId] = useState("")
    const [keyId, setKeyId] = useState("")
    const [privateKey, setPrivateKey] = useState("")
    const [bundleId, setBundleId] = useState("")
    const [hasCredentials, setHasCredentials] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [showEditForm, setShowEditForm] = useState(false)
    const [accountInfo, setAccountInfo] = useState<any>(null)

    useEffect(() => {
        checkCredentials()
    }, [])

    const checkCredentials = async () => {
        setChecking(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: account } = await supabase
                .from("apple_accounts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()

            if (account) {
                setHasCredentials(true)
                setAccountInfo(account)
            } else {
                setHasCredentials(false)
            }
        } catch (err) {
            console.error("Error checking credentials:", err)
        } finally {
            setChecking(false)
        }
    }

    const handleConnect = async () => {
        if (!teamId.trim() || !keyId.trim() || !privateKey.trim() || !bundleId.trim()) {
            setError("All fields are required")
            return
        }

        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const { data, error: functionError } = await supabase.functions.invoke("save-apple-account", {
                body: {
                    action: "save",
                    team_id: teamId.trim(),
                    key_id: keyId.trim(),
                    private_key: privateKey.trim(),
                    bundle_id: bundleId.trim()
                },
            })

            if (functionError || !data?.success) {
                throw new Error(functionError?.message || data?.error || "Failed to save credentials")
            }

            setSuccess("Credentials saved correctly")
            await checkCredentials()
            setShowEditForm(false)
            setTeamId("")
            setKeyId("")
            setPrivateKey("")
            setBundleId("")
        } catch (err: any) {
            setError(err.message || "Failed to save credentials")
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Apple Developer?")) return

        setLoading(true)
        try {
            const { data, error: functionError } = await supabase.functions.invoke("connect-apple", {
                body: { action: "delete" },
            })

            if (functionError || !data?.success) throw new Error("Failed to disconnect")

            setHasCredentials(false)
            setAccountInfo(null)
            setSuccess("Apple disconnected")
        } catch (err: any) {
            setError(err.message || "Failed to disconnect")
        } finally {
            setLoading(false)
        }
    }

    if (checking) return (
        <div className="p-8 bg-card border border-border rounded-2xl flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
        </div>
    )

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-inner">
                        <Apple className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Apple Developer</h2>
                        <p className="text-muted-foreground text-xs mt-0.5 font-sans">iOS & macOS distribution.</p>
                    </div>
                </div>
                {hasCredentials && !showEditForm && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-foreground/[0.05] border border-white/[0.05] rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>

            {/* Display Mode */}
            {hasCredentials && !showEditForm ? (
                <div className="space-y-4">
                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border/50">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Team ID</span>
                            <span className="text-xs text-foreground font-mono">{accountInfo?.team_id}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Bundle ID</span>
                            <span className="text-xs text-foreground font-mono">{accountInfo?.bundle_id}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="flex-1 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-xs font-medium hover:bg-secondary transition-all"
                        >
                            Edit Credentials
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Edit Mode */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Team ID</label>
                                <input
                                    type="text"
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    placeholder="ABC123DEF..."
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Key ID</label>
                                <input
                                    type="text"
                                    value={keyId}
                                    onChange={(e) => setKeyId(e.target.value)}
                                    placeholder="XYZ789..."
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Bundle ID</label>
                            <input
                                type="text"
                                value={bundleId}
                                onChange={(e) => setBundleId(e.target.value)}
                                placeholder="com.example.app"
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Private Key (.p8)</label>
                            <textarea
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                placeholder="-----BEGIN PRIVATE KEY-----..."
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all h-24 resize-none placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleConnect}
                            disabled={loading || !teamId || !keyId || !privateKey || !bundleId}
                            className="flex-1 px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {hasCredentials ? 'Update Credentials' : 'Connect Apple'}
                        </button>
                        {showEditForm && (
                            <button
                                onClick={() => setShowEditForm(false)}
                                className="px-4 py-2 bg-secondary border border-border text-muted-foreground rounded-lg text-xs font-medium hover:text-foreground hover:border-border transition-all"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    
                    {(error || success) && (
                        <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                            error ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-foreground/[0.05] border-white/10 text-zinc-400"
                        }`}>
                            {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                            {error || success}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
