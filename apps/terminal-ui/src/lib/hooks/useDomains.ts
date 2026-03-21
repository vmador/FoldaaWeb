"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Domain = {
    id: string;
    domain_name: string;
    status: 'pending' | 'verified' | 'failed';
    verification_method: string;
    ssl_status: string;
    created_at: string;
    updated_at: string;
    project_id: string | null;
    user_id: string;
}

export function useDomains() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchDomains = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('domains')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching domains:", error);
                if (isMounted) setError(error);
            } else if (isMounted) {
                setDomains(data || []);
            }
            if (isMounted) setLoading(false);
        };

        fetchDomains();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('domains_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'domains'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setDomains(prev => [payload.new as Domain, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setDomains(prev => prev.map(d => d.id === payload.new.id ? payload.new as Domain : d));
                } else if (payload.eventType === 'DELETE') {
                    setDomains(prev => prev.filter(d => d.id === payload.old.id));
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    return { domains, loading, error };
}
