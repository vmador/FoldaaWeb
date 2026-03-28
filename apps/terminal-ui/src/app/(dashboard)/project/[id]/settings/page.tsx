"use client"
import React, { useState, useEffect } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Trash2, AlertTriangle, Shield, Smartphone, Globe, Code, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { TerminalModal } from '@/components/ui/TerminalModal';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Toggle } from '@/components/ui/Toggle';

import { TabHeader } from '@/components/ui/TabHeader';

const SwitchRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center gap-3 py-1.5 group">
        <Toggle 
            checked={checked} 
            onChange={onChange}
        />
        <span className="text-foreground text-xs font-medium group-hover:text-foreground transition-colors">{label}</span>
    </div>
);

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);
    
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const router = useRouter();
    const { showToast } = useToast();

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                app_description: project.app_description || '',
                allow_fullscreen: project.allow_fullscreen,
                allow_geolocation: project.allow_geolocation,
                allow_camera: project.allow_camera,
                allow_microphone: project.allow_microphone,
                allow_storage_access: project.allow_storage_access,
                viewport_mode: project.viewport_mode || 'dvh',
                ignore_safe_area: project.ignore_safe_area,
                orientation: project.orientation || 'any',
                theme_color: project.theme_color || '#000000',
                background_color: project.background_color || '#000000',
            });
        }
    }, [project]);

    if (projectsLoading) return <div className="text-muted-foreground font-mono text-sm">Loading settings...</div>;
    if (!project || !formData) return null;

    const handleSave = async () => {
        setSaving(true);
        
        // Ensure subdomain and worker_url stay in sync with name
        const newSubdomain = formData.name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const newWorkerUrl = `https://${newSubdomain}.foldaa.com`;
        
        const { error } = await supabase
            .from('projects')
            .update({
                ...formData,
                subdomain: newSubdomain,
                worker_url: newWorkerUrl
            })
            .eq('id', projectId);
        
        if (error) {
            console.error('Error saving settings:', error);
            showToast(`Error saving settings: ${error.message}`, 'error');
        } else {
            showToast('Settings saved successfully', 'success');
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

    const toggleBool = (key: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const SwitchRow = ({ label, checked, onChange }: any) => (
        <div className="flex items-center gap-3 py-1.5 group">
            <Toggle 
                checked={checked} 
                onChange={onChange}
            />
            <span className="text-foreground text-xs font-medium group-hover:text-foreground transition-colors">{label}</span>
        </div>
    );

    const PillGroup = ({ options, value, onChange }: any) => (
        <div className="flex items-center gap-2">
            {options.map((opt: any) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={clsx(
                        "px-3 py-1 text-[10px] font-mono uppercase rounded-full border transition-all",
                        value === opt.value 
                            ? "bg-transparent border-[#D8D8D8] text-foreground" 
                            : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-[#666]"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    const ConfigColorRow = ({ label, value, onChange }: any) => (
        <div className="flex items-center gap-3 py-1.5">
            <div 
                className="w-4 h-4 rounded-full border border-border cursor-pointer overflow-hidden relative shadow-inner"
                style={{ backgroundColor: value }}
            >
                <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
            <span className="text-foreground text-xs font-medium">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 text-sm pb-12 animate-in fade-in duration-500">
            <TabHeader 
                title="Project Settings"
                description="Configure build parameters and capabilities for your PWA."
                action={{
                    label: "Save Changes",
                    onClick: handleSave,
                    icon: Save,
                    loading: saving,
                    shortcut: "⌘+S"
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-24">
                
                {/* Left Column: Form Configuration */}
                <div className="flex flex-col gap-8 max-w-md">
                    
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-muted-foreground text-[10px] tracking-widest uppercase">PROJECT NAME</label>
                            <input 
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="bg-card border border-border focus:border-foreground/20 rounded px-3 py-2 text-foreground outline-none text-xs transition-colors shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-muted-foreground text-[10px] tracking-widest uppercase">SUBDOMAIN</label>
                            <input 
                                value={project.subdomain || ''}
                                readOnly
                                className="bg-secondary border border-border/50 rounded px-3 py-2 text-muted-foreground outline-none text-xs cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">PWA Capabilities</label>
                        <SwitchRow label="Allow Fullscreen" checked={formData.allow_fullscreen} onChange={() => toggleBool('allow_fullscreen')} />
                        <SwitchRow label="Allow Camera" checked={formData.allow_camera} onChange={() => toggleBool('allow_camera')} />
                        <SwitchRow label="Allow Microphone" checked={formData.allow_microphone} onChange={() => toggleBool('allow_microphone')} />
                        <SwitchRow label="Allow Geolocation" checked={formData.allow_geolocation} onChange={() => toggleBool('allow_geolocation')} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">Viewport Mode</label>
                        <PillGroup 
                            value={formData.viewport_mode} 
                            onChange={(val: string) => setFormData({...formData, viewport_mode: val})}
                            options={[
                                { value: 'dvh', label: 'DVH' },
                                { value: 'svh', label: 'SVH' },
                                { value: 'lvh', label: 'LVH' }
                            ]} 
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">PWA Experience</label>
                        <SwitchRow label="Ignore Safe Area" checked={formData.ignore_safe_area} onChange={() => toggleBool('ignore_safe_area')} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1">Display</label>
                        <ConfigColorRow label="Theme Color" value={formData.theme_color} onChange={(val: string) => setFormData({...formData, theme_color: val})} />
                        <ConfigColorRow label="Background Color" value={formData.background_color} onChange={(val: string) => setFormData({...formData, background_color: val})} />
                    </div>

                </div>

                {/* Right Column: Image preview with Framer Motion animations */}
                <div className="flex items-start justify-center relative pt-4">
                    <div className="relative w-[300px] aspect-[900.34/1951.88] overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={formData.ignore_safe_area ? 'on' : 'off'}
                                src={formData.ignore_safe_area ? '/images/safe-zone-on.png' : '/images/safe-zone-off.png'}
                                alt="Safe Zone Preview Simulator"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="w-full h-full object-cover absolute inset-0"
                            />
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <section className="mt-8 pt-8 border-t border-red-500/10 flex flex-col gap-4">
                <div className="text-xs font-bold text-red-500/40 tracking-widest uppercase flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Danger Zone
                </div>
                <div className="flex items-center justify-between p-4 bg-red-500/[0.03] border border-red-500/10 rounded-xl">
                    <div className="flex flex-col">
                        <span className="text-foreground font-bold">Delete Project</span>
                        <span className="text-muted-foreground text-xs">Permanently remove this project and all associated data.</span>
                    </div>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-all font-bold text-xs"
                    >
                        DELETE_PROJECT
                    </button>
                </div>
            </section>

            {/* Delete Confirmation Modal */}
            <TerminalModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="CRITICAL_CONFIRMATION"
                footer={
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ABORT
                        </button>
                        <button 
                            onClick={async () => {
                                if (deleteConfirmText !== 'DELETE') return;
                                setIsDeleting(true);
                                try {
                                    const { error } = await supabase
                                        .from('projects')
                                        .delete()
                                        .eq('id', projectId);
                                    
                                    if (error) throw error;
                                    router.push('/dashboard');
                                } catch (err: any) {
                                    console.error("Delete error details:", {
                                        message: err?.message || "Unknown error",
                                        code: err?.code,
                                        details: err?.details,
                                        hint: err?.hint
                                    });
                                    alert(`Failed to delete project: ${err?.message || "Internal Error"}`);
                                } finally {
                                    setIsDeleting(false);
                                }
                            }}
                            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-xs font-bold transition-colors disabled:opacity-30 flex items-center gap-2"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            CONFIRM_DELETION
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-red-400 font-bold text-xs">WARNING: IRREVERSIBLE ACTION</span>
                            <span className="text-muted-foreground text-xs">This will immediately terminate all workers and wipe project metadata.</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-foreground text-xs">Type <span className="text-foreground font-mono font-bold">DELETE</span> to confirm:</label>
                        <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded focus-within:border-red-500/30 transition-colors">
                            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                            <input 
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="bg-transparent text-red-400 outline-none w-full font-mono text-sm"
                                placeholder="..."
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            </TerminalModal>
        </div>
    );
}
