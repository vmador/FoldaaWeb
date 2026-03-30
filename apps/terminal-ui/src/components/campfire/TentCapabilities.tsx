"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Code, Database, Cpu, Palette, 
    CheckCircle, Flame, Lightning, Sparkle,
    CaretRight
} from '@phosphor-icons/react';
import clsx from 'clsx';

interface Builder {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
}

interface Capability {
    id: string;
    name: string;
    category: 'Frontend' | 'Backend' | 'AI' | 'Design';
    status: 'ignited' | 'burning' | 'stable';
    progress: number;
    builders: string[]; // IDs of builders
}

interface TentCapabilitiesProps {
    builders: Builder[];
}

const MOCK_CAPABILITIES: Capability[] = [
    { id: 'nextjs', name: 'Next.js 15', category: 'Frontend', status: 'stable', progress: 100, builders: ['b1', 'b2'] },
    { id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend', status: 'stable', progress: 100, builders: ['b2'] },
    { id: 'framer', name: 'Framer Motion', category: 'Frontend', status: 'burning', progress: 65, builders: ['b2'] },
    
    { id: 'supabase', name: 'Supabase Auth/DB', category: 'Backend', status: 'stable', progress: 90, builders: ['b2', 'b3'] },
    { id: 'edge-fx', name: 'Edge Functions', category: 'Backend', status: 'burning', progress: 40, builders: ['b2'] },
    
    { id: 'gpt4', name: 'GPT-4o-mini', category: 'AI', status: 'burning', progress: 75, builders: ['b3', 'b1'] },
    { id: 'langchain', name: 'LangChain.js', category: 'AI', status: 'ignited', progress: 20, builders: ['b3'] },
    
    { id: 'figma', name: 'Figma System', category: 'Design', status: 'stable', progress: 100, builders: ['b1'] },
];

export default function TentCapabilities({ builders }: TentCapabilitiesProps) {
    const categories = ['Frontend', 'Backend', 'AI', 'Design'] as const;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="flex flex-col gap-12">
                
                {/* Header Info */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Tent Capabilities</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                        Visualizing the technical core of the project. Each capability represents a critical technology or skill being deployed by the builders.
                    </p>
                </div>

                {/* Categorized Grid */}
                {categories.map((cat) => (
                    <div key={cat} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-neutral-100/5 border border-neutral-200/10 text-muted-foreground">
                                {cat === 'Frontend' && <Code size={20} />}
                                {cat === 'Backend' && <Database size={20} />}
                                {cat === 'AI' && <Cpu size={20} />}
                                {cat === 'Design' && <Palette size={20} />}
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">{cat}</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-neutral-200/10 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MOCK_CAPABILITIES.filter(c => c.category === cat).map((cap, idx) => {
                                const capBuilders = builders.filter(b => cap.builders.includes(b.id));
                                
                                return (
                                    <motion.div
                                        key={cap.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative bg-[#080808]/50 border border-neutral-200/5 hover:border-neutral-200/20 rounded-2xl p-5 transition-all hover:scale-[1.02] hover:bg-[#0a0a0a]"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">{cap.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className={clsx(
                                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] uppercase font-bold tracking-widest border",
                                                        cap.status === 'stable' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                        cap.status === 'burning' && "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
                                                        cap.status === 'ignited' && "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                    )}>
                                                        {cap.status === 'stable' && <CheckCircle size={10} weight="fill" />}
                                                        {cap.status === 'burning' && <Flame size={10} weight="fill" className="animate-pulse" />}
                                                        {cap.status === 'ignited' && <Sparkle size={10} weight="fill" />}
                                                        {cap.status}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Builder Avatars */}
                                            <div className="flex -space-x-2">
                                                {capBuilders.map((b) => (
                                                    <div 
                                                        key={b.id} 
                                                        className="w-7 h-7 rounded-full border-2 border-[#080808] bg-neutral-800 overflow-hidden"
                                                        title={b.name}
                                                    >
                                                        {b.avatarUrl ? (
                                                            <img src={b.avatarUrl} alt={b.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                                                                {b.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                                <span>Completion</span>
                                                <span>{cap.progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-neutral-100/5 rounded-full overflow-hidden border border-neutral-200/10">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cap.progress}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={clsx(
                                                        "h-full rounded-full transition-colors",
                                                        cap.status === 'stable' ? "bg-emerald-500/50" : "bg-neutral-500"
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* View SoT Link */}
                                        <div className="mt-4 pt-4 border-t border-neutral-200/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-muted-foreground font-medium">View Manifest</span>
                                            <CaretRight size={12} className="text-muted-foreground" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="pb-20" />
            </div>
        </div>
    );
}
