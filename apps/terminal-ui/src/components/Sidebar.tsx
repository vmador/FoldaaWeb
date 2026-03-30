"use client"
import React, { useState, useEffect } from "react";
import { useProjects, Project, useFolders } from "@/lib/hooks/useProjects";
import { useDomains, Domain } from "@/lib/hooks/useDomains";
import { 
    Search, Globe, Plus, CheckCircle2, AlertCircle, Clock, 
    Grid, Zap, Briefcase, BookOpen, Gamepad2, Users, Wrench, Heart, Newspaper, Palette, ShoppingBag, Package,
    ChevronRight, ChevronDown, FolderIcon, MoreHorizontal, Move,
    Trash2
} from "lucide-react";
import { 
    Folder as PhosphorFolder,
    Globe as PhosphorGlobe, FramerLogo, Triangle, Lightning, Cloud,
    GithubLogo, SketchLogo, SlackLogo,
    Smiley, Tent as PhosphorTent,
    Code, Palette as PhosphorPalette, Brain, BracketsCurly
} from "@phosphor-icons/react";
import { 
    WEBFLOW_ICON_URL, FRAMER_ICON_URL, VERCEL_ICON_URL 
} from "./ui/BrandIcons";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import { usePathname, useRouter, useParams, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useUI } from "@/lib/contexts/UIContext";
import { supabase } from "@/lib/supabase";
import CreateFolderModal from "./terminal/CreateFolderModal";
import DeleteFolderModal from "./terminal/DeleteFolderModal";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuSubmenu } from "./ui/ContextMenu";
import { motion, AnimatePresence } from "framer-motion";
import { Folder } from "@/lib/contexts/ProjectContext";
import CreateFileModal from "./campfire/CreateFileModal";
import CreateTentFolderModal from "./campfire/CreateTentFolderModal";

