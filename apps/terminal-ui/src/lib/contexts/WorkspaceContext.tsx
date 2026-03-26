"use client"
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    logo_url?: string;
    created_at: string;
}

interface WorkspaceContextType {
    activeWorkspace: Workspace | null;
    workspaces: Workspace[];
    setActiveWorkspaceId: (id: string) => void;
    loading: boolean;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWorkspaces = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error("[ANTIGRAVITY V2] Error fetching workspaces detail:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: JSON.stringify(error)
                });
            } else {
                const workspaceList = data || [];
                setWorkspaces(workspaceList);
                
                // Determine active workspace
                const savedId = localStorage.getItem("active_workspace_id");
                const active = workspaceList.find(w => w.id === savedId) || workspaceList[0] || null;
                setActiveWorkspace(active);
                if (active) localStorage.setItem("active_workspace_id", active.id);
            }
        } catch (err: any) {
            console.error("Error fetching workspaces detail (catch block):", {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code,
                error: err
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
        
        // Subscribe to auth changes to refetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') fetchWorkspaces();
        });

        return () => subscription.unsubscribe();
    }, []);

    const setActiveWorkspaceId = (id: string) => {
        const workspace = workspaces.find(w => w.id === id);
        if (workspace) {
            setActiveWorkspace(workspace);
            localStorage.setItem("active_workspace_id", id);
        }
    };

    return (
        <WorkspaceContext.Provider value={{ 
            activeWorkspace, 
            workspaces, 
            setActiveWorkspaceId, 
            loading,
            refreshWorkspaces: fetchWorkspaces
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspaces() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspaces must be used within a WorkspaceProvider");
    }
    return context;
}
