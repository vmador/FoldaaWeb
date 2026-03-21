"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Project = {
    id: string;
    name: string;
    subdomain: string;
    worker_name?: string;
    worker_url?: string;
    original_url: string;
    app_description?: string;
    status: 'draft' | 'deploying' | 'success' | 'error';
    created_at: string;
    updated_at: string;
    user_id: string;
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
}

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProjects = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error fetching projects:", error);
                if (isMounted) setError(error);
            } else if (isMounted) {
                setProjects(data || []);
            }
            if (isMounted) setLoading(false);
        };

        fetchProjects();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('projects_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'projects'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setProjects(prev => [payload.new as Project, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new as Project : p));
                } else if (payload.eventType === 'DELETE') {
                    setProjects(prev => prev.filter(p => p.id === payload.old.id));
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    return { projects, loading, error };
}
