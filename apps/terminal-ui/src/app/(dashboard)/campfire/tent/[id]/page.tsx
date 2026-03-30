"use client"
import React, { useState } from 'react';
import { Tent, CaretLeft, Users, Fire, ShieldCheck, ShareNetwork, Sparkle, DownloadSimple, CloudArrowUp, Lightning, Wrench } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import TentFileWorkspace from '@/components/campfire/TentFileWorkspace';
import CampfireGraph from '@/components/campfire/CampfireGraph';
import TentCapabilities from '@/components/campfire/TentCapabilities';
import FlameActivityFeed, { Flame } from '@/components/campfire/FlameActivityFeed';

// --- MOCK DATA ---
const MOCK_MANIFEST = {
    system: `# System: OpenTable + AI (Smart Reservations)\n[SoT Manifest: system.md]\n\nThis system provides a natural language interface for restaurant discovery and reservation management, powered by Next.js and Supabase.\n\n## System Architecture\n\n### 1. Frontend (Next.js App Router)\n- **Reservation HUD**: A high-density dashboard for real-time table availability.\n- **AI Chat Overlay**: A floating assistant that understands "Book a table for 4 today at 7pm".\n- **Merchant Portal**: For restaurants to manage their floors.\n\n### 2. Backend (Supabase)\n- **Database**: \`restaurants\`, \`tables\`, \`reservations\`, \`availability\`.\n- **Auth**: Supabase Auth (OTP for customers, Google for merchants).\n- **Edge Functions**: \`process-reservation\`, \`notify-booking\`.\n\n### 3. AI Reservation Agent (Brain)\n- **Engine**: OpenAI GPT-4o-mini via LangChain.\n- **Persona**: A polite, efficient, and proactive concierge.`,
    design: `# Design: OpenTable + AI (Midnight Reservation)\n[SoT Manifest: design.md]\n\nThis design system is optimized for a premium, high-density HUD experience that feels responsive and intelligent.\n\n## Aesthetics\n\n### Color Palette\n- **Primary (Passion)**: \`#FF5A5F\` (Airbnb Red) for actionable reservation buttons and status alerts.\n- **Secondary (Precision)**: \`#00A699\` (Teal) for confirmed reservations and success states.\n- **Background (Midnight)**: \`#0A0A0A\` (Deepest Charcoal) for the core canvas.\n- **Surface (Glass)**: \`rgba(255, 255, 255, 0.05)\` with \`backdrop-blur-xl\` for overlays and cards.\n\n### Typography\n- **Headlines**: \`Outfit\` or \`Inter\` (Bold, tight tracking \`-0.02em\`).\n- **Body**: \`Inter\` (Regular, 14px, line-height 1.5).\n- **Monospace (HUD)**: \`JetBrains Mono\` for metadata.`,
    roadmap: `# Roadmap: OpenTable + AI (Smart Reservations)\n[SoT Manifest: roadmap.md]\n\nThis 4-week execution plan leads from ignition to an MVP of the Smart Reservation platform.\n\n## Week 1: Foundation (Ignition)\n- [x] **Day 1**: Project Repo scaffolding with Next.js App Router and Supabase integration.\n- [x] **Day 2**: DB Schema deployment (\`restaurants\`, \`tables\`, \`reservations\`, \`availability\`).\n- [ ] **Day 3**: UI Shell construction (Navigation, Dashboard, and Global Layout).\n- [ ] **Day 4**: Basic Merchant Portal - Floor view (static layout and table list).\n- [ ] **Day 5**: Initial Reservation API - CRUD operations for bookings.`,
    stack: `# Technical Stack: OpenTable + AI (Smart Reservations)\n[SoT Manifest: stack.md]\n\nThis project is built on a high-performance, modern web stack designed for real-time interaction and AI-native workflows.\n\n## Core (Frontend)\n- **Framework**: \`Next.js 15+\` (App Router, React Server Components).\n- **Styling**: \`Tailwind CSS\`, \`Framer Motion\`.\n- **State**: \`Zustand\`, \`TanStack Query\`.\n\n## Backend (BaaS)\n- **Database**: \`Supabase Postgres\`.\n- **Real-time Sync**: \`Supabase Realtime\`.\n- **Serverless**: \`Supabase Edge Functions\` (Deno).\n\n## AI Layer (Intelligence)\n- **LLM**: \`OpenAI GPT-4o-mini\`.\n- **Orchestration**: \`LangChain.js\`.`
};

