"use client"
import React, { useState, useEffect } from "react"
import { Globe, Shield, AlertCircle, CheckCircle, Loader2, Save, Trash2, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function CloudflareCard() {
    const [accountId, setAccountId] = useState("")
    const [apiToken, setApiToken] = useState("")
    const [zoneId, setZoneId] = useState("")
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

            let { data: account, error: credError } = await supabase
                .from("cloudflare_credentials")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()

            if (!account || credError) {
                const result = await supabase
                    .from("cloudflare_accounts")
                    .select("*")
                    .eq("user_id", user.id)
                    .maybeSingle()
                account = result.data
            }

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
        if (!accountId.trim() || !apiToken.trim()) {
            setError("Account ID and API Token are required")
            return
        }

        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const { data: result, error: functionError } = await supabase.functions.invoke("encrypt-cloudflare-token", {
                body: {
                    api_token: apiToken.trim(),
                    account_id: accountId.trim(),
                    zone_id: zoneId.trim() || null,
                },
            })

            if (functionError) throw functionError
            if (!result?.success) throw new Error(result?.error || "Failed to connect Cloudflare")

            setSuccess("Credentials saved successfully")
            await checkCredentials()
            setShowEditForm(false)
            setAccountId("")
            setApiToken("")
            setZoneId("")
        } catch (err: any) {
            setError(err.message || "Failed to save credentials")
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Cloudflare?")) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from("cloudflare_credentials").delete().eq("user_id", user.id)
            await supabase.from("cloudflare_accounts").delete().eq("user_id", user.id)

            setHasCredentials(false)
            setAccountInfo(null)
            setSuccess("Cloudflare disconnected")
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
                        <Globe className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Cloudflare</h2>
                        <p className="text-muted-foreground text-xs mt-0.5 font-sans">Secure DNS & CDN management.</p>
                    </div>
                </div>
                {hasCredentials && !showEditForm && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-foreground/5 border border-white/10 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse" />
                        <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>

            {/* Display Mode */}
            {hasCredentials && !showEditForm ? (
                <div className="space-y-4">
                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border/50">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Account ID</span>
                            <span className="text-xs text-foreground font-mono">{accountInfo?.account_id}</span>
                        </div>
                        {accountInfo?.zone_id && (
                            <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Zone ID</span>
                                <span className="text-xs text-foreground font-mono">{accountInfo?.zone_id}</span>
                            </div>
                        )}
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
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Account ID</label>
                            <input
                                type="text"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                placeholder="cf_acc_id..."
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">API Token</label>
                            <input
                                type="password"
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                                placeholder="cf_token..."
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Zone ID (Optional)</label>
                            <input
                                type="text"
                                value={zoneId}
                                onChange={(e) => setZoneId(e.target.value)}
                                placeholder="cf_zone_id..."
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleConnect}
                            disabled={loading || !accountId || !apiToken}
                            className="flex-1 px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {hasCredentials ? 'Update Credentials' : 'Connect Cloudflare'}
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
                            error ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-foreground/5 border-white/10 text-foreground/80"
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
