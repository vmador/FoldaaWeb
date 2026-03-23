"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, Check, Globe, Activity, ExternalLink, ChevronRight, Monitor, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';

import { TabHeader } from '@/components/ui/TabHeader';
import AsciiVortexAnimation from './AsciiVortexAnimation';

const AnalyticsCard = ({ title, value, percentage, points, color, isInverse }: any) => {
    return (
        <div className="bg-[#080808] border border-[#111] rounded-[10px] p-4 flex flex-col gap-1 group hover:border-[#1c1c1e] transition-all relative overflow-hidden h-[100px]">
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                    <span className="text-[#333] text-[9px] font-bold uppercase tracking-widest mb-1">{title}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[#CCC] text-2xl font-bold tracking-tight">{value}</span>
                        <div className={clsx(
                            "flex items-center text-[9px] font-bold px-1 py-0.5 rounded",
                            percentage.startsWith('+') ? (isInverse ? "bg-red-500/5 text-red-500/60" : "bg-green-500/5 text-green-500/60") : 
                                                         (isInverse ? "bg-green-500/5 text-green-500/60" : "bg-red-500/5 text-red-500/60")
                        )}>
                            {percentage}
                        </div>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#1A1A1A] flex items-center justify-center text-[#222] group-hover:text-[#444] transition-colors">
                    <Activity className="w-3.5 h-3.5" />
                </div>
            </div>
            
            <div className="absolute bottom-[-2px] left-0 right-0 h-8 opacity-40 group-hover:opacity-80 transition-all duration-500">
                <Sparkline points={points} color={color} />
            </div>
        </div>
    );
};

const Sparkline = ({ points, color }: { points: number[], color: string }) => {
    if (!points || points.length < 2) return <div className="h-full w-full bg-[#111]/20 animate-pulse" />;
    
    const max = Math.max(...points) || 1;
    const min = Math.min(...points);
    const range = max - min || 1;
    const height = 32;
    const width = 300; 
    const step = width / (points.length - 1);
    
    const d = points.map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-hidden" preserveAspectRatio="none">
            <path 
                d={d} 
                fill="none" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
    );
};

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectLoading } = useProjects();
    const { showToast, hideToast } = useToast();
    const router = useRouter(); // Reuse existing router if needed or ignore
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId) as any;
    
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [customDomain, setCustomDomain] = useState<string | null>(null);
    
    // Mac App Build State
    const [macBuild, setMacBuild] = useState<any>(null);
    const [loadingMacBuild, setLoadingMacBuild] = useState(true);
    const [hasExploded, setHasExploded] = useState(false);
    const [selectedBuildMode, setSelectedBuildMode] = useState<'fast' | 'pro'>('fast');
    const [showVortex, setShowVortex] = useState(false);
    const lastStatus = useRef<string | undefined>(undefined);
    
    // Pro Build Settings State
    const [showProSettings, setShowProSettings] = useState(false);
    const [macConfig, setMacConfig] = useState<any>(null);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Sync macConfig with project data when it loads
    useEffect(() => {
        if (project) {
            const defaultConfig = {
                window: {
                  frameless: false,
                  transparent: true,
                  width: 1200,
                  height: 800,
                  fullscreen: false
                },
                vibrancy: {
                  enabled: false,
                  type: 'under-window'
                },
                toolbar: {
                  style: 'Overlay'
                },
                branding: {
                  app_name: project.name,
                  icon_url: project.icon_512_url || project.icon_192_url || project.favicon_url
                },
                behavior: {
                  always_on_top: false,
                  resizable: true
                }
            };

            if (project.mac_config && project.mac_config.window) {
                // Merge stored config with defaults for missing branding fields
                setMacConfig({
                    ...project.mac_config,
                    branding: {
                        app_name: project.mac_config.branding?.app_name || project.name,
                        icon_url: project.mac_config.branding?.icon_url || project.icon_512_url || project.icon_192_url || project.favicon_url
                    }
                });
            } else {
                setMacConfig(defaultConfig);
            }
        }
    }, [project?.id, project?.name, project?.icon_512_url]);

    // Play success sound when build becomes ready
    useEffect(() => {
        if (macBuild?.status === 'ready' && lastStatus.current !== 'ready') {
            const audio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio play failed:", e));
        }
        lastStatus.current = macBuild?.status;

        // Manage Vortex lifecycle: show if building or pending
        if (macBuild?.status === 'building' || macBuild?.status === 'pending') {
            setShowVortex(true);
            setHasExploded(false);
        }
    }, [macBuild?.status]);

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    useEffect(() => {
        if (project) {
            setEditedName(project.name);
        }
    }, [project?.name]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!projectId) return;
            setLoadingAnalytics(true);
            try {
                if (!project) return;
                const { data, error } = await supabase.functions.invoke('get-project-analytics', {
                    body: { 
                        project_id: projectId, 
                        worker_name: project.worker_name || `pwa-${project.subdomain}`,
                        period: '24h' 
                    }
                });
                
                if (!error && data) {
                    setAnalytics(data);
                } else {
                    // Fallback to empty if error (often happens if no traffic yet)
                    setAnalytics({ requests: 0, views: 0, visits: 0, subrequests: 0 });
                }
            } catch (error) {
                console.error('Error fetching analytics overview:', error);
                setAnalytics({ requests: 0, views: 0, visits: 0, subrequests: 0 });
            } finally {
                setLoadingAnalytics(false);
            }
        };

        fetchAnalytics();
    }, [projectId, project?.subdomain, project?.worker_name]);

    useEffect(() => {
        const fetchDomain = async () => {
            if (!projectId) return;
            try {
                const { data, error } = await supabase
                    .from("domains")
                    .select("domain_name")
                    .eq("project_id", projectId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                
                if (data && !error) {
                    setCustomDomain(data.domain_name);
                }
            } catch (err) {
                // Ignore error if no domain
            }
        };
        fetchDomain();
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;
        
        const fetchBuild = async () => {
            if (!projectId) return;
            const { data } = await supabase
                .from('mac_builds')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // V31: Use maybeSingle to avoid errors on empty
            if (data) setMacBuild(data);
            setLoadingMacBuild(false);
        };
        fetchBuild();

        const subscription = supabase
            .channel(`mac_builds_${projectId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'mac_builds', 
                filter: `project_id=eq.${projectId}` 
            }, (payload) => {
                console.log("Terminal UI: Received mac_build update:", payload.eventType);
                if (payload.eventType === 'DELETE') {
                    setMacBuild(null);
                } else {
                    setMacBuild(payload.new);
                }
            })
            .subscribe();

        // Safety Polling Fallback (Runs every 10s only if building)
        const pollingInterval = setInterval(() => {
            if (macBuild?.status === 'building' || macBuild?.status === 'pending') {
                console.log("Terminal UI: Running safety polling for active build...");
                fetchBuild();
            }
        }, 12000);

        return () => {
            supabase.removeChannel(subscription);
            clearInterval(pollingInterval);
        };
    }, [projectId, macBuild?.status === 'building' || macBuild?.status === 'pending']);

    useEffect(() => {
        if (project?.banner_config?.deployment_pending) {
            showToast('Changes pending. Redeploy required to apply to live site.', 'info', {
                id: 'deploy-pending',
                persistent: true,
                action: {
                    label: 'Redeploy now',
                    onClick: () => handleRedeploy()
                }
            });
        }
    }, [project?.banner_config?.deployment_pending]);

    const handleRedeploy = async () => {
        if (!projectId || !project) return;
        setActionLoading('redeploy');
        try {
            // Derive subdomain directly from name to ensure they stay in sync
            // and bypass the problematic 'app' fallback in the cloud.
            const subdomain = (project.name || 'unregistered').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

            // Initiate redeploy with explicit naming to prevent subdomain changes
            const { error: functionError } = await supabase.functions.invoke('deploy-project', {
                body: { 
                    project_id: projectId, 
                    action: 'deploy',
                    project_data: {
                        name: project.name,
                        subdomain: subdomain
                    }
                }
            });
            if (functionError) throw functionError;

            // Clear deployment_pending if it was set
            if (project?.banner_config?.deployment_pending) {
                hideToast('deploy-pending');
                await supabase
                    .from('projects')
                    .update({ 
                        banner_config: { 
                            ...project.banner_config, 
                            deployment_pending: false 
                        } 
                    })
                    .eq('id', projectId);
            }

            showToast('Redeployment initiated successfully');
        } catch (error) {
            console.error('Redeploy error:', error);
            showToast('Failed to initiate redeployment', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBuildMacApp = async () => {
        if (!projectId) return;
        setActionLoading('build-mac');
        
        // Optimistic UI update to instantly show the Space Invaders minigame
        setMacBuild((prev: any) => ({ ...prev, status: 'building' }));

        try {
            const { error } = await supabase.functions.invoke('build-mac', {
                body: { 
                    project_id: projectId,
                    build_mode: selectedBuildMode,
                    build_config: selectedBuildMode === 'pro' ? macConfig : {}
                }
            });
            if (error) throw error;
            showToast('Mac App build started successfully', 'success');
        } catch (error) {
            console.error('Build mac error:', error);
            showToast('Failed to start Mac build', 'error');
            setMacBuild((prev: any) => ({ ...prev, status: 'error' }));
        } finally {
            setActionLoading(null);
        }
    };

    const handlePauseProject = async () => {
        if (!projectId || !project) return;
        const newStatus = project.status === 'paused' ? 'success' : 'paused';
        const actionText = newStatus === 'paused' ? 'pause' : 'resume';
        
        // Use a cleaner custom prompt or just toast feedback after
        if (!confirm(`Are you sure you want to ${actionText} this project?`)) return;
        
        setActionLoading(actionText);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ status: newStatus })
                .eq('id', projectId);
            
            if (error) throw error;
            showToast(`Project ${actionText}d successfully`);
        } catch (error) {
            console.error(`Error during ${actionText}:`, error);
            showToast(`Failed to ${actionText} project`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateBrand = async () => {
        if (!projectId || !project?.original_url) {
            showToast('Original URL is required to extract brand assets', 'error');
            return;
        }
        setActionLoading('update-brand');
        showToast('Extracting styling and branding from site...', 'info');
        
        try {
            const { data, error } = await supabase.functions.invoke('inspect-website', {
                body: { url: project.original_url }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || "Failed to extract assets");

            const updates = {
                favicon_url: data.assets?.icons?.favicon || null,
                apple_touch_icon_url: data.assets?.icons?.appleTouchIcon || null,
                icon_192_url: data.assets?.icons?.icon192 || null,
                icon_512_url: data.assets?.icons?.icon512 || null,
                og_image_url: data.assets?.images?.ogImage || null,
                theme_color_extracted: data.assets?.colors?.theme || null,
                background_color_extracted: data.assets?.colors?.background || null,
                brand_assets_updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', projectId);

            if (updateError) throw updateError;
            
            showToast('Brand assets updated successfully. You may need to Redeploy to apply them.', 'success', {
                persistent: true,
                action: {
                    label: 'Redeploy now',
                    onClick: handleRedeploy
                }
            });
        } catch (error) {
            console.error('Update brand error:', error);
            showToast('Failed to update brand assets', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateName = async () => {
        if (!projectId || !editedName.trim() || editedName === project?.name) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        try {
            const newSubdomain = editedName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const newWorkerUrl = `https://${newSubdomain}.foldaa.com`;

            const { error } = await supabase
                .from('projects')
                .update({ 
                    name: editedName.trim(),
                    subdomain: newSubdomain,
                    worker_url: newWorkerUrl
                })
                .eq('id', projectId);

            showToast('Project name and URL updated');
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating project name:', error);
            showToast('Failed to update project name', 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleSaveMacConfig = async () => {
        if (!projectId || !macConfig) return;
        setIsSavingConfig(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ mac_config: macConfig })
                .eq('id', projectId);
            if (error) throw error;
            showToast('Mac Configuration saved successfully', 'success');
            setShowProSettings(false);
        } catch (error) {
            console.error('Error saving mac config:', error);
            showToast('Failed to save configuration', 'error');
        } finally {
            setIsSavingConfig(false);
        }
    };

    if (projectLoading) {
        return (
            <div className="flex items-center gap-2 text-[#444] text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading overview...</span>
            </div>
        );
    }

    if (!project) return null;

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <div className="flex flex-col gap-8 text-sm animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
            {/* 1. Header Section */}
            <div className="flex justify-between items-center gap-4 py-2 px-1">
                <div className="flex items-center gap-4">
                    {(() => {
                        const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
                        return (
                            <div 
                                className="w-12 h-12 rounded-[10px] flex-shrink-0 flex items-center justify-center overflow-hidden bg-[#111] border border-[#222] shadow-xl transition-transform hover:scale-105"
                                style={{ backgroundColor: projectIcon ? '#000' : (project.theme_color || '#111') }}
                            >
                                {projectIcon ? (
                                    <img src={projectIcon} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-white/20 text-xl select-none">
                                        {project.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateName();
                                            if (e.key === 'Escape') {
                                                setEditedName(project.name);
                                                setIsEditingName(false);
                                            }
                                        }}
                                        className="bg-[#1C1C1E] border border-[#333] rounded px-2 py-0.5 text-white font-bold text-xl outline-none focus:border-fuchsia-500/50"
                                    />
                                </div>
                            ) : (
                                <h1 
                                    onClick={() => setIsEditingName(true)}
                                    className="text-white font-bold text-2xl tracking-tight cursor-text hover:text-fuchsia-400 transition-colors"
                                >
                                    {project.name}
                                </h1>
                            )}
                        </div>
                        <p className="text-[#555] text-xs font-medium tracking-wide">
                            {project.framework || 'PWA Experience'} Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[#333] text-[9px] font-bold tracking-[0.2em] uppercase">Visibility</span>
                        <p className="text-[10px] text-[#444] leading-tight">Publish on Store...</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1e] border border-[#2a2a2e] rounded-[10px] text-white font-bold text-xs shadow-sm group hover:border-[#3a3a3e] transition-colors">
                        <span>Published</span>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <button 
                        disabled={actionLoading === 'redeploy'}
                        onClick={handleRedeploy}
                        className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-[10px] text-fuchsia-400 font-bold text-xs hover:bg-fuchsia-500/20 transition-all disabled:opacity-50"
                    >
                        {actionLoading === 'redeploy' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        <span>Redeploy</span>
                    </button>
                </div>
            </div>

            {/* 2. PWA Settings & Test Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-1">
                    <h2 className="text-white font-bold text-base tracking-tight">PWA Settings</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1c1c1e] border border-[#2a2a2e] rounded-full text-[9px] font-bold text-[#666] tracking-widest uppercase">
                        <span>Viewport Size</span>
                        <div className="w-1 h-1 rounded-full bg-fuchsia-500 animate-pulse" />
                        <span className="text-fuchsia-400">PWA</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#222]" />
                </div>

                <div className="flex items-center justify-center gap-16 bg-black border border-[#111] rounded-[10px] p-10 relative overflow-hidden group min-h-[320px]">
                    {/* Background subtle glow centered */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-fuchsia-500/5 blur-[120px] pointer-events-none" />
                    
                    {/* Mockup */}
                    <div className="relative flex-shrink-0">
                        <div className="relative group" style={{ width: '277px', height: '234.36px' }}>
                            <img 
                                src="/images/iphone-mockup.png" 
                                alt="iPhone Mockup" 
                                className="w-full h-full object-cover pointer-events-none drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                            />
                            <div 
                                className="absolute overflow-hidden rounded-[22%] shadow-2xl transition-transform duration-500 hover:scale-105"
                                style={{
                                    top: '71.68px',
                                    left: '48.01px',
                                    width: '43.08px',
                                    aspectRatio: '1/1',
                                    backgroundColor: (project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url) ? '#000' : (project.theme_color || '#111')
                                }}
                            >
                                {(() => {
                                    const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
                                    return projectIcon ? (
                                        <img src={projectIcon} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-xs select-none">
                                            {project.name.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col items-center">
                            <span className="text-[#333] text-[9px] font-bold tracking-[0.2em] uppercase">PREVIEW</span>
                            <span className="text-[#555] text-[9px] font-mono">{project.name.toLowerCase()}.app</span>
                        </div>
                    </div>

                    {/* QR Code Testing */}
                    <div className="flex flex-col gap-5 items-center">
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <h3 className="text-white font-bold text-base tracking-tight">Scan to test</h3>
                            <p className="text-[#555] text-[11px] max-w-[160px] leading-relaxed">View your PWA directly on your device.</p>
                        </div>
                        <div className="p-3 bg-black border border-[#111] rounded-[10px] shadow-2xl group-hover:scale-105 transition-transform duration-500">
                            <QRCodeCanvas 
                                value={project.worker_url || `https://${project.subdomain}.foldaa.com`} 
                                size={114}
                                bgColor="#000000"
                                fgColor="#ffffff"
                                level="H"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Domains Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-white font-bold text-base tracking-tight">Domains</h2>
                    <ChevronRight className="w-3.5 h-3.5 text-[#222]" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#080808] border border-[#111] rounded-[10px] group hover:border-[#1c1c1e] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-[8px] bg-[#111] border border-[#222] flex items-center justify-center text-[#444]">
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[#CCC] font-bold tracking-tight text-sm">{(project.worker_url || `${project.subdomain}.foldaa.com`).replace(/^https?:\/\//, '')}</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded-md text-[8px] font-bold text-green-500 uppercase tracking-widest">
                                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                    <span>Active</span>
                                </div>
                            </div>
                            <span className="text-[#333] text-[10px] font-medium tracking-wide">Automatic deployment detecting</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[#333] text-[10px] font-mono">{formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}</span>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={actionLoading === 'redeploy'}
                                onClick={handleRedeploy}
                                className="px-3 py-1.5 rounded-[8px] border border-fuchsia-500/10 text-fuchsia-500/60 text-[11px] font-bold hover:bg-fuchsia-500/5 hover:text-fuchsia-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading === 'redeploy' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                <span>Redeploy</span>
                            </button>
                            <button className="px-3 py-1.5 rounded-[8px] border border-[#1A1A1A] text-[#666] text-[11px] font-bold hover:bg-[#111] hover:text-[#AAA] transition-colors">Edit</button>
                            <a 
                                href={project.worker_url || `https://${project.subdomain}.foldaa.com`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1.5 rounded-[8px] bg-[#111] border border-fuchsia-500/20 text-fuchsia-400 text-[11px] font-bold hover:bg-fuchsia-500/10 transition-colors flex items-center gap-2"
                            >
                                <span>Open Live</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3.5 Mac App Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-white font-bold text-base tracking-tight">Desktop App</h2>
                        <span className="text-fuchsia-400 text-[10px] font-bold uppercase tracking-[0.2em] bg-fuchsia-500/10 px-2 py-0.5 rounded-full">New</span>
                    </div>
                </div>
                
        <div className="flex flex-col gap-4">
                {/* ASCII Build Animation (Vortex) */}
                {showVortex && (
                    <AsciiVortexAnimation 
                        status={macBuild?.status} 
                        onExploded={() => {
                            setShowVortex(false);
                        }}
                    />
                )}

                {!showVortex && (
                    <div className={clsx(
                        "flex items-center justify-between p-4 bg-[#080808] border border-[#111] rounded-[10px] group hover:border-[#1c1c1e] transition-all relative overflow-hidden",
                        (macBuild?.status === 'building' || macBuild?.status === 'pending') && "border-fuchsia-500/30 bg-fuchsia-500/[0.02]"
                    )}>
                    {/* Animated Progress Bar */}
                    {(macBuild?.status === 'building' || macBuild?.status === 'pending') && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-fuchsia-500 animate-[progress_3s_infinite_ease-in-out] shadow-[0_0_10px_#d946ef]" style={{ width: '40%' }} />
                    )}

                    <div className="flex flex-col gap-6 w-full">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-[10px] bg-[#111] border border-[#222] flex items-center justify-center transition-all",
                                    (macBuild?.status === 'building' || macBuild?.status === 'pending') && "animate-pulse border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.1)]"
                                )}>
                                    <Monitor className={clsx(
                                        "w-5 h-5 transition-colors",
                                        (macBuild?.status === 'building' || macBuild?.status === 'pending') ? "text-fuchsia-400" : "text-white"
                                    )} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#CCC] font-bold tracking-tight text-sm">macOS Application</span>
                                        {(macBuild?.status === 'building' || macBuild?.status === 'pending') && (
                                            <span className="text-fuchsia-400 text-[8px] font-black uppercase tracking-widest animate-pulse">Processing...</span>
                                        )}
                                    </div>
                                    <span className="text-[#555] text-[11px] font-medium tracking-wide">Build a native installer (DMG) for your project.</span>
                                </div>
                            </div>

                        {/* Build Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleBuildMacApp}
                                disabled={actionLoading === 'build-mac' || macBuild?.status === 'pending' || macBuild?.status === 'building'}
                                className={clsx(
                                    "px-4 py-2 rounded-[8px] text-[11px] font-black transition-all flex items-center gap-2 disabled:opacity-50",
                                    macBuild?.status === 'ready' 
                                        ? "bg-black/40 border border-[#111] text-[#444] hover:text-[#666]" 
                                        : "bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]"
                                )}
                            >
                                {actionLoading === 'build-mac' || macBuild?.status === 'pending' || macBuild?.status === 'building' ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> {macBuild?.status === 'building' ? 'Building...' : 'Starting...'}</>
                                ) : (
                                    <>{macBuild?.status === 'ready' ? 'Rebuild App' : 'Build Mac App'}</>
                                )}
                            </button>

                            {macBuild?.status === 'ready' && (
                                <a 
                                    href={macBuild.dmg_url}
                                    download
                                    className="px-4 py-2 rounded-[8px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[11px] font-black hover:bg-fuchsia-500/20 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.05)]"
                                >
                                    <span>Download .dmg</span>
                                    <Download className="w-2.5 h-2.5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Build Configuration Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#111]">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2 p-1 bg-black/50 border border-[#111] rounded-[10px]">
                                <button 
                                    onClick={() => setSelectedBuildMode('fast')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-[7px] text-[10px] font-bold transition-all flex items-center gap-2",
                                        selectedBuildMode === 'fast' 
                                            ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]" 
                                            : "text-[#444] hover:text-[#777]"
                                    )}
                                >
                                    <Activity className="w-3 h-3" />
                                    Fast Build
                                </button>
                                <button 
                                    onClick={() => setSelectedBuildMode('pro')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-[7px] text-[10px] font-bold transition-all flex items-center gap-2 relative",
                                        selectedBuildMode === 'pro' 
                                            ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20" 
                                            : "text-[#444] hover:text-[#777]"
                                    )}
                                >
                                    <Monitor className="w-3 h-3" />
                                    Pro Build
                                    {selectedBuildMode === 'pro' && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />}
                                </button>
                            </div>

                            {selectedBuildMode === 'pro' && (
                                <button 
                                    onClick={() => setShowProSettings(!showProSettings)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-[8px] border transition-all flex items-center gap-2 text-[10px] font-bold",
                                        showProSettings ? "border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-500/5" : "border-[#1A1A1A] text-[#444] hover:border-[#333]"
                                    )}
                                >
                                    <span>Settings</span>
                                    <ChevronRight className={clsx("w-3 h-3 transition-transform", showProSettings && "rotate-90")} />
                                </button>
                            )}
                        </div>

                        {macBuild?.status === 'ready' && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[#333] text-[9px] font-mono tracking-tighter uppercase">
                                    Last build: {formatDistanceToNow(new Date(macBuild.updated_at), { addSuffix: true })} ({macBuild.build_mode})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pro Settings Configurator */}
                    {selectedBuildMode === 'pro' && showProSettings && macConfig && (
                        <div className="flex flex-col gap-8 p-6 bg-[#050505] border border-[#111] rounded-[12px] animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
                                <div className="flex flex-col gap-8">
                                    {/* 1. Window & Dimensions */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.1em]">Window & Layout</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-[#444] uppercase">Width</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={macConfig.window?.width}
                                                        onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, width: parseInt(e.target.value)}})}
                                                        className="w-full bg-black border border-[#111] rounded-[8px] px-3 py-2 text-white text-xs outline-none focus:border-fuchsia-500/30 transition-colors"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#222]">PX</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-[#444] uppercase">Height</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={macConfig.window?.height}
                                                        onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, height: parseInt(e.target.value)}})}
                                                        className="w-full bg-black border border-[#111] rounded-[8px] px-3 py-2 text-white text-xs outline-none focus:border-fuchsia-500/30 transition-colors"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#222]">PX</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 pt-1">
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    checked={macConfig.window?.frameless}
                                                    onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, frameless: e.target.checked}})}
                                                    className="sr-only"
                                                />
                                                <div className={clsx(
                                                    "w-3.5 h-3.5 rounded-full border border-[#222] transition-all flex items-center justify-center",
                                                    macConfig.window?.frameless ? "bg-fuchsia-500 border-fuchsia-400" : "bg-black"
                                                )}>
                                                    {macConfig.window?.frameless && <Check className="w-2 h-2 text-black stroke-[4]" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#555] group-hover:text-[#888] transition-colors">Frameless</span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    checked={macConfig.window?.transparent}
                                                    onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, transparent: e.target.checked}})}
                                                    className="sr-only"
                                                />
                                                <div className={clsx(
                                                    "w-3.5 h-3.5 rounded-full border border-[#222] transition-all flex items-center justify-center",
                                                    macConfig.window?.transparent ? "bg-fuchsia-500 border-fuchsia-400" : "bg-black"
                                                )}>
                                                    {macConfig.window?.transparent && <Check className="w-2 h-2 text-black stroke-[4]" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#555] group-hover:text-[#888] transition-colors">Transparent</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* 2. Visual Effects & Toolbar */}
                                    <div className="grid grid-cols-2 gap-10 border-t border-[#111] pt-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.1em]">Visual Effects</h3>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={macConfig.vibrancy?.enabled}
                                                        onChange={(e) => setMacConfig({...macConfig, vibrancy: {...macConfig.vibrancy, enabled: e.target.checked}})}
                                                        className="sr-only"
                                                    />
                                                    <div className={clsx(
                                                        "w-3.5 h-3.5 rounded-full border border-[#222] transition-all flex items-center justify-center",
                                                        macConfig.vibrancy?.enabled ? "bg-fuchsia-500 border-fuchsia-400" : "bg-black"
                                                    )}>
                                                        {macConfig.vibrancy?.enabled && <Check className="w-2 h-2 text-black stroke-[4]" />}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-[#555] group-hover:text-[#888]">Enable Blur (Vibrancy)</span>
                                                </label>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold text-[#444] uppercase">Blur Type</label>
                                                    <select 
                                                        value={macConfig.vibrancy?.type}
                                                        disabled={!macConfig.vibrancy?.enabled}
                                                        onChange={(e) => setMacConfig({...macConfig, vibrancy: {...macConfig.vibrancy, type: e.target.value}})}
                                                        className="w-full bg-black border border-[#111] rounded-[8px] px-3 py-2 text-white text-xs outline-none focus:border-fuchsia-500/30 transition-colors disabled:opacity-30"
                                                    >
                                                        <option value="under-window">Under Window</option>
                                                        <option value="fullscreen-ui">Fullscreen UI</option>
                                                        <option value="sidebar">Sidebar</option>
                                                        <option value="menu">Menu</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.1em]">Toolbar Style</h3>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-[#444] uppercase">Mac Traffic Lights</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['Default', 'Hidden', 'Overlay'].map((style) => (
                                                        <button
                                                            key={style}
                                                            onClick={() => setMacConfig({...macConfig, toolbar: { style }})}
                                                            className={clsx(
                                                                "px-3 py-2 rounded-[8px] border text-[10px] font-bold text-left transition-all",
                                                                macConfig.toolbar?.style === style 
                                                                    ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400" 
                                                                    : "bg-black border-[#111] text-[#444] hover:border-[#222]"
                                                            )}
                                                        >
                                                            {style}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Behavior & Controls */}
                                    <div className="flex flex-col gap-4 border-t border-[#111] pt-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.1em]">Behavior</h3>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    checked={macConfig.behavior?.resizable}
                                                    onChange={(e) => setMacConfig({...macConfig, behavior: {...macConfig.behavior, resizable: e.target.checked}})}
                                                    className="sr-only"
                                                />
                                                <div className={clsx(
                                                    "w-3.5 h-3.5 rounded-full border border-[#222] transition-all flex items-center justify-center",
                                                    macConfig.behavior?.resizable ? "bg-fuchsia-500 border-fuchsia-400" : "bg-black"
                                                )}>
                                                    {macConfig.behavior?.resizable && <Check className="w-2 h-2 text-black stroke-[4]" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#555] group-hover:text-[#888]">Resizable Window</span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    checked={macConfig.behavior?.always_on_top}
                                                    onChange={(e) => setMacConfig({...macConfig, behavior: {...macConfig.behavior, always_on_top: e.target.checked}})}
                                                    className="sr-only"
                                                />
                                                <div className={clsx(
                                                    "w-3.5 h-3.5 rounded-full border border-[#222] transition-all flex items-center justify-center",
                                                    macConfig.behavior?.always_on_top ? "bg-fuchsia-500 border-fuchsia-400" : "bg-black"
                                                )}>
                                                    {macConfig.behavior?.always_on_top && <Check className="w-2 h-2 text-black stroke-[4]" />}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#555] group-hover:text-[#888]">Always on Top</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Visual Preview Side Panel */}
                                <div className="flex flex-col gap-4 bg-black/40 border border-[#111] rounded-[12px] p-6 relative overflow-hidden group/preview">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.1em]">Visual Preview</h3>
                                        <div className="px-1.5 py-0.5 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/20 text-[8px] font-black text-fuchsia-400 uppercase tracking-widest">Live</div>
                                    </div>
                                    
                                    {/* Mock macOS Window */}
                                    <div className="flex-1 flex items-center justify-center py-10 relative">
                                        {/* Mock Background (for vibrancy) */}
                                        <div className="absolute inset-0 z-0 opacity-40 select-none pointer-events-none">
                                            <div className="w-full h-full bg-gradient-to-br from-fuchsia-900/20 via-black to-blue-900/20 rounded-lg blur-xl" />
                                        </div>

                                        <div className={clsx(
                                            "relative w-full max-w-[240px] aspect-[1.4/1] bg-[#0A0A0A] border border-[#222] rounded-[10px] shadow-2xl transition-all duration-500 overflow-hidden",
                                            macConfig.window?.transparent && "opacity-80",
                                            macConfig.vibrancy?.enabled && "backdrop-blur-md bg-black/40"
                                        )}>
                                            {/* Toolbar Area */}
                                            {macConfig.toolbar?.style !== 'Hidden' && (
                                                <div className={clsx(
                                                    "h-8 w-full border-b border-[#111] flex items-center px-3 gap-1.5",
                                                    macConfig.toolbar?.style === 'Overlay' && "absolute top-0 left-0 bg-transparent border-none z-10"
                                                )}>
                                                    {/* Traffic Lights */}
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] shadow-sm" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840] shadow-sm" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* App Content Placeholder */}
                                            <div className="p-4 flex flex-col gap-2">
                                                <div className="w-full h-2 rounded-full bg-[#111]" />
                                                <div className="w-2/3 h-2 rounded-full bg-[#111]" />
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <div className="aspect-square rounded-[6px] bg-[#111] border border-[#222]/10" />
                                                    <div className="aspect-square rounded-[6px] bg-[#111] border border-[#222]/10" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-[#111]/50 text-center">
                                        <p className="text-[9px] font-medium text-[#333] leading-relaxed">
                                            This preview simulates how your app architecture will behave in macOS.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#111]">
                                <button 
                                    onClick={() => setShowProSettings(false)}
                                    className="px-4 py-2 rounded-[8px] bg-black/40 border border-[#111] text-[#444] text-[11px] font-black hover:text-[#666] transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveMacConfig}
                                    disabled={isSavingConfig}
                                    className="px-4 py-2 rounded-[8px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[11px] font-black hover:bg-fuchsia-500/20 transition-all shadow-[0_0_15px_rgba(217,70,239,0.05)] disabled:opacity-50"
                                >
                                    {isSavingConfig ? 'Saving...' : 'Apply & Save Config'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    </div>

            {/* 4. Analytics Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-white font-bold text-base tracking-tight">Analytics</h2>
                        <span className="text-[#333] text-[10px] font-bold uppercase tracking-[0.2em]">Last 24 hours</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#222]" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <AnalyticsCard 
                        title="Requests" 
                        value={formatNumber(analytics?.requests || 130)} 
                        percentage="+59200.00%" 
                        points={[10, 15, 12, 18, 14, 22, 19, 25, 23, 30, 28, 35, 32, 40]} 
                        color="#D946EF" 
                    />
                    <AnalyticsCard 
                        title="Latency" 
                        value="1.25 ms" 
                        percentage="-12.50%" 
                        points={[40, 38, 42, 35, 37, 30, 33, 28, 30, 25, 27, 22, 24, 20]} 
                        color="#22d3ee" 
                        isInverse
                    />
                    <AnalyticsCard 
                        title="Unique Visits" 
                        value={formatNumber(analytics?.visits || 0)} 
                        percentage="+8500.00%" 
                        points={[5, 8, 6, 10, 9, 15, 12, 18, 16, 22, 20, 25, 23, 30]} 
                        color="#D946EF" 
                    />
                </div>
            </div>

            {/* 5. Store Analytics Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3 px-1">
                    <h2 className="text-white/20 font-bold text-base tracking-tight">Store Analytics</h2>
                    <span className="text-[#222] text-[10px] font-bold uppercase tracking-[0.2em]">Last 24 hours</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 opacity-30 grayscale pointer-events-none">
                    <AnalyticsCard title="Store Requests" value="0" percentage="0.00%" points={[0, 0, 0, 0]} color="#444" />
                    <AnalyticsCard title="Sales" value="0%" percentage="0.00%" points={[0, 0, 0, 0]} color="#444" />
                    <AnalyticsCard title="Revenue" value="$0.00" percentage="0.00%" points={[0, 0, 0, 0]} color="#444" />
                </div>
            </div>
        </div>
    );
}
