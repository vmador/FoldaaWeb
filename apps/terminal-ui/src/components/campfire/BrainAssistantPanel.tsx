"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkle, ChartPolar, Info, Warning, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import clsx from 'clsx';

const MOCK_INSIGHTS = [
    { id: 1, type: 'active', text: '3 Builders matching your stack are currently available for rent.', icon: Sparkle },
    { id: 2, type: 'warning', text: 'Tent "OpenTable AI" roadmap milestone for Week 2 is 15% behind schedule.', icon: Warning },
    { id: 3, type: 'info', text: 'New "E-commerce Pro" Temp just added to the Marketplace.', icon: Info },
    { id: 4, type: 'success', text: 'Source of Truth analysis complete for all active Tents.', icon: CheckCircle },
];

export default function BrainAssistantPanel() {
    return (
        <div className="flex flex-col h-full bg-[#080808]/50 border-l border-neutral-200/20 backdrop-blur-xl w-[320px] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200/20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Brain size={18} weight="fill" className="text-black" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest">The Brain</h4>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active Insight Engine</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-100/5 border border-neutral-200/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ecosystem Health</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">98.2%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '98.2%' }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        />
                    </div>
                </div>
            </div>

            {/* Content / Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Live Insights</h5>
                    <div className="space-y-4">
                        <AnimatePresence>
                            {MOCK_INSIGHTS.map((insight, i) => (
                                <motion.div 
                                    key={insight.id}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative p-3 rounded-xl bg-neutral-100/5 border border-neutral-100/10 hover:border-neutral-200/30 transition-all cursor-pointer"
                                >
                                    <div className="flex gap-3">
                                        <div className={clsx(
                                            "mt-0.5",
                                            insight.id === 1 ? "text-red-400" : 
                                            insight.id === 2 ? "text-amber-400" : 
                                            insight.id === 3 ? "text-blue-400" : "text-emerald-400"
                                        )}>
                                            <insight.icon size={16} weight="duotone" />
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-neutral-300 group-hover:text-foreground transition-colors">
                                            {insight.text}
                                        </p>
                                    </div>
                                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={10} className="text-muted-foreground" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Secondary Meta Stats */}
                <div className="pt-6 border-t border-neutral-200/10">
                    <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Meta Status</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold px-1">Active Temps</p>
                            <div className="p-2 rounded-lg bg-neutral-100/5 border border-neutral-200/20 text-center">
                                <span className="text-lg font-bold">12</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold px-1">Builders Ready</p>
                            <div className="p-2 rounded-lg bg-neutral-100/5 border border-neutral-200/20 text-center">
                                <span className="text-lg font-bold">48</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Ignition Summary */}
            <div className="p-6 bg-[#0c0c0c] border-t border-neutral-200/20">
                <div className="text-[10px] font-mono-hud text-muted-foreground leading-tight">
                    <p className="mb-2 uppercase tracking-widest text-foreground font-bold">Ready to Ignite?</p>
                    <p>Rent a Temp and start building your product in seconds.</p>
                </div>
            </div>
        </div>
    );
}
