"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle, ShoppingCart, Info, Code, Palette, Calendar } from "@phosphor-icons/react";
import clsx from 'clsx';

interface TempMarketCardProps {
    title: string;
    description: string;
    price: number;
    duration: string;
    capacity: number;
    type: 'AI-Heavy' | 'Mobile-Ready' | 'Standard';
    onIgnite?: () => void;
}

export default function TempMarketCard({
    title,
    description,
    price,
    duration,
    capacity,
    type,
    onIgnite
}: TempMarketCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="group relative bg-[#080808] border border-neutral-200/50 rounded-2xl p-6 overflow-hidden transition-all hover:bg-neutral-100/5"
        >
            {/* Header Area */}
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100/10 border border-neutral-200/30 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {type}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-red-400 transition-colors uppercase">{title}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-neutral-100/5 border border-neutral-200/50 flex items-center justify-center">
                    <Sparkle size={20} weight="fill" className="text-foreground" />
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                {description}
            </p>

            {/* Quick Manifest Peek */}
            <div className="flex items-center gap-2 mb-8">
                {[Code, Palette, Calendar, Info].map((Icon, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-neutral-100/5 border border-neutral-200/20 text-muted-foreground hover:text-foreground hover:bg-neutral-100/10 transition-colors cursor-help">
                        <Icon size={14} />
                    </div>
                ))}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-neutral-100/5 p-3 rounded-xl border border-neutral-200/20">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Time</p>
                    <p className="text-sm font-bold text-foreground">{duration}</p>
                </div>
                <div className="bg-neutral-100/5 p-3 rounded-xl border border-neutral-200/20">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Capacity</p>
                    <p className="text-sm font-bold text-foreground">{capacity} Builders</p>
                </div>
            </div>

            {/* Footer / CTA */}
            <div className="flex items-center justify-between mt-auto">
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Rent Fee</p>
                    <p className="text-lg font-bold text-foreground tracking-tighter">${price.toLocaleString()}</p>
                </div>
                <button 
                    onClick={onIgnite}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 text-[#080808] font-bold text-xs uppercase tracking-widest hover:bg-neutral-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <ShoppingCart size={16} weight="bold" />
                    Ignite
                </button>
            </div>
            
            {/* Background Accent Gradient */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] pointer-events-none group-hover:bg-red-500/20 transition-all" />
        </motion.div>
    );
}
