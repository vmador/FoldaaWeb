"use client"
import React, { useState, useEffect } from "react";
import { useProjects, Project, useFolders } from "@/lib/hooks/useProjects";
import { useDomains, Domain } from "@/lib/hooks/useDomains";
import { 
    Search, Globe, Plus, CheckCircle2, AlertCircle, Clock, 
    Grid, Zap, Briefcase, BookOpen, Gamepad2, Users, Wrench, Heart, Newspaper, Palette, ShoppingBag, Package,
    ChevronRight, ChevronDown, FolderIcon, MoreHorizontal, Move
} from "lucide-react";
import { Folder as PhosphorFolder } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import { usePathname, useRouter, useParams } from "next/navigation";
import clsx from "clsx";
import { useUI } from "@/lib/contexts/UIContext";
import { supabase } from "@/lib/supabase";
import CreateFolderModal from "./terminal/CreateFolderModal";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuSubmenu } from "./ui/ContextMenu";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    activeTab: 'projects' | 'domains' | 'campfire';
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const { projects, loading: projectsLoading, mutate: mutateProjects } = useProjects();
    const { domains, loading: domainsLoading } = useDomains();
    const { folders, loading: foldersLoading, updateFolder, moveProjectToFolder } = useFolders();
    const { isSidebarOpen, setCreateModalOpen } = useUI();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    
    // Rename/Edit Folder State
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState("");

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, projectId: string } | null>(null);
    
    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleFolder = (folderId: string) => {
        setOpenFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const toggleAllFolders = () => {
        const allOpen = folders.every(f => openFolders[f.id]);
        if (allOpen) {
            setOpenFolders({});
        } else {
            const next: Record<string, boolean> = {};
            folders.forEach(f => {
                next[f.id] = true;
            });
            setOpenFolders(next);
        }
    };
    const handleRenameFolder = async (folderId: string) => {
        if (!editFolderName.trim()) {
            setEditingFolderId(null);
            return;
        }
        try {
            await updateFolder(folderId, { name: editFolderName.trim() });
        } catch (err) {
            console.error("Failed to rename folder:", err);
        }
        setEditingFolderId(null);
    };
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
                "h-full bg-neutral-50 flex flex-col font-sans select-none shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                isSidebarOpen ? "w-72 border-r border-neutral-200" : "w-0 border-r-0"
            )}
        >
            <div className={clsx(
                "flex flex-col h-full transition-opacity duration-200",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                {/* Search Input */}
                 <div className="px-3 pt-4 pb-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                if (activeTab === 'campfire') {
                                    window.dispatchEvent(new CustomEvent('marketplace-search', { detail: val }));
                                }
                            }}
                            placeholder={activeTab === 'projects' ? "Search" : activeTab === 'domains' ? "Search domains..." : "Search marketplace..."}
                            className="w-full bg-neutral-100 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground outline-none focus:border-neutral-300 transition-all placeholder-muted-foreground/50"
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
                        className="w-full btn-outline group"
                    >
                        <Plus className="w-4 h-4 border border-neutral-200 rounded-sm p-0.5 group-hover:border-muted-foreground transition-colors" />
                        <span className="text-sm font-medium flex-1">
                             {activeTab === 'projects' ? (
                                <div className="flex items-center justify-between gap-1.5">
                                    <span>New Site</span>
                                    <span className="text-muted-foreground/40 font-mono-hud text-[10px] ml-auto">⌘+N</span>
                                </div>
                            ) : activeTab === 'domains' ? (
                                <div className="flex items-center justify-between gap-1.5">
                                    <span>New Domain</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-1.5">
                                    <span>Publish New</span>
                                </div>
                            )}
                        </span>
                    </button>
                </div>

                {/* Lists Section Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                    {activeTab === 'projects' ? (
                        <div className="space-y-4">
                            {/* Folders Section Header */}
                            <div className="flex items-center justify-between px-2 pt-1 mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase">Folders</span>
                                    <div className="h-[1px] flex-1 bg-neutral-200"></div>
                                </div>
                                <button 
                                    onClick={() => setIsCreateFolderModalOpen(true)}
                                    className="btn-ghost p-1"
                                    title="New Folder"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                             {projectsLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 w-full bg-secondary/50 rounded-lg animate-pulse mb-2" />
                                ))
                            ) : (
                                <>
                                    {/* Render Folders */}
                                    {folders.map(folder => {
                                        const folderProjects = filteredProjects.filter(p => p.folder_id === folder.id);
                                        const isOpen = openFolders[folder.id];
                                        const isDropTarget = dropTargetId === folder.id;
                                        const isEditing = editingFolderId === folder.id;
                                        
                                        return (
                                            <div 
                                                key={folder.id} 
                                                className={clsx(
                                                    "space-y-0.5 rounded-lg transition-colors duration-200",
                                                    isDropTarget && "bg-secondary ring-1 ring-border"
                                                )}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setDropTargetId(folder.id);
                                                }}
                                                onDragLeave={() => setDropTargetId(null)}
                                                onDrop={async (e) => {
                                                    e.preventDefault();
                                                    const projectId = e.dataTransfer.getData("projectId");
                                                    if (projectId) {
                                                        // Optimistic Update
                                                        mutateProjects(prev => prev.map(p => p.id === projectId ? { ...p, folder_id: folder.id } : p));
                                                        // Ensure folder is open
                                                        setOpenFolders(prev => ({ ...prev, [folder.id]: true }));
                                                        
                                                        await moveProjectToFolder(projectId, folder.id);
                                                    }
                                                    setDropTargetId(null);
                                                }}
                                            >
                                                <button 
                                                    onClick={() => setOpenFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))}
                                                    onDoubleClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingFolderId(folder.id);
                                                        setEditFolderName(folder.name);
                                                    }}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-secondary text-foreground transition-all group/f"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <motion.div
                                                            animate={{ rotate: isOpen ? 90 : 0 }}
                                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        >
                                                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                        </motion.div>
                                                        <PhosphorFolder size={14} weight={isOpen ? "fill" : "regular"} className={clsx(
                                                             "transition-colors",
                                                            isDropTarget ? "text-foreground" : "text-muted-foreground"
                                                        )} />
                                                        
                                                        {isEditing ? (
                                                            <input
                                                                autoFocus
                                                                value={editFolderName}
                                                                onChange={(e) => setEditFolderName(e.target.value)}
                                                                onBlur={() => handleRenameFolder(folder.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleRenameFolder(folder.id);
                                                                    if (e.key === "Escape") setEditingFolderId(null);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="bg-background border border-border rounded px-1 py-0.5 text-xs text-foreground outline-none w-full"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium truncate">{folder.name}</span>
                                                        )}
                                                    </div>
                                                     {!isEditing && (
                                                        <span className="text-[10px] text-muted-foreground/40 group-hover/f:text-muted-foreground/60 font-mono-hud font-bold">
                                                            {folderProjects.length}
                                                        </span>
                                                    )}
                                                </button>
                                                
                                                <AnimatePresence initial={false}>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="ml-5 border-l border-neutral-200 pl-2 space-y-0.5 mt-0.5 pb-2">
                                                                {folderProjects.length === 0 ? (
                                                                    <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Empty folder</div>
                                                                ) : (
                                                                    folderProjects.map(project => (
                                                                        <ProjectLink 
                                                                            key={project.id} 
                                                                            project={project} 
                                                                            onContextMenu={(e) => {
                                                                                e.preventDefault();
                                                                                setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
                                                                            }}
                                                                            onDragStart={() => setIsDragging(true)}
                                                                            onDragEnd={() => {
                                                                                setIsDragging(false);
                                                                                setDropTargetId(null);
                                                                            }}
                                                                            isDragging={isDragging}
                                                                        />
                                                                    ))
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}

                                    {/* Unorganized Projects */}
                                     {filteredProjects.some(p => !p.folder_id) && (
                                        <div 
                                            className={clsx(
                                                "mt-4 rounded-lg transition-colors duration-200 p-0.5",
                                                dropTargetId === 'root' && "bg-secondary ring-1 ring-border"
                                            )}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDropTargetId('root');
                                            }}
                                            onDragLeave={() => setDropTargetId(null)}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                const projectId = e.dataTransfer.getData("projectId");
                                                if (projectId) {
                                                    // Optimistic Update
                                                    mutateProjects(prev => prev.map(p => p.id === projectId ? { ...p, folder_id: null } : p));
                                                    
                                                    await moveProjectToFolder(projectId, null);
                                                }
                                                setDropTargetId(null);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Projects</span>
                                                <div className="h-[1px] flex-1 bg-neutral-200"></div>
                                            </div>
                                            {filteredProjects.filter(p => !p.folder_id).map(project => (
                                                <ProjectLink 
                                                    key={project.id} 
                                                    project={project} 
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
                                                    }}
                                                    onDragStart={() => setIsDragging(true)}
                                                    onDragEnd={() => {
                                                        setIsDragging(false);
                                                        setDropTargetId(null);
                                                    }}
                                                    isDragging={isDragging}
                                                />
                                            ))}
                                        </div>
                                    )}

                                     {filteredProjects.length === 0 && folders.length === 0 && (
                                        <div className="text-center py-8 text-xs text-muted-foreground">No projects found</div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : activeTab === 'domains' ? (
                        <>
                             <div className="flex items-center gap-2 mb-4 px-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Domains</span>
                                <div className="h-[1px] flex-1 bg-border"></div>
                            </div>
                            <div className="space-y-1">
                                 {domainsLoading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-secondary/50 rounded-lg animate-pulse mb-2" />
                                    ))
                                ) : domains.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-muted-foreground">No domains found</div>
                                ) : (
                                    domains
                                        .filter(d => d.domain_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((domain) => (
                                             <Link 
                                                key={domain.id} 
                                                href={`/project/${domain.project_id}/domains?domainId=${domain.id}`}
                                                className="flex flex-col gap-0.5 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border block"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
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
                                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Categories</span>
                                <div className="h-[1px] flex-1 bg-border"></div>
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
                                            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{cat.label}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/40 font-mono-hud font-bold">
                                                {categoryCounts[cat.value] || 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-3 border-t border-neutral-200">
                    <button 
                        onClick={toggleAllFolders}
                        className="w-full btn-outline justify-center text-[10px] font-bold uppercase tracking-wider h-8"
                    >
                        {folders.length > 0 && folders.every(f => openFolders[f.id]) ? "Collapse all" : "View all"}
                    </button>
                </div>
            </div>

            <CreateFolderModal 
                isOpen={isCreateFolderModalOpen} 
                onClose={() => setIsCreateFolderModalOpen(false)} 
            />

            {/* Project Context Menu */}
            {contextMenu && (
                <ContextMenu 
                    x={contextMenu.x} 
                    y={contextMenu.y} 
                    onClose={() => setContextMenu(null)}
                >
                     <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        Move to Folder
                    </div>
                    <ContextMenuSeparator />
                    
                    {/* Unorganized option */}
                    <ContextMenuItem 
                        onClick={() => {
                            moveProjectToFolder(contextMenu.projectId, null);
                            setContextMenu(null);
                        }}
                    >
                        <Grid className="w-3.5 h-3.5" />
                        <span>None (Root)</span>
                    </ContextMenuItem>
                    
                    <ContextMenuSeparator />
                    
                         {folders.map(folder => (
                        <ContextMenuItem 
                            key={folder.id}
                            onClick={() => {
                                moveProjectToFolder(contextMenu.projectId, folder.id);
                                setContextMenu(null);
                            }}
                        >
                            <PhosphorFolder size={14} className="text-muted-foreground/60" />
                            <span>{folder.name}</span>
                        </ContextMenuItem>
                    ))}
                    
                    {folders.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground/40 italic">No folders created</div>
                    )}
                </ContextMenu>
            )}
        </aside>
    );
}

interface ProjectLinkProps {
    project: Project;
    onContextMenu?: (e: React.MouseEvent) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    isDragging?: boolean;
}

function ProjectLink({ project, onContextMenu, onDragStart, onDragEnd, isDragging }: ProjectLinkProps) {
    const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
    
    return (
        <div
            draggable="true"
            onDragStart={(e) => {
                if (onDragStart) onDragStart();
                e.dataTransfer.setData("projectId", project.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={onDragEnd}
            onContextMenu={onContextMenu}
            className={clsx(
                "group relative select-none",
                isDragging && "opacity-40"
            )}
        >
            <Link
                href={`/project/${project.id}`}
                className={clsx(
                    "flex flex-col gap-0.5 p-1.5 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border block",
                    isDragging && "border-border border-dashed"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden bg-background border border-neutral-200">
                            {projectIcon ? (
                                <img src={projectIcon} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-white/20 uppercase">
                                    {project.name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <span className="text-[13px] font-medium text-foreground/80 truncate group-hover:text-foreground transition-colors">
                            {project.name}
                        </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 group-hover:text-muted-foreground font-mono-hud font-bold uppercase tracking-wider">
                        {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd').replace(' months', 'mo')}
                    </span>
                </div>
            </Link>
        </div>
    );
}

