"use client"
import React, { useState, useEffect } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Loader2, Calendar, Filter, Terminal, Copy, ExternalLink, Zap } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

import { TabHeader } from '@/components/ui/TabHeader';

export default function StoreEventsPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);

    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchEvents = async () => {
            if (!projectId) return;
            setLoading(true);
            
            let query = supabase
                .from('project_events')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (filter !== 'all') {
                query = query.eq('event_type', filter);
            }

            const { data, error } = await query;
            
            if (!error && data) {
                setEvents(data);
            }
            setLoading(false);
        };

        fetchEvents();
    }, [projectId, filter]);

    if (projectsLoading) return <div className="text-muted-foreground font-mono text-sm">Loading events...</div>;
    if (!project) return null;

    const eventTypes = [
        { id: 'all', label: 'ALL_EVENTS' },
        { id: 'view', label: 'PAGE_VIEWS' },
        { id: 'install', label: 'PWA_INSTALLS' },
        { id: 'api_call', label: 'API_CALLS' },
        { id: 'error', label: 'ERRORS' },
    ];

    const getEventColor = (type: string) => {
        switch (type) {
            case 'install': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'api_call': return 'text-purple-400';
            case 'view': return 'text-brand-400';
            default: return 'text-foreground';
        }
    };

    const getEventPath = (urlStr: string) => {
        if (!urlStr) return "";
        try {
            // Check if it's already a relative path
            if (urlStr.startsWith('/')) return urlStr;
            
            // Try to parse as absolute URL
            const url = new URL(urlStr);
            return url.pathname;
        } catch (e) {
            // Fallback for invalid URLs that are not relative paths
            return urlStr;
        }
    };

    return (
        <div className="flex flex-col text-sm animate-in fade-in duration-500 h-full">
            <TabHeader 
                title="System Events"
                description="Real-time log of project and worker events"
                customActionContent={
                    <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 p-0.5 rounded-md shadow-inner">
                        {eventTypes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id)}
                                className={clsx(
                                    "px-3 py-1 text-[10px] font-bold rounded transition-all duration-200",
                                    filter === t.id 
                                        ? "bg-neutral-800 text-background shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-200"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>querying_events...</span>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-foreground/12 rounded text-muted-foreground font-mono">
                    <span>- NO_EVENTS_FOUND -</span>
                </div>
            ) : (
                <div className="flex flex-col overflow-hidden">
                    <div className="grid grid-cols-[160px_120px_1fr_120px] px-4 py-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase border-b border-neutral-200">
                        <span>Timestamp</span>
                        <span>Event</span>
                        <span>Metadata</span>
                        <span className="text-right">Origin</span>
                    </div>
                    <div className="flex flex-col divide-y divide-neutral-200 border-t border-neutral-200">
                        {events.map((event) => (
                            <div key={event.id} className="grid grid-cols-[160px_120px_1fr_120px] px-4 py-3 items-center hover:bg-foreground/[0.02] transition-all duration-300 group">
                                <span className="text-muted-foreground font-mono text-[11px]">
                                    {format(new Date(event.created_at), 'MMM dd HH:mm:ss')}
                                </span>
                                <span className={clsx("font-bold text-[11px] uppercase tracking-tighter", getEventColor(event.event_type))}>
                                    {event.event_type}
                                </span>
                                <div className="text-muted-foreground pr-4 font-mono text-[11px] truncate">
                                    {event.page_url ? `path: ${getEventPath(event.page_url)}` : event.metadata?.action || 'system_event'}
                                </div>
                                <span className="text-muted-foreground/40 text-right text-[11px] font-mono">
                                    {event.country_code || '??'}  {event.device_type === 'mobile' ? '📱' : '💻'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
