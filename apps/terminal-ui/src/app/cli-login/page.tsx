'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, ShieldCheck, Terminal } from '@phosphor-icons/react';

import { Suspense } from 'react';

function CliLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const port = searchParams.get('port') || '3333';
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (!session) {
        // Redirect to login if not authenticated
        const nextUrl = encodeURIComponent(`/cli-login?port=${port}`);
        router.push(`/login?next=${nextUrl}`);
      }
    });
  }, [port, router]);

  const handleConfirm = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    const token = session.access_token;
    const refreshToken = session.refresh_token;
    const url = `http://localhost:${port}/callback`;

    console.log('[CLI-Login] Sending tokens to CLI:', { 
      hasToken: !!token, 
      tokenLen: token?.length,
      hasRefreshToken: !!refreshToken,
      refreshTokenLen: refreshToken?.length
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, refreshToken })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        throw new Error('Failed to send token to CLI');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the CLI. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session && !success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans antialiased text-center">
        <div className="w-full max-w-md bg-[#1C1C1E] border border-[#2A2A2E] rounded-2xl p-12 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20">
            <CheckCircle size={40} weight="fill" className="text-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-tight mb-4">Linked Successfully!</h1>
          <p className="text-[#666] mb-8">
            Your CLI is now authenticated. You can safely close this tab and return to your terminal.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans antialiased">
      <div className="w-full max-w-md bg-[#1C1C1E] border border-[#2A2A2E] rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
            <Terminal size={32} weight="duotone" className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight mb-2">Link Foldaa CLI</h1>
          <p className="text-[#666] text-sm">
            You are about to link your terminal to your <span className="text-white font-medium">{session.user.email}</span> account.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <ShieldCheck size={20} className="text-primary mt-0.5" weight="bold" />
            <div>
              <p className="text-sm font-bold">Secure Access</p>
              <p className="text-xs text-[#666]">This will grant the CLI access to manage your projects and deployments.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <CheckCircle size={20} className="text-primary mt-0.5" weight="bold" />
            <div>
              <p className="text-sm font-bold">Local Synchronization</p>
              <p className="text-xs text-[#666]">Your projects and settings will be available in your local terminal.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm mb-2">
              {error}
            </div>
          )}
          <button
            onClick={handleConfirm}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-[#E5E5E5] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Confirm and Link'} <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 rounded-xl text-[#666] hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-[#2A2A2E] text-center">
          <p className="text-xs uppercase tracking-widest text-[#444] font-bold">
            Foldaa Platform &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CliLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    }>
      <CliLoginContent />
    </Suspense>
  );
}
