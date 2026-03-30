"use client"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans antialiased text-foreground">
            <div className="w-full max-w-[360px] flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-8 flex flex-col items-center">
                    <img
                        src="/icon.svg"
                        alt="Foldaa Logo"
                        className="w-16 h-16 mb-6 opacity-90 dark:invert-0 invert"
                    />
                    <h1 className="text-lg font-bold tracking-tight mb-2">Reset Password</h1>
                </div>

                {success ? (
                    <div className="text-center py-4 bg-card border border-border rounded-[3px] p-8 w-full shadow-2xl">
                        <div className="w-16 h-16 bg-primary/5 rounded-[3px] flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-foreground font-bold text-lg mb-2">Check your email</h3>
                        <p className="text-muted-foreground text-sm">We've sent a password reset link to your inbox. Click the link to choose a new password.</p>
                        <Link href="/login" className="mt-8 inline-block btn-outline px-6">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="w-full space-y-6">
                        <p className="text-sm text-muted-foreground text-center mb-6">Enter your email address to receive a secure password reset link.</p>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-input border border-border rounded-[3px] px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-xs p-3 rounded-[3px] text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-filled justify-center py-3 rounded-[3px]"
                        >
                            {loading ? "Sending link..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-muted-foreground text-xs hover:text-foreground transition-colors tracking-wide">
                            ← Back to log in
                        </Link>
                    </div>
                )}

                <AuthFooter />
            </div>
        </div>
    );
}
