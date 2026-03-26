"use client"
import React from "react"
import { ExternalLink, Loader2, Check } from "lucide-react"
import { useUserProfile, UserSettings } from "@/lib/hooks/useUserProfile"

export default function GeneralSettingsSection() {
    const { settings, loading, saving, updateSettings } = useUserProfile()

    if (loading || !settings) return null

    const themeOptions = [
        { id: 'light', label: 'Light Theme' },
        { id: 'dark', label: 'Dark Theme' },
        { id: 'auto', label: 'System Default' },
    ]

    const accentColors = [
        { id: 'fuchsia', bgClass: 'bg-fuchsia-500' },
        { id: 'emerald', bgClass: 'bg-emerald-500' },
        { id: 'blue', bgClass: 'bg-blue-500' },
        { id: 'amber', bgClass: 'bg-amber-500' },
        { id: 'rose', bgClass: 'bg-rose-500' },
        { id: 'violet', bgClass: 'bg-violet-500' },
        { id: 'cyan', bgClass: 'bg-cyan-500' },
    ]

    const SwitchRow = ({ label, checked, onChange }: any) => (
        <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={onChange}>
            <span className="text-[#D8D8D8] text-xs font-medium group-hover:text-white transition-colors">{label}</span>
            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${checked ? "bg-brand-500" : "bg-[#2A2A2E] group-hover:bg-[#333336]"}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${checked ? "translate-x-4" : "translate-x-0"}`} />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 text-sm pb-12 animate-in fade-in duration-500 max-w-xl">
            <div className="flex flex-col gap-8">
                
                {/* Theme Mode */}
                <div className="flex flex-col gap-3">
                    <label className="text-[#666] text-[10px] tracking-widest uppercase font-mono">Appearance</label>
                    <div className="flex flex-wrap items-center gap-2">
                        {themeOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => updateSettings({ theme: opt.id as UserSettings['theme'] })}
                                className={`px-3 py-1.5 text-xs rounded border transition-all ${
                                    settings.theme === opt.id 
                                        ? "bg-[#2A2A2E] border-[#444] text-white" 
                                        : "bg-transparent border-[#2A2A2E] text-[#888] hover:text-[#D8D8D8]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent Color */}
                <div className="flex flex-col gap-3">
                    <label className="text-[#666] text-[10px] tracking-widest uppercase font-mono">Accent Color</label>
                    <div className="flex flex-wrap items-center gap-3">
                        {accentColors.map((color) => {
                            const isSelected = (settings.accent_color || 'fuchsia') === color.id;
                            return (
                                <button
                                    key={color.id}
                                    onClick={() => updateSettings({ accent_color: color.id })}
                                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${color.bgClass} ${
                                        isSelected ? 'ring-2 ring-brand-500/50 ring-offset-2 ring-offset-black scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                    }`}
                                    title={color.id.charAt(0).toUpperCase() + color.id.slice(1)}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white/90" strokeWidth={3} />}
                                </button>
                            );
                        })}
                        
                        {/* Custom Hex Color Picker */}
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2A2A2E]">
                            <div className="relative">
                                <input 
                                    type="color" 
                                    value={settings.accent_color?.startsWith('#') ? settings.accent_color : '#ffffff'}
                                    onChange={(e) => updateSettings({ accent_color: e.target.value })}
                                    className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                                />
                                <div 
                                    className={`w-6 h-6 rounded-full flex items-center justify-center border border-[#333] ${settings.accent_color?.startsWith('#') ? 'ring-2 ring-brand-500/50 ring-offset-2 ring-offset-black scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105 transition-all'}`}
                                    style={{ backgroundColor: settings.accent_color?.startsWith('#') ? settings.accent_color : '#222' }}
                                >
                                    {settings.accent_color?.startsWith('#') ? <Check className="w-3.5 h-3.5 text-white mix-blend-difference" strokeWidth={3} /> : <span className="text-[10px] text-[#666] font-bold">+</span>}
                                </div>
                            </div>
                            {settings.accent_color?.startsWith('#') && (
                                <input 
                                    type="text" 
                                    value={settings.accent_color.toUpperCase()} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.startsWith('#') && val.length <= 7) {
                                            updateSettings({ accent_color: val });
                                        } else if (!val.startsWith('#') && val.length <= 6) {
                                            updateSettings({ accent_color: '#' + val });
                                        }
                                    }}
                                    className="bg-[#111] border border-[#2A2A2E] text-[#AAA] text-[10px] font-mono uppercase rounded px-2 py-1 outline-none focus:border-[#444] w-[60px]"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[#2A2A2E] my-1" />

                {/* Automation */}
                <div className="flex flex-col gap-3">
                    <label className="text-[#666] text-[10px] tracking-widest uppercase font-mono mb-1">Automation</label>
                    <div className="flex flex-col">
                        <SwitchRow 
                            label="Auto-open last project context on startup" 
                            checked={settings.auto_open_projects} 
                            onChange={() => updateSettings({ auto_open_projects: !settings.auto_open_projects })} 
                        />
                        <div className="h-px bg-[#1C1C1E] w-full my-1.5" />
                        <SwitchRow 
                            label="Enable system notifications for deployments" 
                            checked={settings.notifications_enabled} 
                            onChange={() => updateSettings({ notifications_enabled: !settings.notifications_enabled })} 
                        />
                    </div>
                </div>

                <div className="h-px bg-[#2A2A2E] my-1" />

                {/* Developer */}
                <div className="flex flex-col gap-3">
                    <label className="text-[#666] text-[10px] tracking-widest uppercase font-mono mb-1">Developer Links</label>
                    <a href="#" className="flex items-center justify-between py-1.5 group cursor-pointer w-fit gap-2">
                        <span className="text-[#888] text-xs font-medium group-hover:text-brand-400 transition-colors border-b border-transparent group-hover:border-brand-400/30">Access CLI & API Documentation</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#444] group-hover:text-brand-400 transition-colors" />
                    </a>
                </div>

            </div>

            {saving && (
                <div className="fixed bottom-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-[#2A2A2E] border border-[#333336] rounded text-[10px] font-mono text-brand-400 animate-in fade-in">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    SYNCING
                </div>
            )}
        </div>
    )
}
