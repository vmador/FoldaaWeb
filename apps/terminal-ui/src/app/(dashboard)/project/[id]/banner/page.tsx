"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Smartphone, Palette, Type, Clock, CheckCircle2, Apple, Monitor, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
    const pickerRef = React.useRef<HTMLInputElement>(null);
    
    return (
        <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[#666] text-xs uppercase font-bold tracking-widest">{label}</label>
            <div className="flex items-center gap-2 bg-[#1C1C1E] border border-[#2A2A2E] rounded px-2 py-1.5 focus-within:border-white/20 transition-colors">
                <div 
                    onClick={() => pickerRef.current?.click()}
                    className="w-4 h-4 rounded-sm border border-white/10 cursor-pointer hover:scale-110 transition-transform" 
                    style={{ backgroundColor: value }}
                />
                <input 
                    type="color"
                    ref={pickerRef}
                    value={value || '#000000'}
                    onChange={e => onChange(e.target.value)}
                    className="absolute opacity-0 pointer-events-none"
                    aria-hidden="true"
                />
                <input 
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="bg-transparent text-xs text-[#D8D8D8] outline-none font-mono uppercase w-full"
                />
            </div>
        </div>
    );
};

const Toggle = ({ label, enabled, onToggle, description }: { label: string; enabled: boolean; onToggle: () => void; description?: string }) => (
    <div 
        onClick={onToggle}
        className={clsx(
            "p-3 rounded border transition-all cursor-pointer flex items-center justify-between group",
            enabled ? "bg-white/[0.03] border-white/10" : "bg-black border-[#222] hover:border-[#333]"
        )}
    >
        <div className="flex flex-col">
            <span className={clsx("text-[10px] font-bold uppercase tracking-widest transition-colors", enabled ? "text-white/80" : "text-[#444] group-hover:text-[#666]")}>
                {label}
            </span>
            {description && <span className="text-[#555] text-xs leading-tight">{description}</span>}
        </div>
        <div className={clsx(
            "w-7 h-3.5 rounded-full relative transition-colors shrink-0",
            enabled ? "bg-white/20" : "bg-[#111] border border-[#222]"
        )}>
            <div className={clsx(
                "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                enabled ? "left-4" : "left-0.5"
            )} />
        </div>
    </div>
);

import { TabHeader } from '@/components/ui/TabHeader';

