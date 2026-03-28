"use client"
import React, { useState, useEffect } from "react"
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Loader2, Globe, Clock, Zap, Users, Eye, Monitor, Smartphone, Tablet } from "lucide-react"
import clsx from "clsx"
import { TabHeader } from '@/components/ui/TabHeader';

const COUNTRY_FLAGS: { [key: string]: string } = {
    US: "🇺🇸", CR: "🇨🇷", MX: "🇲🇽", ES: "🇪🇸", BR: "🇧🇷", AR: "🇦🇷", CO: "🇨🇴", CL: "🇨🇱", PE: "🇵🇪", GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", NL: "🇳🇱", CA: "🇨🇦", AU: "🇦🇺", JP: "🇯🇵", CN: "🇨🇳", IN: "🇮🇳", SE: "🇸🇪",
}

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="flex flex-col gap-4 p-6 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-all group">
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{label}</span>
            <div className={clsx(
                "p-2 rounded-lg bg-opacity-10 transition-transform group-hover:scale-110",
                color === 'cyan' ? "bg-brand-500 text-brand-400" :
                color === 'purple' ? "bg-purple-500 text-purple-400" :
                color === 'green' ? "bg-green-500 text-green-400" :
                "bg-blue-500 text-blue-400"
            )}>
                <Icon size={14} />
            </div>
        </div>
        <div className="flex items-end justify-between">
            <span className="text-foreground font-bold text-lg font-mono leading-none">{value}</span>
            <span className="text-green-500/80 text-xs bg-green-500/5 px-1.5 py-0.5 rounded border border-green-500/10 font-bold">+12%</span>
        </div>
    </div>
);

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);
    
    const [period, setPeriod] = useState<"1h" | "24h" | "7d" | "30d">("24h");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!projectId || !project) return;
            setLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('get-project-analytics', {
                    body: { 
                        project_id: projectId, 
                        worker_name: (project as any).worker_name || `pwa-${(project as any).subdomain}`,
                        period
                    }
                });
            
                if (data && !error) {
                    setStats(data);
                } else {
                    setStats({ 
                        requests: 0, views: 0, visits: 0, subrequests: 0, pwa_installs: 0,
                        countries: [], devices: [], live_visitors: 0
                    });
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
                setStats({ requests: 0, views: 0, visits: 0, subrequests: 0, pwa_installs: 0, countries: [], devices: [], live_visitors: 0 });
            } finally {
                setLoading(false);
            }
        };

        if (project) fetchAnalytics();
    }, [projectId, project, period]);

    if (projectsLoading || loading) return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>SYNCING_ANALYTICS...</span>
        </div>
    );

    if (!project) return null;

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <div className="flex flex-col gap-6 text-sm animate-in fade-in duration-500">
            <TabHeader 
                title="Analytics"
                description="Insights into your project's performance and traffic."
            />

            <div className="flex flex-col gap-8">
                {/* Stats Summary - Simple List Style */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y border-neutral-200">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">REQUESTS</span>
                        <span className="text-foreground text-lg font-bold font-mono">{formatNumber(stats?.requests || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">VISITORS</span>
                        <span className="text-foreground text-lg font-bold font-mono">{formatNumber(stats?.visits || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">VIEWS</span>
                        <span className="text-foreground text-lg font-bold font-mono">{formatNumber(stats?.views || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">LIVE</span>
                        <span className="text-brand-400 text-lg font-bold font-mono">{stats?.live_visitors?.toString() || "0"}</span>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest mr-2">PERIOD:</span>
                    {['1h', '24h', '7d', '30d'].map((p: any) => (
                        <button 
                            key={p} 
                            onClick={() => setPeriod(p)}
                            className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-mono transition-all",
                                period === p 
                                    ? "bg-neutral-200 text-foreground" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-100"
                            )}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
                    {/* Top Countries */}
                     <div className="flex flex-col gap-4">
                        <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">TOP_LOCATIONS</div>
                        <div className="flex flex-col divide-y divide-neutral-200 border border-neutral-200 rounded overflow-hidden">
                            {(stats?.countries || []).slice(0, 5).map((c: any) => (
                                <div key={c.country} className="flex items-center justify-between px-4 py-2 hover:bg-background transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{COUNTRY_FLAGS[c.country] || '🌐'}</span>
                                        <span className="text-muted-foreground font-mono">{c.country}</span>
                                    </div>
                                    <span className="text-foreground font-mono font-bold">{c.count}</span>
                                </div>
                            ))}
                            {stats?.countries?.length === 0 && (
                                <div className="p-4 text-muted-foreground font-mono italic text-center">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Device Distribution */}
                     <div className="flex flex-col gap-4">
                        <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">DEVICE_TYPE</div>
                        <div className="flex flex-col divide-y divide-neutral-200 border border-neutral-200 rounded overflow-hidden">
                             {(stats?.devices || []).map((d: any) => (
                                <div key={d.device} className="flex items-center justify-between px-4 py-2 hover:bg-background transition-colors">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        {d.device === 'mobile' ? <Smartphone size={14} /> : 
                                         d.device === 'tablet' ? <Tablet size={14} /> : 
                                         <Monitor size={14} />}
                                        <span className="uppercase tracking-wider font-mono">{d.device}</span>
                                    </div>
                                    <span className="text-foreground font-mono font-bold">{((d.count / stats.requests) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                            {stats?.devices?.length === 0 && (
                                <div className="p-4 text-muted-foreground font-mono italic text-center">No data available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
