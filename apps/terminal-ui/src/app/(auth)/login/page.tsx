"use client"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.includes("@")) {
            setStep(2);
            setError(null);
        } else {
            setError("Please enter a valid email address.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github' | 'apple') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center py-12 px-6 font-sans antialiased text-foreground selection:bg-white/20 relative">
            
            <div className="w-full max-w-[380px] flex flex-col items-start px-2">
                {/* Header Section */}
                <div className="text-left mb-10 w-full">
                    <img src="/icon.svg" alt="Foldaa Logo" className="w-[20px] h-[20px] mb-4" />
                    <div>
                        <h1 className="text-[20px] font-medium text-white mb-1">Welcome to Foldaa</h1>
                        <p className="text-zinc-500 text-[20px]">The new way to ship your web apps</p>
                    </div>
                </div>

                {/* Social Login Buttons */}
                <div className="w-full space-y-2.5 mb-10">
                    <button
                        onClick={() => handleSocialLogin('google')}
                        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-md bg-white/[0.05] text-sm text-zinc-300 hover:bg-white/[0.08] transition-all font-medium"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.3 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>
                    <button
                        onClick={() => handleSocialLogin('github')}
                        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-md bg-white/[0.05] text-sm text-zinc-300 hover:bg-white/[0.08] transition-all font-medium"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        Continue with GitHub
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form 
                            key="email-step"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleContinue} 
                            className="w-full"
                        >
                            <div className="mb-4">
                                <label className="block text-[11px] font-medium text-zinc-500 mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-all"
                                    placeholder="Your email address"
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-2.5 rounded-md bg-white/[0.05] text-sm text-zinc-300 hover:bg-white/[0.08] transition-all font-medium"
                            >
                                Continue
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="password-step"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleLogin} 
                            className="w-full"
                        >
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="text-[11px] font-medium text-zinc-500">Password</label>
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-[10px] text-zinc-600 hover:text-zinc-400 underline underline-offset-4"
                                    >
                                        Edit Email
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-all"
                                    placeholder="Your password"
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black py-3 rounded-md text-sm font-black hover:bg-zinc-200 transition-all disabled:opacity-50"
                            >
                                {loading ? "Signing in..." : "Continue"}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 text-red-500/80 text-[11px] text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="mt-8 text-center w-full">
                    <p className="text-zinc-600 text-xs text-center">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-zinc-400 hover:text-white transition-colors ml-1">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Bottom Footer Area */}
            <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center">
                <div className="text-[10px] text-zinc-600 font-medium tracking-tight hover:text-zinc-400 transition-colors cursor-pointer underline underline-offset-4">
                    Terms of Service and Privacy Policy
                </div>
            </div>
        </div>
    );
}
