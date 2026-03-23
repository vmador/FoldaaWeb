"use client"
import React, { useState, useEffect } from "react"
import { Check, AlertCircle, Loader2, Key, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"
import { AppleIcon } from "./AppleIcon"

interface AppleConnectProps {
    onConnected?: () => void
}

export default function AppleConnect({ onConnected }: AppleConnectProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState({
        team_id: "",
        key_id: "",
        private_key: "",
        bundle_id: "",
        account_name: "Primary Account"
    })

    useEffect(() => {
        loadAccount()
    }, [])

    const loadAccount = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("apple_accounts")
                .select("team_id, key_id, bundle_id, account_name")
                .eq("user_id", user.id)
                .maybeSingle()

            if (data) {
                setFormData({
                    team_id: data.team_id || "",
                    key_id: data.key_id || "",
                    private_key: "", 
                    bundle_id: data.bundle_id || "",
                    account_name: data.account_name || "Primary Account"
                })
            }
        } catch (err: any) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.team_id || !formData.key_id || !formData.private_key) {
            setError("Team ID, Key ID, and Private Key are required")
            return
        }

        setIsSaving(true)
        setError("")
        setSuccess("")

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("Not authenticated")

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/save-apple-account`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify(formData),
                }
            )

            const result = await response.json()
            if (!result.success) throw new Error(result.error || "Failed to save account")

            setSuccess("Apple Account connected successfully!")
            onConnected?.()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-5 h-5 text-[#666] animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div className="flex-1">{error}</div>
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] text-xs text-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                </div>
            )}

            <div className="bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] p-5 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <AppleIcon size={24} color="black" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">App Store Connect</h3>
                        <p className="text-[11px] text-[#666]">Configure your Apple Developer credentials</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Team ID
                        </label>
                        <input
                            type="text"
                            value={formData.team_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, team_id: e.target.value.toUpperCase() }))}
                            placeholder="ABC123DEFG"
                            className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#2A2A2E] font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide flex items-center gap-1.5">
                            <Key className="w-3 h-3" /> Key ID
                        </label>
                        <input
                            type="text"
                            value={formData.key_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, key_id: e.target.value.toUpperCase() }))}
                            placeholder="1234567890"
                            className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#2A2A2E] font-mono"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide flex items-center gap-1.5">
                        <Key className="w-3 h-3" /> App Store Connect API Key (.p8)
                    </label>
                    <textarea
                        value={formData.private_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, private_key: e.target.value }))}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        className="w-full h-32 bg-transparent border border-[#1C1C1E] rounded-[10px] p-3 text-xs text-[#888] outline-none focus:border-[#2A2A2E] font-mono resize-none"
                    />
                    <p className="text-[9px] text-[#444]">Your key is encrypted before being stored and is only used for build signing.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={clsx(
                        "w-full h-10 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2",
                        isSaving ? "bg-[#1C1C1E] text-[#444] cursor-not-allowed" : "bg-white text-black hover:bg-[#E0E0E0]"
                    )}
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {isSaving ? "Connecting..." : "Connect Apple Account"}
                </button>
            </div>
        </div>
    )
}
