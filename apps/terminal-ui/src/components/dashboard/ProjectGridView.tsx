"use client"
import React from "react";
import Link from "next/link";
import { useProjectData, Project } from "@/lib/contexts/ProjectContext";
import { Plus, Clock } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

export default function ProjectGridView() {
    const { projects, loading } = useProjectData();

    if (loading) {
        return (
            <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-background custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-[1.1/1] rounded-2xl bg-foreground/[0.02] border border-white/[0.05] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-[1600px] mx-auto pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center mb-6 text-muted-foreground">
                            <Plus size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No projects yet</h3>
                        <p className="text-zinc-600 max-w-[300px] mt-2">Create your first site using the New Site button in the sidebar.</p>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--muted-foreground);
                }
            `}</style>
        </div>
    );
}

function ProjectCard({ project }: { project: Project }) {
    const icon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;

    return (
        <div className="group flex flex-col gap-4">
            <Link 
                href={`/project/${project.id}/overview`}
                className="block relative aspect-[1.1/1] bg-secondary border border-border rounded-xl overflow-hidden hover:border-border/80 hover:bg-secondary/50 transition-all duration-500 shadow-2xl"
            >
                {/* Visual Header / Mock Preview Area */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent flex items-center justify-center group-hover:bg-foreground/[0.04] transition-colors overflow-hidden">
                    {/* Placeholder for project preview or large icon */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-background/40 border border-white/[0.08] flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover:scale-110">
                        {icon ? (
                            <img src={icon} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-black text-foreground/10 uppercase tracking-tighter">{project.name.charAt(0)}</span>
                        )}
                    </div>
                </div>

                {/* Hover Accent Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            </Link>

            {/* Info Below Card - Matching Screenshot */}
            <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-foreground group-hover:text-foreground transition-colors truncate pr-4 font-sans tracking-tight">
                        {project.name}
                    </h3>
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.1em] font-mono-hud">
                        {project.subscription_plan || 'FREE'}
                    </span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono-hud font-medium uppercase tracking-wide">
                        <span>Updated {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
