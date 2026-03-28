"use client"
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useProjects } from '@/lib/hooks/useProjects';
import { ToastProvider } from '@/context/ToastContext';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'banner', label: 'Banner' },
    { id: 'store', label: 'Store' },
    { id: 'release', label: 'Release' },
    { id: 'events', label: 'Events' },
    { id: 'auth', label: 'Auth' },
    { id: 'domains', label: 'Domains' },
    { id: 'settings', label: 'Settings' },
];

export default function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { projects, loading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;

    const project = projects.find(p => p.id === projectId);
    const activeTab = pathname.split('/').pop() || 'overview';

    if (loading) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-background p-6 text-muted-foreground text-sm font-mono">
                Loading project details...
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-background p-6 text-red-500 text-sm font-mono">
                Project not found.
            </div>
        );
    }

    return (
        <ToastProvider>
            <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full">
                {/* Project Header / Top Bar */}
                <div className="h-10 flex-shrink-0 flex items-center px-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/dashboard')}>
                        <span className="text-lg font-bold leading-none select-none text-muted-foreground group-hover:text-foreground">~</span>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
                                return (
                                    <div
                                        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center overflow-hidden bg-background border border-foreground/12"
                                        style={{
                                            backgroundColor: projectIcon ? 'transparent' : (project.theme_color || 'var(--secondary)')
                                        }}
                                    >
                                        {projectIcon ? (
                                            <img src={projectIcon} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-foreground/20 select-none">
                                                {project.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                            <span className="text-sm font-bold text-foreground max-w-[150px] truncate select-none leading-none pt-[1px]">{project.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-6 ml-4 select-none">
                        {TABS.map((tab) => (
                            <Link
                                key={tab.id}
                                href={`/project/${projectId}/${tab.id}`}
                                className={clsx(
                                    "text-sm font-medium transition-colors flex items-center gap-1.5",
                                    activeTab === tab.id
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className={clsx("text-xs", activeTab === tab.id ? "text-foreground" : "text-muted-foreground")}>∷</span>
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pt-[3px] px-3 pb-3">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </div>
            </div>
        </ToastProvider>
    );
}