const TentFileItem = React.memo(({ 
    item, 
    isChild = false,
    searchParams,
    openTentFolders,
    tentDropTargetId,
    draggingTentId,
    editingFolderId,
    editFolderName,
    setEditFolderName,
    setDraggingTentId,
    setTentDropTargetId,
    handleMoveTentItem,
    setOpenTentFolders,
    handleRenameTentItem,
    setEditingFolderId,
    setTentItemMenu,
    params,
    router
}: any) => {
    const currentFile = searchParams?.get('file');
    const isActive = currentFile === item.id;
    const isFolder = !!item.children;
    const isOpen = openTentFolders[item.id];
    const isDropTarget = tentDropTargetId === item.id;
    const isDragging = draggingTentId === item.id;
    const isEditing = editingFolderId === item.id;

    return (
        <div 
            draggable="true"
            onDragStart={(e) => {
                setDraggingTentId(item.id);
                e.dataTransfer.setData("tentItemId", item.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
                setDraggingTentId(null);
                setTentDropTargetId(null);
            }}
            onDragOver={(e) => {
                if (isFolder) {
                    e.preventDefault();
                    setTentDropTargetId(item.id);
                }
            }}
            onDragLeave={() => {
                if (isFolder) setTentDropTargetId(null);
            }}
            onDrop={(e) => {
                if (isFolder) {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("tentItemId");
                    if (draggedId && draggedId !== item.id) {
                        handleMoveTentItem(draggedId, item.id);
                    }
                    setTentDropTargetId(null);
                }
            }}
            className={clsx(
                "space-y-0.5 rounded-lg transition-colors duration-200",
                isDropTarget && "bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
                isDragging && "opacity-40"
            )}
        >
            <button
                onClick={() => {
                    if (isFolder) {
                        setOpenTentFolders((prev: any) => ({ ...prev, [item.id]: !prev[item.id] }));
                    } else {
                        if (isActive) {
                            router.push(`/campfire/tent/${params?.id}`);
                        } else {
                            router.push(`/campfire/tent/${params?.id}?file=${item.id}`);
                        }
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setTentItemMenu({ x: e.clientX, y: e.clientY, itemId: item.id, isFolder });
                }}
                className={clsx(
                    "w-full flex items-center justify-between py-1.5 rounded-lg hover:bg-secondary cursor-pointer transition-all border group relative",
                    isActive ? "bg-secondary border-border" : "border-transparent hover:border-border",
                    isChild ? "px-3" : "px-1.5"
                )}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isFolder ? (
                        <>
                            <motion.div
                                animate={{ rotate: isOpen ? 90 : 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </motion.div>
                            {(() => {
                                const iconMap: Record<string, any> = {
                                    code: <Code size={14} weight={isOpen ? "fill" : "regular"} className="text-emerald-500" />,
                                    design: <PhosphorPalette size={14} weight={isOpen ? "fill" : "regular"} className="text-emerald-500" />,
                                    ai: <Brain size={14} weight={isOpen ? "fill" : "regular"} className="text-emerald-500" />,
                                    logic: <BracketsCurly size={14} weight={isOpen ? "fill" : "regular"} className="text-emerald-500" />,
                                    ignited: <Lightning size={14} weight={isOpen ? "fill" : "regular"} className="text-emerald-500" />,
                                    folder: <PhosphorFolder size={14} weight={isOpen ? "fill" : "regular"} className="text-muted-foreground" />
                                };
                                return iconMap[item.icon] || iconMap.folder;
                            })()}
                        </>
                    ) : (
                        !isChild && (
                            <div className={clsx(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[#333]"
                            )} />
                        )
                    )}
                    
                    {isEditing ? (
                        <input
                            autoFocus
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onBlur={() => { handleRenameTentItem(item.id, editFolderName); setEditingFolderId(null); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { handleRenameTentItem(item.id, editFolderName); setEditingFolderId(null); }
                                if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background border border-border rounded px-1 py-0.5 text-xs text-foreground outline-none w-full"
                        />
                    ) : (
                        <span className={clsx(
                            "text-[13px] font-medium truncate transition-colors",
                            isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                        )}>
                            {item.label}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 leading-none shrink-0 pl-2">
                    <span className="text-[9px] text-muted-foreground/30 group-hover:text-muted-foreground/60 font-mono-hud font-bold uppercase tracking-wider">
                        {item.meta}
                    </span>
                </div>
            </button>

            {isFolder && isOpen && (
                <div className="ml-4 border-l border-neutral-200 pl-1 space-y-0.5 mt-0.5 pb-2">
                    {item.children?.length === 0 ? (
                        <div className="px-3 py-1 text-[10px] text-muted-foreground italic">Empty folder</div>
                    ) : (
                        item.children?.map((child: any) => (
                            <TentFileItem 
                                key={child.id}
                                item={child}
                                isChild={true}
                                searchParams={searchParams}
                                openTentFolders={openTentFolders}
                                tentDropTargetId={tentDropTargetId}
                                draggingTentId={draggingTentId}
                                editingFolderId={editingFolderId}
                                editFolderName={editFolderName}
                                setEditFolderName={setEditFolderName}
                                setDraggingTentId={setDraggingTentId}
                                setTentDropTargetId={setTentDropTargetId}
                                handleMoveTentItem={handleMoveTentItem}
                                setOpenTentFolders={setOpenTentFolders}
                                handleRenameTentItem={handleRenameTentItem}
                                setEditingFolderId={setEditingFolderId}
                                setTentItemMenu={setTentItemMenu}
                                params={params}
                                router={router}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

TentFileItem.displayName = 'TentFileItem';

interface SidebarProps {
    activeTab: 'projects' | 'domains' | 'campfire' | 'marketplace' | 'apps' | 'tent';
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const { projects, loading: projectsLoading, mutate: mutateProjects } = useProjects();
    const { domains, loading: domainsLoading } = useDomains();
    const { folders, loading: foldersLoading, updateFolder, deleteFolder, moveProjectToFolder } = useFolders();
    const { isSidebarOpen, setCreateModalOpen, addToast } = useUI();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    
    // Rename/Edit Folder State
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState("");
    const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    // Context Menu State
    const [projContextMenu, setProjContextMenu] = useState<{ x: number, y: number, projectId: string } | null>(null);
    const [folderMenu, setFolderMenu] = useState<{ x: number, y: number, folder: Folder } | null>(null);
    
    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [publishedProjectIds, setPublishedProjectIds] = useState<Set<string>>(new Set());
    
    // Campfire Tent File State
    const [isCreateFileModalOpen, setCreateFileModalOpen] = useState(false);
    const [isCreateTentFolderModalOpen, setIsCreateTentFolderModalOpen] = useState(false);
    const [tentItemMenu, setTentItemMenu] = useState<{ x: number; y: number; itemId: string; isFolder: boolean } | null>(null);
    const [tentFiles, setTentFiles] = useState([
        { 
            id: 'design', 
            label: 'design', 
            meta: '10 DAYS AGO',
            children: [
                { id: 'design-system', label: 'design-system.md', meta: 'REGLAS DE...' },
                { id: 'ui-guidelines', label: 'UI-guidelines.md', meta: 'FIGMA / SPLINE' },
                { id: 'prototypes', label: 'prototypes.md', meta: '10 DAYS AGO' }
            ]
        },
        { id: 'roadmap', label: 'roadmap.md', meta: '10 DAYS AGO' },
        { id: 'system', label: 'system.md', meta: '10 DAYS AGO' },
        { id: 'brain', label: 'brain.md', meta: '10 DAYS AGO' },
    ]);

    const [openTentFolders, setOpenTentFolders] = useState<Record<string, boolean>>({});
    const [draggingTentId, setDraggingTentId] = useState<string | null>(null);
    const [tentDropTargetId, setTentDropTargetId] = useState<string | null>(null);

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

    const handleRenameTentItem = (itemId: string, newLabel: string) => {
        setTentFiles(prev => {
            const renameInTree = (list: any[]): any[] => {
                return list.map(i => {
                    if (i.id === itemId) return { ...i, label: newLabel };
                    if (i.children) return { ...i, children: renameInTree(i.children) };
                    return i;
                });
            };
            return renameInTree(prev);
        });
    };

    const handleAddTentFile = (name: string, parentId?: string) => {
        const newFile = {
            id: Math.random().toString(36).substr(2, 9),
            label: name,
            meta: 'JUST NOW'
        };

        setTentFiles(prev => {
            if (!parentId) return [...prev, newFile];
            
            const insertInTree = (list: any[]): any[] => {
                return list.map(i => {
                    if (i.id === parentId && i.children) {
                        return { ...i, children: [...i.children, newFile] };
                    }
                    if (i.children) return { ...i, children: insertInTree(i.children) };
                    return i;
                });
            };
            return insertInTree(prev);
        });
        
        if (parentId) {
            setOpenTentFolders(prev => ({ ...prev, [parentId]: true }));
        }
        addToast(`File ${name} created`, "success");
    };

    const handleCreateTentFolder = (name: string, icon: string) => {
        const newFolder = {
            id: Math.random().toString(36).substr(2, 9),
            label: name,
            meta: '0 FILES',
            icon,
            children: []
        };
        setTentFiles(prev => [...prev, newFolder]);
        addToast(`Folder ${name} created`, "success");
    };

    const handleDeleteTentItem = (itemId: string) => {
        setTentFiles(prev => {
            const deleteFromTree = (list: any[]): any[] => {
                return list.filter(i => i.id !== itemId).map(i => {
                    if (i.children) return { ...i, children: deleteFromTree(i.children) };
                    return i;
                });
            };
            return deleteFromTree(prev);
        });
        addToast("File deleted", "success");
    };

    const handleMoveTentItem = (itemId: string, targetFolderId: string) => {
        setTentFiles(prev => {
            let itemToMove: any = null;

            // 1. Recursive function to find and remove the item
            const removeFromTree = (list: any[]): any[] => {
                const index = list.findIndex(i => i.id === itemId);
                if (index !== -1) {
                    itemToMove = list[index];
                    return list.filter(i => i.id !== itemId);
                }
                return list.map(i => {
                    if (i.children) {
                        return { ...i, children: removeFromTree(i.children) };
                    }
                    return i;
                });
            };

            const newTreeWithoutItem = removeFromTree([...prev]);
            if (!itemToMove) return prev; // Safety check

            // 2. Recursive function to insert into the target
            if (targetFolderId === 'root') {
                return [...newTreeWithoutItem, itemToMove];
            }

            const insertIntoTree = (list: any[]): any[] => {
                return list.map(i => {
                    if (i.id === targetFolderId && i.children) {
                        return { ...i, children: [...i.children, itemToMove] };
                    }
                    if (i.children) {
                        return { ...i, children: insertIntoTree(i.children) };
                    }
                    return i;
                });
            };

            return insertIntoTree(newTreeWithoutItem);
        });
        
        // Auto-open target folder if it was a folder drop
        if (targetFolderId !== 'root') {
            setOpenTentFolders(prev => ({ ...prev, [targetFolderId]: true }));
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

    const handleDeleteFolder = async (id: string) => {
        try {
            await deleteFolder(id);
            addToast(`Folder deleted`, "success");
        } catch (err: any) {
            addToast(err.message || "Failed to delete folder", "error");
        }
    };
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        setSearchQuery('');
        
        const fetchCounts = async () => {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .select('category, project_id')
                .eq('status', 'published');
            
            if (!error && data) {
                const counts: Record<string, number> = { all: data.length };
                const publishedIds = new Set<string>();

                data.forEach(item => {
                    if (item.category) {
                        counts[item.category] = (counts[item.category] || 0) + 1;
                    }
                    if (item.project_id) {
                        publishedIds.add(item.project_id);
                    }
                });
                
                setCategoryCounts(counts);
                setPublishedProjectIds(publishedIds);
            }
        };

        fetchCounts();
    }, [activeTab]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTentFiles = React.useMemo(() => {
        if (!searchQuery.trim()) return tentFiles;

        const filterTree = (list: any[]): any[] => {
            return list.reduce((acc, item) => {
                const matches = item.label.toLowerCase().includes(searchQuery.toLowerCase());
                const filteredChildren = item.children ? filterTree(item.children) : null;

                if (matches || (filteredChildren && filteredChildren.length > 0)) {
                    // If we matched or children matched, include this node
                    if (filteredChildren && filteredChildren.length > 0) {
                        // Ensure parent is open if children matched
                        setOpenTentFolders(prev => ({ ...prev, [item.id]: true }));
                    }
                    acc.push({
                        ...item,
                        children: filteredChildren
                    });
                }
                return acc;
            }, [] as any[]);
        };

        return filterTree(tentFiles);
    }, [tentFiles, searchQuery]);

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
                                if (activeTab === 'marketplace' || activeTab === 'campfire') {
                                    window.dispatchEvent(new CustomEvent('marketplace-search', { detail: val }));
                                }
                            }}
                            placeholder={
                                activeTab === 'tent' ? "Search files..." :
                                activeTab === 'projects' || activeTab === 'apps' ? "Search" : 
                                activeTab === 'domains' ? "Search domains..." : 
                                "Search marketplace..."
                            }
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
                            } else if (activeTab === 'tent') {
                                setCreateFileModalOpen(true);
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
                            ) : activeTab === 'campfire' ? (
                                <div className="flex items-center justify-between gap-1.5">
                                    <span>Create Tent</span>
                                </div>
                            ) : activeTab === 'tent' ? (
                                <div className="flex items-center justify-between gap-1.5">
                                    <span>New File</span>
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
                                                <div 
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setOpenFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setOpenFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }));
                                                        }
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingFolderId(folder.id);
                                                        setEditFolderName(folder.name);
                                                    }}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-secondary text-foreground transition-all group/f cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <motion.div
                                                            animate={{ rotate: isOpen ? 90 : 0 }}
                                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        >
                                                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                        </motion.div>
                                                        
                                                        {folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/')) ? (
                                                            (() => {
                                                                const presets = [WEBFLOW_ICON_URL, FRAMER_ICON_URL, VERCEL_ICON_URL];
                                                                const isPreset = presets.includes(folder.icon);
                                                                return (
                                                                    <span className="w-4 h-4 flex items-center justify-center text-xs">
                                                                        <img 
                                                                            src={folder.icon} 
                                                                            alt="" 
                                                                            className={clsx(
                                                                                "w-3.5 h-3.5 object-contain",
                                                                                isPreset ? "brightness-0 invert opacity-70 group-hover:opacity-100" : "opacity-90 group-hover:opacity-100"
                                                                            )} 
                                                                        />
                                                                    </span>
                                                                );
                                                            })()
                                                        ) : (
                                                            (() => {
                                                                const iconUrlMap: Record<string, string> = {
                                                                    webflow: WEBFLOW_ICON_URL,
                                                                    framer: FRAMER_ICON_URL,
                                                                    vercel: VERCEL_ICON_URL,
                                                                };
                                                                
                                                                const iconUrl = iconUrlMap[folder.icon || ''];
                                                                if (iconUrl) {
                                                                    return (
                                                                        <span className="w-4 h-4 flex items-center justify-center text-xs">
                                                                            <img src={iconUrl} alt="" className="w-3.25 h-3.25 object-contain brightness-0 invert opacity-70 group-hover:opacity-100" />
                                                                        </span>
                                                                    );
                                                                }
                                                                
                                                                return <PhosphorFolder size={14} weight={isOpen ? "fill" : "regular"} className={clsx(
                                                                    "transition-colors",
                                                                    isDropTarget ? "text-foreground" : "text-muted-foreground"
                                                                )} />;
                                                            })()
                                                        )}
                                                        
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
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFolderMenu({ 
                                                                        x: e.clientX, 
                                                                        y: e.clientY, 
                                                                        folder 
                                                                    });
                                                                }}
                                                                className="opacity-0 group-hover/f:opacity-40 hover:!opacity-100 text-muted-foreground transition-all p-1"
                                                            >
                                                                <MoreHorizontal size={14} />
                                                            </button>
                                                            <span className="text-[10px] text-muted-foreground/40 group-hover/f:text-muted-foreground/60 font-mono-hud font-bold pr-1">
                                                                {folderProjects.length}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                
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
                                                                            isPublished={publishedProjectIds.has(project.id)}
                                                                            onContextMenu={(e) => {
                                                                                e.preventDefault();
                                                                                setProjContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
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
                                                    isPublished={publishedProjectIds.has(project.id)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setProjContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id });
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
                    ) : activeTab === 'tent' ? (
                        <>
                            <div className="flex items-center justify-between px-2 pt-1 mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase">Tent Tree</span>
                                    <div className="h-[1px] flex-1 bg-neutral-200/40"></div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button 
                                        onClick={() => setCreateFileModalOpen(true)}
                                        className="btn-ghost p-1"
                                        title="New File"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setIsCreateTentFolderModalOpen(true)}
                                        className="btn-ghost p-1"
                                        title="New Folder"
                                    >
                                        <PhosphorFolder size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div 
                                    className={clsx(
                                        "space-y-1 min-h-[50px] transition-colors",
                                        tentDropTargetId === 'root' && "bg-secondary/20 rounded-lg ring-1 ring-border border-dashed"
                                    )}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggingTentId) setTentDropTargetId('root');
                                    }}
                                    onDragLeave={() => setTentDropTargetId(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const draggedId = e.dataTransfer.getData("tentItemId");
                                        if (draggedId) {
                                            handleMoveTentItem(draggedId, 'root');
                                        }
                                        setTentDropTargetId(null);
                                    }}
                                >
                                    {filteredTentFiles.map(file => (
                                        <TentFileItem 
                                            key={file.id}
                                            item={file}
                                            searchParams={searchParams}
                                            openTentFolders={openTentFolders}
                                            tentDropTargetId={tentDropTargetId}
                                            draggingTentId={draggingTentId}
                                            editingFolderId={editingFolderId}
                                            editFolderName={editFolderName}
                                            setEditFolderName={setEditFolderName}
                                            setDraggingTentId={setDraggingTentId}
                                            setTentDropTargetId={setTentDropTargetId}
                                            handleMoveTentItem={handleMoveTentItem}
                                            setOpenTentFolders={setOpenTentFolders}
                                            handleRenameTentItem={handleRenameTentItem}
                                            setEditingFolderId={setEditingFolderId}
                                            setTentItemMenu={setTentItemMenu}
                                            params={params}
                                            router={router}
                                        />
                                    ))}
                                    {filteredTentFiles.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                            <Search size={24} className="text-muted-foreground/20 mb-2" />
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground/60">No files matched your search</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                         <>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                                    {activeTab === 'campfire' ? 'My Tents' : 'Categories'}
                                </span>
                                <div className="h-[1px] flex-1 bg-border"></div>
                            </div>
                            <div className="space-y-1">
                                {activeTab === 'campfire' ? (
                                    <div className="space-y-1">
                                        <button onClick={() => router.push('/campfire/tent/opentable-ai')} className="w-full flex flex-col gap-0.5 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border text-left">
                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                <PhosphorTent className="w-3.5 h-3.5 text-red-500" weight="fill" />
                                                <span className="truncate">OpenTable AI</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 ml-5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Burning</span>
                                            </div>
                                        </button>
                                        <button onClick={() => router.push('/campfire/tent/midnight-store')} className="w-full flex flex-col gap-0.5 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border text-left">
                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                <PhosphorTent className="w-3.5 h-3.5 text-neutral-400" weight="fill" />
                                                <span className="truncate">Midnight Store</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 ml-5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Settling</span>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    [
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
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-3 border-t border-neutral-200">
                    {activeTab === 'tent' ? (
                        <button className="w-full btn-outline justify-center text-[10px] font-bold uppercase tracking-wider h-8">
                            Export
                        </button>
                    ) : (
                        <button 
                            onClick={toggleAllFolders}
                            className="w-full btn-outline justify-center text-[10px] font-bold uppercase tracking-wider h-8"
                        >
                            {folders.length > 0 && folders.every(f => openFolders[f.id]) ? "Collapse all" : "View all"}
                        </button>
                    )}
                </div>
            </div>

            <CreateFolderModal 
                isOpen={isCreateFolderModalOpen || !!folderToEdit} 
                onClose={() => {
                    setIsCreateFolderModalOpen(false);
                    setFolderToEdit(null);
                }} 
                initialData={folderToEdit}
            />

            <DeleteFolderModal 
                isOpen={!!folderToDelete}
                onClose={() => setFolderToDelete(null)}
                folderName={folderToDelete?.name || ""}
                onConfirm={async () => {
                    if (folderToDelete) {
                        await handleDeleteFolder(folderToDelete.id);
                    }
                }}
            />

            {/* Project Context Menu */}
            {projContextMenu && (
                <ContextMenu 
                    x={projContextMenu.x} 
                    y={projContextMenu.y} 
                    onClose={() => setProjContextMenu(null)}
                >
                     <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        Move to Folder
                    </div>
                    <ContextMenuSeparator />
                    
                    {/* Unorganized option */}
                    <ContextMenuItem 
                        onClick={() => {
                            moveProjectToFolder(projContextMenu.projectId, null);
                            setProjContextMenu(null);
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
                                moveProjectToFolder(projContextMenu.projectId, folder.id);
                                setProjContextMenu(null);
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

            {/* Folder Context Menu (3-dots) */}
            {folderMenu && (
                <ContextMenu 
                    x={folderMenu.x} 
                    y={folderMenu.y} 
                    onClose={() => setFolderMenu(null)}
                >
                    <ContextMenuItem 
                        onClick={() => {
                            setFolderToEdit(folderMenu.folder);
                            setFolderMenu(null);
                        }}
                    >
                        <Wrench size={14} className="text-muted-foreground/60" />
                        <span>Edit Folder</span>
                    </ContextMenuItem>

                    <ContextMenuItem 
                        className="text-red-500 hover:!bg-red-500/10"
                        onClick={() => {
                            setFolderToDelete(folderMenu.folder);
                            setFolderMenu(null);
                        }}
                    >
                        <Trash2 size={14} className="text-red-500" />
                        <span>Delete Folder</span>
                    </ContextMenuItem>
                </ContextMenu>
            )}

            <CreateFileModal 
                isOpen={isCreateFileModalOpen}
                onClose={() => setCreateFileModalOpen(false)}
                folders={tentFiles.filter(i => !!i.children).map(f => ({ id: f.id, label: f.label }))}
                onCreate={handleAddTentFile}
            />
            <CreateTentFolderModal 
                isOpen={isCreateTentFolderModalOpen}
                onClose={() => setIsCreateTentFolderModalOpen(false)}
                onCreate={handleCreateTentFolder}
            />
            {/* Tent Item Context Menu */}
            {tentItemMenu && (
                <ContextMenu
                    x={tentItemMenu.x}
                    y={tentItemMenu.y}
                    onClose={() => setTentItemMenu(null)}
                >
                    <ContextMenuItem 
                        onClick={() => {
                            const item = tentFiles.find(i => i.id === tentItemMenu.itemId);
                            setEditingFolderId(tentItemMenu.itemId);
                            setEditFolderName(item?.label || '');
                            setTentItemMenu(null);
                        }}
                    >
                        <Move size={14} />
                        Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                        className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        onClick={() => {
                            handleDeleteTentItem(tentItemMenu.itemId);
                            setTentItemMenu(null);
                        }}
                    >
                        <Trash2 size={14} />
                        Delete
                    </ContextMenuItem>
                </ContextMenu>
            )}
        </aside>
    );
}

interface ProjectLinkProps {
    project: Project;
    isPublished?: boolean;
    onContextMenu?: (e: React.MouseEvent) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    isDragging?: boolean;
}

function ProjectLink({ project, isPublished, onContextMenu, onDragStart, onDragEnd, isDragging }: ProjectLinkProps) {
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
                    
                    {/* Time & Published Indicator */}
                    <div className="flex items-center gap-2 leading-none">
                        <span className="text-[9px] text-muted-foreground/60 group-hover:text-muted-foreground font-mono-hud font-bold uppercase tracking-wider">
                            {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: false })
                                .replace('about ', '')
                                .replace(' minutes', 'm')
                                .replace(' hours', 'h')
                                .replace(' days', 'd')
                                .replace(' months', 'mo')}
                        </span>
                        {isPublished && (
                            <div 
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 relative bg-orange-500"
                                title="Published Tool"
                                style={{ 
                                    backgroundColor: 'var(--theme-brand-500, #f97316)',
                                    boxShadow: '0 0 6px var(--theme-brand-500, #f97316)'
                                }}
                            >
                                <motion.div 
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full bg-[var(--theme-brand-500, #f97316)]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
