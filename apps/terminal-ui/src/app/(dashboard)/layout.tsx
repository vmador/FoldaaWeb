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
import CreateProjectForm from '@/components/terminal/CreateProjectForm';
import { AnimatePresence } from 'framer-motion';
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
    const { profile } = useUserProfile();
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
        <div className="flex flex-col h-dvh bg-black text-[#D8D8D8] font-mono overflow-hidden selection:bg-[#343A46]">
            {/* Top Bar (MacOS / Warp Title bar) */}
            <div className="h-10 flex-shrink-0 flex items-center justify-between px-3 bg-[#000000] border-b border-[#202020] relative z-50">
                <div className="flex items-center gap-6">
                    {/* Sidebar Toggle & Split */}
                    {!isSettingsPath && (
                        <div className="flex items-center gap-2 text-[#666]">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="cursor-pointer hover:text-white transition-colors"
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
                                    activeTab === 'projects' && dashboardView === 'grid' ? "text-white" : "hover:text-white"
                                )}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Tab Selectors */}
                    {!isSettingsPath && (
                        <div className="flex items-center gap-4 text-[#444]">
                            <button
                                onClick={() => {
                                    setActiveTab('projects');
                                    setDashboardView('terminal');
                                    router.push('/dashboard');
                                }}
                                className={clsx(
                                    "transition-colors flex items-center gap-1.5", 
                                    activeTab === 'projects' && dashboardView === 'terminal' ? 'text-white' : 'hover:text-white'
                                )}
                            >
                                <span className="text-lg leading-none">፨</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('domains');
                                }}
                                className={clsx("transition-colors flex items-center gap-1.5", activeTab === 'domains' ? 'text-white' : 'hover:text-white')}
                            >
                                <Globe size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('campfire');
                                    router.push('/campfire');
                                }}
                                className={clsx("transition-colors flex items-center justify-center p-1 rounded-md", activeTab === 'campfire' ? 'bg-[#1a1a1a] text-yellow-500' : 'text-[#444] hover:text-white')}
                                title="Marketplace"
                            >
                                <Tent size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Workspace Selector */}
                <div className="flex-1 flex justify-center">
                    <Dropdown
                        align="left"
                        trigger={
                            <div className="flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors cursor-pointer group">
                                {activeWorkspace?.logo_url ? (
                                    <div className="w-5 h-5 rounded-md border border-white/[0.08] overflow-hidden">
                                        <Image src={activeWorkspace.logo_url} alt="Logo" width={20} height={20} className="object-cover w-full h-full" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                                        {activeWorkspace?.name.charAt(0) || 'W'}
                                    </div>
                                )}
                                <span className="text-sm font-medium font-sans">
                                    {activeWorkspace?.name || 'Workspace'}
                                </span>
                                <CaretDown size={14} className="text-[#444] group-hover:text-[#888] transition-colors" />
                            </div>
                        }
                    >
                        <div className="px-3 py-2 border-b border-[#202020] mb-1 flex items-center justify-between group/title">
                            <p className="text-xs font-bold text-[#444] uppercase tracking-wider">Workspaces</p>
                            {activeWorkspace?.owner_id === profile?.id && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditWorkspaceModalOpen(true);
                                    }}
                                    className="text-[#444] hover:text-white transition-colors p-1"
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
                                        activeWorkspace?.id === ws.id ? "bg-[#1A1A1A] text-white" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold uppercase overflow-hidden",
                                        activeWorkspace?.id === ws.id ? "bg-white text-black" : "bg-white/5 text-zinc-600 border border-white/[0.05]"
                                    )}>
                                        {ws.logo_url ? (
                                            <Image src={ws.logo_url} alt="Logo" width={20} height={20} className="object-cover w-full h-full" />
                                        ) : (
                                            ws.name.charAt(0)
                                        )}
                                    </div>
                                    <span className="truncate">{ws.name}</span>
                                    {activeWorkspace?.id === ws.id && (
                                        <Check size={12} weight="bold" className="ml-auto text-white/50" />
                                    )}
                                </DropdownItem>
                            ))}
                        </div>
                        <div className="h-px bg-[#202020] my-1" />
                        <DropdownItem onClick={() => setWorkspaceModalOpen(true)} className="text-zinc-400 hover:text-white">
                            <Plus size={16} weight="bold" />
                            New Workspace
                        </DropdownItem>
                    </Dropdown>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {!isPro && (
                        <div 
                            className="flex items-center gap-1.5 border border-[#333] bg-[#111] rounded px-2 py-0.5 pr-1.5 transition-colors cursor-pointer hover:border-[#555] group"
                            onClick={() => router.push('/account?tab=subscription')}
                        >
                            <span className="text-xs font-sans font-medium text-[#A0A0A0] group-hover:text-white transition-colors">
                                Free {projects.length}/3
                            </span>
                        </div>
                    )}

                    <Dropdown
                        align="right"
                        trigger={
                            <div className="w-6 h-6 rounded-full bg-[#111] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border border-[#333] overflow-hidden">
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt="Avatar" width={24} height={24} className="object-cover" />
                                ) : (
                                    <span className="text-xs text-[#D8D8D8] font-bold uppercase">
                                        {(profile?.first_name || profile?.email || 'F').charAt(0)}
                                    </span>
                                )}
                            </div>
                        }
                    >
                        <div className="px-3 py-2 border-b border-[#202020] mb-1">
                            <p className="text-xs font-bold text-[#444] uppercase tracking-wider">Account Settings</p>
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
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex min-w-0 bg-[#000000] relative overflow-hidden">
                {!isSettingsPath && <Sidebar activeTab={activeTab} />}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {children}
                </div>
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
