"use client"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans antialiased text-foreground">
            <div className="w-full max-w-[360px] flex flex-col items-center">
                <div className="mb-8 flex flex-col items-center">
                    <img
                        src="/icon.svg"
                        alt="Foldaa Logo"
                        className="w-16 h-16 mb-6 opacity-90 dark:invert-0 invert"
                    />
                    <h1 className="text-lg font-bold tracking-tight mb-2">Update Password</h1>
                </div>

                <form onSubmit={handleUpdate} className="w-full space-y-6">
                    <p className="text-sm text-muted-foreground text-center mb-6">Please enter your new password below.</p>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 ml-1">New Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-input border border-border rounded-[3px] pl-11 pr-11 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                                placeholder="Minimum 6 characters"
                                required
                                minLength={6}
                            />
                        </div>
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
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
