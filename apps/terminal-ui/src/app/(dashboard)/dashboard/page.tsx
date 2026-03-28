"use client"
import ProjectGridView from '@/components/dashboard/ProjectGridView';
import dynamic from 'next/dynamic';
import { useUI } from '@/lib/contexts/UIContext';

// Dynamically import Terminal with SSR disabled because xterm depends on browser globals (self, window)
const TerminalUI = dynamic(() => import('@/components/terminal/Terminal'), { 
    ssr: false,
    loading: () => <div className="flex-1 bg-background animate-pulse" />
});

export default function DashboardPage() {
    const { dashboardView } = useUI();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
            {dashboardView === 'terminal' ? (
                <TerminalUI 
                    supabaseUrl={supabaseUrl} 
                    supabaseAnonKey={supabaseAnonKey} 
                />
            ) : (
                <ProjectGridView />
            )}
        </div>
    );
}
