"use client"
import dynamic from 'next/dynamic';

const Terminal = dynamic(() => import('@/components/terminal/Terminal'), { ssr: false });

export default function DashboardPage() {
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-black overflow-hidden relative">
            <Terminal 
                supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} 
                supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''} 
            />
        </div>
    );
}
