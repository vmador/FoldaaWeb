"use client"
import React from "react"
import { Monitor, Moon, Sun, Bell, Terminal, ExternalLink, Save, Loader2, Sliders } from "lucide-react"
import { useUserProfile, UserSettings } from "@/lib/hooks/useUserProfile"

export default function GeneralSettingsSection() {
    const { settings, loading, saving, updateSettings } = useUserProfile()

    if (loading || !settings) return null

    const themeOptions = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'auto', label: 'System', icon: Monitor },
    ]

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Application Settings</h2>
                <p className="text-[#666] text-sm mt-1">Configure your dashboard experience and developer preferences.</p>
            </div>

            <div className="space-y-10">
                {/* Theme Selection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold text-[#444] uppercase tracking-widest pl-1">Appearance</h3>
                        <div className="h-px flex-1 bg-[#2A2A2E]"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {themeOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => updateSettings({ theme: option.id as UserSettings['theme'] })}
                                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all ${
                                    settings.theme === option.id 
                                        ? "bg-white/5 border-white/20 text-white shadow-lg shadow-white/5" 
                                        : "bg-[#1C1C1E] border-[#2A2A2E] text-[#444] hover:border-[#333336] hover:text-[#888]"
                                }`}
                            >
                                <option.icon className={`w-4 h-4 ${settings.theme === option.id ? "text-fuchsia-400" : ""}`} />
                                <span className="text-xs font-bold uppercase tracking-widest">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Automation Preferences */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold text-[#444] uppercase tracking-widest pl-1">Automation</h3>
                        <div className="h-px flex-1 bg-[#2A2A2E]"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3.5 bg-[#1C1C1E] border border-[#2A2A2E] rounded-xl hover:border-[#2A2A2E] transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Terminal className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#D8D8D8]">Auto-open Projects</span>
                                    <span className="text-xs text-[#444]">Automatically open the last project context on startup</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => updateSettings({ auto_open_projects: !settings.auto_open_projects })}
                                className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${
                                    settings.auto_open_projects ? "bg-fuchsia-500/20 border-fuchsia-500/50" : "bg-[#2A2A2E] border-[#333336]"
                                }`}
                            >
                                <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                    settings.auto_open_projects ? "bg-fuchsia-400 left-[22px]" : "bg-[#444] left-1"
                                }`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-[#1C1C1E] border border-[#2A2A2E] rounded-xl hover:border-[#2A2A2E] transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Bell className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#D8D8D8]">Desktop Notifications</span>
                                    <span className="text-xs text-[#444]">Get notified about deployment status and important alerts</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => updateSettings({ notifications_enabled: !settings.notifications_enabled })}
                                className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${
                                    settings.notifications_enabled ? "bg-fuchsia-500/20 border-fuchsia-500/50" : "bg-[#2A2A2E] border-[#333336]"
                                }`}
                            >
                                <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                    settings.notifications_enabled ? "bg-fuchsia-400 left-[22px]" : "bg-[#444] left-1"
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Developer Documentation */}
                <div className="p-5 bg-black border border-fuchsia-500/10 rounded-xl flex items-center justify-between group cursor-pointer hover:border-fuchsia-500/30 transition-all shadow-xl shadow-fuchsia-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
                            <Sliders className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-widest pl-1">CLI & Developer Tools</span>
                            <span className="text-xs text-[#444] pl-1">Access your tokens and developer documentation</span>
                        </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#444] group-hover:text-fuchsia-400 transition-colors" />
                </div>
            </div>

            {saving && (
                <div className="fixed bottom-8 right-8 flex items-center gap-3 px-4 py-2 bg-[#2A2A2E] border border-[#333336] rounded-lg text-xs font-mono text-fuchsia-400 animate-in fade-in slide-in-from-right-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    SYNCING_CONFIG...
                </div>
            )}
        </div>
    )
}
