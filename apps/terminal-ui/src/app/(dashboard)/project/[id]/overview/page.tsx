"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, Check, Globe, Activity, ExternalLink, ChevronRight, Monitor, Download, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';

import { TabHeader } from '@/components/ui/TabHeader';
import AsciiVortexAnimation from './AsciiVortexAnimation';

const AnalyticsCard = ({ title, value, percentage, points, color, isInverse, onClick }: any) => {
    return (
        <div 
            onClick={onClick}
            className={clsx(
                "bg-neutral-50 border border-neutral-200 rounded-[10px] p-4 flex flex-col gap-1 group hover:bg-neutral-100 transition-all duration-300 relative overflow-hidden h-[100px]",
                onClick && "cursor-pointer active:scale-[0.98]"
            )}
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                    <span className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-widest mb-1">{title}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
                        <div className={clsx(
                            "flex items-center text-[9px] font-bold px-1 py-0.5 rounded",
                            percentage.startsWith('+') ? (isInverse ? "bg-red-500/5 text-red-500/60" : "bg-green-500/5 text-green-500/60") : 
                                                         (isInverse ? "bg-green-500/5 text-green-500/60" : "bg-red-500/5 text-red-500/60")
                        )}>
                            {percentage}
                        </div>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors">
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
    if (!points || points.length < 2) return <div className="h-full w-full bg-card/20 animate-pulse" />;
    
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

    // iOS Build State
    const [iosBuild, setIosBuild] = useState<any>(null);
    const [loadingIosBuild, setLoadingIosBuild] = useState(true);
    const [brandUpdateTimestamp, setBrandUpdateTimestamp] = useState(Date.now());

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
    
    const handleTogglePublish = async () => {
        if (!project) return;
        const listing = project.marketplace_listings?.[0];
        
        if (!listing) {
            showToast("Please configure your store listing first", "info");
            router.push(`/project/${projectId}/store`);
            return;
        }

        const isPublished = listing.status === 'published';
        const newStatus = isPublished ? 'unlisted' : 'published';
        
        setActionLoading('publishing');
        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .update({ 
                    status: newStatus,
                    published_at: (newStatus === 'published' && !listing.published_at) ? new Date().toISOString() : listing.published_at
                })
                .eq('id', listing.id);

            if (error) throw error;
            showToast(`App ${newStatus === 'published' ? 'published' : 'hidden'} successfully`, 'success');
        } catch (err) {
            console.error("Error toggling publish:", err);
            showToast("Failed to update status", "error");
        } finally {
            setActionLoading(null);
        }
    };

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
        if (!projectId) return;
        
        const fetchIosBuild = async () => {
            const { data } = await supabase
                .from('ios_builds')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) setIosBuild(data);
            setLoadingIosBuild(false);
        };
        fetchIosBuild();

        const subscription = supabase
            .channel(`ios_builds_overview_${projectId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'ios_builds', 
                filter: `project_id=eq.${projectId}` 
            }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    setIosBuild(null);
                } else {
                    setIosBuild(payload.new);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [projectId]);

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
            const worker_url = `https://${subdomain}.foldaa.com`;

            // Consolidate updates to prevent race conditions and ensure all fields are set
            const { error: updateError } = await supabase
                .from('projects')
                .update({ 
                    subdomain, 
                    worker_url,
                    status: 'deploying'
                })
                .eq('id', projectId);

            if (updateError) {
                console.error('Initial database update failed:', updateError);
                throw new Error(`Failed to initialize deployment state: ${updateError.message}`);
            }

            // Initiate redeploy with explicit naming to prevent subdomain changes
            const { error: functionError } = await supabase.functions.invoke('deploy-project', {
                body: { 
                    project_id: projectId, 
                    action: 'deploy',
                    project_data: {
                        name: project.name,
                        subdomain,
                        worker_url
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
        } catch (error: any) {
            console.error('Redeploy error object:', error);
            
            let errMsg = error.message || 'Unknown error';
            
            // Try to extract detailed message from Supabase FunctionsHttpError
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const details = await error.context.json();
                    if (details.error) errMsg = details.error;
                    if (details.details) errMsg += ` (${details.details})`;
                } catch (e) {
                    console.error('Failed to parse error body:', e);
                }
            } else if (error.details) {
                errMsg = error.details;
            }

            showToast(`Failed to initiate redeployment: ${errMsg}`, 'error');
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

    const handleBuildIosApp = async () => {
        if (!projectId) return;
        setActionLoading('build-ios');
        
        try {
            // Get latest certificate for this project
            const { data: certs } = await supabase
                .from('ios_certificates')
                .select('id')
                .eq('project_id', projectId)
                .eq('is_valid', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (!certs || certs.length === 0) {
                showToast('No valid iOS certificate found. Please set one up in the Release tab.', 'error');
                return;
            }

            const { error } = await supabase.functions.invoke('build-ios', {
                body: { 
                    project_id: projectId,
                    certificate_id: certs[0].id,
                    version_number: '1.0.0',
                    build_number: String(Date.now()).slice(-6)
                }
            });
            if (error) throw error;
            showToast('iOS Build started successfully', 'success');
        } catch (error) {
            console.error('Build ios error:', error);
            showToast('Failed to start iOS build', 'error');
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
                body: { url: project.original_url, refresh: true }
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
            
            setBrandUpdateTimestamp(Date.now());
            
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
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
                                className="w-12 h-12 rounded-[10px] flex-shrink-0 flex items-center justify-center overflow-hidden bg-neutral-100 border border-neutral-200 shadow-sm transition-transform hover:scale-105"
                                style={{ backgroundColor: projectIcon ? 'transparent' : (project.theme_color || 'var(--secondary)') }}
                            >
                                {projectIcon ? (
                                    <img 
                                        src={`${projectIcon}${projectIcon.includes('?') ? '&' : '?'}t=${brandUpdateTimestamp}`} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="font-bold text-foreground/20 text-xl select-none">
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
                                         className="bg-secondary border border-border rounded px-2 py-0.5 text-foreground font-bold text-xl outline-none focus:border-border/80"
                                    />
                                </div>
                            ) : (
                                <h1 
                                    onClick={() => setIsEditingName(true)}
                                    className="text-foreground font-bold text-2xl tracking-tight cursor-text hover:text-foreground/60 transition-colors"
                                >
                                </h1>
                            )}
                        </div>
                        <p className="text-muted-foreground/60 text-xs font-medium tracking-wide">
                            {project.framework || 'PWA Experience'} Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground/40 text-[9px] font-bold tracking-[0.2em] uppercase">Visibility</span>
                        <p className="text-[10px] text-muted-foreground/60 leading-tight">Publish on Store...</p>
                    </div>
                    {(() => {
                        const listing = project.marketplace_listings?.[0];
                        const marketplaceStatus = listing?.status;
                        const isPublished = marketplaceStatus === 'published';
                        const isPublishing = actionLoading === 'publishing';
                        
                        return (
                            <button 
                                onClick={handleTogglePublish}
                                disabled={isPublishing}
                                className={clsx(
                                    "btn-outline",
                                     isPublished && "bg-neutral-100" 
                                )}
                            >
                                <span className={clsx(isPublishing && "opacity-0")}>
                                    {isPublished ? 'Published' : (marketplaceStatus === 'unlisted' ? 'Unlisted' : 'Publish')}
                                </span>
                                {isPublishing ? (
                                    <div className="absolute inset-x-0 flex justify-center">
                                        <Loader2 className="w-3 h-3 animate-spin text-foreground" />
                                    </div>
                                ) : (
                                    isPublished ? (
                                        <Check className="w-3.5 h-3.5 text-brand-500 animate-in zoom-in duration-500 group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 group-hover:bg-muted-foreground transition-colors" />
                                    )
                                )}
                            </button>
                        );
                    })()}
                </div>
            </div>

            {/* 2. PWA Settings & Test Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-1">
                    <h2 className="text-foreground font-bold text-base tracking-tight">PWA Settings</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-full text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                        <span>Viewport Size</span>
                        <div className="w-1 h-1 rounded-full bg-foreground/40 animate-pulse" />
                        <span className="text-foreground/60">PWA</span>
                    </div>
                    <ChevronRight 
                        className="w-3.5 h-3.5 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => router.push(`/project/${projectId}/banner`)}
                    />
                </div>

                <div className="flex items-center justify-center gap-16 bg-neutral-50 border border-neutral-200 rounded-[10px] p-10 relative overflow-hidden group/card hover:bg-neutral-100 transition-all min-h-[320px]">
                    {/* Background subtle glow removed per user request for neutral aesthetic */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none" />
                    
                    {/* Mockup */}
                    <div className="relative flex-shrink-0">
                        <div className="relative group" style={{ width: '277px', height: '234.36px' }}>
                            <img 
                                src="/images/iphone-mockup.png" 
                                alt="iPhone Mockup" 
                                className="w-full h-full object-cover pointer-events-none drop-shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                            />
                            <div 
                                className="absolute overflow-hidden rounded-[22%] shadow-2xl transition-transform duration-500 hover:scale-105"
                                style={{
                                    top: '71.68px',
                                    left: '48.01px',
                                    width: '43.08px',
                                    aspectRatio: '1/1',
                                    backgroundColor: (project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url) ? 'transparent' : (project.theme_color || 'var(--secondary)')
                                }}
                            >
                                {(() => {
                                    const projectIcon = project.icon_512_url || project.icon_192_url || project.apple_touch_icon_url || project.favicon_url;
                                    return projectIcon ? (
                                        <img 
                                            src={`${projectIcon}${projectIcon.includes('?') ? '&' : '?'}t=${brandUpdateTimestamp}`} 
                                            alt="" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-foreground/20 font-bold text-xs select-none">
                                            {project.name.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col items-center">
                            <span className="text-muted-foreground/40 text-[9px] font-bold tracking-[0.2em] uppercase">PREVIEW</span>
                            <span className="text-muted-foreground/60 text-[9px] font-mono">{project.name?.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.app</span>
                        </div>
                    </div>

                    {/* QR Code Testing */}
                    <div className="flex flex-col gap-5 items-center">
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <h3 className="text-foreground font-bold text-base tracking-tight">Scan to test</h3>
                            <p className="text-muted-foreground/60 text-[11px] max-w-[160px] leading-relaxed">View your PWA directly on your device.</p>
                        </div>
                        <div className="p-3 bg-white rounded-[10px] shadow-2xl group-hover:scale-105 transition-transform duration-500 border border-border">
                            <QRCodeCanvas 
                                value={project.worker_url || `https://${project.subdomain}.foldaa.com`} 
                                size={114}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Web Experience Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-foreground font-bold text-base tracking-tight">Web Experience</h2>
                    <ChevronRight 
                        className="w-3.5 h-3.5 text-[#222] cursor-pointer hover:text-foreground/60 transition-colors" 
                        onClick={() => router.push(`/project/${projectId}/domains`)}
                    />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-[10px] group hover:border-border/80 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-[8px] bg-background border border-border flex items-center justify-center text-muted-foreground">
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-foreground font-bold tracking-tight text-sm">{(project.worker_url || `${project.subdomain}.foldaa.com`).replace(/^https?:\/\//, '')}</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded-md text-[8px] font-bold text-green-500 uppercase tracking-widest">
                                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                    <span>Active</span>
                                </div>
                            </div>
                            <span className="text-muted-foreground/60 text-[10px] font-medium tracking-wide">Automatic deployment detecting</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground/40 text-[10px] font-mono">{formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}</span>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={actionLoading === 'redeploy'}
                                onClick={handleRedeploy}
                                className="btn-outline text-[11px] disabled:opacity-50"
                            >
                                {actionLoading === 'redeploy' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                <span>Redeploy</span>
                            </button>
                            <button 
                                disabled={actionLoading === 'update-brand'}
                                onClick={handleUpdateBrand}
                                className="btn-outline text-[11px] disabled:opacity-50"
                            >
                                {actionLoading === 'update-brand' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                <span>Regenerate Brand</span>
                            </button>
                            <button className="btn-outline text-[11px]">Edit</button>
                            <a 
                                href={project.worker_url || `https://${project.subdomain}.foldaa.com`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-outline text-[11px]"
                            >
                                <span>Open Live</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>


            {/* 4. Native Platforms Section */}
            <div className="flex flex-col gap-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-foreground font-bold text-base tracking-tight">Native Platforms</h2>
                        <span className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-[0.2em]">Desktop & Mobile</span>
                    </div>
                    <ChevronRight 
                        className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => router.push(`/project/${projectId}/release`)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* 4.1 macOS Build Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">macOS</span>
                            {macBuild?.status === 'ready' && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground/60 text-[9px] font-mono tracking-tighter uppercase whitespace-nowrap">
                                        Last build: {formatDistanceToNow(new Date(macBuild.updated_at), { addSuffix: true })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ASCII Build Animation (Vortex) or Main Card */}
                        {showVortex ? (
                            <AsciiVortexAnimation 
                                status={macBuild?.status} 
                                onExploded={() => setShowVortex(false)} 
                            />
                        ) : (
                            <div 
                                onClick={() => router.push(`/project/${projectId}/release`)}
                                className={clsx(
                                    "flex items-center justify-between p-4 bg-card border border-border rounded-[10px] transition-all relative overflow-hidden cursor-pointer active:scale-[0.99] group/card",
                                    "hover:border-border/40 hover:bg-secondary/22",
                                    (macBuild?.status === 'building' || macBuild?.status === 'pending') && "border-border/40 bg-secondary/30"
                                )}
                            >
                                {/* Animated Progress Bar */}
                                {(macBuild?.status === 'building' || macBuild?.status === 'pending') && (
                                    <div className="absolute bottom-0 left-0 h-[1.5px] bg-foreground animate-[progress_3s_infinite_ease-in-out] shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ width: '40%' }} />
                                )}

                                <div className="flex flex-col gap-6 w-full">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-[10px] bg-secondary border border-border flex items-center justify-center transition-all",
                                                (macBuild?.status === 'building' || macBuild?.status === 'pending') && "animate-pulse border-border/40 shadow-sm"
                                            )}>
                                                <Monitor className={clsx(
                                                    "w-5 h-5 transition-colors",
                                                    (macBuild?.status === 'building' || macBuild?.status === 'pending') ? "text-muted-foreground/60" : "text-foreground"
                                                )} />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground font-bold tracking-tight text-sm">macOS Application</span>
                                                    {(macBuild?.status === 'building' || macBuild?.status === 'pending') && (
                                                        <span className="text-muted-foreground/40 text-[8px] font-black uppercase tracking-widest animate-pulse">Processing...</span>
                                                    )}
                                                </div>
                                                <span className="text-muted-foreground/60 text-[11px] font-medium tracking-wide">Build a native installer (DMG) for your project.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleBuildMacApp}
                                                disabled={actionLoading === 'build-mac' || macBuild?.status === 'pending' || macBuild?.status === 'building'}
                                                className={clsx(
                                                    "px-4 py-2 rounded-[8px] text-[11px] font-black transition-all flex items-center gap-2 disabled:opacity-50",
                                                    macBuild?.status === 'ready' 
                                                        ? "bg-secondary border border-border text-muted-foreground hover:bg-secondary/80" 
                                                        : "bg-foreground border border-foreground/10 text-background hover:bg-foreground/90"
                                                )}
                                            >
                                                <>{macBuild?.status === 'ready' ? 'Rebuild App' : 'Build Mac App'}</>
                                            </button>

                                            {macBuild?.status === 'ready' && (
                                                <a 
                                                    href={macBuild.dmg_url}
                                                    download
                                                    className="px-4 py-2 rounded-[8px] bg-secondary border border-border text-foreground text-[11px] font-black hover:bg-secondary/80 transition-all flex items-center gap-2"
                                                >
                                                    <span>Download</span>
                                                    <Download className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Build Type Switcher */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                                        <div className="flex gap-2 p-1 bg-background border border-border rounded-[10px]">
                                            <button 
                                                onClick={() => setSelectedBuildMode('fast')}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-[7px] text-[10px] font-bold transition-all flex items-center gap-2",
                                                    selectedBuildMode === 'fast' ? "bg-secondary text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Fast Build
                                            </button>
                                            <button 
                                                onClick={() => setSelectedBuildMode('pro')}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-[7px] text-[10px] font-bold transition-all flex items-center gap-2",
                                                    selectedBuildMode === 'pro' ? "bg-secondary text-foreground border border-border" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Pro Build
                                            </button>
                                        </div>
                                        {selectedBuildMode === 'pro' && (
                                            <button 
                                                onClick={() => setShowProSettings(!showProSettings)}
                                                className="px-3 py-1.5 rounded-[8px] border border-border text-muted-foreground text-[10px] font-bold hover:bg-secondary hover:text-foreground transition-all"
                                            >
                                                Configure Settings
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pro Settings Configurator (Nested) */}
                        {selectedBuildMode === 'pro' && showProSettings && macConfig && (
                            <div className="flex flex-col gap-8 p-6 bg-card border border-border rounded-[12px] animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
                                    <div className="flex flex-col gap-8">
                                        {/* 1. Window & Dimensions */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                                                <h3 className="text-[11px] font-black text-foreground/40 uppercase tracking-[0.1em]">Window & Layout</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Width</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            value={macConfig.window?.width}
                                                            onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, width: parseInt(e.target.value)}})}
                                                            className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-foreground text-xs outline-none focus:border-border/40 transition-colors"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground/40">PX</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Height</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            value={macConfig.window?.height}
                                                            onChange={(e) => setMacConfig({...macConfig, window: {...macConfig.window, height: parseInt(e.target.value)}})}
                                                            className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-foreground text-xs outline-none focus:border-border/40 transition-colors"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground/40">PX</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 pt-1">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => setMacConfig({...macConfig, window: {...macConfig.window, frameless: !macConfig.window?.frameless}})}
                                                        className={clsx(
                                                            "w-8 h-4 rounded-full relative transition-all duration-300",
                                                            macConfig.window?.frameless ? "bg-brand-500/20" : "bg-black/50"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all duration-300",
                                                            macConfig.window?.frameless ? "translate-x-4 bg-black dark:bg-white" : "translate-x-0 bg-black dark:bg-white"
                                                        )} />
                                                    </button>
                                                    <span className="text-[11px] font-bold text-muted-foreground/60 transition-colors">Frameless</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => setMacConfig({...macConfig, window: {...macConfig.window, transparent: !macConfig.window?.transparent}})}
                                                        className={clsx(
                                                            "w-8 h-4 rounded-full relative transition-all duration-300",
                                                            macConfig.window?.transparent ? "bg-brand-500/20" : "bg-black/50"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all duration-300",
                                                            macConfig.window?.transparent ? "translate-x-4 bg-black dark:bg-white" : "translate-x-0 bg-black dark:bg-white"
                                                        )} />
                                                    </button>
                                                    <span className="text-[11px] font-bold text-muted-foreground/60 transition-colors">Transparent</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Visual Effects & Toolbar */}
                                        <div className="grid grid-cols-2 gap-10 border-t border-border pt-6">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                                                    <h3 className="text-[11px] font-black text-foreground/40 uppercase tracking-[0.1em]">Visual Effects</h3>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setMacConfig({...macConfig, vibrancy: {...macConfig.vibrancy, enabled: !macConfig.vibrancy?.enabled}})}
                                                            className={clsx(
                                                                "w-8 h-4 rounded-full relative transition-all duration-300",
                                                                macConfig.vibrancy?.enabled ? "bg-brand-500/20" : "bg-black/50"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all duration-300",
                                                                macConfig.vibrancy?.enabled ? "translate-x-4 bg-black dark:bg-white" : "translate-x-0 bg-black dark:bg-white"
                                                            )} />
                                                        </button>
                                                        <span className="text-[11px] font-bold text-muted-foreground/60">Enable Blur (Vibrancy)</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Blur Type</label>
                                                        <select 
                                                            value={macConfig.vibrancy?.type}
                                                            disabled={!macConfig.vibrancy?.enabled}
                                                            onChange={(e) => setMacConfig({...macConfig, vibrancy: {...macConfig.vibrancy, type: e.target.value}})}
                                                            className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-foreground text-xs outline-none focus:border-border/40 transition-colors disabled:opacity-30"
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
                                                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                                                    <h3 className="text-[11px] font-black text-foreground/40 uppercase tracking-[0.1em]">Toolbar Style</h3>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Mac Traffic Lights</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {['Default', 'Hidden', 'Overlay'].map((style) => (
                                                            <button
                                                                key={style}
                                                                onClick={() => setMacConfig({...macConfig, toolbar: { style }})}
                                                                className={clsx(
                                                                    "px-3 py-2 rounded-[8px] border text-[10px] font-bold text-left transition-all",
                                                                    macConfig.toolbar?.style === style 
                                                                        ? "bg-secondary border-border/60 text-foreground" 
                                                                        : "bg-background border-border text-muted-foreground hover:border-border/60"
                                                                )}
                                                            >
                                                                {style}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Visual Preview Side Panel */}
                                    <div className="flex flex-col gap-4 bg-secondary/10 border border-border rounded-[12px] p-6 relative overflow-hidden group/preview">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.1em]">Visual Preview</h3>
                                            <div className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Live</div>
                                        </div>
                                        
                                        {/* Mock macOS Window */}
                                        <div className="flex-1 flex items-center justify-center py-6 relative">
                                            {/* Mock Background (for vibrancy) */}
                                            <div className="absolute inset-0 z-0 opacity-40 select-none pointer-events-none">
                                                <div className="w-full h-full bg-gradient-to-br from-foreground/5 via-transparent to-foreground/5 rounded-lg blur-xl" />
                                            </div>

                                            <div className={clsx(
                                                "relative w-full max-w-[200px] aspect-[1.4/1] bg-card border border-border rounded-[10px] shadow-xl transition-all duration-500 overflow-hidden",
                                                macConfig.window?.transparent && "opacity-80",
                                                macConfig.vibrancy?.enabled && "backdrop-blur-md bg-card/40"
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
                                                <div className="p-4 flex flex-col gap-2">
                                                    <div className="w-full h-2 rounded-full bg-card" />
                                                    <div className="w-2/3 h-2 rounded-full bg-card" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                                    <button 
                                        onClick={() => setShowProSettings(false)}
                                        className="px-4 py-2 rounded-[8px] bg-secondary border border-border text-muted-foreground text-[11px] font-black hover:text-foreground transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveMacConfig}
                                        disabled={isSavingConfig}
                                        className="px-4 py-2 rounded-[8px] bg-foreground border border-foreground/10 text-background text-[11px] font-black hover:bg-foreground/90 transition-all disabled:opacity-50"
                                    >
                                        {isSavingConfig ? 'Saving...' : 'Apply & Save Config'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4.2 iOS Build Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">iOS</span>
                            {iosBuild?.status === 'completed' && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground/60 text-[9px] font-mono tracking-tighter uppercase whitespace-nowrap">
                                        Version: {iosBuild.version} ({iosBuild.build_number})
                                    </span>
                                </div>
                            )}
                        </div>

                        <div 
                            onClick={() => router.push(`/project/${projectId}/release`)}
                            className={clsx(
                                "flex items-center justify-between p-4 bg-card border border-border rounded-[10px] group hover:border-border/80 transition-all relative overflow-hidden cursor-pointer active:scale-[0.99]",
                                (iosBuild?.status === 'building' || iosBuild?.status === 'pending') && "border-border/40 bg-secondary/30"
                            )}
                        >
                            {(iosBuild?.status === 'building' || iosBuild?.status === 'pending') && (
                                <div className="absolute bottom-0 left-0 h-[1.5px] bg-foreground animate-[progress_5s_infinite_ease-in-out] shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ width: '60%' }} />
                            )}

                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-[10px] bg-secondary border border-border flex items-center justify-center transition-all",
                                    (iosBuild?.status === 'building' || iosBuild?.status === 'pending') && "animate-pulse border-border/40 shadow-sm"
                                )}>
                                    <Smartphone className={clsx(
                                        "w-5 h-5 transition-colors",
                                        (iosBuild?.status === 'building' || iosBuild?.status === 'pending') ? "text-muted-foreground/60" : "text-foreground"
                                    )} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-bold tracking-tight text-sm">iOS Application</span>
                                        {(iosBuild?.status === 'building' || iosBuild?.status === 'pending') && (
                                            <span className="text-muted-foreground/40 text-[8px] font-black uppercase tracking-widest animate-pulse">Processing...</span>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground/60 text-[11px] font-medium tracking-wide">Cloud-synced IPA build for Apple App Store release.</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleBuildIosApp}
                                    disabled={actionLoading === 'build-ios' || iosBuild?.status === 'pending' || iosBuild?.status === 'building'}
                                    className={clsx(
                                        "px-4 py-2 rounded-[8px] text-[11px] font-black transition-all flex items-center gap-2 disabled:opacity-50",
                                        iosBuild?.status === 'completed' 
                                            ? "bg-secondary border border-border text-muted-foreground hover:bg-secondary/80" 
                                            : "bg-foreground border border-foreground/10 text-background hover:bg-foreground/90"
                                    )}
                                >
                                    {actionLoading === 'build-ios' || iosBuild?.status === 'pending' || iosBuild?.status === 'building' ? (
                                        <><Loader2 className="w-3 h-3 animate-spin" /> {iosBuild?.status === 'building' ? 'Building...' : 'Starting...'}</>
                                    ) : (
                                        <>{iosBuild?.status === 'completed' ? 'Rebuild App' : 'Start Build'}</>
                                    )}
                                </button>
                                
                                {iosBuild?.status === 'completed' && iosBuild.ipa_url && (
                                    <a 
                                        href={iosBuild.ipa_url}
                                        target="_blank"
                                        className="px-4 py-2 rounded-[8px] bg-secondary border border-border text-foreground text-[11px] font-black hover:bg-secondary/80 transition-all flex items-center gap-2"
                                    >
                                        <span>Download</span>
                                        <Download className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-foreground font-bold text-base tracking-tight">Analytics</h2>
                        <span className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-[0.2em]">Last 24 hours</span>
                    </div>
                    <ChevronRight 
                        className="w-3.5 h-3.5 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => router.push(`/project/${projectId}/analytics`)}
                    />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <AnalyticsCard 
                        title="Requests" 
                        value={formatNumber(analytics?.requests || 130)} 
                        percentage="+59200.00%" 
                        points={[10, 15, 12, 18, 14, 22, 19, 25, 23, 30, 28, 35, 32, 40]} 
                        color="var(--foreground)" 
                        onClick={() => router.push(`/project/${projectId}/analytics`)}
                    />
                    <AnalyticsCard 
                        title="Latency" 
                        value="1.25 ms" 
                        percentage="-12.50%" 
                        points={[40, 38, 42, 35, 37, 30, 33, 28, 30, 25, 27, 22, 24, 20]} 
                        color="var(--foreground)" 
                        isInverse
                        onClick={() => router.push(`/project/${projectId}/analytics`)}
                    />
                    <AnalyticsCard 
                        title="Unique Visits" 
                        value={formatNumber(analytics?.visits || 0)} 
                        percentage="+8500.00%" 
                        points={[5, 8, 6, 10, 9, 15, 12, 18, 16, 22, 20, 25, 23, 30]} 
                        color="var(--foreground)" 
                        onClick={() => router.push(`/project/${projectId}/analytics`)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3 px-1">
                    <h2 className="text-muted-foreground/20 font-bold text-base tracking-tight">Store Analytics</h2>
                    <span className="text-muted-foreground/10 text-[10px] font-bold uppercase tracking-[0.2em]">Last 24 hours</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 opacity-30 grayscale cursor-pointer group hover:opacity-100 transition-opacity" onClick={() => router.push(`/project/${projectId}/store`)}>
                    <AnalyticsCard title="Store Requests" value="0" percentage="0.00%" points={[0, 0, 0, 0]} color="var(--border)" />
                    <AnalyticsCard title="Sales" value="0%" percentage="0.00%" points={[0, 0, 0, 0]} color="var(--border)" />
                    <AnalyticsCard title="Revenue" value="$0.00" percentage="0.00%" points={[0, 0, 0, 0]} color="var(--border)" />
                </div>
            </div>
        </div>
    );
}