const MOCK_BUILDERS = [
    { id: 'b1', name: 'J. Doe', role: 'Igniter / Client', level: 'Owner', capacity: 100, avatarUrl: 'https://i.pravatar.cc/150?u=b1' },
    { id: 'b2', name: 'Sarah Connor', role: 'Full Stack Engineer', level: 'Senior', capacity: 80, avatarUrl: 'https://i.pravatar.cc/150?u=b2' },
    { id: 'b3', name: 'Sparky', role: 'AI Agent', level: 'Brain', capacity: 100 },
];

const MOCK_FLAMES: Flame[] = [
    { id: 'f1', type: 'commit', message: 'feat: Initial Supabase DB schema deployment for tables and reservations', timestamp: new Date(Date.now() - 1000 * 60 * 5), author: 'Sarah Connor', metadata: 'c8f9b2A' },
    { id: 'f2', type: 'milestone', message: 'Week 1 - Day 2 Milestone Achieved: Database Ready', timestamp: new Date(Date.now() - 1000 * 60 * 45), author: 'Sparky', metadata: 'Roadmap' },
    { id: 'f3', type: 'comment', message: 'I think we should adjust the primary red color in design.md to be slightly less saturated for accessibility.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), author: 'J. Doe' },
    { id: 'f4', type: 'idea', message: 'Proposed integration of LangChain tool calling for availability check. Updating System Manifest.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), author: 'Sparky', metadata: 'Brain Suggestion' },
    { id: 'f5', type: 'merge', message: 'Merge pull request #1 from main/init-repo', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), author: 'Sarah Connor', metadata: 'main' },
];

export default function TentDetailsPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ file?: string }>
}) {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const resolvedSearchParams = React.use(searchParams);
    const tentId = resolvedParams.id;
    const activeFile = resolvedSearchParams.file;
    const [showFeed, setShowFeed] = useState(true);
    const [viewMode, setViewMode] = useState<'graph' | 'capabilities'>('graph');
    
    // Lifted State for persistence
    const [fileContents, setFileContents] = useState<Record<string, string>>(MOCK_MANIFEST);
    const [flames, setFlames] = useState<Flame[]>(MOCK_FLAMES);

    const handleUpdateFileContent = (fileId: string, newContent: string, silent = false) => {
        setFileContents(prev => ({ ...prev, [fileId]: newContent }));
        
        if (!silent) {
            // Auto-generate activity flame
            const newFlame: Flame = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'commit',
                author: 'Sarah Connor', // Current user mock
                message: `Updated manifest "${fileId}.md"`,
                timestamp: new Date(),
                metadata: 'MANUAL SYNC'
            };
            setFlames(prev => [newFlame, ...prev]);
        }
    };

    const handleAddFlame = (message: string) => {
        const newFlame: Flame = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'comment',
            author: 'You',
            message,
            timestamp: new Date()
        };
        setFlames(prev => [newFlame, ...prev]);
    };
    
    // In a real app we would fetch the data based on tentId here.
    const isMock = tentId === 'opentable-ai';

    return (
        <div className="flex-1 flex max-h-screen min-w-0 bg-background overflow-hidden relative selection:bg-neutral-800">
            {/* Main Center Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-y-auto">
                
                {/* Minimalist Header */}
                <header className="flex-shrink-0 px-8 py-6 border-b border-neutral-200/10 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex flex-col gap-4">
                        
                        {/* Top Row: Title & Actions */}
                        <div className="flex items-center justify-between">
                            {/* Title & Description */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => router.push('/campfire')}
                                    className="text-muted-foreground hover:text-foreground transition-colors mr-1"
                                >
                                    <CaretLeft size={16} weight="bold" />
                                </button>
                                <h1 className="text-base font-bold tracking-tight text-foreground">
                                    {isMock ? 'Opentable + AI' : `Tent ${tentId}`}
                                </h1>
                                <p className="text-sm text-muted-foreground/60 hidden md:block">
                                    Smart reservation system with natural language parsing and real-time floor management.
                                </p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => router.push(`/campfire/tent/${tentId}`)}
                                    className={clsx(
                                        "transition-colors hover:text-red-400 focus:outline-none",
                                        !activeFile ? "text-red-500" : "text-neutral-500/50"
                                    )}
                                    title="Campfire Builders"
                                >
                                    <Fire size={20} weight={!activeFile ? "fill" : "regular"} />
                                </button>

                                <button 
                                    onClick={() => setViewMode(viewMode === 'graph' ? 'capabilities' : 'graph')}
                                    className={clsx(
                                        "transition-colors hover:text-blue-400 focus:outline-none",
                                        viewMode === 'capabilities' ? "text-blue-500" : "text-neutral-500/50"
                                    )}
                                    title="Tent Capabilities"
                                >
                                    <Wrench size={20} weight={viewMode === 'capabilities' ? "fill" : "regular"} />
                                </button>
                                
                                <button 
                                    onClick={() => setShowFeed(!showFeed)}
                                    className={clsx(
                                        "transition-colors hover:text-amber-400 focus:outline-none",
                                        showFeed ? "text-amber-500" : "text-neutral-500/50"
                                    )}
                                    title="Flame Feed"
                                >
                                    <Lightning size={20} weight={showFeed ? "fill" : "regular"} />
                                </button>
                                
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100/5 hover:bg-neutral-100/10 border border-neutral-200/10 text-muted-foreground hover:text-foreground text-xs font-bold transition-all ml-1">
                                    <ShareNetwork size={14} weight="bold" />
                                    Share
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Metadata Details */}
                        <div className="flex items-center gap-6 mt-2 ml-[30px]"> {/* ml-[30px] aligns text with Title skipping Caret */}
                            <div className="flex items-center gap-8">
                                <div className="flex items-center justify-center p-1 border border-neutral-200/10 rounded-md">
                                    <Tent size={18} weight="duotone" className="text-foreground" />
                                </div>
                                
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Progress</p>
                                    <p className="text-xs font-bold text-foreground leading-none">Week 1 of 4</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Capacity Used</p>
                                    <p className="text-xs font-bold text-foreground leading-none">60% of 3 Builders</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Repository</p>
                                    <p className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer leading-none">
                                        foldaa/opentable-ai
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </header>

                {/* Immersive Center Canvas */}
                <div className="flex-1 w-full h-full relative" style={{ height: 'calc(100vh - 120px)' }}>
                    {activeFile ? (
                        <div className="p-8 pb-32 max-w-6xl mx-auto w-full h-[calc(100vh-140px)]">
                            <TentFileWorkspace 
                                fileId={activeFile} 
                                manifestContent={fileContents[activeFile] || `# ${activeFile}.md\n\nStart outlining the technical requirements and architecture for this module...`} 
                                onSave={(newContent) => handleUpdateFileContent(activeFile, newContent)}
                                onRestore={(newContent) => handleUpdateFileContent(activeFile, newContent, false)}
                            />
                        </div>
                    ) : viewMode === 'graph' ? (
                        <CampfireGraph builders={MOCK_BUILDERS} />
                    ) : (
                        <div className="p-8 pb-32 max-w-6xl mx-auto w-full h-[calc(100vh-140px)]">
                            <TentCapabilities builders={MOCK_BUILDERS} />
                        </div>
                    )}
                </div>

            </div>

            {/* Right Panel: Flame Activity Feed */}
            <div className={clsx(
                "transition-all duration-500 ease-in-out shrink-0",
                showFeed ? "w-[320px] opacity-100" : "w-0 opacity-0 overflow-hidden"
            )}>
                <FlameActivityFeed 
                    flames={flames} 
                    status={isMock ? "burning" : "ignited"} 
                    onAddFlame={handleAddFlame}
                />
            </div>

        </div>
    );
}
