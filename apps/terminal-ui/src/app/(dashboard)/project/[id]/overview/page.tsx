"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, Check, Globe, Activity, ExternalLink, ChevronRight, Monitor, Download, AlertCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';

import { TabHeader } from '@/components/ui/TabHeader';
import AsciiVortexAnimation from './AsciiVortexAnimation';

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
    const lastStatus = useRef<string | undefined>(undefined);

    // Play success sound when build becomes ready
    useEffect(() => {
        if (macBuild?.status === 'ready' && lastStatus.current !== 'ready') {
            const audio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio play failed:", e));
        }
        lastStatus.current = macBuild?.status;
    }, [macBuild?.status]);
    
    // Reset explosion state when a new build starts
    useEffect(() => {
        if (macBuild?.status === 'pending' || macBuild?.status === 'building') {
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
            setLoadingMacBuild(true);
            const { data } = await supabase
                .from('mac_builds')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (data) setMacBuild(data);
            setLoadingMacBuild(false);
        };
        fetchBuild();

        const subscription = supabase
            .channel('mac_builds_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mac_builds', filter: `project_id=eq.${projectId}` }, (payload) => {
                setMacBuild(payload.new);
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
                    build_mode: selectedBuildMode
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

            if (error) throw error;
            showToast('Project name and URL updated');
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating project name:', error);
            showToast('Failed to update project name', 'error');
        } finally {
            setIsSavingName(false);
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
                
                {(macBuild?.status === 'pending' || macBuild?.status === 'building' || (macBuild?.status === 'ready' && !hasExploded)) ? (
                    <AsciiVortexAnimation 
                        status={macBuild?.status} 
                        onExploded={() => setHasExploded(true)} 
                    />
                ) : (
                    <div className="flex items-center justify-between p-4 bg-[#080808] border border-[#111] rounded-[10px] group hover:border-[#1c1c1e] transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[50px] pointer-events-none" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-9 h-9 rounded-[8px] bg-[#111] border border-[#222] flex items-center justify-center">
                                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 256 315" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                                    <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.147 63.615-.335.992-6.505 22.48-21.76 44.758-13.242 19.163-27.022 38.25-48.47 38.641-21.1-.383-27.8-13.273-51.89-13.273-24.13 0-31.54 13.022-51.887 13.916-20.58.744-36.8-20.442-50.14-39.69C11.516 268.044-8.796 220.61.94 172.138c5.448-43.102 49.39-71.198 90.916-71.742 21.113-.538 41.007 14.12 53.857 14.12 12.8 0 37.108-17.705 62.613-15.11 10.667.444 40.697 4.306 59.944 32.533-1.556.973-35.84 20.893-34.467 60.1zm-42.592-127.2c11.454-13.843 19.143-33.091 17.01-52.33-16.488.665-36.522 10.999-48.332 24.814-10.59 12.146-19.863 31.815-17.37 50.707 18.423 1.44 37.23-9.355 48.692-23.19z" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[#CCC] font-bold tracking-tight text-sm">macOS Application</span>
                                <span className="text-[#555] text-[11px] font-medium tracking-wide">
                                    Native desktop wrapper (DMG) automatically synced with your live web app.
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            {loadingMacBuild ? (
                                <div className="flex items-center gap-2 text-[#444]">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                </div>
                            ) : macBuild?.status === 'ready' ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[#333] text-[10px] font-mono">
                                            Built {formatDistanceToNow(new Date(macBuild.updated_at), { addSuffix: true })}
                                        </span>
                                        <span className={clsx(
                                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                                            macBuild.build_mode === 'pro' 
                                                ? "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5" 
                                                : "text-[#444] border-[#1A1A1A] bg-[#0A0A0A]"
                                        )}>
                                            {macBuild.build_mode || 'fast'} Build
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleBuildMacApp}
                                        disabled={actionLoading === 'build-mac'}
                                        className="px-3 py-1.5 rounded-[8px] border border-[#1A1A1A] text-[#666] text-[11px] font-bold hover:bg-[#111] hover:text-[#AAA] transition-colors disabled:opacity-50"
                                    >
                                        Rebuild
                                    </button>
                                    <a 
                                        href={macBuild.dmg_url}
                                        download
                                        className="px-4 py-1.5 rounded-[8px] bg-white text-black text-[11px] font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download .dmg
                                    </a>
                                </div>
                            ) : macBuild?.status === 'error' ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 text-red-500">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">Build Failed</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-red-500/10 text-red-500/50 bg-red-500/5">
                                            {macBuild.build_mode || 'fast'} Build
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleBuildMacApp}
                                        disabled={actionLoading === 'build-mac'}
                                        className="px-4 py-1.5 rounded-[8px] bg-[#111] border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === 'build-mac' ? 'Starting...' : 'Retry Build'}
                                    </button>
                                </div>
                            ) : (
                        {/* Build Mode Selector */}
                        <div className="flex gap-2 mr-4">
                            <button 
                                onClick={() => setSelectedBuildMode('fast')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-all flex flex-col items-start gap-0.5 border text-left",
                                    selectedBuildMode === 'fast' 
                                        ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 font-black shadow-[0_0_15px_rgba(217,70,239,0.05)]" 
                                        : "bg-[#0A0A0A] border-[#1A1A1A] text-[#444] hover:border-[#333] hover:text-[#777]"
                                )}
                            >
                                <span className="uppercase tracking-widest text-[8px] opacity-70">Fast Build</span>
                                <span>Basic Wrapper</span>
                            </button>
                            <button 
                                onClick={() => setSelectedBuildMode('pro')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-all flex flex-col items-start gap-0.5 border text-left relative overflow-hidden",
                                    selectedBuildMode === 'pro' 
                                        ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300 font-black ring-1 ring-fuchsia-500/10" 
                                        : "bg-[#0A0A0A] border-[#1A1A1A] text-[#444] hover:border-[#333] hover:text-[#777]"
                                )}
                            >
                                {selectedBuildMode === 'pro' && (
                                    <div className="absolute top-0 right-0 px-1.5 bg-fuchsia-500 text-black text-[7px] font-black uppercase tracking-tighter shadow-sm z-20">Pro</div>
                                )}
                                <span className="uppercase tracking-widest text-[8px] opacity-70">Pro Build</span>
                                <span>Native Feel</span>
                            </button>
                        </div>

                        <button 
                            onClick={handleBuildMacApp}
                            disabled={actionLoading === 'build-mac'}
                            className="px-4 py-1.5 rounded-[8px] bg-white text-black text-[11px] font-black hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                        >
                            {actionLoading === 'build-mac' ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting...</>
                            ) : (
                                <><Monitor className="w-3.5 h-3.5" /> Build Mac App</>
                            )}
                        </button>
                            )}
                        </div>
                    </div>
                )}
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
    
    // Smooth the points or add Jitter for a "serious" data look
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
