'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback
} from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    Copy,
    ArrowSquareOut,
    DeviceMobile,
    Desktop,
    X,
    CircleDashed,
    CheckCircle,
    Globe,
    ArrowsClockwise,
    Play,
    Command,
    Browser,
    Layout,
    Laptop,
    CornersOut
} from "@phosphor-icons/react"
import { useUI } from "@/lib/contexts/UIContext"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import { useProjects } from "@/lib/hooks/useProjects"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

export default function CreateProjectForm() {
    const { setCreateModalOpen, addToast } = useUI()
    const { profile } = useUserProfile()
    const { projects } = useProjects()
    
    const isFree = profile?.subscriptionPlan !== 'pro'
    const hasReachedLimit = isFree && projects.length >= 3

    // Form State
    const [url, setUrl] = useState("https://")
    const [name, setName] = useState("")
    const [themeColor, setThemeColor] = useState("#000000")
    const [backgroundColor, setBackgroundColor] = useState("#ffffff")
    const [ignoreSafeArea, setIgnoreSafeArea] = useState(true) // Default to true for "App-like" feel
    const [device, setDevice] = useState<"desktop" | "mobile">("mobile")
    const [deployMode, setDeployMode] = useState<"web" | "mobile">("mobile")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<"input" | "deploying" | "success">("input")
    const [deploymentLogs, setDeploymentLogs] = useState<string[]>([])
    const [result, setResult] = useState<any>(null)

    // Sync device view with deploy mode by default, but allow independent toggle
    useEffect(() => {
        setDevice(deployMode === "mobile" ? "mobile" : "desktop")
    }, [deployMode])

    const handleSubmit = async () => {
        if (!url || url === "https://" || isSubmitting) return
        setIsSubmitting(true)
        setStep("deploying")
        setDeploymentLogs(["⚡ Pipeline initialized..."])

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const isPWA = deployMode === "mobile"
            let command = `foldaa preview ${url}`
            if (name) command += ` --name "${name.replace(/"/g, '\\"')}"`
            if (themeColor) command += ` --theme "${themeColor}"`
            if (backgroundColor) command += ` --background "${backgroundColor}"`
            if (ignoreSafeArea) command += ` --safe-area`
            if (isPWA) command += ` --pwa`
            
            const res = await fetch('/api/foldaa/command', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ command })
            })

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Pipeline Error: ${text}`);
            }

            const reader = res.body?.getReader()
            if (!reader) throw new Error("No stream")
            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() || ""
                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const msg = JSON.parse(line)
                        if (msg.event === 'progress') setDeploymentLogs(p => [...p.slice(-3), msg.data.step])
                        else if (msg.event === 'done') { 
                            setResult(msg.result); 
                            setStep("success"); 
                            setIsSubmitting(false); 
                            addToast(`Project "${name || url}" created successfully!`, 'success');
                            return; 
                        }
                        else if (msg.event === 'error') throw new Error(msg.data)
                    } catch (e) {}
                }
            }
        } catch (err: any) {
            setDeploymentLogs(p => [...p, "❌ Error"]); 
            setIsSubmitting(false); 
            addToast(`Creation failed: ${err.message}`, 'error');
            setTimeout(() => setStep("input"), 2000)
        }
    }

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setCreateModalOpen(false)
            if (e.key === 'Enter' && url && url !== "https://" && step === 'input') handleSubmit()
        }
        window.addEventListener('keydown', handleKeys)
        return () => window.removeEventListener('keydown', handleKeys)
    }, [url, step, setCreateModalOpen])

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none overflow-hidden">
            
            {/* Header Hint */}
            <div className="absolute top-8 left-12 opacity-20 pointer-events-none">
                <span className="text-xs font-bold text-white uppercase tracking-[0.4em]">New Deployment</span>
            </div>
            
            <button 
                onClick={() => setCreateModalOpen(false)}
                className="absolute top-8 right-12 p-2 hover:bg-white/5 rounded-full transition-all text-zinc-600 hover:text-white"
            >
                <X size={20} />
            </button>

            {/* Immersive Mobile Preview (Match Screenshot 2265) */}
            <div className="flex-1 w-full max-w-[1400px] flex items-center justify-center p-12 pb-44 pt-20">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={device}
                        initial={{ opacity: 0, scale: 0.99, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        className={clsx(
                            "relative transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/[0.04] overflow-hidden bg-[#000]",
                            device === "desktop" ? "w-full aspect-[16/10] max-h-[75vh] rounded-2xl" : "w-[380px] h-[780px] rounded-[3rem] border border-white/[0.06]"
                        )}
                    >
                        {/* Preview Header (Match Screenshot) */}
                        <div className="h-14 flex items-center justify-between px-6 bg-transparent z-20">
                            <div className="w-16" /> {/* Spacer */}
                            <div className="flex-1 flex justify-center">
                                <div className="h-7 w-52 bg-white/[0.03] border border-white/[0.05] rounded-full flex items-center justify-center px-4">
                                    <span className="text-xs font-mono text-zinc-600 truncate opacity-60">app.foldaa.com / preview</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-700">
                                <Desktop 
                                    size={18} 
                                    className={clsx("cursor-pointer transition-colors", device === "desktop" ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400")} 
                                    onClick={() => setDevice("desktop")} 
                                />
                                <DeviceMobile 
                                    size={18} 
                                    className={clsx("cursor-pointer transition-colors", device === "mobile" ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400")} 
                                    onClick={() => setDevice("mobile")} 
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full h-full pb-14 flex items-center justify-center overflow-hidden">
                            <div style={device === "mobile" ? { 
                                width: '428px', 
                                height: '956px',
                                transform: 'scale(0.68)',
                                transformOrigin: 'center center',
                                pointerEvents: 'none',
                                borderRadius: '2rem',
                                overflow: 'hidden'
                            } : { width: '100%', height: '100%' }}>
                                {url && url !== "https://" ? (
                                    <iframe src={url} className="w-full h-full border-none opacity-80" title="Tunnel View" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                                            <Globe size={24} weight="thin" className="text-zinc-700" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">Live Preview</p>
                                            <p className="text-xs text-zinc-800 mt-2 max-w-[150px]">System awaiting source input to initialize visual tunnel.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Zero Friction Banner (36.5px height) */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[860px] px-6">
                
                {/* Deployment HUD */}
                <AnimatePresence>
                    {hasReachedLimit ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-full mb-4 left-6 right-6 p-2 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-3xl flex items-center justify-between gap-4 px-4 overflow-hidden"
                        >
                            <span className="text-xs font-mono text-red-400 uppercase tracking-widest">⚠️ Free Project Limit Reached (3/3)</span>
                            <button 
                                onClick={() => { setCreateModalOpen(false); window.location.href = '/account?tab=subscription'; }}
                                className="px-3 py-1 bg-red-500/20 text-red-300 hover:text-white rounded text-xs font-bold uppercase transition-colors"
                            >
                                Upgrade to Pro
                            </button>
                        </motion.div>
                    ) : step === "deploying" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-full mb-4 left-6 right-6 p-2 rounded-xl bg-black border border-white/[0.03] backdrop-blur-3xl flex items-center gap-4 px-4 overflow-hidden"
                            style={{ height: '36.5px' }}
                        >
                            <CircleDashed size={14} className="animate-spin text-zinc-500" />
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{deploymentLogs[deploymentLogs.length - 1] || "Connecting..."}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Control Banner */}
                <div 
                    className="w-full bg-[#050505] border border-white/[0.07] shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex items-center p-[6px] rounded-xl relative"
                    style={{ height: '36.5px' }}
                >
                    {/* Shimmering ፨ Icon (Opacity Based) */}
                    <div className="w-9 h-full flex items-center justify-center relative">
                        <motion.span 
                            animate={(url !== "https://" || name) ? { 
                                opacity: [0.3, 1, 0.3],
                                scale: [0.95, 1, 0.95]
                            } : { opacity: 0.3 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-lg text-white font-bold select-none cursor-default"
                        >
                            ፨
                        </motion.span>
                    </div>

                    {/* URL Input (Soft https://) */}
                    <div className="flex-[2] relative h-full flex items-center px-1">
                        {url.startsWith("https://") && (
                            <div className="absolute left-1 pointer-events-none flex items-center">
                                <span className="text-zinc-700 font-mono text-sm">https://</span>
                                <span className="opacity-0 font-mono text-sm">{url.slice(8)}</span>
                            </div>
                        )}
                        <input 
                            autoFocus
                            disabled={hasReachedLimit}
                            spellCheck={false}
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onFocus={(e) => !hasReachedLimit && e.target.select()}
                            className={clsx(
                                "w-full bg-transparent border-none py-0 h-full text-sm font-mono focus:ring-0 placeholder:text-zinc-800",
                                url.startsWith("https://") ? "text-transparent caret-white" : "text-zinc-300",
                                hasReachedLimit && "opacity-50 cursor-not-allowed"
                            )}
                            placeholder="app.foldaa.com"
                        />
                        {url.startsWith("https://") && (
                            <div className="absolute left-1 pointer-events-none flex items-center">
                                <span className="opacity-0 font-mono text-sm">https://</span>
                                <span className="text-zinc-300 font-mono text-sm">{url.slice(8)}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Link Icons */}
                    <div className="flex items-center gap-3 px-3 text-zinc-700 shrink-0">
                        <ArrowsClockwise size={15} className="hover:text-zinc-300 transition-colors cursor-pointer" />
                        <ArrowSquareOut size={15} className="hover:text-zinc-300 transition-colors cursor-pointer" />
                    </div>

                    {/* Separator */}
                    <div className="h-4 w-[1px] bg-white/[0.04] shrink-0" />

                    {/* Title Input Area */}
                    <div className="flex-[1] flex items-center shrink-0">
                        <span className="text-zinc-800 text-xs font-light pl-4 pr-1">|</span>
                        <input 
                            type="text"
                            disabled={hasReachedLimit}
                            placeholder="Title for you app"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={clsx(
                                "f-full bg-transparent border-none py-0 h-full text-sm font-medium focus:ring-0 text-zinc-300 placeholder:text-zinc-800 px-2",
                                hasReachedLimit && "opacity-50 cursor-not-allowed"
                            )}
                        />
                    </div>

                    {/* Deploy Config Toggles (Web/Mobile Native) */}
                    <div className="flex items-center gap-4 px-4 shrink-0 border-l border-white/[0.02]">
                        <button 
                            onClick={() => setDeployMode("web")}
                            className={clsx("transition-all", deployMode === "web" ? "text-zinc-300" : "text-zinc-700 hover:text-zinc-500")}
                            title="Legacy Web Experience"
                        >
                            <Laptop size={18} weight={deployMode === "web" ? "fill" : "regular"} />
                        </button>
                        <button 
                            onClick={() => setDeployMode("mobile")}
                            className={clsx("transition-all", deployMode === "mobile" ? "text-zinc-300" : "text-zinc-700 hover:text-zinc-500")}
                            title="Full Native PWA Experience"
                        >
                            <DeviceMobile size={18} weight={deployMode === "mobile" ? "fill" : "bold"} />
                        </button>
                    </div>

                    {/* PWA Customization (Colors & Safe Area) */}
                    {deployMode === "mobile" && (
                        <div className="flex items-center gap-3 px-3 border-l border-white/[0.02]">
                            <div className="flex items-center gap-1.5" title="Theme Color">
                                <div 
                                    className="w-4 h-4 rounded-full border border-white/10 cursor-pointer overflow-hidden relative"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    <input 
                                        type="color" 
                                        value={themeColor} 
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5" title="Background Color">
                                <div 
                                    className="w-4 h-4 rounded-full border border-white/10 cursor-pointer overflow-hidden relative"
                                    style={{ backgroundColor: backgroundColor }}
                                >
                                    <input 
                                        type="color" 
                                        value={backgroundColor} 
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={() => setIgnoreSafeArea(!ignoreSafeArea)}
                                className={clsx("transition-all", ignoreSafeArea ? "text-indigo-400" : "text-zinc-700")}
                                title={ignoreSafeArea ? "Ignore Safe Area (Full Height)" : "Respect Safe Area"}
                            >
                                <CornersOut size={16} weight={ignoreSafeArea ? "fill" : "bold"} />
                            </button>
                        </div>
                    )}

                    {/* Deploy Button (24.5px height) */}
                    <div className="pr-[2px]">
                        <button
                            disabled={hasReachedLimit || !url || url === "https://" || isSubmitting}
                            onClick={() => handleSubmit()}
                            className={clsx(
                                "flex items-center justify-center gap-2 px-5 rounded-[6px] transition-all font-bold tracking-tight border border-white/[0.03] active:scale-[0.97]",
                                url !== "https://" && !isSubmitting && !hasReachedLimit ? "bg-[#2D454A] text-[#D0EBF0]" : "bg-white/[0.02] text-zinc-800"
                            )}
                            style={{ height: '24.5px' }}
                        >
                            <span className="text-xs">Deploy</span>
                            <Play weight="fill" size={10} />
                        </button>
                    </div>
                </div>

                {/* Web/Mobile Context Indicators */}
                {!isSubmitting && step === "input" && (
                    <div className="mt-4 flex justify-center gap-6 opacity-40">
                        <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all", deployMode === "web" ? "text-zinc-400" : "text-zinc-800")}>
                            <div className={clsx("w-1 h-1 rounded-full", deployMode === "web" ? "bg-indigo-500" : "bg-zinc-800")} /> Standard Web
                        </div>
                        <div className={clsx("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all", deployMode === "mobile" ? "text-zinc-400" : "text-zinc-800")}>
                            <div className={clsx("w-1 h-1 rounded-full", deployMode === "mobile" ? "bg-indigo-500" : "bg-zinc-800")} /> Native PWA Engine
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                body { background: #000 !important; }
                * { -webkit-font-smoothing: antialiased; }
            `}</style>
        </div>,
        document.body
    )
}
