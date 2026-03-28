"use client"
import React from "react"
import { ExternalLink, Loader2, Check } from "lucide-react"
import { useUserProfile, UserSettings } from "@/lib/hooks/useUserProfile"
import { useTheme } from "next-themes"
import clsx from "clsx"
import { Toggle } from "../ui/Toggle"

const SwitchRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between py-2 group">
        <span className="text-muted-foreground text-xs font-medium group-hover:text-foreground transition-colors">{label}</span>
        <Toggle 
            checked={checked}
            onChange={onChange}
        />
    </div>
);

export default function GeneralSettingsSection() {
    const { settings, loading, saving, updateSettings } = useUserProfile()

    const { theme: nextTheme, setTheme } = useTheme()

    if (loading || !settings) return null

    const themeOptions = [
        { id: 'light', label: 'Light Theme' },
        { id: 'dark', label: 'Dark Theme' },
        { id: 'system', label: 'System Default' },
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

    return (
        <div className="flex flex-col gap-8 text-sm pb-12 animate-in fade-in duration-500 max-w-xl">
            <div className="flex flex-col gap-8">
                
                {/* Theme Mode */}
                <div className="flex flex-col gap-3">
                    <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-mono">Appearance</label>
                    <div className="flex flex-wrap items-center gap-2">
                        {themeOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    updateSettings({ theme: (opt.id === 'system' ? 'auto' : opt.id) as UserSettings['theme'] });
                                    setTheme(opt.id);
                                }}
                                className={`px-3 py-1.5 text-xs rounded border transition-all ${
                                    nextTheme === opt.id 
                                        ? "bg-secondary border-border text-foreground" 
                                        : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent Color */}
                <div className="flex flex-col gap-3">
                    <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-mono">Accent Color</label>
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
                                    {isSelected && <Check className="w-3.5 h-3.5 text-foreground/90" strokeWidth={3} />}
                                </button>
                            );
                        })}
                        
                        {/* Custom Hex Color Picker */}
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                            <div className="relative">
                                <input 
                                    type="color" 
                                    value={settings.accent_color?.startsWith('#') ? settings.accent_color : '#ffffff'}
                                    onChange={(e) => updateSettings({ accent_color: e.target.value })}
                                    className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                                />
                                <div 
                                    className={clsx(
                                        "w-6 h-6 rounded-full flex items-center justify-center border border-border transition-all",
                                        settings.accent_color?.startsWith('#') ? 'ring-2 ring-foreground/20 ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                    )}
                                    style={{ backgroundColor: settings.accent_color?.startsWith('#') ? settings.accent_color : 'var(--muted)' }}
                                >
                                    {settings.accent_color?.startsWith('#') ? <Check className="w-3.5 h-3.5 text-foreground mix-blend-difference" strokeWidth={3} /> : <span className="text-[10px] text-muted-foreground font-bold">+</span>}
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
                                    className="bg-input border border-border text-foreground text-[10px] font-mono uppercase rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring focus:border-ring w-[60px]"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border my-1" />

                {/* Automation */}
                <div className="flex flex-col gap-3">
                    <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-mono mb-1">Automation</label>
                    <div className="flex flex-col">
                        <SwitchRow 
                            label="Auto-open last project context on startup" 
                            checked={settings.auto_open_projects} 
                            onChange={() => updateSettings({ auto_open_projects: !settings.auto_open_projects })} 
                        />
                        <div className="h-px bg-border w-full my-1.5" />
                        <SwitchRow 
                            label="Enable system notifications for deployments" 
                            checked={settings.notifications_enabled} 
                            onChange={() => updateSettings({ notifications_enabled: !settings.notifications_enabled })} 
                        />
                    </div>
                </div>

                <div className="h-px bg-border my-1" />

                {/* Developer */}
                <div className="flex flex-col gap-3">
                    <label className="text-muted-foreground text-[10px] tracking-widest uppercase font-mono mb-1">Developer Links</label>
                    <a href="#" className="flex items-center justify-between py-1.5 group cursor-pointer w-fit gap-2">
                        <span className="text-muted-foreground text-xs font-medium group-hover:text-foreground transition-colors border-b border-transparent group-hover:border-foreground/30">Access CLI & API Documentation</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </a>
                </div>

            </div>

            {saving && (
                <div className="fixed bottom-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded text-[10px] font-mono text-brand-400 animate-in fade-in">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    SYNCING
                </div>
            )}
        </div>
    )
}
