"use client"
import React, { useState } from "react"
import { Mail, Shield, LogOut, Key, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AccountSection() {
    const [isUpdating, setIsUpdating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const resetPassword = async () => {
        setIsUpdating(true)
        setMessage(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.email) throw new Error("No user email found")

            const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/account?tab=account`,
            })

            if (error) throw error
            setMessage({ type: 'success', text: "Password reset link sent to your email." })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to send reset link." })
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">Account & Security</h2>
                <p className="text-muted-foreground text-sm mt-1">Manage your account credentials and security preferences.</p>
            </div>

            <div className="space-y-5">
                {/* Email Section */}
                <div className="p-5 bg-card border border-border rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Mail className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email Address</h3>
                    </div>
                    <p className="text-xs text-muted-foreground pl-1">Your primary email address for notifications and account recovery.</p>
                    <div className="flex gap-3">
                        <input
                            type="email"
                            disabled
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-muted-foreground text-sm outline-none cursor-not-allowed"
                            placeholder="user@example.com"
                        />
                        <button disabled className="px-4 py-1.5 bg-secondary border border-border rounded-lg text-xs font-bold text-muted-foreground cursor-not-allowed">
                            Change Email
                        </button>
                    </div>
                </div>

                {/* Password Section */}
                <div className="p-5 bg-card border border-border rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Shield className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Password</h3>
                    </div>
                    <p className="text-xs text-muted-foreground pl-1">Security is key. We recommend using a unique password for your account.</p>
                    
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-xs font-medium ${
                            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                            <AlertCircle className="w-4 h-4" />
                            {message.text}
                        </div>
                    )}

                    <button 
                        onClick={resetPassword}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-5 py-2 bg-foreground text-foreground rounded-lg text-sm font-bold hover:bg-[#D8D8D8] transition-all disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        Send Reset Link
                    </button>
                </div>

                {/* Session Section */}
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Sign Out</h3>
                    </div>
                    <p className="text-xs text-muted-foreground pl-1">Logout from this device. You will need to sign in again to access your projects.</p>
                    <button 
                        onClick={handleLogout}
                        className="px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all font-sans"
                    >
                        Sign Out Now
                    </button>
                </div>
            </div>
        </div>
    )
}
