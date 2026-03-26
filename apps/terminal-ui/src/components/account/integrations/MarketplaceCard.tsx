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
                if (account.api_key) {
                    fetchStores(account.api_key)
                }
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
            const response = await fetch("https://api.lemonsqueezy.com/v1/stores", {
                headers: {
                    Authorization: `Bearer ${key}`,
                    Accept: "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                },
            })
            const data = await response.json()
            if (data.data) {
                setStores(data.data)
            }
        } catch (err) {
            console.error("Error fetching stores:", err)
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

            const { error: upsertError } = await supabase
                .from("seller_accounts")
                .upsert({
                    user_id: user.id,
                    api_key: apiKey.trim(),
                    provider: "lemonsqueezy",
                    store_id: selectedStoreId || null,
                    updated_at: new Date().toISOString(),
                })

            if (upsertError) throw upsertError

            setSuccess("LemonSqueezy connected")
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
        <div className="p-8 bg-[#1C1C1E] border border-[#2A2A2E] rounded-2xl flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#222] animate-spin" />
        </div>
    )

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] border border-[#2A2A2E] flex items-center justify-center shadow-inner">
                        <ShoppingBag className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Marketplace</h2>
                        <p className="text-[#666] text-xs mt-0.5 font-sans">LemonSqueezy integration.</p>
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
                    <div className="border border-[#2A2A2E] rounded-xl bg-black overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#2A2A2E]">
                            <span className="text-xs text-[#555] uppercase font-mono tracking-widest">Provider</span>
                            <span className="text-xs text-[#888] font-mono">LemonSqueezy</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-xs text-[#555] uppercase font-mono tracking-widest">Store ID</span>
                            <span className="text-xs text-[#888] font-mono">{accountInfo?.store_id || 'Not selected'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="flex-1 px-4 py-2 bg-[#1C1C1E] border border-[#2A2A2E] text-white rounded-lg text-xs font-medium hover:bg-[#2A2A2E] transition-all"
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
                                <label className="text-xs uppercase font-mono tracking-widest text-[#555]">API Key</label>
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
                                className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs font-mono focus:border-[#333] outline-none transition-all placeholder-[#333]"
                            />
                        </div>

                        {stores.length > 0 && (
                            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Select Store</label>
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs font-mono focus:border-[#333] outline-none transition-all appearance-none cursor-pointer"
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
                            className="flex-1 px-4 py-2 bg-[#2B4E54] hover:bg-[#325A62] text-white/90 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {hasCredentials ? 'Update Credentials' : 'Connect Store'}
                        </button>
                        {showEditForm && (
                            <button
                                onClick={() => setShowEditForm(false)}
                                className="px-4 py-2 bg-[#2A2A2E] border border-[#333336] text-[#AAA] rounded-md text-xs font-medium hover:text-white hover:border-[#333] transition-all"
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
