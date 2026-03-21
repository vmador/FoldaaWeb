"use client"
import React, { useState, useEffect } from "react";
import { useProjects, Project } from "@/lib/hooks/useProjects";
import { useDomains, Domain } from "@/lib/hooks/useDomains";
import { 
    Search, Globe, Plus, CheckCircle2, AlertCircle, Clock, 
    Grid, Zap, Briefcase, BookOpen, Gamepad2, Users, Wrench, Heart, Newspaper, Palette, ShoppingBag, Package 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import { usePathname, useRouter, useParams } from "next/navigation";
import clsx from "clsx";
import { useUI } from "@/lib/contexts/UIContext";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
    activeTab: 'projects' | 'domains' | 'campfire';
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const { projects, loading: projectsLoading } = useProjects();
    const { domains, loading: domainsLoading } = useDomains();
    const { isSidebarOpen, setCreateModalOpen } = useUI();
    const [searchQuery, setSearchQuery] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();

    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        setSearchQuery('');
        
        const fetchCounts = async () => {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .select('category')
                .eq('status', 'published');
            
            if (!error && data) {
                const counts: Record<string, number> = { all: data.length };
                data.forEach(item => {
                    if (item.category) {
                        counts[item.category] = (counts[item.category] || 0) + 1;
                    }
                });
                setCategoryCounts(counts);
            }
        };

        if (activeTab === 'campfire') {
            fetchCounts();
        }
    }, [activeTab]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside
            className={clsx(
                "h-full bg-[#000000] border-[#202020] flex flex-col font-sans select-none shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                isSidebarOpen ? "w-72 border-r" : "w-0 border-r-0"
            )}
        >
            <div className={clsx(
                "flex flex-col h-full transition-opacity duration-200",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                {/* Search Input */}
                <div className="px-3 pt-4 pb-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444] group-focus-within:text-[#888] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                if (activeTab === 'campfire') {
                                    window.dispatchEvent(new CustomEvent('marketplace-search', { detail: val }));
                                }
                            }}
                            placeholder={activeTab === 'projects' ? "Search project..." : activeTab === 'domains' ? "Search domains..." : "Search marketplace..."}
                            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[#A0A0A0] outline-none focus:border-[#333] transition-all placeholder-[#333]"
                        />
                    </div>
                </div>

                {/* New Action Button */}
                <div className="px-3 py-2">
                    <button 
                        onClick={() => {
                            if (activeTab === 'projects') {
                                setCreateModalOpen(true);
                            } else if (activeTab === 'domains') {
                                const projectId = params?.id as string;
                                if (pathname?.includes('/domains')) {
                                    window.dispatchEvent(new CustomEvent('open-add-domain'));
                                    return;
                                }
                                if (projectId) {
                                    router.push(`/project/${projectId}/domains?add=true`);
                                } else if (projects.length > 0) {
                                    router.push(`/project/${projects[0].id}/domains?add=true`);
                                } else {
                                    setCreateModalOpen(true);
                                }
                            } else {
                                // Campfire: Publish New
                                window.dispatchEvent(new CustomEvent('open-publish-listing'));
                            }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#111111] text-[#D8D8D8] hover:text-white transition-all group border border-transparent hover:border-[#1A1A1A]"
                    >
                        <Plus className="w-4 h-4 border border-[#333] rounded-sm p-0.5 group-hover:border-[#666]" />
                        <span className="text-sm font-medium">
                            {activeTab === 'projects' ? 'New Deployment' : activeTab === 'domains' ? 'New Domain' : 'Publish New'}
                        </span>
                    </button>
                </div>

                {/* Lists Section Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                    {activeTab === 'projects' ? (
                        <>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <span className="text-xs font-bold text-[#444] tracking-widest uppercase">Past</span>
                                <div className="h-[1px] flex-1 bg-[#111]"></div>
                            </div>
                            <div className="space-y-1">
                                {projectsLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-[#0A0A0A] rounded-lg animate-pulse mb-2" />
                                    ))
                                ) : filteredProjects.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-[#444]">No projects found</div>
                                ) : (
                                    filteredProjects.map((project) => {
                                        const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
                                        return (
                                            <Link
                                                key={project.id}
                                                href={`/project/${project.id}`}
                                                className="group flex flex-col gap-0.5 p-2 rounded-lg hover:bg-[#111111] cursor-pointer transition-all border border-transparent hover:border-[#1A1A1A] block"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center overflow-hidden bg-[#0A0A0A] border border-[#1A1A1A]">
                                                            {projectIcon ? (
                                                                <img src={projectIcon} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-white/20">
                                                                    {project.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-[#D8D8D8] truncate">{project.name}</span>
                                                    </div>
                                                    <span className="text-xs text-[#444] group-hover:text-[#666]">
                                                        {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : activeTab === 'domains' ? (
                        <>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <span className="text-xs font-bold text-[#444] tracking-widest uppercase">Domains</span>
                                <div className="h-[1px] flex-1 bg-[#111]"></div>
                            </div>
                            <div className="space-y-1">
                                {domainsLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-[#0A0A0A] rounded-lg animate-pulse mb-2" />
                                    ))
                                ) : domains.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-[#444]">No domains found</div>
                                ) : (
                                    domains
                                        .filter(d => d.domain_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((domain) => (
                                            <Link 
                                                key={domain.id} 
                                                href={`/project/${domain.project_id}/domains?domainId=${domain.id}`}
                                                className="flex flex-col gap-0.5 p-2 rounded-lg hover:bg-[#111111] cursor-pointer transition-all border border-transparent hover:border-[#1A1A1A] block"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium text-[#D8D8D8]">
                                                    <Globe className="w-3.5 h-3.5 text-[#666]" />
                                                    <span className="truncate">{domain.domain_name}</span>
                                                </div>
                                            </Link>
                                        ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <span className="text-xs font-bold text-[#444] tracking-widest uppercase">Categories</span>
                                <div className="h-[1px] flex-1 bg-[#111]"></div>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { value: 'all', label: 'All Apps', icon: Grid },
                                    { value: 'business', label: 'Business', icon: Briefcase },
                                    { value: 'productivity', label: 'Productivity', icon: Zap },
                                    { value: 'education', label: 'Education', icon: BookOpen },
                                    { value: 'entertainment', label: 'Entertainment', icon: Gamepad2 },
                                    { value: 'social', label: 'Social', icon: Users },
                                    { value: 'utilities', label: 'Utilities', icon: Wrench },
                                    { value: 'lifestyle', label: 'Lifestyle', icon: Heart },
                                    { value: 'news', label: 'News', icon: Newspaper },
                                    { value: 'portfolio', label: 'Portfolio', icon: Palette },
                                    { value: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
                                    { value: 'other', label: 'Other', icon: Package },
                                ].map((cat) => {
                                    const Icon = cat.icon as any;
                                    return (
                                        <button
                                            key={cat.value}
                                            onClick={() => window.dispatchEvent(new CustomEvent('marketplace-category-select', { detail: cat.value }))}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#111111] cursor-pointer transition-all border border-transparent hover:border-[#1A1A1A] group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-3.5 h-3.5 text-[#666] group-hover:text-[#A0A0A0]" />
                                                <span className="text-sm font-medium text-[#D8D8D8] group-hover:text-white">{cat.label}</span>
                                            </div>
                                            <span className="text-xs text-[#444] font-mono">
                                                {categoryCounts[cat.value] || 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-3 border-t border-[#111]">
                    <button className="text-xs font-bold text-[#666] hover:text-[#A0A0A0] transition-colors px-2 py-1 rounded bg-[#0A0A0A] border border-[#1A1A1A]">
                        View all
                    </button>
                </div>
            </div>
        </aside>
    );
}
