"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useProjects, Project } from '@/lib/hooks/useProjects';
import { UIProvider, useUI } from '@/lib/contexts/UIContext';
import { supabase } from '@/lib/supabase';
import { Globe, Gear, SignOut, CaretDown, Plus, Package, Flame, Tent, User, Check, SquaresFour } from "@phosphor-icons/react";
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import CreateProjectForm from '@/components/terminal/CreateProjectForm';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { ToastContainer } from '@/components/Toast';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { useWorkspaces } from '@/lib/contexts/WorkspaceContext';
import CreateWorkspaceModal from '@/components/terminal/CreateWorkspaceModal';
import EditWorkspaceModal from '@/components/terminal/EditWorkspaceModal';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const { toggleSidebar, isCreateModalOpen, setCreateModalOpen, toasts, removeToast, dashboardView, setDashboardView } = useUI();
    const { activeWorkspace, workspaces, setActiveWorkspaceId } = useWorkspaces();
    const [isWorkspaceModalOpen, setWorkspaceModalOpen] = useState(false);
    const [isEditWorkspaceModalOpen, setEditWorkspaceModalOpen] = useState(false);
    const { profile, loading: profileLoading } = useUserProfile();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<'projects' | 'domains' | 'campfire'>('projects');
    
    // Sync activeTab with pathname
    useEffect(() => {
        if (pathname === '/campfire') {
            setActiveTab('campfire');
        } else if (pathname?.includes('/domains')) {
            setActiveTab('domains');
        } else {
            setActiveTab('projects');
        }
    }, [pathname]);
    const { projects } = useProjects();
    const isPro = profile?.subscriptionPlan === 'pro';

    const isSettingsPath = pathname === '/account' || pathname?.startsWith('/account/');


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                // Don't trigger if user is typing in an input or textarea
                if (
                    document.activeElement?.tagName === 'INPUT' || 
                    document.activeElement?.tagName === 'TEXTAREA' ||
                    (document.activeElement as HTMLElement)?.isContentEditable
                ) {
                    return;
                }
                
                e.preventDefault();
                setCreateModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setCreateModalOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-dvh bg-background text-foreground font-sans overflow-hidden selection:bg-secondary">
            {/* Top Bar (MacOS / Warp Title bar) */}
            <motion.div 
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-10 flex-shrink-0 flex items-center justify-between px-3 bg-background border-b border-neutral-200 relative z-50 text-[11px] font-bold tracking-tight"
            >
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none opacity-40 uppercase">
                    Foldaa
                </div>
                <div className="flex items-center gap-6">
                    {/* Sidebar Toggle & Split */}
                    {!isSettingsPath && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={toggleSidebar}
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <path d="M9 3v18" />
                            </svg>
                            <button 
                                onClick={() => {
                                    setActiveTab('projects');
                                    setDashboardView('grid');
                                    router.push('/dashboard');
                                }}
                                className={clsx(
                                    "transition-colors",
                                    activeTab === 'projects' && dashboardView === 'grid' ? "text-foreground" : "hover:text-foreground"
                                )}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Tab Selectors */}
                    {!isSettingsPath && (
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <button
                                onClick={() => {
                                    setActiveTab('projects');
                                    setDashboardView('terminal');
                                    router.push('/dashboard');
                                }}
                                className={clsx(
                                    "transition-colors flex items-center gap-1.5", 
                                    activeTab === 'projects' && dashboardView === 'terminal' ? 'text-foreground' : 'hover:text-foreground'
                                )}
                            >
                                <span className="text-lg leading-none">፨</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('domains');
                                }}
                                className={clsx("transition-colors flex items-center gap-1.5", activeTab === 'domains' ? 'text-foreground' : 'hover:text-foreground')}
                            >
                                <Globe size={14} />
                            </button>
                             <button
                                onClick={() => {
                                    setActiveTab('campfire');
                                    router.push('/campfire');
                                }}
                                className={clsx("transition-colors flex items-center justify-center p-1 rounded-md", activeTab === 'campfire' ? 'bg-secondary text-yellow-500' : 'text-muted-foreground hover:text-foreground')}
                                title="Marketplace"
                            >
                                <Tent size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Workspace Selector */}
                 <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
                    <Dropdown
                        align="left"
                        trigger={
                            <div className="btn-outline px-2 py-1.5 border-neutral-200 cursor-pointer group">
                                <div className="w-5 h-5 rounded-sm bg-foreground flex items-center justify-center text-[10px] font-bold text-background uppercase overflow-hidden">
                                     {activeWorkspace?.logo_url ? (
                                        <img src={activeWorkspace.logo_url} alt="Logo" className="object-cover w-full h-full" />
                                    ) : (
                                        activeWorkspace?.name.charAt(0) || 'W'
                                    )}
                                </div>
                                <span className="text-sm font-medium font-sans">
                                    {activeWorkspace?.name || 'Workspace'}
                                </span>
                                <CaretDown size={14} className="text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                            </div>
                        }
                    >
                        <div className="px-3 py-2 border-b border-neutral-200 mb-1 flex items-center justify-between group/title">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspaces</p>
                            {activeWorkspace?.owner_id === profile?.id && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditWorkspaceModalOpen(true);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                    title="Workspace Settings"
                                >
                                    <Gear size={12} weight="bold" />
                                </button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-1 px-1 flex flex-col gap-0.5">
                            {workspaces.map((ws) => (
                                 <DropdownItem 
                                    key={ws.id}
                                    onClick={() => setActiveWorkspaceId(ws.id)}
                                    className={clsx(
                                        "w-full transition-all",
                                        activeWorkspace?.id === ws.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold uppercase overflow-hidden",
                                        activeWorkspace?.id === ws.id ? "bg-foreground text-foreground" : "bg-foreground/5 text-zinc-600 border border-white/[0.05]"
                                    )}>
                                        {ws.logo_url ? (
                                            <img src={ws.logo_url} alt="Logo" className="object-cover w-full h-full" />
                                        ) : (
                                            ws.name.charAt(0)
                                        )}
                                    </div>
                                    <span className="truncate">{ws.name}</span>
                                    {activeWorkspace?.id === ws.id && (
                                        <Check size={12} weight="bold" className="ml-auto text-foreground/50" />
                                    )}
                                </DropdownItem>
                            ))}
                        </div>
                         <div className="h-px bg-border my-1" />
                        <DropdownItem onClick={() => setWorkspaceModalOpen(true)} className="text-muted-foreground hover:text-foreground">
                            <Plus size={16} weight="bold" />
                            New Workspace
                        </DropdownItem>
                    </Dropdown>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {profileLoading ? (
                        <Skeleton className="w-20 h-6" />
                    ) : !isPro && (
                         <div 
                            className="flex items-center gap-1.5 border border-foreground/12 bg-card rounded px-2 py-0.5 pr-1.5 transition-colors cursor-pointer hover:border-foreground/20 group"
                            onClick={() => router.push('/account?tab=subscription')}
                        >
                            <span className="text-[10px] font-mono-hud font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                                {isPro ? 'Pro' : `Free ${projects.length}/3`}
                            </span>
                        </div>
                    )}

                    {profileLoading ? (
                        <Skeleton className="w-6 h-6 rounded-full" />
                    ) : (
                        <Dropdown
                            align="right"
                            trigger={
                                <div className="w-6 h-6 rounded-full bg-card flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border border-neutral-200 overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-xs text-foreground font-bold uppercase">
                                            {(profile?.first_name || profile?.email || 'F').charAt(0)}
                                        </span>
                                    )}
                                </div>
                            }
                        >
                            <div className="px-3 py-2 border-b border-foreground/12 mb-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Settings</p>
                            </div>
                            <DropdownItem href="/account">
                                <Gear size={14} />
                                Settings
                            </DropdownItem>
                            {profile?.username && (
                                <DropdownItem href={`/u/${profile.username}`}>
                                    <User size={14} />
                                    Creator Profile
                                </DropdownItem>
                            )}
                            <DropdownItem onClick={handleLogout} className="text-red-400/80 hover:text-red-400">
                                <SignOut size={14} />
                                Log out
                            </DropdownItem>
                        </Dropdown>
                    )}
                </div>
            </motion.div>

            {/* Main Content Area */}
            <main className="flex-1 flex min-w-0 bg-background relative overflow-hidden">
                {!isSettingsPath && (
                    <motion.div
                        initial={{ x: -260, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="flex h-full"
                    >
                        <Sidebar activeTab={activeTab} />
                    </motion.div>
                )}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
                >
                    {children}
                </motion.div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateProjectForm />
                )}
            </AnimatePresence>


            <AnimatePresence>
                {profile && !profile.onboarding_completed && (
                    <OnboardingModal />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isWorkspaceModalOpen && (
                    <CreateWorkspaceModal isOpen={isWorkspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditWorkspaceModalOpen && activeWorkspace && (
                    <EditWorkspaceModal 
                        workspace={activeWorkspace} 
                        isOpen={isEditWorkspaceModalOpen} 
                        onClose={() => setEditWorkspaceModalOpen(false)} 
                    />
                )}
            </AnimatePresence>

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
    );
}
