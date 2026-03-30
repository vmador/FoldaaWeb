"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Tent, Flame, Users, Clock, ChartLineUp } from "@phosphor-icons/react";
import clsx from 'clsx';

interface TentStatusCardProps {
    name: string;
    weeksTotal: number;
    weekCurrent: number;
    buildersActive: number;
    lastFlame: string;
    status: 'burning' | 'settling' | 'ignited';
    onClick?: () => void;
}

export default function TentStatusCard({
    name,
    weeksTotal,
    weekCurrent,
    buildersActive,
    lastFlame,
    status,
    onClick
}: TentStatusCardProps) {
    const progress = (weekCurrent / weeksTotal) * 100;

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            onClick={onClick}
            className={clsx(
                "group relative bg-[#080808] border border-neutral-200/50 rounded-2xl p-5 overflow-hidden transition-all hover:bg-neutral-100/5",
                onClick && "cursor-pointer"
            )}
        >
            {/* Background Glow */}
            <div className={clsx(
                "absolute -top-12 -right-12 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40",
                status === 'burning' ? "bg-red-500" : "bg-neutral-100"
            )} />

            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100/5 border border-neutral-200/50 flex items-center justify-center">
                        <Tent size={20} weight="duotone" className="text-foreground" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-foreground">{name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono-hud tracking-tighter">
                            Active Tent
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100/5 border border-neutral-200/50">
                    <div className={clsx(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        status === 'burning' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-neutral-400"
                    )} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {status}
                    </span>
                </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">Week {weekCurrent} of {weeksTotal}</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100/5 rounded-full overflow-hidden border border-neutral-200/20">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-foreground rounded-full"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-neutral-200/20">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold">
                        <Users size={12} /> Capacity
                    </div>
                    <p className="text-xs font-bold">{buildersActive} Builders</p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold">
                        <Flame size={12} /> Last Flame
                    </div>
                    <p className="text-xs font-bold truncate">{lastFlame}</p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between mt-4 overflow-hidden">
                <div className="flex items-center gap-2">
                    <div className="h-6 px-2 rounded-md bg-neutral-100/5 border border-neutral-200/50 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-100/10 transition-colors">
                        <ChartLineUp size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
                    </div>
                </div>
                <div className="flex -space-x-1.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-[#080808] bg-neutral-200 flex items-center justify-center text-[8px] font-bold text-black uppercase">
                            B{i}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
