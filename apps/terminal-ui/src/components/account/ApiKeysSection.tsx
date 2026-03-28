"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import {
    Key,
    Plus,
    Copy,
    Trash2,
    X,
    CheckCircle,
    AlertCircle,
    Loader2
} from "lucide-react"

// --- Modals ---

const NewKeyModal = ({ apiKey, keyData, onClose }: { apiKey: string, keyData: any, onClose: () => void }) => {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center gap-4 bg-background">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-white/10 flex items-center justify-center text-foreground shrink-0">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">API Key Created!</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{keyData.name}</p>
                    </div>
                </div>

                {/* Warning */}
                <div className="px-6 py-4 bg-yellow-500/5 border-b border-border flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-1">Save this key now!</p>
                        <p className="text-xs text-yellow-500/80 font-mono">You won't be able to see it again. Store it securely.</p>
                    </div>
                </div>

                {/* API Key */}
                <div className="p-6 space-y-6 bg-background">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Your API Key</label>
                        <div className="relative bg-background border border-border rounded-lg p-3 pr-14 flex items-center">
                            <code className="text-sm text-foreground/90 font-mono break-all leading-relaxed">
                                {apiKey}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border flex items-center justify-center transition-all ${
                                    copied 
                                    ? "bg-foreground/10 border-white/20 text-foreground" 
                                    : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                            >
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-background border border-border rounded-xl">
                        <div>
                            <p className="text-xs uppercase font-mono tracking-widest text-[#555] mb-2">Scopes</p>
                            <div className="flex flex-wrap gap-1.5">
                                {keyData.scopes.map((scope: string) => (
                                    <span key={scope} className="px-2 py-0.5 bg-secondary border border-border text-muted-foreground rounded text-xs font-mono uppercase tracking-widest">
                                        {scope}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-mono tracking-widest text-[#555] mb-2">Expires</p>
                            <p className="text-xs text-foreground font-mono">
                                {keyData.expires_at ? new Date(keyData.expires_at).toLocaleDateString() : "Never"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-background flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-foreground text-foreground hover:bg-[#E5E5E5] rounded-md text-xs font-bold transition-colors"
                    >
                        I've Saved It
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

const CreateKeyModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        name: "",
        expires_in_days: "",
        scopes: { read: true, write: true, execute: true } as Record<string, boolean>
    })
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState("")

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            setError("Name is required")
            return
        }
        setIsCreating(true)
        setError("")

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("Not authenticated")

            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-api-key`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    scopes: Object.keys(formData.scopes).filter(k => formData.scopes[k]),
                    expires_in_days: formData.expires_in_days ? parseInt(formData.expires_in_days) : null,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to create API key")
            }

            const data = await response.json()
            onSuccess(data)
        } catch (err: any) {
            console.error("Error creating API key:", err)
            setError(err.message || "Failed to create key")
            setIsCreating(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-background border border-border rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-start justify-between bg-background">
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Create API Key</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-1">Generate a new key for API access</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-[#555] hover:text-foreground transition-colors bg-secondary border border-border rounded-md">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555] px-1">Key Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Production Key, Development"
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-xs font-mono focus:border-border outline-none transition-all placeholder-[#333]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555] px-1">Permissions</label>
                        <div className="grid gap-2">
                            {["read", "write", "execute"].map((scope) => (
                                <label key={scope} className="flex items-center gap-3 px-3 py-2 bg-background border border-border rounded-md cursor-pointer hover:border-border transition-colors group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.scopes[scope]}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                scopes: { ...formData.scopes, [scope]: e.target.checked }
                                            })}
                                            className="peer sr-only"
                                        />
                                        <div className="w-4 h-4 rounded-[4px] border border-border bg-background peer-checked:bg-foreground peer-checked:border-white flex items-center justify-center transition-colors">
                                           {formData.scopes[scope] && <CheckCircle className="w-3 h-3 text-foreground stroke-[3]" />}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors uppercase tracking-wider">{scope}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555] px-1">Expires in (days)</label>
                        <input
                            type="number"
                            value={formData.expires_in_days}
                            onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                            placeholder="Leave empty for no expiration"
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-xs font-mono focus:border-border outline-none transition-all placeholder-[#333]"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-xs text-red-400 font-mono">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isCreating}
                        className="px-4 py-2 bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-border rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !formData.name}
                        className="px-5 py-2 bg-foreground text-foreground hover:bg-[#E5E5E5] rounded-md text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        {isCreating ? 'Creating...' : 'Create Key'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// --- Card ---

const ApiKeyCard = ({ apiKey, onDelete }: { apiKey: any, onDelete: (key: any) => void }) => {
    const [showActions, setShowActions] = useState(false)

    return (
        <div className="bg-background border border-border rounded-xl p-5 hover:border-border transition-colors relative group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-white/10 flex items-center justify-center text-foreground/50 shrink-0">
                        <Key className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wide break-all mb-0.5">{apiKey.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{apiKey.key_prefix}</p>
                    </div>
                </div>
                
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="w-8 h-8 flex flex-col gap-1 items-center justify-center bg-secondary border border-border rounded-md text-[#555] hover:text-foreground hover:border-border transition-colors"
                    >
                        <div className="w-1 h-1 bg-current rounded-full" />
                        <div className="w-1 h-1 bg-current rounded-full" />
                        <div className="w-1 h-1 bg-current rounded-full" />
                    </button>

                    <AnimatePresence>
                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={() => { setShowActions(false); onDelete(apiKey); }}
                                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-xs font-bold font-mono uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Revoke Key
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex items-center gap-6">
                <div>
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest block mb-1">Created</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(apiKey.created_at).toLocaleDateString()}</span>
                </div>
                {apiKey.last_used_at && (
                    <div>
                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest block mb-1">Last Used</span>
                        <span className="text-xs text-foreground/80 font-mono">{new Date(apiKey.last_used_at).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Main Section ---

export default function ApiKeysSection() {
    const [apiKeys, setApiKeys] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newKeyData, setNewKeyData] = useState<any>(null)

    useEffect(() => {
        fetchApiKeys()
    }, [])

    const fetchApiKeys = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from("api_keys")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })

            if (error) throw error
            setApiKeys(data || [])
        } catch (error) {
            console.error("Error fetching API keys:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateSuccess = (data: any) => {
        setNewKeyData(data)
        setShowCreateModal(false)
        fetchApiKeys()
    }

    const handleDeleteKey = async (apiKey: any) => {
        if (!confirm(`Revoke API key "${apiKey.name}"? This action cannot be undone and will immediately stop all requests using this key.`)) return

        try {
            const { error } = await supabase
                .from("api_keys")
                .update({ is_active: false })
                .eq("id", apiKey.id)

            if (error) throw error
            fetchApiKeys()
        } catch (error) {
            console.error("Error revoking API key:", error)
            alert("Error revoking API key")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 text-[#333] animate-spin" />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
            {/* List */}
            {apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-background border border-border border-dashed rounded-xl">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
                        <Key className="w-6 h-6 text-[#333]" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground tracking-widest uppercase mb-1">No API keys yet</h3>
                    <p className="text-xs text-muted-foreground font-mono text-center max-w-sm mb-6">Create your first API key to start using the Foldaa API from your applications.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-secondary hover:bg-[#1A1A1A] border border-border text-muted-foreground hover:text-foreground rounded-md text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        CREATE KEY
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiKeys.map((key) => (
                        <ApiKeyCard
                            key={key.id}
                            apiKey={key}
                            onDelete={handleDeleteKey}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showCreateModal && (
                    <CreateKeyModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={handleCreateSuccess}
                    />
                )}
                {newKeyData && (
                    <NewKeyModal
                        apiKey={newKeyData.api_key}
                        keyData={newKeyData}
                        onClose={() => setNewKeyData(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
