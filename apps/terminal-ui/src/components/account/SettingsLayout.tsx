"use client"
import React from "react"
import { User, Shield, Sliders, ChevronLeft, Terminal } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

export type SettingsTab = "account" | "general" | "cloudflare" | "apple" | "lemonsqueezy" | "apikeys" | "subscription" | "support"

interface SettingsLayoutProps {
    activeTab: SettingsTab
    onTabChange: (tab: SettingsTab) => void
    title?: string
    description?: string
    children: React.ReactNode
}

export default function SettingsLayout({ activeTab, onTabChange, title, description, children }: SettingsLayoutProps) {
    const navCategories = [
        {
            title: "PROFILE & ACCOUNT",
            items: [
                { id: "account", label: "Profile" },
                { id: "general", label: "Preferences" },
            ]
        },
        {
            title: "CONNECTS",
            items: [
                { id: "cloudflare", label: "Cloudflare" },
                { id: "apple", label: "Apple Developer" },
                { id: "lemonsqueezy", label: "Lemon Squeezy" },
            ]
        },
        {
            title: "KEYS",
            items: [
                { id: "apikeys", label: "API Keys" },
            ]
        },
        {
            title: "BILLING",
            items: [
                { id: "subscription", label: "Subscription" },
            ]
        },
        {
            title: "HELP & SUPPORT",
            items: [
                { id: "support", label: "Send Message" },
            ]
        }
    ]

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-black font-sans">
            {/* Header */}
            <div className="h-[44.5px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[#2A2A2E] bg-black/40 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="p-1 hover:bg-[#2A2A2E] rounded text-[#666] hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <h2 className="text-white font-bold text-sm tracking-tight">{title || 'Settings'}</h2>
                    </div>
                    {description && (
                        <span className="text-xs text-[#666] font-medium border-l border-[#333336] pl-3 h-4 flex items-center">
                            {description}
                        </span>
                    )}
                </div>
                <button className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-white/70 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                    Save and update <span className="text-white/30 font-mono lowercase">⌘+S</span>
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Navigation Sidebar */}
                <div className="w-64 border-r border-[#2A2A2E] py-6 px-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Search Settings */}
                    <div className="px-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <svg className="w-3.5 h-3.5 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Search Settings" 
                                className="w-full bg-[#1C1C1E] border border-[#2A2A2E] rounded-md pl-8 pr-3 py-1.5 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#444]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {navCategories.map((category) => (
                            <div key={category.title} className="flex flex-col gap-1.5">
                                <h3 className="px-3 text-xs uppercase font-mono tracking-widest text-[#555] mb-1">{category.title}</h3>
                                {category.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onTabChange(item.id as SettingsTab)}
                                        className={clsx(
                                            "flex items-center px-3 py-1.5 rounded transition-all text-xs text-left",
                                            activeTab === item.id 
                                                ? "text-white font-medium" 
                                                : "text-[#888] hover:text-[#AAA]"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black">
                    {/* Inner content is aligned slightly more cleanly */}
                    <div className="max-w-3xl mx-auto py-12 px-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
