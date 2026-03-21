"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useProjects, Project } from '@/lib/hooks/useProjects';
import { UIProvider, useUI } from '@/lib/contexts/UIContext';
import { supabase } from '@/lib/supabase';
import { Globe, Settings, LogOut, ChevronDown, Plus, Package, Flame, Tent, User } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import CreateProjectForm from '@/components/terminal/CreateProjectForm';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { ToastContainer } from '@/components/Toast';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const { toggleSidebar, isCreateModalOpen, setCreateModalOpen, toasts, removeToast } = useUI();
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-white transition-colors"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                        </div>
                    )}

                    {/* Tab Selectors */}
                    {!isSettingsPath && (
                        <div className="flex items-center gap-4 text-[#444]">
                            <button
                                onClick={() => {
                                    setActiveTab('projects');
                                    router.push('/dashboard');
                                }}
                                className={clsx("transition-colors flex items-center gap-1.5", activeTab === 'projects' ? 'text-white' : 'hover:text-white')}
                            >
                                <span className="text-lg leading-none">፨</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('domains');
                                }}
                                className={clsx("transition-colors flex items-center gap-1.5", activeTab === 'domains' ? 'text-white' : 'hover:text-white')}
                            >
                                <Globe className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('campfire');
                                    router.push('/campfire');
                                }}
                                className={clsx("transition-colors flex items-center justify-center p-1 rounded-md", activeTab === 'campfire' ? 'bg-[#1a1a1a] text-yellow-500' : 'text-[#444] hover:text-white')}
                                title="Marketplace"
                            >
                                <Tent className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Organization Selector */}
                <div className="flex-1 flex justify-center">
                    <Dropdown
                        align="left"
                        trigger={
                            <div className="flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors cursor-pointer group">
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt="Avatar" width={20} height={20} className="rounded-md object-cover" />
                                ) : (
                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                        {(profile?.first_name || profile?.email || 'F').charAt(0)}
                                    </div>
                                )}
                                <span className="text-sm font-medium font-sans">
                                    {(profile?.first_name && profile?.last_name) ? `${profile.first_name} ${profile.last_name}` : profile?.first_name || profile?.email?.split('@')[0] || 'User'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-[#444] group-hover:text-[#888] transition-colors" />
                            </div>
                        }
                    >
                        <div className="px-3 py-2 border-b border-[#202020] mb-1">
                            <p className="text-xs font-bold text-[#444] uppercase tracking-wider">Organizations</p>
                        </div>
                        <DropdownItem className="bg-[#111] text-white">
                            <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-xs font-bold uppercase">
                                {(profile?.first_name || profile?.email || 'V').charAt(0)}
                            </div>
                            {(profile?.first_name && profile?.last_name) ? `${profile.first_name} ${profile.last_name}` : profile?.first_name || profile?.email?.split('@')[0] || 'Personal'}
                        </DropdownItem>
                    </Dropdown>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div 
                        className={clsx(
                            "flex items-center gap-1.5 border rounded px-2 py-0.5 pr-1.5 transition-colors",
                            isPro ? "bg-[#111] border-[#333] cursor-default" : "bg-[#111] border-[#333] cursor-pointer hover:border-[#555] group"
                        )}
                        onClick={() => !isPro && router.push('/account?tab=subscription')}
                    >
                        {isPro ? (
                            <>
                                <span className="text-xs font-bold text-white tracking-widest uppercase">PRO</span>
                                <span className="text-xs font-sans text-[#A0A0A0]">Unlimited</span>
                            </>
                        ) : (
                            <span className="text-xs font-sans font-medium text-[#A0A0A0] group-hover:text-white transition-colors">
                                {projects.length}/3 Upgrade
                            </span>
                        )}
                    </div>

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
                            <p className="text-xs font-bold text-[#444] uppercase tracking-wider">Account</p>
                        </div>
                        <DropdownItem href="/account">
                            <Settings className="w-3.5 h-3.5" />
                            Settings
                        </DropdownItem>
                        {profile?.username && (
                            <DropdownItem href={`/u/${profile.username}`}>
                                <User className="w-3.5 h-3.5" />
                                Workspace (Profile Dev)
                            </DropdownItem>
                        )}
                        <DropdownItem onClick={handleLogout} className="text-red-400/80 hover:text-red-400">
                            <LogOut className="w-3.5 h-3.5" />
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
        <UIProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </UIProvider>
    );
}
