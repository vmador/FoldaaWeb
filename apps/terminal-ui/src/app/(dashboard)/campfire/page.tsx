"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Tent, Sparkle, Users, Fire, Plus, MagnifyingGlass, Funnel, ChartBar } from "@phosphor-icons/react";
import { useRouter } from 'next/navigation';
import TentStatusCard from '@/components/campfire/TentStatusCard';
import TempMarketCard from '@/components/campfire/TempMarketCard';
import BrainAssistantPanel from '@/components/campfire/BrainAssistantPanel';
import clsx from 'clsx';

type TabType = 'tents' | 'marketplace' | 'network';

export default function CampfirePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('marketplace');
    const [searchQuery, setSearchQuery] = useState('');

    const TABS = [
        { id: 'tents', label: 'My Tents', icon: Tent, count: 2 },
        { id: 'marketplace', label: 'Marketplace', icon: Sparkle, count: 12 },
        { id: 'network', label: 'Network', icon: Users, count: 48 },
    ];

    const MOCK_TEMPS: any[] = [
        {
            title: "OpenTable + AI",
            description: "Smart reservation system with natural language parsing and real-time floor management.",
            price: 8000,
            duration: "4 Weeks",
            capacity: 3,
            type: "AI-Heavy"
        },
        {
            title: "E-Commerce Pro",
            description: "High-performance storefront with headless CMS and automated fulfillment logic.",
            price: 12500,
            duration: "6 Weeks",
            capacity: 5,
            type: "Standard"
        },
        {
            title: "Mobile FinTech",
            description: "Bank-grade secure mobile wallet with real-time transaction tracking and global KYC.",
            price: 15000,
            duration: "8 Weeks",
            capacity: 4,
            type: "Mobile-Ready"
        }
    ];

    return (
        <div className="flex-1 flex min-w-0 bg-background overflow-hidden relative">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* Dashboard Header */}
                <header className="flex-shrink-0 p-8 pt-10 border-b border-neutral-200/20 bg-background/50 backdrop-blur-md relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-neutral-100/5 border border-neutral-200/50">
                                    <Fire size={24} weight="fill" className="text-foreground" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-widest">Campfire</h1>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                                Ignite your vision. Rent pre-configured Temps and start building with expert Builders in the hearth.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end px-4 border-r border-neutral-200/20">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Ecosystem Load</span>
                                <span className="text-lg font-bold font-mono">42%</span>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background font-bold text-xs uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all">
                                <Plus size={16} weight="bold" />
                                Create Temp
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-8 mt-10">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={clsx(
                                    "relative flex items-center gap-2.5 pb-4 transition-all group",
                                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
                                <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                                <span className="text-[10px] font-bold opacity-30 bg-neutral-100/10 px-1.5 py-0.5 rounded-md">
                                    {tab.count}
                                </span>
                                {activeTab === tab.id && (
                                    <motion.div 
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    
                    {/* Search and Filters Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div className="relative group flex-1 max-w-md">
                            <MagnifyingGlass 
                                size={18} 
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" 
                            />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Temps or Tents..."
                                className="w-full h-11 bg-neutral-100/5 border border-neutral-200/20 rounded-xl pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-3 rounded-xl bg-neutral-100/5 border border-neutral-200/20 text-muted-foreground hover:text-foreground transition-all">
                                <Funnel size={18} />
                            </button>
                            <button className="p-3 rounded-xl bg-neutral-100/5 border border-neutral-200/20 text-muted-foreground hover:text-foreground transition-all">
                                <ChartBar size={18} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'tents' && (
                            <motion.div 
                                key="tents"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                <TentStatusCard 
                                    name="OpenTable AI"
                                    weeksTotal={4}
                                    weekCurrent={2}
                                    buildersActive={3}
                                    lastFlame="2 minutes ago (commit eb3f2)"
                                    status="burning"
                                    onClick={() => router.push('/campfire/tent/opentable-ai')}
                                />
                                <TentStatusCard 
                                    name="Midnight Store"
                                    weeksTotal={6}
                                    weekCurrent={5}
                                    buildersActive={2}
                                    lastFlame="6 hours ago (PR #421 approved)"
                                    status="settling"
                                    onClick={() => router.push('/campfire/tent/midnight-store')}
                                />
                                <div className="border-2 border-dashed border-neutral-200/20 rounded-2xl flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-neutral-100/5 transition-all">
                                    <div className="p-4 rounded-full bg-neutral-100/5 border border-neutral-200/20 mb-4 group-hover:scale-110 transition-transform">
                                        <Plus size={32} className="text-muted-foreground" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">Ignite New Tent</h4>
                                    <p className="text-xs text-muted-foreground max-w-[180px] mt-2 leading-relaxed">
                                        Select a Temp from the Marketplace to start building.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'marketplace' && (
                            <motion.div 
                                key="marketplace"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {MOCK_TEMPS.map((temp, i) => (
                                    <TempMarketCard 
                                        key={i}
                                        title={temp.title}
                                        description={temp.description}
                                        price={temp.price}
                                        duration={temp.duration}
                                        capacity={temp.capacity}
                                        type={temp.type}
                                    />
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'network' && (
                            <motion.div 
                                key="network"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-center py-20 text-center"
                            >
                                <div className="space-y-4">
                                    <Users size={64} opacity={0.1} className="mx-auto" />
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        The Builder Network is currently being indexed. Connect your skills and experience to join the hearth.
                                    </p>
                                    <button className="underline text-xs font-bold uppercase tracking-widest text-foreground">
                                        Register as Builder
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Global Status HUD */}
                <div className="flex-shrink-0 p-4 border-t border-neutral-200/20 bg-[#060606] flex items-center justify-between px-8 opacity-40 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase text-muted-foreground font-mono-hud tracking-tighter">System Version</span>
                            <span className="text-[10px] font-bold font-mono">CAMPFIRE_v0.2.1-stable</span>
                        </div>
                        <div className="w-px h-6 bg-neutral-200/20" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase text-muted-foreground font-mono-hud tracking-tighter">Connection Status</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold font-mono">LINK_SECURE</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground">Foldaa Ecosystem Control Panel</span>
                    </div>
                </div>
            </div>

            {/* AI Assistant Sidebar (The Brain) */}
            <BrainAssistantPanel />
            
        </div>
    );
}
