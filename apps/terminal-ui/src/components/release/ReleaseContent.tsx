"use client"
import React, { useState, useEffect } from "react"
import {
    Loader2,
    ChevronDown,
    ChevronUp,
    Settings,
    Edit2,
    X,
    ExternalLink,
    Smartphone,
    AlertCircle,
    Check
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

// Sub-components
import { AppleIcon } from "./AppleIcon"
import CertificateUploader from "./CertificateUploader"
import AppStoreMetadataForm from "./AppStoreMetadataForm"

import AppleConnect from "./AppleConnect"

const BuildHistory = ({ projectId }: { projectId: string }) => {
    const [builds, setBuilds] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadBuilds()
        
        const channel = supabase
            .channel(`ios_builds_${projectId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ios_builds', filter: `project_id=eq.${projectId}` },
                () => loadBuilds()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [projectId])

    const loadBuilds = async () => {
        const { data } = await supabase
            .from("ios_builds")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(10)
        setBuilds(data || [])
        setIsLoading(false)
    }

    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto py-10" />

    if (builds.length === 0) return (
        <div className="py-10 text-center border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground/40 font-mono tracking-tight uppercase">No build history found</p>
        </div>
    )

    return (
        <div className="space-y-3">
            {builds.map(build => (
                <div key={build.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-2 h-2 rounded-full",
                            build.status === 'completed' ? "bg-green-500" :
                            build.status === 'failed' ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                        )} />
                        <div>
                            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                                {build.version} ({build.build_number})
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                                {new Date(build.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{build.status}</span>
                        {build.ipa_url && (
                            <a href={build.ipa_url} target="_blank" className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        ) || build.error_message && (
                            <div className="group relative">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-card text-[10px] text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-red-500/20 shadow-xl">
                                    {build.error_message}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

const BuildConfigurator = ({ projectId, onBuildStarted }: { projectId: string; onBuildStarted: () => void }) => {
    const [certificates, setCertificates] = useState<any[]>([])
    const [selectedCert, setSelectedCert] = useState("")
    const [version, setVersion] = useState("1.0.0")
    const [buildNumber, setBuildNumber] = useState("1")
    const [isLoading, setIsLoading] = useState(true)
    const [isBuilding, setIsBuilding] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        loadCertificates()
    }, [projectId])

    const loadCertificates = async () => {
        const { data } = await supabase
            .from("ios_certificates")
            .select("*")
            .eq("project_id", projectId)
            .eq("is_valid", true)
        setCertificates(data || [])
        if (data && data.length > 0) setSelectedCert(data[0].id)
        setIsLoading(false)
    }

    const handleStartBuild = async () => {
        if (!selectedCert) {
            setError("Please select a certificate")
            return
        }
        setIsBuilding(true)
        setError("")
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/build-ios`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        version,
                        build_number: buildNumber,
                        certificate_id: selectedCert,
                    }),
                }
            )
            const result = await response.json()
            if (!result.success) throw new Error(result.error)
            onBuildStarted()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsBuilding(false)
        }
    }

    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto py-10" />

    return (
        <div className="space-y-6 text-left">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Signing Certificate</label>
                    <select
                        value={selectedCert}
                        onChange={(e) => setSelectedCert(e.target.value)}
                        className="w-full h-10 bg-transparent border border-border rounded-xl px-3 text-xs text-foreground outline-none focus:border-foreground/20"
                    >
                        {certificates.length === 0 && <option value="">No valid certificates found</option>}
                        {certificates.map(cert => (
                            <option key={cert.id} value={cert.id} className="bg-background">
                                {cert.cert_name} ({cert.profile_bundle_id})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Version</label>
                        <input
                            type="text"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="1.0.0"
                            className="w-full h-10 bg-transparent border border-border rounded-xl px-3 text-xs text-foreground outline-none focus:border-foreground/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Build Number</label>
                        <input
                            type="text"
                            value={buildNumber}
                            onChange={(e) => setBuildNumber(e.target.value)}
                            placeholder="1"
                            className="w-full h-10 bg-transparent border border-border rounded-xl px-3 text-xs text-foreground outline-none focus:border-foreground/20"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleStartBuild}
                disabled={isBuilding || certificates.length === 0}
                className={clsx(
                    "w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
                    isBuilding || certificates.length === 0 ? "bg-secondary text-muted-foreground/40" : "bg-foreground text-background hover:bg-foreground/90"
                )}
            >
                {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                {isBuilding ? "Requesting Build..." : "Start iOS Build"}
            </button>
        </div>
    )
}

interface ReleaseContentProps {
    project: any
    projectId: string
}

interface AppStoreStatus {
    hasAppleAccount: boolean
    hasCertificates: boolean
    hasMetadata: boolean
    isReady: boolean
}

export default function ReleaseContent({ project, projectId }: ReleaseContentProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [showSetup, setShowSetup] = useState(false)
    const [appStoreStatus, setAppStoreStatus] = useState<AppStoreStatus>({
        hasAppleAccount: false,
        hasCertificates: false,
        hasMetadata: false,
        isReady: false,
    })
    const [showAppStoreDrawer, setShowAppStoreDrawer] = useState(false)
    const [appStoreEnabled, setAppStoreEnabled] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        loadStatus()
    }, [projectId])

    const loadStatus = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check Apple Account
            const { data: appleAccount } = await supabase
                .from("apple_accounts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()

            // Check Certificates
            const { data: certificates } = await supabase
                .from("ios_certificates")
                .select("*")
                .eq("project_id", projectId)

            // Check App Store Metadata
            const { data: metadata } = await supabase
                .from("app_store_metadata")
                .select("*")
                .eq("project_id", projectId)
                .maybeSingle()

            const status = {
                hasAppleAccount: !!appleAccount,
                hasCertificates: !!certificates && certificates.length > 0,
                hasMetadata: !!metadata,
                isReady: !!appleAccount && !!certificates && certificates.length > 0 && !!metadata,
            }

            setAppStoreStatus(status)
            if (!status.isReady) setShowSetup(true)
        } catch (error) {
            console.error("Error loading status:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleAppStore = async () => {
        if (!appStoreStatus.isReady) {
            alert("Please complete the setup first.")
            return
        }
        setIsUpdating(true)
        try {
            setAppStoreEnabled(!appStoreEnabled)
        } finally {
            setIsUpdating(false)
        }
    }

    const liveUrl = project.custom_domain
        ? `https://${project.custom_domain}`
        : project.worker_url || `https://${project.subdomain}.foldaa.com`

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-[800px] mx-auto py-10 space-y-12 pb-32">
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Post to Stores</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Convert your web project into a native app and release it to the iOS App Store and Google Play Store.
                </p>
            </div>

            <div className="relative aspect-[16/10] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden group">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)] animate-pulse" />
                    <div className="grid grid-cols-6 gap-4 p-8">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-2 bg-white/10 rounded-full" />
                        ))}
                    </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center p-3 shadow-xl">
                        {project.icon_512_url ? (
                            <img src={project.icon_512_url} className="w-full h-full object-contain" />
                        ) : (
                            <Smartphone className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-foreground mb-1">{project.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{project.subdomain}.foldaa.com</div>
                    </div>
                    <button 
                        onClick={() => window.open(liveUrl, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background border border-transparent rounded-xl text-xs font-bold hover:bg-foreground/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Preview
                    </button>
                </div>
            </div>

            {/* Setup & Configuration (Collapsible) */}
            <div className="bg-card border border-border rounded-xl overflow-hidden transition-all">
                <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground/40">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-foreground">Setup Requirements</div>
                            <div className="text-[11px] text-muted-foreground font-medium tracking-wide">
                                {appStoreStatus.isReady ? "CONFIGURATION COMPLETE" : "COMPLETE STEPS BELOW TO RELEASE"}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {appStoreStatus.isReady ? (
                            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold rounded-full">READY</div>
                        ) : (
                            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-full">INCOMPLETE</div>
                        )}
                        {showSetup ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
                    </div>
                </button>

                {showSetup && (
                    <div className="p-8 border-t border-border space-y-12">
                        {/* Step 1: Apple Developer Account */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasAppleAccount ? "bg-green-500 text-black" : "bg-secondary text-muted-foreground/40"
                                )}>
                                    {appStoreStatus.hasAppleAccount ? "✓" : "1"}
                                </span>
                                <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Apple Developer Account</h4>
                            </div>
                            <AppleConnect onConnected={loadStatus} />
                        </div>

                        {/* Step 2: iOS Certificates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasCertificates ? "bg-green-500 text-black" : "bg-secondary text-muted-foreground/40"
                                )}>
                                    {appStoreStatus.hasCertificates ? "✓" : "2"}
                                </span>
                                <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Distribution Certificates</h4>
                            </div>
                            <CertificateUploader projectId={projectId} onCertificateUploaded={loadStatus} />
                        </div>

                        {/* Step 3: App Store Metadata */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasMetadata ? "bg-green-500 text-black" : "bg-secondary text-muted-foreground/40"
                                )}>
                                    {appStoreStatus.hasMetadata ? "✓" : "3"}
                                </span>
                                <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Store Metadata</h4>
                            </div>
                            <AppStoreMetadataForm projectId={projectId} onSaved={loadStatus} />
                        </div>
                    </div>
                )}
            </div>

            {/* Platform Grid */}
            <div className="grid gap-4">
                {/* iOS App Store */}
                <div className={clsx(
                    "bg-card border border-border rounded-xl p-6 flex items-center gap-6",
                    !appStoreStatus.isReady && "opacity-60"
                )}>
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center border border-border">
                        <AppleIcon size={32} className="text-foreground" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground tracking-wide">iOS App Store</h3>
                        <p className="text-xs text-muted-foreground">
                            {!appStoreStatus.isReady ? "Complete requirements to build" : "Ready to generate build"}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAppStoreDrawer(true)}
                            disabled={!appStoreStatus.isReady}
                            className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">Publish</span>
                            <button
                                onClick={handleToggleAppStore}
                                disabled={isUpdating || !appStoreStatus.isReady}
                                className={clsx(
                                    "relative w-10 h-5.5 rounded-full transition-all duration-300",
                                    appStoreEnabled ? "bg-brand-500/20" : "bg-black/50"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-sm",
                                    appStoreEnabled ? "left-5.5 bg-black dark:bg-white" : "left-1 bg-black dark:bg-white"
                                )} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Android Play Store (Coming Soon) */}
                <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6 opacity-40">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center border border-border">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/40">
                            <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-muted-foreground/40 tracking-wide">Google Play Store</h3>
                        <p className="text-xs text-muted-foreground/40">Coming soon</p>
                    </div>
                </div>
            </div>

            {/* Build Config Drawer */}
            {showAppStoreDrawer && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end"
                    onClick={() => setShowAppStoreDrawer(false)}
                >
                    <div 
                        className="w-full max-w-[600px] bg-background border-l border-border h-full flex flex-col p-8 space-y-8 animate-in slide-in-from-right duration-300 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground tracking-tight">Generate iOS Build</h2>
                                <p className="text-xs text-muted-foreground">Configure and start your automated release process.</p>
                            </div>
                            <button onClick={() => setShowAppStoreDrawer(false)} className="p-2 text-muted-foreground/40 hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-8">
                                <BuildConfigurator 
                                    projectId={projectId} 
                                    onBuildStarted={() => setShowAppStoreDrawer(false)} 
                                />
                                <div className="pt-8 border-t border-border">
                                    <h3 className="text-sm font-bold text-foreground mb-4">Build History</h3>
                                    <BuildHistory projectId={projectId} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
