"use client"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fire, GitCommit, Target, BugBeetle, Lightbulb, ChatText, GitMerge, FileDashed } from '@phosphor-icons/react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export interface Flame {
    id: string;
    type: 'commit' | 'milestone' | 'bug' | 'idea' | 'comment' | 'merge';
    message: string;
    timestamp: Date;
    author: string;
    metadata?: string;
}

interface FlameActivityFeedProps {
    flames: Flame[];
    status?: 'burning' | 'settling' | 'ignited';
    onAddFlame?: (message: string) => void;
}

const getIconForType = (type: Flame['type']) => {
    switch (type) {
        case 'commit': return GitCommit;
        case 'milestone': return Target;
        case 'bug': return BugBeetle;
        case 'idea': return Lightbulb;
        case 'comment': return ChatText;
        case 'merge': return GitMerge;
        default: return FileDashed;
    }
};

const getColorForType = (type: Flame['type']) => {
    switch (type) {
        case 'commit': return 'text-neutral-400';
        case 'milestone': return 'text-emerald-400';
        case 'bug': return 'text-red-400';
        case 'idea': return 'text-amber-400';
        case 'comment': return 'text-blue-400';
        case 'merge': return 'text-purple-400';
        default: return 'text-neutral-400';
    }
};

export default function FlameActivityFeed({ flames, status = 'burning', onAddFlame }: FlameActivityFeedProps) {
    const [inputValue, setInputValue] = React.useState('');

    const handleSubmit = () => {
        if (!inputValue.trim()) return;
        if (onAddFlame) onAddFlame(inputValue);
        setInputValue('');
    };
    return (
        <div className="flex flex-col h-full bg-[#080808]/50 border-l border-neutral-200/20 backdrop-blur-xl w-[320px] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-neutral-100/5 border border-neutral-200/20 flex items-center justify-center relative">
                        <Fire size={18} weight={status === 'burning' ? "fill" : "regular"} className={status === 'burning' ? "text-red-500" : "text-neutral-400"} />
                        {status === 'burning' && (
                            <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping opacity-20" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest">Flame Feed</h4>
                        <div className="flex items-center gap-1.5">
                            <div className={clsx(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                status === 'burning' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-neutral-500"
                            )} />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                Live Updates
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed Content */}
            <div className="flex-1 overflow-y-auto p-6 relative no-scrollbar">
                {/* Vertical Timeline Line */}
                <div className="absolute left-8 top-6 bottom-6 w-px bg-neutral-200/10" />

                <div className="space-y-6 relative z-10">
                    <AnimatePresence>
                        {flames.map((flame, i) => {
                            const Icon = getIconForType(flame.type);
                            const iconColor = getColorForType(flame.type);

                            return (
                                <motion.div 
                                    key={flame.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 group"
                                >
                                    {/* Timeline Node */}
                                    <div className="relative mt-1">
                                        <div className="w-5 h-5 rounded-full bg-[#111] border border-neutral-200/20 flex items-center justify-center relative z-10 group-hover:bg-neutral-100/10 transition-colors">
                                            <Icon size={10} weight="bold" className={iconColor} />
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 min-w-0 bg-neutral-100/5 border border-neutral-200/10 rounded-xl p-3 hover:border-neutral-200/30 transition-colors group-hover:bg-neutral-100/10 cursor-pointer">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground truncate max-w-[120px]">
                                                    {flame.author}
                                                </span>
                                                <span className="text-[9px] font-mono-hud text-muted-foreground uppercase tracking-tighter shrink-0">
                                                    {formatDistanceToNow(flame.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                                                {flame.message}
                                            </p>
                                            {flame.metadata && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <div className="px-1.5 py-0.5 rounded text-[8px] font-mono-hud font-bold border border-neutral-200/20 bg-[#080808] text-muted-foreground uppercase tracking-widest">
                                                        {flame.metadata}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input / Filter / Interaction Area Footer */}
            <div className="p-4 bg-[#0c0c0c] border-t border-neutral-200/20">
                <div className="flex items-center gap-2">
                    <input 
                        className="flex-1 bg-neutral-100/5 border border-neutral-200/20 rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-neutral-200/50 transition-colors"
                        placeholder="Add flame or comment..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                        className="p-2 bg-neutral-100/10 hover:bg-neutral-100/20 text-foreground border border-neutral-200/30 rounded-lg transition-colors disabled:opacity-30"
                    >
                        <Fire size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
