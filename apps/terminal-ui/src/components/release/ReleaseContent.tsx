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
    Smartphone
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

// Sub-components
import { AppleIcon } from "./AppleIcon"
import CertificateUploader from "./CertificateUploader"
import AppStoreMetadataForm from "./AppStoreMetadataForm"

// Placeholders for missing components
const AppleConnect = () => (
    <div className="p-6 border border-[#1C1C1E] rounded-[10px] bg-[#0A0A0B] text-center">
        <p className="text-xs text-[#666]">Apple Developer Account Connection (Placeholder)</p>
        <button className="mt-3 px-4 py-2 bg-white text-black text-xs font-bold rounded-[10px] hover:bg-white/90">
            Connect Account
        </button>
    </div>
)

const BuildConfigurator = ({ projectId, onBuildStarted }: { projectId: string, onBuildStarted: () => void }) => (
    <div className="p-6 border border-[#1C1C1E] rounded-[10px] bg-[#0A0A0B] text-center">
        <p className="text-xs text-[#666]">Build Configurator (Placeholder)</p>
        <button 
            onClick={onBuildStarted}
            className="mt-3 px-4 py-2 bg-white text-black text-xs font-bold rounded-[10px] hover:bg-white/90"
        >
            Start iOS Build
        </button>
    </div>
)

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
                <Loader2 className="w-8 h-8 text-[#444] animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-[800px] mx-auto py-10 space-y-12 pb-32">
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Post to Stores</h2>
                <p className="text-sm text-[#666] max-w-md mx-auto leading-relaxed">
                    Convert your web project into a native app and release it to the iOS App Store and Google Play Store.
                </p>
            </div>

            {/* App Preview Card */}
            <div className="relative aspect-[16/10] bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] overflow-hidden group">
                <iframe
                    src={liveUrl}
                    className="w-full h-full border-none pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
                    title="App Preview"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] border border-[#2A2A2E] flex items-center justify-center p-3">
                        {project.icon_512_url ? (
                            <img src={project.icon_512_url} className="w-full h-full object-contain" />
                        ) : (
                            <Smartphone className="w-8 h-8 text-[#444]" />
                        )}
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-white mb-1">{project.name}</div>
                        <div className="text-xs text-[#666] font-mono">{project.subdomain}.foldaa.com</div>
                    </div>
                    <button 
                        onClick={() => window.open(liveUrl, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] border border-[#2A2A2E] rounded-[10px] text-xs font-bold text-white hover:bg-[#2A2A2E] transition-all"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Preview
                    </button>
                </div>
            </div>

            {/* Setup & Configuration (Collapsible) */}
            <div className="bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] overflow-hidden transition-all">
                <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#0D0D0E] transition-colors"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-[10px] bg-[#1C1C1E] flex items-center justify-center text-[#888]">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white/90">Setup Requirements</div>
                            <div className="text-[11px] text-[#666] font-medium tracking-wide">
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
                        {showSetup ? <ChevronUp className="w-4 h-4 text-[#444]" /> : <ChevronDown className="w-4 h-4 text-[#444]" />}
                    </div>
                </button>

                {showSetup && (
                    <div className="p-8 border-t border-[#1C1C1E] space-y-12">
                        {/* Step 1: Apple Developer Account */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasAppleAccount ? "bg-green-500 text-black" : "bg-[#1C1C1E] text-[#666]"
                                )}>
                                    {appStoreStatus.hasAppleAccount ? "✓" : "1"}
                                </span>
                                <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">Apple Developer Account</h4>
                            </div>
                            <AppleConnect />
                        </div>

                        {/* Step 2: iOS Certificates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasCertificates ? "bg-green-500 text-black" : "bg-[#1C1C1E] text-[#666]"
                                )}>
                                    {appStoreStatus.hasCertificates ? "✓" : "2"}
                                </span>
                                <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">Distribution Certificates</h4>
                            </div>
                            <CertificateUploader projectId={projectId} onCertificateUploaded={loadStatus} />
                        </div>

                        {/* Step 3: App Store Metadata */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    appStoreStatus.hasMetadata ? "bg-green-500 text-black" : "bg-[#1C1C1E] text-[#666]"
                                )}>
                                    {appStoreStatus.hasMetadata ? "✓" : "3"}
                                </span>
                                <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">Store Metadata</h4>
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
                    "bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] p-6 flex items-center gap-6",
                    !appStoreStatus.isReady && "opacity-60"
                )}>
                    <div className="w-14 h-14 rounded-[12px] bg-[#1C1C1E] flex items-center justify-center border border-[#2A2A2E]">
                        <AppleIcon size={32} color="white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-white tracking-wide">iOS App Store</h3>
                        <p className="text-xs text-[#666]">
                            {!appStoreStatus.isReady ? "Complete requirements to build" : "Ready to generate build"}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAppStoreDrawer(true)}
                            disabled={!appStoreStatus.isReady}
                            className="p-2 border border-[#2A2A2E] rounded-[10px] text-[#666] hover:text-white transition-colors disabled:opacity-30"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-[#1C1C1E]">
                            <span className="text-[10px] font-bold tracking-widest text-[#444] uppercase">Publish</span>
                            <button
                                onClick={handleToggleAppStore}
                                disabled={isUpdating || !appStoreStatus.isReady}
                                className={clsx(
                                    "relative w-10 h-5 rounded-full transition-all",
                                    appStoreEnabled ? "bg-[#E91E63]" : "bg-[#1C1C1E]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-1 w-3 h-3 rounded-full transition-all bg-white",
                                    appStoreEnabled ? "left-6" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Android Play Store (Coming Soon) */}
                <div className="bg-[#0A0A0B] border border-[#1C1C1E] rounded-[10px] p-6 flex items-center gap-6 opacity-40">
                    <div className="w-14 h-14 rounded-[12px] bg-[#1C1C1E] flex items-center justify-center border border-[#2A2A2E]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#666" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-[#444] tracking-wide">Google Play Store</h3>
                        <p className="text-xs text-[#444]">Coming soon</p>
                    </div>
                </div>
            </div>

            {/* Build Config Drawer */}
            {showAppStoreDrawer && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end"
                    onClick={() => setShowAppStoreDrawer(false)}
                >
                    <div 
                        className="w-full max-w-[600px] bg-black border-l border-[#1C1C1E] h-full flex flex-col p-8 space-y-8 animate-in slide-in-from-right duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Generate iOS Build</h2>
                                <p className="text-xs text-[#666]">Configure and start your automated release process.</p>
                            </div>
                            <button onClick={() => setShowAppStoreDrawer(false)} className="p-2 text-[#444] hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <BuildConfigurator 
                                projectId={projectId} 
                                onBuildStarted={() => setShowAppStoreDrawer(false)} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
