"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { User, IdentificationCard, ShieldCheck, Sparkle } from '@phosphor-icons/react';
import clsx from 'clsx';

interface Builder {
    id: string;
    name: string;
    role: string;
    level: string;
    avatarUrl?: string;
    capacity: number; // Percentage of their time dedicated
}

interface BuilderProfilesProps {
    builders: Builder[];
}

export default function BuilderProfiles({ builders }: BuilderProfilesProps) {
    return (
        <div className="bg-[#080808] border border-neutral-200/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-neutral-100/5 text-muted-foreground border border-neutral-200/20">
                        <IdentificationCard size={18} />
                    </div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest">Active Builders</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100/10 border border-neutral-200/20">
                    <span className="text-[10px] font-bold text-foreground">{builders.length}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacity</span>
                </div>
            </div>

            <div className="space-y-4">
                {builders.map((builder, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={builder.id}
                        className="group flex flex-col gap-3 p-4 rounded-xl bg-neutral-100/5 border border-neutral-200/10 hover:border-neutral-200/30 transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-neutral-200/10 flex items-center justify-center border border-neutral-200/20 shrink-0 overflow-hidden relative">
                                {builder.avatarUrl ? (
                                    <img src={builder.avatarUrl} alt={builder.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-muted-foreground" />
                                )}
                                {builder.role === 'AI Agent' && (
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#080808] border border-neutral-200/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <Sparkle size={8} weight="fill" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-xs font-bold text-foreground truncate">{builder.name}</h4>
                                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" weight="fill" />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono-hud uppercase tracking-widest">
                                    <span className={clsx(
                                        builder.role === 'AI Agent' ? "text-purple-400" : "text-blue-400"
                                    )}>{builder.role}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="text-muted-foreground">{builder.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Dedication</span>
                                <span>{builder.capacity}%</span>
                            </div>
                            <div className="h-1 w-full bg-[#080808] rounded-full overflow-hidden border border-neutral-200/10">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${builder.capacity}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                                    className="h-full bg-neutral-400"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <button className="w-full mt-6 py-3 border border-dashed border-neutral-200/30 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-neutral-100/5 hover:border-neutral-200/50 transition-all flex items-center justify-center gap-2">
                <User size={14} />
                Request More Capacity
            </button>
        </div>
    );
}
