"use client"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        
        setLoading(false);
        
        if (error) {
            setError(error.message);
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
            // This is how Supabase indicates the user already exists if "Confirm Email" is enabled
            setAlreadyRegistered(true);
        } else {
            setSuccess(true);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans antialiased text-foreground">
            <div className="w-full max-w-[360px] flex flex-col items-center">
                {/* Logo / Icon Area */}
                <div className="mb-8 flex flex-col items-center">
                    <img
                        src="/icon.svg"
                        alt="Foldaa Logo"
                        className="w-16 h-16 mb-6 opacity-90 dark:invert-0 invert"
                    />
                    <h1 className="text-lg font-bold tracking-tight mb-2">Create Account</h1>
                </div>

                {success ? (
                    <div className="text-center py-4 bg-zinc-900/50 border border-white/10 rounded-2xl p-8 w-full shadow-2xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Check your email</h3>
                        <p className="text-zinc-400 text-sm">We've sent a verification link to your inbox. Please confirm your email to continue.</p>
                        <Link href="/login" className="mt-8 inline-block px-6 py-2.5 bg-white/[0.05] border border-white/10 rounded-md text-sm text-zinc-300 hover:bg-white/[0.08] transition-all">
                            Back to Login
                        </Link>
                    </div>
                ) : alreadyRegistered ? (
                    <div className="text-center py-4 bg-zinc-900/50 border border-white/10 rounded-2xl p-8 w-full shadow-2xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Email already registered</h3>
                        <p className="text-zinc-400 text-sm mb-6">It looks like you already have an account with this email. Would you like to sign in instead?</p>
                        <div className="flex flex-col gap-3">
                            <Link href="/login" className="w-full py-2.5 bg-white text-black rounded-md text-sm font-bold hover:bg-zinc-200 transition-all text-center">
                                Sign In
                            </Link>
                            <button 
                                onClick={() => setAlreadyRegistered(false)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                Use a different email
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Social Signup Buttons */}
                        <div className="w-full space-y-3 mb-8">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="w-full bg-secondary border border-border text-sm py-2.5 rounded-[3px] flex items-center justify-center gap-2 hover:bg-secondary/80 text-foreground transition-all"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.3 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign up with Google
                            </button>
                            <button
                                onClick={() => handleSocialLogin('github')}
                                className="w-full btn-outline justify-center py-2.5 rounded-[3px]"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                                Sign up with GitHub
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-full flex items-center gap-4 mb-8">
                            <div className="h-[1px] flex-1 bg-border"></div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">or</span>
                            <div className="h-[1px] flex-1 bg-border"></div>
                        </div>

                        {/* Signup Form */}
                        <form onSubmit={handleSignup} className="w-full space-y-6">
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

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 ml-1">Password</label>
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
                                {loading ? "Creating Account..." : "Sign Up"}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-muted-foreground text-xs">
                                Already have an account?{" "}
                                <Link href="/login" className="text-foreground hover:underline ml-1">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </>
                )}

                <AuthFooter />
            </div>
        </div>
    );
}
