"use client"
import React, { useState, useEffect } from "react"
import { ShoppingBag, Shield, AlertCircle, CheckCircle, Loader2, Save, Trash2, Store, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function MarketplaceCard() {
    const [apiKey, setApiKey] = useState("")
    const [hasCredentials, setHasCredentials] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [showEditForm, setShowEditForm] = useState(false)
    const [accountInfo, setAccountInfo] = useState<any>(null)
    const [stores, setStores] = useState<any[]>([])
    const [selectedStoreId, setSelectedStoreId] = useState("")

    useEffect(() => {
        checkCredentials()
    }, [])

    const checkCredentials = async () => {
        setChecking(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: account } = await supabase
                .from("seller_accounts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()

            if (account) {
                setHasCredentials(true)
                setAccountInfo(account)
                // We don't fetch stores if we only have the encrypted key on the client
                // But if the user just connected, we might have the key in state
            } else {
                setHasCredentials(false)
            }
        } catch (err) {
            console.error("Error checking credentials:", err)
        } finally {
            setChecking(false)
        }
    }

    const fetchStores = async (key: string) => {
        try {
            const response = await fetch("/api/lemonsqueezy/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ api_key: key.trim() }),
            })
            const result = await response.json()
            if (result.success && result.data) {
                setStores(result.data)
                setError("")
            } else {
                setError(result.error || "Failed to fetch stores")
                setStores([])
            }
        } catch (err) {
            console.error("Error fetching stores:", err)
            setError("Failed to reach store selector")
        }
    }

    const handleConnect = async () => {
        if (!apiKey.trim()) {
            setError("API Key is required")
            return
        }

        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const selectedStore = stores.find(s => s.id === selectedStoreId)

            const response = await fetch("/api/lemonsqueezy/encrypt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    api_key: apiKey.trim(),
                    store_id: selectedStoreId,
                    store_name: selectedStore?.attributes?.name || "",
                    template_variant_id: "" // Optional if handled elsewhere
                })
            })

            const result = await response.json()
            if (!result.success) throw new Error(result.error || "Failed to connect")

            setSuccess("LemonSqueezy connected securely")
            await checkCredentials()
            setShowEditForm(false)
            setApiKey("")
        } catch (err: any) {
            setError(err.message || "Failed to connect")
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect LemonSqueezy?")) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from("seller_accounts").delete().eq("user_id", user.id)

            setHasCredentials(false)
            setAccountInfo(null)
            setStores([])
            setSuccess("LemonSqueezy disconnected")
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
                        <ShoppingBag className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Marketplace</h2>
                        <p className="text-muted-foreground text-xs mt-0.5 font-sans">LemonSqueezy integration.</p>
                    </div>
                </div>
                {hasCredentials && !showEditForm && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>

            {/* Display Mode */}
            {hasCredentials && !showEditForm ? (
                <div className="space-y-4">
                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border/50">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Provider</span>
                            <span className="text-xs text-foreground font-mono">LemonSqueezy</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Store ID</span>
                            <span className="text-xs text-foreground font-mono">{accountInfo?.store_id || 'Not selected'}</span>
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
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center pr-1">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">API Key</label>
                                <a href="https://app.lemonsqueezy.com/settings/api" target="_blank" className="text-xs text-yellow-500/50 hover:text-yellow-500 transition-colors uppercase tracking-widest font-bold">Get Key</a>
                            </div>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value)
                                    if (e.target.value.length > 20) fetchStores(e.target.value)
                                }}
                                placeholder="ls_..."
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {stores.length > 0 && (
                            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Select Store</label>
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:border-foreground/20 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Choose a store...</option>
                                    {stores.map((store: any) => (
                                        <option key={store.id} value={store.id}>{store.attributes.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleConnect}
                            disabled={loading || !apiKey}
                            className="flex-1 px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {hasCredentials ? 'Update Credentials' : 'Connect Store'}
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
                            error ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-brand-500/5 border-brand-500/20 text-brand-400"
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