export default function BannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const { showToast } = useToast();
    const router = useRouter();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);

    const [saving, setSaving] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        if (project) {
            setShowBanner(project.show_install_banner);
            setConfig(project.banner_config || {
                enabled: true,
                style: 'bottom-bar',
                showDelay: 2000,
                ios: {
                    title: 'Install App',
                    message: 'Add to home screen to use full features',
                    enabled: true,
                    showIcon: true,
                    backgroundColor: '#111',
                    textColor: '#FFFFFF',
                    position: 'bottom'
                },
                android: {
                    title: 'Install App',
                    message: 'Get the app for a better experience',
                    enabled: true,
                    showIcon: true,
                    buttonText: 'Install',
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    buttonColor: '#111',
                    buttonTextColor: '#FFFFFF'
                }
            });
        }
    }, [project]);

    if (projectsLoading) return <div className="text-[#666] font-mono text-sm">Loading banner config...</div>;
    if (!project || !config) return null;

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('projects')
            .update({
                show_install_banner: showBanner,
                banner_config: {
                    ...config,
                    deployment_pending: true
                }
            })
            .eq('id', projectId);
        
        if (error) {
            console.error('Error saving banner:', error);
            showToast('Error saving banner configuration', 'error');
        } else {
            showToast('Banner configuration saved successfully');
            showToast('Changes pending. Redeploy required to apply to live site.', 'info', {
                id: 'deploy-pending',
                persistent: true,
                action: {
                    label: 'Redeploy now',
                    onClick: () => router.push(`/project/${projectId}/overview`)
                }
            });
        }
        setSaving(false);
    };

    const updateConfig = (path: string, value: any) => {
        setConfig((prev: any) => {
            const next = { ...prev };
            const parts = path.split('.');
            let current = next;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return next;
        });
    };

    return (
        <div className="flex flex-col gap-8 text-sm pb-12 animate-in fade-in duration-500">
            <TabHeader 
                title="Install Banner"
                description="Configure the PWA installation banner for iOS and Android devices."
                action={{
                    label: "Save Config",
                    onClick: handleSave,
                    icon: Save,
                    loading: saving,
                    shortcut: "⌘+S"
                }}
            />

            <div className="flex flex-col gap-4">
                {config.deployment_pending && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={14} className="text-yellow-500" />
                            <span className="text-yellow-500/90 text-xs font-mono uppercase tracking-wider">
                                Configuration updated. A redeploy is required to apply changes to the live site.
                            </span>
                        </div>
                        <button 
                            onClick={() => router.push(`/project/${projectId}/overview`)}
                            className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded transition-colors"
                        >
                            Go to Overview
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left side: Configuration */}
                <div className="flex flex-col gap-8">
                    {/* Global Toggle Section */}
                    <Toggle 
                        label="SMART_INSTALL_BANNER"
                        description="Enable automatic browser prompts for PWA installation"
                        enabled={showBanner}
                        onToggle={() => setShowBanner(!showBanner)}
                    />

                    {/* iOS Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[#555] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <Apple size={12} className="opacity-50" /> iOS Banner
                            </span>
                            <div 
                                onClick={() => updateConfig('ios.enabled', !config.ios.enabled)}
                                className={clsx(
                                    "w-7 h-3.5 rounded-full relative transition-colors cursor-pointer",
                                    config.ios.enabled ? "bg-white/20" : "bg-[#111] border border-[#222]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                                    config.ios.enabled ? "left-4" : "left-0.5"
                                )} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 p-5 bg-black border border-[#2A2A2E] rounded-md">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#666] text-xs uppercase font-bold tracking-widest">Banner Title</label>
                                <input 
                                    value={config.ios.title}
                                    onChange={e => updateConfig('ios.title', e.target.value)}
                                    className="bg-[#1C1C1E] border border-[#2A2A2E] rounded px-3 py-2 text-[#D8D8D8] text-xs outline-none focus:border-white/20 transition-colors font-sans"
                                    placeholder="App Name"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#666] text-xs uppercase font-bold tracking-widest">Message Text</label>
                                <textarea 
                                    value={config.ios.message}
                                    onChange={e => updateConfig('ios.message', e.target.value)}
                                    className="bg-[#1C1C1E] border border-[#2A2A2E] rounded px-3 py-2 text-[#D8D8D8] text-xs outline-none focus:border-white/20 transition-colors font-sans h-20 resize-none leading-relaxed"
                                    placeholder="Banner description..."
                                />
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-[#2A2A2E] pt-4 mt-2">
                                <span className="text-[#666] text-xs uppercase font-bold tracking-widest">Brand Icon</span>
                                <div 
                                    onClick={() => updateConfig('ios.showIcon', !config.ios.showIcon)}
                                    className={clsx(
                                        "w-7 h-3.5 rounded-full relative transition-colors cursor-pointer",
                                        config.ios.showIcon ? "bg-white/20" : "bg-[#111] border border-[#222]"
                                    )}
                                >
                                    <div className={clsx(
                                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                                        config.ios.showIcon ? "left-4" : "left-0.5"
                                    )} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <ColorPicker 
                                    label="Background Button"
                                    value={config.ios.backgroundColor || '#FFFFFF'}
                                    onChange={v => updateConfig('ios.backgroundColor', v)}
                                />
                                <ColorPicker 
                                    label="Button Text"
                                    value={config.ios.textColor || '#FFFFFF'}
                                    onChange={v => updateConfig('ios.textColor', v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Android Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[#555] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <Smartphone size={12} className="opacity-50" /> Android Banner
                            </span>
                            <div 
                                onClick={() => updateConfig('android.enabled', !config.android.enabled)}
                                className={clsx(
                                    "w-7 h-3.5 rounded-full relative transition-colors cursor-pointer",
                                    config.android.enabled ? "bg-white/20" : "bg-[#111] border border-[#222]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                                    config.android.enabled ? "left-4" : "left-0.5"
                                )} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 p-5 bg-black border border-[#2A2A2E] rounded-md">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[#666] text-xs uppercase font-bold tracking-widest">Banner Title</label>
                                <input 
                                    value={config.android.title}
                                    onChange={e => updateConfig('android.title', e.target.value)}
                                    className="bg-[#1C1C1E] border border-[#2A2A2E] rounded px-3 py-2 text-[#D8D8D8] text-xs outline-none focus:border-white/20 transition-colors font-sans"
                                    placeholder="App Name"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-[#2A2A2E] pt-4">
                                <span className="text-[#666] text-xs uppercase font-bold tracking-widest">Brand Icon</span>
                                <div 
                                    onClick={() => updateConfig('android.showIcon', !config.android.showIcon)}
                                    className={clsx(
                                        "w-7 h-3.5 rounded-full relative transition-colors cursor-pointer",
                                        config.android.showIcon ? "bg-white/20" : "bg-[#111] border border-[#222]"
                                    )}
                                >
                                    <div className={clsx(
                                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                                        config.android.showIcon ? "left-4" : "left-0.5"
                                    )} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <ColorPicker 
                                    label="Background Button"
                                    value={config.android.buttonColor || '#FFFFFF'}
                                    onChange={v => updateConfig('android.buttonColor', v)}
                                />
                                <ColorPicker 
                                    label="Button Text"
                                    value={config.android.buttonTextColor || '#FFFFFF'}
                                    onChange={v => updateConfig('android.buttonTextColor', v)}
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                 <CheckCircle2 className="w-3.5 h-3.5 text-white/20" />
                                 <span className="text-[#444] text-xs font-mono italic leading-tight">
                                    Android uses native A2HS prompts when possible.
                                 </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Live Preview */}
                <div className="relative min-h-[600px] lg:h-full flex flex-col">
                    {/* Soft Grid Background */}
                    <div className="absolute inset-0 bg-[#020202] rounded-xl border border-[#2A2A2E] overflow-hidden">
                        <div 
                            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                            style={{ 
                                backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                                backgroundSize: '40px 40px'
                            }} 
                        />
                    </div>

                    <div className="relative z-10 h-full flex flex-col items-center justify-center gap-12 p-8">
                        {/* iOS Preview */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-[#555] text-xs uppercase font-bold tracking-widest">
                                <Apple size={12} /> iOS Configuration
                            </div>
                            <div className={clsx(
                                "flex items-center justify-between bg-[#080808] p-3 rounded-xl border border-white/[0.05] shadow-2xl transition-opacity duration-300 w-full min-w-[400px] max-w-[428px]",
                                !config.ios.enabled && "opacity-20"
                            )}>
                                <div className="flex items-center gap-3">
                                    {config.ios.showIcon && (
                                        <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center border border-white/5 overflow-hidden">
                                            {project.icon_192_url ? (
                                                <img src={project.icon_192_url} alt="App Icon" className="w-full h-full object-cover" />
                                            ) : (
                                                <Monitor size={20} className="text-[#444]" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-xs">{config.ios.title || 'App Name'}</span>
                                        <span className="text-[#888] text-xs max-w-[180px] line-clamp-1">{config.ios.message || 'Description...'}</span>
                                    </div>
                                </div>
                                <button 
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"
                                    style={{ 
                                        backgroundColor: config.ios.backgroundColor || '#111',
                                        color: config.ios.textColor || '#FFFFFF'
                                    }}
                                >
                                    Install
                                </button>
                            </div>
                        </div>

                        {/* Android Preview */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-[#555] text-xs uppercase font-bold tracking-widest">
                                <Smartphone size={12} /> Android Configuration
                            </div>
                            <div className={clsx(
                                "flex items-center justify-between bg-[#080808] p-3 rounded-xl border border-white/[0.05] shadow-2xl transition-opacity duration-300 w-full min-w-[400px] max-w-[428px]",
                                !config.android.enabled && "opacity-20"
                            )}>
                                <div className="flex items-center gap-3">
                                    {config.android.showIcon && (
                                        <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center border border-white/5 overflow-hidden">
                                            {project.icon_192_url ? (
                                                <img src={project.icon_192_url} alt="App Icon" className="w-full h-full object-cover" />
                                            ) : (
                                                <Monitor size={20} className="text-[#444]" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-xs">{config.android.title || 'App Name'}</span>
                                    </div>
                                </div>
                                <button 
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"
                                    style={{ 
                                        backgroundColor: config.android.buttonColor || '#111',
                                        color: config.android.buttonTextColor || '#FFFFFF'
                                    }}
                                >
                                    Install
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
