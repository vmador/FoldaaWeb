"use client"
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Plus, Check, Clock, Play, Code, ArrowRight } from '@phosphor-icons/react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface ServiceRequest {
    id: string;
    title: string;
    description: string;
    status: 'queued' | 'active' | 'completed';
    priority: 'quick' | 'normal' | 'large';
    created_at: string;
    output_link: string | null;
}

interface ServiceEngagement {
    id: string;
    status: string;
    max_active_requests: number;
    billing_type: string;
    creator_id: string;
    buyer_id: string;
}

export default function WorkspaceRequestsPage() {
    const params = useParams();
    const workspaceId = params.id as string;
    const { profile } = useUserProfile();
    
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [engagement, setEngagement] = useState<ServiceEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<'quick' | 'normal' | 'large'>('normal');

    useEffect(() => {
        if (workspaceId) {
            fetchData();
        }
    }, [workspaceId]);

    const fetchData = async () => {
        try {
            // Fetch Engagement details for this workspace
            const { data: engData, error: engErr } = await supabase
                .from('service_engagements')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single();
                
            if (!engErr && engData) {
                setEngagement(engData);
            }

            // Fetch Requests
            const { data: reqData, error: reqErr } = await supabase
                .from('service_requests')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });
                
            if (!reqErr && reqData) {
                setRequests(reqData);
            }
        } catch (error) {
            console.error("Error fetching workspace data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!newTitle.trim()) return;
        
        const { data, error } = await supabase
            .from('service_requests')
            .insert({
                workspace_id: workspaceId,
                title: newTitle,
                description: newDesc,
                priority: newPriority,
                status: 'queued',
                created_by: profile?.id
            })
            .select()
            .single();

        if (!error && data) {
            setRequests([data, ...requests]);
            setIsAdding(false);
            setNewTitle('');
            setNewDesc('');
        }
    };

    const updateRequestStatus = async (id: string, status: 'queued' | 'active' | 'completed') => {
        // Enforce max active requests if activating
        if (status === 'active' && engagement) {
            const activeCount = requests.filter(r => r.status === 'active').length;
            if (activeCount >= (engagement.max_active_requests || 1)) {
                alert(`You can only have ${engagement.max_active_requests} active request(s) at a time.`);
                return;
            }
        }

        const { error } = await supabase
            .from('service_requests')
            .update({ status })
            .eq('id', id);

        if (!error) {
            setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        }
    };

    if (loading) {
         return <div className="p-10 text-muted-foreground text-sm uppercase tracking-widest animate-pulse">Loading Workspace...</div>;
    }

    const activeRequests = requests.filter(r => r.status === 'active');
    const queuedRequests = requests.filter(r => r.status === 'queued');
    const completedRequests = requests.filter(r => r.status === 'completed');
    const maxActive = engagement?.max_active_requests || 1;
    const isOwner = engagement?.creator_id === profile?.id;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
            <div className="max-w-[900px] mx-auto p-10 flex flex-col gap-16 pb-32">
                
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                            <Code size={20} className="text-foreground/60" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Service Workspace</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                {activeRequests.length} / {maxActive} Active Requests
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Work */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active Work
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {activeRequests.length === 0 ? (
                            <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-white/[0.02] text-center text-muted-foreground text-sm">
                                No active requests. Pull a request from the queue to begin work.
                            </div>
                        ) : (
                            activeRequests.map(req => (
                                <div key={req.id} className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] flex flex-col gap-4 group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-bold text-foreground">{req.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">{req.description}</p>
                                        </div>
                                        {isOwner && (
                                            <button 
                                                onClick={() => updateRequestStatus(req.id, 'completed')}
                                                className="btn-outline text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Mark Completed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* The Queue */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <Clock size={16} />
                            The Queue
                        </h2>
                        {!isAdding && (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
                            >
                                <Plus size={14} /> New Request
                            </button>
                        )}
                    </div>

                    {isAdding && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-6 rounded-2xl border border-foreground/10 bg-card flex flex-col gap-4"
                        >
                            <input 
                                autoFocus
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Request title..."
                                className="bg-transparent border-none outline-none text-base font-bold text-foreground placeholder:text-muted-foreground/50 w-full"
                            />
                            <textarea 
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="Details, requirements, or links..."
                                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 w-full resize-none min-h-[80px]"
                            />
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/5">
                                <button onClick={() => setIsAdding(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground">Cancel</button>
                                <button onClick={handleCreateRequest} className="btn-primary text-xs px-4 py-2">Submit Request</button>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        {queuedRequests.length === 0 && !isAdding && (
                            <div className="p-8 text-center text-muted-foreground text-sm opacity-50">
                                The queue is empty.
                            </div>
                        )}
                        {queuedRequests.map(req => (
                            <div key={req.id} className="p-5 rounded-xl border border-foreground/5 hover:border-foreground/10 hover:bg-foreground/[0.02] transition-colors flex items-center justify-between group">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-foreground">{req.title}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-md">{req.description}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 py-1 bg-foreground/5 rounded">
                                        {req.priority}
                                    </span>
                                    {isOwner && (
                                        <button 
                                            onClick={() => updateRequestStatus(req.id, 'active')}
                                            className="text-xs font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                        >
                                            <Play size={12} weight="fill" />
                                            Start
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Completed */}
                {completedRequests.length > 0 && (
                    <div className="flex flex-col gap-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <Check size={16} />
                            Completed
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {completedRequests.map(req => (
                                <div key={req.id} className="py-3 px-4 rounded-lg bg-foreground/[0.02] flex items-center justify-between">
                                    <span className="text-sm text-foreground font-medium strike-through line-through">{req.title}</span>
                                    {req.output_link && (
                                        <a href={req.output_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                            View Output <ArrowRight size={12} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
}
