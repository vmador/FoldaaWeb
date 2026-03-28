"use client";

import React, { useState, useEffect } from "react";
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Play, Settings2, LayoutGrid, Terminal } from "lucide-react";
import clsx from "clsx";
import { TerminalModal } from "@/components/ui/TerminalModal";
import { getIntegrationComponent, ConfigForm } from "./components";
import AddIntegrationDrawer from "./components/AddIntegrationDrawer";
import { TabHeader } from '@/components/ui/TabHeader';

const IntegrationRow = ({ 
    type, 
    integration, 
    onInstall, 
    onConfigure, 
    isInstalled 
}: { 
    type: any; 
    integration?: any; 
    onInstall?: (id: string) => void; 
    onConfigure?: (int: any) => void; 
    isInstalled: boolean;
}) => {
    const isEnabled = integration?.is_enabled;
    const isOneSignal = type.name === 'onesignal';
    
    return (
        <div 
            onClick={() => {
                if (!isOneSignal) return;
                isInstalled ? onConfigure?.(integration) : onInstall?.(type.id);
            }}
            className={clsx(
                "group flex items-center justify-between py-3 px-1 transition-all border-b border-transparent rounded-sm",
                isOneSignal ? "hover:bg-background cursor-pointer hover:border-border" : "opacity-40 grayscale-[0.5] cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-4">
                 <div className={clsx(
                    "w-1 h-1 rounded-full",
                    isInstalled && isEnabled ? "bg-brand-500 shadow-[0_0_8px_hsl(var(--brand-500)/0.4)]" : "bg-muted"
                )} />
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                         <span className={clsx(
                            "font-bold font-sans tracking-tight",
                            isInstalled && isEnabled ? "text-brand-500" : (isOneSignal ? "text-foreground" : "text-muted-foreground")
                        )}>
                            {type.display_name}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal italic">
                            {type.description}
                        </span>
                         {isInstalled && (
                            <span className={clsx(
                                "px-1.5 py-0.5 text-xs font-bold rounded border uppercase tracking-widest",
                                isEnabled 
                                    ? "bg-brand-500/10 text-brand-500 border-brand-500/20" 
                                    : "bg-muted text-muted-foreground border-transparent"
                            )}>
                                {isEnabled ? "Active" : "Disabled"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <button 
                disabled={!isOneSignal}
                className={clsx(
                    "text-xs font-bold uppercase tracking-widest transition-colors",
                    isInstalled ? "text-brand-500 hover:text-foreground" : (isOneSignal ? "text-foreground" : "text-muted-foreground")
                )}
            >
                {isInstalled ? "Edit setup" : "Install"}
            </button>
        </div>
    );
};

export default function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);
    
    const [integrationTypes, setIntegrationTypes] = useState<any[]>([]);
    const [projectIntegrations, setProjectIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Modal & Drawer State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'install' | 'configure'>('install');
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [configValues, setConfigValues] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;
            setLoading(true);
            try {
                // Fetch available types
                const { data: types } = await supabase
                    .from('integration_types')
                    .select('*');
                
                // Fetch current project integrations
                const { data: current } = await supabase
                    .from('project_integrations')
                    .select(`
                        id,
                        project_id,
                        integration_type_id,
                        config,
                        is_enabled,
                        created_at,
                        integration_types (
                            id,
                            name,
                            display_name,
                            description,
                            config_schema
                        )
                    `)
                    .eq('project_id', projectId);

                if (types) setIntegrationTypes(types);
                if (current) setProjectIntegrations(current);
            } catch (err) {
                console.error("Error fetching integrations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleToggleIntegration = async (integrationId: string, currentStatus: boolean) => {
        setActionLoading(integrationId);
        try {
            const { error } = await supabase
                .from('project_integrations')
                .update({ is_enabled: !currentStatus })
                .eq('id', integrationId);
            
            if (error) throw error;
                
            setProjectIntegrations(prev => prev.map(p => 
                p.id === integrationId ? { ...p, is_enabled: !currentStatus } : p
            ));
        } catch (err) {
            console.error("Toggle error", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteIntegration = async (integrationId: string) => {
        if (!confirm("Are you sure you want to remove this integration?")) return;
        setActionLoading(integrationId);
        try {
            const { error } = await supabase
                .from('project_integrations')
                .delete()
                .eq('id', integrationId);
            
            if (error) throw error;
                
            setProjectIntegrations(prev => prev.filter(p => p.id !== integrationId));
        } catch (err) {
            console.error("Delete error", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRedeploy = async () => {
        if (!project) return;
        setActionLoading('redeploy');
        try {
            // Derive subdomain directly from name to ensure they stay in sync
            // and bypass the problematic 'app' fallback in the cloud.
            const subdomain = (project.name || 'unregistered').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

            // Explicitly pass project data to preserve subdomain
            await supabase.functions.invoke('deploy-project', {
                body: { 
                    project_id: projectId, 
                    action: 'deploy',
                    project_data: {
                        name: project.name,
                        subdomain: subdomain
                    }
                }
            });
            alert('Redeployment triggered successfully to apply integration changes.');
        } catch (err) {
            console.error("Redeploy error", err);
            alert('Failed to trigger redeployment.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenInstall = (typeId: string) => {
        const type = integrationTypes.find(t => t.id === typeId);
        if (!type) return;
        setSelectedType(type);
        setModalMode('install');
        setConfigValues(type.default_config || {});
        setIsAddDrawerOpen(false);
        setIsConfigModalOpen(true);
    };

    const handleOpenConfigure = (integration: any) => {
        setSelectedIntegration(integration);
        setModalMode('configure');
        setConfigValues(integration.config || {});
        setIsConfigModalOpen(true);
    };

    const handleFieldChange = (field: string, value: any) => {
        setConfigValues(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveConfig = async () => {
        setActionLoading('saving-config');
        try {
            if (modalMode === 'install') {
                const { data, error } = await supabase
                    .from('project_integrations')
                    .insert({
                        project_id: projectId,
                        integration_type_id: selectedType.id,
                        name: selectedType.display_name || selectedType.name,
                        config: configValues,
                        is_enabled: true
                    })
                    .select('*, integration_types(*)');
                
                if (error) throw error;
                if (data) setProjectIntegrations(prev => [...prev, data[0]]);
            } else {
                const { error } = await supabase
                    .from('project_integrations')
                    .update({ config: configValues })
                    .eq('id', selectedIntegration.id);
                
                if (error) throw error;
                setProjectIntegrations(prev => prev.map(p => 
                    p.id === selectedIntegration.id ? { ...p, config: configValues } : p
                ));
            }
            setIsConfigModalOpen(false);
        } catch (err) {
            console.error("Save config error", err);
            alert("Failed to save configuration.");
        } finally {
            setActionLoading(null);
        }
    };

    if (projectsLoading) return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading registry...</span>
        </div>
    );

    if (!project) return null;

    // Filter available types that are not yet added
    const availableTypes = integrationTypes.filter(type => 
        !projectIntegrations.some(pi => pi.integration_type_id === type.id)
    );

    return (
        <div className="flex flex-col gap-6 text-sm pb-12 animate-in fade-in duration-500">
            <TabHeader 
                title="Integrations"
                description="Connect your project with third-party tools and services."
                action={{
                    label: "Install Plugin",
                    onClick: () => setIsAddDrawerOpen(true),
                    icon: Plus,
                    shortcut: "⌘+I"
                }}
                secondaryAction={projectIntegrations.length > 0 ? {
                    label: "Redeploy",
                    onClick: handleRedeploy,
                    icon: Play,
                    loading: actionLoading === 'redeploy'
                } : undefined}
            />

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing registry...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {/* List of all integrations (Installed first, then available) */}
                    {integrationTypes.map((type) => {
                        const installed = projectIntegrations.find(pi => pi.integration_type_id === type.id);
                        return (
                            <IntegrationRow 
                                key={type.id}
                                type={type}
                                integration={installed}
                                isInstalled={!!installed}
                                onInstall={handleOpenInstall}
                                onConfigure={handleOpenConfigure}
                            />
                        );
                    })}
                </div>
            )}
            {/* Add Integration Drawer */}
            <AddIntegrationDrawer 
                isOpen={isAddDrawerOpen}
                onClose={() => setIsAddDrawerOpen(false)}
                availableTypes={availableTypes}
                onInstall={handleOpenInstall}
                isInstalling={actionLoading === 'install'}
            />

            {/* Config Modal */}
            <TerminalModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title={modalMode === 'install' ? `INSTALL_${selectedType?.name?.toUpperCase()}` : `CONFIGURE_${selectedIntegration?.integration_types?.name?.toUpperCase()}`}
                footer={
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsConfigModalOpen(false)}
                            className="px-4 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-md transition-colors"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={handleSaveConfig}
                            disabled={actionLoading === 'saving-config'}
                            className="px-4 py-1.5 bg-[#244544] hover:bg-[#2C5251] border border-[#2C5251] text-[#A6D1D1] text-xs font-bold rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading === 'saving-config' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            SAVE_CHANGES
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <ConfigForm 
                        schema={modalMode === 'install' ? selectedType?.config_schema : selectedIntegration?.integration_types?.config_schema}
                        values={configValues}
                        onChange={handleFieldChange}
                    />
                    <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded flex gap-3">
                        <Settings2 className="w-4 h-4 text-brand-500/50 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                            Changes will take effect after a project <span className="text-foreground italic font-mono">redeploy</span>.
                        </span>
                    </div>
                </div>
            </TerminalModal>
        </div>
    );
}
