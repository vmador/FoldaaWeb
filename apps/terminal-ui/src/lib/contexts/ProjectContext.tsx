"use client"
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspaces } from "./WorkspaceContext";

export type Project = {
    id: string;
    name: string;
    logo_url?: string;
    subdomain: string;
    worker_name?: string;
    worker_url?: string;
    original_url: string;
    app_description?: string;
    status: 'draft' | 'deploying' | 'success' | 'error';
    created_at: string;
    updated_at: string;
    user_id: string;
    workspace_id?: string;
    folder_id?: string | null;
    framework?: string;
    github_repo?: string;
    theme_color?: string;
    background_color?: string;
    allow_fullscreen: boolean;
    allow_geolocation: boolean;
    allow_camera: boolean;
    allow_microphone: boolean;
    allow_storage_access: boolean;
    viewport_mode: 'dvh' | 'svh' | 'lvh';
    ignore_safe_area: boolean;
    orientation: string;
    show_install_banner: boolean;
    banner_config?: any;
    icon_192_url?: string;
    icon_512_url?: string;
    apple_touch_icon_url?: string;
    favicon_url?: string;
    og_image_url?: string;
    og_title?: string;
    og_description?: string;
    mac_config?: {
        width: number;
        height: number;
        resizable: boolean;
        fullscreen: boolean;
        titleBarStyle: 'Overlay' | 'Visible';
    };
    marketplace_listings?: { status: 'draft' | 'published' | 'unlisted' }[];
    [key: string]: any;
}

export type Folder = {
    id: string;
    name: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    order_index: number;
}

interface ProjectContextType {
    projects: Project[];
    folders: Folder[];
    loading: boolean;
    error: any;
    mutateProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    mutateFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    createFolder: (name: string) => Promise<Folder>;
    updateFolder: (id: string, updates: Partial<Folder>) => Promise<Folder>;
    deleteFolder: (id: string) => Promise<void>;
    moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const { activeWorkspace } = useWorkspaces();
    const workspaceId = activeWorkspace?.id;

    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!workspaceId) return;

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            const [projectsRes, foldersRes] = await Promise.all([
                supabase.from('projects').select('*, marketplace_listings(status)').eq('workspace_id', workspaceId).order('updated_at', { ascending: false }),
                supabase.from('folders').select('*').eq('workspace_id', workspaceId).order('order_index', { ascending: true })
            ]);

            if (isMounted) {
                if (projectsRes.error) setError(projectsRes.error);
                if (foldersRes.error) setError(foldersRes.error);
                setProjects(projectsRes.data || []);
                setFolders(foldersRes.data || []);
                setLoading(false);
            }
        };

        fetchData();

        // Subscriptions
        const projectsSub = supabase
            .channel(`projects_ctx_${workspaceId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'projects',
                filter: `workspace_id=eq.${workspaceId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setProjects(prev => [payload.new as Project, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setProjects(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } as Project : p));
                } else if (payload.eventType === 'DELETE') {
                    setProjects(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .subscribe();

        const foldersSub = supabase
            .channel(`folders_ctx_${workspaceId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'folders',
                filter: `workspace_id=eq.${workspaceId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setFolders(prev => [...prev, payload.new as Folder]);
                } else if (payload.eventType === 'UPDATE') {
                    setFolders(prev => prev.map(f => f.id === payload.new.id ? { ...f, ...payload.new } as Folder : f));
                } else if (payload.eventType === 'DELETE') {
                    setFolders(prev => prev.filter(f => f.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(projectsSub);
            supabase.removeChannel(foldersSub);
        };
    }, [workspaceId]);

    const createFolder = async (name: string) => {
        if (!workspaceId) throw new Error("No active workspace");
        const { data, error } = await supabase
            .from('folders')
            .insert([{ name, workspace_id: workspaceId }])
            .select()
            .single();

        if (error) throw error;
        // The subscription will ideally handle the state update, but we can optimistically update here if needed
        return data as Folder;
    };

    const updateFolder = async (id: string, updates: Partial<Folder>) => {
        const { data, error } = await supabase
            .from('folders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Folder;
    };

    const deleteFolder = async (id: string) => {
        const { error } = await supabase.from('folders').delete().eq('id', id);
        if (error) throw error;
    };

    const moveProjectToFolder = async (projectId: string, folderId: string | null) => {
        const { error } = await supabase.from('projects').update({ folder_id: folderId }).eq('id', projectId);
        if (error) throw error;
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            folders,
            loading,
            error,
            mutateProjects: setProjects,
            mutateFolders: setFolders,
            createFolder,
            updateFolder,
            deleteFolder,
            moveProjectToFolder
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectData() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error("useProjectData must be used within a ProjectProvider");
    }
    return context;
}
