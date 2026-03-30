"use client"
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkle } from '@phosphor-icons/react';
import clsx from 'clsx';


interface Builder {
    id: string;
    name: string;
    role: string;
    level: string;
    capacity: number;
    avatarUrl?: string; // If undefined, it's probably an AI like Sparky
}

interface CampfireGraphProps {
    builders: Builder[];
}

import './CampfireGraph.css';

// Declare custom element for TypeScript awareness in this module
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-player': any;
    }
  }
}

const BuilderItem = React.memo(({ 
    builder, 
    pos, 
    isAI, 
    isActive, 
    onClick 
}: { 
    builder: Builder, 
    pos: { x: number, y: number }, 
    isAI: boolean, 
    isActive: boolean, 
    onClick: () => void 
}) => {
    return (
        <div
            className="absolute gpu-accelerated"
            style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className="counter-orbit group relative">
                <div 
                    className={clsx(
                        "w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#080808] transition-all hover:scale-110 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                        isAI ? "border-emerald-500/50" : "border-neutral-200/20 hover:border-neutral-200/40",
                        isActive && "ring-4 ring-emerald-500/40 scale-110"
                    )}
                    onClick={onClick}
                >
                    {builder.avatarUrl ? (
                        <img 
                            src={builder.avatarUrl} 
                            alt={builder.name} 
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Sparkle size={24} weight="fill" />
                        </div>
                    )}
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col items-center">
                    <div className="bg-[#111] border border-neutral-200/10 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-foreground">{builder.name}</span>
                            {isAI && (
                                <div className="p-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                    <Sparkle size={10} weight="fill" />
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {builder.role} • {builder.capacity}%
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-[#111] border-t border-l border-neutral-200/10 rotate-45 -mt-[22px]" />
                </div>
            </div>
        </div>
    );
});

BuilderItem.displayName = 'BuilderItem';

const DotLottiePlayer = 'dotlottie-player' as any;

export default function CampfireGraph({ builders }: CampfireGraphProps) {
    const RADIUS = 140; // Pixel radius for the circle

    // Load Lottie Library
    React.useEffect(() => {
        const scriptId = 'lottie-player-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
            script.type = "module";
            document.head.appendChild(script);
        }
    }, []);

    const [activeBuilderId, setActiveBuilderId] = useState<string | null>(null);
    const activeBuilder = builders.find(b => b.id === activeBuilderId);

    // Calculate positions for each builder in a circle
    const positions = useMemo(() => {
        return builders.map((_, index) => {
            // Angle in radians. Start from top (-PI/2) and spread evenly.
            const angle = (index / builders.length) * 2 * Math.PI - Math.PI / 2;
            return {
                x: Math.cos(angle) * RADIUS,
                y: Math.sin(angle) * RADIUS,
            };
        });
    }, [builders.length]);

    return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative min-h-[500px]">
            {/* The Central Campfire (Lottie) */}
            <div className="relative z-10 flex items-center justify-center pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute w-[300px] h-[300px] bg-emerald-500/10 blur-[60px] rounded-full"
                />
                
                <div className="relative w-[220px] h-[220px] flex items-center justify-center">
                    <DotLottiePlayer
                        src="https://lottie.host/3a292a9e-fce2-4c61-b0d8-6e1a5e79b116/QGO34aFPrT.json"
                        background="transparent"
                        speed="1"
                        style={{ width: '100%', height: '100%', filter: 'invert(1) brightness(2)' }}
                        direction="1"
                        playMode="normal"
                        loop
                        autoplay
                    ></DotLottiePlayer>
                </div>
            </div>

            {/* Orbiting Builders Container (OPTIMIZED CSS ORBIT) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 orbit-container w-0 h-0">
                {builders.map((builder, index) => {
                    const pos = positions[index];
                    const isAI = builder.level === 'Brain' || !builder.avatarUrl;

                    return (
                        <BuilderItem 
                            key={builder.id}
                            builder={builder}
                            pos={pos}
                            isAI={isAI}
                            isActive={activeBuilderId === builder.id}
                            onClick={() => setActiveBuilderId(activeBuilderId === builder.id ? null : builder.id)}
                        />
                    );
                })}
            </div>

            {/* Builder Detail Panel */}
            {activeBuilder && (
                <div className="absolute bottom-12 right-12 bg-[#0a0a0a]/90 backdrop-blur-xl border border-neutral-200/10 rounded-2xl w-80 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={clsx(
                            "w-12 h-12 rounded-full overflow-hidden border flex items-center justify-center bg-[#080808] flex-shrink-0",
                            activeBuilder.avatarUrl ? "border-neutral-200/20" : "border-emerald-500/50"
                        )}>
                            {activeBuilder.avatarUrl ? (
                                <img src={activeBuilder.avatarUrl} alt={activeBuilder.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <Sparkle size={20} weight="fill" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 border-b border-transparent">
                                <h3 className="text-sm font-bold text-foreground truncate">{activeBuilder.name}</h3>
                                {(!activeBuilder.avatarUrl || activeBuilder.level === 'Brain') && (
                                    <Sparkle size={12} weight="fill" className="text-emerald-400" />
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{activeBuilder.role}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-neutral-200/5">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Base Capacity</span>
                            <span className="text-xs font-bold text-foreground">{activeBuilder.capacity}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Skill Level</span>
                            <span className="text-xs font-bold text-foreground">{activeBuilder.level}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 block">Current Focus</span>
                            <div className="bg-neutral-100/5 px-3 py-2 rounded-lg border border-neutral-200/5 text-xs text-neutral-300 leading-relaxed font-mono">
                                {activeBuilder.id === 'b3' ? 'Generating smart reservation heuristics.' : 'Working on database migrations and setup.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
