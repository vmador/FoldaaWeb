"use client"
import React, { useState, useEffect } from "react";
import { Send, Smartphone, Image as ImageIcon, Bell, AlertCircle, RefreshCw, Clock, Calendar, Globe, Trash2, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { useProjects } from "@/lib/hooks/useProjects";

export default function NotificationsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const { showToast } = useToast();
    const { projects } = useProjects();
    const activeProject = projects.find(p => p.id === projectId);

    const [hasOneSignal, setHasOneSignal] = useState<boolean | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    
    // Scheduling state
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledFor, setScheduledFor] = useState("");
    const [localTimeDelivery, setLocalTimeDelivery] = useState(true);
    
    const [isSending, setIsSending] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);

    const fetchHistory = React.useCallback(async () => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('broadcast_history')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("History fetch error:", error);
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    setDbError("Setup required: Broadcast history table not found.");
                    setBroadcasts([]);
                } else {
                    setDbError(error.message);
                }
            } else if (data) {
                setDbError(null);
                setBroadcasts(data);
            }
        } catch (e) {
            console.error("Fetch history catch:", e);
        } finally {
            setLoadingHistory(false);
        }
    }, [projectId]);

    useEffect(() => {
        const verifyIntegration = async () => {
            try {
                const { data: config } = await supabase.from('project_integrations').select('config, integration_types!inner(name)').eq('project_id', projectId).eq('integration_types.name', 'onesignal').eq('is_enabled', true).maybeSingle();
                if (config) {
                    setHasOneSignal(true);
                } else {
                    setHasOneSignal(false);
                }
            } catch (err) {
                console.error("Error checking onesignal integration:", err);
                setHasOneSignal(false);
            } finally {
                setLoadingConfig(false);
            }
        };

        verifyIntegration();
        fetchHistory();
        
        // Subscription for history updates
        const channel = supabase
            .channel('broadcast_history_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_history', filter: `project_id=eq.${projectId}` }, () => {
                fetchHistory();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel) };
    }, [projectId, fetchHistory]);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            showToast("Title and message are required", "error");
            return;
        }

        setIsSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            // Format date for OneSignal if scheduling
            let sendAfter = undefined;
            if (showScheduler && scheduledFor) {
                const date = new Date(scheduledFor);
                sendAfter = date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' GMT+0000');
            }

            const { data, error } = await supabase.functions.invoke('send-push-notification', {
                body: {
                    project_id: projectId,
                    title: title.trim(),
                    message: message.trim(),
                    launch_url: launchUrl.trim() || undefined,
                    send_after: sendAfter,
                    local_time_delivery: localTimeDelivery
                },
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (error) {
                let errorMessage = error.message || "Failed to send notification";
                try {
                   const response = (error as any).context;
                   if (response && typeof response.json === 'function') {
                      const body = await response.clone().json();
                      if (body.error) errorMessage = `${body.error}${body.details ? ': ' + body.details : ''}`;
                   }
                } catch (e) {}
                throw new Error(errorMessage);
            }

            if (data?.success) {
                showToast(sendAfter ? "Notification scheduled successfully." : "Broadcast sent!", "success");
            } else {
                showToast("Request accepted but delivery unknown.", "success");
            }

            setTitle("");
            setMessage("");
            setLaunchUrl("");
            setShowScheduler(false);
            setScheduledFor("");
            
            // Re-fetch history immediately
            fetchHistory();
        } catch (err: any) {
            console.error("Broadcast failed:", err);
            showToast(err.message || "Failed to broadcast notification", "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this broadcast log?")) return;
        
        try {
            const { error } = await supabase
                .from('broadcast_history')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            showToast("Log deleted", "success");
            setBroadcasts(prev => prev.filter(b => b.id !== id));
        } catch (err: any) {
            console.error("Delete failed:", err);
            showToast(err.message || "Failed to delete log", "error");
        }
    };

    if (loadingConfig) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background p-6">
                <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
        );
    }

    if (hasOneSignal === false) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h2 className="text-foreground tracking-widest font-mono font-bold text-sm uppercase">Integration Required</h2>
                <p className="text-muted-foreground text-xs mt-2 max-w-sm">
                    You must install and configure the OneSignal integration in the Integrations tab before sending push notifications.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Column: Composer */}
                <div className="flex-1 border-r border-border p-6 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                        <h1 className="text-xs font-bold text-foreground font-mono tracking-widest uppercase flex items-center gap-2">
                            <Send className="w-4 h-4 text-brand-500" />
                            Notifications Pro
                        </h1>
                        <p className="text-muted-foreground text-[10px] mt-1 uppercase tracking-tight">Compose and schedule high-impact push broadcasts</p>
                    </div>
                    
                    <div className="space-y-6 max-w-xl">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notification Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="🔥 FLASH SALE ALERT!"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500/50 transition-colors uppercase font-mono placeholder:text-muted-foreground/30"
                                maxLength={50}
                            />
                            <div className="text-[10px] text-muted-foreground/50 text-right font-mono">{title.length}/50</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Body</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Don't miss out! 25% off all premium plans. Offer ends midnight."
                                className="w-full h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500/50 transition-colors resize-none custom-scrollbar font-mono placeholder:text-muted-foreground/30"
                                maxLength={150}
                            />
                            <div className="text-[10px] text-muted-foreground/50 text-right font-mono">{message.length}/150</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" />
                                    Launch URL
                                </label>
                                <input
                                    type="text"
                                    value={launchUrl}
                                    onChange={(e) => setLaunchUrl(e.target.value)}
                                    placeholder="https://app.com/promo"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500/50 transition-colors font-mono placeholder:text-muted-foreground/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Scheduling
                                </label>
                                <div 
                                    onClick={() => setShowScheduler(!showScheduler)}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                        showScheduler ? "border-brand-500/50 bg-brand-500/5" : "border-border bg-background"
                                    )}
                                >
                                    <span className="text-xs font-mono lowercase tracking-widest">{showScheduler ? "scheduled" : "send instantly"}</span>
                                    <div className={clsx("w-3 h-3 rounded-full border-2", showScheduler ? "bg-brand-500 border-brand-500" : "border-muted-foreground/30")} />
                                </div>
                            </div>
                        </div>

                        {showScheduler && (
                            <div className="p-4 bg-secondary/30 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Target Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-brand-500/50 transition-colors font-mono"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setLocalTimeDelivery(!localTimeDelivery)}>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-foreground font-mono uppercase tracking-widest">Local Time Delivery</p>
                                        <p className="text-muted-foreground text-[9px] uppercase">Deliver based on each user's timezone</p>
                                    </div>
                                    <div className={clsx(
                                        "w-10 h-5 rounded-full p-1 transition-colors",
                                        localTimeDelivery ? "bg-brand-500" : "bg-muted-foreground/20"
                                    )}>
                                        <div className={clsx(
                                            "w-3 h-3 bg-white rounded-full transition-transform",
                                            localTimeDelivery ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className={clsx(
                                "w-full py-2.5 rounded-lg font-bold font-mono tracking-[0.2em] transition-all flex items-center justify-center gap-2 overflow-hidden group relative",
                                isSending || (!title.trim() || !message.trim()) 
                                    ? "bg-secondary text-muted-foreground cursor-not-allowed" 
                                    : "bg-foreground text-background hover:bg-zinc-800"
                            )}
                        >
                            <span className="relative z-10 flex items-center gap-2 text-[10px]">
                                {isSending ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : showScheduler ? (
                                    <Clock className="w-3.5 h-3.5" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                {isSending ? 'PROCESSING...' : showScheduler ? 'SCHEDULE BROADCAST' : 'SEND BROADCAST NOW'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="hidden lg:flex flex-1 max-w-[500px] bg-secondary/5 p-8 flex-col items-center justify-start border-l border-border relative overflow-y-auto custom-scrollbar">
                    <div className="absolute top-8 left-8 text-[10px] font-bold text-muted-foreground tracking-widest uppercase font-mono italic">Real-time Preview</div>
                    
                    <div className="mt-8 relative" style={{ width: '428px', height: '956px', maxWidth: '100%', aspectRatio: '428/956' }}>
                        {/* Minimal Device Frame */}
                        <div className="absolute inset-0 rounded-[48px] border border-white/10 bg-black overflow-hidden flex flex-col items-center shadow-2xl">
                            {/* Lotus Background */}
                            <div className="absolute inset-0 z-0">
                                <img 
                                    src="file:///Users/workspace/.gemini/antigravity/brain/10682f6c-1d81-45df-aee8-01ef871842cb/media__1774640259758.jpg"
                                    className="w-full h-full object-cover opacity-80"
                                    alt="background"
                                    onError={(e) => {
                                        // Fallback placeholder if local file is unavailable
                                        (e.target as any).src = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop";
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/10" /> 
                            </div>

                            {/* iOS Lock Screen Content */}
                            <div className="relative z-10 w-full h-full pt-24 px-5 flex flex-col items-center">
                                <span className="text-white/95 text-lg font-medium mb-1 drop-shadow-md">Fri 27 Mar</span>
                                <div className="text-center font-light text-7xl text-white mb-16 font-sans tracking-tight drop-shadow-lg">1:48</div>

                                {/* Premium iOS-style Notification Banner */}
                                <div className="w-full backdrop-blur-3xl bg-black/40 border border-white/20 rounded-[28px] p-4 shadow-2xl flex items-start gap-4 transform transition-all animate-in fade-in slide-in-from-top-4 duration-700">
                                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-inner border border-white/10 overflow-hidden">
                                        {activeProject?.logo_url ? (
                                            <img src={activeProject.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold">F</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[12px] font-semibold text-white/90 uppercase tracking-tight truncate">
                                                {activeProject?.name || 'Foldaa'}
                                            </span>
                                            <span className="text-[11px] text-white/50 font-medium">now</span>
                                        </div>
                                        <h4 className="text-[15px] font-bold text-white leading-tight truncate">
                                            {title || "Notification Title"}
                                        </h4>
                                        <p className="text-[14px] text-white/80 leading-snug mt-0.5 line-clamp-2 font-normal antialiased">
                                            {message || "The notification message will appear here precisely like this."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 w-36 h-1 bg-white/30 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: History */}
            <div className="border-t border-border bg-background p-6 h-80 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[10px] font-bold text-foreground font-mono tracking-widest uppercase">Broadcast History</h2>
                        <p className="text-muted-foreground text-[10px] mt-1 uppercase tracking-tight">Track performance and delivery status in real-time</p>
                    </div>
                    <button 
                        onClick={fetchHistory}
                        disabled={loadingHistory}
                        className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-colors group"
                        title="Refresh history"
                    >
                        <RefreshCw className={clsx("w-3.5 h-3.5", loadingHistory && "animate-spin")} />
                    </button>
                </div>

                {loadingHistory && broadcasts.length === 0 ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : dbError ? (
                    <div className="text-center p-8 border border-dashed border-border rounded-xl bg-orange-500/5">
                        <div className="flex flex-col items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500/50" />
                            <p className="text-[10px] text-orange-500/80 font-mono font-bold uppercase tracking-widest">Setup Required</p>
                            <p className="text-[10px] text-muted-foreground max-w-sm mx-auto uppercase">
                                {dbError.includes("42P01") || dbError.includes("not exist")
                                    ? "Broadcast history table not found. Please run the SQL migration provided to enable tracking." 
                                    : dbError}
                            </p>
                        </div>
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-xl group hover:border-brand-500/20 transition-colors">
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">No broadcasts found for this project</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {broadcasts.map((b) => (
                            <div key={b.id} className="group p-4 bg-secondary/20 border border-border rounded-xl flex items-center justify-between hover:border-brand-500/30 transition-colors">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        b.status === 'sent' ? "bg-green-500/10 text-green-500" :
                                        b.status === 'scheduled' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                                    )}>
                                        {b.status === 'sent' ? <CheckCircle2 className="w-5 h-5" /> :
                                         b.status === 'scheduled' ? <Clock className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate uppercase font-mono">{b.title}</p>
                                        <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{b.message}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 ml-4 shrink-0 px-4 border-l border-border/50">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                                        <p className={clsx(
                                            "text-[10px] font-bold font-mono mt-1 uppercase",
                                            b.status === 'sent' ? "text-green-500" :
                                            b.status === 'scheduled' ? "text-blue-500" : "text-red-500"
                                        )}>{b.status}</p>
                                    </div>
                                    <div className="text-right w-20">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipients</p>
                                        <p className="text-xs font-bold font-mono mt-1 text-foreground">{b.recipients_count}</p>
                                    </div>
                                    <div className="text-right w-32 hidden md:block">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{b.status === 'scheduled' ? 'Scheduled' : 'Sent At'}</p>
                                        <p className="text-[10px] font-mono mt-1 text-foreground">
                                            {new Date(b.scheduled_for || b.sent_at || b.created_at).toLocaleDateString()} {new Date(b.scheduled_for || b.sent_at || b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center ml-2">
                                        <button 
                                            onClick={() => handleDelete(b.id)}
                                            className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors group/del"
                                            title="Delete log"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
